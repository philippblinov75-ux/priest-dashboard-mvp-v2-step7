// Local Storage Keys
const KEY_APPLICATIONS = 'pd.applications'; // array of items
// item = {id, priestName, parishName, city, slug, description, avatarDataUrl, churchDataUrl, status, declineReason, createdAt}

const $ = (sel) => document.querySelector(sel);

function loadApps(){
  try { return JSON.parse(localStorage.getItem(KEY_APPLICATIONS) || '[]'); }
  catch(e){ return []; }
}
function saveApps(arr){ localStorage.setItem(KEY_APPLICATIONS, JSON.stringify(arr)); }

function dataURLFromFile(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showImagePreview(inputEl, previewElId){
  const file = inputEl.files?.[0];
  const box = $(previewElId);
  if (!file){
    box.style.display='none';
    box.innerHTML='';
    return;
  }
  dataURLFromFile(file).then(url=>{
    box.style.display='flex';
    box.innerHTML = `<img src="${url}"/><div><b>Файл:</b> ${file.name}<br/><small>${Math.round(file.size/1024)} KB</small></div>`;
    box.dataset.dataurl = url;
  });
}

function validateForm(){
  const required = ['#priestName','#parishName','#city','#slug','#description'];
  for (const sel of required){
    const v = $(sel).value.trim();
    if (!v) return {ok:false,msg:'Заполните все поля.'};
  }
  const slug = $('#slug').value.trim();
  if (!/^[a-z0-9\-]+$/.test(slug)) return {ok:false,msg:'Slug должен содержать латиницу, цифры и дефисы.'};
  return {ok:true};
}

async function onSubmit(){
  const v = validateForm();
  const statusEl = $('#status');
  if (!v.ok){
    statusEl.innerHTML = `<span class="badge declined">Ошибка: ${v.msg}</span>`;
    return;
  }
  const apps = loadApps();
  const slug = $('#slug').value.trim().toLowerCase();
  if (apps.some(a=>a.slug===slug && a.status!=='declined')){
    statusEl.innerHTML = `<span class="badge declined">Заявка с таким slug уже существует.</span>`;
    return;
  }

  const avatarDataUrl = $('#avatarPreview').dataset.dataurl || '';
  const churchDataUrl = $('#churchPreview').dataset.dataurl || '';

  const item = {
    id: crypto.randomUUID(),
    priestName: $('#priestName').value.trim(),
    parishName: $('#parishName').value.trim(),
    city: $('#city').value.trim(),
    slug,
    description: $('#description').value.trim(),
    avatarDataUrl,
    churchDataUrl,
    status: 'pending',
    declineReason: '',
    createdAt: new Date().toISOString()
  };
  apps.push(item);
  saveApps(apps);

  statusEl.innerHTML = `<span class="badge pending">Заявка отправлена на модерацию</span>`;
  setTimeout(()=>{
    window.location.href = 'admin.html';
  }, 900);
}

function onReset(){
  ['#priestName','#parishName','#city','#slug','#description'].forEach(sel=>$(sel).value='');
  ['#avatarPreview','#churchPreview'].forEach(id=>{
    const box = $(id);
    box.style.display='none'; box.innerHTML=''; delete box.dataset.dataurl;
  });
  $('#status').innerHTML = '';
}

document.addEventListener('DOMContentLoaded',()=>{
  $('#avatar').addEventListener('change', e=>showImagePreview(e.target, '#avatarPreview'));
  $('#churchPhoto').addEventListener('change', e=>showImagePreview(e.target, '#churchPreview'));
  $('#submitBtn').addEventListener('click', onSubmit);
  $('#resetBtn').addEventListener('click', onReset);
});
