// Local Storage Keys
const KEY_APPLICATIONS = 'pd.applications';
// item = {id, priestName, parishName, city, slug, description, avatarDataUrl, churchDataUrl, status, declineReason, createdAt}

const $ = (sel) => document.querySelector(sel);

// --- utils
function loadApps(){ try { return JSON.parse(localStorage.getItem(KEY_APPLICATIONS) || '[]'); } catch(e){ return []; } }
function saveApps(arr){ localStorage.setItem(KEY_APPLICATIONS, JSON.stringify(arr)); }
function setStatus(msg='', kind=''){ $('#status').innerHTML = msg ? `<span class="badge ${kind}">${msg}</span>` : ''; }

// --- RU->LAT + уникальный slug
function translit(str){
  const map={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  return (str||'').toLowerCase().replace(/[ъь]+/g,'').replace(/[а-яё]/g,ch=>map[ch]||ch).replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
}
function generateUniqueSlug(base){
  const apps = loadApps();
  let slug = translit(base) || 'prihod';
  let unique = slug, i = 2;
  while (apps.some(a => a.slug === unique && a.status !== 'declined')) unique = `${slug}-${i++}`;
  return unique;
}
function updateSlugPreview(){
  const name = $('#parishName').value.trim();
  const unique = generateUniqueSlug(name);
  const origin = location.origin + location.pathname.replace(/index\.html$/,'');
  $('#slugPreview').value = origin + 'parish.html?slug=' + unique;
  $('#slugPreview').dataset.slug = unique;
}

// --- Сжатие изображений (обход лимита localStorage)
function fileToCompressedDataURL(file, {maxSide=900, quality=0.82} = {}){
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality); // JPEG компактнее
        resolve({ dataUrl, width, height });
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function buildPreview(inputEl, previewElId){
  const file = inputEl.files?.[0];
  const box = $(previewElId);
  if (!file){ box.style.display='none'; box.innerHTML=''; delete box.dataset.dataurl; return; }
  setStatus('Обрабатываю фото…','pending');
  try{
    const { dataUrl, width, height } = await fileToCompressedDataURL(file, {maxSide: 900, quality: 0.82});
    const kb = Math.round((dataUrl.length * 3 / 4) / 1024);
    box.style.display='flex';
    box.innerHTML = `<img src="${dataUrl}"/><div><b>Файл:</b> ${file.name}<br/><small>Сжато до ${width}×${height}, ~${kb} KB</small></div>`;
    box.dataset.dataurl = dataUrl;
  }catch(e){
    console.error(e);
    setStatus('Не удалось обработать изображение.', 'declined');
    return;
  }finally{
    setStatus('');
  }
}

// --- валидация
const REQUIRED = [
  {sel:'#priestName', label:'Имя батюшки'},
  {sel:'#parishName', label:'Название прихода'},
  {sel:'#city',       label:'Населённый пункт'},
  {sel:'#description',label:'Описание храма'}
];
function validateForm(){
  const empty = REQUIRED.filter(f => !$(f.sel).value.trim());
  return empty.length ? {ok:false, msg:'Заполните: ' + empty.map(f=>f.label).join(', ')} : {ok:true};
}

// --- отправка
async function onSubmit(){
  const v = validateForm();
  if (!v.ok){ setStatus(v.msg, 'declined'); return; }

  const apps = loadApps();
  const slug = $('#slugPreview').dataset.slug || generateUniqueSlug($('#parishName').value.trim());
  if (apps.some(a => a.slug === slug && a.status !== 'declined')){
    setStatus('Адрес уже занят. Измените название прихода.', 'declined'); return;
  }

  const item = {
    id: crypto.randomUUID(),
    priestName: $('#priestName').value.trim(),
    parishName: $('#parishName').value.trim(),
    city: $('#city').value.trim(),
    slug,
    description: $('#description').value.trim(),
    avatarDataUrl: $('#avatarPreview').dataset.dataurl || '',
    churchDataUrl: $('#churchPreview').dataset.dataurl || '',
    status: 'pending',
    declineReason: '',
    createdAt: new Date().toISOString()
  };

  try{
    apps.push(item);
    saveApps(apps);
    setStatus('Заявка отправлена на модерацию', 'pending');
    setTimeout(()=> location.href='admin.html', 700);
  }catch(e){
    console.error(e);
    setStatus('Фото слишком большие для браузерного хранилища. Попробуйте другие или меньше.', 'declined');
  }
}

// --- reset
function onReset(){
  REQUIRED.forEach(f => $(f.sel).value='');
  ['#avatarPreview','#churchPreview'].forEach(id=>{ const b=$(id); b.style.display='none'; b.innerHTML=''; delete b.dataset.dataurl; });
  updateSlugPreview(); setStatus('');
}

// --- init
document.addEventListener('DOMContentLoaded',()=>{
  $('#parishName').addEventListener('input', updateSlugPreview); updateSlugPreview();
  REQUIRED.forEach(f => $(f.sel).addEventListener('input', ()=> setStatus(''))); // ошибка снимается при вводе
  $('#avatar').addEventListener('change', e=>buildPreview(e.target, '#avatarPreview'));
  $('#churchPhoto').addEventListener('change', e=>buildPreview(e.target, '#churchPreview'));
  $('#submitBtn').addEventListener('click', onSubmit);
  $('#resetBtn').addEventListener('click', onReset);
  // метка версии, чтобы видеть, что новый файл точно подхватился
  console.log('Priest Dashboard app.v2.js loaded');
});
