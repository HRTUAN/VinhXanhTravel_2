
import React, { useState, useEffect } from 'react';
import { WheelSegment, SetupData, SecretSheetData } from '../../types';
import WheelSVG from './WheelSVG';
import WheelActions from './WheelActions';
import WheelModals, { WheelModalState } from './WheelModals';

interface Props {
  onSpin: (prizeName: string) => Promise<{ result: 'win' | 'lose'; message: string }>;
  onUpdateSecretPrize: (prizeName: string) => Promise<void>;
  turnsLeft: number;
  onFinish?: () => void;
  prizeList: string[];
  secretPrizes: SetupData['secretPrizes'];
  pax: number;
  forceSecret: boolean;
}

const LuckyWheel: React.FC<Props> = ({ onSpin, onUpdateSecretPrize, turnsLeft, onFinish, prizeList, secretPrizes, pax, forceSecret }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isRevealingSecret, setIsRevealingSecret] = useState(false);
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [modal, setModal] = useState<WheelModalState>({
    show: false,
    win: false,
    message: ''
  });

  useEffect(() => {
    if (!prizeList || prizeList.length === 0) return;

    const vibrantPalette = [
      '#ca60f7', '#22C55E', '#0090ff', '#FACC15', '#F97316', 
      '#EF4444', '#EC4899', '#84CC16', '#2ceaf4',
    ];
    
    const grayColor = '#94A3B8'; 
    
    const newSegments: WheelSegment[] = prizeList.map((label, index) => {
      const isLose = label === 'Chúc may mắn' || label === 'Thử lại nhé' || label === 'May mắn lần sau';
      const isSecret = label === 'Phần quà bí mật';
      
      const color = isLose ? grayColor : vibrantPalette[index % vibrantPalette.length];

      return {
        label: label,
        color: color,
        isWin: !isLose,
        isSecret: isSecret
      };
    });

    setSegments(newSegments);
  }, [prizeList]);

  const isExtraTurnText = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('thêm lượt');
  };

  const handleSpinClick = async () => {
    if (isSpinning || turnsLeft <= 0 || segments.length === 0) return;

    setIsSpinning(true);
    
    try {
      const winSegments = segments.filter(s => s.isWin);
      const randomWinLabel = winSegments.length > 0 
        ? winSegments[Math.floor(Math.random() * winSegments.length)].label 
        : "Quà tặng";

      const { result, message } = await onSpin(randomWinLabel);
      
      const possibleTargets = segments.map((s, i) => ({ ...s, index: i }))
        .filter(s => {
          // Fix error: Removed redundant 'extra_turn' comparison as result is normalized to 'win' | 'lose' in App.tsx
          if (result === 'win') {
            if (forceSecret) return s.isSecret;
            if (isExtraTurnText(message)) return s.label.toLowerCase().includes('lượt');
            if (message.includes('bí mật') || message.includes('Secret')) return s.isSecret;
            return s.isWin && (s.label === randomWinLabel || segments.filter(seg => seg.label === randomWinLabel).length === 0);
          }
          return !s.isWin;
        });
      
      const finalTarget = possibleTargets.length > 0 
        ? possibleTargets[Math.floor(Math.random() * possibleTargets.length)]
        : { ...segments[0], index: 0 };

      const segmentAngle = 360 / segments.length;
      const extraSpins = 8 + Math.floor(Math.random() * 5);
      const currentModRotation = rotation % 360;
      
      const targetCenterAngle = (finalTarget.index * segmentAngle) + (segmentAngle / 2);
      let angleToRotate = (270 - targetCenterAngle) - currentModRotation;
      
      if (angleToRotate <= 0) angleToRotate += 360;
      const newRotation = rotation + (extraSpins * 360) + angleToRotate;
      
      setRotation(newRotation);

      setTimeout(async () => {
        setIsSpinning(false);
        
        // --- LOGIC XỬ LÝ QUÀ BÍ MẬT ---
        // Fix error: Removed redundant 'extra_turn' comparison as result is normalized to 'win' | 'lose' in App.tsx
        if (result === 'win' && finalTarget.isSecret) {
          setIsRevealingSecret(true);
          
          // 1. Xác định sheet quà dựa trên số lượng khách (Pax)
          let sheet: SecretSheetData;
          let isWin100 = false;

          if (pax < 40) {
            sheet = secretPrizes.win100;
            isWin100 = true; // Đánh dấu đây là sheet win-100
          } else if (pax < 60) {
            sheet = secretPrizes.win40;
          } else if (pax < 90) {
            sheet = secretPrizes.win30;
          } else {
            sheet = secretPrizes.win20;
          }

          // 2. Quay số ngẫu nhiên từ 0-100 để tính tỉ lệ trúng
          const roll = Math.random() * 100;
          let secretResult = "Chúc bạn may mắn lần sau!";
          let hasWonSecret = false;

          // 3. Lấy tỉ lệ % từ dòng 1 (percentages[0] là A1, [1] là B1, [2] là C1)
          if (isWin100) {
            // Trường hợp win-100: Chỉ lấy tỉ lệ ở cột A (A1)
            const win100Rate = sheet.percentages[0] || 0;
            if (roll <= win100Rate) {
              const columnAPrizes = sheet.prizes[0];
              if (columnAPrizes && columnAPrizes.length > 0) {
                secretResult = columnAPrizes[Math.floor(Math.random() * columnAPrizes.length)];
                hasWonSecret = true;
              }
            }
          } else {
            // Trường hợp win-40, 30, 20: Xét cả 3 cột A, B, C dựa trên % ở dòng 1
            let currentThreshold = 0;
            for (let i = 0; i < 3; i++) {
              const columnRate = sheet.percentages[i] || 0;
              currentThreshold += columnRate;
              
              if (roll <= currentThreshold) {
                const columnPrizes = sheet.prizes[i];
                if (columnPrizes && columnPrizes.length > 0) {
                  secretResult = columnPrizes[Math.floor(Math.random() * columnPrizes.length)];
                  hasWonSecret = true;
                  break; // Đã trúng ở cột này thì dừng vòng lặp
                }
              }
            }
          }

          // 4. Đồng bộ kết quả cụ thể về server qua API
          if (hasWonSecret) {
            await onUpdateSecretPrize(secretResult);
          }

          setTimeout(() => {
            setIsRevealingSecret(false);
            setModal({
              show: true, 
              win: hasWonSecret,
              message: hasWonSecret ? "Chúc mừng! Bạn đã mở được quà Bí Mật!" : "Opps! Quà bí mật lần này chưa mỉm cười với bạn.",
              isSecretReveal: true, 
              secretContent: secretResult
            });
          }, 2000);
        } else {
          // Fix error: Removed redundant 'extra_turn' comparison as result is normalized to 'win' | 'lose' in App.tsx
          setModal({ show: true, win: result === 'win', message: message });
        }
      }, 5500);
    } catch (error) {
      setIsSpinning(false);
      console.error("Spin error:", error);
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
      <WheelSVG rotation={rotation} segments={segments} />
      
      <WheelActions 
        isSpinning={isSpinning} 
        turnsLeft={turnsLeft} 
        isRevealingSecret={isRevealingSecret}
        onSpinClick={handleSpinClick} 
      />

      <WheelModals 
        modal={modal} 
        isRevealingSecret={isRevealingSecret} 
        turnsLeft={turnsLeft} 
        onClose={() => {
          setModal({ ...modal, show: false });
          if (turnsLeft === 0 && onFinish) onFinish();
        }} 
      />
    </div>
  );
};

export default LuckyWheel;
