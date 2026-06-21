// ============================================================
//  main.js  ·  UI 이벤트 핸들러
// ============================================================

// ── 양력/음력 토글 시 라벨·윤달 체크박스 표시 처리 ──
function setupCalendarTypeToggle() {
  const radios = document.querySelectorAll('input[name="calendarType"]');
  const leapGroup = document.getElementById('leapMonthGroup');
  const yearLabel = document.getElementById('birthYearLabel');
  const monthLabel = document.getElementById('birthMonthLabel');
  const dayLabel = document.getElementById('birthDayLabel');
  const noticeBox = document.getElementById('convertedDateNotice');

  function update() {
    const type = document.querySelector('input[name="calendarType"]:checked')?.value || '양력';
    const isLunar = type === '음력';
    leapGroup.style.display = isLunar ? 'block' : 'none';
    yearLabel.textContent = isLunar ? '태어난 해 (음력)' : '태어난 해 (양력)';
    monthLabel.textContent = isLunar ? '태어난 월 (음력)' : '태어난 월';
    dayLabel.textContent = isLunar ? '태어난 일 (음력)' : '태어난 일';
    // 달력 종류가 바뀌면 이전 변환 안내는 초기화
    noticeBox.style.display = 'none';
    noticeBox.textContent = '';
  }

  radios.forEach(r => r.addEventListener('change', update));
  update();
}

// ── 음력 입력값을 양력으로 변환 (manseryeok.js 라이브러리 사용) ──
// 반환: { year, month, day, error } — error가 있으면 변환 실패
function convertLunarToSolar(year, month, day, isLeap) {
  const M = (typeof window !== 'undefined') ? window.ManseryeokJS : null;
  if (!M) {
    return { error: '음력 변환 라이브러리(manseryeok.js)를 불러오지 못했습니다. index.html의 script 태그 순서를 확인하세요.' };
  }
  try {
    const result = M.lunarToSolar(year, month, day, !!isLeap);
    return { year: result.solar.year, month: result.solar.month, day: result.solar.day };
  } catch (e) {
    // OutOfRangeError, InvalidDateError 등 — 메시지를 그대로 사용자에게 노출
    return { error: '음력 날짜 변환 실패: ' + (e && e.message ? e.message : '입력한 음력 날짜가 유효하지 않습니다 (지원범위 1900~2050년).') };
  }
}

function generatePrompt() {
  // ── 입력값 수집 ──
  const gender = document.querySelector('input[name="gender"]:checked')?.value || '남';
  const calendarType = document.querySelector('input[name="calendarType"]:checked')?.value || '양력';
  const isLeapMonth = document.getElementById('isLeapMonth').checked;

  const inputYear = parseInt(document.getElementById('birthYear').value);
  const inputMonth = parseInt(document.getElementById('birthMonth').value);
  const inputDay = parseInt(document.getElementById('birthDay').value);

  const hourStr = document.getElementById('birthHour').value;
  const currentYear = parseInt(document.getElementById('currentYear').value);
  const analysisRange = document.getElementById('analysisRange').value;

  const domains = Array.from(document.querySelectorAll('.domain-check:checked'))
    .map(el => el.value);
  const specialNote = document.getElementById('specialNote').value.trim();

  // ── 유효성 검사 (입력 단계, 달력 종류 무관) ──
  if (!inputYear || inputYear < 1900 || inputYear > 2050) {
    showToast('태어난 해를 1900~2050년 사이로 입력하세요.', true); return;
  }
  if (!inputMonth) {
    showToast('태어난 월을 선택하세요.', true); return;
  }
  if (!inputDay || inputDay < 1 || inputDay > 30) {
    showToast('태어난 일을 올바르게 입력하세요.', true); return;
  }
  if (domains.length === 0) {
    showToast('분석 영역을 최소 하나 이상 선택하세요.', true); return;
  }

  // ── 음력이면 양력으로 변환, 양력이면 그대로 사용 ──
  let year, month, day;
  let lunarInfo = null; // 프롬프트에 음력 원본 정보를 함께 기재하기 위함

  const noticeBox = document.getElementById('convertedDateNotice');
  noticeBox.style.display = 'none';
  noticeBox.textContent = '';

  if (calendarType === '음력') {
    const converted = convertLunarToSolar(inputYear, inputMonth, inputDay, isLeapMonth);
    if (converted.error) {
      showToast(converted.error, true);
      return;
    }
    year = converted.year;
    month = converted.month;
    day = converted.day;
    lunarInfo = {
      year: inputYear, month: inputMonth, day: inputDay, isLeapMonth
    };

    // 변환 결과를 화면에도 안내
    noticeBox.style.display = 'block';
    noticeBox.innerHTML = '<span style="color:#1a5c5c; font-size:0.82rem;">📅 음력 '
      + inputYear + '년 ' + inputMonth + '월 ' + inputDay + '일' + (isLeapMonth ? ' (윤달)' : '')
      + ' → 양력 ' + year + '년 ' + month + '월 ' + day + '일로 변환되었습니다.</span>';
  } else {
    year = inputYear;
    month = inputMonth;
    day = inputDay;
  }

  // 변환/직접입력된 양력 날짜의 최종 유효성 검사
  if (!year || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    showToast('변환된 날짜가 올바르지 않습니다. 입력을 다시 확인하세요.', true);
    return;
  }

  // ── 사주 계산 (분석 기간에 맞춰 세운 범위를 동적으로 산출) ──
  const rangeInfo = parseAnalysisRange(analysisRange, year, currentYear);
  let saju;
  try {
    saju = calcSaju(year, month, day, hourStr, gender, rangeInfo.seunStartYear, rangeInfo.seunCount);
  } catch (e) {
    showToast('사주 계산 중 오류가 발생했습니다.', true);
    console.error(e);
    return;
  }

  // ── 프롬프트 생성 ──
  const inputData = { year, month, day, hourStr, gender, currentYear, analysisRange, domains, specialNote, lunarInfo };
  const prompt = buildPrompt(saju, inputData);

  // ── 출력 ──
  const box = document.getElementById('outputBox');
  box.textContent = prompt;

  const copyBtn = document.getElementById('copyBtn');
  copyBtn.disabled = false;

  showToast('프롬프트가 생성되었습니다! 복사 후 Claude에 붙여넣으세요.');

  // 출력창으로 스크롤
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyPrompt() {
  const text = document.getElementById('outputBox').textContent;
  if (!text || text.trim() === '') return;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '복사 완료 ✓';
    setTimeout(() => { btn.textContent = '복사하기'; }, 2000);
    showToast('클립보드에 복사되었습니다. Claude에 붙여넣으세요!');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('복사되었습니다!');
  });
}

function showToast(msg, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = isError ? '#8b1a1a' : '#1a5c5c';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── 분석 요청 영역: 모두선택 / 모두해제 ──
function selectAllDomains(checked) {
  document.querySelectorAll('.domain-check').forEach(el => { el.checked = checked; });
}

// 초기화: 연도 기본값 설정 + 양력/음력 토글 핸들러 등록
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear').value = new Date().getFullYear();
  setupCalendarTypeToggle();
});
