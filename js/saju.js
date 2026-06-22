// ============================================================
//  saju.js  ·  사주 기초 데이터 및 계산 엔진
// ============================================================

// ── 천간 (天干) ──────────────────────────────────────────────
const CHEONGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const CHEONGAN_KO = {
  '甲':'갑(甲)','乙':'을(乙)','丙':'병(丙)','丁':'정(丁)','戊':'무(戊)',
  '己':'기(己)','庚':'경(庚)','辛':'신(辛)','壬':'임(壬)','癸':'계(癸)'
};
const CHEONGAN_OHENG = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土',
  '己':'土','庚':'金','辛':'金','壬':'水','癸':'水'
};
const CHEONGAN_UMYANG = {
  '甲':'양','乙':'음','丙':'양','丁':'음','戊':'양',
  '己':'음','庚':'양','辛':'음','壬':'양','癸':'음'
};

// ── 지지 (地支) ──────────────────────────────────────────────
const JIJI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const JIJI_KO = {
  '子':'자(子)','丑':'축(丑)','寅':'인(寅)','卯':'묘(卯)',
  '辰':'진(辰)','巳':'사(巳)','午':'오(午)','未':'미(未)',
  '申':'신(申)','酉':'유(酉)','戌':'술(戌)','亥':'해(亥)'
};
const JIJI_OHENG = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
  '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
};
const JIJI_JIJANG = {
  '子':['壬','癸'],
  '丑':['己','辛','癸'],
  '寅':['甲','丙','戊'],
  '卯':['甲','乙'],
  '辰':['戊','乙','癸'],
  '巳':['丙','庚','戊'],
  '午':['丙','丁','己'],
  '未':['己','丁','乙'],
  '申':['庚','壬','戊'],
  '酉':['庚','辛'],
  '戌':['戊','辛','丁'],
  '亥':['壬','甲']
};

// ── 오행 관계 ──────────────────────────────────────────────
const OHENG_SAENGKUK = {
  生: { '木':'火','火':'土','土':'金','金':'水','水':'木' },
  剋: { '木':'土','火':'金','土':'水','金':'木','水':'火' }
};

// ── 지지 정기(正氣) 기준 음양표 ──────────────────────────────────
// ⚠ 중요: 십성 판정에 쓰이는 지지의 음양은 "지지 자체의 음양"이 아니라
//   그 지지의 지장간 중 "정기(正氣)" 천간의 음양을 따라야 한다.
//   (지지 자체에는 십성이 없고, 지장간 정기의 십성을 지지의 십성처럼
//    부르는 관행이기 때문 — 위키백과 '사주명리학' 항목 등 다수 출처 확인됨)
//   기존에 "子寅辰午申戌=양, 그 외=음"이라는 지지 자체 음양표를 그대로
//   십성 판정에 썼던 것이 버그였다. 子(정기 癸=음), 巳(정기 丙=양),
//   午(정기 丁=음), 亥(정기 壬=양) 4글자에서 실제 정기 음양과 어긋났다.
const JIJI_JEONGGI_UMYANG = {
  '子':'음', // 정기 癸
  '丑':'음', // 정기 己
  '寅':'양', // 정기 甲
  '卯':'음', // 정기 乙
  '辰':'양', // 정기 戊
  '巳':'양', // 정기 丙
  '午':'음', // 정기 丁
  '未':'음', // 정기 己
  '申':'양', // 정기 庚
  '酉':'음', // 정기 辛
  '戌':'양', // 정기 戊
  '亥':'양'  // 정기 壬
};

// ── 십성 (十星) 계산 ──────────────────────────────────────────
// 일간 기준으로 상대 천간/오행의 십성을 반환
function getSipseong(ilgan, target) {
  const ilOheng = CHEONGAN_OHENG[ilgan];
  const ilUmyang = CHEONGAN_UMYANG[ilgan];

  let targetOheng, targetUmyang;

  if (CHEONGAN_OHENG[target]) {
    targetOheng = CHEONGAN_OHENG[target];
    targetUmyang = CHEONGAN_UMYANG[target];
  } else if (JIJI_OHENG[target]) {
    targetOheng = JIJI_OHENG[target];
    // 지지 정기(正氣) 천간의 음양을 따른다 (지지 자체 음양표 아님 — 위 설명 참조)
    targetUmyang = JIJI_JEONGGI_UMYANG[target];
  } else {
    return '불명';
  }

  const same = ilOheng === targetOheng;
  const sameUmyang = ilUmyang === targetUmyang;

  // 비겁
  if (same) return sameUmyang ? '비견(比肩)' : '겁재(劫財)';

  // 식상: 일간이 생하는 오행
  if (OHENG_SAENGKUK['生'][ilOheng] === targetOheng) {
    return sameUmyang ? '식신(食神)' : '상관(傷官)';
  }

  // 재성: 일간이 극하는 오행
  if (OHENG_SAENGKUK['剋'][ilOheng] === targetOheng) {
    return sameUmyang ? '편재(偏財)' : '정재(正財)';
  }

  // 관성: 일간을 극하는 오행
  if (OHENG_SAENGKUK['剋'][targetOheng] === ilOheng) {
    return sameUmyang ? '편관(偏官/七殺)' : '정관(正官)';
  }

  // 인성: 일간을 생하는 오행
  if (OHENG_SAENGKUK['生'][targetOheng] === ilOheng) {
    return sameUmyang ? '편인(偏印)' : '정인(正印)';
  }

  return '불명';
}

// ── 천간 합 (天干合) ──────────────────────────────────────────
const CHEONGAN_HAP = {
  '甲己':'土합','乙庚':'金합','丙辛':'水합','丁壬':'木합','戊癸':'火합'
};
function getCheonganHap(a, b) {
  const key1 = a + b, key2 = b + a;
  return CHEONGAN_HAP[key1] || CHEONGAN_HAP[key2] || null;
}

// ── 지지 충 (地支沖) ──────────────────────────────────────────
const JIJI_CHUNG = [
  ['子','午'],['丑','未'],['寅','申'],['卯','酉'],['辰','戌'],['巳','亥']
];
function isChung(a, b) {
  return JIJI_CHUNG.some(pair => (pair[0]===a && pair[1]===b) || (pair[0]===b && pair[1]===a));
}

// ── 지지 형 (地支刑) ──────────────────────────────────────────
const JIJI_HYEONG = [
  ['寅','巳','申'],  // 삼형
  ['丑','戌','未'],  // 삼형
  ['子','卯'],       // 이형
  ['辰','辰'],       // 자형
  ['午','午'],
  ['酉','酉'],
  ['亥','亥']
];
function isHyeong(a, b) {
  return JIJI_HYEONG.some(group => group.includes(a) && group.includes(b) && a !== b);
}

// ── 지지 파 (地支破/六破) ──────────────────────────────────────
// ⚠ 명리학계 내에서도 학파에 따라 채택 여부가 갈리는 보조 신호.
//   충(沖)·형(刑)보다 작용력이 약하다는 게 다수 학파의 공통된 평가이므로,
//   프롬프트에서도 "참고용 약한 신호"로 표시하고 충·형과 동급으로 다루지 않는다.
const JIJI_PA = [
  ['子','酉'], ['丑','辰'], ['寅','亥'], ['卯','午'], ['巳','申'], ['未','戌']
];
function isPa(a, b) {
  return JIJI_PA.some(pair => (pair[0]===a && pair[1]===b) || (pair[0]===b && pair[1]===a));
}

// ── 지지 해 (地支害/六害) ──────────────────────────────────────
// ⚠ 파(破)와 마찬가지로 충·형보다 작용력이 약한 보조 신호로 다수 학파가 평가.
const JIJI_HAE = [
  ['子','未'], ['丑','午'], ['寅','巳'], ['卯','辰'], ['申','亥'], ['酉','戌']
];
function isHae(a, b) {
  return JIJI_HAE.some(pair => (pair[0]===a && pair[1]===b) || (pair[0]===b && pair[1]===a));
}

// ── 귀문관살 (鬼門關殺) ──────────────────────────────────────
// 신경과민·예민함·영적 감수성과 연결지어 해석되는 신살. 子-酉(자유파와 겹침)를
// 포함해 통상 아래 조합을 귀문관살로 본다 (출처마다 일부 조합 차이가 있을 수 있음).
const GWIMUN_GWANSAL = [
  ['子','酉'], ['丑','午'], ['寅','未'], ['卯','申'], ['辰','亥'], ['巳','戌']
];
function isGwimun(a, b) {
  return GWIMUN_GWANSAL.some(pair => (pair[0]===a && pair[1]===b) || (pair[0]===b && pair[1]===a));
}

// ── 지지 합 (地支合/六合) ──────────────────────────────────────
const JIJI_HAP = [
  ['子','丑'],['寅','亥'],['卯','戌'],['辰','酉'],['巳','申'],['午','未']
];
function isJijiHap(a, b) {
  return JIJI_HAP.some(pair => (pair[0]===a && pair[1]===b) || (pair[0]===b && pair[1]===a));
}

// ── 삼합 (三合) ──────────────────────────────────────────────
const SAMHAP = [
  ['申','子','辰'],  // 水국
  ['亥','卯','未'],  // 木국
  ['寅','午','戌'],  // 火국
  ['巳','酉','丑']   // 金국
];
function getSamhap(jijis) {
  const result = [];
  for (const group of SAMHAP) {
    const matched = group.filter(j => jijis.includes(j));
    if (matched.length >= 2) {
      result.push({ group, matched, complete: matched.length === 3 });
    }
  }
  return result;
}

// ── 방합 (方合) ──────────────────────────────────────────────
const BANGHAP = [
  ['寅','卯','辰'],  // 木방
  ['巳','午','未'],  // 火방
  ['申','酉','戌'],  // 金방
  ['亥','子','丑']   // 水방
];
function getBanghap(jijis) {
  return BANGHAP.filter(group => group.filter(j => jijis.includes(j)).length >= 2);
}

// ── 역마살 (驛馬殺) ──────────────────────────────────────────
const YEOKMA = { '申子辰':'寅', '亥卯未':'巳', '寅午戌':'申', '巳酉丑':'亥' };
function getYeokma(ilji) {
  for (const [group, yeokma] of Object.entries(YEOKMA)) {
    if (group.includes(ilji)) return yeokma;
  }
  return null;
}

// ── 도화살 (桃花殺) ──────────────────────────────────────────
const DOHWA = { '申子辰':'酉', '亥卯未':'子', '寅午戌':'卯', '巳酉丑':'午' };
function getDohwa(ilji) {
  for (const [group, dohwa] of Object.entries(DOHWA)) {
    if (group.includes(ilji)) return dohwa;
  }
  return null;
}

// ── 천을귀인 (天乙貴人) ─────────────────────────────────────
// 명리학에서 대표적인 길신(吉神). 일간 기준으로 판정하며, 원국 지지 중
// 해당 글자가 있으면 성립. 여러 독립 출처(삼명통회·명리약언 기반 정리)로 교차검증됨.
const CHEONEULGWIIN = {
  '甲': ['丑','未'], '戊': ['丑','未'], '庚': ['丑','未'],
  '乙': ['子','申'], '己': ['子','申'],
  '丙': ['亥','酉'], '丁': ['亥','酉'],
  '辛': ['寅','午'],
  '壬': ['卯','巳'], '癸': ['卯','巳']
};
// 반환 형식: { targets: ['寅','午'], found: ['寅'] }
//   targets : 일간 기준 천을귀인 후보 지지 (원국 보유 여부 무관)
//   found   : 원국 지지 중 실제로 있는 것 (없으면 빈 배열)
// ※ 기존에는 found 배열만 반환해 원국에 없으면 '없음'으로 출력되는 버그가 있었음.
//   이제 targets를 항상 함께 넘겨 프롬프트에서 "원국 내 부재, 대운·세운 발동 시 유효"
//   형태로 올바르게 표현할 수 있도록 수정한다.
function getCheoneulgwiin(ilgan, jijis) {
  const targets = CHEONEULGWIIN[ilgan] || [];
  const found = targets.filter(t => jijis.includes(t));
  return { targets, found };
}

// ── 백호살 (白虎殺) ──────────────────────────────────────────
// 대표적인 흉살(凶殺) 중 하나. 갑진·을미·병술·정축·무진·임술·계축 7개 간지 조합.
// 정통적으로는 "일주에 있어야 성립, 다른 주는 일주에 있을 때만 추가 인정"하는
// 규칙이나, 여기서는 4기둥 전체를 보조적으로 점검해 후보만 제시한다(최종 판단은
// 일주 여부를 우선하도록 프롬프트에서 안내).
const BAEKHO_GANJI = ['甲辰','乙未','丙戌','丁丑','戊辰','壬戌','癸丑'];
function getBaekho(juList) {
  // juList: [연주, 월주, 일주, 시주] 형태의 간지 문자열 배열 (없는 주는 null)
  const positions = ['연주','월주','일주','시주'];
  const hits = [];
  juList.forEach((ju, idx) => {
    if (ju && BAEKHO_GANJI.includes(ju)) hits.push(positions[idx] + '(' + ju + ')');
  });
  return hits;
}

// ── 공망 (空亡) ──────────────────────────────────────────────
const GONGMANG_TABLE = [
  { range: ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉'], gongmang: ['戌','亥'] },
  { range: ['甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未'], gongmang: ['申','酉'] },
  { range: ['甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳'], gongmang: ['午','未'] },
  { range: ['甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯'], gongmang: ['辰','巳'] },
  { range: ['甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑'], gongmang: ['寅','卯'] },
  { range: ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'], gongmang: ['子','丑'] }
];

function getGongmang(ilju) {
  for (const entry of GONGMANG_TABLE) {
    if (entry.range.includes(ilju)) return entry.gongmang;
  }
  return [];
}

// ── 갑자 순서 (60갑자) ──────────────────────────────────────
const GAPJA_60 = [];
for (let i = 0; i < 60; i++) {
  GAPJA_60.push(CHEONGAN[i % 10] + JIJI[i % 12]);
}

function getGapjaIndex(gapja) {
  return GAPJA_60.indexOf(gapja);
}

// ── 한글 간지 ↔ 한자 간지 변환 (만세력 DB·절기 DB 간 표기 통일용) ──────
const HANGUL_TO_HANJA_CG = { '갑':'甲','을':'乙','병':'丙','정':'丁','무':'戊','기':'己','경':'庚','신':'辛','임':'壬','계':'癸' };
const HANGUL_TO_HANJA_JI = { '자':'子','축':'丑','인':'寅','묘':'卯','진':'辰','사':'巳','오':'午','미':'未','신':'申','유':'酉','술':'戌','해':'亥' };

function hangulGanjiToHanja(ganjiStr) {
  if (!ganjiStr || ganjiStr.length < 2) return null;
  const cg = HANGUL_TO_HANJA_CG[ganjiStr[0]];
  const ji = HANGUL_TO_HANJA_JI[ganjiStr[1]];
  if (!cg || !ji) return null;
  return cg + ji;
}

// ── 데이터 소스 접근 헬퍼 ─────────────────────────────────────
// 브라우저 환경에서 window.manse100DB / window.SolarTerms 로 노출됨
function getManseDB() {
  return (typeof window !== 'undefined' && window.manse100DB) ? window.manse100DB : null;
}
function getSolarTermsAPI() {
  return (typeof window !== 'undefined' && window.SolarTerms) ? window.SolarTerms : null;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function toDateStr(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// 절기 DB가 커버하는 연도 범위
// [수정] 기존 2010~2050(날짜만 DB) → 1900~2100으로 확장
//        (시각 포함 새 solar_terms_db.js로 교체됨에 따라)
const SOLAR_TERMS_MIN_YEAR = 1900;
const SOLAR_TERMS_MAX_YEAR = 2100;
// 만세력 DB 연도 범위 (1950~2050)
const MANSE_MIN_YEAR = 1950;
const MANSE_MAX_YEAR = 2050;

// ── 연주 산출 ────────────────────────────────────────────────
// 절기 DB의 ganji_year 텍스트 필드는 표기 기준점이 일관되지 않아(검증 결과 약 50%
// 연도에서 입춘 당일 값이 전년/금년 중 들쭉날쭉) 신뢰할 수 없으므로 사용하지 않는다.
// 대신 절기 DB는 "입춘 정확한 날짜"만 경계값으로 차용하고,
// 실제 간지 값은 만세력 DB(year_ganji, 1950~2050 검증됨)를 기준으로 산출한다.
//
// 우선순위: ① 입춘 날짜(절기 DB) 기준으로 연도 경계를 보정한 뒤 만세력 DB의 year_ganji 사용
//          → ② 만세력 DB의 year_ganji (절기 보정 없음, 1/1 기준 근사, DB 범위 1950~2050)
//          → ③ 60갑자 순환 공식 (최후 폴백)
function getYeonju(year, month, day) {
  const st = getSolarTermsAPI();
  const manse = getManseDB();

  // ① 입춘 날짜로 saju-year를 보정 (생일이 그 해 입춘 이전이면 전년도 귀속)
  let sajuYear = year;
  if (st && month && day && year >= SOLAR_TERMS_MIN_YEAR && year <= SOLAR_TERMS_MAX_YEAR) {
    const dateStr = toDateStr(year, month, day);
    const ipchunThisYear = st.getByYear(year).find(t => t.name === '입춘');
    if (ipchunThisYear && dateStr < ipchunThisYear.date) {
      sajuYear = year - 1;
    }
  } else if (month && day) {
    // 절기 DB 범위 밖이면 입춘은 통상 양력 2/4 전후이므로 2/4 이전을 전년도로 근사 처리
    if (month === 1 || (month === 2 && day < 4)) {
      sajuYear = year - 1;
    }
  }

  // ② 만세력 DB에서 보정된 연도의 year_ganji 조회 (가장 신뢰도 높은 소스)
  if (manse && manse.years && manse.years[String(sajuYear)]) {
    const yg = manse.years[String(sajuYear)].year_ganji;
    if (yg) return yg; // 이미 한자 표기
  }

  // ③ 폴백: 60갑자 순환 공식 (1984년 = 甲子 기준, manse DB로 검증됨)
  const base = 1984;
  let diff = (sajuYear - base) % 60;
  if (diff < 0) diff += 60;
  return GAPJA_60[diff];
}

// ── 월건(月建) 12절 테이블 ──────────────────────────────────────
// 각 절기가 시작하는 시점부터 그 달의 지지(월지)가 확정된다.
const WOLGEON_TERMS = [
  { term: '입춘', ji: '寅' }, // 1월(인월) 시작
  { term: '경칩', ji: '卯' },
  { term: '청명', ji: '辰' },
  { term: '입하', ji: '巳' },
  { term: '망종', ji: '午' },
  { term: '소서', ji: '未' },
  { term: '입추', ji: '申' },
  { term: '백로', ji: '酉' },
  { term: '한로', ji: '戌' },
  { term: '입동', ji: '亥' },
  { term: '대설', ji: '子' },
  { term: '소한', ji: '丑' }
];

// 연간(年干)에 따른 월간(月干) 결정 — 오호둔법(五虎遁法)
// 갑/기년 → 인월 丙부터, 을/경년 → 인월 戊부터, 병/신년 → 인월 庚부터,
// 정/임년 → 인월 壬부터, 무/계년 → 인월 甲부터
const WOLGAN_START_BY_YEONGAN = {
  '甲': '丙', '己': '丙',
  '乙': '戊', '庚': '戊',
  '丙': '庚', '辛': '庚',
  '丁': '壬', '壬': '壬',
  '戊': '甲', '癸': '甲'
};

// 절기 경계를 정밀 탐색하여 해당 생일이 속한 "절(節)"과, 그 절의 시작일을 반환
function findGoverningTerm(year, month, day) {
  const st = getSolarTermsAPI();
  const dateStr = toDateStr(year, month, day);

  if (st && year >= SOLAR_TERMS_MIN_YEAR - 1 && year <= SOLAR_TERMS_MAX_YEAR) {
    const monthTermNames = WOLGEON_TERMS.map(t => t.term);
    const candidates = [
      ...st.getByYear(year - 1),
      ...st.getByYear(year),
      ...st.getByYear(year + 1)
    ].filter(t => monthTermNames.includes(t.name))
     .sort((a, b) => a.date.localeCompare(b.date));

    let current = null, currentIdx = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].date <= dateStr) {
        current = candidates[i];
        currentIdx = i;
      }
    }
    if (current) {
      const next = candidates[currentIdx + 1] || null;
      const prev = currentIdx > 0 ? candidates[currentIdx - 1] : null;
      return { term: current, next, prev, source: 'solar_terms_db' };
    }
  }
  return null; // 절기 DB 범위를 벗어남
}

// ── 절기 DB 범위 밖 폴백용: 12절의 양력 평균 경계일 (2010~2050년 절기 DB 통계 기반) ──
// 절기는 매년 ±1~2일 내에서만 변동하므로, 평균값을 고정 경계일로 사용하면
// 단순 "월 숫자 매핑"보다 훨씬 정확하다 (특히 매월 1~8일 출생자의 월 경계 오류 방지).
// { 월(양력), 일(경계 시작일), 지지 } — 해당 날짜부터 그 지지의 달이 시작됨
const WOLGEON_FIXED_DATES = [
  { month: 2,  day: 4,  ji: '寅' }, // 입춘
  { month: 3,  day: 6,  ji: '卯' }, // 경칩
  { month: 4,  day: 5,  ji: '辰' }, // 청명
  { month: 5,  day: 5,  ji: '巳' }, // 입하
  { month: 6,  day: 6,  ji: '午' }, // 망종
  { month: 7,  day: 7,  ji: '未' }, // 소서
  { month: 8,  day: 7,  ji: '申' }, // 입추
  { month: 9,  day: 8,  ji: '酉' }, // 백로
  { month: 10, day: 8,  ji: '戌' }, // 한로
  { month: 11, day: 7,  ji: '亥' }, // 입동
  { month: 12, day: 7,  ji: '子' }, // 대설
  { month: 1,  day: 5,  ji: '丑' }  // 소한
];

// 절기 DB 범위 밖 생년월일의 월지를 고정 경계일 테이블로 근사 판정
function getApproxWolji(month, day) {
  // 월/일을 "연중 일련번호"로 변환해 비교 (1/1=1 ~ 12/31=365 근사, 윤년 오차는 무시 가능 수준)
  const monthDayToOrdinal = (m, d) => m * 31 + d; // 31 곱은 월 비교 우선순위만 보장하면 충분
  const target = monthDayToOrdinal(month, day);

  // WOLGEON_FIXED_DATES를 연중 순서(1월 소한 포함)로 정렬한 버전 필요
  const sorted = [
    { month: 1,  day: 5,  ji: '丑' },
    { month: 2,  day: 4,  ji: '寅' },
    { month: 3,  day: 6,  ji: '卯' },
    { month: 4,  day: 5,  ji: '辰' },
    { month: 5,  day: 5,  ji: '巳' },
    { month: 6,  day: 6,  ji: '午' },
    { month: 7,  day: 7,  ji: '未' },
    { month: 8,  day: 7,  ji: '申' },
    { month: 9,  day: 8,  ji: '酉' },
    { month: 10, day: 8,  ji: '戌' },
    { month: 11, day: 7,  ji: '亥' },
    { month: 12, day: 7,  ji: '子' }
  ];

  let applicable = null;
  for (const entry of sorted) {
    if (monthDayToOrdinal(entry.month, entry.day) <= target) {
      applicable = entry;
    }
  }
  // target이 1/5(소한)보다 이전이면(즉 1/1~1/4) 전년도 子월(대설 다음)에 해당
  if (!applicable) {
    return '子';
  }
  return applicable.ji;
}

// ── 월주 산출 ────────────────────────────────────────────────
// 정밀 모드: 절기 DB로 정확한 절(節) 경계를 찾아 월지를 확정하고,
//           연간 기준 오호둔법으로 월간을 산출한다.
// 폴백 모드: 절기 DB 범위를 벗어나면 12절 평균 경계일 테이블로 월지를 근사 판정한다
//           (단순 월 숫자 매핑이 아니라 일자까지 반영하므로 매월 초 출생자도 오류가 적다).
function getWolju(year, month, day, yeonjuOverride) {
  const yeonju = yeonjuOverride || getYeonju(year, month, day);
  const yeonganHanja = yeonju[0];

  const governing = day ? findGoverningTerm(year, month, day) : null;

  if (governing) {
    const termInfo = WOLGEON_TERMS.find(t => t.term === governing.term.name);
    if (termInfo) {
      const ji = termInfo.ji;
      const jiPosFromIn = WOLGEON_TERMS.findIndex(t => t.ji === ji); // 寅=0 기준 순서
      const startCG = WOLGAN_START_BY_YEONGAN[yeonganHanja] || '丙';
      const startIdx = CHEONGAN.indexOf(startCG);
      const cgIdx = (startIdx + jiPosFromIn) % 10;
      return {
        gapja: CHEONGAN[cgIdx] + ji,
        precise: true,
        governingTerm: governing.term,
        nextTerm: governing.next,
        prevTerm: governing.prev
      };
    }
  }

  // 폴백: 절기 DB 범위 밖 — 12절 평균 경계일 테이블로 월지 근사 판정 (일자 반영)
  const ji = day ? getApproxWolji(month, day) : WOLGEON_TERMS[(month + 10) % 12].ji;
  const jiPosFromIn = WOLGEON_TERMS.findIndex(t => t.ji === ji);
  const startCG = WOLGAN_START_BY_YEONGAN[yeonganHanja] || '丙';
  const startIdx = CHEONGAN.indexOf(startCG);
  const cgIdx = (startIdx + jiPosFromIn) % 10;
  return {
    gapja: CHEONGAN[cgIdx] + ji,
    precise: false,
    governingTerm: null,
    nextTerm: null,
    prevTerm: null
  };
}

// ── 일주 산출 ────────────────────────────────────────────────
// 우선순위: ① 만세력 DB의 daily_cache (1950~2027 직접 조회, 가장 정확)
//          → ② 만세력 DB의 jan_1st_ganji + 해당 연도 내 경과일수로 환산 (1950~2050 커버)
//          → ③ 60갑자 순환 공식 (최후 폴백, DB 전혀 없을 때만)
function getIlju(year, month, day) {
  const dateStr = toDateStr(year, month, day);
  const manse = getManseDB();

  if (manse) {
    // ① daily_cache 직접 조회
    if (manse.daily_cache && manse.daily_cache[dateStr]) {
      return { gapja: manse.daily_cache[dateStr], precise: true, source: 'daily_cache' };
    }

    // ② jan_1st_ganji + 경과일수 환산 (윤년 포함 정확한 일수차 사용)
    if (manse.years && manse.years[String(year)]) {
      const jan1Ganji = manse.years[String(year)].jan_1st_ganji;
      const jan1Idx = GAPJA_60.indexOf(jan1Ganji);
      if (jan1Idx !== -1) {
        const jan1 = new Date(year, 0, 1);
        const target = new Date(year, month - 1, day);
        const diffDays = Math.round((target - jan1) / 86400000);
        let idx = (jan1Idx + diffDays) % 60;
        if (idx < 0) idx += 60;
        return { gapja: GAPJA_60[idx], precise: true, source: 'jan1_offset' };
      }
    }
  }

  // ③ 최후 폴백: 2000-01-01 기준 60갑자 순환 공식 (DB 전혀 없을 때만 사용됨)
  // 주의: 이 폴백은 만세력 DB 부재 시의 근사치로, 실제 만세력과 다를 수 있음
  const base = new Date(2000, 0, 1);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.round((target - base) / 86400000);
  let idx = (54 + diffDays) % 60; // 2000-01-01 = 戊午(index 54), 만세력DB로 검증된 값
  if (idx < 0) idx += 60;
  return { gapja: GAPJA_60[idx], precise: false, source: 'formula_fallback' };
}

// ── 시주 산출 ────────────────────────────────────────────────
const SIJU_JIJI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const SIJU_CG_BASE = { '甲':0,'己':0,'乙':2,'庚':2,'丙':4,'辛':4,'丁':6,'壬':6,'戊':8,'癸':8 };

function getSiju(ilganCG, siJijiStr) {
  if (!siJijiStr || siJijiStr === '모름') return null;
  // siJijiStr: '子시(23:30~01:30)' 형태에서 지지 추출
  const ji = siJijiStr[0];
  const jiIdx = JIJI.indexOf(ji);
  if (jiIdx === -1) return null;
  const baseIdx = SIJU_CG_BASE[ilganCG] || 0;
  const cgIdx = (baseIdx + jiIdx) % 10;
  return CHEONGAN[cgIdx] + ji;
}

// ── 대운 산출 ────────────────────────────────────────────────
// 대운수 = 생일~다음/이전 절기(節)까지의 일수 ÷ 3 (전통 명리 공식)
// 순행: 남자+양년生, 여자+음년生 → 다음 절기까지 일수 사용
// 역행: 남자+음년生, 여자+양년生 → 이전 절기까지 일수 사용
//
// [수정] hourStr 파라미터 추가. 기존에는 day 단위(자정 0시 기준)로만 일수를
// 계산해 반올림 경계(예: 4.45일↔4.55일)에 걸린 생일에서 대운수가 한 칸씩
// 어긋나는 문제가 있었음(실 사례: 1973-09-25 04:30生 → 자정 기준 4, 출생시각
// 반영 시 5가 정답). hourStr이 있으면 시지 구간의 시작 시각을 일수 계산에 반영한다.
function getDaeun(year, month, day, gender, count = 8, hourStr = null) {
  const yeonju = getYeonju(year, month, day);
  const yeonganUmyang = CHEONGAN_UMYANG[yeonju[0]];

  const sunhaeng = (gender === '남' && yeonganUmyang === '양') ||
                   (gender === '여' && yeonganUmyang === '음');

  const woljuResult = getWolju(year, month, day, yeonju);
  const wolIdx = GAPJA_60.indexOf(woljuResult.gapja);

  const daeuns = [];
  for (let i = 1; i <= count; i++) {
    let idx = sunhaeng ? (wolIdx + i) % 60 : (wolIdx - i + 60) % 60;
    daeuns.push(GAPJA_60[idx]);
  }

  const { hour, minute } = parseHourFromSiStr(hourStr);
  const startAgeResult = estimateDaeunStartAge(year, month, day, sunhaeng, woljuResult, hour, minute);

  return daeuns.map((gapja, i) => ({
    gapja,
    age: startAgeResult.age + i * 10,
    year: year + startAgeResult.age + i * 10
  })).map(d => ({ ...d, _daeunPrecise: startAgeResult.precise }));
}

// hourStr(예: '寅시(03:30~05:30)')에서 대운수 계산에 쓸 "대표 시각"을 추출.
function parseHourFromSiStr(siJijiStr) {
  if (!siJijiStr || siJijiStr === '모름') return { hour: 0, minute: 0 };
  const m = siJijiStr.match(/\((\d{1,2}):(\d{2})~/);
  if (!m) return { hour: 0, minute: 0 };
  return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

// 대운 시작 나이 정밀 계산: 절기 DB가 있으면 실제 날짜(가능하면 시:분까지)
// 차이 ÷ 3을 사용하고, 없으면 WOLGEON_FIXED_DATES(12절 평균 경계일) 기반
// 근사치로 폴백한다.
//
// [수정 이력]
//   1) 역행 시 woljuResult.prevTerm을 쓰면 "생일이 속한 절기"보다 한 단계
//      더 이전 절기까지 거리를 재는 버그가 있었음(예: 1975-09-02는
//      입추~백로 사이인데 prevTerm은 그 전인 소서를 가리켜 거리가 약
//      2배로 부풀려졌음). 역행 시 "지나온 과거의 절입일"은 생일이 속한
//      절기 자신의 시작일(governingTerm)이므로 prevTerm 대신 사용한다.
//   2) targetTermObj.datetime(시:분 포함, KST 명시 ISO)이 있으면 이를
//      우선 사용. birthDate도 동일하게 KST 명시 ISO로 만들어 타임존을
//      맞춘다(둘의 타임존이 다르면 최대 9시간=0.375일까지 오차가 생겨
//      반올림 결과가 바뀔 수 있음을 실제 사례로 확인했다).
//   3) 일수→나이 환산은 반올림(Math.round)이 맞다. 강다인(1973-09-25),
//      박찬수(1997-08-02), 임진권(1975-09-02) 세 실제 만세력 사례로
//      교차검증 완료 — 절사(floor)는 두 건에서 어긋남.
//   4) 폴백(절기 DB 범위 밖)도 day 단위 단순식 대신 WOLGEON_FIXED_DATES
//      기반 실제 절기까지의 근사 거리로 계산한다.
function estimateDaeunStartAge(year, month, day, sunhaeng, woljuResult, hour = 0, minute = 0) {
  // 절기 DB 기반 정밀 계산
  if (woljuResult && woljuResult.precise) {
    const targetTermObj = sunhaeng ? woljuResult.nextTerm : woljuResult.governingTerm;
    if (targetTermObj && (targetTermObj.datetime || targetTermObj.date)) {
      const pad = (n) => String(n).padStart(2, '0');
      const birthIso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`;
      const birthDate = new Date(birthIso);
      const termDate = targetTermObj.datetime
        ? new Date(targetTermObj.datetime)
        : new Date(targetTermObj.date + 'T00:00:00+09:00');
      const diffDays = Math.abs((termDate - birthDate) / 86400000);
      // 전통 공식: 일수 ÷ 3 을 반올림 = 대운수 (최소 1)
      const daeunNum = Math.max(1, Math.round(diffDays / 3));
      return { age: daeunNum, precise: true, diffDays };
    }
  }

  // 폴백: 절기 DB 범위 밖 — WOLGEON_FIXED_DATES(12절 평균 경계일)로
  // 순행=다음 절기, 역행=이전 절기까지의 일수를 근사 계산
  const diffDays = approxDaysToNearestTerm(year, month, day, sunhaeng);
  const daeunNum = Math.max(1, Math.round(diffDays / 3));
  return { age: daeunNum, precise: false, diffDays };
}

// WOLGEON_FIXED_DATES 기반으로 출생일에서 다음/이전 절기까지의 근사 일수를 계산
// (연도를 넘나드는 경계 — 1월 초 출생 시 전년도 대설, 12월 말 출생 시 익년도 소한 등 — 도 처리)
function approxDaysToNearestTerm(year, month, day, sunhaeng) {
  const sortedTerms = [
    { month: 1,  day: 5  }, { month: 2,  day: 4  }, { month: 3,  day: 6  },
    { month: 4,  day: 5  }, { month: 5,  day: 5  }, { month: 6,  day: 6  },
    { month: 7,  day: 7  }, { month: 8,  day: 7  }, { month: 9,  day: 8  },
    { month: 10, day: 8  }, { month: 11, day: 7  }, { month: 12, day: 7  }
  ];

  const birthDate = new Date(year, month - 1, day);

  const candidates = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const t of sortedTerms) {
      candidates.push(new Date(y, t.month - 1, t.day));
    }
  }
  candidates.sort((a, b) => a - b);

  if (sunhaeng) {
    const next = candidates.find(d => d > birthDate);
    return next ? Math.round((next - birthDate) / 86400000) : 15;
  } else {
    const prevList = candidates.filter(d => d <= birthDate);
    const prev = prevList.length ? prevList[prevList.length - 1] : null;
    return prev ? Math.round((birthDate - prev) / 86400000) : 15;
  }
}

// ── 세운 산출 ────────────────────────────────────────────────
// 세운의 연간지는 해당 연도 입춘 이후 시점 기준으로 산출한다 (12/31일자로 조회하면
// 항상 그 해 입춘을 이미 지난 상태이므로 정확한 ganji_year를 얻을 수 있다)
function getSeun(startYear, count = 12) {
  const result = [];
  for (let i = 0; i < count; i++) {
    const y = startYear + i;
    result.push({ year: y, gapja: getYeonju(y, 12, 31) });
  }
  return result;
}

// ── 오행 강약 분석 ───────────────────────────────────────────
function analyzeOheng(sajuPalja) {
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const char of sajuPalja) {
    const oh = CHEONGAN_OHENG[char] || JIJI_OHENG[char];
    if (oh) counts[oh]++;
  }
  return counts;
}

// ── 전체 사주 계산 ───────────────────────────────────────────
// seunStartYear/seunCount: 세운(歲運) 계산 시작 연도와 개수.
//   지정하지 않으면 기존 동작(현재 연도부터 미래 15개년)을 그대로 유지한다.
function calcSaju(year, month, day, hourStr, gender, seunStartYear, seunCount) {
  const yeonju = getYeonju(year, month, day);
  const woljuResult = getWolju(year, month, day, yeonju);
  const wolju = woljuResult.gapja;
  const iljuResult = getIlju(year, month, day);
  const ilju = iljuResult.gapja;
  const ilgan = ilju[0];
  const siju = getSiju(ilgan, hourStr === '모름' ? null : hourStr);

  const daeun = getDaeun(year, month, day, gender, 8, hourStr);
  const seun = getSeun(
    seunStartYear !== undefined ? seunStartYear : new Date().getFullYear(),
    seunCount !== undefined ? seunCount : 15
  );

  // 사주 8자 (시주 없으면 6자)
  const chars = siju
    ? [yeonju[0], yeonju[1], wolju[0], wolju[1], ilju[0], ilju[1], siju[0], siju[1]]
    : [yeonju[0], yeonju[1], wolju[0], wolju[1], ilju[0], ilju[1]];

  const ohengCount = analyzeOheng(chars);

  // 일간 기준 각 글자의 십성
  const sipseongMap = {};
  for (const char of chars) {
    if (char !== ilgan) {
      sipseongMap[char] = getSipseong(ilgan, char);
    }
  }

  // 지지 모음
  const jijis = [yeonju[1], wolju[1], ilju[1]];
  if (siju) jijis.push(siju[1]);

  // 충·형·합·파·해·귀문관살 분석 (4지지 전체 6쌍 전수 비교)
  const chungs = [], hyeongs = [], haps = [], pas = [], haes = [], gwimuns = [];
  for (let i = 0; i < jijis.length; i++) {
    for (let j = i + 1; j < jijis.length; j++) {
      if (isChung(jijis[i], jijis[j])) chungs.push([jijis[i], jijis[j]]);
      if (isHyeong(jijis[i], jijis[j])) hyeongs.push([jijis[i], jijis[j]]);
      if (isJijiHap(jijis[i], jijis[j])) haps.push([jijis[i], jijis[j]]);
      if (isPa(jijis[i], jijis[j])) pas.push([jijis[i], jijis[j]]);
      if (isHae(jijis[i], jijis[j])) haes.push([jijis[i], jijis[j]]);
      if (isGwimun(jijis[i], jijis[j])) gwimuns.push([jijis[i], jijis[j]]);
    }
  }

  const samhaps = getSamhap(jijis);
  const banghaps = getBanghap(jijis);
  const gongmang = getGongmang(ilju); // 일주 기준 공망 (가장 널리 쓰이는 기준)
  const gongmangYeonju = getGongmang(yeonju); // 연주 기준 공망 (보조 기준 — 학파에 따라 채택)
  const yeokma = getYeokma(ilju[1]);
  const dohwa = getDohwa(ilju[1]);
  const cheoneulgwiin = getCheoneulgwiin(ilgan, jijis); // 길신(吉神) — 흉살 위주 편향 방지
  const baekho = getBaekho(siju ? [yeonju, wolju, ilju, siju] : [yeonju, wolju, ilju, null]);
  const baekhoIlju = BAEKHO_GANJI.includes(ilju); // 일주 백호 여부(정통 판정 기준 — 가장 비중 큼)

  return {
    yeonju, wolju, ilju, siju, ilgan,
    daeun, seun,
    ohengCount, sipseongMap,
    chungs, hyeongs, haps, pas, haes, gwimuns, samhaps, banghaps,
    gongmang, gongmangYeonju, yeokma, dohwa, cheoneulgwiin, baekho, baekhoIlju,
    jijis, chars,
    _meta: {
      woljuPrecise: woljuResult.precise,
      iljuPrecise: iljuResult.precise,
      iljuSource: iljuResult.source,
      daeunPrecise: daeun.length > 0 ? daeun[0]._daeunPrecise : false,
      governingTerm: woljuResult.governingTerm,
      nextTerm: woljuResult.nextTerm,
      prevTerm: woljuResult.prevTerm
    }
  };
}
