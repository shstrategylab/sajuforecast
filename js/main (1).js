// ============================================================
//  main.js  ·  UI 이벤트 핸들러
// ============================================================

function generatePrompt() {
  // ── 입력값 수집 ──
  const gender = document.querySelector('input[name="gender"]:checked')?.value || '남';
  const year = parseInt(document.getElementById('birthYear').value);
  const month = parseInt(document.getElementById('birthMonth').value);
  const day = parseInt(document.getElementById('birthDay').value);
  const hourStr = document.getElementById('birthHour').value;
  const currentYear = parseInt(document.getElementById('currentYear').value);
  const analysisRange = document.getElementById('analysisRange').value;

  const domains = Array.from(document.querySelectorAll('.domain-check:checked'))
    .map(el => el.value);
  const specialNote = document.getElementById('specialNote').value.trim();

  // ── 유효성 검사 ──
  if (!year || year < 1900 || year > 2100) {
    showToast('태어난 해를 올바르게 입력하세요.', true); return;
  }
  if (!month) {
    showToast('태어난 월을 선택하세요.', true); return;
  }
  if (!day || day < 1 || day > 31) {
    showToast('태어난 일을 올바르게 입력하세요.', true); return;
  }
  if (domains.length === 0) {
    showToast('분석 영역을 최소 하나 이상 선택하세요.', true); return;
  }

  // ── 사주 계산 ──
  let saju;
  try {
    saju = calcSaju(year, month, day, hourStr, gender);
  } catch (e) {
    showToast('사주 계산 중 오류가 발생했습니다.', true);
    console.error(e);
    return;
  }

  // ── 프롬프트 생성 ──
  const inputData = { year, month, day, hourStr, gender, currentYear, analysisRange, domains, specialNote };
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

// 연도 기본값 설정
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear').value = new Date().getFullYear();
});
