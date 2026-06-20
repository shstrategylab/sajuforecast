// ============================================================
//  tabs.js · 프롬프트 생성기 / 베이스레이트 검증기 탭 전환
// ============================================================

const TAB_CONFIG = {
  prompt: {
    title: '사주 예측 프롬프트 생성기',
    sub: '생년월일시를 입력하면 Claude용 정밀 분석 프롬프트가 자동 생성됩니다'
  },
  baserate: {
    title: '베이스레이트 검증기',
    sub: '합·충·형·삼합 신호가 실제 사건을 변별하는지 숫자로 확인합니다'
  }
};

function switchTab(tab) {
  const promptPanel = document.getElementById('tabPrompt');
  const baseratePanel = document.getElementById('tabBaserate');
  const btnPrompt = document.getElementById('tabBtnPrompt');
  const btnBaserate = document.getElementById('tabBtnBaserate');

  if (tab === 'prompt') {
    promptPanel.style.display = '';
    baseratePanel.style.display = 'none';
    btnPrompt.classList.add('active');
    btnBaserate.classList.remove('active');
  } else {
    promptPanel.style.display = 'none';
    baseratePanel.style.display = '';
    btnPrompt.classList.remove('active');
    btnBaserate.classList.add('active');
  }

  const cfg = TAB_CONFIG[tab];
  document.getElementById('pageTitle').textContent = cfg.title;
  document.getElementById('pageSub').textContent = cfg.sub;
}

document.addEventListener('DOMContentLoaded', () => {
  const endYearInput = document.getElementById('brEndYear');
  if (endYearInput && !endYearInput.value) {
    endYearInput.value = new Date().getFullYear();
  }
});
