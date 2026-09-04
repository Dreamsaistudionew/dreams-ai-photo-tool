import { CountryId } from '../types';

export interface CountryFlagConfig {
  id: CountryId;
  name: string;
  emoji: string;
  colors: string[]; // 2 or 3 primary national colors as equal-width blocks
}

/**
 * 20 Supported Countries with their primary national colors.
 * Equal-width sections: 3 colors = 33.33% each; 2 colors = 50% each.
 * No flag artwork, symbols, crosses, stars, or emblems.
 */
export const countryFlags: Record<CountryId, CountryFlagConfig> = {
  france: {
    id: 'france',
    name: 'France',
    emoji: '🇫🇷',
    colors: ['#0055A4', '#FFFFFF', '#EF4135'], // Blue, White, Red
  },
  italy: {
    id: 'italy',
    name: 'Italy',
    emoji: '🇮🇹',
    colors: ['#009246', '#FFFFFF', '#CE2B37'], // Green, White, Red
  },
  usa: {
    id: 'usa',
    name: 'USA',
    emoji: '🇺🇸',
    colors: ['#B22234', '#FFFFFF', '#0A3161'], // Red, White, Blue
  },
  uk: {
    id: 'uk',
    name: 'UK',
    emoji: '🇬🇧',
    colors: ['#C8102E', '#FFFFFF', '#012169'], // Red, White, Blue
  },
  mexico: {
    id: 'mexico',
    name: 'Mexico',
    emoji: '🇲🇽',
    colors: ['#006847', '#FFFFFF', '#CE1126'], // Green, White, Red
  },
  germany: {
    id: 'germany',
    name: 'Germany',
    emoji: '🇩🇪',
    colors: ['#000000', '#DD0000', '#FFCE00'], // Black, Red, Gold
  },
  spain: {
    id: 'spain',
    name: 'Spain',
    emoji: '🇪🇸',
    colors: ['#AA151B', '#F1BF00', '#AA151B'], // Red, Yellow, Red
  },
  poland: {
    id: 'poland',
    name: 'Poland',
    emoji: '🇵🇱',
    colors: ['#FFFFFF', '#DC143C'], // White, Red
  },
  switzerland: {
    id: 'switzerland',
    name: 'Switzerland',
    emoji: '🇨🇭',
    colors: ['#DA291C', '#FFFFFF'], // Red, White
  },
  netherlands: {
    id: 'netherlands',
    name: 'Netherlands',
    emoji: '🇳🇱',
    colors: ['#AE1C28', '#FFFFFF', '#21468B'], // Red, White, Blue
  },
  austria: {
    id: 'austria',
    name: 'Austria',
    emoji: '🇦🇹',
    colors: ['#ED2939', '#FFFFFF', '#ED2939'], // Red, White, Red
  },
  denmark: {
    id: 'denmark',
    name: 'Denmark',
    emoji: '🇩🇰',
    colors: ['#C60C30', '#FFFFFF'], // Red, White
  },
  sweden: {
    id: 'sweden',
    name: 'Sweden',
    emoji: '🇸🇪',
    colors: ['#006AA7', '#FECC00'], // Blue, Yellow
  },
  ireland: {
    id: 'ireland',
    name: 'Ireland',
    emoji: '🇮🇪',
    colors: ['#169B62', '#FFFFFF', '#FF883E'], // Green, White, Orange
  },
  norway: {
    id: 'norway',
    name: 'Norway',
    emoji: '🇳🇴',
    colors: ['#BA0C2F', '#FFFFFF', '#00205B'], // Red, White, Blue
  },
  belgium: {
    id: 'belgium',
    name: 'Belgium',
    emoji: '🇧🇪',
    colors: ['#000000', '#FDDA24', '#EF3340'], // Black, Yellow, Red
  },
  portugal: {
    id: 'portugal',
    name: 'Portugal',
    emoji: '🇵🇹',
    colors: ['#006600', '#FF0000'], // Green, Red
  },
  greece: {
    id: 'greece',
    name: 'Greece',
    emoji: '🇬🇷',
    colors: ['#0D5EAF', '#FFFFFF'], // Blue, White
  },
  australia: {
    id: 'australia',
    name: 'Australia',
    emoji: '🇦🇺',
    colors: ['#00247D', '#FFFFFF', '#C8102E'], // Blue, White, Red
  },
  canada: {
    id: 'canada',
    name: 'Canada',
    emoji: '🇨🇦',
    colors: ['#FF0000', '#FFFFFF'], // Red, White
  },
};

/**
 * Ordered list of exactly the 20 requested countries.
 */
export const COUNTRIES_LIST: CountryFlagConfig[] = [
  countryFlags.france,
  countryFlags.italy,
  countryFlags.usa,
  countryFlags.uk,
  countryFlags.mexico,
  countryFlags.germany,
  countryFlags.spain,
  countryFlags.poland,
  countryFlags.switzerland,
  countryFlags.netherlands,
  countryFlags.austria,
  countryFlags.denmark,
  countryFlags.sweden,
  countryFlags.ireland,
  countryFlags.norway,
  countryFlags.belgium,
  countryFlags.portugal,
  countryFlags.greece,
  countryFlags.australia,
  countryFlags.canada,
];

/**
 * Draw equal-width color blocks across the entire canvas width at the bottom edge.
 * - 3 colors = exactly 33.33% each (3 equal sections)
 * - 2 colors = exactly 50% each (2 equal sections)
 * - Exact integer coordinates prevent subpixel rounding gaps or overlaps.
 */
export function drawCountryFlagStrip(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  countryId: CountryId = 'france'
): void {
  const config = countryFlags[countryId] || countryFlags.france;
  const stripHeight = Math.max(1, Math.round(canvasHeight * 0.008));
  const y = canvasHeight - stripHeight;
  const colors = config.colors;
  const count = colors.length;

  ctx.save();
  ctx.filter = 'none';
  ctx.globalAlpha = 1.0;
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < count; i++) {
    const startX = Math.round((canvasWidth * i) / count);
    const endX = Math.round((canvasWidth * (i + 1)) / count);
    ctx.fillStyle = colors[i];
    ctx.fillRect(startX, y, endX - startX, stripHeight);
  }

  ctx.restore();
}
