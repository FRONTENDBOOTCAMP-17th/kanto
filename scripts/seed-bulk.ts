/**
 * Kanto 대규모 더미 데이터 시드 (90명 추가 → 총 100명)
 *
 * 실행: npx tsx scripts/seed-bulk.ts
 * (seed.ts 로 10명 먼저 생성한 후 실행)
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").replace(/\r/g, "").split("\n")) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────
const PASSWORD = "Kanto1234!";

function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function daysFromNow(n: number): string { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); }
function pick<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

// ──────────────────────────────────────────────
// 이름 풀
// ──────────────────────────────────────────────
const MALE_FIRST = [
  "Jose","Juan","Miguel","Carlos","Fernando","Roberto","Eduardo","Antonio","Ramon","Luis",
  "Pedro","Mario","Gabriel","Ricardo","Daniel","Jorge","Felipe","Angelo","Mark","John",
  "Paul","Jerome","Ryan","Kevin","Jason","Kenneth","Ronald","Dennis","Victor","Manuel",
  "Rodel","Arnel","Marlon","Jonel","Alvin","Edwin","Erwin","Darwin","Noel","Joel",
  "Bernard","Renato","Ernesto","Alfredo","Rodrigo","Domingo","Danilo","Rolando","Nelson","Raul",
];
const FEMALE_FIRST = [
  "Maria","Ana","Rosa","Elena","Linda","Carmen","Gloria","Patricia","Teresa","Marisol",
  "Jennifer","Michelle","Angelica","Christine","Kristine","Lorraine","Rachel","Melody","Jasmine","Grace",
  "Alma","Cynthia","Marilyn","Nora","Luz","Divina","Precious","Princess","Myra","Lina",
  "Rowena","Leonora","Teresita","Consuelo","Remedios","Milagros","Estrella","Perla","Zenaida","Felicitas",
  "Sheryl","Charisse","Renalyn","Sharmaine","Jhane","Glenda","Lorna","Rosario","Dolores","Corazon",
];
const LAST_NAMES = [
  "Santos","Reyes","Cruz","Bautista","Ocampo","Garcia","Mendoza","Torres","Flores","Ramos",
  "Lim","Tan","Co","Sy","Go","Aquino","Gonzales","Diaz","Castro","Lopez",
  "Perez","Gomez","Rivera","Morales","Villanueva","Pascual","Aguilar","Domingo","Luna","Dela Cruz",
  "Fernandez","Castillo","Valdez","Navarro","Magno","Gutierrez","Hernandez","Salazar","Soriano","Panganiban",
  "Manalo","Ignacio","Mateo","Santiago","Delos Santos","Macapagal","Estrada","Arroyo","Pimentel","Enrile",
];

const REGIONS = [
  "BGC / Taguig","BGC / Taguig","Makati","Makati","Quezon City","Quezon City",
  "Mandaluyong / Pasig","Mandaluyong / Pasig","Pasay / Paranaque","Pampanga","그 외 지역",
];

type TradeLocation =
  | "BGC / Taguig" | "Makati" | "Pasay / Paranaque"
  | "Quezon City" | "Mandaluyong / Pasig" | "Pampanga" | "그 외 지역";

const LOCATIONS: TradeLocation[] = [
  "BGC / Taguig","BGC / Taguig","Makati","Makati","Pasay / Paranaque",
  "Quezon City","Quezon City","Mandaluyong / Pasig","Pampanga","그 외 지역",
];

// KTS 분포: A(10%) B(25%) C(40%) D(20%) E(5%)
const KTS_POOL: { grade: string; scoreMin: number; scoreMax: number }[] = [
  ...Array(10).fill({ grade: "A", scoreMin: 90, scoreMax: 100 }),
  ...Array(25).fill({ grade: "B", scoreMin: 75, scoreMax: 89 }),
  ...Array(40).fill({ grade: "C", scoreMin: 50, scoreMax: 74 }),
  ...Array(20).fill({ grade: "D", scoreMin: 30, scoreMax: 49 }),
  ...Array(5).fill({ grade: "E", scoreMin: 0, scoreMax: 29 }),
];

// ──────────────────────────────────────────────
// 게시글 템플릿 풀
// ──────────────────────────────────────────────
const JOB_TEMPLATES = [
  { title: "편의점 야간 직원 구합니다", company: "GS25 BGC점", type: "파트타임", salary: 500, sType: "시급", days: ["화","수","목","금","토"], hours: "22:00 - 06:00", industry: "요식업/서비스직", intro: "BGC 편의점 야간 아르바이트 모집합니다. 경험 무관.", task: "상품 진열, 계산, 매장 청결 유지", tags: ["local_resident","immediate_start","entry_level"] },
  { title: "한식당 주방 보조 구인 (마카티)", company: "서울가든 레스토랑", type: "정규직", salary: 18000, sType: "월급", days: ["월","화","수","목","금"], hours: "09:00 - 18:00", industry: "요식업/서비스직", intro: "마카티 소재 한식 레스토랑 주방 보조 직원 모집.", task: "식재료 손질, 주방 보조, 설거지, 청소", tags: ["local_resident","food_service","entry_level"] },
  { title: "카카오 번역 통역사 모집", company: "KorBiz Solutions", type: "계약직", salary: 35000, sType: "월급", days: ["월","화","수","목","금"], hours: "09:00 - 18:00", industry: "통번역", intro: "한국-필리핀 비즈니스 통역 및 번역 업무를 담당할 분을 모집합니다.", task: "문서 번역, 화상회의 통역, 이메일 코레스폰던스", tags: ["korean","tagalog","translation","nine_g_visa"] },
  { title: "고객 서비스 담당 (CS) 정규직", company: "Manila Korean Center", type: "정규직", salary: 22000, sType: "월급", days: ["월","화","수","목","금"], hours: "08:00 - 17:00", industry: "고객서비스/CS", intro: "한국 고객 대상 CS 업무를 담당할 직원을 채용합니다.", task: "전화/이메일 고객 응대, 민원 처리, 데이터 입력", tags: ["korean","english","customer_service_cs","entry_level"] },
  { title: "IT 개발자 (React/Next.js) 채용", company: "TechPH Corporation", type: "정규직", salary: 55000, sType: "월급", days: ["월","화","수","목","금"], hours: "09:00 - 18:00", industry: "IT/개발", intro: "스타트업 분위기의 IT 기업. 리모트 가능.", task: "React/Next.js 프론트엔드 개발, REST API 연동, 코드 리뷰", tags: ["english","it_dev","three_to_five","remote_hybrid"] },
  { title: "물류창고 직원 모집 (파사이)", company: "PH Logistics Hub", type: "정규직", salary: 16000, sType: "월급", days: ["월","화","수","목","금","토"], hours: "07:00 - 16:00", industry: "물류/무역", intro: "파사이 물류창고에서 근무할 직원을 모집합니다.", task: "입출고 관리, 재고 정리, 지게차 운전(면허 보유자 우대)", tags: ["local_resident","immediate_start","logistics_trade"] },
  { title: "마케팅 담당자 신입 채용", company: "Korean Startup PH", type: "정규직", salary: 20000, sType: "월급", days: ["월","화","수","목","금"], hours: "09:00 - 18:00", industry: "영업/마케팅", intro: "SNS 마케팅 및 콘텐츠 제작을 담당할 신입 사원을 채용합니다.", task: "SNS 콘텐츠 기획/운영, 광고 집행, 인플루언서 협업", tags: ["english","sales_marketing","entry_level","remote_hybrid"] },
  { title: "카지노 딜러 구합니다 (영어 가능자)", company: "Resorts World Manila", type: "정규직", salary: 25000, sType: "월급", days: ["화","수","목","금","토","일"], hours: "협의", industry: "카지노/게이밍", intro: "대형 카지노 리조트 딜러 채용. 교육 후 배치.", task: "카드게임 딜링, 고객 서비스, 칩 관리", tags: ["english","tagalog","casino_gaming","long_term"] },
  { title: "회계 담당 직원 (영어 가능)", company: "KorPil Accounting", type: "정규직", salary: 28000, sType: "월급", days: ["월","화","수","목","금"], hours: "08:30 - 17:30", industry: "사무/총무", intro: "한국-필리핀 합작 회계 법인 직원 채용.", task: "장부 기장, 세금 신고, 회계 보고서 작성", tags: ["english","office_admin","one_to_three"] },
  { title: "배달 드라이버 모집 (오토바이 보유자)", company: "QuickRide Delivery", type: "계약직", salary: 700, sType: "시급", days: ["월","화","수","목","금","토","일"], hours: "자유", industry: "기타", intro: "오토바이 보유자 대상 배달 드라이버 모집. 일급 정산 가능.", task: "음식/물품 배달, GPS 앱 사용", tags: ["local_resident","drivers_license","entry_level"] },
  { title: "영어 강사 모집 (한국인 학생 대상)", company: "English Bridge PH", type: "파트타임", salary: 800, sType: "시급", days: ["월","화","수","목","금"], hours: "협의", industry: "기타", intro: "한국인 학생 영어 튜터링 강사를 모집합니다. 경험자 우대.", task: "1:1 영어 회화 수업, 교재 준비, 숙제 피드백", tags: ["english","tagalog","entry_level"] },
  { title: "디자이너 (그래픽/UI) 경력직 채용", company: "Creative Manila Studio", type: "정규직", salary: 40000, sType: "월급", days: ["월","화","수","목","금"], hours: "09:00 - 18:00", industry: "디자인", intro: "SNS 콘텐츠, 브랜딩, UI/UX 디자인 담당. 포트폴리오 필수.", task: "브랜드 아이덴티티 디자인, SNS 콘텐츠, 웹 UI 제작", tags: ["english","design","three_to_five","remote_hybrid"] },
  { title: "청소부/청소 스태프 (BGC 오피스)", company: "Clean Pro Services", type: "정규직", salary: 14000, sType: "월급", days: ["월","화","수","목","금"], hours: "06:00 - 15:00", industry: "기타", intro: "BGC 오피스 빌딩 청소 직원 모집.", task: "사무실 청소, 화장실 청결 유지, 쓰레기 처리", tags: ["local_resident","immediate_start","long_term"] },
  { title: "웨이터/웨이트리스 파트타임 (주말)", company: "Seoulful Bistro", type: "파트타임", salary: 550, sType: "시급", days: ["토","일"], hours: "11:00 - 22:00", industry: "요식업/서비스직", intro: "주말 파트타임 서빙 직원 구합니다. 한식당.", task: "주문 접수, 서빙, 계산", tags: ["local_resident","food_service","entry_level"] },
  { title: "소셜미디어 매니저 (한국 브랜드 담당)", company: "K-Brand Philippines", type: "정규직", salary: 30000, sType: "월급", days: ["월","화","수","목","금"], hours: "09:00 - 18:00", industry: "영업/마케팅", intro: "한국 뷰티/패션 브랜드 필리핀 SNS 운영. 한국어/영어 모두 가능자.", task: "Instagram/Facebook/TikTok 운영, 콘텐츠 제작, 광고 관리", tags: ["korean","english","sales_marketing","one_to_three"] },
];

type ProductCondition = "미개봉" | "가벼운 사용감" | "사용감 있음" | "기타";

const GOODS_TEMPLATES: {
  title: string; category: string; content: string;
  priceMin: number; priceMax: number;
  condition: ProductCondition; safe: boolean;
  imgs: string[];
}[] = [
  { title: "에어팟 프로 2세대 판매", category: "전자기기", content: "에어팟 프로 2세대입니다. 노이즈캔슬링 최고. 박스 포함, 케이스 스크래치 약간 있음.", priceMin: 6000, priceMax: 8000, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400"] },
  { title: "갤럭시 S23 Ultra 256GB", category: "전자기기", content: "갤럭시 S23 울트라 256GB 블랙. S펜 포함. 액정 보호 필름 부착 상태. 기스 없음.", priceMin: 35000, priceMax: 45000, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"] },
  { title: "소파 1+2+3인용 세트 판매", category: "가구/인테리어", content: "이사로 인한 판매. 패브릭 소파 세트 3종. 오염 없음. 직접 픽업 가능한 분만.", priceMin: 15000, priceMax: 20000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"] },
  { title: "닌텐도 스위치 OLED + 게임 3개", category: "전자기기", content: "닌텐도 스위치 OLED 화이트. 마리오카트, 젤다, 포켓몬 포함. 충전독, 케이블, 케이스 포함.", priceMin: 20000, priceMax: 25000, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400"] },
  { title: "에어컨 1.5HP 판매 (설치비 별도)", category: "가전제품", content: "윈도우형 에어컨 1.5HP. 냉방 잘 됩니다. 설치비는 구매자 부담. 작동 영상 확인 가능.", priceMin: 8000, priceMax: 12000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=400"] },
  { title: "책상 + 의자 세트 (홈오피스용)", category: "가구/인테리어", content: "홈오피스 책상(120x60) + 인체공학 의자. 상태 좋음. 조립 필요 없이 완제품으로 드림.", priceMin: 5000, priceMax: 8000, condition: "가벼운 사용감", safe: false, imgs: ["https://images.unsplash.com/photo-1593640408182-31c228cf69bd?w=400"] },
  { title: "러닝머신 (접이식) 판매", category: "스포츠/레저", content: "접이식 러닝머신. 최대속도 12km/h. 인클라인 3단계. 사용 기간 6개월. 직거래 또는 배송 협의.", priceMin: 10000, priceMax: 15000, condition: "가벼운 사용감", safe: false, imgs: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"] },
  { title: "명품 가방 (구찌 숄더백)", category: "패션/잡화", content: "정품 구찌 GG 마몬트 미니 숄더백. 블랙. 정품 영수증 보유. 보증서 포함.", priceMin: 45000, priceMax: 60000, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"] },
  { title: "어쿠스틱 기타 입문용", category: "악기", content: "입문용 어쿠스틱 기타. 케이스, 피크 포함. 줄 최근 교체. 초보자도 바로 연주 가능.", priceMin: 2500, priceMax: 4000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400"] },
  { title: "다이슨 V11 무선 청소기", category: "가전제품", content: "다이슨 V11 무선 청소기. 흡입력 최강. 배터리 성능 좋음. 기본 악세서리 전부 포함.", priceMin: 15000, priceMax: 20000, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400"] },
  { title: "전동 킥보드 Xiaomi Pro 2", category: "스포츠/레저", content: "샤오미 전동 킥보드 Pro 2. 최대속도 25km/h. 배터리 상태 85%. 접이식. 충전기 포함.", priceMin: 12000, priceMax: 16000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"] },
  { title: "아이패드 에어 5세대 WiFi 64GB", category: "전자기기", content: "아이패드 에어 5세대 스타라이트. 사용감 거의 없음. 케이스, 충전기 포함. 학습용 최적.", priceMin: 28000, priceMax: 35000, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"] },
  { title: "냉장고 2도어 양문형 판매", category: "가전제품", content: "삼성 양문형 냉장고 600L. 이사로 인해 급매. 상태 매우 좋음. 자가 운반 가능한 분 우선.", priceMin: 20000, priceMax: 28000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400"] },
  { title: "남성 정장 세트 (자켓+바지 2벌)", category: "패션/잡화", content: "남성 정장 자켓+바지 2세트. 사이즈 M. 블랙+네이비. 드라이클리닝 완료.", priceMin: 3000, priceMax: 5000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1594938298603-c8148c4b4f46?w=400"] },
  { title: "캠핑 텐트 4인용 + 매트 세트", category: "스포츠/레저", content: "4인용 돔 텐트 + 접이식 매트 포함. 방수 기능 이상 없음. 2회 사용.", priceMin: 4000, priceMax: 6000, condition: "가벼운 사용감", safe: false, imgs: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400"] },
  { title: "블루투스 스피커 (JBL Charge 5)", category: "전자기기", content: "JBL Charge 5 블루투스 스피커. IP67 방수. 배터리 20시간. 색상 블랙. 정품 충전 케이블 포함.", priceMin: 4500, priceMax: 6500, condition: "가벼운 사용감", safe: true, imgs: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"] },
  { title: "세탁기 8kg 드럼세탁기 판매", category: "가전제품", content: "LG 드럼 세탁기 8kg. 이사로 판매. 작동 완벽. 호스 포함. 자체 운반 필수.", priceMin: 12000, priceMax: 16000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400"] },
  { title: "요가 매트 + 블록 + 스트랩 세트", category: "스포츠/레저", content: "6mm 두께 논슬립 요가 매트 + 코르크 블록 2개 + 스트랩 포함. 사용 3회.", priceMin: 800, priceMax: 1500, condition: "미개봉", safe: false, imgs: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"] },
  { title: "한국 교재 판매 (TOPIK + 회화)", category: "도서/교육", content: "한국어 능력시험 TOPIK 2 교재 3권 + 회화 교재 2권. 필기 거의 없음.", priceMin: 500, priceMax: 1000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"] },
  { title: "커피머신 (드롱기 에스프레소)", category: "주방/생활", content: "드롱기 에스프레소 머신. 1그룹. 스팀 완벽. 청소 완료 후 판매. 커피 필터 포함.", priceMin: 8000, priceMax: 12000, condition: "사용감 있음", safe: true, imgs: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"] },
  { title: "미개봉 향수 세트 (샤넬 No.5)", category: "뷰티/헬스", content: "미개봉 샤넬 No.5 오드퍼퓸 50ml + 바디로션 세트. 선물용으로 받은 것 사용 안 함.", priceMin: 6000, priceMax: 8000, condition: "미개봉", safe: true, imgs: ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=400"] },
  { title: "식탁 4인용 + 의자 4개", category: "가구/인테리어", content: "원목 식탁 4인용. 의자 4개 포함. 표면 기스 약간. 픽업 가능한 분만.", priceMin: 8000, priceMax: 12000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"] },
  { title: "골프채 세트 (입문용, 14개)", category: "스포츠/레저", content: "입문용 골프채 풀세트 14개. 드라이버, 아이언, 퍼터 포함. 캐디백 포함.", priceMin: 15000, priceMax: 22000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400"] },
  { title: "전기밥솥 10인용 쿠쿠", category: "주방/생활", content: "쿠쿠 IH 전기밥솥 10인용. 압력밥솥 기능 포함. 상태 깨끗함.", priceMin: 3000, priceMax: 5000, condition: "가벼운 사용감", safe: false, imgs: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"] },
  { title: "자전거 MTB 26인치", category: "스포츠/레저", content: "산악자전거 26인치. 21단 변속. 앞뒤 디스크 브레이크. 전조등 포함.", priceMin: 5000, priceMax: 8000, condition: "사용감 있음", safe: false, imgs: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400"] },
];

const RENTAL_TEMPLATES: {
  titlePrefix: string; roomType: string; rentType: string;
  priceMin: number; priceMax: number; depositMult: number;
  descTemplate: string; amenities: string[];
  maxOccupants: number; imgs: string[];
}[] = [
  { titlePrefix: "스튜디오 풀퍼니시드 임대", roomType: "스튜디오", rentType: "월세", priceMin: 12000, priceMax: 30000, depositMult: 2, descTemplate: "에 위치한 풀퍼니시드 스튜디오. 에어컨, 냉장고, 침대 완비.", amenities: ["에어컨","냉장고","인터넷","세탁기"], maxOccupants: 2, imgs: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400","https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400"] },
  { titlePrefix: "원룸 임대", roomType: "원룸", rentType: "월세", priceMin: 7000, priceMax: 18000, depositMult: 2, descTemplate: "근처 원룸 임대. 깨끗하고 조용한 환경.", amenities: ["에어컨","냉장고","인터넷"], maxOccupants: 1, imgs: ["https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400"] },
  { titlePrefix: "콘도 투룸 장기 임대", roomType: "투룸", rentType: "월세", priceMin: 25000, priceMax: 50000, depositMult: 2, descTemplate: "에 위치한 콘도 2베드룸. 수영장, 헬스장 공용 이용 가능.", amenities: ["에어컨","냉장고","세탁기","인터넷","수영장","헬스장","엘리베이터","보안요원","주차"], maxOccupants: 4, imgs: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400","https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=400"] },
  { titlePrefix: "베드스페이스 임대 (에어컨 방)", roomType: "원룸", rentType: "월세", priceMin: 3000, priceMax: 6000, depositMult: 1, descTemplate: "에어컨 방 베드스페이스. 인터넷 포함. 남/여 무관.", amenities: ["에어컨","인터넷","세탁기","냉장고"], maxOccupants: 4, imgs: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400"] },
  { titlePrefix: "아파트 1BR 단기 임대", roomType: "아파트", rentType: "월세", priceMin: 15000, priceMax: 35000, depositMult: 2, descTemplate: "단기(3개월~) 임대 가능. 가전 완비. 한국인 거주 많은 단지.", amenities: ["에어컨","냉장고","세탁기","인터넷","엘리베이터","보안요원"], maxOccupants: 2, imgs: ["https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=400","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"] },
];

const MEETUP_TEMPLATES = [
  { topicBase: "한국어-따갈로그어 언어 교환", descBase: "언어 교환 파트너를 찾으시나요? 매주 토요일 오전 BGC에서 모입니다. 한국어 배우는 필리핀 분들과 따갈로그어 배우는 한국 분들 환영!", maxP: 20 },
  { topicBase: "필리핀 한인 취업 정보 공유 모임", descBase: "마닐라에서 취업을 준비하거나 이직을 고민 중인 분들을 위한 모임입니다. 각자의 경험과 정보를 나눠요.", maxP: 25 },
  { topicBase: "BGC 주말 러닝 크루", descBase: "BGC 공원에서 함께 달리실 분들 모집합니다. 속도 무관, 초보자 환영. 매주 일요일 오전 6시 출발!", maxP: 30 },
  { topicBase: "필리핀 음식 투어 & 맛집 탐방", descBase: "필리핀 전통 음식부터 로컬 맛집까지 함께 탐방합니다. 다음 목적지: Quiapo 로컬 시장!", maxP: 15 },
  { topicBase: "재필 한인 보드게임 클럽", descBase: "보드게임 좋아하시는 분들 모여요! 다양한 게임 보유 중. 음료/간식은 각자 부담. 초보자도 가르쳐드립니다.", maxP: 20 },
  { topicBase: "마닐라 사진 출사 모임", descBase: "사진 찍는 것 좋아하시는 분들과 함께 마닐라 곳곳을 출사합니다. 스마트폰, 카메라 모두 환영!", maxP: 20 },
  { topicBase: "필리핀 창업/사업 정보 공유", descBase: "필리핀에서 창업하거나 사업을 운영 중인 분들의 모임. 경험 공유, 네트워킹 목적.", maxP: 30 },
  { topicBase: "한인 바둑/장기 동호회", descBase: "바둑이나 장기를 좋아하시는 분들과 매주 모입니다. 실력 무관, 함께 즐기는 것이 목적!", maxP: 15 },
  { topicBase: "요리 클래스 - 필리핀 가정식 배우기", descBase: "필리핀 가정식 요리를 함께 배워보는 클래스. 재료비는 1인 500페소. 사전 예약 필수.", maxP: 12 },
  { topicBase: "마닐라 한인 독서 모임", descBase: "매월 한 권의 책을 읽고 이야기 나누는 독서 모임. 한국어/영어 도서 번갈아 선정.", maxP: 15 },
];

// 지역별 위경도 (대략)
const LOCATION_COORDS: Record<TradeLocation, [number, number]> = {
  "BGC / Taguig": [14.5547, 121.0490],
  "Makati": [14.5547, 121.0190],
  "Pasay / Paranaque": [14.5343, 121.0000],
  "Quezon City": [14.6760, 121.0437],
  "Mandaluyong / Pasig": [14.5794, 121.0359],
  "Pampanga": [15.0794, 120.6200],
  "그 외 지역": [14.5995, 120.9842],
};

const CITY_NAMES: Record<TradeLocation, string> = {
  "BGC / Taguig": "Taguig City",
  "Makati": "Makati City",
  "Pasay / Paranaque": "Pasay City",
  "Quezon City": "Quezon City",
  "Mandaluyong / Pasig": "Mandaluyong City",
  "Pampanga": "San Fernando City",
  "그 외 지역": "Manila City",
};

const REVIEW_CONTENTS = [
  ["정말 친절하고 거래가 빠릅니다. 강력 추천!", "약속 시간 잘 지키시고 물건 상태도 딱 설명대로였어요.", "믿을 수 있는 분입니다. 다음에도 거래하고 싶어요.", "포장 꼼꼼하게 해주셔서 감사합니다.", "질문에 친절하게 답변해 주셨어요. 감사합니다!"],
  ["좋은 구매자 분이셨어요. 바로 결제해주셔서 편했습니다.", "약속 잘 지키시고 계좌 이체도 빠르게 해주셨어요.", "시간 딱 맞춰 오셔서 너무 좋았습니다.", "흥정 없이 제시 가격에 바로 구매해주셨어요.", "친절하고 매너 좋은 구매자입니다."],
];

// ──────────────────────────────────────────────
// 1. 90명 유저 생성
// ──────────────────────────────────────────────
function generateUsers() {
  const users = [];
  const usedNames = new Set<string>();
  const genders = ["male", "female"] as const;

  for (let i = 0; i < 90; i++) {
    const gender = rand(genders);
    const firstName = rand(gender === "male" ? MALE_FIRST : FEMALE_FIRST);
    const lastName = rand(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    // 이름 충돌 방지: 중복이면 숫자 붙임
    let name = fullName;
    if (usedNames.has(name)) name = `${fullName} ${i + 1}`;
    usedNames.add(name);

    const ktsInfo = rand(KTS_POOL);
    const score = randInt(ktsInfo.scoreMin, ktsInfo.scoreMax);
    const avgRating = ktsInfo.grade === "E" ? randInt(10, 30) / 10
                    : ktsInfo.grade === "D" ? randInt(30, 39) / 10
                    : ktsInfo.grade === "C" ? randInt(35, 45) / 10
                    : ktsInfo.grade === "B" ? randInt(40, 48) / 10
                    : randInt(45, 50) / 10;

    const emailSlug = `${firstName.toLowerCase().replace(/\s/g,"")}${lastName.toLowerCase().replace(/\s/g,"")}${i + 11}`;

    users.push({
      email: `${emailSlug}@kantodemo.com`,
      name,
      phone: `+6392${randInt(10000000, 99999999)}`,
      region: rand(REGIONS),
      kts_score: score,
      kts_grade: ktsInfo.grade,
      avg_rating: Math.min(5.0, avgRating),
      post_count: randInt(0, 20),
      avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });
  }
  return users;
}

async function seedBulkUsers(): Promise<number[]> {
  console.log("\n📋 90명 유저 생성 중...");
  const users = generateUsers();
  const ids: number[] = [];

  // auth user 목록 미리 조회 (API 호출 최소화)
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set(listData?.users?.map(u => u.email) ?? []);

  for (let i = 0; i < users.length; i++) {
    const u = users[i];

    let authId: string;
    if (existingEmails.has(u.email)) {
      const existing = listData!.users!.find(au => au.email === u.email)!;
      authId = existing.id;
    } else {
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: u.name },
      });
      if (authErr || !authData.user) {
        console.warn(`  ⚠️  ${u.email} auth 생성 실패:`, authErr?.message);
        continue;
      }
      authId = authData.user.id;
    }

    const { data: row, error: dbErr } = await admin
      .from("users")
      .upsert({
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
        created_at: daysAgo(randInt(7, 365)),
      }, { onConflict: "auth_id" })
      .select("id")
      .single();

    if (dbErr || !row) {
      console.warn(`  ⚠️  ${u.email} users 저장 실패:`, dbErr?.message);
      continue;
    }

    ids.push(row.id);
    if ((i + 1) % 10 === 0) console.log(`  ... ${i + 1}/90 완료`);
  }

  console.log(`  ✅ ${ids.length}명 생성 완료`);
  return ids;
}

// ──────────────────────────────────────────────
// 2. 구인 게시글 (30건)
// ──────────────────────────────────────────────
async function seedBulkJobs(userIds: number[]) {
  console.log("\n💼 구인 게시글 30건 생성 중...");
  let count = 0;

  for (let i = 0; i < 30; i++) {
    const tpl = JOB_TEMPLATES[i % JOB_TEMPLATES.length];
    const loc = rand(LOCATIONS);
    const userId = rand(userIds);
    const salary = tpl.sType === "시급"
      ? randInt(450, 700)
      : tpl.sType === "주급"
      ? randInt(3000, 6000)
      : randInt(14000, 60000);

    const { data: post, error: pErr } = await admin.from("posts").insert({
      user_id: userId,
      title: `${tpl.title} (${loc})`,
      post_type: "jobs",
      status: "active",
      view_count: randInt(30, 800),
      like_count: randInt(0, 50),
      created_at: daysAgo(randInt(1, 60)),
    }).select("id").single();

    if (pErr || !post) continue;

    const { error: jErr } = await admin.from("jobs").insert({
      post_id: post.id,
      company_name: tpl.company,
      company_intro: tpl.intro,
      main_task: tpl.task,
      salary,
      salary_type: tpl.sType,
      employee_type: tpl.type,
      deadline: daysFromNow(randInt(7, 60)),
      location_type: loc,
      work_days: tpl.days,
      work_hours: tpl.hours,
      is_time_negotiable: Math.random() < 0.3,
      industry: tpl.industry,
      preferred_tags: tpl.tags,
      company_year: Math.random() < 0.7 ? randInt(2010, 2023) : null,
      employee_count: Math.random() < 0.7 ? randInt(5, 200) : null,
    });

    if (!jErr) count++;
  }
  console.log(`  ✅ 구인 ${count}건 생성`);
}

// ──────────────────────────────────────────────
// 3. 중고거래 (50건)
// ──────────────────────────────────────────────
async function seedBulkGoods(userIds: number[]) {
  console.log("\n🛍️  중고거래 50건 생성 중...");
  let count = 0;

  for (let i = 0; i < 50; i++) {
    const tpl = GOODS_TEMPLATES[i % GOODS_TEMPLATES.length];
    const loc = rand(LOCATIONS);
    const [lat, lng] = LOCATION_COORDS[loc];
    const price = randInt(tpl.priceMin, tpl.priceMax);
    const userId = rand(userIds);
    const isSold = Math.random() < 0.15;

    const { data: post, error: pErr } = await admin.from("posts").insert({
      user_id: userId,
      title: tpl.title,
      post_type: "used_goods",
      status: "active",
      view_count: randInt(20, 600),
      like_count: randInt(0, 40),
      is_sold: isSold,
      created_at: daysAgo(randInt(1, 45)),
    }).select("id").single();

    if (pErr || !post) continue;

    const { error: gErr } = await admin.from("used_goods").insert({
      post_id: post.id,
      category: tpl.category,
      content: tpl.content,
      price,
      condition: tpl.condition,
      location_type: loc,
      location_city: CITY_NAMES[loc],
      location_lat: lat + (Math.random() - 0.5) * 0.02,
      location_lng: lng + (Math.random() - 0.5) * 0.02,
      safe_payment: tpl.safe,
      images: tpl.imgs,
    });

    if (!gErr) count++;
  }
  console.log(`  ✅ 중고거래 ${count}건 생성`);
}

// ──────────────────────────────────────────────
// 4. 렌탈 (25건)
// ──────────────────────────────────────────────
async function seedBulkRentals(userIds: number[]) {
  console.log("\n🏠 렌탈 25건 생성 중...");
  let count = 0;

  for (let i = 0; i < 25; i++) {
    const tpl = RENTAL_TEMPLATES[i % RENTAL_TEMPLATES.length];
    const loc = rand(LOCATIONS);
    const [lat, lng] = LOCATION_COORDS[loc];
    const price = randInt(tpl.priceMin, tpl.priceMax);
    const deposit = price * tpl.depositMult;
    const userId = rand(userIds);

    const { data: post, error: pErr } = await admin.from("posts").insert({
      user_id: userId,
      title: `${loc} ${tpl.titlePrefix}`,
      post_type: "rental",
      status: "active",
      view_count: randInt(50, 500),
      like_count: randInt(0, 35),
      created_at: daysAgo(randInt(1, 60)),
    }).select("id").single();

    if (pErr || !post) continue;

    const { error: rErr } = await admin.from("rentals").insert({
      post_id: post.id,
      price,
      deposit,
      rent_type: tpl.rentType,
      room_type: tpl.roomType,
      description: `${loc}${tpl.descTemplate}`,
      location: loc,
      location_city: CITY_NAMES[loc],
      location_lat: lat + (Math.random() - 0.5) * 0.02,
      location_lng: lng + (Math.random() - 0.5) * 0.02,
      max_occupants: tpl.maxOccupants,
      amenities: pick(tpl.amenities, Math.min(tpl.amenities.length, randInt(3, tpl.amenities.length))),
      images: tpl.imgs,
    });

    if (!rErr) count++;
  }
  console.log(`  ✅ 렌탈 ${count}건 생성`);
}

// ──────────────────────────────────────────────
// 5. 모임 (10건)
// ──────────────────────────────────────────────
async function seedBulkMeetups(userIds: number[]) {
  console.log("\n🤝 모임 10건 생성 중...");
  let count = 0;

  for (let i = 0; i < 10; i++) {
    const tpl = MEETUP_TEMPLATES[i % MEETUP_TEMPLATES.length];
    const loc = rand(LOCATIONS);
    const [lat, lng] = LOCATION_COORDS[loc];
    const userId = rand(userIds);
    const daysOffset = randInt(5, 45);

    const startDate = new Date(daysFromNow(daysOffset));
    startDate.setHours(rand([9, 10, 14, 15, 16]), 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + rand([2, 3, 4]));

    const { data: post, error: pErr } = await admin.from("posts").insert({
      user_id: userId,
      title: `[${loc}] ${tpl.topicBase}`,
      post_type: "meetup",
      status: "active",
      view_count: randInt(30, 300),
      like_count: randInt(0, 25),
      created_at: daysAgo(randInt(1, 10)),
    }).select("id").single();

    if (pErr || !post) continue;

    const { error: mErr } = await admin.from("meetups").insert({
      post_id: post.id,
      topic: tpl.topicBase,
      description: tpl.descBase,
      location_address: `${CITY_NAMES[loc]}, ${loc}`,
      location_lat: lat + (Math.random() - 0.5) * 0.02,
      location_lng: lng + (Math.random() - 0.5) * 0.02,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      max_participants: tpl.maxP,
    });

    if (mErr) continue;

    // 채팅룸
    const chatExpiry = new Date(endDate);
    chatExpiry.setDate(chatExpiry.getDate() + 3);
    await admin.from("meetup_chat_rooms").insert({
      meetup_post_id: post.id,
      expires_at: chatExpiry.toISOString(),
      status: "active",
    });

    // 모임 참가자 3~8명
    const participants = pick(userIds, randInt(3, 8));
    for (const pUserId of participants) {
      await admin.from("meetup_participants").insert({
        meetup_post_id: post.id,
        user_id: pUserId,
        status: "joined",
      }); // 중복 에러 무시
    }

    count++;
  }
  console.log(`  ✅ 모임 ${count}건 생성`);
}

// ──────────────────────────────────────────────
// 6. 리뷰 (60건)
// ──────────────────────────────────────────────
async function seedBulkReviews(userIds: number[]) {
  console.log("\n⭐ 리뷰 60건 생성 중...");
  let count = 0;
  const pairs = new Set<string>();

  while (count < 60) {
    const reviewerId = rand(userIds);
    const revieweeId = rand(userIds);
    if (reviewerId === revieweeId) continue;

    const key = `${reviewerId}-${revieweeId}`;
    if (pairs.has(key)) continue;
    pairs.add(key);

    const role = rand(["buyer", "seller"]);
    const rating = rand([3, 4, 4, 4, 5, 5, 5]);
    const contents = REVIEW_CONTENTS[role === "buyer" ? 0 : 1];

    const { error } = await admin.from("reviews").insert({
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      role,
      content: rand(contents),
      created_at: daysAgo(randInt(1, 90)),
    });

    if (!error) count++;
  }
  console.log(`  ✅ 리뷰 ${count}건 생성`);
}

// ──────────────────────────────────────────────
// 7. 좋아요
// ──────────────────────────────────────────────
async function seedBulkLikes(userIds: number[]) {
  console.log("\n❤️  좋아요 생성 중...");

  const { data: posts } = await admin
    .from("posts")
    .select("id, user_id")
    .eq("status", "active")
    .limit(200);

  if (!posts) return;
  let count = 0;

  for (const post of posts) {
    const likers = pick(userIds, randInt(2, 8)).filter(id => id !== post.user_id);
    for (const userId of likers) {
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
// 8. KTS 히스토리
// ──────────────────────────────────────────────
async function seedBulkTrustHistory(userIds: number[]) {
  console.log("\n📈 KTS 히스토리 생성 중...");

  const { data: users } = await admin
    .from("users")
    .select("id, kts_score, kts_grade")
    .in("id", userIds);

  if (!users) return;

  for (const u of users) {
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() - weekDate.getDay() + 1 - weekOffset * 7);
      const weekStr = weekDate.toISOString().split("T")[0];

      const trendOffset = weekOffset === 0 ? 0 : -(weekOffset * 3 + randInt(0, 5));
      const historicScore = Math.max(0, Math.min(100, (u.kts_score ?? 36) + trendOffset));
      const historicGrade = historicScore >= 90 ? 4 : historicScore >= 75 ? 3 : historicScore >= 50 ? 2 : historicScore >= 30 ? 1 : 0;

      try {
        await admin.from("user_trust_history").insert({
          user_id: u.id,
          week_date: weekStr,
          kts_score: Math.round(historicScore),
          grade_level: historicGrade,
        });
      } catch {}
    }
  }
  console.log(`  ✅ ${users.length}명 KTS 히스토리 생성`);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  console.log("🚀 Kanto 대규모 시드 시작 (90명 추가)...\n");

  const userIds = await seedBulkUsers();
  if (userIds.length === 0) { console.error("유저 생성 실패"); process.exit(1); }

  await seedBulkJobs(userIds);
  await seedBulkGoods(userIds);
  await seedBulkRentals(userIds);
  await seedBulkMeetups(userIds);
  await seedBulkReviews(userIds);
  await seedBulkLikes(userIds);
  await seedBulkTrustHistory(userIds);

  console.log("\n✨ 대규모 시드 완료!");
  console.log(`\n📊 추가된 데이터:`);
  console.log(`  👤 유저       ${userIds.length}명`);
  console.log(`  💼 구인       30건`);
  console.log(`  🛍️  중고거래   50건`);
  console.log(`  🏠 렌탈       25건`);
  console.log(`  🤝 모임       10건`);
  console.log(`  ⭐ 리뷰       60건`);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
