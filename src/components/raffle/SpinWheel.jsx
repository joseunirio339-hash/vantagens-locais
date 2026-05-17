import React, { useRef, useState, useEffect } from 'react';

const DEFAULT_COLORS = [
  '#7C3AED', '#DB2777', '#D97706', '#059669',
  '#2563EB', '#DC2626', '#7C3AED', '#0891B2'
];

export default function SpinWheel({ prizes, spinning, onSpinEnd }) {
  const canvasRef = useRef(null);
  const currentRotRef = useRef(0);
  const animRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const numPrizes = prizes.length;
  const segAngle = (2 * Math.PI) / numPrizes;

  const drawWheel = (rot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = cx - 10;

    ctx.clearRect(0, 0, size, size);

    prizes.forEach((prize, i) => {
      const startAngle = rot + i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, Math.min(14, 120 / numPrizes))}px sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      const label = prize.label.length > 16 ? prize.label.substring(0, 14) + '…' : prize.label;
      ctx.fillText(label, r - 10, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#7C3AED';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(currentRotRef.current);
  }, [prizes]);

  useEffect(() => {
    if (!spinning || isAnimating || numPrizes === 0) return;

    // Pick prize by weight
    const totalWeight = prizes.reduce((s, p) => s + (p.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    let targetIdx = 0;
    for (let i = 0; i < prizes.length; i++) {
      rand -= prizes[i].weight || 1;
      if (rand <= 0) { targetIdx = i; break; }
    }

    setIsAnimating(true);

    const extraSpins = 5 + Math.random() * 3;
    const targetAngle = -(targetIdx * segAngle + segAngle / 2);
    const totalRotation = extraSpins * 2 * Math.PI + targetAngle;

    const startRot = currentRotRef.current;
    const duration = 4000;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = startRot + totalRotation * ease;
      currentRotRef.current = current;
      drawWheel(current);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        onSpinEnd(targetIdx);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [spinning]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-72">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-violet-600 drop-shadow-lg" />
        </div>
        <canvas
          ref={canvasRef}
          width={288}
          height={288}
          className="rounded-full shadow-2xl"
        />
      </div>
    </div>
  );
}