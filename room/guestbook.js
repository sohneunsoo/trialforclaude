// guestbook.js — localStorage-based comment board for the portfolio room

const STORAGE_KEY  = 'portfolio_guestbook_v1';
const MAX_COMMENTS = 60;
const NOTE_COLORS  = [
  '#fffde0', '#ffd6d6', '#d6eeff', '#d6ffd9',
  '#f0d6ff', '#ffe8c4', '#d8f4ee', '#fff0d6'
];

function getComments() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveComments(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-MAX_COMMENTS)));
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderNotes() {
  const container = document.getElementById('gb-notes');
  if (!container) return;
  const all = getComments().slice().reverse(); // newest first
  if (!all.length) {
    container.innerHTML =
      '<div class="gb-empty">아직 아무도 없어요.<br>첫 번째가 되어보세요 ✏️</div>';
    return;
  }
  container.innerHTML = all.map((c, i) => {
    const col  = NOTE_COLORS[i % NOTE_COLORS.length];
    const rot  = ((i * 7 + 3) % 13) - 6; // deterministic slight tilt
    const namePart = c.name
      ? `<span class="gn-name">${escHtml(c.name)}</span> · `
      : '';
    return `<div class="gb-note" style="background:${col};transform:rotate(${rot}deg)">
      <div class="gn-msg">${escHtml(c.msg)}</div>
      <div class="gn-meta">${namePart}${escHtml(c.date)}</div>
    </div>`;
  }).join('');
}

export function initGuestbook() {
  const overlay   = document.getElementById('gb-overlay');
  const closeBtn  = document.getElementById('gb-close');
  const nameInput = document.getElementById('gb-name');
  const msgInput  = document.getElementById('gb-msg');
  const countEl   = document.getElementById('gb-count');
  const submitBtn = document.getElementById('gb-submit');

  if (!overlay) return; // guard if HTML not yet in place

  msgInput.addEventListener('input', () => {
    countEl.textContent = msgInput.value.length;
    const pct = msgInput.value.length / 150;
    countEl.style.color = pct > 0.9 ? '#e05533' : pct > 0.7 ? '#c07020' : '#aaa';
  });

  submitBtn.addEventListener('click', handleSubmit);
  msgInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
  });

  function handleSubmit() {
    const msg = msgInput.value.trim();
    if (!msg) { msgInput.focus(); return; }
    const comments = getComments();
    comments.push({
      name: nameInput.value.trim().slice(0, 20) || '',
      msg:  msg.slice(0, 150),
      date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    });
    saveComments(comments);
    nameInput.value = '';
    msgInput.value  = '';
    countEl.textContent = '0';
    renderNotes();
    // brief "posted" feedback
    submitBtn.textContent = '✓ 남겼어요!';
    submitBtn.disabled = true;
    setTimeout(() => {
      submitBtn.textContent = '남기기 →';
      submitBtn.disabled = false;
    }, 1800);
  }

  closeBtn.addEventListener('click', closeGuestbook);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isGuestbookOpen()) closeGuestbook();
  });
}

export function openGuestbook() {
  const overlay = document.getElementById('gb-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  renderNotes();
  // slight delay then focus textarea so visitor can type immediately
  setTimeout(() => {
    const ta = document.getElementById('gb-msg');
    if (ta) ta.focus();
  }, 500);
}

export function closeGuestbook() {
  const overlay = document.getElementById('gb-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

export function isGuestbookOpen() {
  const overlay = document.getElementById('gb-overlay');
  return !!(overlay && overlay.classList.contains('open'));
}
