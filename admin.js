---
---
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Priest Dashboard — Модерация</title>
  <link rel="stylesheet" href="style.css?v={{ site.time | date: '%s' }}" />
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Панель модератора</h1>
      <a href="index.html"><button class="ghost">← К регистрации</button></a>
    </div>

    <div class="card">
      <div id="tabs" class="flex">
        <button class="ghost" data-tab="pending">Pending</button>
        <button class="ghost" data-tab="approved">Approved</button>
        <button class="ghost" data-tab="declined">Declined</button>
      </div>
      <hr/>
      <div id="list" class="grid"></div>
      <div id="debug" style="margin-top:8px"><small></small></div>
    </div>
  </div>

  <!-- ВСТРОЕННЫЙ JS, чтобы ничего не кэшировалось -->
  <script>
    const KEY='pd.applications';
    const $ = (s)=>document.querySelector(s);
    const listEl = $('#list');

    function loadApps(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch(e){ return []; } }
    function saveApps(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

    function card(app){
      const badge = app.status==='pending' ? 'pending' : app.status==='approved' ? 'approved' : 'declined';
      const declineBlock = app.status==='declined' && app.declineReason ? `<div><small>Причина отклонения: ${app.declineReason}</small></div>` : '';
      return `
        <div class="card">
          <div class="flex" style="justify-content:space-between">
            <div class="flex">
              ${app.avatarDataUrl ? `<img src="${app.avatarDataUrl}" style="width:64px;height:64px;border-radius:12px;object-fit:cover"/>` : ''}
              <div>
                <div><b>${app.parishName}</b> · <span class="badge ${badge}">${app.status}</span></div>
                <div><small>${app.priestName} — ${app.city}</small></div>
                <div><small>slug: ${app.slug}</small></div>
              </div>
            </div>
            ${app.churchDataUrl ? `<img src="${app.churchDataUrl}" style="width:96px;height:64px;border-radius:12px;object-fit:cover"/>` : ''}
          </div>
          <hr/>
          <div>${(app.description||'').replace(/\n/g,'<br/>')}</div>
          ${declineBlock}
          <hr/>
          <div class="flex">
            <button class="ok" data-action="approve" data-id="${app.id}">Approve</button>
            <button class="bad" data-action="decline" data-id="${app.id}">Decline</button>
            <a href="parish.html?slug=${encodeURIComponent(app.slug)}" target="_blank">
              <button class="ghost">Открыть публичную страницу</button>
            </a>
          </div>
        </div>
      `;
    }

    function render(tab='pending'){
      const apps = loadApps();
      const filtered = apps.filter(a=>a.status===tab);
      listEl.innerHTML = filtered.length ? filtered.map(card).join('') : '<small>Нет записей</small>';
      // маленький дебаг, чтобы сразу видно было, что всё работает
      $('#debug small').textContent = `Всего записей в хранилище: ${apps.length}. Вкладка: ${tab}.`;
    }

    function handleClick(e){
      const t = e.target;
      if (t.matches('#tabs button')){
        $('#tabs .ghost.active')?.classList.remove('active');
        t.classList.add('active');
        render(t.dataset.tab);
        return;
      }
      if (!t.dataset.action) return;
      const id = t.dataset.id;
      const apps = loadApps();
      const idx = apps.findIndex(a=>a.id===id);
      if (idx===-1) return;

      if (t.dataset.action==='approve'){
        apps[idx].status='approved'; apps[idx].declineReason='';
      } else if (t.dataset.action==='decline'){
        const reason = prompt('Причина отклонения? (необязательно)','');
        apps[idx].status='declined'; apps[idx].declineReason = reason || '';
      }
      saveApps(apps);
      render($('.ghost.active')?.dataset.tab || 'pending');
    }

    document.addEventListener('DOMContentLoaded',()=>{
      document.querySelector('#tabs button[data-tab="pending"]').classList.add('active');
      render('pending');
      document.body.addEventListener('click', handleClick);
      console.log('inline admin.js loaded');
    });
  </script>
</body>
</html>
