export type ColorPresetId = 'original' | 'warm' | 'deep' | 'vintage' | 'soft-contrast' | 'rich-color';

export type ExportResolutionMode = '4k' | 'original';

export type TemplateId = 'classic' | 'facebook';

export interface StyledTextSpan {
  text: string;
  color: string;
}

export interface HookTextConfig {
  text: string;
  charColors?: string[]; // Hex color for each character index
  // Backward compatibility fields
  part1Text?: string;
  part1Color?: string;
  part2Text?: string;
  part2Color?: string;
  yellowText?: string;
  whiteText?: string;
  yellowColor?: string;
  whiteColor?: string;
}

export type CountryId =
  | 'france'
  | 'italy'
  | 'usa'
  | 'uk'
  | 'mexico'
  | 'germany'
  | 'spain'
  | 'poland'
  | 'switzerland'
  | 'netherlands'
  | 'austria'
  | 'denmark'
  | 'sweden'
  | 'ireland'
  | 'norway'
  | 'belgium'
  | 'portugal'
  | 'greece'
  | 'australia'
  | 'canada';

export interface ColorPreset {
  id: ColorPresetId;
  name: string;
  shortLabel: string;
  description: string;
  cssFilter: string;
}

export interface LogoPlacement {
  /** Relative center X (0.0 to 1.0) - default 0.94 (94%) */
  centerX: number;
  /** Relative center Y (0.0 to 1.0) - default 0.944 (94.4%) */
  centerY: number;
  /** Scale factor relative to master standard (1.0 = 7.8% of canvas width) */
  scale: number;
  /** Opacity (0.0 to 1.0) - default 1.0 */
  opacity: number;
}

export interface LoadedImage {
  src: string;
  file?: File;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  detectedDpi?: number | null;
}

export interface ExportProgress {
  isExporting: boolean;
  progress: number;
  statusText: string;
}

export interface Adjustments {
  brightness: number; // percentage (e.g. 50 - 150, default 100)
  contrast: number;   // percentage (e.g. 50 - 150, default 100)
}
