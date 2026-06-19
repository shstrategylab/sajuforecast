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
    // 지지 음양: 子寅辰午申戌 양, 丑卯巳未酉亥 음
    targetUmyang = ['子','寅','辰','午','申','戌'].includes(target) ? '양' : '음';
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

// ── 연주 산출 ────────────────────────────────────────────────
// 1984년 = 甲子(index 0)
function getYeonju(year) {
  const base = 1984;
  let diff = (year - base) % 60;
  if (diff < 0) diff += 60;
  return GAPJA_60[diff];
}

// ── 월주 산출 ────────────────────────────────────────────────
// 절기 기반 정밀 계산 대신 대략적 기준 (실제 사주는 절기 필요)
const WOLJU_CHEONGAN_BASE = {
  '甲':2, '己':2, '乙':4, '庚':4, '丙':6, '辛':6, '丁':8, '壬':8, '戊':0, '癸':0
};
const WOLJI_BY_MONTH = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];

function getWolju(year, month) {
  const yeonjuCG = getYeonju(year)[0];
  const baseIdx = WOLJU_CHEONGAN_BASE[yeonjuCG];
  const cgIdx = (baseIdx + (month - 1)) % 10;
  const ji = WOLJI_BY_MONTH[month - 1];
  return CHEONGAN[cgIdx] + ji;
}

// ── 일주 산출 ────────────────────────────────────────────────
// 기준: 2000-01-01 = 甲戌 (index 10)
function getIlju(year, month, day) {
  const base = new Date(2000, 0, 1);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.round((target - base) / 86400000);
  let idx = (10 + diffDays) % 60;
  if (idx < 0) idx += 60;
  return GAPJA_60[idx];
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
// 대운수는 생일~다음/이전 절기까지의 일수 ÷ 3
// 여기서는 간략화: 월주 기준 순행/역행
function getDaeun(year, month, day, gender, count = 8) {
  const yeonju = getYeonju(year);
  const yeonganUmyang = CHEONGAN_UMYANG[yeonju[0]];

  // 순행: 남+양간, 여+음간 / 역행: 남+음간, 여+양간
  const sunhaeng = (gender === '남' && yeonganUmyang === '양') ||
                   (gender === '여' && yeonganUmyang === '음');

  const wolju = getWolju(year, month);
  const wolIdx = GAPJA_60.indexOf(wolju);

  const daeuns = [];
  for (let i = 1; i <= count; i++) {
    let idx = sunhaeng ? (wolIdx + i) % 60 : (wolIdx - i + 60) % 60;
    daeuns.push(GAPJA_60[idx]);
  }

  // 대운 시작 나이 (간략화: 보통 남-양 3~8세 시작, 정밀화 필요)
  // 실제는 절기까지 일수÷3 계산 필요
  const startAge = estimateDaeunStartAge(year, month, day, gender, yeonganUmyang);

  return daeuns.map((gapja, i) => ({
    gapja,
    age: startAge + i * 10,
    year: year + startAge + i * 10
  }));
}

function estimateDaeunStartAge(year, month, day, gender, yeonganUmyang) {
  // 절기 계산 간략화 - 실제 사용시 절기 DB 필요
  // 임시: 월 기반 추정 (3~9 범위)
  const sunhaeng = (gender === '남' && yeonganUmyang === '양') ||
                   (gender === '여' && yeonganUmyang === '음');
  const base = sunhaeng ? (31 - day) : day;
  const daeunNum = Math.ceil(base / 3);
  return Math.max(1, Math.min(9, daeunNum));
}

// ── 세운 산출 ────────────────────────────────────────────────
function getSeun(startYear, count = 12) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({ year: startYear + i, gapja: getYeonju(startYear + i) });
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
function calcSaju(year, month, day, hourStr, gender) {
  const yeonju = getYeonju(year);
  const wolju = getWolju(year, month);
  const ilju = getIlju(year, month, day);
  const ilgan = ilju[0];
  const siju = getSiju(ilgan, hourStr === '모름' ? null : hourStr);

  const daeun = getDaeun(year, month, day, gender, 8);
  const seun = getSeun(new Date().getFullYear(), 15);

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

  // 충·형·합 분석
  const chungs = [], hyeongs = [], haps = [];
  for (let i = 0; i < jijis.length; i++) {
    for (let j = i + 1; j < jijis.length; j++) {
      if (isChung(jijis[i], jijis[j])) chungs.push([jijis[i], jijis[j]]);
      if (isHyeong(jijis[i], jijis[j])) hyeongs.push([jijis[i], jijis[j]]);
      if (isJijiHap(jijis[i], jijis[j])) haps.push([jijis[i], jijis[j]]);
    }
  }

  const samhaps = getSamhap(jijis);
  const banghaps = getBanghap(jijis);
  const gongmang = getGongmang(ilju);
  const yeokma = getYeokma(ilju[1]);
  const dohwa = getDohwa(ilju[1]);

  return {
    yeonju, wolju, ilju, siju, ilgan,
    daeun, seun,
    ohengCount, sipseongMap,
    chungs, hyeongs, haps, samhaps, banghaps,
    gongmang, yeokma, dohwa,
    jijis, chars
  };
}
