import { ColorPresetId, LogoPlacement, ExportResolutionMode } from '../types';
import { COLOR_PRESETS } from './colorPresets';
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
  placement: LogoPlacement;
  exportMode?: ExportResolutionMode;
  targetWidth?: number;
  targetHeight?: number;
  targetDpi?: number;
  onProgress?: (progress: number, text: string) => void;
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
  onProgress,
}: RenderPipelineOptions): Promise<Blob> {
  const effectivePhotoSource = photoSource || photoSrc;
  if (!effectivePhotoSource) {
    throw new Error('No photo source provided to render pipeline');
  }

  const effectiveLogoSource = logoSource !== undefined ? logoSource : logoSrc;
  const isLogoActive = Boolean(effectiveLogoSource && placement.opacity > 0);

  // CASE 1: DIRECT BIT-FOR-BIT PASSTHROUGH FOR ORIGINAL PNGs WITHOUT LOGO (Original mode or already 4K)
  if (presetId === 'original' && !isLogoActive) {
    const sourceBuffer = await getSourceArrayBuffer(effectivePhotoSource);
    if (sourceBuffer && isPngBuffer(sourceBuffer)) {
      const meta = await verifyPngMetadata(sourceBuffer);
      const isAlready4K = meta.width === targetWidth && meta.height === targetHeight;
      if (exportMode === 'original' || (exportMode === '4k' && isAlready4K)) {
        onProgress?.(40, 'Preserving 100% original pixel data bit-for-bit without re-encoding...');
        onProgress?.(80, `Injecting ${targetDpi} PPI resolution metadata...`);
        const finalPngBytes = setPngDpi(sourceBuffer, targetDpi);
        onProgress?.(100, `Lossless PNG ready (100% Bit-for-bit original pixels, ${targetDpi} DPI).`);
        return new Blob([finalPngBytes], { type: 'image/png' });
      }
    }
  }

  onProgress?.(15, 'Accessing full-resolution original photograph source...');
  const { drawable: photoDrawable, width: sourceWidth, height: sourceHeight, cleanup: cleanupPhoto } =
    await loadSourceDrawable(effectivePhotoSource);

  if (!sourceWidth || !sourceHeight) {
    cleanupPhoto();
    throw new Error('Could not determine source image dimensions');
  }

  // Determine final canvas dimensions
  const finalWidth = exportMode === '4k' ? targetWidth : sourceWidth;
  const finalHeight = exportMode === '4k' ? targetHeight : sourceHeight;

  onProgress?.(
    30,
    exportMode === '4k'
      ? `Allocating master 4K canvas (${finalWidth} × ${finalHeight}px, 4:5)...`
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
  const isExactDimensions = sourceWidth === finalWidth && sourceHeight === finalHeight;
  if (isExactDimensions) {
    // 1:1 pixel blit: disable smoothing to ensure zero softening
    ctx.imageSmoothingEnabled = false;
  } else {
    // High-quality upscale: use highest quality bicubic interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  // Apply color preset at render stage (or pure 'none' for original)
  const activePreset = COLOR_PRESETS.find((p) => p.id === presetId) || COLOR_PRESETS[0];
  if (presetId !== 'original' && activePreset.cssFilter && activePreset.cssFilter !== 'none') {
    onProgress?.(45, `Applying ${activePreset.name} tonal adjustment curve...`);
    ctx.filter = activePreset.cssFilter;
  } else {
    // Pure untouched original colors: zero filters, zero sharpening, zero smoothing, zero denoising
    ctx.filter = 'none';
  }

  onProgress?.(
    55,
    exportMode === '4k'
      ? `Upscaling photograph to master 4K (${finalWidth} × ${finalHeight}px)...`
      : `Drawing original pixels 1:1 at ${finalWidth} × ${finalHeight}px...`
  );

  if (exportMode === '4k') {
    // Calculate exact 4:5 source crop without any non-uniform axis stretching
    const targetRatio = finalWidth / finalHeight; // 3840 / 4800 = 0.8
    const sourceRatio = sourceWidth / (sourceHeight || 1);

    if (Math.abs(sourceRatio - targetRatio) < 0.001) {
      // Exact 4:5 match: Direct full-frame high-quality draw
      ctx.drawImage(photoDrawable, 0, 0, finalWidth, finalHeight);
    } else if (sourceRatio > targetRatio) {
      // Source is wider than 4:5 -> Center crop width uniformly without distortion
      const sWidth = sourceHeight * targetRatio;
      const sx = (sourceWidth - sWidth) / 2;
      ctx.drawImage(photoDrawable, sx, 0, sWidth, sourceHeight, 0, 0, finalWidth, finalHeight);
    } else {
      // Source is taller than 4:5 -> Center crop height uniformly without distortion
      const sHeight = sourceWidth / targetRatio;
      const sy = (sourceHeight - sHeight) / 2;
      ctx.drawImage(photoDrawable, 0, sy, sourceWidth, sHeight, 0, 0, finalWidth, finalHeight);
    }
  } else {
    // Original mode: 1:1 exact pixel draw
    ctx.drawImage(photoDrawable, 0, 0, finalWidth, finalHeight);
  }

  // Reset filter state
  ctx.filter = 'none';
  cleanupPhoto();

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
