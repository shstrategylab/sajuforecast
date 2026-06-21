/**
 * tabs.js — 탭 전환 로직
 * 탭 버튼 클릭 시 해당 패널을 표시하고 나머지를 숨깁니다.
 */

(function () {
  'use strict';

  /**
   * 탭을 초기화합니다.
   * DOM이 로드된 후 호출됩니다.
   */
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels  = document.querySelectorAll('.tab-panel');

    if (!tabButtons.length || !tabPanels.length) return;

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = btn.dataset.tab;

        // 버튼 활성화 상태 갱신
        tabButtons.forEach(function (b) {
          b.classList.toggle('active', b.dataset.tab === target);
          b.setAttribute('aria-selected', b.dataset.tab === target ? 'true' : 'false');
        });

        // 패널 표시/숨김 갱신
        // class·aria-hidden뿐 아니라 인라인 style.display로도 직접 제어한다.
        // (style.css에 [aria-hidden="true"]/.active 대응 규칙이 없어도
        //  탭 전환이 항상 동작하도록 하기 위함)
        tabPanels.forEach(function (panel) {
          const isActive = panel.dataset.panel === target;
          panel.classList.toggle('active', isActive);
          panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
          panel.style.display = isActive ? '' : 'none';
        });
      });
    });

    // 초기 활성 탭 설정 (URL 해시 또는 첫 번째 탭)
    const hash = location.hash.replace('#', '');
    const initialTab = hash && document.querySelector('[data-tab="' + hash + '"]')
      ? hash
      : tabButtons[0].dataset.tab;

    const initialBtn = document.querySelector('[data-tab="' + initialTab + '"]');
    if (initialBtn) initialBtn.click();
  }

  // DOM 준비 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
  } else {
    initTabs();
  }
})();
