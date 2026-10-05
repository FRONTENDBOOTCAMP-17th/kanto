const DEFAULT_MAX_DIMENSION = 1600;
const QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function optimizeImage(file: File, maxDimension = DEFAULT_MAX_DIMENSION): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (!Number.isFinite(maxDimension) || maxDimension < 1) return file;

  if (typeof Worker === "function") {
    try {
      const { default: imageCompression } = await import("browser-image-compression");
      const blob = await imageCompression(file, {
        maxSizeMB: Number.POSITIVE_INFINITY,
        maxWidthOrHeight: maxDimension,
        initialQuality: QUALITY,
        fileType: "image/webp",
        alwaysKeepResolution: true,
        useWebWorker: true,
        libURL: new URL("/vendor/browser-image-compression.js", window.location.origin).href,
      });
      if (blob.size > 0 && (blob.type === "image/webp" || blob.type === "image/jpeg")) {
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, {
          type: blob.type,
          lastModified: file.lastModified,
        });
      }
    } catch (error) {
      console.warn("[이미지 최적화] 기본 Canvas 처리로 전환", error);
    }
  }

  return optimizeOnMainThread(file, maxDimension);
}

async function optimizeOnMainThread(file: File, maxDimension: number): Promise<File> {
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    let blob = await toBlob(canvas, "image/webp", QUALITY);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", QUALITY);
    if (!blob) return file;
    if (scale === 1 && blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], name, { type: blob.type });
  } catch {
    return file;
  }
}
