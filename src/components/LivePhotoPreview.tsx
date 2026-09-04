import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ColorPresetId, LoadedImage, LogoPlacement, CountryId, TemplateId, HookTextConfig, Adjustments } from '../types';
import { COLOR_PRESETS } from '../utils/colorPresets';
import { calculateLogoRect, getStyledSpans } from '../utils/imageProcessor';
import { countryFlags } from '../utils/countryFlags';
import { Eye, EyeOff, Sparkles, Image as ImageIcon } from 'lucide-react';

interface LivePhotoPreviewProps {
  photo: LoadedImage | null;
  logo: LoadedImage | null;
  selectedPreset: ColorPresetId;
  logoPlacement: LogoPlacement;
  selectedCountry?: CountryId;
  templateId?: TemplateId;
  hookText?: HookTextConfig;
  adjustments?: Adjustments;
  onOpenUploadPhoto?: () => void;
}

export const LivePhotoPreview: React.FC<LivePhotoPreviewProps> = ({
  photo,
  logo,
  selectedPreset,
  logoPlacement,
  selectedCountry = 'france',
  templateId = 'classic',
  hookText,
  adjustments,
  onOpenUploadPhoto,
}) => {
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 500 });

  // Dynamically sampled background tone from the photo
  const [sampledTone, setSampledTone] = useState<{ overlayRgba: string; lum: number }>({
    overlayRgba: 'rgba(12, 14, 18, 0.68)',
    lum: 30,
  });

  // Update container pixel dimensions
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
  const currentCountryConfig = countryFlags[selectedCountry] || countryFlags.france;
  const isFacebook = templateId === 'facebook';

  // Compute active filter for preview (brightness/contrast for Text Master, or preset for Existing)
  const activeFilter = useMemo(() => {
    if (isFacebook) {
      const b = adjustments?.brightness ?? 100;
      const c = adjustments?.contrast ?? 100;
      if (b !== 100 || c !== 100) {
        return `brightness(${b}%) contrast(${c}%)`;
      }
      return 'none';
    }
    return activePreset.cssFilter;
  }, [isFacebook, adjustments?.brightness, adjustments?.contrast, activePreset.cssFilter]);

  // Analyze and sample the photo's lower region for natural adaptive background
  useEffect(() => {
    if (!photo?.src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.src;
    img.onload = () => {
      try {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 64;
        sampleCanvas.height = 64;
        const ctx = sampleCanvas.getContext('2d');
        if (!ctx) return;
        if (activeFilter && activeFilter !== 'none') {
          ctx.filter = activeFilter;
        }
        ctx.drawImage(img, 0, 0, 64, 64);
        // Sample bottom 15% where the hook strip is placed
        const startY = Math.floor(64 * 0.82);
        const sampleH = Math.max(1, 64 - startY);
        const imgData = ctx.getImageData(0, startY, 64, sampleH);
        const d = imgData.data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
          count++;
        }
        const avgR = count > 0 ? r / count : 20;
        const avgG = count > 0 ? g / count : 20;
        const avgB = count > 0 ? b / count : 20;
        const lum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

        let overlayRgba: string;
        if (lum > 130) {
          // Light photo background: darker translucent overlay for high contrast
          const tintR = Math.round(avgR * 0.10);
          const tintG = Math.round(avgG * 0.10);
          const tintB = Math.round(avgB * 0.10);
          overlayRgba = `rgba(${tintR}, ${tintG}, ${tintB}, 0.74)`;
        } else {
          // Dark photo background: translucent tint retaining photo tone
          const tintR = Math.round(avgR * 0.35);
          const tintG = Math.round(avgG * 0.35);
          const tintB = Math.round(avgB * 0.35);
          overlayRgba = `rgba(${tintR}, ${tintG}, ${tintB}, 0.65)`;
        }
        setSampledTone({ overlayRgba, lum });
      } catch {
        // Fallback
      }
    };
  }, [photo?.src, activeFilter]);

  // EXACT same flag color strip size across BOTH templates (0.8% of preview height)
  const colorStripHeight = Math.max(2, Math.round(containerSize.height * 0.008));
  const textStripHeight = isFacebook
    ? Math.max(34, Math.round(containerSize.height * 0.082))
    : 0;

  // Resolve styled spans for Facebook hook text
  const styledSpans = useMemo(() => {
    return getStyledSpans(hookText);
  }, [hookText]);

  // Calculate logo position for preview within the photograph
  const logoRect = logo
    ? calculateLogoRect(
        containerSize.width,
        containerSize.height - (isFacebook ? textStripHeight + colorStripHeight : colorStripHeight),
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
            LIVE PREVIEW {isFacebook ? '(TEXT MASTER)' : '(EXISTING TEMPLATE)'}
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

      {/* Main Large Preview Stage */}
      <div
        ref={containerRef}
        id="preview-stage-container"
        className="relative w-full max-w-[460px] aspect-[4/5] bg-[#16181d] rounded-xl overflow-hidden border border-[#2a2e38] shadow-2xl flex flex-col justify-between group select-none"
      >
        {photo ? (
          <div className="relative w-full h-full overflow-hidden">
            {/* 1. PHOTOGRAPH (Extends down to the flag strip; visible underneath the semi-transparent text strip) */}
            <img
              src={photo.src}
              alt="Live Photograph"
              className="w-full h-full object-cover transition-[filter] duration-200"
              style={{
                filter: isComparingOriginal ? 'none' : activeFilter,
              }}
              draggable={false}
            />

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/10" />

            {/* Master Composited Logo (Hidden when comparing original) */}
            {logo && !isComparingOriginal && logoRect && (
              <div
                className="absolute pointer-events-none transition-all duration-150 z-10"
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

            {/* Floating Preset & Country Color Strip Badge */}
            <div className="absolute top-2.5 left-2.5 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded bg-[#121316]/85 backdrop-blur-md border border-white/10 text-[10px] text-[#f4f3ef] font-medium tracking-wide z-30 shadow-lg">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>
                  {isComparingOriginal
                    ? 'Original (Untouched)'
                    : isFacebook
                    ? 'Text Master'
                    : activePreset.name}
                </span>
              </div>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-1.5">
                <div className="flex h-2 w-3.5 rounded-xs overflow-hidden border border-white/20">
                  {currentCountryConfig.colors.map((c, i) => (
                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-[#e1e4ea]">{currentCountryConfig.name}</span>
              </div>
            </div>

            {/* 2. TEXT MASTER STRIP (Semi-transparent overlay sampled from photo, positioned directly above flag strip) */}
            {isFacebook && (
              <div
                id="text-master-strip-preview"
                className="absolute left-0 right-0 z-20 flex items-center justify-center px-3.5 text-center backdrop-blur-md transition-colors border-t border-white/10 overflow-hidden"
                style={{
                  bottom: `${colorStripHeight}px`,
                  height: `${textStripHeight}px`,
                  backgroundColor: sampledTone.overlayRgba,
                }}
              >
                <div className="flex items-center justify-center flex-wrap gap-x-1.5 gap-y-0.5 max-w-full">
                  {styledSpans.length > 0 ? (
                    styledSpans.map((span, idx) => (
                      <span
                        key={idx}
                        className="font-black text-xs sm:text-sm tracking-tight leading-tight inline-block whitespace-pre"
                        style={{
                          color: span.color,
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {span.text}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#9ba1a6] text-[11px] font-medium italic">
                      [Enter Hook Strip Text Below]
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 3. COUNTRY COLOR STRIP (Exact same height and style across both templates at absolute bottom edge) */}
            <div
              id="country-flag-strip-preview"
              className="absolute bottom-0 left-0 right-0 w-full pointer-events-none flex z-30 shrink-0"
              style={{
                height: `${colorStripHeight}px`,
              }}
            >
              {currentCountryConfig.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
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
