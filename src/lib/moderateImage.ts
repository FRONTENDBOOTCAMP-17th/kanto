const MAX_DIMENSION = 1024;

function downscaleToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("canvas_context_unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image_decode_failed"));
    };
    img.src = objectUrl;
  });
}

export interface ModerateImageOutcome {
  allowed: boolean;
  reason: string | null;
}

export async function moderateImage(file: File): Promise<ModerateImageOutcome> {
  try {
    const image = await downscaleToBase64(file);
    const res = await fetch("/api/moderate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    if (!res.ok) {
      return { allowed: false, reason: "unavailable" };
    }

    const data = await res.json();
    return { allowed: Boolean(data.allowed), reason: data.reason ?? null };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}
