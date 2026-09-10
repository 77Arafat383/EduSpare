/**
 * Client-side image compression.
 *
 * Uploaded avatars / covers / blog images are stored as data URLs and are then
 * embedded in list responses (users, blogs, communities). A raw phone photo is
 * 3–8 MB, so without compression a single upload slows every poll for every
 * user. Resizing to a sane max edge and re-encoding as WebP/JPEG usually cuts
 * that to 20–80 KB with no visible loss at UI sizes.
 */

export interface CompressOptions {
  /** Longest edge in px. */
  maxSize?: number;
  /** 0..1 */
  quality?: number;
  /** Preferred mime; falls back to image/jpeg if the browser can't encode it. */
  mimeType?: 'image/webp' | 'image/jpeg';
}

export const IMAGE_PRESETS = {
  avatar: { maxSize: 384, quality: 0.85 },
  cover: { maxSize: 1600, quality: 0.8 },
  post: { maxSize: 1600, quality: 0.8 },
  attachment: { maxSize: 2048, quality: 0.85 },
} as const satisfies Record<string, CompressOptions>;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * Compress an image File/Blob and return it as a data URL.
 * Non-image inputs (PDF, docs) and animated GIFs / SVGs are returned unchanged.
 */
export async function compressImageToDataUrl(file: Blob, opts: CompressOptions = {}): Promise<string> {
  const { maxSize = 1600, quality = 0.8, mimeType = 'image/webp' } = opts;

  const type = (file as File).type || '';
  if (!type.startsWith('image/') || type === 'image/gif' || type === 'image/svg+xml' || typeof document === 'undefined') {
    return readAsDataURL(file);
  }

  try {
    // Prefer createImageBitmap (off-main-thread decode, honours EXIF orientation).
    let width: number;
    let height: number;
    let source: CanvasImageSource;
    if ('createImageBitmap' in window) {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
      width = bmp.width;
      height = bmp.height;
      source = bmp;
    } else {
      const img = await loadImage(file);
      width = img.naturalWidth;
      height = img.naturalHeight;
      source = img;
    }

    const scale = Math.min(1, maxSize / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return readAsDataURL(file);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, w, h);
    if ('close' in source && typeof (source as ImageBitmap).close === 'function') (source as ImageBitmap).close();

    let out = canvas.toDataURL(mimeType, quality);
    // Browser couldn't encode WebP → falls back to PNG; re-encode as JPEG instead.
    if (!out.startsWith(`data:${mimeType}`)) out = canvas.toDataURL('image/jpeg', quality);

    // Never make the file bigger than it already was (tiny icons, already-optimised images).
    const original = await readAsDataURL(file);
    return out.length < original.length ? out : original;
  } catch {
    return readAsDataURL(file);
  }
}
