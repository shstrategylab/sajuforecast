// ============================================================
//  baserate.js · 베이스레이트(기저율) 계산 엔진
//  목적: "사건이 있던 해"와 "아무 일 없던 해" 양쪽에 동일한 규칙을
//        기계적으로 적용해, 그 규칙이 실제로 변별력이 있는지 검증한다.
//  설계 원칙:
//   - 신호는 절대 미리 가중치를 매기거나 합산 점수를 만들지 않는다.
//     (점수화 자체가 또 다른 형태의 사후 끼워맞추기가 될 수 있음)
//   - 신호 종류별로 분리해서 세고, 임계값(1개/2개/3개 이상)별로
//     동시에 결과를 보여줘 사용자가 스스로 변별력을 판단하게 한다.
//   - 규칙(어떤 신호를 셀지)은 이 파일 상단에 고정해두고, 사례를 볼 때마다
//     바꾸지 않는다. 바꾸려면 버전을 올리고 명시적으로 기록한다.
// ============================================================

// ── 분석 규칙 버전 (사례를 볼 때마다 바뀌지 않도록 버전을 명시 고정) ──
const BASERATE_RULE_VERSION = 'v1 (2026-06-20 고정)';

// ── 신호 1년치 계산 ──
// year: 분석 대상 연도 (세운 산출 기준)
// wonguk4: [연지, 월지, 일지, 시지] 4글자 배열
// ilgan: 일간 천간 (세운 천간의 임시 십성 계산용)
// samhapMode: 'complete'(완성만 인정) | 'loose'(반합도 인정)
function getYearSignals(year, wonguk4, ilgan, samhapMode) {
  const positions = ['연지', '월지', '일지', '시지'];
  const yeonju = getYeonju(year, 6, 1); // 세운은 연중 대표 시점(6/1)으로 산출 — 절기 경계 영향 없는 안전한 날짜
  const seunJi = yeonju[1];
  const seunCg = yeonju[0];

  const chungHits = [];
  const hapHits = [];
  const hyeongHits = [];

  wonguk4.forEach((w, idx) => {
    if (!w) return;
    if (isChung(w, seunJi)) chungHits.push(positions[idx] + '(' + w + ')');
    if (isJijiHap(w, seunJi)) hapHits.push(positions[idx] + '(' + w + ')');
    if (isHyeong(w, seunJi)) hyeongHits.push(positions[idx] + '(' + w + ')');
  });

  // 삼합 판정: 원국 4글자 + 세운지지를 합쳐서 검사
  const validWonguk = wonguk4.filter(Boolean);
  const samhapCandidates = getSamhap([...validWonguk, seunJi]);
  const samhapHits = samhapCandidates.filter(s => {
    if (samhapMode === 'complete') return s.complete;
    return s.matched.length >= 2; // loose: 반합도 인정
  });

  const seunSipseong = ilgan ? getSipseong(ilgan, seunCg) : null;

  // 임시 상관견관 여부: 세운천간이 상관이고, 원국 또는 세운에 정관이 있는 경우만 별도 표시
  const isImsiSangwan = seunSipseong === '상관(傷官)';

  const signalCount = chungHits.length + hapHits.length + hyeongHits.length + samhapHits.length;

  return {
    year,
    yeonju,
    seunJi,
    seunCg,
    chungHits,
    hapHits,
    hyeongHits,
    samhapHits: samhapHits.map(s => s.matched.join('') + (s.complete ? '(완성)' : '(반합)')),
    seunSipseong,
    isImsiSangwan,
    signalCount
  };
}

// ── 전체 기간 베이스레이트 계산 ──
// birthYear: 출생연도, endYear: 분석 종료연도(보통 현재)
// wonguk4: [연지, 월지, 일지, 시지]
// ilgan: 일간
// eventYears: 사용자가 입력한 실제 사건 발생 연도 배열 (예: [1995, 1997, 2003, 2013])
// samhapMode: 'complete' | 'loose'
function calcBaseRate(birthYear, endYear, wonguk4, ilgan, eventYears, samhapMode) {
  const allYears = [];
  for (let y = birthYear; y <= endYear; y++) {
    const sig = getYearSignals(y, wonguk4, ilgan, samhapMode);
    sig.isEventYear = eventYears.includes(y);
    allYears.push(sig);
  }

  const totalYears = allYears.length;
  const eventYearSignals = allYears.filter(y => y.isEventYear);
  const nonEventYearSignals = allYears.filter(y => !y.isEventYear);

  // 임계값별(1개 이상/2개 이상/3개 이상) 히트율 계산
  const thresholds = [1, 2, 3];
  const thresholdStats = thresholds.map(t => {
    const allHitRate = allYears.filter(y => y.signalCount >= t).length / totalYears;
    const eventHitRate = eventYearSignals.length > 0
      ? eventYearSignals.filter(y => y.signalCount >= t).length / eventYearSignals.length
      : null;
    const nonEventHitRate = nonEventYearSignals.length > 0
      ? nonEventYearSignals.filter(y => y.signalCount >= t).length / nonEventYearSignals.length
      : null;
    return {
      threshold: t,
      allHitRate,
      eventHitRate,
      nonEventHitRate,
      // 변별력 = 사건해 히트율 - 무사건해 히트율. 0에 가까우면 변별력 없음, 음수면 역효과
      discrimination: (eventHitRate !== null && nonEventHitRate !== null)
        ? eventHitRate - nonEventHitRate
        : null
    };
  });

  return {
    ruleVersion: BASERATE_RULE_VERSION,
    samhapMode,
    birthYear,
    endYear,
    totalYears,
    eventYearCount: eventYearSignals.length,
    nonEventYearCount: nonEventYearSignals.length,
    allYears,
    thresholdStats
  };
}
