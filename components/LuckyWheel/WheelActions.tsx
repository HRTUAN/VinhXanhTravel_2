
import React from 'react';

interface Props {
  isSpinning: boolean;
  turnsLeft: number;
  isRevealingSecret: boolean;
  onSpinClick: () => void;
}

const WheelActions: React.FC<Props> = ({ isSpinning, turnsLeft, isRevealingSecret, onSpinClick }) => {
  return (
    <div className="text-center space-y-6">
      <div className="flex flex-col items-center gap-1">
        <span className="text-slate-400 text-[0.65rem] font-black uppercase tracking-widest">Cơ hội của bạn</span>
        <div className="px-8 py-2.5 bg-white text-blue-600 rounded-full font-black text-xl shadow-md border border-slate-100 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          {turnsLeft} LƯỢT QUAY
        </div>
      </div>

      <button
        onClick={onSpinClick}
        disabled={isSpinning || turnsLeft <= 0 || isRevealingSecret}
        className={`group relative px-16 py-7 rounded-2xl text-2xl font-black text-white shadow-[0_20px_40px_-15px_rgba(249,115,22,0.4)] transform transition-all active:scale-95 disabled:grayscale disabled:opacity-50 overflow-hidden ${isSpinning || isRevealingSecret ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 hover:scale-105 active:shadow-inner'}`}
      >
        <span className="relative z-10 flex items-center gap-3">
          {isSpinning ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ĐANG QUAY...
            </>
          ) : isRevealingSecret ? 'ĐANG MỞ QUÀ...' : 'BẮT ĐẦU QUAY!'}
        </span>
        {!isSpinning && turnsLeft > 0 && !isRevealingSecret && (
           <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        )}
      </button>
    </div>
  );
};

export default WheelActions;
