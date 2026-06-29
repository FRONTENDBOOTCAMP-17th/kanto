/**
 * Kanto 가계정 & 더미 데이터 시드 스크립트
 *
 * 실행 방법:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 *
 * 또는 Node 20 미만인 경우:
 *   npx dotenv -e .env.local -- npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// .env.local 수동 로드 (tsx 환경에서 --env-file 미지원 시 대비)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").replace(/\r/g, "").split("\n")) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SECRET_KEY 없음");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────
function die(label: string, err: unknown): never {
  console.error(`❌ ${label}:`, err);
  process.exit(1);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ──────────────────────────────────────────────
// 1. 가계정 정의
// ──────────────────────────────────────────────
const PASSWORD = "Kanto1234!";

const USERS = [
  {
    email: "maria.santos@kantodemo.com",
    name: "Maria Santos",
    phone: "+639171234567",
    region: "BGC / Taguig",
    kts_score: 85,
    kts_grade: "B",
    avg_rating: 4.7,
    post_count: 8,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=MariaSantos",
  },
  {
    email: "juan.delacruz@kantodemo.com",
    name: "Juan dela Cruz",
    phone: "+639182345678",
    region: "Quezon City",
    kts_score: 72,
    kts_grade: "C",
    avg_rating: 4.2,
    post_count: 5,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=JuandelaCruz",
  },
  {
    email: "ana.reyes@kantodemo.com",
    name: "Ana Reyes",
    phone: "+639193456789",
    region: "Makati",
    kts_score: 55,
    kts_grade: "C",
    avg_rating: 3.9,
    post_count: 3,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=AnaReyes",
  },
  {
    email: "carlos.mendoza@kantodemo.com",
    name: "Carlos Mendoza",
    phone: "+639204567890",
    region: "BGC / Taguig",
    kts_score: 91,
    kts_grade: "A",
    avg_rating: 4.9,
    post_count: 12,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=CarlosMendoza",
  },
  {
    email: "rosa.garcia@kantodemo.com",
    name: "Rosa Garcia",
    phone: "+639215678901",
    region: "Makati",
    kts_score: 78,
    kts_grade: "B",
    avg_rating: 4.5,
    post_count: 6,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=RosaGarcia",
  },
  {
    email: "miguel.torres@kantodemo.com",
    name: "Miguel Torres",
    phone: "+639226789012",
    region: "Mandaluyong / Pasig",
    kts_score: 60,
    kts_grade: "C",
    avg_rating: 4.0,
    post_count: 4,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=MiguelTorres",
  },
  {
    email: "elena.bautista@kantodemo.com",
    name: "Elena Bautista",
    phone: "+639237890123",
    region: "Pasay / Paranaque",
    kts_score: 40,
    kts_grade: "D",
    avg_rating: 3.5,
    post_count: 2,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=ElenaBautista",
  },
  {
    email: "joseph.ramos@kantodemo.com",
    name: "Joseph Ramos",
    phone: "+639248901234",
    region: "Makati",
    kts_score: 82,
    kts_grade: "B",
    avg_rating: 4.6,
    post_count: 7,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=JosephRamos",
  },
  {
    email: "linda.cruz@kantodemo.com",
    name: "Linda Cruz",
    phone: "+639259012345",
    region: "Quezon City",
    kts_score: 58,
    kts_grade: "C",
    avg_rating: 4.1,
    post_count: 4,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=LindaCruz",
  },
  {
    email: "fernando.lim@kantodemo.com",
    name: "Fernando Lim",
    phone: "+639260123456",
    region: "Mandaluyong / Pasig",
    kts_score: 93,
    kts_grade: "A",
    avg_rating: 4.8,
    post_count: 15,
    avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=FernandoLim",
  },
] as const;

// ──────────────────────────────────────────────
// 2. 유저 생성
// ──────────────────────────────────────────────
async function seedUsers(): Promise<Record<string, number>> {
  console.log("\n📋 유저 생성 중...");
  const emailToId: Record<string, number> = {};

  for (const u of USERS) {
    // 1. auth 유저 조회 또는 생성
    let authId: string;

    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find((au) => au.email === u.email);

    if (existing) {
      authId = existing.id;
    } else {
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: u.name },
      });
      if (authErr || !authData.user) die(`auth.createUser(${u.email})`, authErr);
      authId = authData.user.id;
    }

    // 2. public.users upsert (auth_id 충돌 시 update)
    const { data: row, error: dbErr } = await admin
      .from("users")
      .upsert(
        {
          auth_id: authId,
          email: u.email,
          name: u.name,
          phone: u.phone,
          region: u.region,
          kts_score: u.kts_score,
          kts_grade: u.kts_grade,
          avg_rating: u.avg_rating,
          post_count: u.post_count,
          avatar_url: u.avatar_url,
          role: "user",
          created_at: daysAgo(Math.floor(Math.random() * 180 + 30)),
        },
        { onConflict: "auth_id" },
      )
      .select("id")
      .single();

    if (dbErr || !row) die(`users.upsert(${u.email})`, dbErr);

    emailToId[u.email] = row.id;
    console.log(`  ✅ ${u.name} (id=${row.id})`);
  }

  return emailToId;
}

// ──────────────────────────────────────────────
// 3. 구인 게시글 (job)
// ──────────────────────────────────────────────
async function seedJobs(ids: Record<string, number>) {
  console.log("\n💼 구인 게시글 생성 중...");

  const jobs = [
    {
      email: "carlos.mendoza@kantodemo.com",
      title: "레스토랑 홀 직원 모집",
      location: "BGC / Taguig",
      job: {
        company_name: "Mendoza Kitchen & Grill",
        company_intro: "BGC에 위치한 필리핀-한국 퓨전 레스토랑입니다. 활기찬 환경에서 함께 일할 홀 직원을 모집합니다.",
        main_task: "주문 접수, 테이블 서빙, 매장 청결 유지, 손님 응대",
        salary: 20000,
        salary_type: "월급",
        employee_type: "정규직",
        deadline: daysFromNow(30),
        location_type: "BGC / Taguig" as const,
        work_days: ["월", "화", "수", "목", "금"],
        work_hours: "09:00 - 18:00",
        is_time_negotiable: false,
        industry: "요식업/서비스직",
        manager_name: "Carlos Mendoza",
        manager_phone: "+639204567890",
        manager_email: "carlos.mendoza@kantodemo.com",
        preferred_tags: ["local_resident", "immediate_start", "food_service"],
        company_year: 2019,
        employee_count: 15,
      },
      view_count: 234,
      like_count: 18,
    },
    {
      email: "joseph.ramos@kantodemo.com",
      title: "한국어 가능 영업사원 채용 (마카티)",
      location: "Makati",
      job: {
        company_name: "KorPil Trading Corp.",
        company_intro: "한국-필리핀 무역 전문 회사입니다. 10년 이상의 경력을 바탕으로 다양한 제품을 수출입합니다.",
        main_task: "한국 클라이언트 관리, B2B 영업, 계약서 작성 지원, 시장 조사",
        salary: 28000,
        salary_type: "월급",
        employee_type: "정규직",
        deadline: daysFromNow(45),
        location_type: "Makati" as const,
        work_days: ["월", "화", "수", "목", "금"],
        work_hours: "08:30 - 17:30",
        is_time_negotiable: false,
        industry: "영업/마케팅",
        manager_name: "Joseph Ramos",
        manager_phone: "+639248901234",
        manager_email: "joseph.ramos@kantodemo.com",
        preferred_tags: ["korean", "english", "three_to_five", "sales_marketing"],
        company_year: 2014,
        employee_count: 42,
      },
      view_count: 512,
      like_count: 35,
    },
    {
      email: "fernando.lim@kantodemo.com",
      title: "IT 지원 담당자 모집 (Quezon City)",
      location: "Quezon City",
      job: {
        company_name: "LimTech Solutions",
        company_intro: "소프트웨어 개발 및 IT 인프라 관리 전문 기업. 필리핀 전역의 중소기업을 위한 맞춤형 솔루션을 제공합니다.",
        main_task: "사내 IT 장비 유지보수, 네트워크 관리, 사용자 기술 지원, 소프트웨어 설치 및 업데이트",
        salary: 25000,
        salary_type: "월급",
        employee_type: "정규직",
        deadline: daysFromNow(60),
        location_type: "Quezon City" as const,
        work_days: ["월", "화", "수", "목", "금"],
        work_hours: "09:00 - 18:00",
        is_time_negotiable: true,
        industry: "IT/개발",
        manager_name: "Fernando Lim",
        manager_phone: "+639260123456",
        manager_email: "fernando.lim@kantodemo.com",
        preferred_tags: ["english", "it_dev", "one_to_three", "remote_hybrid"],
        company_year: 2017,
        employee_count: 28,
      },
      view_count: 389,
      like_count: 27,
    },
    {
      email: "rosa.garcia@kantodemo.com",
      title: "하우스키핑 직원 구합니다 (마카티 콘도)",
      location: "Makati",
      job: {
        company_name: "개인",
        company_intro: "마카티 콘도미니엄 거주자로, 주 3회 청소 및 세탁을 도와주실 분을 구합니다.",
        main_task: "콘도 청소, 세탁 및 다림질, 장보기 보조",
        salary: 600,
        salary_type: "시급",
        employee_type: "파트타임",
        deadline: daysFromNow(14),
        location_type: "Makati" as const,
        work_days: ["월", "수", "금"],
        work_hours: "10:00 - 15:00",
        is_time_negotiable: true,
        industry: "기타",
        manager_name: "Rosa Garcia",
        manager_phone: "+639215678901",
        manager_email: "rosa.garcia@kantodemo.com",
        preferred_tags: ["local_resident", "immediate_start", "job_other"],
        company_year: null,
        employee_count: null,
      },
      view_count: 156,
      like_count: 8,
    },
    {
      email: "carlos.mendoza@kantodemo.com",
      title: "카운터 직원 채용 (파사이 지점)",
      location: "Pasay / Paranaque",
      job: {
        company_name: "Mendoza Kitchen & Grill",
        company_intro: "파사이에 새로 오픈하는 지점의 카운터 직원을 모집합니다. 한국어 또는 영어 가능자 우대.",
        main_task: "계산 업무, 포스(POS) 시스템 운영, 재고 관리 보조, 고객 응대",
        salary: 16000,
        salary_type: "월급",
        employee_type: "계약직",
        deadline: daysFromNow(21),
        location_type: "Pasay / Paranaque" as const,
        work_days: ["화", "수", "목", "금", "토"],
        work_hours: "10:00 - 19:00",
        is_time_negotiable: false,
        industry: "요식업/서비스직",
        manager_name: "Carlos Mendoza",
        manager_phone: "+639204567890",
        manager_email: "carlos.mendoza@kantodemo.com",
        preferred_tags: ["korean", "english", "immediate_start", "food_service"],
        company_year: 2019,
        employee_count: 15,
      },
      view_count: 178,
      like_count: 12,
    },
  ];

  for (const j of jobs) {
    const userId = ids[j.email];

    const { data: post, error: postErr } = await admin
      .from("posts")
      .insert({
        user_id: userId,
        title: j.title,
        post_type: "jobs",
        status: "active",
        view_count: j.view_count,
        like_count: j.like_count,
        created_at: daysAgo(Math.floor(Math.random() * 20 + 1)),
      })
      .select("id")
      .single();

    if (postErr || !post) die(`posts.insert(job: ${j.title})`, postErr);

    const { error: jobErr } = await admin.from("jobs").insert({
      post_id: post.id,
      ...j.job,
    });

    if (jobErr) die(`jobs.insert(${j.title})`, jobErr);

    console.log(`  ✅ [구인] ${j.title}`);
  }
}

// ──────────────────────────────────────────────
// 4. 중고거래 게시글 (used_goods)
// ──────────────────────────────────────────────
async function seedUsedGoods(ids: Record<string, number>) {
  console.log("\n🛍️  중고거래 게시글 생성 중...");

  const goods = [
    {
      email: "maria.santos@kantodemo.com",
      title: "iPhone 13 128GB 미개봉 팝니다",
      good: {
        category: "전자기기",
        content: "선물 받은 iPhone 13 128GB 미개봉 제품입니다. 사용할 기기가 있어서 판매합니다. 박스 봉인 그대로입니다. 정품 A/S 가능하며 영수증 있습니다.",
        price: 25000,
        condition: "미개봉" as const,
        location_type: "BGC / Taguig" as const,
        location_city: "Taguig City",
        location_barangay: "BGC",
        location_lat: 14.5547,
        location_lng: 121.0490,
        safe_payment: true,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400",
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
        ],
      },
      view_count: 312,
      like_count: 24,
      is_sold: false,
    },
    {
      email: "juan.delacruz@kantodemo.com",
      title: "삼성 40인치 TV 팝니다 (이사로 인한 처분)",
      good: {
        category: "가전제품",
        content: "이사 때문에 어쩔 수 없이 처분합니다. 구매한 지 2년 됐고 화면 상태 깨끗합니다. 리모컨, 원본 케이블 포함. 직거래 선호합니다.",
        price: 8000,
        condition: "가벼운 사용감" as const,
        location_type: "Quezon City" as const,
        location_city: "Quezon City",
        location_barangay: "Diliman",
        location_lat: 14.6537,
        location_lng: 121.0680,
        safe_payment: false,
        images: [
          "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400",
        ],
      },
      view_count: 198,
      like_count: 11,
      is_sold: true,
    },
    {
      email: "ana.reyes@kantodemo.com",
      title: "주방용품 세트 일괄 판매",
      good: {
        category: "주방/생활",
        content: "냄비 3종 세트, 프라이팬 2개, 도마, 식기 6인분 포함. 혼자 살다가 같이 살게 돼서 중복된 것들 정리합니다. 일괄 판매만 합니다.",
        price: 3500,
        condition: "사용감 있음" as const,
        location_type: "Makati" as const,
        location_city: "Makati City",
        location_barangay: "Legazpi Village",
        location_lat: 14.5547,
        location_lng: 121.0190,
        safe_payment: false,
        images: [
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        ],
      },
      view_count: 87,
      like_count: 5,
      is_sold: false,
    },
    {
      email: "linda.cruz@kantodemo.com",
      title: "노트북 판매 (LG 그램 14인치, 2022년형)",
      good: {
        category: "전자기기",
        content: "LG 그램 14인치 2022년형입니다. i5-1235U, RAM 16GB, SSD 512GB. 거의 사용하지 않아 상태 매우 좋습니다. 충전기, 파우치 포함. 스펙 관련 질문 환영합니다.",
        price: 42000,
        condition: "가벼운 사용감" as const,
        location_type: "Quezon City" as const,
        location_city: "Quezon City",
        location_barangay: "Cubao",
        location_lat: 14.6192,
        location_lng: 121.0536,
        safe_payment: true,
        images: [
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400",
        ],
      },
      view_count: 445,
      like_count: 38,
      is_sold: false,
    },
    {
      email: "elena.bautista@kantodemo.com",
      title: "유아 유모차 팝니다 (Stokke Xplory X)",
      good: {
        category: "유아/어린이",
        content: "아이가 커서 더 이상 사용하지 않는 고급 유모차입니다. Stokke Xplory X 모델, 레인커버 포함. 사용감 있으나 파손 없음. 원가 대비 많이 저렴하게 드립니다.",
        price: 12000,
        condition: "사용감 있음" as const,
        location_type: "Pasay / Paranaque" as const,
        location_city: "Pasay City",
        location_barangay: "Malibay",
        location_lat: 14.5365,
        location_lng: 121.0010,
        safe_payment: false,
        images: [
          "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400",
        ],
      },
      view_count: 134,
      like_count: 9,
      is_sold: false,
    },
    {
      email: "fernando.lim@kantodemo.com",
      title: "Sony A7C 풀프레임 미러리스 카메라 판매",
      good: {
        category: "전자기기",
        content: "Sony A7C 바디 + FE 28-60mm 키트 렌즈 세트입니다. 총 셔터 수 약 3,200회로 거의 새것 수준. 배터리 2개, 충전기, 스트랩 포함. 박스 있음.",
        price: 75000,
        condition: "가벼운 사용감" as const,
        location_type: "Mandaluyong / Pasig" as const,
        location_city: "Mandaluyong City",
        location_barangay: "Addition Hills",
        location_lat: 14.5794,
        location_lng: 121.0359,
        safe_payment: true,
        images: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
          "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=400",
        ],
      },
      view_count: 621,
      like_count: 52,
      is_sold: false,
    },
  ];

  for (const g of goods) {
    const userId = ids[g.email];

    const { data: post, error: postErr } = await admin
      .from("posts")
      .insert({
        user_id: userId,
        title: g.title,
        post_type: "used_goods",
        status: "active",
        view_count: g.view_count,
        like_count: g.like_count,
        is_sold: g.is_sold,
        created_at: daysAgo(Math.floor(Math.random() * 15 + 1)),
      })
      .select("id")
      .single();

    if (postErr || !post) die(`posts.insert(used_goods: ${g.title})`, postErr);

    const { error: goodErr } = await admin.from("used_goods").insert({
      post_id: post.id,
      ...g.good,
    });

    if (goodErr) die(`used_goods.insert(${g.title})`, goodErr);

    console.log(`  ✅ [중고] ${g.title}`);
  }
}

// ──────────────────────────────────────────────
// 5. 렌탈 게시글 (rental)
// ──────────────────────────────────────────────
async function seedRentals(ids: Record<string, number>) {
  console.log("\n🏠 렌탈 게시글 생성 중...");

  const rentals = [
  {
      email: "rosa.garcia@kantodemo.com",
      title: "BGC 스튜디오 풀 퍼니시드 임대 (단기/장기 가능)",
      rental: {
        price: 25000,
        deposit: 50000,
        rent_type: "월세",
        room_type: "스튜디오",
        description: "BGC 중심부에 위치한 깔끔한 스튜디오입니다. 침대, 소파, 냉장고, 에어컨 완비. 건물 내 수영장 및 헬스장 이용 가능. 한국인 거주자 많음. 단기 3개월부터 가능합니다.",
        location: "BGC / Taguig" as const,
        location_city: "Taguig City",
        location_barangay: "BGC",
        location_detail: "High Street South Block 근처",
        location_lat: 14.5512,
        location_lng: 121.0501,
        max_occupants: 2,
        amenities: ["에어컨", "냉장고", "세탁기", "인터넷", "수영장", "헬스장", "보안요원", "엘리베이터"],
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
          "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=400",
          "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400",
        ],
      },
      view_count: 489,
      like_count: 41,
    },
    {
      email: "maria.santos@kantodemo.com",
      title: "마카티 원룸 임대 (Poblacion 도보권)",
      rental: {
        price: 12000,
        deposit: 24000,
        rent_type: "월세",
        room_type: "원룸",
        description: "Poblacion 바 거리 도보 5분 거리의 원룸입니다. 조용한 주택가에 위치. 주방, 욕실 단독 사용. 외국인 친화적 환경. 장기 거주 선호합니다.",
        location: "Makati" as const,
        location_city: "Makati City",
        location_barangay: "Poblacion",
        location_detail: "Kalayaan Ave 인근",
        location_lat: 14.5631,
        location_lng: 121.0263,
        max_occupants: 1,
        amenities: ["에어컨", "냉장고", "인터넷", "주차"],
        images: [
          "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400",
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
        ],
      },
      view_count: 278,
      like_count: 19,
    },
    {
      email: "juan.delacruz@kantodemo.com",
      title: "QC 베드스페이스 (여성 전용, 3인실)",
      rental: {
        price: 4500,
        deposit: 4500,
        rent_type: "월세",
        room_type: "원룸",
        description: "여성 전용 하우스입니다. 에어컨 3인실 베드스페이스. 세탁기 공용, 인터넷 포함. 근처에 편의점, 식당 다수. 통금 없음. 직장인/학생 환영.",
        location: "Quezon City" as const,
        location_city: "Quezon City",
        location_barangay: "Kamuning",
        location_detail: "Timog Ave 근처",
        location_lat: 14.6357,
        location_lng: 121.0420,
        max_occupants: 3,
        amenities: ["에어컨", "세탁기", "인터넷", "냉장고"],
        images: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
        ],
      },
      view_count: 167,
      like_count: 13,
    },
    {
      email: "fernando.lim@kantodemo.com",
      title: "만달루용 2BR 콘도 장기 임대",
      rental: {
        price: 35000,
        deposit: 70000,
        rent_type: "월세",
        room_type: "투룸",
        description: "만달루용 시내 중심부 2베드룸 콘도입니다. 32층 고층으로 마닐라 스카이라인 뷰. 주방 풀 퍼니시드, 드레스룸 있음. 1년 이상 장기 계약 선호.",
        location: "Mandaluyong / Pasig" as const,
        location_city: "Mandaluyong City",
        location_barangay: "Wack-Wack",
        location_detail: "Shaw Blvd 역 도보 7분",
        location_lat: 14.5843,
        location_lng: 121.0526,
        max_occupants: 4,
        amenities: ["에어컨", "냉장고", "세탁기", "인터넷", "주차", "수영장", "헬스장", "엘리베이터", "보안요원"],
        images: [
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
          "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=400",
          "https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=400",
        ],
      },
      view_count: 356,
      like_count: 29,
    },
  ];

  for (const r of rentals) {
    const userId = ids[r.email];

    const { data: post, error: postErr } = await admin
      .from("posts")
      .insert({
        user_id: userId,
        title: r.title,
        post_type: "rental",
        status: "active",
        view_count: r.view_count,
        like_count: r.like_count,
        created_at: daysAgo(Math.floor(Math.random() * 25 + 3)),
      })
      .select("id")
      .single();

    if (postErr || !post) die(`posts.insert(rental: ${r.title})`, postErr);

    const { error: rentalErr } = await admin.from("rentals").insert({
      post_id: post.id,
      ...r.rental,
    });

    if (rentalErr) die(`rentals.insert(${r.title})`, rentalErr);

    console.log(`  ✅ [렌탈] ${r.title}`);
  }
}

// ──────────────────────────────────────────────
// 6. 모임 게시글 (meetup)
// ──────────────────────────────────────────────
async function seedMeetups(ids: Record<string, number>): Promise<number[]> {
  console.log("\n🤝 모임 게시글 생성 중...");

  const meetups = [
    {
      email: "ana.reyes@kantodemo.com",
      title: "BGC 필리핀-한국 커뮤니티 정기 모임 (7월)",
      meetup: {
        topic: "필리핀-한국 문화 교류",
        description: "BGC에 거주하는 필리핀인, 한국인 모두 환영합니다! 매월 정기적으로 모여서 친목을 도모하고 정보를 나눕니다. 음식 나눔, 취업/생활 정보 공유, 언어 교환 등 진행 예정. 처음 오시는 분도 편하게 오세요 😊",
        location_address: "The Fort Strip, BGC, Taguig City",
        location_detail: "입구에서 'Kanto 모임' 피켓 찾으세요",
        location_lat: 14.5500,
        location_lng: 121.0491,
        start_at: daysFromNow(8),
        end_at: daysFromNow(8).replace("T", "T").slice(0, 16) + ":00.000Z",
        max_participants: 30,
      },
      view_count: 287,
      like_count: 22,
    },
    {
      email: "miguel.torres@kantodemo.com",
      title: "마카티 중고물품 스왑 마켓 & 플리마켓",
      meetup: {
        topic: "중고 스왑 & 플리마켓",
        description: "안 쓰는 물건을 가지고 오셔서 서로 교환하거나 저렴하게 판매해 보세요! 카테고리 무관 (옷, 책, 전자기기, 생활용품 등). 테이블 1개당 무료. 사전 등록 필수. 간식 나눔도 있을 예정 :)",
        location_address: "Ayala Triangle Gardens, Makati City",
        location_detail: "분수대 옆 잔디 공간",
        location_lat: 14.5560,
        location_lng: 121.0224,
        start_at: daysFromNow(15),
        end_at: daysFromNow(15).replace("T", "T").slice(0, 16) + ":00.000Z",
        max_participants: 50,
      },
      view_count: 198,
      like_count: 17,
    },
  ];

  const postIds: number[] = [];

  for (const m of meetups) {
    const userId = ids[m.email];

    // start_at을 10시로, end_at을 14시로 고정
    const startDate = new Date(daysFromNow(m === meetups[0] ? 8 : 15));
    startDate.setHours(10, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(14, 0, 0, 0);

    const { data: post, error: postErr } = await admin
      .from("posts")
      .insert({
        user_id: userId,
        title: m.title,
        post_type: "meetup",
        status: "active",
        view_count: m.view_count,
        like_count: m.like_count,
        created_at: daysAgo(Math.floor(Math.random() * 5 + 1)),
      })
      .select("id")
      .single();

    if (postErr || !post) die(`posts.insert(meetup: ${m.title})`, postErr);

    const { error: meetupErr } = await admin.from("meetups").insert({
      post_id: post.id,
      ...m.meetup,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
    });

    if (meetupErr) die(`meetups.insert(${m.title})`, meetupErr);

    // 채팅룸 생성
    const chatExpiry = new Date(endDate);
    chatExpiry.setDate(chatExpiry.getDate() + 3);

    const { error: roomErr } = await admin.from("meetup_chat_rooms").insert({
      meetup_post_id: post.id,
      expires_at: chatExpiry.toISOString(),
      status: "active",
    });

    if (roomErr) die(`meetup_chat_rooms.insert(${m.title})`, roomErr);

    postIds.push(post.id);
    console.log(`  ✅ [모임] ${m.title}`);
  }

  return postIds;
}

// ──────────────────────────────────────────────
// 7. 모임 참가자
// ──────────────────────────────────────────────
async function seedMeetupParticipants(
  ids: Record<string, number>,
  meetupPostIds: number[],
) {
  console.log("\n👥 모임 참가자 등록 중...");

  // 첫 번째 모임 참가자: ana(주최), carlos, rosa, joseph, fernando
  const meetup1Participants = [
    ids["ana.reyes@kantodemo.com"],
    ids["carlos.mendoza@kantodemo.com"],
    ids["rosa.garcia@kantodemo.com"],
    ids["joseph.ramos@kantodemo.com"],
    ids["fernando.lim@kantodemo.com"],
  ];

  // 두 번째 모임 참가자: miguel(주최), maria, juan, linda, elena, miguel
  const meetup2Participants = [
    ids["miguel.torres@kantodemo.com"],
    ids["maria.santos@kantodemo.com"],
    ids["juan.delacruz@kantodemo.com"],
    ids["linda.cruz@kantodemo.com"],
    ids["elena.bautista@kantodemo.com"],
  ];

  const allParticipants = [
    { postId: meetupPostIds[0], userIds: meetup1Participants },
    { postId: meetupPostIds[1], userIds: meetup2Participants },
  ];

  for (const { postId, userIds } of allParticipants) {
    for (const userId of userIds) {
      const { error } = await admin.from("meetup_participants").insert({
        meetup_post_id: postId,
        user_id: userId,
        status: "joined",
      });
      if (error && !error.message.includes("duplicate")) {
        console.warn(`  ⚠️  참가자 등록 실패 (user=${userId}):`, error.message);
      }
    }
    console.log(`  ✅ 모임 ${postId} 참가자 ${userIds.length}명 등록`);
  }
}

// ──────────────────────────────────────────────
// 8. 리뷰
// ──────────────────────────────────────────────
async function seedReviews(ids: Record<string, number>) {
  console.log("\n⭐ 리뷰 생성 중...");

  const reviews = [
    // Carlos → Fernando (구매자 → 판매자)
    {
      reviewer_id: ids["carlos.mendoza@kantodemo.com"],
      reviewee_id: ids["fernando.lim@kantodemo.com"],
      rating: 5,
      role: "buyer",
      content: "카메라 상태가 사진과 동일하게 완벽했습니다. 포장도 꼼꼼하게 해주셨고 거래 내내 친절하셨어요. 다음에도 거래하고 싶습니다!",
      post_title: "Sony A7C 풀프레임 미러리스 카메라 판매",
      post_price: 75000,
    },
    // Fernando → Carlos (판매자 → 구매자)
    {
      reviewer_id: ids["fernando.lim@kantodemo.com"],
      reviewee_id: ids["carlos.mendoza@kantodemo.com"],
      rating: 5,
      role: "seller",
      content: "시간 약속 잘 지키시고 흥정 없이 딱 가격대로 구매해주셨습니다. 좋은 분이에요!",
      post_title: "Sony A7C 풀프레임 미러리스 카메라 판매",
      post_price: 75000,
    },
    // Joseph → Maria (구매자 → 판매자)
    {
      reviewer_id: ids["joseph.ramos@kantodemo.com"],
      reviewee_id: ids["maria.santos@kantodemo.com"],
      rating: 5,
      role: "buyer",
      content: "완전 미개봉이 맞아요! 세심하게 설명해주시고 영수증도 챙겨주셨습니다. 믿을 수 있는 판매자!",
      post_title: "iPhone 13 128GB 미개봉 팝니다",
      post_price: 25000,
    },
    // Maria → Joseph (판매자 → 구매자)
    {
      reviewer_id: ids["maria.santos@kantodemo.com"],
      reviewee_id: ids["joseph.ramos@kantodemo.com"],
      rating: 5,
      role: "seller",
      content: "빠르게 연락 주시고 약속 장소에 일찍 도착하셨어요. 쾌적한 거래였습니다.",
      post_title: "iPhone 13 128GB 미개봉 팝니다",
      post_price: 25000,
    },
    // Rosa → Juan (구매자 → 판매자, TV)
    {
      reviewer_id: ids["rosa.garcia@kantodemo.com"],
      reviewee_id: ids["juan.delacruz@kantodemo.com"],
      rating: 4,
      role: "buyer",
      content: "TV 상태 괜찮았고 가격 대비 만족합니다. 리모컨 포함해 주셔서 감사합니다. 다만 연락이 조금 늦어서 아쉬웠어요.",
      post_title: "삼성 40인치 TV 팝니다 (이사로 인한 처분)",
      post_price: 8000,
    },
    // Juan → Rosa (판매자 → 구매자, TV)
    {
      reviewer_id: ids["juan.delacruz@kantodemo.com"],
      reviewee_id: ids["rosa.garcia@kantodemo.com"],
      rating: 4,
      role: "seller",
      content: "직거래로 빠르게 처리해주셨습니다. 제품 확인하시고 바로 계산해주셨어요. 감사합니다.",
      post_title: "삼성 40인치 TV 팝니다 (이사로 인한 처분)",
      post_price: 8000,
    },
    // Miguel → Linda (구매자 → 판매자, 노트북)
    {
      reviewer_id: ids["miguel.torres@kantodemo.com"],
      reviewee_id: ids["linda.cruz@kantodemo.com"],
      rating: 5,
      role: "buyer",
      content: "노트북 상태가 정말 새것이나 다름없네요. 스펙 질문에 친절하게 답해주시고, 파우치까지 서비스로 주셨습니다. 적극 추천합니다!",
      post_title: "노트북 판매 (LG 그램 14인치, 2022년형)",
      post_price: 42000,
    },
    // Ana → Joseph (구인에 지원한 구인자를 리뷰 - 고용주 → 직원)
    {
      reviewer_id: ids["ana.reyes@kantodemo.com"],
      reviewee_id: ids["joseph.ramos@kantodemo.com"],
      rating: 4,
      role: "buyer",
      content: "영업 능력이 뛰어나고 한국어도 유창하십니다. 팀에 빠르게 적응하셨어요. 다음에도 함께 일하고 싶습니다.",
      post_title: "한국어 가능 영업사원 채용 (마카티)",
      post_price: 28000,
    },
  ];

  for (const r of reviews) {
    const { error } = await admin.from("reviews").insert({
      ...r,
      created_at: daysAgo(Math.floor(Math.random() * 30 + 1)),
    });
    if (error) console.warn(`  ⚠️  리뷰 삽입 실패:`, error.message);
    else console.log(`  ✅ 리뷰: ${r.reviewer_id} → ${r.reviewee_id} (★${r.rating})`);
  }
}

// ──────────────────────────────────────────────
// 9. 좋아요 (공통)
// ──────────────────────────────────────────────
async function seedLikes(ids: Record<string, number>) {
  console.log("\n❤️  좋아요 데이터 생성 중...");

  // 게시글 ID 조회 (중고물품 + 렌탈 게시글)
  const { data: posts } = await admin
    .from("posts")
    .select("id, post_type, user_id")
    .in("post_type", ["used_goods", "rental", "jobs", "meetup"])
    .eq("status", "active")
    .limit(50);

  if (!posts || posts.length === 0) return;

  const userIds = Object.values(ids);
  let count = 0;

  for (const post of posts) {
    // 각 게시글에 랜덤 2~5명의 좋아요
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const likers = shuffled.slice(0, Math.floor(Math.random() * 4) + 2);

    for (const userId of likers) {
      if (userId === post.user_id) continue; // 자기 자신 제외
      const { error } = await admin.from("common_likes").insert({
        target_id: post.id,
        target_type: "post",
        user_id: userId,
      });
      if (!error) count++;
    }
  }

  console.log(`  ✅ 좋아요 ${count}개 생성`);
}

// ──────────────────────────────────────────────
// 10. KTS 히스토리
// ──────────────────────────────────────────────
async function seedTrustHistory(ids: Record<string, number>) {
  console.log("\n📈 KTS 히스토리 생성 중...");

  const userMap = new Map(USERS.map((u) => [u.email, u]));

  for (const [email, userId] of Object.entries(ids)) {
    const user = userMap.get(email);
    if (!user) continue;

    const currentGradeLevel =
      user.kts_grade === "A" ? 4
      : user.kts_grade === "B" ? 3
      : user.kts_grade === "C" ? 2
      : user.kts_grade === "D" ? 1
      : 0;

    // 4주 히스토리 (이번 주 포함)
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      const weekDate = new Date();
      // 이번 주 월요일
      weekDate.setDate(weekDate.getDate() - weekDate.getDay() + 1 - weekOffset * 7);
      const weekStr = weekDate.toISOString().split("T")[0];

      // 시간 흐름에 따라 점수가 개선되는 패턴
      const trendOffset = weekOffset === 0 ? 0 : -(weekOffset * 3 + Math.floor(Math.random() * 5));
      const historicScore = Math.max(0, Math.min(100, user.kts_score + trendOffset));
      const historicGrade =
        historicScore >= 90 ? 4
        : historicScore >= 75 ? 3
        : historicScore >= 50 ? 2
        : historicScore >= 30 ? 1
        : 0;

      const { error } = await admin.from("user_trust_history").insert({
        user_id: userId,
        week_date: weekStr,
        kts_score: Math.round(historicScore),
        grade_level: historicGrade,
      });

      if (error && !error.message.includes("duplicate")) {
        console.warn(`  ⚠️  trust_history 삽입 실패 (user=${userId}):`, error.message);
      }
    }
  }

  console.log(`  ✅ ${Object.keys(ids).length}명의 KTS 히스토리 4주분 생성`);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  console.log("🚀 Kanto 가계정 시드 시작...\n");
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  공통 비밀번호: ${PASSWORD}\n`);

  const ids = await seedUsers();
  await seedJobs(ids);
  await seedUsedGoods(ids);
  await seedRentals(ids);
  const meetupPostIds = await seedMeetups(ids);
  await seedMeetupParticipants(ids, meetupPostIds);
  await seedReviews(ids);
  await seedLikes(ids);
  await seedTrustHistory(ids);

  console.log("\n✨ 시드 완료!\n");
  console.log("─────────────────────────────────────────────");
  console.log("📧 가계정 목록 (비밀번호: Kanto1234!)");
  console.log("─────────────────────────────────────────────");
  for (const [email, id] of Object.entries(ids)) {
    const user = USERS.find((u) => u.email === email)!;
    console.log(`  [${user.kts_grade}] ${user.name.padEnd(16)} id=${id}  ${email}`);
  }
  console.log("─────────────────────────────────────────────");
}

main().catch((e) => {
  console.error("❌ 치명적 오류:", e);
  process.exit(1);
});
