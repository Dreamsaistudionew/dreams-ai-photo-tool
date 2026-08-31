import React, { useState } from 'react';
import { LogoPlacement } from '../types';
import { MASTER_LOGO_DEFAULTS } from '../utils/imageProcessor';
import { Sliders, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface LogoControlsProps {
  placement: LogoPlacement;
  onChange: (updated: LogoPlacement) => void;
  hasLogo: boolean;
}

export const LogoControls: React.FC<LogoControlsProps> = ({
  placement,
  onChange,
  hasLogo,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onChange({ ...MASTER_LOGO_DEFAULTS });
  };

  const isAtDefault =
    Math.abs(placement.centerX - MASTER_LOGO_DEFAULTS.centerX) < 0.001 &&
    Math.abs(placement.centerY - MASTER_LOGO_DEFAULTS.centerY) < 0.001 &&
    Math.abs(placement.scale - MASTER_LOGO_DEFAULTS.scale) < 0.01 &&
    Math.abs(placement.opacity - MASTER_LOGO_DEFAULTS.opacity) < 0.01;

  return (
    <div className="w-full mt-3 bg-[#1a1c21] border border-[#2f343e] rounded-xl overflow-hidden shadow-sm">
      {/* Header / Toggle Button */}
      <button
        type="button"
        id="toggle-logo-controls-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#20232a] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-xs font-semibold text-[#f4f3ef] tracking-wide">
            LOGO CONTROLS
          </span>
          {!isAtDefault && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" title="Customized" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#9ba1a6]">
            {isOpen ? 'Collapse' : 'Master: (94%, 94.4%)'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#9ba1a6]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#9ba1a6]" />
          )}
        </div>
      </button>

      {/* Collapsible Slider Body */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#262a33] space-y-2.5">
          {!hasLogo && (
            <div className="p-2 rounded bg-[#15171c] border border-[#262a33] text-[11px] text-[#9ba1a6] flex items-center gap-2">
              <span>Using standard master logo signature. Upload your custom logo above to replace it.</span>
            </div>
          )}

          {/* Logo Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <label htmlFor="logo-size-slider" className="text-[#9ba1a6] font-medium">
                Logo Size
              </label>
              <span className="text-[#f4f3ef] font-mono text-[10px]">
                {Math.round(placement.scale * 100)}%
              </span>
            </div>
            <input
              id="logo-size-slider"
              type="range"
              min="0.3"
              max="2.2"
              step="0.05"
              value={placement.scale}
              onChange={(e) =>
                onChange({ ...placement, scale: parseFloat(e.target.value) })
              }
              className="w-full accent-[#d4af37] bg-[#121316] h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Logo Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <label htmlFor="logo-opacity-slider" className="text-[#9ba1a6] font-medium">
                Logo Opacity
              </label>
              <span className="text-[#f4f3ef] font-mono text-[10px]">
                {Math.round(placement.opacity * 100)}%
              </span>
            </div>
            <input
              id="logo-opacity-slider"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={placement.opacity}
              onChange={(e) =>
                onChange({ ...placement, opacity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#d4af37] bg-[#121316] h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Grid for Logo X and Logo Y */}
          <div className="grid grid-cols-2 gap-3 pt-0.5">
            {/* Logo X */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="logo-x-slider" className="text-[#9ba1a6] font-medium">
                  Logo X (Pos)
                </label>
                <span className="text-[#f4f3ef] font-mono text-[10px]">
                  {(placement.centerX * 100).toFixed(1)}%
                </span>
              </div>
              <input
                id="logo-x-slider"
                type="range"
                min="0.06"
                max="0.96"
                step="0.005"
                value={placement.centerX}
                onChange={(e) =>
                  onChange({ ...placement, centerX: parseFloat(e.target.value) })
                }
                className="w-full accent-[#d4af37] bg-[#121316] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Logo Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="logo-y-slider" className="text-[#9ba1a6] font-medium">
                  Logo Y (Pos)
                </label>
                <span className="text-[#f4f3ef] font-mono text-[10px]">
                  {(placement.centerY * 100).toFixed(1)}%
                </span>
              </div>
              <input
                id="logo-y-slider"
                type="range"
                min="0.06"
                max="0.96"
                step="0.005"
                value={placement.centerY}
                onChange={(e) =>
                  onChange({ ...placement, centerY: parseFloat(e.target.value) })
                }
                className="w-full accent-[#d4af37] bg-[#121316] h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Reset Logo Button */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              id="reset-logo-btn"
              onClick={handleReset}
              disabled={isAtDefault}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                isAtDefault
                  ? 'text-[#5a606c] bg-transparent cursor-not-allowed'
                  : 'text-[#d4af37] bg-[#222630] hover:bg-[#282d38] border border-[#d4af37]/30 cursor-pointer'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET LOGO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
