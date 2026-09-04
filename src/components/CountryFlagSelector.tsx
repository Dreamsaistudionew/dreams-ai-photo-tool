import React, { useState, useRef, useEffect } from 'react';
import { CountryId } from '../types';
import { COUNTRIES_LIST, countryFlags } from '../utils/countryFlags';
import { ChevronDown, Check, Flag } from 'lucide-react';

interface CountryFlagSelectorProps {
  selectedCountry: CountryId;
  onSelectCountry: (countryId: CountryId) => void;
}

export const CountryFlagSelector: React.FC<CountryFlagSelectorProps> = ({
  selectedCountry,
  onSelectCountry,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCountry = countryFlags[selectedCountry] || countryFlags.france;

  // Close dropdown on outside click or Touch or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Label Header */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-[11px] font-semibold tracking-wider text-[#9ba1a6] uppercase">
            Country Color Strip
          </span>
        </div>
        <span className="text-[10px] text-[#6b7280]">
          {activeCountry.colors.length} equal sections
        </span>
      </div>

      {/* Dropdown Selector Trigger */}
      <button
        type="button"
        id="country-selector-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#1a1c21] border border-[#2f343e] hover:border-[#d4af37]/60 hover:bg-[#20232a] transition-all cursor-pointer text-left focus:outline-none focus:border-[#d4af37]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-semibold text-[#f4f3ef] truncate">
            {activeCountry.name}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Mini Equal-Width Color Strip Preview */}
          <div
            className="flex h-3 w-12 rounded-sm overflow-hidden border border-white/15 bg-black/40"
            title={`${activeCountry.name} primary colors (${activeCountry.colors.length} equal sections)`}
          >
            {activeCountry.colors.map((color, i) => (
              <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
            ))}
          </div>

          {/* Small Down-Arrow Icon (Chevron) */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#9ba1a6] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#d4af37]' : ''
            }`}
          />
        </div>
      </button>

      {/* Scrollable Dropdown Popup - Appears directly underneath when open */}
      {isOpen && (
        <div
          id="country-dropdown-menu"
          role="listbox"
          aria-label="Select country for color strip"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-lg bg-[#1a1c21] border border-[#2f343e] shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-[#262a34]">
            {COUNTRIES_LIST.map((country) => {
              const isSelected = selectedCountry === country.id;
              return (
                <button
                  key={country.id}
                  id={`country-option-${country.id}`}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    onSelectCountry(country.id);
                    setIsOpen(false);
                  }}
                  className={`w-full min-h-[42px] px-3.5 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#252934] text-[#d4af37]'
                      : 'text-[#e1e4ea] hover:bg-[#20232a] hover:text-[#f4f3ef]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs ${isSelected ? 'font-semibold' : 'font-medium'} truncate`}>
                      {country.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Equal-Width Color Representation */}
                    <div className="flex h-2.5 w-10 rounded-sm overflow-hidden border border-white/10 bg-black/40">
                      {country.colors.map((color, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>

                    <div className="w-4 flex items-center justify-center">
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#d4af37] stroke-[2.5]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
