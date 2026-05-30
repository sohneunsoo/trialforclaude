// guestbook.js — Firebase Realtime Database comment board

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, push, onValue, query, limitToLast }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyAFZrQ5th07gI2CD5VuuGtV1xdZTBIJyF0",
  authDomain: "portfolio-room-2479a.firebaseapp.com",
  databaseURL: "https://portfolio-room-2479a-default-rtdb.firebaseio.com",
  projectId: "portfolio-room-2479a",
  storageBucket: "portfolio-room-2479a.firebasestorage.app",
  messagingSenderId: "809971088724",
  appId: "1:809971088724:web:7a22fd1823e7587822dcc1"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const commentsRef = query(ref(db, 'comments'), limitToLast(60));

const MAX_COMMENTS = 60;
const NOTE_COLORS  = [
  '#fffde0', '#ffd6d6', '#d6eeff', '#d6ffd9',
  '#f0d6ff', '#ffe8c4', '#d8f4ee', '#fff0d6'
];

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Live listener — re-renders whenever DB changes
let _unsubscribe = null;
function subscribeNotes() {
  if (_unsubscribe) return; // already listening
  _unsubscribe = onValue(commentsRef, snap => {
    const all = [];
    snap.forEach(child => all.push(child.val()));
    renderNotes(all.reverse()); // newest first
  });
}

function renderNotes(all) {
  const container = document.getElementById('gb-notes');
  if (!container) return;
  if (!all || !all.length) {
    container.innerHTML =
      '<div class="gb-empty">아직 아무도 없어요.<br>첫 번째가 되어보세요 ✏️</div>';
    return;
  }
  container.innerHTML = all.map((c, i) => {
    const col  = NOTE_COLORS[i % NOTE_COLORS.length];
    const rot  = ((i * 7 + 3) % 13) - 6;
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

  if (!overlay) return;

  msgInput.addEventListener('input', () => {
    countEl.textContent = msgInput.value.length;
    const pct = msgInput.value.length / 150;
    countEl.style.color = pct > 0.9 ? '#e05533' : pct > 0.7 ? '#c07020' : '#aaa';
  });

  submitBtn.addEventListener('click', handleSubmit);
  msgInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
  });

  async function handleSubmit() {
    const msg = msgInput.value.trim();
    if (!msg) { msgInput.focus(); return; }

    submitBtn.textContent = '저장 중…';
    submitBtn.disabled = true;

    try {
      await push(ref(db, 'comments'), {
        name: nameInput.value.trim().slice(0, 20) || '',
        msg:  msg.slice(0, 150),
        date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      });
      nameInput.value = '';
      msgInput.value  = '';
      countEl.textContent = '0';
      submitBtn.textContent = '✓ 남겼어요!';
      setTimeout(() => {
        submitBtn.textContent = '남기기 →';
        submitBtn.disabled = false;
      }, 1800);
    } catch (err) {
      console.error('guestbook write failed', err);
      submitBtn.textContent = '오류 — 다시 시도';
      submitBtn.disabled = false;
    }
  }

  closeBtn.addEventListener('click', closeGuestbook);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isGuestbookOpen()) closeGuestbook();
  });

  // Start live sync immediately so notes are ready when overlay opens
  subscribeNotes();
}

export function openGuestbook() {
  const overlay = document.getElementById('gb-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  subscribeNotes(); // ensure subscribed
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
