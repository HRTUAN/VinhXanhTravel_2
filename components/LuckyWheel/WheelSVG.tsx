
import React from 'react';
import { WheelSegment } from '../../types';

interface Props {
  rotation: number;
  segments: WheelSegment[];
}

const WheelSVG: React.FC<Props> = ({ rotation, segments }) => {
  return (
    <div className="relative mb-12">
      {/* Kim chỉ vị trí dừng */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-20 drop-shadow-[0_10px_10px_rgba(239,68,68,0.3)]">
        <svg width="46" height="56" viewBox="0 0 46 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 56L43.7846 20H2.21539L23 56Z" fill="#ef4444" />
          <circle cx="23" cy="18" r="10" fill="#ef4444" />
          <circle cx="23" cy="18" r="4" fill="white" />
        </svg>
      </div>

      {/* Vòng quay chính */}
      <div className="w-80 h-80 md:w-[32rem] md:h-[32rem] rounded-full border-[14px] border-white shadow-[0_20px_60px_rgba(59,130,246,0.25)] relative">
        
        <div className="w-full h-full rounded-full overflow-hidden relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Nhóm các thành phần xoay */}
            <g 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 50%',
                transition: 'transform 5s cubic-bezier(0.15, 0, 0.1, 1)'
              }}
            >
              {segments.map((seg, i) => {
                const angle = 360 / segments.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;
                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
                const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                const isWhiteBackground = seg.color.toLowerCase() === '#ffffff';
                const textColor = isWhiteBackground ? '#334155' : 'white';
                const textShadow = isWhiteBackground ? 'none' : '0.5px 0.5px 2px rgba(0,0,0,0.5)';

                return (
                  <g key={i}>
                    <path d={d} fill={seg.color} stroke="#fff" strokeWidth="0.6" />
                    <text
                      x="50"
                      y="50"
                      transform={`rotate(${startAngle + angle/2} 50 50) translate(26 0)`}
                      fill={textColor}
                      fontSize={segments.length > 10 ? "2.2" : "2.8"}
                      fontWeight="800"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="select-none pointer-events-none uppercase tracking-tight"
                      style={{ textShadow }}
                    >
                      {seg.label.length > 18 ? seg.label.substring(0, 16) + '...' : seg.label}
                    </text>
                  </g>
                );
              })}

              {/* Đèn LED trắng ở các vách ngăn */}
              {segments.map((_, i) => {
                const angle = (i * 360) / segments.length;
                const dotRadius = 46.5;
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
            </g>

          

            {/* Tâm vòng quay */}
            <g>
              <circle cx="50" cy="50" r="11" fill="white" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }} />
              <circle cx="50" cy="50" r="9" fill="#f8fafc" />
              <text x="50" y="51.5" textAnchor="middle" className="text-[4.5px] font-black fill-blue-600 uppercase tracking-tighter select-none pointer-events-none">Go!</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default WheelSVG;
