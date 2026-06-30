/**
 * 모든 시드 이미지를 loremflickr.com 키워드 기반 URL로 교체
 * - 항상 로드됨 (404 없음)
 * - 제목/카테고리와 관련된 사진
 * - lock 파라미터로 아이템마다 다른 사진
 *
 * 실행: npx tsx scripts/fix-images-relevant.ts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs"; import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath,"utf-8").replace(/\r/g,"").split("\n")) {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim();
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {auth:{autoRefreshToken:false,persistSession:false}});

// loremflickr URL 생성. lock 값이 다르면 다른 사진
function flickr(keywords: string, lock: number, w = 600, h = 450): string {
  return `https://loremflickr.com/${w}/${h}/${keywords}?lock=${lock}`;
}

// ── 제목 → 키워드 매핑 (한국어 키워드 → Flickr 검색어) ──────────────
const TITLE_RULES: [RegExp, string][] = [
  // 가구 / 인테리어
  [/책상|데스크/, "desk,office,workspace"],
  [/소파|쇼파/, "sofa,couch,furniture,interior"],
  [/식탁|다이닝/, "dining,table,furniture"],
  [/의자/, "chair,furniture,interior"],
  [/침대|매트리스/, "bed,bedroom,interior"],
  [/옷장|서랍/, "wardrobe,closet,furniture"],
  // 전자기기
  [/아이패드|패드/, "ipad,tablet,technology"],
  [/맥북|맥|노트북|랩탑/, "laptop,computer,macbook"],
  [/갤럭시|아이폰|스마트폰|핸드폰|폰/, "smartphone,mobile,phone"],
  [/에어팟|이어폰|헤드폰|이어버드/, "headphone,earphone,audio"],
  [/스피커/, "speaker,audio,music"],
  [/닌텐도|플스|게임기/, "gaming,console,game"],
  [/모니터|디스플레이/, "monitor,display,computer"],
  [/카메라|렌즈/, "camera,photography,lens"],
  [/드론/, "drone,aerial,technology"],
  // 가전
  [/에어컨|냉방/, "air-conditioner,cooling"],
  [/냉장고/, "refrigerator,kitchen,appliance"],
  [/세탁기|건조기/, "laundry,washing-machine"],
  [/청소기|다이슨/, "vacuum-cleaner,cleaning,home"],
  [/커피머신|커피/, "coffee,espresso,machine"],
  [/밥솥|밥/, "rice-cooker,kitchen"],
  // 스포츠 / 레저
  [/러닝머신|트레드밀/, "treadmill,fitness,exercise"],
  [/자전거|MTB|로드바이크/, "bicycle,cycling,bike"],
  [/요가/, "yoga,wellness,fitness"],
  [/골프/, "golf,sport,green"],
  [/텐트|캠핑/, "camping,tent,outdoor,nature"],
  [/킥보드|스쿠터/, "scooter,electric,urban"],
  [/덤벨|헬스/, "gym,dumbbell,fitness,workout"],
  [/서핑|스노보드|스키/, "surfing,snowboard,outdoor,sport"],
  // 패션
  [/정장|수트/, "business-suit,formal,fashion"],
  [/가방|숄더백|백팩/, "bag,fashion,accessory"],
  [/운동화|신발/, "sneakers,shoes,fashion"],
  [/시계|워치/, "watch,timepiece,luxury"],
  [/선글라스/, "sunglasses,fashion,style"],
  // 뷰티
  [/향수|퍼퓸/, "perfume,fragrance,luxury,beauty"],
  [/화장품|코스메틱/, "cosmetics,beauty,makeup"],
  // 악기
  [/기타|어쿠스틱|일렉/, "guitar,music,instrument"],
  [/피아노|키보드/, "piano,keyboard,music"],
  [/드럼/, "drums,music,instrument"],
  // 도서 / 교육
  [/교재|책|도서|TOPIK/, "book,study,education"],
  // 유아
  [/유아|어린이|아기|육아/, "baby,children,toy"],
  // 자동차
  [/자동차|차량|카/, "car,automobile,vehicle"],
];

// 카테고리 기본 키워드 (제목 매칭 실패 시 사용)
const CATEGORY_KEYWORDS: Record<string, string> = {
  "가구":     "furniture,interior,home",
  "의류":     "fashion,clothing,style",
  "전자기기": "electronics,technology,gadget",
  "악세서리": "accessory,jewelry,beauty,luxury",
  "유아용품": "baby,children,toy,parenting",
  "자동차":   "car,automobile,vehicle",
  "기타":     "product,shopping,market",
};

// 구인 업종 키워드
const INDUSTRY_KEYWORDS: Record<string, string> = {
  "요식업/서비스직": "restaurant,kitchen,food,service",
  "IT/개발":         "office,computer,technology,coding",
  "영업/마케팅":     "business,marketing,meeting,office",
  "통번역":          "office,desk,language,communication",
  "고객서비스/CS":   "customer-service,office,team",
  "카지노/게이밍":   "hotel,luxury,interior,gaming",
  "물류/무역":       "warehouse,logistics,shipping,cargo",
  "디자인":          "design,creative,studio,art",
  "사무/총무":       "office,desk,business,work",
  "기타":            "office,work,business,professional",
};

// 렌탈 방 타입별 3장 키워드 세트 [메인 내부, 부엌·침실, 건물 외관]
const ROOM_KEYWORD_SETS: Record<string, [string, string, string]> = {
  // 한국어 룸 타입 (DB 실제 값)
  "스튜디오":  ["studio,apartment,modern,interior", "kitchen,minimal,apartment",     "apartment,building,city,modern"],
  "원룸":      ["bedroom,cozy,interior,apartment",  "kitchen,small,apartment",       "building,urban,residential"],
  "투룸":      ["living-room,apartment,modern",     "bedroom,apartment,cozy",        "apartment,building,exterior"],
  "아파트":    ["apartment,interior,living-room",   "bedroom,clean,modern,interior", "apartment,building,city,tower"],
  "빌라":      ["house,interior,cozy,home",         "garden,house,patio,outdoor",    "villa,house,exterior,architecture"],
  "오피스텔":  ["studio,modern,apartment,interior", "room,desk,urban,interior",      "building,city,modern,office"],
  // 영문 폴백 (호환성)
  "studio":    ["studio,apartment,modern,interior", "kitchen,minimal,apartment",     "apartment,building,city"],
  "1BR":       ["bedroom,apartment,interior",       "kitchen,apartment,modern",      "apartment,building,exterior"],
  "2BR":       ["living-room,apartment,interior",   "bedroom,apartment,cozy",        "apartment,building,city"],
  "bedspace":  ["bedroom,room,interior,cozy",       "room,dormitory,bed",            "building,residential,urban"],
  "house":     ["house,interior,home,cozy",         "garden,outdoor,home",           "house,architecture,exterior"],
};

const DEFAULT_ROOM_KW_SET: [string, string, string] = [
  "apartment,interior,room,real-estate",
  "bedroom,interior,modern",
  "apartment,building,city",
];

function titleToKeywords(title: string, category?: string): string {
  for (const [regex, keywords] of TITLE_RULES) {
    if (regex.test(title)) return keywords;
  }
  if (category && CATEGORY_KEYWORDS[category]) return CATEGORY_KEYWORDS[category];
  return "product,shopping,market";
}

function roomTypeToKeywordSet(roomType: string): [string, string, string] {
  for (const [key, kws] of Object.entries(ROOM_KEYWORD_SETS)) {
    if (roomType?.includes(key)) return kws;
  }
  return DEFAULT_ROOM_KW_SET;
}

// ── 중고거래 ──────────────────────────────────────────────────────────
async function fixUsedGoods() {
  console.log("\n🛍️  중고거래 이미지 교체 중...");

  const { data: goods } = await admin
    .from("used_goods")
    .select("id, category, images")
    .limit(300);

  const { data: posts } = await admin
    .from("posts")
    .select("id, title")
    .eq("post_type", "used_goods")
    .limit(300);

  // post_id → title 맵 (used_goods.id === post 구조가 다름 → join 필요)
  // used_goods 는 post_id 컬럼이 있고 posts.id 와 연결
  const { data: goodsWithPost } = await admin
    .from("used_goods")
    .select("id, post_id, category")
    .limit(300);

  const postTitleMap = new Map((posts ?? []).map(p => [p.id, p.title]));
  const goodsPostMap = new Map((goodsWithPost ?? []).map(g => [g.id, { post_id: g.post_id, category: g.category }]));

  let count = 0;
  for (const g of goods ?? []) {
    const meta = goodsPostMap.get(g.id);
    const title = meta ? (postTitleMap.get(meta.post_id) ?? "") : "";
    const category = meta?.category ?? g.category ?? "";
    const keywords = titleToKeywords(title, category);

    // 1장 고유 이미지
    const newImages = [flickr(keywords, g.id)];

    const { error } = await admin.from("used_goods").update({ images: newImages }).eq("id", g.id);
    if (!error) count++;
  }
  console.log(`  ✅ ${count}건 교체`);
}

// ── 렌탈 ──────────────────────────────────────────────────────────────
async function fixRentals() {
  console.log("\n🏠 렌탈 이미지 교체 중...");

  const { data: rentals } = await admin
    .from("rentals")
    .select("id, room_type, images")
    .limit(200);

  let count = 0;
  for (const r of rentals ?? []) {
    const [kw1, kw2, kw3] = roomTypeToKeywordSet(r.room_type ?? "");
    // 3장: 키워드별로 다른 각도(내부·보조·외관) + lock으로 개별 고유 사진
    const newImages = [
      flickr(kw1, r.id),
      flickr(kw2, r.id + 1000),
      flickr(kw3, r.id + 2000),
    ];
    const { error } = await admin.from("rentals").update({ images: newImages }).eq("id", r.id);
    if (!error) count++;
  }
  console.log(`  ✅ ${count}건 교체 (각 3장: 내부·보조·외관)`);
}

// ── 구인 ──────────────────────────────────────────────────────────────
async function fixJobs() {
  console.log("\n💼 구인 이미지 교체 중...");

  const { data: jobs } = await admin
    .from("jobs")
    .select("id, industry, company_logo, images")
    .limit(200);

  let count = 0;
  for (const j of jobs ?? []) {
    const kw = INDUSTRY_KEYWORDS[j.industry ?? "기타"] ?? INDUSTRY_KEYWORDS["기타"];
    const updates: Record<string, unknown> = {
      images: [flickr(kw, j.id), flickr(kw, j.id + 500)],
      company_logo: flickr("logo,company,brand,business", j.id + 3000, 200, 200),
    };
    const { error } = await admin.from("jobs").update(updates).eq("id", j.id);
    if (!error) count++;
  }
  console.log(`  ✅ ${count}건 교체 (이미지 2장 + 로고)`);
}

// ── MAIN ──────────────────────────────────────────────────────────────
async function main() {
  console.log("🔧 관련 이미지로 전면 교체 시작 (loremflickr.com)...");
  await fixUsedGoods();
  await fixRentals();
  await fixJobs();
  console.log("\n✨ 완료! next.config.ts 에 loremflickr.com 이 추가되어 있어야 합니다.");
}

main().catch(e => { console.error("❌", e); process.exit(1); });
