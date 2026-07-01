/**
 * 두 위치의 이미지를 서로 맞바꾸면서(swap), 새로 추가된 파일(blob) 순서도 함께 맞춘다.
 *
 * imagePreviews 는 기존 이미지 URL(http)과 새 이미지 blob URL 이 섞여 있고,
 * imageFiles 는 "새 이미지 파일"만 담고 있다(미리보기 내 blob 등장 순서와 1:1 정렬).
 * swap 후에도 이 정렬을 유지하도록 blob → File 매핑으로 imageFiles 를 다시 만든다.
 */
export function swapImages(
  previews: string[],
  files: File[],
  from: number,
  to: number,
): { previews: string[]; files: File[] } {
  const blobToFile = new Map<string, File>();
  let fi = 0;
  for (const p of previews) {
    if (p.startsWith("blob:")) {
      blobToFile.set(p, files[fi]);
      fi++;
    }
  }

  const nextPreviews = [...previews];
  [nextPreviews[from], nextPreviews[to]] = [nextPreviews[to], nextPreviews[from]];

  const nextFiles = nextPreviews
    .filter((p) => p.startsWith("blob:"))
    .map((p) => blobToFile.get(p))
    .filter((f): f is File => f != null);

  return { previews: nextPreviews, files: nextFiles };
}

/**
 * 제출 시 최종 images 배열을 미리보기 순서 그대로 만든다.
 * 기존 URL 은 그대로, blob 은 업로드된 URL(uploadedUrls, imageFiles 순서와 정렬)로 치환한다.
 */
export function buildImageOrder(previews: string[], uploadedUrls: string[]): string[] {
  let ui = 0;
  return previews
    .map((p) => (p.startsWith("blob:") ? uploadedUrls[ui++] : p))
    .filter((u): u is string => Boolean(u));
}
