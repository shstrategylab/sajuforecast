/**
 * baserate.js — 베이스레이트 계산 엔진
 *
 * 사주 예측 기록을 바탕으로 적중률·변별력 통계를 계산합니다.
 *
 * 핵심 개념
 * ─────────
 * - 예측(Prediction): 특정 사건이 발생할 것이라는 사주 판단
 * - 결과(Outcome)   : 실제 사건 발생 여부 (적중 / 미적중 / 미확인)
 * - 베이스레이트    : 해당 사건이 일반 모집단에서 발생하는 기저 확률
 * - 신호(Signal)    : 사주에서 해당 사건을 예고하는 특정 패턴/조합의 존재 여부
 * - 변별력          : 신호가 있을 때와 없을 때 적중률 차이 (= 정보 이득)
 *
 * 저장 구조 (localStorage key: "saju_baserate_records")
 * ────────────────────────────────────────────────────
 * [
 *   {
 *     id        : string,   // UUID
 *     domain    : string,   // 예측 영역 (예: "결혼·동거·재혼")
 *     signal    : boolean,  // 사주에 해당 신호가 있었는가
 *     outcome   : "hit" | "miss" | "pending",
 *     baseRate  : number,   // 사용자 지정 기저 확률 (0~1)
 *     note      : string,   // 메모
 *     createdAt : string,   // ISO 날짜
 *   },
 *   ...
 * ]
 */

const BaserateEngine = (function () {
  'use strict';

  const STORAGE_KEY = 'saju_baserate_records';

  /* ─────────────────────────────────────────
     저장소 헬퍼
  ───────────────────────────────────────── */

  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ─────────────────────────────────────────
     CRUD
  ───────────────────────────────────────── */

  function addRecord(domain, signal, outcome, baseRate, note) {
    const records = loadRecords();
    const record = {
      id        : generateId(),
      domain    : domain || '미분류',
      signal    : !!signal,
      outcome   : outcome || 'pending',
      baseRate  : parseFloat(baseRate) || 0,
      note      : note || '',
      createdAt : new Date().toISOString(),
    };
    records.push(record);
    saveRecords(records);
    return record;
  }

  function updateRecord(id, patch) {
    const records = loadRecords();
    const idx = records.findIndex(function (r) { return r.id === id; });
    if (idx === -1) return null;
    records[idx] = Object.assign({}, records[idx], patch);
    saveRecords(records);
    return records[idx];
  }

  function deleteRecord(id) {
    const records = loadRecords().filter(function (r) { return r.id !== id; });
    saveRecords(records);
  }

  function getRecords(filterFn) {
    const records = loadRecords();
    return filterFn ? records.filter(filterFn) : records;
  }

  /* ─────────────────────────────────────────
     통계 계산
  ───────────────────────────────────────── */

  /**
   * 전체 또는 도메인별 요약 통계를 반환합니다.
   *
   * @param {string|null} domain  - null이면 전체
   * @returns {object} stats
   */
  function calcStats(domain) {
    const all = loadRecords().filter(function (r) {
      return r.outcome !== 'pending' && (domain == null || r.domain === domain);
    });

    if (all.length === 0) {
      return {
        total       : 0,
        hitRate     : null,
        signalHit   : null,
        noSignalHit : null,
        discrimination: null,
        byDomain    : {},
      };
    }

    const hits       = all.filter(function (r) { return r.outcome === 'hit'; });
    const withSignal = all.filter(function (r) { return r.signal; });
    const withoutSig = all.filter(function (r) { return !r.signal; });

    const hitRate     = hits.length / all.length;
    const signalHit   = withSignal.length ? withSignal.filter(function (r) { return r.outcome === 'hit'; }).length / withSignal.length : null;
    const noSignalHit = withoutSig.length ? withoutSig.filter(function (r) { return r.outcome === 'hit'; }).length / withoutSig.length : null;

    // 변별력 = 신호 있을 때 적중률 - 신호 없을 때 적중률
    const discrimination = (signalHit !== null && noSignalHit !== null)
      ? signalHit - noSignalHit
      : null;

    // 도메인별 집계
    const byDomain = {};
    loadRecords().filter(function (r) { return r.outcome !== 'pending'; }).forEach(function (r) {
      if (!byDomain[r.domain]) {
        byDomain[r.domain] = { total: 0, hits: 0 };
      }
      byDomain[r.domain].total++;
      if (r.outcome === 'hit') byDomain[r.domain].hits++;
    });
    Object.keys(byDomain).forEach(function (d) {
      byDomain[d].hitRate = byDomain[d].hits / byDomain[d].total;
    });

    return {
      total          : all.length,
      hitCount       : hits.length,
      hitRate        : hitRate,
      signalCount    : withSignal.length,
      signalHit      : signalHit,
      noSignalCount  : withoutSig.length,
      noSignalHit    : noSignalHit,
      discrimination : discrimination,
      byDomain       : byDomain,
    };
  }

  /**
   * 임계값(threshold)별 변별력을 계산합니다.
   * 신호 강도(0~1) 필드가 있을 때 활용합니다.
   * 현재는 signal boolean 기반이므로 단일 임계값(0.5) 기준으로 반환합니다.
   *
   * @returns {Array<{threshold: number, discrimination: number, n: number}>}
   */
  function calcThresholdDiscrimination() {
    const records = loadRecords().filter(function (r) { return r.outcome !== 'pending'; });
    // boolean signal → threshold 0.5 고정
    const result = [];
    [0.5].forEach(function (t) {
      const above = records.filter(function (r) { return r.signal; });
      const below = records.filter(function (r) { return !r.signal; });
      const aboveHit = above.filter(function (r) { return r.outcome === 'hit'; });
      const belowHit = below.filter(function (r) { return r.outcome === 'hit'; });
      const disc = (above.length && below.length)
        ? (aboveHit.length / above.length) - (belowHit.length / below.length)
        : null;
      result.push({ threshold: t, discrimination: disc, n: records.length });
    });
    return result;
  }

  /* ─────────────────────────────────────────
     퍼블릭 API
  ───────────────────────────────────────── */

  return {
    addRecord                  : addRecord,
    updateRecord               : updateRecord,
    deleteRecord               : deleteRecord,
    getRecords                 : getRecords,
    calcStats                  : calcStats,
    calcThresholdDiscrimination: calcThresholdDiscrimination,
    loadRecords                : loadRecords,
  };
})();
