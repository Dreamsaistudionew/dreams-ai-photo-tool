import React, { useState, useRef, useEffect } from 'react';
import { ColorPresetId, LoadedImage, LogoPlacement } from '../types';
import { COLOR_PRESETS } from '../utils/colorPresets';
import { calculateLogoRect } from '../utils/imageProcessor';
import { Eye, EyeOff, Sparkles, Image as ImageIcon } from 'lucide-react';

interface LivePhotoPreviewProps {
  photo: LoadedImage | null;
  logo: LoadedImage | null;
  selectedPreset: ColorPresetId;
  logoPlacement: LogoPlacement;
  onOpenUploadPhoto?: () => void;
}

export const LivePhotoPreview: React.FC<LivePhotoPreviewProps> = ({
  photo,
  logo,
  selectedPreset,
  logoPlacement,
  onOpenUploadPhoto,
}) => {
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 500 });

  // Update container pixel dimensions for accurate logo rendering in preview
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activePreset = COLOR_PRESETS.find((p) => p.id === selectedPreset) || COLOR_PRESETS[0];

  // Calculate logo position for preview
  const logoRect = logo
    ? calculateLogoRect(
        containerSize.width,
        containerSize.height,
        logo.width || 200,
        logo.height || 200,
        logoPlacement
      )
    : null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Bar above Preview: Status & Quick Compare */}
      <div className="w-full flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#1e2127] border border-[#2f343e] text-[#d4af37]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse"></span>
            LIVE PREVIEW (4:5)
          </span>
          {photo && (
            <span className="text-[11px] text-[#9ba1a6] hidden sm:inline">
              Source: {photo.width} × {photo.height}
            </span>
          )}
        </div>

        {/* Before / After Compare Button */}
        {photo && (
          <button
            type="button"
            id="compare-before-after-btn"
            onMouseDown={() => setIsComparingOriginal(true)}
            onMouseUp={() => setIsComparingOriginal(false)}
            onMouseLeave={() => setIsComparingOriginal(false)}
            onTouchStart={() => setIsComparingOriginal(true)}
            onTouchEnd={() => setIsComparingOriginal(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all select-none cursor-pointer ${
              isComparingOriginal
                ? 'bg-[#d4af37] text-[#121316] font-semibold shadow-md'
                : 'bg-[#1e2127] text-[#e1e4ea] hover:text-[#d4af37] border border-[#2f343e] hover:border-[#d4af37]/40'
            }`}
            title="Press and hold to view original untouched photo"
          >
            {isComparingOriginal ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#121316]" />
                <span>ORIGINAL (HOLDING)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>HOLD TO COMPARE</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main 4:5 Large Preview Stage */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[460px] aspect-[4/5] bg-[#16181d] rounded-xl overflow-hidden border border-[#2a2e38] shadow-2xl flex items-center justify-center group select-none"
      >
        {photo ? (
          <>
            {/* The Photo with active Preset CSS Filter (or None if comparing) */}
            <img
              src={photo.src}
              alt="Live 4:5 Photograph"
              className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200"
              style={{
                filter: isComparingOriginal ? 'none' : activePreset.cssFilter,
              }}
              draggable={false}
            />

            {/* Subtle Vignette Overlay for Depth */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/10" />

            {/* Master Composited Logo (Hidden when comparing original) */}
            {logo && !isComparingOriginal && logoRect && (
              <div
                className="absolute pointer-events-none transition-all duration-150"
                style={{
                  left: `${logoRect.x}px`,
                  top: `${logoRect.y}px`,
                  width: `${logoRect.width}px`,
                  height: `${logoRect.height}px`,
                  opacity: logoPlacement.opacity,
                }}
              >
                <img
                  src={logo.src}
                  alt="Composited Logo"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            )}

            {/* Floating Active Preset Badge (Bottom Left of Photo) */}
            <div className="absolute bottom-2.5 left-2.5 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded bg-[#121316]/80 backdrop-blur-md border border-white/10 text-[10px] text-[#f4f3ef] font-medium tracking-wide">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>{isComparingOriginal ? 'Original (Untouched)' : activePreset.name}</span>
            </div>
          </>
        ) : (
          /* Empty / Upload Prompt State */
          <div
            onClick={onOpenUploadPhoto}
            className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-[#1a1c21] transition-colors w-full h-full"
          >
            <div className="w-14 h-14 rounded-full bg-[#1e2127] border border-[#2f343e] flex items-center justify-center mb-3 group-hover:border-[#d4af37]/60 group-hover:scale-105 transition-all">
              <ImageIcon className="w-6 h-6 text-[#d4af37]" />
            </div>
            <p className="text-sm font-semibold text-[#f4f3ef] mb-1">Upload 4:5 Photograph</p>
            <p className="text-xs text-[#9ba1a6] max-w-[220px]">
              Tap here or use the Upload Photo button below
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
