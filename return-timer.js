// Auto-return to portfolio room after 2 minutes of inactivity
(function () {
  const TIMEOUT = 2 * 60 * 1000;
  const RETURN_URL = './index.html';
  const WARN_BEFORE = 15 * 1000; // show warning 15s before redirect

  let timer, warnTimer;
  let banner = null;

  function createBanner() {
    banner = document.createElement('div');
    banner.style.cssText = `
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
      background:#0d0d0d; color:#fff;
      font-family:ui-monospace,"SF Mono",Menlo,monospace;
      font-size:13px; letter-spacing:0.12em;
      padding:14px 24px; border-radius:999px;
      box-shadow:0 8px 32px rgba(0,0,0,0.35);
      z-index:9999; display:none;
      align-items:center; gap:14px;
      white-space:nowrap;
    `;
    banner.innerHTML = `
      <span id="_rt_msg">15초 후 포트폴리오로 돌아갑니다</span>
      <button onclick="(function(){clearTimeout(window._rt_t);clearTimeout(window._rt_w);document.getElementById('_rt_banner').style.display='none';window._rt_reset();})()"
        style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);
               color:#fff;border-radius:999px;padding:5px 14px;cursor:pointer;
               font-size:12px;letter-spacing:0.1em;">
        머무르기
      </button>
    `;
    banner.id = '_rt_banner';
    document.body.appendChild(banner);
  }

  function showWarning(secsLeft) {
    if (!banner) createBanner();
    banner.style.display = 'flex';
    const msg = document.getElementById('_rt_msg');
    let s = secsLeft;
    if (msg) msg.textContent = s + '초 후 포트폴리오로 돌아갑니다';
    const tick = setInterval(() => {
      s--;
      if (msg) msg.textContent = s + '초 후 포트폴리오로 돌아갑니다';
      if (s <= 0) clearInterval(tick);
    }, 1000);
  }

  function reset() {
    clearTimeout(timer);
    clearTimeout(warnTimer);
    if (banner) banner.style.display = 'none';

    warnTimer = setTimeout(() => {
      showWarning(Math.round(WARN_BEFORE / 1000));
    }, TIMEOUT - WARN_BEFORE);

    timer = setTimeout(() => {
      window.location.href = RETURN_URL;
    }, TIMEOUT);
  }

  window._rt_reset = reset;
  window._rt_t = timer;
  window._rt_w = warnTimer;

  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(ev => {
    document.addEventListener(ev, reset, { passive: true });
  });

  // start on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reset);
  } else {
    reset();
  }
})();
