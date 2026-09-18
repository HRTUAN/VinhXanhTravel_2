import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzwS_z715hZVVeojRG4MwcLBmd5V6u1aLTB_fBiurW-xv1kcTTexbbnxCqzD7ha5l2Cbg/exec';
const SPREADSHEET_ID = '1nyJOrhEA_ZIOrBf_yi5860agM0IE45-b1gVK6sFaiwQ';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || 'AIzaSyBXjkOAtcwi5KbV9Rvvu6ErTgKV7U8PZsc';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Proxy to Google Apps Script (avoids browser CORS/iframe redirect issues)
  app.post('/api/apps-script', async (req, res) => {
    const action = (req.query.action as string) || 'register';
    const targetUrl = `${SCRIPT_URL}?action=${encodeURIComponent(action)}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        console.warn(`[Server Proxy] Non-JSON response for ${action}:`, text.slice(0, 150));
        res.status(200).json({
          status: 'error',
          message: text.includes('Page not found')
            ? 'Địa chỉ Google Apps Script chưa chính xác hoặc chưa được cấp quyền truy cập công khai.'
            : 'Phản hồi không hợp lệ từ máy chủ Google Apps Script'
        });
      }
    } catch (err: any) {
      console.error(`[Server Proxy] Error forwarding action ${action}:`, err);
      res.status(200).json({
        status: 'error',
        message: err.name === 'AbortError'
          ? 'Quá thời gian kết nối tới máy chủ Google (timeout). Vui lòng thử lại.'
          : (err.message || 'Lỗi kết nối máy chủ')
      });
    }
  });

  // Proxy for setup sheets data
  app.get('/api/setup', async (req, res) => {
    try {
      const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values`;
      const [setupRes, w100Res, w40Res, w30Res, w20Res] = await Promise.all([
        fetch(`${baseUrl}/SETUP!A2:F?key=${API_KEY}`),
        fetch(`${baseUrl}/win-100!A1:C?key=${API_KEY}`),
        fetch(`${baseUrl}/win-40!A1:C?key=${API_KEY}`),
        fetch(`${baseUrl}/win-30!A1:C?key=${API_KEY}`),
        fetch(`${baseUrl}/win-20!A1:C?key=${API_KEY}`)
      ]);

      const [setupData, w100Data, w40Data, w30Data, w20Data] = await Promise.all([
        setupRes.json(),
        w100Res.json(),
        w40Res.json(),
        w30Res.json(),
        w20Res.json()
      ]);

      res.json({
        setupData,
        w100Data,
        w40Data,
        w30Data,
        w20Data
      });
    } catch (err: any) {
      console.error('[Server] Error fetching setup sheets:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
