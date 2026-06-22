// ============================================================
//  baserate-ui.js · 베이스레이트 검증기 UI 로직
// ============================================================

// ── 양력/음력 토글 (베이스레이트 탭 전용 — main.js의 setupCalendarTypeToggle과 별개) ──
function setupBaserateCalendarToggle() {
  const radios = document.querySelectorAll('input[name="brCalendarType"]');
  const leapGroup = document.getElementById('brLeapMonthGroup');
  const yearLabel = document.getElementById('brBirthYearLabel');
  const monthLabel = document.getElementById('brBirthMonthLabel');
  const dayLabel = document.getElementById('brBirthDayLabel');
  const noticeBox = document.getElementById('brConvertedDateNotice');

  function update() {
    const type = document.querySelector('input[name="brCalendarType"]:checked')?.value || '양력';
    const isLunar = type === '음력';
    leapGroup.style.display = isLunar ? 'block' : 'none';
    yearLabel.textContent = isLunar ? '태어난 해 (음력)' : '태어난 해 (양력)';
    monthLabel.textContent = isLunar ? '태어난 월 (음력)' : '태어난 월';
    dayLabel.textContent = isLunar ? '태어난 일 (음력)' : '태어난 일';
    noticeBox.style.display = 'none';
    noticeBox.textContent = '';
  }

  radios.forEach(r => r.addEventListener('change', update));
  update();
}

document.addEventListener('DOMContentLoaded', setupBaserateCalendarToggle);

// ── 사건 연도 문자열 파싱 ("1995, 1997, 2003, 2013" -> [1995,1997,2003,2013]) ──
function parseEventYears(str) {
  if (!str || !str.trim()) return [];
  return str.split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n));
}

function runBaseRate() {
  const gender = document.querySelector('input[name="brGender"]:checked')?.value || '남';
  const calendarType = document.querySelector('input[name="brCalendarType"]:checked')?.value || '양력';
  const isLeapMonth = document.getElementById('brIsLeapMonth').checked;
  const samhapMode = document.querySelector('input[name="brSamhapMode"]:checked')?.value || 'complete';

  const inputYear = parseInt(document.getElementById('brBirthYear').value);
  const inputMonth = parseInt(document.getElementById('brBirthMonth').value);
  const inputDay = parseInt(document.getElementById('brBirthDay').value);
  const hourStr = document.getElementById('brBirthHour').value;
  const endYear = parseInt(document.getElementById('brEndYear').value);
  const eventYears = parseEventYears(document.getElementById('brEventYears').value);

  const noticeBox = document.getElementById('brConvertedDateNotice');
  noticeBox.style.display = 'none';
  noticeBox.textContent = '';

  // ── 유효성 검사 ──
  if (!inputYear || inputYear < 1900 || inputYear > 2050) {
    showToast('태어난 해를 1900~2050년 사이로 입력하세요.', true); return;
  }
  if (!inputMonth) { showToast('태어난 월을 선택하세요.', true); return; }
  if (!inputDay || inputDay < 1 || inputDay > 30) { showToast('태어난 일을 올바르게 입력하세요.', true); return; }
  if (!endYear || endYear < inputYear) { showToast('분석 종료 연도를 출생연도 이후로 입력하세요.', true); return; }
  if (eventYears.length === 0) { showToast('실제 사건이 있었던 연도를 최소 1개 이상 입력하세요.', true); return; }

  const outOfRangeEvents = eventYears.filter(y => y < inputYear || y > endYear);
  if (outOfRangeEvents.length > 0) {
    showToast('사건 연도(' + outOfRangeEvents.join(',') + ')가 분석 기간을 벗어났습니다.', true);
    return;
  }

  // ── 음력 변환 (필요시) ──
  let year, month, day;
  if (calendarType === '음력') {
    const converted = convertLunarToSolar(inputYear, inputMonth, inputDay, isLeapMonth);
    if (converted.error) { showToast(converted.error, true); return; }
    year = converted.year; month = converted.month; day = converted.day;
    noticeBox.style.display = 'block';
    noticeBox.innerHTML = '<span style="color:#1a5c5c; font-size:0.82rem;">📅 음력 '
      + inputYear + '년 ' + inputMonth + '월 ' + inputDay + '일' + (isLeapMonth ? ' (윤달)' : '')
      + ' → 양력 ' + year + '년 ' + month + '월 ' + day + '일로 변환되었습니다.</span>';
  } else {
    year = inputYear; month = inputMonth; day = inputDay;
  }

  // ── 원국 산출 (시간을 입력했으면 시지까지 포함, '모름'이면 연/월/일 3기둥만으로 계산) ──
  let saju;
  try {
    saju = calcSaju(year, month, day, hourStr, gender);
  } catch (e) {
    showToast('사주 계산 중 오류가 발생했습니다.', true);
    console.error(e);
    return;
  }

  const wonguk4 = [
    saju.yeonju[1], saju.wolju[1], saju.ilju[1],
    saju.siju ? saju.siju[1] : null // 시간 '모름'이면 siju가 null → 시지 비교 제외
  ];
  const wonguk8 = saju.siju
    ? [saju.yeonju[0], saju.yeonju[1], saju.wolju[0], saju.wolju[1], saju.ilju[0], saju.ilju[1], saju.siju[0], saju.siju[1]]
    : [saju.yeonju[0], saju.yeonju[1], saju.wolju[0], saju.wolju[1], saju.ilju[0], saju.ilju[1]];
  const ilgan = saju.ilgan;

  const result = calcBaseRate(year, endYear, wonguk4, ilgan, eventYears, samhapMode, wonguk8);
  renderBaseRateResult(result, saju, { year, month, day, gender });
}

function renderBaseRateResult(result, saju, birthInfo) {
  const box = document.getElementById('baserateOutputBox');

  let html = '';

  // 상단 요약
  html += '<div class="br-summary">';
  html += '<p><strong>원국' + (saju.siju ? '(연/월/일/시주)' : '(연/월/일주)') + ':</strong> ' + saju.yeonju + ' · ' + saju.wolju + ' · ' + saju.ilju
    + (saju.siju ? ' · ' + saju.siju : '')
    + (saju.siju ? '' : ' <span class="br-note">(시를 모름으로 입력해 시주는 비교 대상에서 제외됨)</span>') + '</p>';
  html += '<p><strong>분석 기간:</strong> ' + birthInfo.year + '년 ~ ' + result.endYear + '년 (총 ' + result.totalYears + '년)</p>';
  html += '<p><strong>사건 연도:</strong> ' + result.eventYearCount + '건 / <strong>무사건 연도:</strong> ' + result.nonEventYearCount + '년</p>';
  html += '<p><strong>삼합 기준:</strong> ' + (result.samhapMode === 'complete' ? '완성만 인정' : '반합도 인정') + '</p>';
  if (result.eventYearCount < 8) {
    html += '<p class="br-warn">⚠ 사건 표본이 ' + result.eventYearCount + '건으로 적습니다. 아래 수치는 경향성 참고용이며, 통계적으로 확정된 결론이 아닙니다.</p>';
  }
  html += '</div>';

  // 임계값별 변별력 테이블
  html += '<table class="br-table"><thead><tr>'
    + '<th>임계값</th><th>전체 히트율</th><th>사건해 히트율</th><th>무사건해 히트율</th><th>변별력(%p)</th>'
    + '</tr></thead><tbody>';

  result.thresholdStats.forEach(t => {
    const disc = t.discrimination;
    let discClass = 'br-neutral';
    if (disc !== null) {
      if (disc >= 0.2) discClass = 'br-positive';
      else if (disc <= -0.1) discClass = 'br-negative';
    }
    html += '<tr>'
      + '<td>' + t.threshold + '개 이상</td>'
      + '<td>' + (t.allHitRate * 100).toFixed(0) + '%</td>'
      + '<td>' + (t.eventHitRate !== null ? (t.eventHitRate * 100).toFixed(0) + '%' : '-') + '</td>'
      + '<td>' + (t.nonEventHitRate !== null ? (t.nonEventHitRate * 100).toFixed(0) + '%' : '-') + '</td>'
      + '<td class="' + discClass + '">' + (disc !== null ? (disc >= 0 ? '+' : '') + (disc * 100).toFixed(0) + '%p' : '-') + '</td>'
      + '</tr>';
  });
  html += '</tbody></table>';

  // 연도별 상세 (사건 해 우선 표시, 그다음 전체 펼치기)
  html += '<h3 class="br-subheading">사건 연도 상세 신호</h3>';
  html += '<table class="br-table br-detail"><thead><tr>'
    + '<th>연도</th><th>세운</th><th>충</th><th>합</th><th>형</th><th>삼합</th><th>세운십성</th><th>신호수</th>'
    + '</tr></thead><tbody>';
  result.allYears.filter(y => y.isEventYear).forEach(y => {
    html += renderYearRow(y, true);
  });
  html += '</tbody></table>';

  html += '<details class="br-details-toggle"><summary>전체 ' + result.totalYears + '년 펼쳐보기</summary>';
  html += '<table class="br-table br-detail"><thead><tr>'
    + '<th>연도</th><th>세운</th><th>충</th><th>합</th><th>형</th><th>삼합</th><th>세운십성</th><th>신호수</th>'
    + '</tr></thead><tbody>';
  result.allYears.forEach(y => {
    html += renderYearRow(y, y.isEventYear);
  });
  html += '</tbody></table></details>';

  box.innerHTML = html;
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderYearRow(y, highlight) {
  const rowClass = y.isEventYear ? 'br-row-event' : '';
  return '<tr class="' + rowClass + '">'
    + '<td>' + y.year + (y.isEventYear ? ' ★' : '') + '</td>'
    + '<td>' + y.yeonju + '</td>'
    + '<td>' + (y.chungHits.length ? y.chungHits.join(', ') : '-') + '</td>'
    + '<td>' + (y.hapHits.length ? y.hapHits.join(', ') : '-') + '</td>'
    + '<td>' + (y.hyeongHits.length ? y.hyeongHits.join(', ') : '-') + '</td>'
    + '<td>' + (y.samhapHits.length ? y.samhapHits.join(', ') : '-') + '</td>'
    + '<td>' + (y.seunSipseong || '-') + '</td>'
    + '<td><strong>' + y.signalCount + '</strong></td>'
    + '</tr>';
}
