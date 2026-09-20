/**
 * Kura Local File Extractor
 * Pure client-side zero-dependency extractor for local .mp4/.webm videos and .cbz/.zip comics.
 * Supports DecompressionStream('deflate-raw') for standard ZIP deflation in modern browsers.
 */

/**
 * Natural sort comparator for filenames (e.g. 1.jpg, 2.jpg, 10.jpg).
 */
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Extract image files from a local .cbz or .zip file in-memory.
 * @param {File|Blob} file
 * @param {Function} [onProgress] - (percent, current, total) => void
 * @returns {Promise<{ title: string, images: string[], filenames: string[] }>}
 */
export async function extractCbzImages(file, onProgress = () => {}) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const totalBytes = buffer.byteLength;

  onProgress(5, 0, 100);

  // 1. Locate End of Central Directory Record (EOCD: 0x06054b50)
  let eocdOffset = -1;
  for (let i = totalBytes - 22; i >= Math.max(0, totalBytes - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  const entries = [];
  const textDecoder = new TextDecoder('utf-8');

  if (eocdOffset !== -1) {
    // Read Central Directory
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    let offset = cdOffset;

    for (let i = 0; i < totalEntries && offset < eocdOffset; i++) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;

      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLen = view.getUint16(offset + 28, true);
      const extraLen = view.getUint16(offset + 30, true);
      const commentLen = view.getUint16(offset + 32, true);
      const localHeaderOffset = view.getUint32(offset + 42, true);

      const nameBytes = new Uint8Array(buffer, offset + 46, nameLen);
      const filename = textDecoder.decode(nameBytes);

      // Check if image
      if (isImageFilename(filename)) {
        entries.push({
          filename,
          method,
          compressedSize,
          localHeaderOffset,
        });
      }

      offset += 46 + nameLen + extraLen + commentLen;
    }
  } else {
    // Fallback: Sequential Local File Header scan (0x04034b50)
    let offset = 0;
    while (offset < totalBytes - 30) {
      if (view.getUint32(offset, true) !== 0x04034b50) {
        offset++;
        continue;
      }

      const method = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);

      const nameBytes = new Uint8Array(buffer, offset + 30, nameLen);
      const filename = textDecoder.decode(nameBytes);
      const dataOffset = offset + 30 + nameLen + extraLen;

      if (isImageFilename(filename) && compressedSize > 0) {
        entries.push({
          filename,
          method,
          compressedSize,
          dataOffset,
        });
      }

      offset = dataOffset + compressedSize;
    }
  }

  if (entries.length === 0) {
    throw new Error('Tidak ditemukan berkas gambar (.jpg, .png, .webp) di dalam arsip CBZ ini.');
  }

  // Sort natural order: 01.jpg, 02.jpg, ...
  entries.sort((a, b) => naturalCompare(a.filename, b.filename));

  const images = [];
  const filenames = [];
  const total = entries.length;

  // Extract each image
  for (let i = 0; i < total; i++) {
    const entry = entries[i];
    let dataOffset = entry.dataOffset;

    if (dataOffset == null && entry.localHeaderOffset != null) {
      const lhOffset = entry.localHeaderOffset;
      const lhNameLen = view.getUint16(lhOffset + 26, true);
      const lhExtraLen = view.getUint16(lhOffset + 28, true);
      dataOffset = lhOffset + 30 + lhNameLen + lhExtraLen;
    }

    const compressedBytes = new Uint8Array(buffer, dataOffset, entry.compressedSize);
    let rawBytes;

    if (entry.method === 0) {
      // Stored (no compression)
      rawBytes = compressedBytes;
    } else if (entry.method === 8) {
      // Deflated — decompress using browser DecompressionStream
      rawBytes = await decompressDeflateRaw(compressedBytes);
    } else {
      console.warn(`[CBZ] Unsupported compression method ${entry.method} for ${entry.filename}`);
      continue;
    }

    const mime = getMimeType(entry.filename);
    const blob = new Blob([rawBytes], { type: mime });
    const url = URL.createObjectURL(blob);

    images.push(url);
    filenames.push(entry.filename);

    const percent = Math.round(5 + ((i + 1) / total) * 90);
    onProgress(percent, i + 1, total);
  }

  onProgress(100, total, total);

  const title = (file.name || 'Komik Lokal').replace(/\.[^/.]+$/, '');
  return {
    title,
    images,
    filenames,
  };
}

/**
 * Check if a filename ends with common image extensions.
 */
function isImageFilename(filename) {
  if (filename.includes('__MACOSX') || filename.startsWith('.')) return false;
  return /\.(?:jpg|jpeg|png|webp|avif|gif)$/i.test(filename);
}

/**
 * Get image mime type by extension.
 */
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'avif': return 'image/avif';
    case 'gif': return 'image/gif';
    default: return 'image/jpeg';
  }
}

/**
 * Decompress raw deflate stream using DecompressionStream('deflate-raw').
 */
async function decompressDeflateRaw(bytes) {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const res = await new Response(ds.readable).arrayBuffer();
      return new Uint8Array(res);
    } catch (_) {
      // Fallback: try regular 'deflate'
      const ds2 = new DecompressionStream('deflate');
      const writer2 = ds2.writable.getWriter();
      writer2.write(bytes);
      writer2.close();
      const res2 = await new Response(ds2.readable).arrayBuffer();
      return new Uint8Array(res2);
    }
  }
  throw new Error('Browser Anda tidak mendukung DecompressionStream untuk membuka berkas CBZ.');
}

/**
 * Create a playable local video metadata object.
 * @param {File} file
 * @returns {{ id: string, title: string, url: string, localUrl: string, isLocal: boolean, provider: string, views: string }}
 */
export function createLocalVideoObject(file) {
  const localUrl = URL.createObjectURL(file);
  const title = file.name.replace(/\.[^/.]+$/, '');
  return {
    id: `local-${Date.now()}`,
    slug: `local-${Date.now()}`,
    title,
    url: localUrl,
    localUrl,
    isLocal: true,
    provider: 'local',
    views: 'Offline Local',
    date: new Date().toLocaleDateString('id-ID'),
  };
}
