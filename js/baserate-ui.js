/**
 * baserate-ui.js — 베이스레이트 탭 UI 이벤트 핸들러 · 결과 렌더링
 *
 * 의존: baserate.js (BaserateEngine)
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     DOM 참조
  ───────────────────────────────────────── */

  function $(id) { return document.getElementById(id); }

  /* ─────────────────────────────────────────
     유틸
  ───────────────────────────────────────── */

  function pct(val) {
    if (val === null || val === undefined) return '—';
    return (val * 100).toFixed(1) + '%';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }

  /* ─────────────────────────────────────────
     통계 패널 렌더링
  ───────────────────────────────────────── */

  function renderStats() {
    const statsEl = $('br-stats');
    if (!statsEl) return;

    const stats = BaserateEngine.calcStats(null);

    if (stats.total === 0) {
      statsEl.innerHTML = '<p class="br-empty">아직 기록된 예측이 없습니다. 아래에서 첫 예측 결과를 추가하세요.</p>';
      return;
    }

    const discColor = stats.discrimination === null ? '' :
      stats.discrimination > 0.15 ? 'color:var(--accent-pos)' :
      stats.discrimination < 0    ? 'color:var(--accent-neg)' : '';

    let domainRows = '';
    Object.entries(stats.byDomain)
      .sort(function (a, b) { return b[1].total - a[1].total; })
      .forEach(function (entry) {
        const d = entry[0], s = entry[1];
        domainRows += '<tr>'
          + '<td>' + escHtml(d) + '</td>'
          + '<td>' + s.total + '</td>'
          + '<td>' + s.hits + '</td>'
          + '<td>' + pct(s.hitRate) + '</td>'
          + '</tr>';
      });

    statsEl.innerHTML = ''
      + '<div class="br-stat-grid">'
      +   '<div class="br-stat-card">'
      +     '<span class="br-stat-label">총 검증 수</span>'
      +     '<span class="br-stat-value">' + stats.total + '건</span>'
      +   '</div>'
      +   '<div class="br-stat-card">'
      +     '<span class="br-stat-label">전체 적중률</span>'
      +     '<span class="br-stat-value">' + pct(stats.hitRate) + '</span>'
      +   '</div>'
      +   '<div class="br-stat-card">'
      +     '<span class="br-stat-label">신호 있을 때 적중률</span>'
      +     '<span class="br-stat-value">' + pct(stats.signalHit) + '</span>'
      +     '<span class="br-stat-sub">n=' + (stats.signalCount || 0) + '</span>'
      +   '</div>'
      +   '<div class="br-stat-card">'
      +     '<span class="br-stat-label">신호 없을 때 적중률</span>'
      +     '<span class="br-stat-value">' + pct(stats.noSignalHit) + '</span>'
      +     '<span class="br-stat-sub">n=' + (stats.noSignalCount || 0) + '</span>'
      +   '</div>'
      +   '<div class="br-stat-card br-stat-card--wide">'
      +     '<span class="br-stat-label">변별력 (신호 유무 차이)</span>'
      +     '<span class="br-stat-value" style="' + discColor + '">'
      +       (stats.discrimination !== null ? (stats.discrimination >= 0 ? '+' : '') + pct(stats.discrimination) : '—')
      +     '</span>'
      +     '<span class="br-stat-sub">양수 = 신호가 예측력 있음 / 0 근처 = 무의미 / 음수 = 역방향</span>'
      +   '</div>'
      + '</div>'
      + (domainRows
        ? '<div class="br-domain-table-wrap">'
          + '<h4 class="br-section-title">영역별 적중률</h4>'
          + '<table class="br-domain-table">'
          + '<thead><tr><th>영역</th><th>총수</th><th>적중</th><th>적중률</th></tr></thead>'
          + '<tbody>' + domainRows + '</tbody>'
          + '</table>'
          + '</div>'
        : '');
  }

  /* ─────────────────────────────────────────
     기록 목록 렌더링
  ───────────────────────────────────────── */

  function renderList() {
    const listEl = $('br-list');
    if (!listEl) return;

    const records = BaserateEngine.getRecords().slice().reverse(); // 최신순

    if (records.length === 0) {
      listEl.innerHTML = '<p class="br-empty">기록이 없습니다.</p>';
      return;
    }

    const rows = records.map(function (r) {
      const outcomeLabel = r.outcome === 'hit' ? '✅ 적중' : r.outcome === 'miss' ? '❌ 미적중' : '⏳ 미확인';
      const outcomeClass = r.outcome === 'hit' ? 'br-hit' : r.outcome === 'miss' ? 'br-miss' : 'br-pending';
      return '<tr data-id="' + r.id + '">'
        + '<td>' + formatDate(r.createdAt) + '</td>'
        + '<td>' + escHtml(r.domain) + '</td>'
        + '<td>' + (r.signal ? '🔴 있음' : '⚪ 없음') + '</td>'
        + '<td class="' + outcomeClass + '">' + outcomeLabel + '</td>'
        + '<td>' + (r.baseRate ? pct(r.baseRate) : '—') + '</td>'
        + '<td class="br-note-cell">' + escHtml(r.note) + '</td>'
        + '<td class="br-actions">'
        +   '<button class="br-btn-outcome" data-id="' + r.id + '" data-outcome="hit" title="적중으로 변경">✅</button>'
        +   '<button class="br-btn-outcome" data-id="' + r.id + '" data-outcome="miss" title="미적중으로 변경">❌</button>'
        +   '<button class="br-btn-delete" data-id="' + r.id + '" title="삭제">🗑</button>'
        + '</td>'
        + '</tr>';
    }).join('');

    listEl.innerHTML = '<table class="br-record-table">'
      + '<thead><tr><th>날짜</th><th>영역</th><th>신호</th><th>결과</th><th>기저확률</th><th>메모</th><th>관리</th></tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';

    // 결과 변경 버튼
    listEl.querySelectorAll('.br-btn-outcome').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BaserateEngine.updateRecord(btn.dataset.id, { outcome: btn.dataset.outcome });
        refresh();
      });
    });

    // 삭제 버튼
    listEl.querySelectorAll('.br-btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('이 기록을 삭제할까요?')) {
          BaserateEngine.deleteRecord(btn.dataset.id);
          refresh();
        }
      });
    });
  }

  /* ─────────────────────────────────────────
     전체 갱신
  ───────────────────────────────────────── */

  function refresh() {
    renderStats();
    renderList();
  }

  /* ─────────────────────────────────────────
     폼 제출
  ───────────────────────────────────────── */

  function bindForm() {
    const form = $('br-add-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const domain   = $('br-domain').value.trim();
      const signal   = $('br-signal').value === 'true';
      const outcome  = $('br-outcome').value;
      const baseRate = parseFloat($('br-baserate-input').value) / 100 || 0;
      const note     = $('br-note').value.trim();

      if (!domain) {
        alert('영역을 선택하거나 직접 입력하세요.');
        return;
      }

      const result = BaserateEngine.addRecord(domain, signal, outcome, baseRate, note);
      if (!result) {
        alert('기록 저장에 실패했습니다. 브라우저의 시크릿/프라이빗 모드이거나 저장공간 제한 때문일 수 있습니다.');
        return;
      }
      form.reset();
      refresh();
    });
  }

  /* ─────────────────────────────────────────
     내보내기 (CSV)
  ───────────────────────────────────────── */

  function bindExport() {
    const btn = $('br-export-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const records = BaserateEngine.getRecords();
      if (!records.length) { alert('내보낼 기록이 없습니다.'); return; }

      const header = ['날짜', '영역', '신호', '결과', '기저확률', '메모'];
      const rows = records.map(function (r) {
        return [
          formatDate(r.createdAt),
          r.domain,
          r.signal ? '있음' : '없음',
          r.outcome === 'hit' ? '적중' : r.outcome === 'miss' ? '미적중' : '미확인',
          r.baseRate ? (r.baseRate * 100).toFixed(1) + '%' : '',
          '"' + r.note.replace(/"/g, '""') + '"',
        ].join(',');
      });

      const csv = [header.join(',')].concat(rows).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'saju_baserate_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ─────────────────────────────────────────
     초기화
  ───────────────────────────────────────── */

  function init() {
    bindForm();
    bindExport();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
