/**
 * 목업 데이터 이미지를 실사용자 업로드와 동일한 구조로 이전
 * - loremflickr 게시물 이미지 → images/{userId}/{postId}/{timestamp}.webp
 * - loremflickr 구인 로고     → images/logos/{userId}/{postId}.webp
 * - seed/avatars/{userId}.webp → images/avatars/{userId}/profile (실제 아바타 경로)
 * - 전부 성공하면 seed/ 폴더 정리
 *
 * 실행: npx tsx scripts/migrate-mock-to-user-uploads.ts
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "fs"; import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath,"utf-8").replace(/\r/g,"").split("\n")) {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim();
}
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const BUCKET = "images";
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const isLorem = (u: unknown): u is string => typeof u === "string" && u.includes("loremflickr.com");
let failCount = 0;

// loremflickr는 키워드 3개 이상 조합에서 500을 반환하는 경우가 있어
// 키워드를 점진적으로 줄이고, 최후에는 picsum(항상 성공, lock 기반 고정 사진)으로 폴백
function candidateUrls(url: string): string[] {
  const urls = [url];
  const m = url.match(/^https:\/\/loremflickr\.com\/(\d+)\/(\d+)\/([^?]+)\?lock=(\d+)$/);
  if (m) {
    const [, w, h, kw, lock] = m;
    const parts = kw.split(",");
    if (parts.length > 2) urls.push(`https://loremflickr.com/${w}/${h}/${parts.slice(0, 2).join(",")}?lock=${lock}`);
    if (parts.length > 1) urls.push(`https://loremflickr.com/${w}/${h}/${parts[0]}?lock=${lock}`);
    urls.push(`https://picsum.photos/seed/${lock}/${w}/${h}`);
  }
  return urls;
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      console.warn(`    다운로드 실패(${res.status}): ${url}`);
      return null; // loremflickr 500은 결정적 → 같은 URL 재시도 대신 다음 후보로
    } catch {
      console.warn(`    fetch 오류 재시도 ${attempt}/2: ${url}`);
    }
    await delay(1200);
  }
  return null;
}

async function downloadAsWebp(url: string, maxDim?: number): Promise<Buffer | null> {
  for (const candidate of candidateUrls(url)) {
    const buf = await fetchBuffer(candidate);
    if (!buf) continue;
    try {
      let img = sharp(buf);
      if (maxDim) img = img.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true });
      return await img.webp({ quality: 80 }).toBuffer();
    } catch {
      console.warn(`    이미지 변환 실패: ${candidate}`);
    }
  }
  failCount++;
  return null;
}

async function uploadWebp(buffer: Buffer, storagePath: string, upsert = false): Promise<string | null> {
  const { error } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert,
  });
  if (error) { console.warn(`    업로드 실패 ${storagePath}: ${error.message}`); failCount++; return null; }
  return admin.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function getPostUserMap(postIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  for (let i = 0; i < postIds.length; i += 100) {
    const { data } = await admin.from("posts").select("id, user_id").in("id", postIds.slice(i, i + 100));
    for (const p of data ?? []) map.set(p.id, p.user_id);
  }
  return map;
}

// ── 게시물 이미지 (used_goods / rentals / jobs 공통) ─────────────────
async function migrateTable(table: "used_goods" | "rentals" | "jobs") {
  console.log(`\n📦 ${table} 이미지 이전 중...`);
  const { data: rows } = table === "jobs"
    ? await admin.from("jobs").select("id, post_id, images, company_logo").limit(300)
    : await admin.from(table).select("id, post_id, images").limit(300);

  const targets = (rows ?? []).filter(r => {
    const imgs = (r.images as string[] | null) ?? [];
    const logo = table === "jobs" ? (r as { company_logo?: string | null }).company_logo : null;
    return imgs.some(isLorem) || isLorem(logo);
  });
  if (targets.length === 0) { console.log("  대상 없음"); return; }

  const userMap = await getPostUserMap(targets.map(r => r.post_id as number));
  let ok = 0;

  for (const row of targets) {
    const postId = row.post_id as number;
    const userId = userMap.get(postId);
    if (!userId) { console.warn(`  post ${postId}: user_id 없음, 스킵`); failCount++; continue; }

    const updates: Record<string, unknown> = {};
    const imgs = (row.images as string[] | null) ?? [];
    const newImgs: string[] = [];
    let changed = false;

    for (let i = 0; i < imgs.length; i++) {
      if (!isLorem(imgs[i])) { newImgs.push(imgs[i]); continue; }
      const buf = await downloadAsWebp(imgs[i]);
      if (!buf) { newImgs.push(imgs[i]); continue; }
      const pub = await uploadWebp(buf, `${userId}/${postId}/${Date.now() + i}.webp`);
      if (pub) { newImgs.push(pub); changed = true; } else newImgs.push(imgs[i]);
      await delay(120);
    }
    if (changed) updates.images = newImgs;

    if (table === "jobs") {
      const logo = (row as { company_logo?: string | null }).company_logo;
      if (isLorem(logo)) {
        const buf = await downloadAsWebp(logo, 512);
        if (buf) {
          const pub = await uploadWebp(buf, `logos/${userId}/${postId}.webp`, true);
          if (pub) { updates.company_logo = pub; changed = true; }
        }
        await delay(120);
      }
    }

    if (changed) {
      const { error } = await admin.from(table).update(updates).eq("id", row.id);
      if (error) { console.warn(`  ${table} ${row.id} DB 갱신 실패: ${error.message}`); failCount++; }
      else { ok++; process.stdout.write(`  ${table} ${row.id} (post ${postId}) ✅\n`); }
    }
  }
  console.log(`  완료: ${ok}/${targets.length}건`);
}

// ── 아바타: seed/avatars/{id}.webp → avatars/{id}/profile ───────────
async function migrateAvatars() {
  console.log("\n👤 아바타 경로 이전 중...");
  const { data: users } = await admin.from("users").select("id, avatar_url")
    .like("avatar_url", "%/seed/avatars/%").limit(300);
  let ok = 0;

  for (const u of users ?? []) {
    const fromPath = `seed/avatars/${u.id}.webp`;
    const { data: file, error: dlError } = await admin.storage.from(BUCKET).download(fromPath);
    if (dlError || !file) { console.warn(`  user ${u.id}: ${fromPath} 다운로드 실패`); failCount++; continue; }

    const toPath = `avatars/${u.id}/profile`;
    const pub = await uploadWebp(Buffer.from(await file.arrayBuffer()), toPath, true);
    if (!pub) continue;

    const { error } = await admin.from("users")
      .update({ avatar_url: `${pub}?v=${Date.now()}` }).eq("id", u.id);
    if (error) { console.warn(`  user ${u.id} DB 갱신 실패: ${error.message}`); failCount++; }
    else ok++;
  }
  console.log(`  완료: ${ok}/${users?.length ?? 0}명`);
}

// ── 검증 후 seed 폴더 정리 ──────────────────────────────────────────
async function cleanupSeedFolder() {
  let loremRefs = 0;
  for (const table of ["used_goods", "rentals", "jobs"] as const) {
    const { data } = table === "jobs"
      ? await admin.from("jobs").select("images, company_logo").limit(300)
      : await admin.from(table).select("images").limit(300);
    for (const r of data ?? []) {
      loremRefs += (((r.images as string[] | null) ?? []).filter(isLorem)).length;
      if (table === "jobs" && isLorem((r as { company_logo?: string | null }).company_logo)) loremRefs++;
    }
  }
  const { count: seedRefs } = await admin.from("users")
    .select("id", { count: "exact", head: true }).like("avatar_url", "%/seed/%");
  if (failCount > 0 || loremRefs !== 0 || (seedRefs ?? -1) !== 0) {
    console.log(`\n⚠️  실패 ${failCount}건 / loremflickr ${loremRefs}건 / seed 참조 ${seedRefs}건 남음 → seed 폴더 삭제 생략 (스크립트 재실행으로 재시도 가능)`);
    return;
  }

  const { data: files } = await admin.storage.from(BUCKET).list("seed/avatars", { limit: 200 });
  const paths = (files ?? []).map(f => `seed/avatars/${f.name}`);
  if (paths.length > 0) {
    const { error } = await admin.storage.from(BUCKET).remove(paths);
    if (error) { console.warn(`  seed 삭제 실패: ${error.message}`); return; }
  }
  console.log(`\n🧹 seed/avatars ${paths.length}개 파일 삭제 완료`);
}

async function main() {
  console.log("🔧 목업 이미지 → 실사용자 업로드 구조 이전 시작");
  await migrateTable("used_goods");
  await migrateTable("rentals");
  await migrateTable("jobs");
  await migrateAvatars();
  await cleanupSeedFolder();
  console.log(`\n✨ 완료 (실패 ${failCount}건)`);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
