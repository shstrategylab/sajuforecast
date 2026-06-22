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
// wonguk8: 사주 8자 배열 (천간+지지 섞임) — cheonganSignals 계산용
// wonguk4: [연지, 월지, 일지, 시지] — 지지 신호 계산용 (기존 인터페이스 유지)
// ⚠ 하위호환: wonguk8 미전달 시 cheonganSignals는 빈 값으로 채워짐
function getYearSignals(year, wonguk4, ilgan, samhapMode, wonguk8) {
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

  // ── 삼합 강화 여부: 완성된 삼합이 어떤 오행국(局)인지 표기 ──────────────
  // 삼합이 재성·관성·인성 등 어떤 십성 국을 강화하는지 해석 맥락을 제공한다.
  // (지지 신호 signalCount에는 포함됨 — 기존 동작 유지)
  const samhapDetails = samhapHits.map(s => {
    const SAMHAP_OHENG = {
      '申子辰': '水', '亥卯未': '木', '寅午戌': '火', '巳酉丑': '金'
    };
    const oheng = Object.entries(SAMHAP_OHENG).find(([k]) =>
      s.group && s.group.every(g => k.includes(g))
    );
    return {
      desc: s.matched.join('') + (s.complete ? '(완성)' : '(반합)'),
      oheng: oheng ? oheng[1] : null,
      complete: s.complete
    };
  });

  const seunSipseong = ilgan ? getSipseong(ilgan, seunCg) : null;

  // 임시 상관견관 여부: 세운천간이 상관이고, 원국 또는 세운에 정관이 있는 경우만 별도 표시
  const isImsiSangwan = seunSipseong === '상관(傷官)';

  // ── 천간 신호 — 기록 전용, signalCount에 미포함 ────────────────────────
  // 설계 원칙: 천간 신호를 signalCount에 합산하면 검증되지 않은 가설을 코드에 내장하는
  // 셈이 된다. 사례가 충분히 쌓일 때까지 별도 컬럼으로 기록만 하고,
  // 실제 변별력은 baserate UI에서 눈으로 확인하는 방식을 택한다.
  let cheonganSignals = null;
  if (wonguk8 && ilgan) {
    const isBaeujaSeong =
      seunSipseong === '정재(正財)' || seunSipseong === '편재(偏財)' ||  // 남성 배우자성
      seunSipseong === '정관(正官)' || seunSipseong === '편관(偏官/七殺)'; // 여성 배우자성

    const bogeumHits = getCheonganBogeum(seunCg, wonguk8);

    const cheonganHapHits = getCheonganHapWithWonguk(seunCg, wonguk8);

    // 배우자성 복음 여부: 세운천간이 배우자성이면서 동시에 원국에 같은 천간이 있는 경우
    // → 원국 배우자성이 세운에서 "공명(共鳴)"하는 가장 강한 신호
    const isBaeujaBogeun = isBaeujaSeong && bogeumHits.length > 0;

    cheonganSignals = {
      sipseong: seunSipseong,           // 세운천간의 십성 (매년 기록)
      isBaeujaSeong,                    // 배우자성(정재/편재/정관/편관) 여부
      bogeumHits,                       // 원국 천간과 복음 발생 위치 목록
      cheonganHapHits,                  // 원국 천간과 천간합 발생 위치·합화오행 목록
      isBaeujaBogeun,                   // 배우자성+복음 동시 — 가장 강한 천간 신호
      // 미래 분석 확장용: 식상·비겁 발동 여부도 기록 (signalCount 미포함)
      isSikSang: seunSipseong === '식신(食神)' || seunSipseong === '상관(傷官)',
      isBiGup: seunSipseong === '비견(比肩)' || seunSipseong === '겁재(劫財)'
    };
  }

  // signalCount = 지지 신호만 (충·합·형·삼합) — 기존 동작 완전 유지
  const signalCount = chungHits.length + hapHits.length + hyeongHits.length + samhapHits.length;

  return {
    year,
    yeonju,
    seunJi,
    seunCg,
    chungHits,
    hapHits,
    hyeongHits,
    samhapHits: samhapDetails.map(s => s.desc),  // 기존 UI 호환 형태 유지
    samhapDetails,                                 // 오행국 정보 포함 상세 버전
    seunSipseong,
    isImsiSangwan,
    signalCount,
    cheonganSignals // null if wonguk8 미전달 (하위호환)
  };
}

// ── 전체 기간 베이스레이트 계산 ──
// birthYear: 출생연도, endYear: 분석 종료연도(보통 현재)
// wonguk4: [연지, 월지, 일지, 시지]
// wonguk8: 사주 8자 배열 (천간+지지) — cheonganSignals 계산용. 미전달 시 천간 신호 미포함
// ilgan: 일간
// eventYears: 사용자가 입력한 실제 사건 발생 연도 배열 (예: [1995, 1997, 2003, 2013])
// samhapMode: 'complete' | 'loose'
function calcBaseRate(birthYear, endYear, wonguk4, ilgan, eventYears, samhapMode, wonguk8) {
  const allYears = [];
  for (let y = birthYear; y <= endYear; y++) {
    const sig = getYearSignals(y, wonguk4, ilgan, samhapMode, wonguk8);
    sig.isEventYear = eventYears.includes(y);
    allYears.push(sig);
  }

  const totalYears = allYears.length;
  const eventYearSignals = allYears.filter(y => y.isEventYear);
  const nonEventYearSignals = allYears.filter(y => !y.isEventYear);

  // 임계값별(1개 이상/2개 이상/3개 이상) 히트율 계산 — 지지 신호 기준 (signalCount)
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

  // ── 천간 신호 베이스레이트 (참고용, 별도 집계) ──────────────────────────
  // signalCount와 독립적으로 천간 신호의 사건해/무사건해 히트율을 계산한다.
  // 사례가 쌓이면 이 수치로 "천간 신호의 실제 변별력"을 검증할 수 있다.
  const cheonganStats = (() => {
    const hasCheongan = allYears.filter(y => y.cheonganSignals !== null);
    if (!hasCheongan.length) return null;

    const checks = [
      { key: 'isBaeujaSeong', label: '배우자성 발동' },
      { key: 'isBaeujaBogeun', label: '배우자성+복음' },
      { key: 'isSikSang', label: '식상 발동' },
      { key: 'isBiGup', label: '비겁 발동' }
    ];

    return checks.map(({ key, label }) => {
      const hitYears = hasCheongan.filter(y => y.cheonganSignals[key]);
      const hitEventYears = hitYears.filter(y => y.isEventYear);
      const hitNonEventYears = hitYears.filter(y => !y.isEventYear);
      const eventTotal = eventYearSignals.filter(y => y.cheonganSignals !== null).length;
      const nonEventTotal = nonEventYearSignals.filter(y => y.cheonganSignals !== null).length;

      const eventHitRate = eventTotal > 0 ? hitEventYears.length / eventTotal : null;
      const nonEventHitRate = nonEventTotal > 0 ? hitNonEventYears.length / nonEventTotal : null;

      return {
        key,
        label,
        totalHits: hitYears.length,
        eventHits: hitEventYears.length,
        nonEventHits: hitNonEventYears.length,
        eventHitRate,
        nonEventHitRate,
        discrimination: (eventHitRate !== null && nonEventHitRate !== null)
          ? eventHitRate - nonEventHitRate
          : null
      };
    });
  })();

  return {
    ruleVersion: BASERATE_RULE_VERSION,
    samhapMode,
    birthYear,
    endYear,
    totalYears,
    eventYearCount: eventYearSignals.length,
    nonEventYearCount: nonEventYearSignals.length,
    allYears,
    thresholdStats,
    cheonganStats // null if wonguk8 미전달
  };
}
