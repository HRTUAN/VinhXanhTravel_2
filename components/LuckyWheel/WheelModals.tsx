
import React from 'react';

export interface WheelModalState {
  show: boolean;
  win: boolean;
  message: string;
  isSecretReveal?: boolean;
  secretContent?: string;
}

interface Props {
  modal: WheelModalState;
  isRevealingSecret: boolean;
  turnsLeft: number;
  onClose: () => void;
}

const WheelModals: React.FC<Props> = ({ modal, isRevealingSecret, turnsLeft, onClose }) => {
  return (
    <>
      {/* Hiệu ứng mờ ảo khi mở quà bí mật */}
      {isRevealingSecret && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[60] flex items-center justify-center p-4 transition-all duration-500">
          <div className="text-center animate-bounce">
            <div className="text-[10rem] mb-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">🎁</div>
            <h2 className="text-white text-xl font-black uppercase animate-pulse text-center">
              Đang giải mã phần quà bí mật...
            </h2>
          </div>
        </div>
      )}

      {/* Modal kết quả */}
      {modal.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className={`bg-white rounded-[3rem] p-12 max-w-md w-full text-center shadow-[0_35px_70px_-15px_rgba(0,0,0,0.6)] transform animate-in fade-in zoom-in duration-500 relative ${modal.isSecretReveal ? 'ring-8 ring-amber-400/30' : ''}`}>
            
            {modal.isSecretReveal && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-8xl animate-pulse">✨</div>
            )}

            <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-10 ${modal.win ? 'bg-green-100 text-green-600 ring-[12px] ring-green-50' : 'bg-slate-100 text-slate-400 ring-[12px] ring-slate-50'}`}>
              {modal.isSecretReveal ? (
                <span className="text-5xl">🎁</span>
              ) : modal.win ? (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>

            <h3 className={`text-4xl font-black mb-4 ${modal.isSecretReveal ? 'text-amber-600' : modal.win ? 'text-green-700' : 'text-slate-800'}`}>
              {modal.isSecretReveal ? 'QUÀ BÍ MẬT!' : modal.win ? 'THẬT TUYỆT VỜI!' : 'TIẾC QUÁ!'}
            </h3>

            <div className="mb-12 px-2 text-center">
              <p className="text-slate-500 font-bold text-lg leading-relaxed mb-6">
                {modal.message}
              </p>
              {modal.isSecretReveal && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-[2rem] border-2 border-amber-200 shadow-inner transform rotate-1 hover:rotate-0 transition-transform">
                  <p className="text-amber-800 font-black text-2xl uppercase leading-tight tracking-tight">
                    {modal.secretContent}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className={`w-full py-6 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.97] uppercase tracking-widest text-lg ${turnsLeft > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {turnsLeft > 0 ? 'Tiếp tục thử vận may' : 'Hoàn tất chuyến đi'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WheelModals;
