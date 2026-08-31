import { ColorPreset, ColorPresetId } from '../types';

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'original',
    name: 'Original',
    shortLabel: 'Original',
    description: 'Completely untouched source photo with zero color or tonal modifications.',
    cssFilter: 'none',
  },
  {
    id: 'warm',
    name: 'Warm',
    shortLabel: 'Warm',
    description: 'Gentle warm color shift with subtle amber radiance.',
    cssFilter: 'sepia(0.12) saturate(1.04) brightness(1.01) hue-rotate(-2deg)',
  },
  {
    id: 'deep',
    name: 'Deep',
    shortLabel: 'Deep',
    description: 'Subtle deeper tonal richness with preserved shadow details.',
    cssFilter: 'contrast(1.06) brightness(0.97) saturate(1.03)',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    shortLabel: 'Vintage',
    description: 'Subtle classic vintage-inspired color rendering with delicate highlights.',
    cssFilter: 'sepia(0.18) contrast(0.98) brightness(1.02) saturate(0.96)',
  },
  {
    id: 'soft-contrast',
    name: 'Soft Contrast',
    shortLabel: 'Soft',
    description: 'Gentle contrast relaxation with smooth tonal gradations.',
    cssFilter: 'contrast(0.93) brightness(1.02) saturate(0.98)',
  },
  {
    id: 'rich-color',
    name: 'Rich Color',
    shortLabel: 'Rich',
    description: 'Slightly richer, naturally elevated color vibrance.',
    cssFilter: 'saturate(1.14) contrast(1.03) brightness(1.0)',
  },
];

/**
 * Apply deterministic color transformation to Canvas ImageData.
 * Exactly matches preset specifications without modifying geometry, sharpness, or textures.
 */
export function applyPresetToImageData(
  imageData: ImageData,
  presetId: ColorPresetId
): ImageData {
  if (presetId === 'original') {
    // Strictly ZERO modification
    return imageData;
  }

  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // Alpha data[i + 3] remains unchanged

    switch (presetId) {
      case 'warm': {
        // Subtle warm shift (+4% red, -2% blue, gentle midtone amber)
        r = Math.min(255, r * 1.035 + (255 - r) * 0.015);
        g = Math.min(255, g * 1.01);
        b = Math.max(0, b * 0.97);
        break;
      }
      case 'deep': {
        // Subtle deeper tonal curve (slight contrast boost + rich shadows, no clipping)
        const nr = r / 255;
        const ng = g / 255;
        const nb = b / 255;
        // Mild S-curve
        r = Math.min(255, Math.max(0, (nr < 0.5 ? 2 * nr * nr : 1 - 2 * (1 - nr) * (1 - nr)) * 0.12 + nr * 0.88) * 255 * 0.98);
        g = Math.min(255, Math.max(0, (ng < 0.5 ? 2 * ng * ng : 1 - 2 * (1 - ng) * (1 - ng)) * 0.12 + ng * 0.88) * 255 * 0.98);
        b = Math.min(255, Math.max(0, (nb < 0.5 ? 2 * nb * nb : 1 - 2 * (1 - nb) * (1 - nb)) * 0.12 + nb * 0.88) * 255 * 0.98);
        break;
      }
      case 'vintage': {
        // Delicate vintage film tone: slight warm tint, slight shadow lift (+3)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.min(255, (r * 0.88 + gray * 0.12) * 1.04 + 3);
        g = Math.min(255, (g * 0.92 + gray * 0.08) * 1.01 + 2);
        b = Math.min(255, (b * 0.84 + gray * 0.16) * 0.95 + 1);
        break;
      }
      case 'soft-contrast': {
        // Subtle softened contrast (-7% from midpoint 128)
        r = Math.min(255, Math.max(0, (r - 128) * 0.93 + 128 + 2));
        g = Math.min(255, Math.max(0, (g - 128) * 0.93 + 128 + 2));
        b = Math.min(255, Math.max(0, (b - 128) * 0.93 + 128 + 2));
        break;
      }
      case 'rich-color': {
        // Natural vibrance enhancement (+12% saturation relative to luminance)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.min(255, Math.max(0, gray + (r - gray) * 1.13));
        g = Math.min(255, Math.max(0, gray + (g - gray) * 1.13));
        b = Math.min(255, Math.max(0, gray + (b - gray) * 1.13));
        break;
      }
    }

    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
  }

  return imageData;
}
