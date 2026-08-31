/**
 * Utilities for detecting image DPI/PPI metadata (PNG pHYs, JPEG JFIF / EXIF)
 * and encoding/injecting explicit 300 PPI/DPI pHYs metadata chunk into output PNGs.
 */

// CRC-32 Lookup Table for standard IEEE 802.3 PNG chunk checksums
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

/**
 * Calculate CRC32 checksum over a buffer range
 */
export function calculateCrc32(buf: Uint8Array, offset = 0, length = buf.length): number {
  let c = 0xffffffff;
  for (let i = offset; i < offset + length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Creates a PNG pHYs chunk for the specified DPI (defaults to 300 DPI).
 * 
 * 1 inch = 0.0254 meters
 * 300 DPI = 300 / 0.0254 ≈ 11811.0236 pixels per meter (ppu)
 * 
 * pHYs chunk structure (21 bytes total):
 * - 4 bytes: Length (0x00000009)
 * - 4 bytes: Chunk Type ("pHYs" = 0x70 0x48 0x59 0x73)
 * - 4 bytes: Pixels per unit, X axis (unsigned 32-bit int)
 * - 4 bytes: Pixels per unit, Y axis (unsigned 32-bit int)
 * - 1 byte:  Unit specifier (1 = metre)
 * - 4 bytes: CRC32 checksum over Type + Data (13 bytes)
 */
export function createPhysChunk(dpi = 300): Uint8Array {
  // Convert DPI to pixels per meter (unit = 1)
  const ppu = Math.round(dpi / 0.0254); // For 300 DPI: 11811

  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);

  // 1. Length = 9
  view.setUint32(0, 9, false);

  // 2. Chunk Type: 'pHYs'
  chunk[4] = 0x70; // 'p'
  chunk[5] = 0x48; // 'H'
  chunk[6] = 0x59; // 'Y'
  chunk[7] = 0x73; // 's'

  // 3. Data: X pixels per meter (big-endian)
  view.setUint32(8, ppu, false);

  // 4. Data: Y pixels per meter (big-endian)
  view.setUint32(12, ppu, false);

  // 5. Data: Unit specifier (1 = meter)
  chunk[16] = 1;

  // 6. CRC32 over bytes 4..16 (Type + Data = 13 bytes)
  const crc = calculateCrc32(chunk, 4, 13);
  view.setUint32(17, crc, false);

  return chunk;
}

/**
 * Checks if a given buffer has a valid 8-byte PNG signature
 */
export function isPngBuffer(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

/**
 * Injects or updates the 300 PPI/DPI pHYs chunk into a PNG ArrayBuffer.
 * Places the pHYs chunk immediately following the IHDR chunk.
 */
export function setPngDpi(pngBuffer: ArrayBuffer, dpi = 300): Uint8Array {
  const bytes = new Uint8Array(pngBuffer);

  // Verify standard 8-byte PNG signature: 137 80 78 71 13 10 26 10
  if (bytes.length < 33 || !isPngBuffer(bytes)) {
    throw new Error('Invalid PNG signature');
  }

  // Parse existing chunks to locate and strip any preexisting pHYs chunk
  let pos = 8;
  const chunks: { type: string; start: number; end: number; dataStart: number; length: number }[] = [];

  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) break;
    const length = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const chunkStart = pos;
    const chunkEnd = pos + 12 + length; // 4 (len) + 4 (type) + length (data) + 4 (crc)

    chunks.push({
      type,
      start: chunkStart,
      end: chunkEnd,
      dataStart: pos + 8,
      length,
    });

    pos = chunkEnd;
  }

  const physChunk = createPhysChunk(dpi);

  // Filter out any existing pHYs chunk so we don't duplicate it
  const nonPhysChunks = chunks.filter((c) => c.type !== 'pHYs');

  // Calculate total new size
  let totalSize = 8; // Signature
  for (const c of nonPhysChunks) {
    totalSize += c.end - c.start;
  }
  totalSize += physChunk.length;

  const result = new Uint8Array(totalSize);
  // Copy 8-byte PNG signature
  result.set(bytes.subarray(0, 8), 0);
  let writePos = 8;

  let insertedPhys = false;

  for (const c of nonPhysChunks) {
    // Copy chunk
    const chunkData = bytes.subarray(c.start, c.end);
    result.set(chunkData, writePos);
    writePos += chunkData.length;

    // Immediately after IHDR chunk, insert our pHYs chunk
    if (c.type === 'IHDR' && !insertedPhys) {
      result.set(physChunk, writePos);
      writePos += physChunk.length;
      insertedPhys = true;
    }
  }

  // Fallback if no IHDR found
  if (!insertedPhys) {
    result.set(physChunk, writePos);
  }

  return result;
}

/**
 * Inspect a PNG blob or buffer to verify its pixel dimensions and DPI metadata.
 */
export async function verifyPngMetadata(bufferOrBlob: ArrayBuffer | Blob): Promise<{
  width: number;
  height: number;
  dpiX: number | null;
  dpiY: number | null;
  hasPhysChunk: boolean;
}> {
  const buffer = bufferOrBlob instanceof Blob ? await bufferOrBlob.arrayBuffer() : bufferOrBlob;
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (bytes.length < 33) {
    return { width: 0, height: 0, dpiX: null, dpiY: null, hasPhysChunk: false };
  }

  let width = 0;
  let height = 0;
  let dpiX: number | null = null;
  let dpiY: number | null = null;
  let hasPhysChunk = false;

  let pos = 8;
  while (pos + 8 <= bytes.length) {
    const length = view.getUint32(pos, false);
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);

    if (type === 'IHDR' && pos + 8 + 8 <= bytes.length) {
      width = view.getUint32(pos + 8, false);
      height = view.getUint32(pos + 12, false);
    } else if (type === 'pHYs' && length >= 9 && pos + 8 + 9 <= bytes.length) {
      hasPhysChunk = true;
      const ppuX = view.getUint32(pos + 8, false);
      const ppuY = view.getUint32(pos + 12, false);
      const unit = bytes[pos + 16];
      if (unit === 1) {
        // Meter unit: Convert ppu to DPI
        dpiX = Math.round(ppuX * 0.0254);
        dpiY = Math.round(ppuY * 0.0254);
      } else {
        dpiX = ppuX;
        dpiY = ppuY;
      }
    }

    pos += 12 + length;
  }

  return { width, height, dpiX, dpiY, hasPhysChunk };
}

/**
 * Detect DPI from uploaded File / Buffer (supports PNG pHYs, JPEG JFIF / EXIF)
 */
export async function detectImageDpi(file: File | ArrayBuffer): Promise<number | null> {
  try {
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    // 1. Check if PNG
    if (
      bytes.length > 30 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      const meta = await verifyPngMetadata(buffer);
      return meta.dpiX || null;
    }

    // 2. Check if JPEG (0xFFD8)
    if (bytes.length > 20 && bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      while (offset < bytes.length - 4) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = bytes[offset + 1];
        const length = view.getUint16(offset + 2, false);

        // JFIF APP0 marker: 0xFFE0
        if (marker === 0xe0 && length >= 14) {
          const jfifId = String.fromCharCode(
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7],
            bytes[offset + 8]
          );
          if (jfifId === 'JFIF\0') {
            const units = bytes[offset + 11]; // 1 = dots per inch, 2 = dots per cm
            const xDensity = view.getUint16(offset + 12, false);
            if (units === 1 && xDensity > 0) {
              return xDensity;
            }
            if (units === 2 && xDensity > 0) {
              return Math.round(xDensity * 2.54);
            }
          }
        }

        // EXIF APP1 marker: 0xFFE1
        if (marker === 0xe1 && length >= 14) {
          const exifId = String.fromCharCode(
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7]
          );
          if (exifId === 'Exif') {
            const tiffOffset = offset + 10;
            const isLittleEndian = bytes[tiffOffset] === 0x49 && bytes[tiffOffset + 1] === 0x49;
            const ifdOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
            const ifdStart = tiffOffset + ifdOffset;

            if (ifdStart + 2 < bytes.length) {
              const numEntries = view.getUint16(ifdStart, isLittleEndian);
              let xRes = 0;
              let resUnit = 2; // default inches

              for (let i = 0; i < numEntries; i++) {
                const entryOffset = ifdStart + 2 + i * 12;
                if (entryOffset + 12 > bytes.length) break;
                const tag = view.getUint16(entryOffset, isLittleEndian);

                if (tag === 0x011a) {
                  // XResolution (RATIONAL = 2x 32-bit int: numerator / denominator)
                  const valOffset = tiffOffset + view.getUint32(entryOffset + 8, isLittleEndian);
                  if (valOffset + 8 <= bytes.length) {
                    const num = view.getUint32(valOffset, isLittleEndian);
                    const den = view.getUint32(valOffset + 4, isLittleEndian);
                    if (den > 0) xRes = num / den;
                  }
                } else if (tag === 0x0128) {
                  // ResolutionUnit (SHORT)
                  resUnit = view.getUint16(entryOffset + 8, isLittleEndian);
                }
              }

              if (xRes > 0) {
                if (resUnit === 2) return Math.round(xRes); // Inches
                if (resUnit === 3) return Math.round(xRes * 2.54); // Centimeters
              }
            }
          }
        }

        offset += 2 + length;
      }
    }
  } catch (err) {
    console.warn('Could not parse image DPI metadata:', err);
  }

  return null;
}
