export type IndustryLeaf = { label: string };
export type IndustryMiddle = { label: string; children: IndustryLeaf[] };
export type IndustryMajor = { label: string; children: IndustryMiddle[] };

export const INDUSTRIES: IndustryMajor[] = [
  {
    label: "서비스업",
    children: [
      { label: "호텔/여행/항공", children: [
        { label: "호텔" }, { label: "호텔리어" }, { label: "리조트" }, { label: "관광" },
        { label: "프론트" }, { label: "여행사" }, { label: "콘도" }, { label: "컨시어지" },
        { label: "항공사" }, { label: "하우스키핑" }, { label: "여행상품안내·상담" }, { label: "카지노" },
        { label: "관광통역" }, { label: "캐셔" }, { label: "면세점" }, { label: "펜션" },
        { label: "승무원" }, { label: "GRO" }, { label: "현지가이드" }, { label: "골프회원권딜러" },
        { label: "렌트카" }, { label: "스튜어디스" }, { label: "카지노딜러" }, { label: "캐디" },
        { label: "벨맨" }, { label: "비자수속" }, { label: "민박" }, { label: "여권발급" },
        { label: "방가로" }, { label: "조종사" },
      ]},
      { label: "음식료/외식/프랜차이즈", children: [
        { label: "카페" }, { label: "프랜차이즈" }, { label: "음식료" }, { label: "제과제빵점" },
        { label: "양식당" }, { label: "한식당" }, { label: "커피숍" }, { label: "일식당" },
        { label: "식품" }, { label: "메뉴개발" }, { label: "패밀리레스토랑" }, { label: "단체급식" },
        { label: "메뉴기획" }, { label: "구내식당" }, { label: "퓨전푸드" }, { label: "중식당" },
        { label: "뷔페" }, { label: "와인바" }, { label: "패스트푸드" }, { label: "케이터링" },
        { label: "식품연구" }, { label: "점포개발" }, { label: "피자점" }, { label: "도시락·반찬" },
        { label: "호프" }, { label: "횟집" }, { label: "치킨전문점" }, { label: "출장요리" },
        { label: "찜질방" },
      ]},
      { label: "스포츠/여가/레저", children: [
        { label: "골프장" }, { label: "스포츠" }, { label: "스포츠센터" }, { label: "생활체육" },
        { label: "휘트니스센터" }, { label: "헬스트레이너" }, { label: "골프장클럽하우스" }, { label: "레저" },
        { label: "수영장" }, { label: "레포츠" }, { label: "놀이공원" }, { label: "캐디" },
        { label: "골프강사" }, { label: "오락" }, { label: "요가강사" }, { label: "PC방" },
        { label: "볼링" }, { label: "댄스" }, { label: "에어로빅" }, { label: "서바이벌게임" },
        { label: "래프팅" }, { label: "카약" }, { label: "승마" }, { label: "카누" },
        { label: "당구" }, { label: "수상스키" }, { label: "스쿼시" },
      ]},
      { label: "뷰티/미용", children: [
        { label: "마사지" }, { label: "스파" }, { label: "모발·두피관리" }, { label: "메이크업" },
        { label: "헤어샵" }, { label: "네일" }, { label: "언더라이팅" },
      ]},
      { label: "콜센터/아웃소싱/기타", children: [
        { label: "콜센터" }, { label: "아웃소싱" }, { label: "인포직원" }, { label: "OP" },
        { label: "포장" }, { label: "배달" }, { label: "세탁소" }, { label: "세탁프랜차이즈" },
        { label: "꽃집" },
      ]},
      { label: "정비/A/S/카센터", children: [
        { label: "자동차정비" }, { label: "A·S센터" }, { label: "경정비" }, { label: "카센터" },
        { label: "중정비" }, { label: "세차" }, { label: "검사소" }, { label: "주유소" },
      ]},
      { label: "렌탈/임대/리스", children: [
        { label: "렌탈" }, { label: "렌터카" }, { label: "임대" }, { label: "대여" }, { label: "오토리스" },
      ]},
      { label: "서치펌/헤드헌팅", children: [
        { label: "헤드헌팅" }, { label: "서치펌" },
      ]},
      { label: "시설관리/보안/경비", children: [
        { label: "시설관리" }, { label: "경비" }, { label: "청소·미화" }, { label: "보안" },
        { label: "주차·출입관리" }, { label: "공동주택관리" }, { label: "전기" }, { label: "매장·시설감시" },
        { label: "방역" }, { label: "배관" }, { label: "수도" },
      ]},
      { label: "웨딩/상조/이벤트", children: [
        { label: "웨딩컨설팅" }, { label: "상조서비스" }, { label: "장례서비스" }, { label: "예식장" },
        { label: "이벤트" }, { label: "결혼정보회사" }, { label: "연회장" },
      ]},
    ],
  },
  {
    label: "금융/은행업",
    children: [
      { label: "은행/금융", children: [
        { label: "금융" }, { label: "은행" }, { label: "투자자문" }, { label: "투자상담" },
        { label: "텔러" }, { label: "국제금융" }, { label: "자산관리사" }, { label: "부동산투자" },
        { label: "부동산운용" }, { label: "창업투자" }, { label: "지점장" }, { label: "공인회계사" },
        { label: "MBA" },
      ]},
      { label: "캐피탈/대출", children: [
        { label: "캐피탈" }, { label: "여신" }, { label: "종합금융" }, { label: "채권" },
        { label: "저축은행" }, { label: "채권추심" }, { label: "텔러" }, { label: "신용협동조합" },
      ]},
      { label: "증권/보험/카드", children: [
        { label: "손해보험" }, { label: "보험영업" }, { label: "생명보험" }, { label: "화재보험" },
        { label: "자동차보험" }, { label: "손해사정" }, { label: "재정설계" }, { label: "신용카드사" },
        { label: "증권사" }, { label: "펀드매니저" }, { label: "애널리스트" },
      ]},
    ],
  },
  {
    label: "IT/정보통신업",
    children: [
      { label: "솔루션/SI/CRM/ERP", children: [
        { label: "소프트웨어개발" }, { label: "솔루션" }, { label: "SI" }, { label: "SM" },
        { label: "모바일앱개발" }, { label: "BigData" }, { label: "ERP" }, { label: "CRM" },
        { label: "DataMining" }, { label: "asp" }, { label: "DW" }, { label: "SCM" },
        { label: "BI" }, { label: "WAS" }, { label: "NI" }, { label: "DataWarehouse" },
        { label: "ISP" }, { label: "OLAP" }, { label: "DRM" }, { label: "KMS" },
        { label: "BPR" }, { label: "SEM" }, { label: "BSC" },
      ]},
      { label: "웹에이전시", children: [
        { label: "웹에이전시" }, { label: "웹프로덕션" },
      ]},
      { label: "쇼핑몰/오픈마켓/소셜커머스", children: [
        { label: "쇼핑몰" }, { label: "전자상거래" }, { label: "오픈마켓" }, { label: "소셜커머스" },
        { label: "상품기획" }, { label: "B2C" }, { label: "B2B" }, { label: "EC" },
        { label: "온라인경매" },
      ]},
      { label: "포털/컨텐츠/커뮤니티", children: [
        { label: "컨텐츠" }, { label: "커뮤니티" }, { label: "포털" }, { label: "소셜네트워크서비스(SNS)" },
        { label: "인터넷교육" }, { label: "취업포털" }, { label: "인터넷만화" }, { label: "인터넷금융" },
        { label: "인터넷생활정보" }, { label: "인터넷방송" }, { label: "인터넷게임" }, { label: "인터넷영화" },
        { label: "인터넷부동산" }, { label: "인터넷경매" }, { label: "인터넷여행" }, { label: "인터넷법률" },
        { label: "여성포털" },
      ]},
      { label: "네트워크/통신서비스", children: [
        { label: "통신" }, { label: "네트웍구축" }, { label: "텔레콤" }, { label: "인터넷전화" },
        { label: "홈네트워크" }, { label: "IDC" }, { label: "POS" }, { label: "별정통신" },
        { label: "IPT" }, { label: "VoIP" }, { label: "웹호스팅" }, { label: "CDN" },
        { label: "유비쿼터스" }, { label: "IMT2000" },
      ]},
      { label: "정보보안", children: [
        { label: "정보보안" }, { label: "보안소프트웨어" }, { label: "네트워크보안" }, { label: "보안컨설팅" },
        { label: "방화벽" }, { label: "VPN" }, { label: "해킹" }, { label: "백신프로그램" },
        { label: "보안ASP" }, { label: "IDS" }, { label: "SSL" }, { label: "ESM" },
        { label: "Virus" }, { label: "스팸" }, { label: "웜" },
      ]},
      { label: "컴퓨터/하드웨어/장비", children: [
        { label: "하드웨어" }, { label: "유지보수" }, { label: "컴퓨터" }, { label: "AS" },
        { label: "스토리지" }, { label: "펌웨어" }, { label: "CODEC" },
      ]},
      { label: "게임/애니메이션", children: [
        { label: "게임개발" }, { label: "게임디자인" }, { label: "캐릭터" }, { label: "3D디자인" },
        { label: "2D디자인" }, { label: "게임소프트웨어" }, { label: "RPG" }, { label: "3D온라인게임" },
        { label: "콘솔게임" }, { label: "2D온라인게임" }, { label: "웹게임" }, { label: "캐주얼게임" },
        { label: "아케이드게임" }, { label: "보드게임" }, { label: "Java게임" }, { label: "Flash게임" },
        { label: "무선게임" }, { label: "애니메이션" }, { label: "플래쉬애니메이션" }, { label: "3D모델링" },
        { label: "3D매핑" }, { label: "모바일앱게임" }, { label: "게임운영관리" }, { label: "GM·CS" },
        { label: "게임기획" }, { label: "게임마케팅" }, { label: "베타테스터" }, { label: "게임음악효과음" },
        { label: "퍼블리싱" }, { label: "모션그래픽" }, { label: "게임시나리오" }, { label: "아바타" },
        { label: "무선캐릭터" }, { label: "플래시캐릭터" }, { label: "도트디자인" }, { label: "프로게이머" },
      ]},
      { label: "모바일/APP", children: [
        { label: "모바일App" }, { label: "모바일" }, { label: "안드로이드" }, { label: "아이폰" },
        { label: "스마트폰" }, { label: "무선통신" }, { label: "모바일게임" }, { label: "PDA" },
        { label: "Phone" }, { label: "증강현실" }, { label: "NFC" }, { label: "WindowsMobile" },
        { label: "RFID" }, { label: "텔레매틱스" }, { label: "CDMA" }, { label: "mHTML" },
        { label: "WIPI" }, { label: "cHTML" }, { label: "도트디자인" }, { label: "BREW" },
        { label: "GSM" }, { label: "GVM" }, { label: "HDML" }, { label: "SKVM" }, { label: "WAP" },
      ]},
      { label: "IT컨설팅", children: [
        { label: "IT컨설팅" }, { label: "ERP" }, { label: "SAP" }, { label: "Oracle" },
        { label: "DW" }, { label: "인큐베이팅" }, { label: "SCM" }, { label: "CRM" },
        { label: "BPM" }, { label: "KMS" }, { label: "IFRS" }, { label: "Sybase" },
      ]},
    ],
  },
  {
    label: "판매/유통업",
    children: [
      { label: "백화점/유통/도소매", children: [
        { label: "판매" }, { label: "유통" }, { label: "백화점" }, { label: "유통관리" },
        { label: "잡화매장" }, { label: "의류매장" }, { label: "매니저" }, { label: "면세점" },
        { label: "물류" }, { label: "마트" }, { label: "MD" }, { label: "숍마스터" },
        { label: "할인점" }, { label: "홈쇼핑" }, { label: "화장품매장" }, { label: "전자제품대리점" },
        { label: "통신기기대리점" }, { label: "점포개발" }, { label: "편의점" }, { label: "문구음반유통" },
        { label: "쇼호스트" }, { label: "서점" },
      ]},
      { label: "무역/상사", children: [
        { label: "무역업" }, { label: "상사" },
      ]},
      { label: "물류/운송/배송", children: [
        { label: "물류" }, { label: "배송" }, { label: "운송" }, { label: "물류센터" },
        { label: "택배" }, { label: "물류관리" }, { label: "육상운송" }, { label: "입출고관리" },
        { label: "포워딩" }, { label: "항공운송" }, { label: "해상운송" }, { label: "보세운송" },
        { label: "보관" }, { label: "출하" }, { label: "퀵서비스" }, { label: "하역" },
        { label: "시내버스" }, { label: "관광버스" }, { label: "택시" }, { label: "고속버스" },
        { label: "입하" }, { label: "주문" }, { label: "포장이사" }, { label: "시설관리" },
        { label: "철도" }, { label: "지하철" },
      ]},
    ],
  },
  {
    label: "제조/생산/화학업",
    children: [
      { label: "전기/전자/제어", children: [
        { label: "전자" }, { label: "전기" }, { label: "자동제어" }, { label: "전자회로" },
        { label: "PCB" }, { label: "전기제어" }, { label: "제어" }, { label: "전기설비" },
        { label: "Hardware" }, { label: "전기설계" }, { label: "전기회로" }, { label: "기구설계" },
        { label: "전장" }, { label: "전기공사" }, { label: "전기기술" }, { label: "PLC" },
        { label: "FPCB" }, { label: "SMT" }, { label: "Firmware" }, { label: "전기기사" },
        { label: "RF" }, { label: "HMI" }, { label: "SMPS" }, { label: "Micom" },
        { label: "전자계산" }, { label: "SEM" }, { label: "DVD" }, { label: "MMI" }, { label: "TEM" },
      ]},
      { label: "반도체/디스플레이/광학", children: [
        { label: "반도체" }, { label: "반도체장비" }, { label: "디스플레이" }, { label: "반도체생산" },
        { label: "회로설계" }, { label: "LED" }, { label: "정밀광학" }, { label: "LCD" },
        { label: "ASIC" }, { label: "IC설계" }, { label: "SoC" }, { label: "발광다이오드" },
        { label: "Microprocessor" }, { label: "TFT" }, { label: "VLSI" }, { label: "PDP" },
      ]},
      { label: "기계/기계설비", children: [
        { label: "기계" }, { label: "기계설비" }, { label: "자동화설비" }, { label: "기계설계" },
        { label: "기계조립" }, { label: "메카트로닉스" }, { label: "CAD" }, { label: "MCT" },
        { label: "공작기계" }, { label: "밸브" }, { label: "건설기계" }, { label: "CNC" },
        { label: "열교환기" }, { label: "금형" }, { label: "공압기기" }, { label: "압력용기" },
        { label: "포장기계" }, { label: "사출성형기" }, { label: "CAM" }, { label: "유압기기" },
        { label: "인쇄기계" }, { label: "프레스" }, { label: "감속기" }, { label: "발전기" },
        { label: "선반" }, { label: "밀링" }, { label: "압출성형기" }, { label: "절삭공구" },
        { label: "전동공구" }, { label: "NC" }, { label: "노즐" }, { label: "분쇄기" },
        { label: "목공기계" }, { label: "기계감리" }, { label: "MEMS" },
      ]},
      { label: "자동차/조선/철강/항공", children: [
        { label: "자동차부품" }, { label: "자동차" }, { label: "자동차정비" }, { label: "메카트로닉스" },
        { label: "항공" }, { label: "선박" }, { label: "철강" }, { label: "조선" },
        { label: "항공기계" }, { label: "제강" }, { label: "항공운항" }, { label: "철도차량" },
        { label: "제련" }, { label: "제철소" }, { label: "항공정비" }, { label: "압연" },
        { label: "MEMS" }, { label: "제선" }, { label: "항공경영" },
      ]},
      { label: "금속/재료/자재", children: [
        { label: "금속가공" }, { label: "금속" }, { label: "금속재료" }, { label: "건축자재" },
        { label: "건설자재" }, { label: "금형" }, { label: "자재" }, { label: "판금" },
        { label: "절삭공구" }, { label: "도장" }, { label: "레미콘" }, { label: "제관" },
        { label: "주조" }, { label: "세라믹스" }, { label: "용접기" }, { label: "도금" },
        { label: "유리" }, { label: "시멘트" }, { label: "와이어" }, { label: "단조" },
        { label: "연마재" }, { label: "요업" },
      ]},
      { label: "화학/에너지/환경", children: [
        { label: "화학" }, { label: "화공" }, { label: "에너지" }, { label: "환경" },
        { label: "플라스틱제조" }, { label: "석유화학" }, { label: "폐기물처리" }, { label: "수질환경" },
        { label: "유기합성" }, { label: "대기환경" }, { label: "도료" }, { label: "잉크" },
        { label: "정유" }, { label: "소음진동" }, { label: "주유" },
      ]},
      { label: "섬유/의류/패션", children: [
        { label: "패션" }, { label: "의류" }, { label: "여성의류" }, { label: "남성의류" },
        { label: "섬유" }, { label: "직물·우븐·데님" }, { label: "원단" }, { label: "MD" },
        { label: "유아의류" }, { label: "이너웨어" }, { label: "재단·수선·미싱" }, { label: "디스플레이" },
        { label: "섬유공학" }, { label: "코디네이터" }, { label: "패턴사" },
      ]},
      { label: "생활화학/화장품", children: [
        { label: "화장품" }, { label: "피부관리" }, { label: "메이크업" },
      ]},
      { label: "생활용품/소비재/기타", children: [
        { label: "생활용품" }, { label: "소비재" }, { label: "문구" }, { label: "제과제빵" },
        { label: "음료" },
      ]},
      { label: "목재/제지/가구", children: [
        { label: "가구" }, { label: "목재" }, { label: "제지" }, { label: "사무용가구" },
        { label: "부엌가구" },
      ]},
      { label: "식품가공", children: [
        { label: "식품가공" }, { label: "건강식품" },
      ]},
      { label: "농축산/어업/임업", children: [
        { label: "축산" }, { label: "농업" }, { label: "어업" }, { label: "임업" },
        { label: "광업" }, { label: "원양어업" },
      ]},
    ],
  },
  {
    label: "교육업",
    children: [
      { label: "학교(초/중/고/대학/특수)", children: [
        { label: "초중고등학교" }, { label: "대학교" }, { label: "직업전문학교" }, { label: "교직원" },
        { label: "대학(교)교직원" }, { label: "특수학교" }, { label: "외국인학교" },
      ]},
      { label: "유아/유치원/어린이집", children: [
        { label: "어린이집" }, { label: "유치원교사" }, { label: "유아원" }, { label: "유아원교사" },
      ]},
      { label: "학원/어학원/교육원", children: [
        { label: "학원강사" }, { label: "영어학원" }, { label: "어학원" }, { label: "입시학원" },
        { label: "보습학원" }, { label: "예체능학원" }, { label: "e러닝" }, { label: "IT학원" },
        { label: "교사" }, { label: "기업교육" }, { label: "컨텐츠개발" }, { label: "기능학원" },
        { label: "회원모집상담" }, { label: "유아교육" }, { label: "디자인학원" }, { label: "미술" },
        { label: "교수설계" }, { label: "교재제작" }, { label: "유학" }, { label: "실기교사" },
        { label: "유학원" }, { label: "유치원" }, { label: "음악" }, { label: "사회교육" },
        { label: "일본어학원" }, { label: "중국어학원" }, { label: "고시학원" },
      ]},
      { label: "학습지/방문교육", children: [
        { label: "방문교사" }, { label: "학습지" }, { label: "교사" }, { label: "유아교육" },
        { label: "회원모집상담" }, { label: "교재제작" }, { label: "미술" },
      ]},
    ],
  },
  {
    label: "건설업",
    children: [
      { label: "건축/설비/환경", children: [
        { label: "건축" }, { label: "소방" }, { label: "전기" }, { label: "건축설계" },
        { label: "건축시공" }, { label: "건축설비" }, { label: "설비" }, { label: "기계" },
        { label: "공조냉동" }, { label: "플랜트" }, { label: "전기설비" }, { label: "통신" },
        { label: "공무" }, { label: "환경" }, { label: "시설" }, { label: "건축기사" },
        { label: "산업안전" }, { label: "감리" }, { label: "설치기사" }, { label: "견적" },
        { label: "난방설비" }, { label: "전기배선" }, { label: "상하수도" }, { label: "가스설비" },
        { label: "폐수처리" }, { label: "비파괴검사" }, { label: "환경기사" }, { label: "기술사" },
        { label: "입찰" }, { label: "가설설계" }, { label: "물탱크·수자원" }, { label: "교량" },
        { label: "도로설계" }, { label: "교량설계" }, { label: "원예" },
      ]},
      { label: "건설/시공/토목/조경", children: [
        { label: "건설" }, { label: "토목" }, { label: "공무" }, { label: "시공관리" },
        { label: "건설안전" }, { label: "토목기사" }, { label: "토목설계" }, { label: "견적" },
        { label: "조경" }, { label: "산업안전" }, { label: "측량" }, { label: "건설품질관리" },
        { label: "플랜트" }, { label: "현장소장" }, { label: "상하수도" }, { label: "구조설계" },
        { label: "교량" }, { label: "입찰" }, { label: "기술사" }, { label: "토목계측" },
        { label: "가설설계" }, { label: "토질" }, { label: "토목감리" }, { label: "교량설계" },
        { label: "지적측량" }, { label: "도로설계" }, { label: "해외건설" }, { label: "토경" },
      ]},
      { label: "인테리어/자재", children: [
        { label: "인테리어" }, { label: "실내건축" }, { label: "리모델링" }, { label: "CAD" },
        { label: "자재" }, { label: "샤시·베란다" }, { label: "도배·도색·벽지" }, { label: "조명" },
        { label: "미장" },
      ]},
      { label: "부동산/중개/임대", children: [
        { label: "부동산중개" }, { label: "공인중개사" }, { label: "부동산컨설팅" }, { label: "부동산개발" },
        { label: "부동산관리" }, { label: "부동산서비스" }, { label: "분양" }, { label: "상가" },
        { label: "빌딩" }, { label: "사무실" }, { label: "아파트" }, { label: "오피스텔" },
        { label: "부동산투자" }, { label: "임대컨설팅" }, { label: "모델하우스" }, { label: "상담" },
        { label: "부동산운용" }, { label: "도시개발" }, { label: "매입매각" }, { label: "부동산금융" },
        { label: "토지개발" }, { label: "토지" }, { label: "경공매" }, { label: "양도양수" },
        { label: "감정평가" }, { label: "권리분석·보증" }, { label: "해외부동산" },
      ]},
    ],
  },
  {
    label: "의료/제약업",
    children: [
      { label: "의료(병원분류별)", children: [
        { label: "병원" }, { label: "종합병원" }, { label: "한방병의원" }, { label: "동물병원" },
        { label: "전문병원" }, { label: "검진센터" }, { label: "치과병의원" }, { label: "대학병원" },
        { label: "요양병원" }, { label: "상급종합병원" }, { label: "조산원·산후조리원" }, { label: "국공립병원" },
        { label: "특수병원" }, { label: "보건소" },
      ]},
      { label: "의료(진료과별)", children: [
        { label: "피부과" }, { label: "성형외과" }, { label: "치과" }, { label: "안과" },
        { label: "한의과" }, { label: "가정의학과" }, { label: "내과" }, { label: "정형외과" },
        { label: "산부인과" }, { label: "일반과" }, { label: "이비인후과" }, { label: "일반외과" },
        { label: "정신건강의학과" }, { label: "소아청소년과" }, { label: "신경외과" }, { label: "마취통증의학과" },
        { label: "비뇨기과" }, { label: "재활의학과" }, { label: "영상의학과" }, { label: "흉부외과" },
        { label: "국제진료과" }, { label: "대장항문외과" }, { label: "신경과" }, { label: "임상병리과" },
        { label: "진단검사의학과" }, { label: "응급의학과" }, { label: "임상약리과" }, { label: "치료방사선과" },
        { label: "결핵과" }, { label: "방사선종양학과" }, { label: "중환자의학과" }, { label: "직업환경의학과" },
        { label: "해부병리과" }, { label: "핵의학과" },
      ]},
      { label: "의료(간호/원무/상담)", children: [
        { label: "코디네이터" }, { label: "간호조무" }, { label: "간호" }, { label: "상담실장" },
        { label: "원무" }, { label: "의약사무" }, { label: "의무기록사" },
      ]},
      { label: "제약/보건/바이오", children: [
        { label: "의료기기" }, { label: "바이오" }, { label: "제약" }, { label: "의약" },
        { label: "생명공학" }, { label: "건강" }, { label: "화장품" }, { label: "보건" },
        { label: "약국" }, { label: "영양" }, { label: "위생" },
      ]},
      { label: "사회복지/요양", children: [
        { label: "사회복지" }, { label: "요양보호사" },
      ]},
    ],
  },
  {
    label: "미디어/광고업",
    children: [
      { label: "방송/케이블/프로덕션", children: [
        { label: "프로덕션" }, { label: "케이블방송" }, { label: "공중파방송" }, { label: "인터넷방송" },
        { label: "종합유선방송" }, { label: "위성방송" }, { label: "라디오방송" }, { label: "홈쇼핑" },
        { label: "방송협회" }, { label: "DMB방송" }, { label: "이벤트기획사" },
      ]},
      { label: "신문/잡지/언론사", children: [
        { label: "언론사" }, { label: "신문사" }, { label: "잡지사" },
      ]},
      { label: "광고/홍보/전시", children: [
        { label: "광고대행" }, { label: "광고기획" }, { label: "온라인광고" }, { label: "광고제작" },
        { label: "광고디자인" }, { label: "홍보대행" }, { label: "프로모션대행" }, { label: "BTL" },
        { label: "이벤트대행" }, { label: "이벤트" }, { label: "컨벤션" }, { label: "국제회의" },
        { label: "ATL" }, { label: "SIGN" }, { label: "CF" },
      ]},
      { label: "영화/음반/배급", children: [
        { label: "제작사" }, { label: "스튜디오" }, { label: "배급유통사" }, { label: "편집실" },
        { label: "영화관" }, { label: "영화기획사" }, { label: "음반제작" }, { label: "음반판매" },
        { label: "음반기획" }, { label: "투자사" }, { label: "녹음실" }, { label: "음반배급" },
        { label: "영화교육기관" }, { label: "음반사" }, { label: "음반협회" },
      ]},
      { label: "연예/엔터테인먼트", children: [
        { label: "엔터테인먼트사" }, { label: "매니지먼트" }, { label: "연예기획" }, { label: "연예" },
        { label: "스튜디오" },
      ]},
      { label: "출판/인쇄/사진", children: [
        { label: "인쇄" }, { label: "출판" }, { label: "편집디자인" }, { label: "편집" },
        { label: "출판기획" }, { label: "교재제작" }, { label: "출력" }, { label: "전자출판" },
        { label: "실사출력" }, { label: "제본" }, { label: "포장인쇄" }, { label: "교정" },
        { label: "교열" }, { label: "그라비아인쇄" }, { label: "복사" }, { label: "집필" },
        { label: "서점" },
      ]},
    ],
  },
  {
    label: "문화/예술/디자인업",
    children: [
      { label: "문화/공연/예술", children: [
        { label: "문화기획" }, { label: "공연기획" }, { label: "공연예술" }, { label: "공연콘서트홀" },
        { label: "큐레이터" }, { label: "아카데미" }, { label: "문화예술회관" }, { label: "소극장" },
        { label: "극단" }, { label: "오페라단" },
      ]},
      { label: "디자인/CAD", children: [
        { label: "디자인" }, { label: "시각디자인" }, { label: "전시디자인" }, { label: "전시기획" },
        { label: "멀티미디어디자인" }, { label: "환경디자인" }, { label: "CAD" }, { label: "패션디자인" },
        { label: "의상디자인" }, { label: "공업디자인" }, { label: "공예디자인" }, { label: "섬유디자인" },
        { label: "악세서리디자인" },
      ]},
    ],
  },
  {
    label: "기관/협회",
    children: [
      { label: "공기업/공공기관", children: [
        { label: "공공기관" }, { label: "공기업" }, { label: "교직원" }, { label: "공사" },
        { label: "대사관" }, { label: "지방자치단체" }, { label: "공단" }, { label: "중앙정부기관" },
        { label: "공무원" }, { label: "국립대학교" }, { label: "영사관" }, { label: "정당" },
        { label: "대학강사" }, { label: "대학교수" }, { label: "외국관광청" },
      ]},
      { label: "협회/단체", children: [
        { label: "사단법인" }, { label: "재단법인" }, { label: "협회" }, { label: "NGO" },
        { label: "조합" }, { label: "국제기구" }, { label: "시민단체" }, { label: "종교단체" },
        { label: "연합회" }, { label: "연맹" },
      ]},
      { label: "컨설팅/연구/조사", children: [
        { label: "컨설팅" }, { label: "조사분석" }, { label: "경영연구소" }, { label: "연구소" },
        { label: "연구원" }, { label: "경제연구소" },
      ]},
      { label: "회계/세무/법무", children: [
        { label: "세무회계사무소" }, { label: "세무법인" }, { label: "회계법인" }, { label: "법무법인" },
        { label: "법률사무소" }, { label: "세무컨설팅" }, { label: "노무법인" }, { label: "로펌" },
        { label: "변호사사무실" }, { label: "특허사무소" }, { label: "법률상담" }, { label: "법무사무소" },
      ]},
    ],
  },
];
