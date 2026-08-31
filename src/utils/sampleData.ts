/**
 * Sample 4:5 photograph and sample watermark logo
 * Used as fallback / initial demo until user uploads their custom files.
 */

// Elegant high-res 4:5 portrait photo (Unsplash classic portrait, 4:5 vertical 1200x1500)
export const DEFAULT_PHOTO_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&h=1500&q=85';

export const DEFAULT_PHOTO_NAME = 'dreams_portrait_01.jpg';

// Elegant SVG logo with transparency (DREAMS AI signature emblem)
export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <circle cx="120" cy="120" r="108" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.85"/>
  <circle cx="120" cy="120" r="92" stroke="%23d4af37" stroke-width="1.5" stroke-opacity="0.75" stroke-dasharray="3 3"/>
  <path d="M75 145 C75 100, 105 75, 120 75 C135 75, 165 100, 165 145 C150 135, 135 130, 120 130 C105 130, 90 135, 75 145 Z" fill="%23ffffff" fill-opacity="0.95"/>
  <circle cx="120" cy="100" r="14" fill="%23d4af37"/>
  <text x="120" y="185" font-family="'Cinzel', 'Times New Roman', serif" font-size="19" font-weight="700" fill="%23ffffff" text-anchor="middle" letter-spacing="4">DREAMS</text>
  <text x="120" y="202" font-family="'Plus Jakarta Sans', sans-serif" font-size="9.5" font-weight="600" fill="%23d4af37" text-anchor="middle" letter-spacing="3">STUDIO</text>
</svg>`;

export const DEFAULT_LOGO_NAME = 'dreams_signature_logo.svg';
