
import React, { useState, useEffect } from 'react';

interface Props {
  onSpin: (prizeName: string) => Promise<{ result: 'win' | 'lose'; message: string }>;
  turnsLeft: number;
  onFinish?: () => void;
  prizeList: string[];
  prizesDetails: string[]; // Cột D
  messages: string[]; // Cột E
}

const LuckyRedEnvelope: React.FC<Props> = ({ onSpin, turnsLeft, onFinish, prizeList, prizesDetails, messages }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [modal, setModal] = useState<{ 
    show: boolean; 
    win: boolean; 
    displayMessage: string; 
    displayPrize: string;
    vinhXanhMessage: string;
  }>({
    show: false,
    win: false,
    displayMessage: '',
    displayPrize: '',
    vinhXanhMessage: ''
  });

  const handleOpenEnvelope = async () => {
    if (isOpening || turnsLeft <= 0 || modal.show) return;

    setIsShaking(true);
    
    try {
      // Tìm các giải trúng (loại bỏ lời chúc may mắn)
      const winPrizes = prizeList.filter(p => !['Chúc may mắn', 'Thử lại nhé'].includes(p));
      const potentialPrize = winPrizes.length > 0 
        ? winPrizes[Math.floor(Math.random() * winPrizes.length)] 
        : "Quà tặng bí mật";

      // Bắt đầu gọi API
      const spinPromise = onSpin(potentialPrize);
      
      const [response] = await Promise.all([
        spinPromise,
        new Promise(resolve => setTimeout(resolve, 1200))
      ]);

      setIsShaking(false);
      setIsOpening(true);

      // Chọn thông điệp và quà ngẫu nhiên từ sheet SETUP nếu không có từ server
      const randomVXMessage = messages.length > 0 
        ? messages[Math.floor(Math.random() * messages.length)] 
        : "Chúc bạn một chuyến hành trình đầy ý nghĩa!";
      
      const randomPrizeDetail = prizesDetails.length > 0
        ? prizesDetails[Math.floor(Math.random() * prizesDetails.length)]
        : response.message;

      setTimeout(() => {
        setShowBurst(true);
      }, 400);

      setTimeout(() => {
        setModal({
          show: true,
          win: response.result === 'win',
          displayMessage: response.message,
          displayPrize: response.result === 'win' ? randomPrizeDetail : 'Chúc bạn may mắn lần sau!',
          vinhXanhMessage: randomVXMessage
        });
        setIsOpening(false);
        setShowBurst(false);
      }, 1500);

    } catch (error) {
      setIsShaking(false);
      setIsOpening(false);
      console.error("Lỗi mở lì xì:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const handleCloseModal = () => {
    setModal({ ...modal, show: false });
    if (turnsLeft === 0 && onFinish) {
      onFinish();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] w-full max-w-lg mx-auto p-4 relative">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg) scale(1.05); }
          25% { transform: rotate(-3deg) scale(1.05); }
          75% { transform: rotate(3deg) scale(1.05); }
        }
        @keyframes burst {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes particle-fly {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)); opacity: 0; }
        }
        .animate-shake { animation: shake 0.15s ease-in-out infinite; }
        .animate-burst { animation: burst 0.8s ease-out forwards; }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>

      <div 
        className={`relative perspective-1000 group cursor-pointer mb-12 ${isShaking ? 'animate-shake' : ''}`} 
        onClick={handleOpenEnvelope}
      >
        <div className={`absolute inset-0 bg-red-500/40 blur-[80px] rounded-full transition-all duration-700 ${isShaking || isOpening ? 'scale-150 opacity-100' : 'scale-100 opacity-20 group-hover:opacity-60'}`}></div>
        
        <div className={`relative w-60 h-96 md:w-64 md:h-96 preserve-3d transition-transform duration-700 ${isOpening ? '-translate-y-20' : 'hover:-translate-y-4'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl shadow-2xl border-4 border-yellow-500/30 overflow-hidden z-10">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gold 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20">
               <div className={`w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.3),0_10px_20px_rgba(0,0,0,0.2)] border-4 border-yellow-600 transition-all duration-500 ${isOpening ? 'scale-0 opacity-0' : 'group-hover:scale-110'}`}>
                  <span className="text-red-700 font-black text-4xl select-none">Lộc</span>
               </div>
               <div className={`text-yellow-400 text-center transition-opacity duration-300 ${isOpening ? 'opacity-0' : 'opacity-100'}`}>
                  <p className="font-black text-[0.6rem] uppercase tracking-[0.4em]">Lì Xì May Mắn</p>
               </div>
            </div>

            <div className={`absolute bottom-8 left-0 w-full text-center transition-opacity duration-300 ${isOpening ? 'opacity-0' : 'opacity-60'}`}>
               <p className="text-yellow-500 font-bold text-[0.5rem] uppercase tracking-widest">Vịnh Xanh Travel</p>
            </div>
          </div>

          <div 
            className={`absolute top-0 left-0 w-full h-1/4 bg-red-700 rounded-t-3xl border-x-4 border-t-4 border-yellow-500/30 z-30 transition-all duration-500 origin-top`}
            style={{ 
              transform: isOpening ? 'rotateX(160deg)' : 'rotateX(0deg)',
              boxShadow: isOpening ? 'none' : '0 10px 20px rgba(0,0,0,0.2)'
            }}
          >
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full border-2 border-yellow-600 flex items-center justify-center shadow-md">
               <div className="w-1 h-4 bg-yellow-700 rounded-full"></div>
            </div>
          </div>

          <div 
            className={`absolute top-4 left-4 right-4 h-[90%] bg-white rounded-2xl shadow-lg z-0 transition-all duration-1000 flex flex-col items-center justify-center p-6`}
            style={{ 
              transform: isOpening ? 'translateY(-60%) scale(1)' : 'translateY(0) scale(0.9)',
              opacity: isOpening ? 1 : 0
            }}
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full mb-4"></div>
            <div className="text-center">
              <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-2">Đang lấy quà...</p>
              <div className="flex gap-1 justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {showBurst && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="animate-burst w-12 h-12 bg-yellow-400/50 rounded-full blur-xl"></div>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const dist = 150 + Math.random() * 50;
              const tx = Math.cos(angle) * dist;
              const ty = Math.sin(angle) * dist;
              const rot = Math.random() * 360;
              return (
                <div 
                  key={i}
                  className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-500 rounded-sm"
                  style={{ 
                    '--tw-translate-x': `${tx}px`, 
                    '--tw-translate-y': `${ty}px`,
                    '--tw-rotate': `${rot}deg`,
                    animation: 'particle-fly 0.8s ease-out forwards'
                  } as React.CSSProperties}
                ></div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center space-y-6 relative z-10">
        <div className="flex flex-col items-center gap-1">
          <span className="text-slate-400 text-[0.65rem] font-black uppercase tracking-widest">Cơ hội của bạn</span>
          <div className="px-6 py-2 bg-white text-red-600 rounded-full font-black text-lg shadow-sm border border-slate-100 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-red-500 ${isShaking ? 'animate-ping' : 'animate-pulse'}`}></span>
            {turnsLeft} LƯỢT MỞ
          </div>
        </div>

        {!isShaking && !isOpening && turnsLeft > 0 && (
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-bounce">
             Chạm vào bao lì xì để nhận lộc!
          </p>
        )}
        
        {isShaking && (
          <p className="text-red-500 font-black text-sm uppercase tracking-[0.2em] animate-pulse">
            Hồi hộp quá...
          </p>
        )}
      </div>

      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-md animate-in zoom-in slide-in-from-top-10 duration-500 ease-out">
            <div className="bg-[#fef9f3] rounded-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden relative border-8 border-white">
              <div className="p-6 md:p-8 flex justify-between items-start border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 uppercase leading-none">Bưu Thiếp</h3>
                  <p className="text-blue-500 font-bold text-[0.6rem] uppercase tracking-widest">Ký ức Vịnh Xanh Travel</p>
                </div>
                <div className="w-16 h-20 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 font-black text-[0.5rem] text-center p-1 rounded-lg">
                  <div className="w-8 h-8 bg-blue-50 rounded-full mb-1 flex items-center justify-center">
                    <span className="text-blue-200">✈️</span>
                  </div>
                  STAMP
                </div>
              </div>

              <div className="px-6 md:px-8 pb-8 pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-slate-400 font-bold text-[0.6rem] uppercase tracking-[0.2em]">Thông điệp từ Vịnh Xanh:</p>
                    <p className="text-slate-800 font-bold text-lg leading-snug">
                      {modal.vinhXanhMessage}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl transition-all duration-700 ${modal.win ? 'bg-orange-50 border-2 border-orange-200 shadow-inner' : 'bg-slate-50 border-2 border-slate-200'}`}>
                    <p className={`text-xs font-black mb-1 uppercase tracking-widest ${modal.win ? 'text-orange-600' : 'text-slate-500'}`}>
                      {modal.win ? 'Phần quà của bạn:' : 'Lời nhắn:'}
                    </p>
                    <p className={`text-2xl md:text-3xl font-black leading-tight ${modal.win ? 'text-orange-700 animate-in fade-in slide-in-from-left-4 duration-1000' : 'text-slate-800'}`}>
                      {modal.displayPrize}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center">
                   <button
                    onClick={handleCloseModal}
                    className={`w-full py-4 text-white font-black rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest ${turnsLeft > 0 ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                  >
                    {turnsLeft > 0 ? 'Tiếp tục mở lộc' : 'Hoàn thành'}
                  </button>
                </div>
              </div>
              
              <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-white to-red-500"></div>
            </div>
            
            {modal.win && (
              <div className="absolute inset-0 pointer-events-none">
                 {[...Array(24)].map((_, i) => (
                   <div 
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                    style={{ 
                      top: `${Math.random() * 100}%`, 
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      opacity: 0.6
                    }}
                   ></div>
                 ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyRedEnvelope;
