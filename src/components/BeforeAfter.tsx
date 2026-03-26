'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface Props {
  beforeSrc: string;
  afterSrc: string;
}

export default function BeforeAfter({ beforeSrc, afterSrc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback(() => setDragging(true), []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => { if (dragging) updatePosition(e.clientX); },
    [dragging, updatePosition]
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden select-none cursor-col-resize"
      style={{ touchAction: 'none' }}
    >
      {/* After (fundo) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterSrc} alt="Depois" className="w-full block" draggable={false} />

      {/* Before (recortado) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt="Antes" className="w-full block" style={{ minWidth: containerRef.current?.offsetWidth }} draggable={false} />
      </div>

      {/* Divisor */}
      <div
        className="absolute top-0 bottom-0"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        onPointerDown={onPointerDown}
      >
        <div className="w-0.5 h-full bg-white" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
          <span className="text-black text-xs font-bold select-none">&larr; &rarr;</span>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">Antes</span>
      <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">Depois</span>
    </div>
  );
}
