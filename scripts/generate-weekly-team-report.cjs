const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'docs', '보고서');
const htmlPath = path.join(reportDir, 'Kanto_주차별_팀활동_보고서.html');
const pdfPath = path.join(reportDir, 'Kanto_주차별_팀활동_보고서.pdf');

const people = [
  { id:'dohyuk', name:'김도혁', color:'#3158a5', aliases:['DoHyuk-Centric','DoHyck-Centric','김도혁'], role:'서비스 구조 · 데이터/백엔드 연동', areas:'채팅, 프로필, 임대 상세, 약관, 성능·DB 안정화' },
  { id:'soyu', name:'박소유', color:'#e66f3f', aliases:['soyu'], role:'UI 시스템 · 운영/품질 관리', areas:'중고거래 UI, 공통 UX, 관리자 운영, 테스트·CI' },
  { id:'dongkeun', name:'이동근', color:'#26936f', aliases:['dongkeun'], role:'회원·거래 흐름 · 서비스 구현', areas:'회원가입, 중고 상세, 결제, 관리자 사용자, 이미지 최적화' },
  { id:'taehyung', name:'임태형', color:'#8056b3', aliases:['THLIMM'], role:'인증 · 작성 경험 · 실시간 기능', areas:'로그인, 글쓰기, Kanto Go, 반응형·인터랙션' },
];

const weeks = [
  {n:1, from:'2026-05-29', to:'2026-06-04', focus:'프로젝트 기반과 인증 화면의 시작', tasks:[
    ['공통 개발 기반 정립',true,{dohyuk:'Footer·스크롤 공통 컴포넌트와 프로필 구조 초안',soyu:'저장소 초기 설정, PR 템플릿·헤더 UI',dongkeun:'README 정비와 회원가입–Supabase 연결',taehyung:'로그인 화면 구현과 컴포넌트 분리'}],
    ['회원가입·로그인 기초',true,{dongkeun:'회원가입 폼, 약관 동의·정규식 검증 구현',taehyung:'로그인 UI 및 서버/클라이언트 경계 정리'}],
  ]},
  {n:2, from:'2026-06-05', to:'2026-06-11', focus:'핵심 마켓·채팅 기능을 병렬 구축', tasks:[
    ['중고거래 핵심 흐름',true,{dohyuk:'타입·서버 쿼리와 데이터 접근 기반',soyu:'목록 카드·이미지 fallback·검색 UI',dongkeun:'상세 화면과 페이지네이션',taehyung:'글쓰기·이미지 업로드 폼'}],
    ['실시간 채팅 기반',false,{dohyuk:'채팅 타입/스토어 초안, 목록·방 UI, 메시지·읽음·도배 방지'}],
    ['인증 흐름 확장',true,{dongkeun:'회원가입 구조 개선',taehyung:'소셜 로그인 연동·오류 UX 개선'}],
  ]},
  {n:3, from:'2026-06-12', to:'2026-06-18', focus:'거래 경험 완성 및 관리자 기능 착수', tasks:[
    ['프로필·공통 UX 통합',true,{dohyuk:'프로필 기능 확장과 알림 구조 리팩터링',soyu:'프로필 알림 설정과 공통 UI 정리',taehyung:'헤더·푸터·이미지 업로드 안정화'}],
    ['관리자·결제 기능',true,{dohyuk:'신고 관리 구조 및 데이터 흐름',soyu:'관리자 사용자/사이드바 UX',dongkeun:'관리자 사용자 페이지 구현',taehyung:'관리자 대시보드·플로팅 채팅 연결'}],
    ['거래 상태·채팅 연계',true,{dohyuk:'알림·채팅 기반 보강',soyu:'Xendit 결제 흐름 연결',dongkeun:'판매 완료/거래 처리',taehyung:'임대 작성 및 공통 작성 경험'}],
  ]},
  {n:4, from:'2026-06-19', to:'2026-06-25', focus:'Kanto Go와 운영 안전성 확장', tasks:[
    ['Kanto Go 번개모임',true,{dohyuk:'데이터·권한 및 서버 구조 지원',soyu:'메인/운영 화면 연결과 UX 보완',dongkeun:'서비스 연동·관리 흐름 보조',taehyung:'지도·모임 생성·실시간 그룹채팅 주도'}],
    ['운영·신뢰 시스템',true,{dohyuk:'신고/제재·알림 데이터 정합성',soyu:'관리 화면·콘텐츠 운영 UX',dongkeun:'결제 관리·만료 처리',taehyung:'그룹채팅과 반응형 인터랙션'}],
    ['품질·성능 개선',true,{dohyuk:'성능 감사와 서버 쿼리 개선',soyu:'공통 컴포넌트·접근성 개선',dongkeun:'이미지·데이터 흐름 점검',taehyung:'채팅 스크롤·읽음 타이밍 개선'}],
  ]},
  {n:5, from:'2026-06-26', to:'2026-07-02', focus:'운영 도구 고도화와 성능 집중 개선', tasks:[
    ['관리자 운영 모듈화',true,{dohyuk:'권한·모니터링 데이터/문서 정비',soyu:'콘텐츠·운영 화면 분리와 UX',dongkeun:'관리 기능 서비스 계층 보완',taehyung:'화면 반응형·상호작용 보완'}],
    ['전 구간 성능 감사',true,{dohyuk:'감사 프레임워크, SSR·쿼리·캐시 개선 주도',soyu:'페이지 UI 회귀 점검',dongkeun:'이미지 로딩과 데이터 호출 개선',taehyung:'Go 지도 지연 로딩·애니메이션 개선'}],
    ['메인·목록 경험 개선',true,{soyu:'공통 검색/목록 UI 정리',dongkeun:'목록 데이터와 이미지 경험',taehyung:'메인 Kanto Go 위젯·레이아웃 조정'}],
  ]},
  {n:6, from:'2026-07-03', to:'2026-07-07', focus:'출시 전 안정화·검증·마감', tasks:[
    ['인증·운영 안정화',true,{dohyuk:'DB 정리, 약관 선로딩, 가입 완료 흐름',soyu:'공지·금칙어·관리 UI 마감',dongkeun:'이미지 렌더링 지연 해결',taehyung:'공유 URL 참여·모바일 헤더 오류 수정'}],
    ['검증 자동화와 회귀 점검',true,{dohyuk:'성능 재측정·스키마 문서화',soyu:'E2E·단위 테스트, ESLint/CI 게이트',dongkeun:'E2E 수정·배포 전 점검',taehyung:'전역 커서·상호작용 일관성'}],
    ['문서·발표 마감',true,{dohyuk:'보고서·배포 문서',soyu:'협업·기여 문서',dongkeun:'작업 문서 정리',taehyung:'기여 섹션 및 작업 기록'}],
  ]},
];

const leads = [
  ['김도혁','채팅 시스템','PR #64 계열','타입·스토어 초안에서 실시간 메시지/읽음 처리까지 설계·확장'],
  ['김도혁','프로필·공통 사용자 구조','PR #35, #170','Profile 타입·카드 초안 후 설정/알림 구조까지 발전'],
  ['박소유','중고거래 목록 UI 시스템','PR #52 계열','카드와 목록 UI 기반을 시작하고 검색·공통 UX를 확장'],
  ['박소유','품질 게이트·운영 UX','PR #600 계열','운영 화면 개선과 E2E/단위 테스트·CI 마감'],
  ['이동근','회원가입','PR #15, #30','Supabase 연결부터 동의·검증 및 리팩터링까지 주도'],
  ['이동근','중고거래 상세·거래 흐름','PR #72 계열','상세 기능을 시작해 판매/결제 흐름으로 확장'],
  ['임태형','로그인·소셜 인증','PR #26, #56','로그인 UI 최초 구현 후 소셜 인증·오류 UX 확장'],
  ['임태형','Kanto Go','기획/구현 PR 계열','지도·모임 생성·실시간 그룹채팅의 핵심 구현 주도'],
];

function canonical(author){ return people.find(p=>p.aliases.includes(author)); }
const log = cp.execFileSync('git',['log','--no-merges','--date=short','--pretty=format:%ad%x09%an%x09%s'],{cwd:root,encoding:'utf8'});
const commits = log.split(/\r?\n/).map(x=>x.split('\t')).filter(x=>x.length>=3).map(([date,author,...s])=>({date,author,subject:s.join('\t')}));
const activityAreas = [
  {id:'auth',name:'인증·회원',keys:/로그인|회원가입|signup|login|auth|약관|terms|profile|프로필/i},
  {id:'market',name:'중고·거래',keys:/중고|used|거래|결제|payment|xendit|판매|transaction/i},
  {id:'listing',name:'임대·구인',keys:/임대|rental|구인|구직|job|지도|map/i},
  {id:'realtime',name:'채팅·Kanto Go',keys:/채팅|chat|알림|notification|모임|meetup|kanto.?go|group/i},
  {id:'admin',name:'관리자·운영',keys:/관리자|admin|신고|report|제재|sanction|금칙|공지|monitor|권한|permission/i},
  {id:'quality',name:'품질·성능',keys:/fix|bug|refactor|성능|performance|test|e2e|접근성|반응형|이미지|보안|security|lint|ci|최적화/i},
  {id:'common',name:'공통·문서',keys:/공통|header|footer|메인|main|readme|docs|문서|컴포넌트|component|설계/i},
];
function areasOf(subject){ const found=activityAreas.filter(a=>a.keys.test(subject)); return found.length?found:[activityAreas.at(-1)]; }
function cleanSubject(s){ return s.replace(/^(feat|fix|refactor|chore|docs|design|test|bug)(\([^)]*\))?\s*:\s*/i,'').replace(/^Merge .*$/i,'').trim(); }
function subjectScore(s){ return /^(feat|design)/i.test(s)?5:/^(fix|bug)/i.test(s)?4:/^refactor/i.test(s)?3:/^test/i.test(s)?2:/^docs/i.test(s)?1:2; }
for(const w of weeks){
  w.counts={}; w.byPerson={};
  for(const p of people){ w.counts[p.id]=0; w.byPerson[p.id]={areas:Object.fromEntries(activityAreas.map(a=>[a.id,0])),highlights:[]}; }
  for(const c of commits){ const p=canonical(c.author); if(!p || c.date<w.from || c.date>w.to) continue; w.counts[p.id]++; const d=w.byPerson[p.id]; for(const a of areasOf(c.subject)) d.areas[a.id]++; d.highlights.push(c.subject); }
  for(const p of people){ const d=w.byPerson[p.id]; d.highlights=[...new Set(d.highlights)].sort((a,b)=>subjectScore(b)-subjectScore(a)).map(cleanSubject).filter(Boolean).slice(0,4); }
  w.total=Object.values(w.counts).reduce((a,b)=>a+b,0);
  w.areaTotals=Object.fromEntries(activityAreas.map(a=>[a.id,people.reduce((sum,p)=>sum+w.byPerson[p.id].areas[a.id],0)]));
  w.focusAreas=activityAreas.filter(a=>w.areaTotals[a.id]>0).sort((a,b)=>w.areaTotals[b.id]-w.areaTotals[a.id]).slice(0,3);
}
const overall=Object.fromEntries(people.map(p=>[p.id,Object.fromEntries(activityAreas.map(a=>[a.id,0]))]));
for(const c of commits){ const p=canonical(c.author); if(!p || c.date<weeks[0].from || c.date>weeks.at(-1).to) continue; for(const a of areasOf(c.subject)) overall[p.id][a.id]++; }

const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const personById=id=>people.find(p=>p.id===id);
function taskHtml(t){ const [title,collab,parts]=t; return `<article class="task"><div class="task-head"><h3>${esc(title)}</h3>${collab?'<span class="badge">협업</span>':''}</div><div class="parts">${Object.entries(parts).map(([id,txt])=>{const p=personById(id);return `<div class="part"><i style="background:${p.color}"></i><b>${p.name}</b><span>${esc(txt)}</span></div>`}).join('')}</div></article>`; }
function memberHtml(w,p){ const d=w.byPerson[p.id]; const active=activityAreas.filter(a=>d.areas[a.id]).sort((a,b)=>d.areas[b.id]-d.areas[a.id]); return `<article class="member"><div class="member-head"><div><i style="background:${p.color}"></i><b>${p.name}</b><span>${p.role}</span></div></div><div class="area-chips">${active.map(a=>`<span>${a.name}</span>`).join('')}</div><ul>${d.highlights.map(x=>`<li>${esc(x.length>58?x.slice(0,57)+'…':x)}</li>`).join('')}</ul></article>`; }
function compactTask(t){ const [title,collab,parts]=t; return `<article class="collab"><div><h3>${esc(title)}</h3>${collab?'<span class="badge">협업</span>':''}</div>${Object.entries(parts).map(([id,txt])=>{const p=personById(id);return `<p><i style="background:${p.color}"></i><b>${p.name}</b> ${esc(txt)}</p>`}).join('')}</article>`; }
function weekPage(w){ return `<section class="page week"><header><div><span class="eyebrow">WEEKLY ACTIVITY · ALL MEMBERS</span><h1>${w.n}주차 <small>${w.from.slice(5).replace('-','.')} — ${w.to.slice(5).replace('-','.')}</small></h1><p>${w.focus}</p><div class="week-focus"><b>집중 카테고리</b>${w.focusAreas.map((a,i)=>`<span class="rank-${i+1}">${a.name}</span>`).join('')}</div></div><div class="weekly-total"><b>${w.total}</b><span>팀 전체 주차 커밋</span><em>병합 제외 · 통합 집계</em></div></header><div class="week-body"><div class="members">${people.map(p=>memberHtml(w,p)).join('')}</div><aside><h2>이번 주 협업 흐름</h2>${w.tasks.map(compactTask).join('')}</aside></div><footer>${w.n} / ${weeks.length} · KANTO TEAM ACTIVITY REPORT</footer></section>`; }
function heat(v,max){ const n=max?Math.max(.10,v/max):.1; return `rgba(49,88,165,${(.10+n*.82).toFixed(2)})`; }
function activityMap(){ const max=Math.max(...people.flatMap(p=>activityAreas.map(a=>overall[p.id][a.id]))); return `<section class="page activity-map"><span class="eyebrow">TEAM ACTIVITY MAP</span><h1>팀 전체 활동 위치</h1><p class="sub">전체 기간의 실작업 커밋 제목을 기능 영역으로 분류했습니다. 진한 셀일수록 해당 영역에서 반복 활동이 많았습니다.</p><div class="matrix"><div class="corner">팀원 / 기능 영역</div>${activityAreas.map(a=>`<div class="col-head">${a.name}</div>`).join('')}${people.map(p=>`<div class="row-head"><i style="background:${p.color}"></i><b>${p.name}</b><small>${p.role}</small></div>${activityAreas.map(a=>{const v=overall[p.id][a.id];return `<div class="heat" style="background:${heat(v,max)};color:${v>max*.45?'#fff':'#23304a'}"><b>${v}</b><small>활동 커밋</small></div>`}).join('')}`).join('')}</div><div class="timeline"><b>주차별 팀 활동량</b>${weeks.map(w=>`<div><span>${w.n}주차</span><i style="width:${Math.max(8,w.total/Math.max(...weeks.map(x=>x.total))*100)}%"></i><strong>${w.total}</strong></div>`).join('')}</div><footer>ACTIVITY MAP · KANTO TEAM ACTIVITY REPORT</footer></section>`; }

const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Kanto 주차별 팀활동 보고서</title><style>
@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Malgun Gothic","Noto Sans KR",sans-serif;color:#19243b;background:#e8edf5}.page{width:297mm;height:210mm;padding:16mm 18mm 12mm;background:#fff;page-break-after:always;position:relative;overflow:hidden}.cover{background:#101b34;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:23mm}.cover:after{content:"";position:absolute;width:145mm;height:145mm;border:34mm solid #3158a5;border-radius:50%;right:-52mm;top:-62mm;opacity:.35}.cover .mark{font-weight:800;letter-spacing:.18em;color:#a9c3ff}.cover h1{font-size:35pt;line-height:1.18;margin:0 0 8mm}.cover h1 span{color:#91b2ff}.cover p{font-size:13pt;color:#c9d4ea}.cover .meta{display:flex;justify-content:space-between;border-top:1px solid #53617a;padding-top:6mm;color:#b9c6de}.eyebrow{font-size:8pt;letter-spacing:.16em;color:#3158a5;font-weight:800}.overview h1,.appendix h1{font-size:25pt;margin:3mm 0 3mm}.sub{color:#657087;margin:0 0 8mm}.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.role{border:1px solid #dce3ef;border-radius:4mm;padding:5mm;display:grid;grid-template-columns:13mm 1fr;gap:4mm;box-shadow:0 2mm 5mm #20345b0b}.avatar{width:13mm;height:13mm;border-radius:50%;color:#fff;display:grid;place-items:center;font-weight:800}.role h2{font-size:15pt;margin:0 0 1mm}.role strong{font-size:10pt}.role p{font-size:9.5pt;color:#657087;margin:2mm 0 0}.method{margin-top:6mm;padding:4mm 5mm;background:#f3f6fb;border-radius:3mm;font-size:9pt;color:#58657d}.week header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #dce3ef;padding-bottom:4mm}.week h1{font-size:25pt;margin:2mm 0 1mm}.week h1 small{font-size:11pt;color:#768197;font-weight:500;margin-left:4mm}.week header p{margin:0;color:#657087}.weekly-total{text-align:center;background:#17233d;color:#fff;border-radius:4mm;padding:4mm 7mm;min-width:35mm}.weekly-total b{display:block;font-size:24pt;line-height:1}.weekly-total span{font-size:9pt;font-weight:700}.weekly-total em{display:block;font-size:7pt;color:#aebbd3;font-style:normal;margin-top:1mm}.commit-strip{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #dce3ef;border-radius:3mm;margin:5mm 0;overflow:hidden}.commit-strip div{padding:3mm 5mm;border-right:1px solid #dce3ef}.commit-strip div:last-child{border:0}.commit-strip span{font-size:9pt;font-weight:800}.commit-strip b{font-size:17pt;margin-left:4mm}.commit-strip small{color:#8a94a8;margin-left:1mm}.tasks{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.task{border:1px solid #dce3ef;border-radius:3mm;padding:4mm;min-height:83mm}.task-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #edf0f5;padding-bottom:3mm}.task h3{font-size:12pt;margin:0}.badge{background:#e8efff;color:#3158a5;border:1px solid #bfd0f8;border-radius:10mm;padding:1mm 3mm;font-size:7.5pt;font-weight:800}.parts{margin-top:2mm}.part{display:grid;grid-template-columns:3mm 14mm 1fr;gap:2mm;align-items:start;padding:2.3mm 0;border-bottom:1px dashed #e5e9f0;font-size:8.6pt;line-height:1.45}.part:last-child{border:0}.part i{width:2.2mm;height:2.2mm;border-radius:50%;margin-top:1mm}.part b{white-space:nowrap}.part span{color:#5f6a7f}.page footer{position:absolute;bottom:6mm;left:18mm;right:18mm;text-align:right;font-size:7pt;color:#a0a8b7}.lead-table{width:100%;border-collapse:collapse;margin-top:6mm;font-size:9pt}.lead-table th{text-align:left;background:#17233d;color:#fff;padding:3mm}.lead-table td{border-bottom:1px solid #dce3ef;padding:3mm}.lead-table td:nth-child(1){font-weight:800;width:18mm}.lead-table td:nth-child(2){font-weight:700;width:43mm}.lead-table td:nth-child(3){color:#3158a5;font-weight:700;width:34mm}.note{margin-top:5mm;font-size:8.5pt;color:#69758a;background:#f3f6fb;padding:4mm;border-radius:3mm}
/* dense weekly dashboard */
.week header{padding-bottom:3mm}.week h1{font-size:22pt;margin:1mm 0}.week h1 small{font-size:10pt}.week header p{font-size:9pt}.weekly-total{padding:3mm 6mm;min-width:32mm}.weekly-total b{font-size:21pt}.commit-strip{margin:3mm 0}.commit-strip div{padding:2mm 4mm}.commit-strip b{font-size:14pt}.commit-strip small{font-size:6.5pt}.week-body{display:grid;grid-template-columns:1.7fr 1fr;gap:4mm}.members{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.member{border:1px solid #dce3ef;border-radius:3mm;padding:3mm;min-height:55mm}.member-head{display:flex;justify-content:space-between;border-bottom:1px solid #edf0f5;padding-bottom:2mm}.member-head>div{display:grid;grid-template-columns:3mm auto;column-gap:2mm}.member-head i{width:2.5mm;height:2.5mm;border-radius:50%;margin-top:1mm}.member-head b{font-size:10pt}.member-head span{grid-column:2;color:#778298;font-size:6.5pt}.member-head strong{font-size:14pt}.member-head strong small{font-size:6pt}.area-chips{display:flex;flex-wrap:wrap;gap:1mm;margin:2mm 0}.area-chips span{font-size:6.5pt;background:#f0f3f8;border-radius:8mm;padding:.7mm 1.8mm}.area-chips b{margin-left:1mm;color:#3158a5}.member ul{margin:1mm 0 0;padding-left:4mm}.member li{font-size:7.2pt;color:#47546a;line-height:1.42;margin:.5mm 0}.week aside{border-left:1px solid #dce3ef;padding-left:4mm}.week aside h2{font-size:11pt;margin:0 0 2mm}.collab{padding:2.2mm 0;border-bottom:1px solid #e6eaf1}.collab>div{display:flex;justify-content:space-between}.collab h3{font-size:8.5pt;margin:0}.collab .badge{padding:.6mm 2mm;font-size:6pt}.collab p{display:grid;grid-template-columns:2mm 11mm 1fr;gap:1mm;margin:1.2mm 0;font-size:6.6pt;color:#5e697d;line-height:1.3}.collab p i{width:1.7mm;height:1.7mm;border-radius:50%;margin-top:.6mm}.collab p b{color:#26324a}.activity-map h1{font-size:25pt;margin:3mm 0}.matrix{display:grid;grid-template-columns:45mm repeat(7,1fr);border:1px solid #d9e0ec;border-radius:3mm;overflow:hidden}.matrix>div{min-height:18mm;border-right:1px solid #d9e0ec;border-bottom:1px solid #d9e0ec;display:flex;align-items:center;justify-content:center;text-align:center}.corner,.col-head{background:#17233d;color:#fff;font-size:8pt;font-weight:700}.row-head{justify-content:flex-start!important;text-align:left!important;padding:3mm;display:grid!important;grid-template-columns:3mm 1fr!important;column-gap:2mm}.row-head i{width:2.5mm;height:2.5mm;border-radius:50%}.row-head b{font-size:9pt}.row-head small{grid-column:2;font-size:6.5pt;color:#6f7b91}.heat{flex-direction:column}.heat b{font-size:15pt}.heat small{font-size:6pt}.timeline{display:grid;grid-template-columns:25mm repeat(6,1fr);gap:3mm;align-items:end;margin-top:7mm}.timeline>b{font-size:8pt}.timeline div{height:22mm;position:relative;display:flex;align-items:flex-end}.timeline span{position:absolute;bottom:-4mm;font-size:7pt}.timeline i{display:block;height:5mm;background:#3158a5;border-radius:1mm;margin-bottom:1mm}.timeline strong{font-size:8pt;margin:0 0 1.5mm 1mm}
.week-focus{display:flex;align-items:center;gap:1.5mm;margin-top:2mm}.week-focus b{font-size:7pt;color:#69758a;margin-right:1mm}.week-focus span{font-size:7pt;font-weight:700;padding:1mm 2.5mm;border-radius:10mm;background:#eef2f8;color:#46536a}.week-focus .rank-1{background:#dfe9ff;color:#244f9d}.week-focus .rank-2{background:#eaf5f0;color:#247454}
</style></head><body>
<section class="page cover"><div class="mark">KANTO PROJECT · TEAM REPORT</div><div><span class="eyebrow" style="color:#91b2ff">2026.05.29 — 2026.07.07</span><h1>주차별<br><span>팀 활동 보고서</span></h1><p>역할과 담당 영역, 협업 기여, 주도 기능을 결과 중심으로 정리했습니다.</p></div><div class="meta"><span>김도혁 · 박소유 · 이동근 · 임태형</span><span>2026. 07. 07.</span></div></section>
<section class="page overview"><span class="eyebrow">TEAM AT A GLANCE</span><h1>주요 역할 및 담당 영역</h1><p class="sub">직함이 아니라 실제 저장소에서 반복적으로 확인되는 주된 활동 축을 기준으로 정리했습니다.</p><div class="role-grid">${people.map((p,i)=>`<article class="role"><div class="avatar" style="background:${p.color}">${p.name[0]}</div><div><h2>${p.name}</h2><strong>${p.role}</strong><p>${p.areas}</p></div></article>`).join('')}</div><div class="method"><b>읽는 법</b> · 주차 커밋은 병합 커밋을 제외한 실작업 커밋입니다. ‘협업’ 배지는 같은 기능 흐름에 2인 이상이 기여한 경우이며, 카드 안에는 각자의 실제 담당 내용을 따로 적었습니다. 커밋 수는 활동량의 보조 지표일 뿐 기여도 점수가 아닙니다.</div><footer>ROLE MAP · KANTO TEAM ACTIVITY REPORT</footer></section>
${weeks.map(weekPage).join('')}
<section class="page appendix"><span class="eyebrow">APPENDIX · FEATURE LEADERSHIP</span><h1>인물별 주도 기능 및 핵심 활동</h1><p class="sub">단순 병합자나 마지막 수정자가 아니라, 해당 기능의 최초 설계·구현을 시작한 사람을 주도자로 두고 이후 핵심 확장 활동을 연결했습니다.</p><table class="lead-table"><thead><tr><th>주도자</th><th>최초 설계·주도 기능</th><th>대표 PR 근거</th><th>이후 핵심 활동</th></tr></thead><tbody>${leads.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="note"><b>산정 원칙</b> · Git 최초 도입 커밋과 해당 PR의 기능 범위를 우선 확인하고, 이후 동일 기능 축에서 이어진 구조 개선·버그 수정·운영 안정화를 핵심 활동으로 정리했습니다. PR 번호는 대표 진입점이며 관련 후속 PR 전체를 뜻하지 않습니다.</div><footer>APPENDIX · KANTO TEAM ACTIVITY REPORT</footer></section>
</body></html>`;

fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(htmlPath,html,'utf8');
const edgeCandidates=['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'];
const edge=edgeCandidates.find(fs.existsSync);
if(!edge) throw new Error('Microsoft Edge를 찾을 수 없습니다. HTML은 생성되었습니다.');
const profile=path.join(os.tmpdir(),'kanto-weekly-report-edge-profile');
fs.rmSync(profile,{recursive:true,force:true});
fs.mkdirSync(profile,{recursive:true});
const url='file:///'+htmlPath.replace(/\\/g,'/').split('/').map((v,i)=>i<1?v:encodeURIComponent(v)).join('/');
try {
  cp.execFileSync(edge,['--headless','--disable-gpu',`--user-data-dir=${profile}`,`--print-to-pdf=${pdfPath}`,'--print-to-pdf-no-header',url],{stdio:'inherit',timeout:120000});
} finally {
  fs.rmSync(profile,{recursive:true,force:true});
}
console.log(`HTML: ${htmlPath}\nPDF:  ${pdfPath}`);
