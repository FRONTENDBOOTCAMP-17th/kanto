/**
 * 외부 URL 이미지를 Supabase Storage에 업로드하고 DB URL 교체
 * - loremflickr.com → images 버킷
 * - api.dicebear.com → images 버킷
 * 실행: npx tsx scripts/upload-images-to-storage.ts
 */
import { createClient } from "@supabase/supabase-js";
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

async function download(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) { console.warn(`    다운로드 실패 (${res.status}): ${url}`); return null; }
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return { buffer: buf, contentType: ct.split(";")[0] };
  } catch (e) {
    console.warn(`    fetch 오류: ${url}`, e);
    return null;
  }
}

async function upload(buffer: Buffer, storagePath: string, contentType: string): Promise<string | null> {
  const { error } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) { console.warn(`    업로드 실패: ${error.message}`); return null; }
  const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// 외부 URL인지 확인 (이미 Storage URL이면 스킵)
function isExternal(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("loremflickr.com") || url.includes("dicebear.com") ||
         url.includes("picsum.photos") || url.includes("unsplash.com");
}

// ── 1. 중고거래 ──────────────────────────────────────────────────────
async function migrateUsedGoods() {
  console.log("\n🛍️  중고거래 이미지 업로드 중...");
  const { data: goods } = await admin.from("used_goods").select("id, images").limit(300);
  let ok = 0, skip = 0;

  for (const g of goods ?? []) {
    const imgs = (g.images as string[] | null) ?? [];
    const newImgs: string[] = [];
    let changed = false;

    for (let i = 0; i < imgs.length; i++) {
      const url = imgs[i];
      if (!isExternal(url)) { newImgs.push(url); continue; }

      process.stdout.write(`  goods-${g.id}-${i} 다운로드 중...`);
      const result = await download(url);
      if (!result) { newImgs.push(url); process.stdout.write(" ❌\n"); continue; }

      const ext = result.contentType.includes("png") ? "png" : "jpg";
      const storagePath = `seed/goods/${g.id}-${i}.${ext}`;
      const publicUrl = await upload(result.buffer, storagePath, result.contentType);
      if (publicUrl) { newImgs.push(publicUrl); changed = true; process.stdout.write(" ✅\n"); }
      else { newImgs.push(url); process.stdout.write(" ❌\n"); }

      await delay(150);
    }

    if (changed) {
      await admin.from("used_goods").update({ images: newImgs }).eq("id", g.id);
      ok++;
    } else skip++;
  }
  console.log(`  완료: ${ok}건 업로드, ${skip}건 스킵`);
}

// ── 2. 렌탈 ─────────────────────────────────────────────────────────
async function migrateRentals() {
  console.log("\n🏠 렌탈 이미지 업로드 중...");
  const { data: rentals } = await admin.from("rentals").select("id, images").limit(200);
  let ok = 0, skip = 0;

  for (const r of rentals ?? []) {
    const imgs = (r.images as string[] | null) ?? [];
    const newImgs: string[] = [];
    let changed = false;

    for (let i = 0; i < imgs.length; i++) {
      const url = imgs[i];
      if (!isExternal(url)) { newImgs.push(url); continue; }

      process.stdout.write(`  rental-${r.id}-${i} 다운로드 중...`);
      const result = await download(url);
      if (!result) { newImgs.push(url); process.stdout.write(" ❌\n"); continue; }

      const storagePath = `seed/rentals/${r.id}-${i}.jpg`;
      const publicUrl = await upload(result.buffer, storagePath, result.contentType);
      if (publicUrl) { newImgs.push(publicUrl); changed = true; process.stdout.write(" ✅\n"); }
      else { newImgs.push(url); process.stdout.write(" ❌\n"); }

      await delay(150);
    }

    if (changed) {
      await admin.from("rentals").update({ images: newImgs }).eq("id", r.id);
      ok++;
    } else skip++;
  }
  console.log(`  완료: ${ok}건 업로드, ${skip}건 스킵`);
}

// ── 3. 구인 ─────────────────────────────────────────────────────────
async function migrateJobs() {
  console.log("\n💼 구인 이미지 업로드 중...");
  const { data: jobs } = await admin.from("jobs").select("id, images, company_logo").limit(200);
  let ok = 0, skip = 0;

  for (const j of jobs ?? []) {
    const imgs = (j.images as string[] | null) ?? [];
    const updates: Record<string, unknown> = {};
    let changed = false;

    // 이미지
    const newImgs: string[] = [];
    for (let i = 0; i < imgs.length; i++) {
      const url = imgs[i];
      if (!isExternal(url)) { newImgs.push(url); continue; }

      process.stdout.write(`  job-${j.id}-img-${i} 다운로드 중...`);
      const result = await download(url);
      if (!result) { newImgs.push(url); process.stdout.write(" ❌\n"); continue; }

      const storagePath = `seed/jobs/${j.id}-img-${i}.jpg`;
      const publicUrl = await upload(result.buffer, storagePath, result.contentType);
      if (publicUrl) { newImgs.push(publicUrl); changed = true; process.stdout.write(" ✅\n"); }
      else { newImgs.push(url); process.stdout.write(" ❌\n"); }
      await delay(150);
    }
    if (newImgs.length) updates.images = newImgs;

    // 로고
    const logo = j.company_logo as string | null;
    if (logo && isExternal(logo)) {
      process.stdout.write(`  job-${j.id}-logo 다운로드 중...`);
      const result = await download(logo);
      if (result) {
        const ext = result.contentType.includes("png") ? "png" : "jpg";
        const storagePath = `seed/jobs/${j.id}-logo.${ext}`;
        const publicUrl = await upload(result.buffer, storagePath, result.contentType);
        if (publicUrl) { updates.company_logo = publicUrl; changed = true; process.stdout.write(" ✅\n"); }
        else process.stdout.write(" ❌\n");
        await delay(150);
      } else process.stdout.write(" ❌\n");
    }

    if (changed) {
      await admin.from("jobs").update(updates).eq("id", j.id);
      ok++;
    } else skip++;
  }
  console.log(`  완료: ${ok}건 업로드, ${skip}건 스킵`);
}

// ── 4. 유저 아바타 ──────────────────────────────────────────────────
async function migrateAvatars() {
  console.log("\n👤 아바타 업로드 중...");
  const { data: users } = await admin.from("users").select("id, avatar_url")
    .like("avatar_url", "%dicebear.com%").limit(300);
  let ok = 0, skip = 0;

  for (const u of users ?? []) {
    const url = u.avatar_url as string;
    if (!isExternal(url)) { skip++; continue; }

    process.stdout.write(`  avatar-${u.id} 다운로드 중...`);
    const result = await download(url);
    if (!result) { skip++; process.stdout.write(" ❌\n"); continue; }

    const storagePath = `seed/avatars/${u.id}.png`;
    const publicUrl = await upload(result.buffer, storagePath, "image/png");
    if (publicUrl) {
      await admin.from("users").update({ avatar_url: publicUrl }).eq("id", u.id);
      ok++;
      process.stdout.write(" ✅\n");
    } else {
      skip++;
      process.stdout.write(" ❌\n");
    }
    await delay(100);
  }
  console.log(`  완료: ${ok}명 업로드, ${skip}명 스킵`);
}

// ── MAIN ────────────────────────────────────────────────────────────
async function main() {
  console.log("🔧 Supabase Storage 업로드 시작...");
  console.log("   버킷: images / 경로: seed/*\n");

  await migrateUsedGoods();
  await migrateRentals();
  await migrateJobs();
  await migrateAvatars();

  console.log("\n✨ 완료! 이제 모든 이미지가 Supabase Storage에 저장됩니다.");
}

main().catch(e => { console.error("❌", e); process.exit(1); });
