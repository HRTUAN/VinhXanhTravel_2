
import { UserData, RegisterResponse, SpinResponse, SetupData, CheckPrizeResponse, SecretSheetData } from '../types';

// Thông tin cấu hình, tuantq.utc@gmail
const API_KEY = 'AIzaSyBWQxxRJl0Vz9pX0pmbqeELL_tzeSABf7g';
const SPREADSHEET_ID = '1azFGJBSacPEhZk_kf5-PIxLnSpPs38PKZTYpkiius88';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbIKPqi4H9nPDj4nCyrySz-AOGw_gUTHJepi2d29Jfz7O5KeUUSGtHkDrp8uG89-Nm/exec';

/**
 * Hàm gọi Apps Script (Ưu tiên proxy server-side để tránh lỗi CORS/Iframe, có fallback trực tiếp)
 */
async function callAppsScript(action: string, payload: any) {
  // 1. Thử gọi qua backend proxy server-side (tránh lỗi Failed to fetch do CORS / iframe redirect)
  try {
    const proxyResponse = await fetch(`/api/apps-script?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const text = await proxyResponse.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object') {
          return json;
        }
      } catch {
        console.warn("[API Proxy] Phản hồi không phải JSON:", text.slice(0, 100));
      }
    }

    if (!proxyResponse.ok) {
      return {
        status: 'error',
        message: `Máy chủ phản hồi mã lỗi (${proxyResponse.status}). Vui lòng thử lại!`
      };
    }
  } catch (proxyErr) {
    console.warn("[API] Proxy endpoint không phản hồi, thử gọi trực tiếp Apps Script:", proxyErr);
  }

  // 2. Fallback gọi trực tiếp Apps Script nếu proxy không khả dụng
  const url = `${SCRIPT_URL}?action=${action}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!text) {
      return { status: 'error', message: 'Không nhận được phản hồi từ máy chủ' };
    }
    
    try {
      return JSON.parse(text);
    } catch {
      console.warn("[API] Phản hồi trực tiếp không phải JSON:", text.slice(0, 100));
      return {
        status: 'error',
        message: 'Dữ liệu phản hồi từ máy chủ không hợp lệ'
      };
    }
  } catch (error: any) {
    console.error(`[API] Lỗi khi gọi action ${action}:`, error);
    return {
      status: 'error',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng!'
    };
  }
}

/**
 * Helper to parse a secret sheet (A1:C1 percentages, Row 2+ prizes)
 */
function parseSecretSheet(values: any[][]): SecretSheetData {
  if (!values || values.length === 0) return { percentages: [0, 0, 0], prizes: [[], [], []] };
  
  const percentages = values[0].map(v => Number(v) || 0);
  const prizes: string[][] = [[], [], []];
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0]) prizes[0].push(row[0]);
    if (row[1]) prizes[1].push(row[1]);
    if (row[2]) prizes[2].push(row[2]);
  }
  
  return { percentages, prizes };
}

/**
 * Lấy danh sách địa điểm và giải thưởng từ sheet SETUP
 */
export const getSetupData = async (): Promise<SetupData> => {
  // Thử lấy qua server proxy trước
  try {
    const proxyRes = await fetch('/api/setup');
    if (proxyRes.ok) {
      const { setupData, w100Data, w40Data, w30Data, w20Data } = await proxyRes.json();
      const setupValues = setupData?.values || [];
      const locations = setupValues.map((r: any[]) => r[0]).filter(Boolean);
      const prizes = setupValues.map((r: any[]) => r[1]).filter(Boolean);
      const prizesDetails = setupValues.map((r: any[]) => r[3]).filter(Boolean);
      const messages = setupValues.map((r: any[]) => r[4]).filter(Boolean);
      
      const forceSecretRaw = setupValues[0]?.[5];
      const forceSecret = forceSecretRaw?.toLowerCase().trim() === 'yes';

      return {
        locations,
        prizes,
        prizesDetails,
        messages,
        forceSecret,
        secretPrizes: {
          win100: parseSecretSheet(w100Data?.values),
          win40: parseSecretSheet(w40Data?.values),
          win30: parseSecretSheet(w30Data?.values),
          win20: parseSecretSheet(w20Data?.values)
        }
      };
    }
  } catch (err) {
    console.warn('[API] Lỗi khi gọi proxy /api/setup, chuyển sang gọi trực tiếp Google Sheets:', err);
  }

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

    const setupValues = setupData.values || [];
    const locations = setupValues.map((r: any[]) => r[0]).filter(Boolean);
    const prizes = setupValues.map((r: any[]) => r[1]).filter(Boolean);
    const prizesDetails = setupValues.map((r: any[]) => r[3]).filter(Boolean);
    const messages = setupValues.map((r: any[]) => r[4]).filter(Boolean);
    
    const forceSecretRaw = setupValues[0]?.[5];
    const forceSecret = forceSecretRaw?.toLowerCase().trim() === 'yes';

    return {
      locations,
      prizes,
      prizesDetails,
      messages,
      forceSecret,
      secretPrizes: {
        win100: parseSecretSheet(w100Data.values),
        win40: parseSecretSheet(w40Data.values),
        win30: parseSecretSheet(w30Data.values),
        win20: parseSecretSheet(w20Data.values)
      }
    };
  } catch (e) {
    console.error("Lỗi fetch setup:", e);
    const emptySecret = { percentages: [], prizes: [] };
    return { 
      locations: ['Phú Quốc', 'Đà Lạt', 'Đà Nẵng'],
      prizes: ['Quà 1', 'Quà 2'],
      prizesDetails: ['Chi tiết quà 1', 'Chi tiết quà 2'],
      messages: ['Chúc bạn một chuyến đi vui vẻ!'],
      forceSecret: false,
      secretPrizes: {
        win100: emptySecret, win40: emptySecret, win30: emptySecret, win20: emptySecret
      }
    };
  }
};

/**
 * Đăng ký người dùng
 */
export const registerUser = async (formData: UserData): Promise<RegisterResponse> => {
  try {
    const result = await callAppsScript('register', {
      name: formData.name.trim(),
      phone: formData.phone.trim().replace(/\s/g, ''),
      location: formData.location,
      date: formData.date,
      returnDate: formData.returnDate,
      pax: Number(formData.pax) || 1,
      code_booking: formData.code_booking?.trim() || ''
    });

    return result as RegisterResponse;
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    return {
      status: "error",
      message: "Không thể kết nối máy chủ. Vui lòng thử lại!"
    };
  }
};

/**
 * Quay thưởng
 */
export const spinWheel = async (userId: string, currentTurns: number, prizeName: string): Promise<SpinResponse> => {
  try {
    const result = await callAppsScript('spin', { userId, prize: prizeName });
    return result as SpinResponse;
  } catch (err) {
    console.error("Lỗi quay thưởng:", err);
    return {
      result: "error",
      remaining: 0,
      message: "Đã có lỗi xảy ra. Vui lòng liên hệ hỗ trợ!"
    };
  }
};

/**
 * Cập nhật tên giải thưởng cụ thể (cho quà Bí Mật)
 */
export const recordSecretPrize = async (userId: string, prizeName: string): Promise<{ status: string }> => {
  try {
    const result = await callAppsScript('updateSecretPrize', { userId, prize: prizeName });
    return result;
  } catch (err) {
    console.error("Lỗi cập nhật giải bí mật:", err);
    throw err;
  }
};

/**
 * Cập nhật lượt (khi trúng thêm lượt)
 */
export const updateUserTurns = async (userId: string, amount: number): Promise<{ status: string, remaining: number }> => {
  try {
    const result = await callAppsScript('addTurns', { userId, amount });
    return result;
  } catch (err) {
    console.error("Lỗi cập nhật lượt:", err);
    throw err;
  }
};

/**
 * Kiểm tra giải thưởng theo số điện thoại
 */
export const checkPrize = async (phone: string): Promise<CheckPrizeResponse> => {
  try {
    const result = await callAppsScript('checkPrize', { phone });
    return result as CheckPrizeResponse;
  } catch (err) {
    console.error("Lỗi kiểm tra giải thưởng:", err);
    return {
      status: "error",
      message: "Không thể kết nối máy chủ để kiểm tra giải thưởng!"
    };
  }
};
