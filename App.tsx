
import React, { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import LuckyWheel from './components/LuckyWheel/index';
import LuckyRedEnvelope from './components/LuckyRedEnvelope';
import { AppStep, UserData, RegisterResponse, SpinResponse, SetupData } from './types';
import { registerUser, spinWheel, getSetupData, recordSecretPrize } from './services/api';

// CHẾ ĐỘ MÔI TRƯỜNG: 'dev' để hiện nút chơi thử, 'prod' để chạy thực tế
const APP_ENV: string = 'prod';

// Biến toàn cục quyết định chế độ chơi
const GAME_MODE = 'lucky_wheel' as 'lucky_wheel' | 'lucky_red_envelope';

const App: React.FC = () => {
  const getInitialUserId = () => {
    try { return localStorage.getItem('userId'); } catch (e) { return null; }
  };
  const getInitialTurns = () => {
    try { return Number(localStorage.getItem('turns')) || 0; } catch (e) { return 0; }
  };
  const getInitialPax = () => {
    try { return Number(localStorage.getItem('pax')) || 1; } catch (e) { return 1; }
  };

  const [step, setStep] = useState<AppStep>(AppStep.FORM);
  const [userId, setUserId] = useState<string | null>(getInitialUserId());
  const [turns, setTurns] = useState<number>(getInitialTurns());
  const [pax, setPax] = useState<number>(getInitialPax());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  
  const [prizeList, setPrizeList] = useState<string[]>([]);
  const [prizesDetails, setPrizesDetails] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [forceSecret, setForceSecret] = useState<boolean>(false);
  const [secretPrizes, setSecretPrizes] = useState<SetupData['secretPrizes'] | null>(null);

  useEffect(() => {
    if (userId && turns > 0 && step === AppStep.FORM) {
      setStep(AppStep.WHEEL);
    }
    
    const loadSetup = async () => {
      const data = await getSetupData();
      if (data.prizes) setPrizeList(data.prizes);
      if (data.prizesDetails) setPrizesDetails(data.prizesDetails);
      if (data.messages) setMessages(data.messages);
      if (data.secretPrizes) setSecretPrizes(data.secretPrizes);
      setForceSecret(data.forceSecret);
    };
    loadSetup();
  }, []);

  const handleRegister = async (data: UserData) => {
    setIsLoading(true);
    setErrorMsg(undefined);
    
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('turns');
      localStorage.removeItem('pax');
    } catch (e) {}
    
    setUserId(null);
    setTurns(0);

    try {
      const response: RegisterResponse = await registerUser(data);
      
      if (response.status === "ok" && response.userId) {
        const userTurns = response.turns || 2;
        try {
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('turns', String(userTurns));
          localStorage.setItem('pax', String(data.pax));
        } catch (e) {}
        setUserId(response.userId);
        setTurns(userTurns);
        setPax(data.pax);
        setStep(AppStep.WHEEL);
      } else if (response.status === "exists") {
        setErrorMsg(response.message || "Số điện thoại này đã tham gia chương trình rồi!");
        setStep(AppStep.FORM);
      } else {
        setErrorMsg(response.message || "Đã có lỗi xảy ra. Thử lại sau nhé!");
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevPlay = () => {
    const devUserId = "DEV_USER_" + Math.floor(Math.random() * 1000);
    const devTurns = 99;
    const devPax = 45; 
    
    setUserId(devUserId);
    setTurns(devTurns);
    setPax(devPax);
    setStep(AppStep.WHEEL);
    
    try {
      localStorage.setItem('userId', devUserId);
      localStorage.setItem('turns', String(devTurns));
      localStorage.setItem('pax', String(devPax));
    } catch (e) {}
  };

  const isExtraTurnPrize = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('thêm lượt') || lower.includes('+1 lượt') || lower.includes('+ 1 lượt') || lower.includes('thêm 1 lượt');
  };

  const handleSpin = async (prizeName: string): Promise<{ result: 'win' | 'lose'; message: string }> => {
    if (!userId) throw new Error("Missing User ID");
    
    if (userId.startsWith("DEV_USER")) {
      const isWin = Math.random() > 0.3;
      const winsExtra = isWin && isExtraTurnPrize(prizeName);
      const newTurns = winsExtra ? turns : turns - 1;
      setTurns(newTurns);
      localStorage.setItem('turns', String(newTurns));
      
      return {
        result: isWin ? 'win' : 'lose',
        message: isWin ? `Chúc mừng! Bạn nhận được ${prizeName}` : "Tiếc quá, hãy thử lại ở bao khác nhé!"
      };
    }

    try {
      // Gọi API Spin - Server sẽ tự tính toán cộng/trừ lượt dựa trên prizeName và tỉ lệ
      const response: SpinResponse = await spinWheel(userId, turns, prizeName);
      if (response.result === "error") throw new Error(response.message);

      // Cập nhật số lượt TRỰC TIẾP từ server trả về
      const finalRemaining = response.remaining ?? 0;
      setTurns(finalRemaining);
      localStorage.setItem('turns', String(finalRemaining));
      
      // Map kết quả: win hoặc extra_turn đều coi là 'win' để LuckyWheel dừng ở ô quà
      // Fix: response.result === "extra_turn" is now valid as the type is included in SpinResponse
      const isWinResult = response.result === "win" || response.result === "extra_turn";
      
      return {
        result: isWinResult ? 'win' : 'lose',
        message: response.message
      };
    } catch (err) {
      console.error("Lỗi khi quay:", err);
      throw err;
    }
  };

  const handleUpdateSecretPrize = async (prizeName: string) => {
    if (!userId || userId.startsWith("DEV_USER")) return;
    try {
      await recordSecretPrize(userId, prizeName);
    } catch (err) {
      console.error("Lỗi đồng bộ quà bí mật:", err);
    }
  };

  const resetGame = () => {
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('turns');
      localStorage.removeItem('pax');
    } catch (e) {}
    setUserId(null);
    setTurns(0);
    setPax(1);
    setErrorMsg(undefined);
    setStep(AppStep.FORM);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-[8px] overflow-hidden shadow-lg shadow-blue-200 border-2 border-white bg-white">
            <img 
              src="https://res.cloudinary.com/dzkjongnl/image/upload/v1770178187/yikxk5ocaqvubcvom4jq.webp" 
              alt="Logo Vịnh Xanh" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-extrabold text-slate-800 text-xl tracking-tight uppercase">Vịnh Xanh Game</span>
        </div>
        {step === AppStep.WHEEL && (
          <button 
            onClick={resetGame}
            className="text-[0.6rem] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
          >
            Đăng ký mới
          </button>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 -z-10"></div>

        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {step === AppStep.FORM ? (
            <div className="flex justify-center">
              <RegistrationForm 
                onSubmit={handleRegister} 
                isLoading={isLoading} 
                serverError={errorMsg}
                onDevPlay={APP_ENV === 'dev' ? handleDevPlay : undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 text-center">
                {GAME_MODE === 'lucky_wheel' ? 'Sẵn sàng chưa?' : 'Khai xuân đón lộc!'}
              </h1>
              <p className="text-slate-500 font-semibold mb-8 text-center max-w-md text-sm">
                Bạn đang có <span className="text-blue-600 font-black">{turns}</span> lượt {GAME_MODE === 'lucky_wheel' ? 'quay may mắn' : 'mở lì xì'} từ Vịnh Xanh Travel.
              </p>
              
              {GAME_MODE === 'lucky_wheel' ? (
                <LuckyWheel 
                  onSpin={handleSpin} 
                  onUpdateSecretPrize={handleUpdateSecretPrize}
                  turnsLeft={turns} 
                  onFinish={resetGame} 
                  prizeList={prizeList}
                  secretPrizes={secretPrizes || { win100: { percentages: [], prizes: [] }, win40: { percentages: [], prizes: [] }, win30: { percentages: [], prizes: [] }, win20: { percentages: [], prizes: [] } }}
                  pax={pax}
                  forceSecret={forceSecret}
                />
              ) : (
                <LuckyRedEnvelope 
                  onSpin={handleSpin} 
                  turnsLeft={turns} 
                  onFinish={resetGame} 
                  prizeList={prizeList} 
                  prizesDetails={prizesDetails}
                  messages={messages}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-[0.6rem] font-black uppercase tracking-[0.12em]">
        © {new Date().getFullYear()} VỊNH XANH TRAVEL • KÝ ỨC TRÊN MỖI CHUYẾN ĐI
      </footer>
    </div>
  );
};

export default App;