export const TEXT_MASTER_FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const TEXT_MASTER_FONT_WEIGHT = '900';
export const TEXT_MASTER_LETTER_SPACING_EM = -0.01;

export interface FitTextResult {
  fontSize: number;
  textWidth: number;
  availableWidth: number;
  paddingX: number;
  scaleRatio: number;
  letterSpacingEm: number;
  fontFamily: string;
  fontWeight: string;
}

// Persistent measurement canvas for high performance and zero DOM layout thrashing
let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

/**
 * Accurately measures the rendered width of a text string with specific font parameters,
 * accounting for font family, weight, size, and letter spacing.
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string = TEXT_MASTER_FONT_FAMILY,
  fontWeight: string = TEXT_MASTER_FONT_WEIGHT,
  letterSpacingEm: number = TEXT_MASTER_LETTER_SPACING_EM
): number {
  if (!text) return 0;
  if (typeof document === 'undefined') {
    return text.length * fontSize * 0.58;
  }
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureCanvas.width = 100;
    measureCanvas.height = 100;
    measureCtx = measureCanvas.getContext('2d');
  }
  if (!measureCtx) return text.length * fontSize * 0.58;

  measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let width = measureCtx.measureText(text).width;
  if (letterSpacingEm !== 0 && text.length > 1) {
    width += (text.length - 1) * (letterSpacingEm * fontSize);
  }
  return width;
}

/**
 * Calculates the exact automatic font size for the Text Master headline strip.
 *
 * Rules:
 * - Short text (e.g. "HELLO") -> uses larger font size (up to 56% of strip height).
 * - Longer text (e.g. "NEW PRODUCT AVAILABLE NOW AT A SPECIAL PRICE") -> automatically
 *   reduces font size until the complete text fits within the available width with horizontal padding.
 * - Minimum readable font size is respected so text never becomes illegible.
 * - Proportional scaling ensures Live Preview and 4K Export render identically.
 * - Text is guaranteed to stay within the strip, never wrap, never overflow, and never be clipped.
 */
export function calculateFitText({
  text,
  stripWidth,
  stripHeight,
  fontFamily = TEXT_MASTER_FONT_FAMILY,
  fontWeight = TEXT_MASTER_FONT_WEIGHT,
  letterSpacingEm = TEXT_MASTER_LETTER_SPACING_EM,
}: {
  text: string;
  stripWidth: number;
  stripHeight: number;
  fontFamily?: string;
  fontWeight?: string;
  letterSpacingEm?: number;
}): FitTextResult {
  // Horizontal padding: 3.5% of strip width (min 8px)
  const paddingX = Math.max(8, Math.round(stripWidth * 0.035));
  const availableWidth = Math.max(10, stripWidth - paddingX * 2);

  // Maximum font size: 56% of strip height (preserves comfortable top/bottom breathing space)
  const maxFontSize = Math.max(12, Math.round(stripHeight * 0.56));
  // Minimum readable font size: 20% of strip height (or min 9px on screen preview)
  const minFontSize = Math.max(9, Math.round(stripHeight * 0.20));

  const trimmedText = text || '';
  if (!trimmedText.trim()) {
    return {
      fontSize: maxFontSize,
      textWidth: 0,
      availableWidth,
      paddingX,
      scaleRatio: 1,
      letterSpacingEm,
      fontFamily,
      fontWeight,
    };
  }

  // 1. Measure at maximum font size
  const widthAtMax = measureTextWidth(trimmedText, maxFontSize, fontFamily, fontWeight, letterSpacingEm);

  if (widthAtMax <= availableWidth) {
    // Short text: fits comfortably at maximum font size
    return {
      fontSize: maxFontSize,
      textWidth: widthAtMax,
      availableWidth,
      paddingX,
      scaleRatio: 1,
      letterSpacingEm,
      fontFamily,
      fontWeight,
    };
  }

  // 2. Reduce font size proportionally to fit available width
  const targetFontSize = Math.floor(maxFontSize * (availableWidth / widthAtMax));
  let calculatedFontSize = Math.max(minFontSize, targetFontSize);

  // 3. Verify actual measured width at calculated font size
  let actualWidth = measureTextWidth(trimmedText, calculatedFontSize, fontFamily, fontWeight, letterSpacingEm);

  // 4. Fine-tune by decrementing if fractional rounding caused 1-2px overflow
  while (actualWidth > availableWidth && calculatedFontSize > minFontSize) {
    calculatedFontSize--;
    actualWidth = measureTextWidth(trimmedText, calculatedFontSize, fontFamily, fontWeight, letterSpacingEm);
  }

  // 5. If text is extraordinarily long and even at minFontSize it exceeds available width,
  // scaleRatio provides a safe horizontal compression factor so text never overflows or clips
  const scaleRatio = actualWidth > availableWidth ? availableWidth / actualWidth : 1;

  return {
    fontSize: calculatedFontSize,
    textWidth: actualWidth * scaleRatio,
    availableWidth,
    paddingX,
    scaleRatio,
    letterSpacingEm,
    fontFamily,
    fontWeight,
  };
}
