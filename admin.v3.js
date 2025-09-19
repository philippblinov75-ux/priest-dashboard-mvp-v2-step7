// admin.v3.js — UX-поведение вкладок
const KEY='pd.applications';
const $=(s)=>document.querySelector(s);

function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch(e){ return []; } }
function save(a){ localStorage.setItem(KEY, JSON.stringify(a)); }

function activeTab(){
  return document.querySelector('#tabs .ghost.active')?.dataset.tab || 'pending';
}

function setActiveTab(tab){
  document.querySelectorAll('#tabs .ghost').forEach(b=>b.classList.remove('active'));
  document.querySelector(`#tabs .ghost[data-tab="${tab}"]`)?.classList.add('active');
}

function card(app, tab){
  const badge = app.status==='pending' ? 'pending' : app.status==='approved' ? 'approved' : 'declined';

  // Кнопки по вкладкам:
  let actions = '';
  if (tab === 'pending'){
    actions = `
      <button class="ok" data-action="approve" data-id="${app.id}">Approve</button>
      <button class="bad" data-action="decline" data-id="${app.id}">Decline</button>
    `;
  } else if (tab === 'declined'){
    actions = `<button class="ok" data-action="approve" data-id="${app.id}">Approve</button>`;
  } // на вкладке approved — только ссылка, без кнопок

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
      <hr/>
      <div class="flex">
        ${actions}
        <a href="parish.html?slug=${encodeURIComponent(app.slug)}" target="_blank">
          <button class="ghost">Открыть публичную страницу</button>
        </a>
      </div>
    </div>
  `;
}

function render(tab = activeTab()){
  const apps=load();
  const filtered=apps.filter(a=>a.status===tab);
  document.getElementById('list').innerHTML = filtered.length ? filtered.map(a=>card(a, tab)).join('') : '<small>Нет записей</small>';
}

function onClick(e){
  const t=e.target;

  // Переключение вкладок
  if (t.matches('#tabs button')){
    setActiveTab(t.dataset.tab);
    render(t.dataset.tab);
    return;
  }

  // Действия над карточками
  if (!t.dataset.action) return;

  const id=t.dataset.id;
  const apps=load();
  const i=apps.findIndex(a=>a.id===id);
  if (i===-1) return;

  const tab = activeTab();

  if (t.dataset.action==='approve'){
    apps[i].status='approved'; apps[i].declineReason='';
    save(apps);
    // после approve сразу показываем вкладку Approved
    setActiveTab('approved'); render('approved');
    return;
  }

  if (t.dataset.action==='decline'){
    const reason = prompt('Причина отклонения? (необязательно)','') || '';
    apps[i].status='declined'; apps[i].declineReason = reason;
    save(apps);
    // после decline показываем Declined
    setActiveTab('declined'); render('declined');
    return;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  setActiveTab('pending');
  render('pending');
  document.body.addEventListener('click', onClick);
  console.log('admin.v3.js loaded (tabs UX)');
});
