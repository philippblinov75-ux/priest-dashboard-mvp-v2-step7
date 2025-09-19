// parish.v3.js — публичная страница + копирование ссылки + заметный тост
const KEY = 'pd.applications';
const $   = (s) => document.querySelector(s);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function card(app) {
  return `
    <div class="card">
      <div class="flex" style="justify-content:space-between">
        <div class="flex">
          ${app.avatarDataUrl
            ? '<img src="'+app.avatarDataUrl+'" style="width:72px;height:72px;border-radius:12px;object-fit:cover;margin-right:14px"/>'
            : ''
          }
          <div>
            <div style="font-size:20px;font-weight:700">${app.parishName}</div>
            <div><small>${app.priestName} — ${app.city}</small></div>
          </div>
        </div>
        ${app.churchDataUrl
          ? '<img src="'+app.churchDataUrl+'" style="width:160px;height:96px;border-radius:12px;object-fit:cover;margin-left:14px"/>'
          : ''
        }
      </div>
      <hr/>
      <div>${(app.description || '').replace(/\n/g,'<br/>')}</div>
    </div>
  `;
}

// Заметный тост вверху экрана
function showToast(msg, type='ok') {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = (type === 'ok') ? '#22c55e' : '#ef4444';
  // анимация «въезда»
  t.style.opacity   = '1';
  t.style.transform = 'translate(-50%, 0)';
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => {
    // анимация «уезда»
    t.style.opacity   = '0';
    t.style.transform = 'translate(-50%, -16px)';
  }, 1600);
}

function init() {
  console.log('parish.v3.js loaded');
  // копирование ссылки
  const copyBtn = $('#copyLink');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        showToast('Ссылка скопирована', 'ok');
      } catch {
        showToast('Не удалось скопировать', 'err');
      }
    });
  }

  // рендер прихода
  const params = new URLSearchParams(location.search);
  const slug   = params.get('slug');
  const apps   = load();

  if (!slug) {
    $('#title').textContent = 'Нет параметра slug';
    $('#content').innerHTML = '<small>Откройте страницу из админки или добавьте ?slug=...</small>';
    return;
  }
  const app = apps.find(a => a.slug === slug && a.status === 'approved');
  if (!app) {
    $('#title').textContent = 'Приход не найден или не одобрен';
    $('#content').innerHTML = '<small>Искомый slug: <b>' + slug + '</b>.</small>';
    return;
  }
  document.title = app.parishName + ' — Priest Dashboard';
  $('#title').textContent = app.parishName;
  $('#content').innerHTML = card(app);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
