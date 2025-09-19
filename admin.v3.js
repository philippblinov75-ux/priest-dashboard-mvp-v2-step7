// admin.v3.js
const KEY='pd.applications';
const $=(s)=>document.querySelector(s);

function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch(e){ return []; } }
function save(a){ localStorage.setItem(KEY, JSON.stringify(a)); }

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
  const apps=load();
  const filtered=apps.filter(a=>a.status===tab);
  $('#list').innerHTML = filtered.length ? filtered.map(card).join('') : '<small>Нет записей</small>';
  console.log('admin.v3.js: apps=', apps.length, 'tab=', tab);
}

function onClick(e){
  const t=e.target;
  if (t.matches('#tabs button')){
    $('#tabs .ghost.active')?.classList.remove('active');
    t.classList.add('active'); render(t.dataset.tab); return;
  }
  if (!t.dataset.action) return;
  const id=t.dataset.id; const apps=load(); const i=apps.findIndex(a=>a.id===id);
  if (i===-1) return;
  if (t.dataset.action==='approve'){ apps[i].status='approved'; apps[i].declineReason=''; }
  else if (t.dataset.action==='decline'){ apps[i].status='declined'; apps[i].declineReason=prompt('Причина отклонения? (необязательно)','')||''; }
  save(apps); render($('#tabs .ghost.active')?.dataset.tab || 'pending');
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelector('#tabs button[data-tab="pending"]').classList.add('active');
  render('pending'); document.body.addEventListener('click', onClick);
  console.log('admin.v3.js loaded');
});
