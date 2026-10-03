// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { optimizeImage } from "./optimizeImage";

const compress = vi.hoisted(() => vi.fn());
vi.mock("browser-image-compression", () => ({ default: compress }));

describe("optimizeImage", () => {
  beforeEach(() => {
    vi.stubGlobal("Worker", class {});
    vi.stubGlobal("window", { location: { origin: "https://kanto.test" } });
    compress.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("requests a same-origin worker with the existing resize and quality settings", async () => {
    const file = new File(["original"], "photo.jpeg", { type: "image/jpeg", lastModified: 123 });
    compress.mockResolvedValue(new Blob(["webp"], { type: "image/webp" }));
    const result = await optimizeImage(file);
    expect(compress).toHaveBeenCalledWith(file, expect.objectContaining({
      maxWidthOrHeight: 1600, initialQuality: 0.8, fileType: "image/webp",
      useWebWorker: true, alwaysKeepResolution: true,
      libURL: "https://kanto.test/vendor/browser-image-compression.js",
    }));
    expect(result.name).toBe("photo.webp");
    expect(result.type).toBe("image/webp");
    expect(result.lastModified).toBe(123);
  });

  it("keeps the profile size override and the actual output extension", async () => {
    compress.mockResolvedValue(new Blob(["jpeg"], { type: "image/jpeg" }));
    const result = await optimizeImage(new File(["png"], "avatar.png", { type: "image/png" }), 512);
    expect(compress.mock.calls[0][1].maxWidthOrHeight).toBe(512);
    expect(result.name).toBe("avatar.jpg");
  });

  it("leaves unsupported images unchanged without loading compression", async () => {
    const file = new File(["gif"], "animated.gif", { type: "image/gif" });
    expect(await optimizeImage(file)).toBe(file);
    expect(compress).not.toHaveBeenCalled();
  });

  it("falls back to the existing canvas path when workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    vi.stubGlobal("Image", class {
      naturalWidth = 4000;
      naturalHeight = 3000;
      onload?: () => void;
      set src(_value: string) { this.onload?.(); }
    });
    const canvas = {
      width: 0, height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (callback: (blob: Blob) => void) => callback(new Blob(["webp"], { type: "image/webp" })),
    };
    vi.stubGlobal("document", { createElement: () => canvas });
    const result = await optimizeImage(new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }));
    expect(result.name).toBe("photo.webp");
    expect([canvas.width, canvas.height]).toEqual([1600, 1200]);
    expect(compress).not.toHaveBeenCalled();
  });

  it("returns the original if both compression and fallback decoding fail", async () => {
    compress.mockRejectedValue(new Error("worker failed"));
    vi.stubGlobal("Image", class { constructor() { throw new Error("decode failed"); } });
    const file = new File(["corrupt"], "photo.jpg", { type: "image/jpeg" });
    expect(await optimizeImage(file)).toBe(file);
  });
});
