
import React, { useState, useRef, useEffect } from 'react';
import { WheelSegment } from '../types';

interface Props {
  onSpin: (prizeName: string) => Promise<{ result: 'win' | 'lose'; message: string }>;
  turnsLeft: number;
  onFinish?: () => void;
  prizeList: string[]; // Danh sách lấy từ sheet SETUP!B2:B
  secretPrizes: {
    F: string[];
    G: string[];
    H: string[];
  };
}

const LuckyWheel: React.FC<Props> = ({ onSpin, turnsLeft, onFinish, prizeList, secretPrizes }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isRevealingSecret, setIsRevealingSecret] = useState(false);
  const [modal, setModal] = useState<{ 
    show: boolean; 
    win: boolean; 
    message: string; 
    isSecretReveal?: boolean;
    secretContent?: string;
  }>({
    show: false,
    win: false,
    message: ''
  });
  
  const [segments, setSegments] = useState<WheelSegment[]>([]);

  useEffect(() => {
    if (!prizeList || prizeList.length === 0) return;

    // Bảng màu cho các giải thưởng trúng (Vibrant & Modern)
    const prizePalette = ['#3B82F6', '#10B981', '#EC4899', '#6366F1', '#F43F5E', '#8B5CF6', '#06B6D4', '#84CC16'];
    const grayColor = '#94A3B8'; // Màu cho ô không trúng (Chúc may mắn)
    
    // Tạo danh sách nan dựa TRỰC TIẾP trên prizeList từ Sheet
    const newSegments: WheelSegment[] = prizeList.map((label, index) => {
      const isLose = label === 'Chúc may mắn' || label === 'Thử lại nhé' || label === 'May mắn lần sau';
      const isSecret = label === 'Phần quà bí mật';
      
      let color = '';
      if (isSecret) {
        color = '#F59E0B'; // Vàng cam (Sẽ dùng Gradient trong SVG)
      } else if (isLose) {
        color = grayColor;
      } else {
        // Xoay vòng bảng màu cho các giải trúng thường
        color = prizePalette[index % prizePalette.length];
      }

      return {
        label: label,
        color: color,
        isWin: !isLose,
        isSecret: isSecret
      };
    });

    setSegments(newSegments);
  }, [prizeList]);

  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpinClick = async () => {
    if (isSpinning || turnsLeft <= 0 || segments.length === 0) return;

    setIsSpinning(true);
    
    try {
      // Chọn ngẫu nhiên một nan thắng từ vòng quay hiện tại để làm "mục tiêu giả định" cho server
      const winSegments = segments.filter(s => s.isWin);
      const randomWinLabel = winSegments.length > 0 
        ? winSegments[Math.floor(Math.random() * winSegments.length)].label 
        : "Quà tặng";

      const { result, message } = await onSpin(randomWinLabel);
      
      // Tìm tất cả các nan hợp lệ mà vòng quay có thể dừng (dựa trên kết quả server)
      const possibleTargets = segments.map((s, i) => ({ ...s, index: i }))
        .filter(s => {
          if (result === 'win') {
            // Nếu trúng "Phần quà bí mật", phải dừng đúng nan bí mật
            if (message.includes('bí mật') || message.includes('Secret')) {
                return s.isSecret;
            }
            // Nếu trúng giải cụ thể, ưu tiên nan có nhãn đó
            return s.isWin && (s.label === randomWinLabel || segments.filter(seg => seg.label === randomWinLabel).length === 0);
          }
          return !s.isWin;
        });
      
      // Chọn 1 nan mục tiêu cuối cùng
      const finalTarget = possibleTargets.length > 0 
        ? possibleTargets[Math.floor(Math.random() * possibleTargets.length)]
        : { ...segments[0], index: 0 };

      const segmentAngle = 360 / segments.length;
      const extraSpins = 8 + Math.floor(Math.random() * 5); // Quay ít nhất 8 vòng
      const currentModRotation = rotation % 360;
      
      // Tính toán góc để kim chỉ (ở vị trí 270 độ hoặc top) rơi vào giữa nan mục tiêu
      // Lưu ý: Trong SVG này kim chỉ ở Top (270deg trong hệ tọa độ chuẩn của Wheel)
      const targetCenterAngle = (finalTarget.index * segmentAngle) + (segmentAngle / 2);
      let angleToRotate = (270 - targetCenterAngle) - currentModRotation;
      
      if (angleToRotate <= 0) angleToRotate += 360;
      const newRotation = rotation + (extraSpins * 360) + angleToRotate;
      
      setRotation(newRotation);

      setTimeout(() => {
        setIsSpinning(false);
        
        // Xử lý nếu trúng nan "Phần quà bí mật"
        if (result === 'win' && finalTarget.isSecret) {
          setIsRevealingSecret(true);
          
          // Logic xác suất quà bí mật (40% F, 20% G, 10% H)
          const roll = Math.random() * 100;
          let secretResult = "Một bất ngờ đặc biệt!";
          
          if (roll < 40) {
            secretResult = secretPrizes.F.length > 0 ? secretPrizes.F[Math.floor(Math.random() * secretPrizes.F.length)] : secretResult;
          } else if (roll < 60) {
            secretResult = secretPrizes.G.length > 0 ? secretPrizes.G[Math.floor(Math.random() * secretPrizes.G.length)] : secretResult;
          } else if (roll < 70) {
            secretResult = secretPrizes.H.length > 0 ? secretPrizes.H[Math.floor(Math.random() * secretPrizes.H.length)] : secretResult;
          }

          setTimeout(() => {
            setIsRevealingSecret(false);
            setModal({
              show: true,
              win: true,
              message: "Bạn đã quay vào ô Bí Mật!",
              isSecretReveal: true,
              secretContent: secretResult
            });
          }, 2000);
        } else {
          setModal({
            show: true,
            win: result === 'win',
            message: message
          });
        }
      }, 5500); // Đợi hiệu ứng quay kết thúc
    } catch (error) {
      setIsSpinning(false);
      console.error("Spin error:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const handleCloseModal = () => {
    setModal({ ...modal, show: false });
    if (turnsLeft === 0 && onFinish) {
      onFinish();
    }
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Đang thiết lập vòng quay...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-12">
        {/* Kim chỉ vị trí dừng */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-20 drop-shadow-[0_10px_10px_rgba(239,68,68,0.3)]">
          <svg width="46" height="56" viewBox="0 0 46 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 56L43.7846 20H2.21539L23 56Z" fill="#ef4444" />
            <circle cx="23" cy="18" r="10" fill="#ef4444" />
            <circle cx="23" cy="18" r="4" fill="white" />
          </svg>
        </div>

        {/* Vòng quay */}
        <div 
          className="w-80 h-80 md:w-[32rem] md:h-[32rem] rounded-full border-[14px] border-white shadow-[0_20px_60px_rgba(59,130,246,0.25)] overflow-hidden relative transition-transform duration-[5000ms]"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.1, 1)'
          }}
          ref={wheelRef}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="secretGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            {segments.map((seg, i) => {
              const startAngle = (i * 360) / segments.length;
              const endAngle = ((i + 1) * 360) / segments.length;
              const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
              const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

              return (
                <g key={i}>
                  <path 
                    d={d} 
                    fill={seg.isSecret ? "url(#secretGradient)" : seg.color} 
                    stroke="#fff" 
                    strokeWidth="0.6" 
                  />
                  <text
                    x="50"
                    y="50"
                    transform={`rotate(${startAngle + (360/segments.length)/2} 50 50) translate(26 0)`}
                    fill="white"
                    fontSize={segments.length > 10 ? "2.2" : "2.8"}
                    fontWeight="800"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="select-none pointer-events-none uppercase tracking-tight"
                    style={{ textShadow: '0.5px 0.5px 2px rgba(0,0,0,0.5)' }}
                  >
                    {seg.label.length > 18 ? seg.label.substring(0, 16) + '...' : seg.label}
                  </text>
                </g>
              );
            })}

            {/* CÁC CHẤM TRÒN TRANG TRÍ (ĐÈN LED) TẠI ĐIỂM CHIA */}
            {segments.map((_, i) => {
              const angle = (i * 360) / segments.length;
              const dotRadius = 46.5; // Đặt gần sát viền ngoài
              const dx = 50 + dotRadius * Math.cos((angle * Math.PI) / 180);
              const dy = 50 + dotRadius * Math.sin((angle * Math.PI) / 180);
              
              return (
                <circle
                  key={`dot-${i}`}
                  cx={dx}
                  cy={dy}
                  r="1.4"
                  fill="white"
                  style={{ 
                    filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                    stroke: 'rgba(0,0,0,0.1)',
                    strokeWidth: 0.2
                  }}
                />
              );
            })}

            {/* Tâm vòng quay */}
            <circle cx="50" cy="50" r="11" fill="white" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }} />
            <circle cx="50" cy="50" r="9" fill="#f8fafc" />
            <text x="50" y="51" textAnchor="middle" className="text-[4px] font-black fill-blue-600 uppercase tracking-tighter">Go!</text>
          </svg>
        </div>
      </div>

      <div className="text-center space-y-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-slate-400 text-[0.65rem] font-black uppercase tracking-widest">Cơ hội của bạn</span>
          <div className="px-8 py-2.5 bg-white text-blue-600 rounded-full font-black text-xl shadow-md border border-slate-100 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            {turnsLeft} LƯỢT QUAY
          </div>
        </div>

        <button
          onClick={handleSpinClick}
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
          {!isSpinning && turnsLeft > 0 && (
             <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          )}
        </button>
      </div>

      {/* Hiệu ứng mờ ảo khi mở quà bí mật */}
      {isRevealingSecret && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[60] flex items-center justify-center p-4 transition-all duration-500">
          <div className="text-center animate-bounce">
            <div className="text-[10rem] mb-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">🎁</div>
            <h2 className="text-white text-4xl font-black uppercase tracking-[0.3em] animate-pulse">
              Đang giải mã phần quà bí mật...
            </h2>
          </div>
        </div>
      )}

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

            <div className="mb-12 px-2">
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
              onClick={handleCloseModal}
              className={`w-full py-6 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.97] uppercase tracking-widest text-lg ${turnsLeft > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {turnsLeft > 0 ? 'Tiếp tục thử vận may' : 'Hoàn tất chuyến đi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyWheel;
