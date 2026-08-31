import React from 'react';
import { ColorPresetId, LoadedImage } from '../types';
import { COLOR_PRESETS } from '../utils/colorPresets';
import { Check } from 'lucide-react';

interface ColorPresetSelectorProps {
  photo: LoadedImage | null;
  selectedPreset: ColorPresetId;
  onSelectPreset: (presetId: ColorPresetId) => void;
}

export const ColorPresetSelector: React.FC<ColorPresetSelectorProps> = ({
  photo,
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <div className="w-full mt-3">
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[#9ba1a6] uppercase">
          Color Style
        </span>
        <span className="text-[10px] text-[#71767e]">
          6 Presets · Single Row
        </span>
      </div>

      {/* ONE Horizontal Row, strictly compact, horizontally scrollable on mobile */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-1.5 pt-0.5">
        <div className="flex items-center gap-2 min-w-max px-0.5">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-btn-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`relative flex flex-col items-center p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#222630] border-2 border-[#d4af37] shadow-lg shadow-[#d4af37]/10 -translate-y-0.5'
                    : 'bg-[#1a1c21] border border-[#2f343e] hover:border-[#424856] hover:bg-[#20232a]'
                }`}
                style={{ width: '76px' }}
              >
                {/* Thumbnail of actual photograph with the preset filter applied */}
                <div className="relative w-full aspect-[4/5] rounded overflow-hidden bg-[#121316] mb-1.5">
                  {photo ? (
                    <img
                      src={photo.src}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      style={{ filter: preset.cssFilter }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-br from-[#2a2d36] to-[#16181d] flex items-center justify-center"
                      style={{ filter: preset.cssFilter }}
                    >
                      <span className="text-[9px] text-[#9ba1a6] font-medium">4:5</span>
                    </div>
                  )}

                  {/* Selected checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] text-[#121316] flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Preset Name */}
                <span
                  className={`text-[11px] font-medium tracking-tight truncate w-full text-center ${
                    isSelected ? 'text-[#d4af37] font-semibold' : 'text-[#e1e4ea]'
                  }`}
                >
                  {preset.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
