import React, { useState, useRef, useEffect } from 'react';
import { TemplateId } from '../types';
import { LayoutTemplate, ChevronDown, Check } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (template: TemplateId) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isClassic = selectedTemplate === 'classic';

  return (
    <div
      ref={dropdownRef}
      className="relative w-full mb-2.5 z-40"
      aria-label="Template Selector Dropdown"
    >
      {/* Dropdown Trigger Button [TEMPLATE: Nostalgic Master / Text Master ▼] */}
      <button
        type="button"
        id="template-dropdown-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#1a1c21] hover:bg-[#20232a] border border-[#2f343e] hover:border-[#d4af37]/60 transition-all text-left cursor-pointer shadow-sm group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-[#252830] flex items-center justify-center text-[#d4af37] shrink-0 border border-[#363b46]">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="text-[11px] font-bold tracking-wider text-[#9ba1a6] uppercase shrink-0">
              TEMPLATE:
            </span>
            <span className="text-xs font-semibold text-[#f4f3ef] truncate">
              {isClassic ? 'Nostalgic Master' : 'Text Master'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] text-[#6b7280] hidden sm:inline">
            {isOpen ? 'Close' : 'Switch'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#d4af37] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div
          id="template-dropdown-menu"
          className="absolute top-full left-0 right-0 mt-1.5 bg-[#17191e] border border-[#363b46] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#9ba1a6] uppercase px-2 pt-1 pb-0.5">
            Select Template Layout
          </div>

          {/* Option 1: Nostalgic Master */}
          <button
            type="button"
            id="template-select-classic"
            onClick={() => {
              onSelectTemplate('classic');
              setIsOpen(false);
            }}
            className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
              isClassic
                ? 'bg-[#1f232d] border-[#d4af37] shadow-sm shadow-[#d4af37]/10'
                : 'bg-[#1a1c21] border-[#2a2e38] hover:border-[#3d4352] hover:bg-[#20232a]'
            }`}
          >
            {/* Mini preview diagram */}
            <div className="w-11 h-14 bg-[#111215] rounded border border-[#2b2f38] overflow-hidden flex flex-col justify-between shrink-0 p-0.5">
              <div className="w-full flex-1 flex items-center justify-center text-[7px] text-[#71767e] font-mono">
                4:5
              </div>
              {/* Flag strip at bottom */}
              <div className="w-full h-1 flex">
                <div className="flex-1 bg-[#0055A4]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#EF4135]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-[#f4f3ef]">
                  Nostalgic Master
                </span>
                {isClassic && (
                  <Check className="w-4 h-4 text-[#d4af37] stroke-[2.5]" />
                )}
              </div>
              <p className="text-[11px] text-[#9ba1a6] leading-tight">
                Full-bleed 4:5 photograph with bottom flag color strip.
              </p>
            </div>
          </button>

          {/* Option 2: Text Master */}
          <button
            type="button"
            id="template-select-text-master"
            onClick={() => {
              onSelectTemplate('facebook');
              setIsOpen(false);
            }}
            className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
              !isClassic
                ? 'bg-[#1f232d] border-[#d4af37] shadow-sm shadow-[#d4af37]/10'
                : 'bg-[#1a1c21] border-[#2a2e38] hover:border-[#3d4352] hover:bg-[#20232a]'
            }`}
          >
            {/* Mini preview diagram */}
            <div className="w-11 h-14 bg-[#111215] rounded border border-[#2b2f38] overflow-hidden flex flex-col justify-between shrink-0 p-0.5">
              <div className="w-full flex-1 flex items-center justify-center text-[7px] text-[#71767e] font-mono">
                PHOTO
              </div>
              {/* Hook strip */}
              <div className="w-full h-2.5 bg-[#1a1d24] flex items-center justify-center gap-0.5 px-0.5">
                <span className="text-[6px] text-[#FFD700] font-black leading-none">TXT</span>
                <span className="text-[6px] text-white font-medium leading-none truncate">STRIP</span>
              </div>
              {/* Flag strip at bottom */}
              <div className="w-full h-1 flex">
                <div className="flex-1 bg-[#0055A4]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#EF4135]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-[#f4f3ef]">
                  Text Master
                </span>
                {!isClassic && (
                  <Check className="w-4 h-4 text-[#d4af37] stroke-[2.5]" />
                )}
              </div>
              <p className="text-[11px] text-[#9ba1a6] leading-tight">
                Photo + customizable headline text strip + flag color strip.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
