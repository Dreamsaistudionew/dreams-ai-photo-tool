import React, { useState, useRef, useEffect } from 'react';
import { Adjustments } from '../types';
import { Sliders, RotateCcw, Minus, Plus } from 'lucide-react';

interface AdjustmentControlsProps {
  adjustments: Adjustments;
  onChange: (adjustments: Adjustments) => void;
}

export const AdjustmentControls: React.FC<AdjustmentControlsProps> = ({
  adjustments,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isModified = adjustments.brightness !== 100 || adjustments.contrast !== 100;

  const handleReset = () => {
    onChange({ brightness: 100, contrast: 100 });
  };

  const updateBrightness = (val: number) => {
    const clamped = Math.max(50, Math.min(150, val));
    onChange({ ...adjustments, brightness: clamped });
  };

  const updateContrast = (val: number) => {
    const clamped = Math.max(50, Math.min(150, val));
    onChange({ ...adjustments, contrast: clamped });
  };

  return (
    <div ref={dropdownRef} className="relative inline-block" id="adjustment-controls-container">
      {/* Compact Trigger Button [Adjust ▾] */}
      <button
        type="button"
        id="adjust-lighting-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
          isModified || isOpen
            ? 'bg-[#222733] border-[#d4af37] text-[#f4f3ef]'
            : 'bg-[#1a1c21] border-[#2f343e] text-[#c5c9d2] hover:border-[#3f4654] hover:text-white'
        }`}
        title="Adjust photo brightness and contrast"
      >
        <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
        <span>Adjust</span>
        {isModified && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] ml-0.5" />
        )}
        <span className="text-[10px] text-[#8e95a0] ml-0.5">▾</span>
      </button>

      {/* Pop-up Dropdown Controls */}
      {isOpen && (
        <div
          id="adjust-lighting-popup"
          className="absolute right-0 top-full mt-1.5 w-64 p-3 rounded-xl bg-[#17191e] border border-[#363b46] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#262a34]">
            <span className="text-[11px] font-bold text-[#f4f3ef] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#d4af37]" />
              Adjustments
            </span>

            {isModified && (
              <button
                type="button"
                id="adjust-reset-btn"
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-[#9ba1a6] hover:text-[#d4af37] cursor-pointer"
                title="Reset to 100%"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* 1. Brightness Slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#e1e4ea] mb-1.5">
              <span>Brightness</span>
              <span className="font-mono text-[#d4af37] text-[11px]">
                {adjustments.brightness}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="brightness-minus-btn"
                onClick={() => updateBrightness(adjustments.brightness - 5)}
                className="w-6 h-6 rounded bg-[#22252c] border border-[#2f343e] hover:border-[#424958] flex items-center justify-center text-[#9ba1a6] hover:text-white cursor-pointer active:scale-95"
                title="-5%"
              >
                <Minus className="w-3 h-3" />
              </button>

              <input
                id="brightness-slider"
                type="range"
                min="50"
                max="150"
                step="1"
                value={adjustments.brightness}
                onChange={(e) => updateBrightness(Number(e.target.value))}
                className="flex-1 accent-[#d4af37] h-1.5 bg-[#252830] rounded-lg cursor-pointer"
              />

              <button
                type="button"
                id="brightness-plus-btn"
                onClick={() => updateBrightness(adjustments.brightness + 5)}
                className="w-6 h-6 rounded bg-[#22252c] border border-[#2f343e] hover:border-[#424958] flex items-center justify-center text-[#9ba1a6] hover:text-white cursor-pointer active:scale-95"
                title="+5%"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Contrast Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#e1e4ea] mb-1.5">
              <span>Contrast</span>
              <span className="font-mono text-[#d4af37] text-[11px]">
                {adjustments.contrast}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="contrast-minus-btn"
                onClick={() => updateContrast(adjustments.contrast - 5)}
                className="w-6 h-6 rounded bg-[#22252c] border border-[#2f343e] hover:border-[#424958] flex items-center justify-center text-[#9ba1a6] hover:text-white cursor-pointer active:scale-95"
                title="-5%"
              >
                <Minus className="w-3 h-3" />
              </button>

              <input
                id="contrast-slider"
                type="range"
                min="50"
                max="150"
                step="1"
                value={adjustments.contrast}
                onChange={(e) => updateContrast(Number(e.target.value))}
                className="flex-1 accent-[#d4af37] h-1.5 bg-[#252830] rounded-lg cursor-pointer"
              />

              <button
                type="button"
                id="contrast-plus-btn"
                onClick={() => updateContrast(adjustments.contrast + 5)}
                className="w-6 h-6 rounded bg-[#22252c] border border-[#2f343e] hover:border-[#424958] flex items-center justify-center text-[#9ba1a6] hover:text-white cursor-pointer active:scale-95"
                title="+5%"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
