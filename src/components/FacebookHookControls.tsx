import React, { useRef, useMemo, useState } from 'react';
import { HookTextConfig } from '../types';
import { RotateCcw } from 'lucide-react';

interface FacebookHookControlsProps {
  hookText: HookTextConfig;
  onChange: (hookText: HookTextConfig) => void;
}

// Exactly the 4 required simple color options
const COLOR_OPTIONS = [
  { label: 'Yellow', hex: '#FFD700', dot: '#FFD700' },
  { label: 'White', hex: '#FFFFFF', dot: '#FFFFFF' },
  { label: 'Red', hex: '#FF3B30', dot: '#FF3B30' },
  { label: 'Blue', hex: '#1877F2', dot: '#1877F2' },
];

export const FacebookHookControls: React.FC<FacebookHookControlsProps> = ({
  hookText,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // Resolve current text string
  const currentText = useMemo(() => {
    if (hookText.text !== undefined) {
      return hookText.text;
    }
    const p1 = hookText.part1Text || hookText.yellowText || 'NEW';
    const p2 = hookText.part2Text || hookText.whiteText || 'PRODUCT AVAILABLE TODAY';
    return `${p1} ${p2}`.trim();
  }, [hookText]);

  // Resolve per-character colors
  const charColors = useMemo(() => {
    if (hookText.charColors && hookText.charColors.length === currentText.length) {
      return hookText.charColors;
    }
    const firstSpace = currentText.indexOf(' ');
    const colors: string[] = [];
    for (let i = 0; i < currentText.length; i++) {
      if (firstSpace > 0 && i < firstSpace) {
        colors.push('#FFD700');
      } else {
        colors.push('#FFFFFF');
      }
    }
    return colors;
  }, [hookText.charColors, currentText]);

  // Keep track of cursor / text selection in the input
  const updateSelection = () => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart ?? 0;
      const end = inputRef.current.selectionEnd ?? 0;
      setSelection(start !== end ? { start, end } : null);
    }
  };

  // Handle typing or editing in the single text input
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const oldLength = currentText.length;
    const newLength = newText.length;

    let newColors: string[] = [];
    if (newLength === 0) {
      newColors = [];
    } else if (newLength > oldLength) {
      const cursor = e.target.selectionStart ?? newLength;
      const insertedCount = newLength - oldLength;
      const before = charColors.slice(0, Math.max(0, cursor - insertedCount));
      const inserted = new Array(insertedCount).fill('#FFFFFF');
      const after = charColors.slice(Math.max(0, cursor - insertedCount));
      newColors = [...before, ...inserted, ...after].slice(0, newLength);
    } else {
      const cursor = e.target.selectionStart ?? 0;
      const deletedCount = oldLength - newLength;
      const before = charColors.slice(0, cursor);
      const after = charColors.slice(cursor + deletedCount);
      newColors = [...before, ...after].slice(0, newLength);
    }

    while (newColors.length < newLength) {
      newColors.push('#FFFFFF');
    }

    onChange({
      text: newText,
      charColors: newColors,
    });
  };

  // Apply one of the 4 colors to selected text or all text
  const applyColor = (hex: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? selection?.start ?? 0;
    const end = input?.selectionEnd ?? selection?.end ?? 0;

    if (start < end) {
      // Color highlighted letters/words
      const newColors = [...charColors];
      while (newColors.length < currentText.length) {
        newColors.push('#FFFFFF');
      }
      for (let i = start; i < end; i++) {
        if (i < newColors.length) {
          newColors[i] = hex;
        }
      }
      onChange({
        text: currentText,
        charColors: newColors,
      });

      // Restore selection in the input field
      requestAnimationFrame(() => {
        if (input) {
          input.focus();
          input.setSelectionRange(start, end);
        }
      });
    } else {
      // If no text is highlighted, apply to all text
      const newColors = new Array(currentText.length).fill(hex);
      onChange({
        text: currentText,
        charColors: newColors,
      });
      requestAnimationFrame(() => {
        input?.focus();
      });
    }
  };

  // Reset to default hook headline
  const handleReset = () => {
    const defaultText = 'NEW PRODUCT AVAILABLE TODAY';
    const firstSpace = defaultText.indexOf(' ');
    const colors: string[] = [];
    for (let i = 0; i < defaultText.length; i++) {
      colors.push(i < firstSpace ? '#FFD700' : '#FFFFFF');
    }
    onChange({
      text: defaultText,
      charColors: colors,
    });
    setSelection(null);
  };

  return (
    <div
      id="text-master-controls-panel"
      className="w-full mb-3 rounded-xl bg-[#1a1c21] border border-[#2f343e] p-3 shadow-md"
    >
      {/* Top row: Label & Reset */}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="text-master-input"
          className="text-xs font-bold text-[#f4f3ef] uppercase tracking-wider"
        >
          Text Master Headline
        </label>
        <button
          type="button"
          id="hook-reset-default-btn"
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-[#9ba1a6] hover:text-[#d4af37] px-2 py-0.5 rounded bg-[#20232a] border border-[#2a2e38] transition-colors cursor-pointer"
          title="Reset text"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* The ONE Text Input */}
      <div className="mb-2.5">
        <input
          ref={inputRef}
          id="text-master-input"
          type="text"
          value={currentText}
          onChange={handleTextChange}
          onSelect={updateSelection}
          onKeyUp={updateSelection}
          onMouseUp={updateSelection}
          placeholder="e.g. NEW PRODUCT AVAILABLE TODAY"
          className="w-full px-3 py-1.5 rounded-lg bg-[#0f1013] border border-[#363b48] text-sm font-bold text-white tracking-wide placeholder-[#5a606d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all shadow-inner"
        />
      </div>

      {/* Assign Color: Only 4 simple choices */}
      <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-[#262a34]">
        <span className="text-xs font-semibold text-[#f4f3ef]">Assign Color:</span>
        <div className="flex items-center gap-1.5">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              id={`assign-color-${opt.label.toLowerCase()}`}
              onMouseDown={(e) => {
                // Prevent input blur so selection remains active
                e.preventDefault();
                applyColor(opt.hex);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-[#f4f3ef] bg-[#222630] hover:bg-[#2c3240] border border-[#373d4d] hover:border-[#4d566b] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                style={{ backgroundColor: opt.dot }}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
