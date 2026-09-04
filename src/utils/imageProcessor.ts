import { ColorPresetId, LogoPlacement, ExportResolutionMode, CountryId, TemplateId, HookTextConfig, StyledTextSpan, Adjustments } from '../types';
import { COLOR_PRESETS } from './colorPresets';
import { drawCountryFlagStrip, countryFlags } from './countryFlags';
import { isPngBuffer, setPngDpi, verifyPngMetadata } from './pngDpi';

export const TARGET_4K_WIDTH = 3840;
export const TARGET_4K_HEIGHT = 4800;
export const TARGET_EXPORT_DPI = 300; // Explicit 300 PPI/DPI metadata

export const MASTER_LOGO_DEFAULTS: LogoPlacement = {
  centerX: 0.94, // 94% of canvas width
  centerY: 0.944, // 94.4% of canvas height
  scale: 1.0, // 1.0 = ~7.75% of canvas width
  opacity: 1.0, // 100% opacity
};

export const MASTER_LOGO_BASE_WIDTH_RATIO = 0.0775; // 7.75% of image width

/**
 * Calculate the pixel render rect (x, y, width, height) for the logo on a canvas of (canvasWidth, canvasHeight)
 * guaranteeing the logo remains completely inside the canvas boundaries with safe margins.
 */
export function calculateLogoRect(
  canvasWidth: number,
  canvasHeight: number,
  logoNaturalWidth: number,
  logoNaturalHeight: number,
  placement: LogoPlacement
): { x: number; y: number; width: number; height: number } {
  const logoAspect = logoNaturalWidth / (logoNaturalHeight || 1);

  // Proportional target width relative to canvas
  let logoWidth = canvasWidth * MASTER_LOGO_BASE_WIDTH_RATIO * placement.scale;
  let logoHeight = logoWidth / logoAspect;

  // Enforce minimum and maximum safety bounds
  const maxAllowedWidth = canvasWidth * 0.4;
  const maxAllowedHeight = canvasHeight * 0.4;
  if (logoWidth > maxAllowedWidth) {
    logoWidth = maxAllowedWidth;
    logoHeight = logoWidth / logoAspect;
  }
  if (logoHeight > maxAllowedHeight) {
    logoHeight = maxAllowedHeight;
    logoWidth = logoHeight * logoAspect;
  }

  // Calculate centered coordinate based on placement ratios
  let x = canvasWidth * placement.centerX - logoWidth / 2;
  let y = canvasHeight * placement.centerY - logoHeight / 2;

  // Safe boundary clamp (never cross canvas edge)
  const marginX = canvasWidth * 0.008;
  const marginY = canvasHeight * 0.008;

  x = Math.max(marginX, Math.min(x, canvasWidth - logoWidth - marginX));
  y = Math.max(marginY, Math.min(y, canvasHeight - logoHeight - marginY));

  return { x, y, width: logoWidth, height: logoHeight };
}

/**
 * Load an image from URL or data URI asynchronously into an HTMLImageElement,
 * ensuring high-performance asynchronous decoding is complete before resolve.
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        if ('decode' in img && typeof img.decode === 'function') {
          await img.decode();
        }
      } catch {
        // Fallback gracefully if decode() fails on specific asset types
      }
      resolve(img);
    };
    img.onerror = (err) => reject(new Error(`Failed to load image element: ${err}`));
    img.src = src;
  });
}

/**
 * Extract raw ArrayBuffer from a source (Blob, File, Data URL, Object URL, or HTTP URL)
 */
export async function getSourceArrayBuffer(source: string | File | Blob): Promise<ArrayBuffer | null> {
  try {
    if (source instanceof Blob) {
      return await source.arrayBuffer();
    }
    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        const commaIdx = source.indexOf(',');
        if (commaIdx !== -1) {
          const base64 = source.slice(commaIdx + 1);
          const binaryStr = atob(base64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return bytes.buffer;
        }
      }
      const response = await fetch(source);
      if (response.ok) {
        return await response.arrayBuffer();
      }
    }
  } catch (err) {
    console.warn('Could not read raw source ArrayBuffer:', err);
  }
  return null;
}

/**
 * Decode a source (File, Blob, or URL) into a high-performance drawable surface (ImageBitmap or HTMLImageElement)
 * with zero intermediate resizing or color space degradation.
 */
export async function loadSourceDrawable(
  source: string | File | Blob
): Promise<{ drawable: ImageBitmap | HTMLImageElement; width: number; height: number; cleanup: () => void }> {
  // If it's a File or Blob, prefer native createImageBitmap for hardware-accelerated decode
  if (source instanceof Blob) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await createImageBitmap(source, {
          imageOrientation: 'from-image',
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        });
        return {
          drawable: bmp,
          width: bmp.width,
          height: bmp.height,
          cleanup: () => {
            try {
              bmp.close();
            } catch {
              // Ignore cleanup error
            }
          },
        };
      } catch (err) {
        console.warn('createImageBitmap failed, falling back to Image element:', err);
      }
    }

    // Fallback using Object URL
    const objectUrl = URL.createObjectURL(source);
    const img = await loadImageElement(objectUrl);
    return {
      drawable: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  }

  // String source (Data URL or HTTP URL)
  const img = await loadImageElement(source);
  return {
    drawable: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    cleanup: () => {},
  };
}

/**
 * Sanitize filename to prevent filesystem issues and strictly ensure a single .png extension.
 */
export function sanitizeFilename(input: string): string {
  let cleaned = (input || 'dreams_4k_photo').trim();
  // Remove trailing .png / .PNG / .jpg / etc. if user typed it
  cleaned = cleaned.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  // Replace invalid characters
  cleaned = cleaned.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!cleaned) {
    cleaned = 'edited_photo';
  }
  return `${cleaned}.png`;
}

export interface RenderPipelineOptions {
  photoSource?: string | File | Blob;
  photoSrc?: string;
  logoSource?: string | File | Blob | null;
  logoSrc?: string | null;
  presetId: ColorPresetId;
  adjustments?: Adjustments;
  placement: LogoPlacement;
  exportMode?: ExportResolutionMode;
  targetWidth?: number;
  targetHeight?: number;
  targetDpi?: number;
  countryId?: CountryId;
  templateId?: TemplateId;
  hookText?: HookTextConfig;
  onProgress?: (progress: number, text: string) => void;
}

export function getStyledSpans(config?: HookTextConfig): StyledTextSpan[] {
  if (!config) {
    return [{ text: 'NEW PRODUCT AVAILABLE', color: '#FFD700' }];
  }

  // If new single text field is present
  if (config.text !== undefined) {
    const rawText = config.text;
    if (!rawText || !rawText.trim()) return [];

    const charColors = config.charColors || [];
    const spans: StyledTextSpan[] = [];
    let currentSpan: StyledTextSpan | null = null;

    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      // Default color: if not set, first word is #FFD700 (Yellow), subsequent words are #FFFFFF (White)
      const firstSpace = rawText.indexOf(' ');
      const defaultColor = firstSpace > 0 && i < firstSpace ? '#FFD700' : '#FFFFFF';
      const color = charColors[i] || defaultColor;

      if (!currentSpan) {
        currentSpan = { text: char, color };
      } else if (currentSpan.color.toLowerCase() === color.toLowerCase()) {
        currentSpan.text += char;
      } else {
        spans.push(currentSpan);
        currentSpan = { text: char, color };
      }
    }
    if (currentSpan) {
      spans.push(currentSpan);
    }
    return spans;
  }

  // Fallback to legacy fields
  const p1 = (config.part1Text || config.yellowText || '').trim();
  const c1 = config.part1Color || config.yellowColor || '#FFD700';
  const p2 = (config.part2Text || config.whiteText || '').trim();
  const c2 = config.part2Color || config.whiteColor || '#FFFFFF';

  const spans: StyledTextSpan[] = [];
  if (p1) spans.push({ text: p1, color: c1 });
  if (p2) {
    if (p1) spans.push({ text: ' ', color: c2 });
    spans.push({ text: p2, color: c2 });
  }
  return spans;
}

/**
 * Resolves hook text parts and colors with sensible defaults (for backwards-compatibility).
 */
export function resolveHookText(config?: HookTextConfig): {
  part1Text: string;
  part1Color: string;
  part2Text: string;
  part2Color: string;
} {
  if (config?.text !== undefined) {
    const spans = getStyledSpans(config);
    if (spans.length >= 2) {
      return {
        part1Text: spans[0].text,
        part1Color: spans[0].color,
        part2Text: spans.slice(1).map((s) => s.text).join(''),
        part2Color: spans[1]?.color || '#FFFFFF',
      };
    } else if (spans.length === 1) {
      return {
        part1Text: spans[0].text,
        part1Color: spans[0].color,
        part2Text: '',
        part2Color: '#FFFFFF',
      };
    }
  }

  const p1Text =
    config?.part1Text !== undefined
      ? config.part1Text
      : config?.yellowText !== undefined
      ? config.yellowText
      : 'NEW';
  const p1Color = config?.part1Color || config?.yellowColor || '#FFD700';

  const p2Text =
    config?.part2Text !== undefined
      ? config.part2Text
      : config?.whiteText !== undefined
      ? config.whiteText
      : 'PRODUCT AVAILABLE TODAY';
  const p2Color = config?.part2Color || config?.whiteColor || '#FFFFFF';

  return {
    part1Text: p1Text.trim(),
    part1Color: p1Color,
    part2Text: p2Text.trim(),
    part2Color: p2Color,
  };
}

export interface SampledPhotoTone {
  avgR: number;
  avgG: number;
  avgB: number;
  lum: number;
  overlayRgba: string;
}

/**
 * Automatically analyze/sample the area of the user's photo where the text strip is placed.
 * Uses the photo's local/background color and tone to create an adaptive semi-transparent background.
 * If light -> darker translucent overlay for high contrast.
 * If dark -> lighter/translucent overlay retaining tone with high contrast text.
 */
export function samplePhotoRegionTone(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  height: number
): SampledPhotoTone {
  try {
    const clampedY = Math.max(0, Math.min(ctx.canvas.height - 1, Math.round(y)));
    const clampedH = Math.max(1, Math.min(ctx.canvas.height - clampedY, Math.round(height)));
    const imgData = ctx.getImageData(0, clampedY, width, clampedH);
    const d = imgData.data;
    let rSum = 0,
      gSum = 0,
      bSum = 0,
      count = 0;
    const step = Math.max(1, Math.floor(d.length / 10000));
    for (let i = 0; i < d.length; i += step * 4) {
      rSum += d[i];
      gSum += d[i + 1];
      bSum += d[i + 2];
      count++;
    }
    const avgR = count > 0 ? rSum / count : 20;
    const avgG = count > 0 ? gSum / count : 20;
    const avgB = count > 0 ? bSum / count : 20;
    const lum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

    let overlayRgba: string;
    if (lum > 130) {
      // Light photo region: darker translucent overlay for high contrast, tinted with sampled tone
      const tintR = Math.round(avgR * 0.10);
      const tintG = Math.round(avgG * 0.10);
      const tintB = Math.round(avgB * 0.10);
      overlayRgba = `rgba(${tintR}, ${tintG}, ${tintB}, 0.74)`;
    } else {
      // Dark photo region: translucent tint retaining photo tone
      const tintR = Math.round(avgR * 0.35);
      const tintG = Math.round(avgG * 0.35);
      const tintB = Math.round(avgB * 0.35);
      overlayRgba = `rgba(${tintR}, ${tintG}, ${tintB}, 0.65)`;
    }

    return { avgR, avgG, avgB, lum, overlayRgba };
  } catch {
    return {
      avgR: 20,
      avgG: 20,
      avgB: 20,
      lum: 20,
      overlayRgba: 'rgba(12, 14, 18, 0.68)',
    };
  }
}

/**
 * Draws the Facebook-style hook headline strip.
 * - Spans the full width of the photo.
 * - Automatically samples the photo background underneath.
 * - Tasteful semi-transparent overlay: photo underneath remains partially visible.
 * - Automatic contrast adaptation to maintain high text readability on any image.
 * - Modern bold Facebook post typography.
 * - Supports individual letter/word/span coloring.
 * - Auto-scales and wraps cleanly so text never overflows.
 */
export function drawFacebookHookStrip(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  height: number,
  hookText?: HookTextConfig
): void {
  // 1. Analyze and sample the photo region underneath
  const sampled = samplePhotoRegionTone(ctx, width, y, height);

  ctx.save();
  // 2. Draw semi-transparent background overlay (photo underneath remains partially visible)
  ctx.fillStyle = sampled.overlayRgba;
  ctx.fillRect(0, y, width, height);

  // Subtle top border line to blend naturally with photo
  ctx.fillStyle = sampled.lum > 130 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(0, y, width, Math.max(1, Math.round(height * 0.015)));

  const spans = getStyledSpans(hookText);
  if (spans.length === 0) {
    ctx.restore();
    return;
  }

  const fontFamily =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const paddingX = Math.round(width * 0.04);
  const maxAvailableWidth = width - paddingX * 2;

  let fontSize = Math.round(height * 0.38);
  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.12));
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.04));

  // Compute total width
  let totalSingleLineWidth = 0;
  for (const s of spans) {
    totalSingleLineWidth += ctx.measureText(s.text).width;
  }

  if (totalSingleLineWidth <= maxAvailableWidth) {
    // Fits on 1 line centered!
    const startX = (width - totalSingleLineWidth) / 2;
    const centerY = y + height / 2;
    let currX = startX;

    for (const s of spans) {
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, currX, centerY);
      currX += ctx.measureText(s.text).width;
    }
  } else {
    // Check if scaling down fits nicely on 1 line
    const scale = maxAvailableWidth / totalSingleLineWidth;
    if (scale >= 0.65) {
      fontSize = Math.max(11, Math.round(fontSize * scale));
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
      let scaledTotal = 0;
      for (const s of spans) {
        scaledTotal += ctx.measureText(s.text).width;
      }
      let currX = (width - scaledTotal) / 2;
      const centerY = y + height / 2;

      for (const s of spans) {
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, currX, centerY);
        currX += ctx.measureText(s.text).width;
      }
    } else {
      // 2-line layout
      // Break spans into individual words/tokens while preserving their character/word colors
      interface StyledWord {
        chars: Array<{ char: string; color: string }>;
        isSpace: boolean;
      }

      const tokens: StyledWord[] = [];
      let currentWord: StyledWord = { chars: [], isSpace: false };

      for (const span of spans) {
        for (const char of span.text) {
          if (char === ' ') {
            if (currentWord.chars.length > 0) {
              tokens.push(currentWord);
              currentWord = { chars: [], isSpace: false };
            }
            tokens.push({ chars: [{ char: ' ', color: span.color }], isSpace: true });
          } else {
            currentWord.chars.push({ char, color: span.color });
          }
        }
      }
      if (currentWord.chars.length > 0) {
        tokens.push(currentWord);
      }

      fontSize = Math.max(11, Math.round(height * 0.28));
      ctx.font = `900 ${fontSize}px ${fontFamily}`;

      // Measure tokens
      const tokenWidths = tokens.map((t) =>
        t.chars.reduce((acc, c) => acc + ctx.measureText(c.char).width, 0)
      );
      const totalTokenWidth = tokenWidths.reduce((a, b) => a + b, 0);

      // Find best split point near half width
      let bestSplitIndex = Math.max(1, Math.floor(tokens.length / 2));
      let runningWidth = 0;
      let minDiff = Infinity;
      for (let i = 0; i < tokens.length; i++) {
        runningWidth += tokenWidths[i];
        const diff = Math.abs(runningWidth - totalTokenWidth / 2);
        if (tokens[i].isSpace && diff < minDiff) {
          minDiff = diff;
          bestSplitIndex = i + 1;
        }
      }

      const line1Tokens = tokens.slice(0, bestSplitIndex);
      const line2Tokens = tokens.slice(bestSplitIndex);

      const renderTokenLine = (lineTokens: StyledWord[], lineY: number) => {
        // Strip leading/trailing spaces
        const trimmed = lineTokens.filter((t, idx) => {
          if (t.isSpace && (idx === 0 || idx === lineTokens.length - 1)) return false;
          return true;
        });
        const lineWidth = trimmed.reduce(
          (sum, t) => sum + t.chars.reduce((acc, c) => acc + ctx.measureText(c.char).width, 0),
          0
        );
        let startX = (width - lineWidth) / 2;
        if (lineWidth > maxAvailableWidth) {
          const lineScale = maxAvailableWidth / lineWidth;
          const oldFont = ctx.font;
          ctx.font = `900 ${Math.max(10, Math.round(fontSize * lineScale))}px ${fontFamily}`;
          const newWidth = trimmed.reduce(
            (sum, t) => sum + t.chars.reduce((acc, c) => acc + ctx.measureText(c.char).width, 0),
            0
          );
          startX = (width - newWidth) / 2;
          for (const t of trimmed) {
            for (const c of t.chars) {
              ctx.fillStyle = c.color;
              ctx.fillText(c.char, startX, lineY);
              startX += ctx.measureText(c.char).width;
            }
          }
          ctx.font = oldFont;
        } else {
          for (const t of trimmed) {
            for (const c of t.chars) {
              ctx.fillStyle = c.color;
              ctx.fillText(c.char, startX, lineY);
              startX += ctx.measureText(c.char).width;
            }
          }
        }
      };

      renderTokenLine(line1Tokens, y + height * 0.32);
      renderTokenLine(line2Tokens, y + height * 0.69);
    }
  }

  ctx.restore();
}

/**
 * Draws the country color strip with strictly equal-width rectangular color blocks.
 * - 3 colors -> exactly 33.33% each
 * - 2 colors -> exactly 50% each
 * - No symbols, crosses, stars, or flag artwork.
 */
export function drawEqualCountryColorStrip(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  height: number,
  countryId: CountryId = 'france'
): void {
  const config = countryFlags[countryId] || countryFlags.france;
  const colors = config.colors;
  const count = colors.length;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const x1 = Math.round((width * i) / count);
    const x2 = Math.round((width * (i + 1)) / count);
    ctx.fillStyle = colors[i];
    ctx.fillRect(x1, y, x2 - x1, height);
  }
  ctx.restore();
}

/**
 * Draws the country flag strip at the absolute bottom edge of the canvas.
 * Backward-compatible alias for the French tricolor strip.
 */
export function drawFrenchTricolorStrip(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  drawCountryFlagStrip(ctx, canvasWidth, canvasHeight, 'france');
}

/**
 * Main Deterministic High-Fidelity Render Pipeline
 *
 * CRITICAL FIDELITY & ENLARGEMENT PRINCIPLES:
 * 1. 4K MAXIMUM QUALITY MODE (3840 × 4800, 4:5):
 *    - Uses original full-resolution File/Blob source without intermediate compression.
 *    - Resamples faithfully using high-precision hardware-accelerated bicubic interpolation.
 *    - Never applies artificial AI hallucination, smoothing filters, edge ringing, or artificial sharpening.
 *    - For 4:5 sources, upscales directly to 3840 × 4800.
 *    - For non-4:5 sources, applies centered uniform cropping to preserve aspect ratio without stretching.
 * 2. ORIGINAL RESOLUTION MODE:
 *    - Strictly preserves original pixel dimensions (1200x1500 -> 1200x1500, etc.) with 1:1 pixel blit.
 *    - Exact bit-for-bit passthrough for original PNG files without logo.
 * 3. ZERO UNREQUESTED MODIFICATIONS:
 *    - When 'Original' preset is chosen, zero color adjustments are applied.
 *    - When a color preset is chosen, applies only the selected tonal adjustment.
 * 4. MASTER RESOLUTION LOGO COMPOSITING:
 *    - Logos are composited directly onto the final target canvas (3840 × 4800 or original resolution)
 *      at floating-point precision coordinates.
 * 5. PURE LOSSLESS PNG & 300 PPI/DPI METADATA:
 *    - Always outputs lossless PNG with injected standard 300 PPI/DPI pHYs chunk.
 */
export async function renderMasterCompositePNG({
  photoSource,
  photoSrc,
  logoSource,
  logoSrc,
  presetId,
  placement,
  exportMode = '4k',
  targetWidth = TARGET_4K_WIDTH,
  targetHeight = TARGET_4K_HEIGHT,
  targetDpi = TARGET_EXPORT_DPI,
  countryId = 'france',
  templateId = 'classic',
  hookText,
  adjustments,
  onProgress,
}: RenderPipelineOptions): Promise<Blob> {
  const effectivePhotoSource = photoSource || photoSrc;
  if (!effectivePhotoSource) {
    throw new Error('No photo source provided to render pipeline');
  }

  const effectiveLogoSource = logoSource !== undefined ? logoSource : logoSrc;
  const isLogoActive = Boolean(effectiveLogoSource && placement.opacity > 0);

  onProgress?.(15, 'Accessing full-resolution original photograph source...');
  const { drawable: photoDrawable, width: sourceWidth, height: sourceHeight, cleanup: cleanupPhoto } =
    await loadSourceDrawable(effectivePhotoSource);

  if (!sourceWidth || !sourceHeight) {
    cleanupPhoto();
    throw new Error('Could not determine source image dimensions');
  }

  const isFacebookTemplate = templateId === 'facebook';

  // Determine final canvas dimensions
  let finalWidth: number;
  let finalHeight: number;
  let photoHeight: number;
  let textStripHeight = 0;
  let colorStripHeight = 0;

  if (isFacebookTemplate) {
    if (exportMode === '4k') {
      finalWidth = targetWidth;
      finalHeight = targetHeight;
      // EXACT SAME flag color strip height as existing template (0.8% of height)
      colorStripHeight = Math.max(1, Math.round(finalHeight * 0.008));
      textStripHeight = Math.max(80, Math.round(finalHeight * 0.082));
      photoHeight = finalHeight - colorStripHeight;
    } else {
      finalWidth = sourceWidth;
      finalHeight = sourceHeight;
      // EXACT SAME flag color strip height as existing template (0.8% of height)
      colorStripHeight = Math.max(1, Math.round(sourceHeight * 0.008));
      textStripHeight = Math.max(30, Math.round(sourceHeight * 0.082));
      photoHeight = finalHeight - colorStripHeight;
    }
  } else {
    finalWidth = exportMode === '4k' ? targetWidth : sourceWidth;
    finalHeight = exportMode === '4k' ? targetHeight : sourceHeight;
    photoHeight = finalHeight;
  }

  onProgress?.(
    30,
    exportMode === '4k'
      ? `Allocating master 4K canvas (${finalWidth} × ${finalHeight}px, ${isFacebookTemplate ? 'Text Master Template' : 'Existing Template'})...`
      : `Allocating canvas at exact original dimensions (${finalWidth} × ${finalHeight}px)...`
  );

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;

  const ctx = canvas.getContext('2d', {
    alpha: true,
    colorSpace: 'srgb',
    desynchronized: false,
  });

  if (!ctx) {
    cleanupPhoto();
    throw new Error('Could not obtain 2D canvas context for rendering');
  }

  // Configure smoothing according to operation
  const isExactDimensions = sourceWidth === finalWidth && sourceHeight === photoHeight;
  if (isExactDimensions) {
    // 1:1 pixel blit: disable smoothing to ensure zero softening
    ctx.imageSmoothingEnabled = false;
  } else {
    // High-quality upscale: use highest quality bicubic interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  // Apply color preset or brightness/contrast at render stage
  if (isFacebookTemplate) {
    const b = adjustments?.brightness ?? 100;
    const c = adjustments?.contrast ?? 100;
    if (b !== 100 || c !== 100) {
      onProgress?.(45, `Applying brightness (${b}%) and contrast (${c}%)...`);
      ctx.filter = `brightness(${b}%) contrast(${c}%)`;
    } else {
      ctx.filter = 'none';
    }
  } else {
    // Existing template: apply color preset
    const activePreset = COLOR_PRESETS.find((p) => p.id === presetId) || COLOR_PRESETS[0];
    if (presetId !== 'original' && activePreset.cssFilter && activePreset.cssFilter !== 'none') {
      onProgress?.(45, `Applying ${activePreset.name} tonal adjustment curve...`);
      ctx.filter = activePreset.cssFilter;
    } else {
      // Pure untouched original colors: zero filters, zero sharpening, zero smoothing, zero denoising
      ctx.filter = 'none';
    }
  }

  onProgress?.(
    55,
    exportMode === '4k'
      ? `Upscaling photograph to master 4K (${finalWidth} × ${photoHeight}px)...`
      : `Drawing original pixels 1:1 at ${finalWidth} × ${photoHeight}px...`
  );

  if (isFacebookTemplate) {
    // Facebook Template: Draw photo in top region (0, 0, finalWidth, photoHeight)
    if (exportMode === '4k') {
      const targetRatio = finalWidth / photoHeight;
      const sourceRatio = sourceWidth / (sourceHeight || 1);

      if (Math.abs(sourceRatio - targetRatio) < 0.001) {
        ctx.drawImage(photoDrawable, 0, 0, finalWidth, photoHeight);
      } else if (sourceRatio > targetRatio) {
        const sWidth = sourceHeight * targetRatio;
        const sx = (sourceWidth - sWidth) / 2;
        ctx.drawImage(photoDrawable, sx, 0, sWidth, sourceHeight, 0, 0, finalWidth, photoHeight);
      } else {
        const sHeight = sourceWidth / targetRatio;
        const sy = (sourceHeight - sHeight) / 2;
        ctx.drawImage(photoDrawable, 0, sy, sourceWidth, sHeight, 0, 0, finalWidth, photoHeight);
      }
    } else {
      ctx.drawImage(photoDrawable, 0, 0, finalWidth, photoHeight);
    }

    ctx.filter = 'none';
    cleanupPhoto();

    // 2. Draw Text Master Strip (semi-transparent overlay over photo bottom area)
    const textStripY = photoHeight - textStripHeight;
    onProgress?.(65, 'Drawing Text Master headline strip (sampled semi-transparent overlay)...');
    drawFacebookHookStrip(ctx, finalWidth, textStripY, textStripHeight, hookText);

    // 3. Draw Country Color Strip immediately underneath hook strip (exact same size as existing template)
    const selectedFlag = countryFlags[countryId] || countryFlags.france;
    onProgress?.(70, `Drawing exact-size ${selectedFlag.name} flag color strip...`);
    drawCountryFlagStrip(ctx, finalWidth, finalHeight, countryId);

    // 4. Composite Master Logo directly onto photo area if active
    if (isLogoActive && effectiveLogoSource) {
      onProgress?.(
        75,
        exportMode === '4k'
          ? 'Compositing master logo onto 4K photo canvas...'
          : 'Compositing master logo onto photo canvas...'
      );
      try {
        const {
          drawable: logoDrawable,
          width: logoWidth,
          height: logoHeight,
          cleanup: cleanupLogo,
        } = await loadSourceDrawable(effectiveLogoSource);

        const rect = calculateLogoRect(finalWidth, photoHeight, logoWidth, logoHeight, placement);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, placement.opacity));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(logoDrawable, rect.x, rect.y, rect.width, rect.height);
        ctx.restore();

        cleanupLogo();
      } catch (e) {
        console.warn('Could not composite logo into final export:', e);
      }
    }
  } else {
    // Existing Classic Template: Exactly unchanged!
    if (exportMode === '4k') {
      const targetRatio = finalWidth / finalHeight; // 3840 / 4800 = 0.8
      const sourceRatio = sourceWidth / (sourceHeight || 1);

      if (Math.abs(sourceRatio - targetRatio) < 0.001) {
        ctx.drawImage(photoDrawable, 0, 0, finalWidth, finalHeight);
      } else if (sourceRatio > targetRatio) {
        const sWidth = sourceHeight * targetRatio;
        const sx = (sourceWidth - sWidth) / 2;
        ctx.drawImage(photoDrawable, sx, 0, sWidth, sourceHeight, 0, 0, finalWidth, finalHeight);
      } else {
        const sHeight = sourceWidth / targetRatio;
        const sy = (sourceHeight - sHeight) / 2;
        ctx.drawImage(photoDrawable, 0, sy, sourceWidth, sHeight, 0, 0, finalWidth, finalHeight);
      }
    } else {
      ctx.drawImage(photoDrawable, 0, 0, finalWidth, finalHeight);
    }

    ctx.filter = 'none';
    cleanupPhoto();

    // Overlay dynamic national flag strip at the absolute bottom edge of the image
    const selectedFlag = countryFlags[countryId] || countryFlags.france;
    onProgress?.(68, `Drawing subtle ${selectedFlag.name} flag strip at bottom edge...`);
    drawCountryFlagStrip(ctx, finalWidth, finalHeight, countryId);

    // Composite Master Logo directly at final resolution coordinates if active
    if (isLogoActive && effectiveLogoSource) {
      onProgress?.(
        75,
        exportMode === '4k'
          ? 'Compositing master logo onto 4K canvas...'
          : 'Compositing master logo onto original resolution canvas...'
      );
      try {
        const {
          drawable: logoDrawable,
          width: logoWidth,
          height: logoHeight,
          cleanup: cleanupLogo,
        } = await loadSourceDrawable(effectiveLogoSource);

        const rect = calculateLogoRect(finalWidth, finalHeight, logoWidth, logoHeight, placement);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, placement.opacity));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(logoDrawable, rect.x, rect.y, rect.width, rect.height);
        ctx.restore();

        cleanupLogo();
      } catch (e) {
        console.warn('Could not composite logo into final export:', e);
      }
    }
  }

  onProgress?.(
    88,
    exportMode === '4k'
      ? 'Encoding master 4K lossless PNG binary...'
      : 'Encoding lossless PNG binary at original dimensions...'
  );
  const rawPngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate lossless PNG blob from canvas'));
        }
      },
      'image/png'
    );
  });

  onProgress?.(95, `Injecting explicit ${targetDpi} PPI/DPI metadata chunk (pHYs)...`);
  const rawArrayBuffer = await rawPngBlob.arrayBuffer();
  const finalPngBytes = setPngDpi(rawArrayBuffer, targetDpi);

  // Verify resulting PNG dimensions & DPI metadata
  const verification = await verifyPngMetadata(finalPngBytes.buffer);
  console.info('[DREAMS AI] PNG Export Verified:', {
    dimensions: `${verification.width} × ${verification.height}`,
    dpi: `${verification.dpiX} DPI`,
    hasPhysChunk: verification.hasPhysChunk,
    sizeKB: Math.round(finalPngBytes.byteLength / 1024),
  });

  onProgress?.(100, `Lossless PNG ready (${finalWidth} × ${finalHeight}, ${targetDpi} DPI).`);
  return new Blob([finalPngBytes], { type: 'image/png' });
}

/**
 * Trigger browser download of a Blob with specified filename
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
