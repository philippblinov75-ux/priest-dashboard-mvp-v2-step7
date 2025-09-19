// Priest Dashboard — внешняя версия (без inline)
// Ключ в LocalStorage
const KEY = 'pd.applications';
const $ = s => document.querySelector(s);

// ==== utils ====
function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch(e){ return []; } }
function save(a){ localStorage.setItem(KEY, JSON.stringify(a)); }
function setStatus(msg='',kind=''){ const box=$('#status'); box.innerHTML = msg ? `<span class="badge ${kind}">${msg}</span>` : ''; }

// ==== slug ====
function translit(str){
  const m={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  return (str||'').toLowerCase().replace(/[ъь]+/g,'').replace(/[а-яё]/g,c=>m[c]||c).replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
}
function uniqueSlug(base){
  const apps=load(); let slug=translit(base)||'prihod', u=slug, i=2;
  while(apps.some(a=>a.slug===u && a.status!=='declined')) u=`${slug}-${i++}`;
  return u;
}
function baseUrl(){
  let href = location.href.split('?')[0];
  if(href.endsWith('index.html')) href = href.slice(0,-'index.html'.length);
  if(!href.endsWith('/')) href += '/';
  return href;
}
function updateSlug(){
  const name=$('#parishName').value.trim();
  const slug=uniqueSlug(name);
  $('#slugPreview').value = baseUrl() + 'parish.html?slug=' + slug;
  $('#slugPreview').dataset.slug = slug;
}

// ==== image compress ====
function fileToCompressedDataURL(file,{maxSide=900,quality=0.82}={}){
  return new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onload=()=>{ const img=new Image();
      img.onload=()=>{ const c=document.createElement('canvas');
        let {width,height}=img; const s=Math.min(1,maxSide/Math.max(width,height));
        width=Math.round(width*s); height=Math.round(height*s);
        c.width=width; c.height=height; const ctx=c.getContext('2d');
        ctx.drawImage(img,0,0,width,height);
        resolve({ dataUrl:c.toDataURL('image/jpeg',quality), width, height });
      };
      img.onerror=reject; img.src=fr.result;
    };
    fr.onerror=reject; fr.readAsDataURL(file);
  });
}
async function buildPreview(inputEl, boxSel){
  const f=inputEl.files?.[0], box=$(boxSel);
  if(!f){ box.style.display='none'; box.innerHTML=''; delete box.dataset.dataurl; return; }
  setStatus('Обрабатываю фото…','pending');
  try{
    const {dataUrl,width,height}=await fileToCompressedDataURL(f,{maxSide:900,quality:0.82});
    const kb=Math.round((dataUrl.length*3/4)/1024);
    box.style.display='flex';
    box.innerHTML=`<img src="${dataUrl}"/><div><b>Файл:</b> ${f.name}<br/><small>Сжато до ${width}×${height}, ~${kb} KB</small></div>`;
    box.dataset.dataurl=dataUrl;
  }catch(e){ console.error(e); setStatus('Не удалось обработать изображение.','declined'); }
  finally{ setStatus(''); }
}

// ==== validation ====
const REQUIRED=[
  {sel:'#priestName',label:'Имя батюшки'},
  {sel:'#parishName',label:'Название прихода'},
  {sel:'#city',label:'Населённый пункт'},
  {sel:'#description',label:'Описание храма'}
];
function validate(){
  const empty=REQUIRED.filter(f=>!$(f.sel).value.trim());
  return empty.length ? {ok:false,msg:'Заполните: '+empty.map(f=>f.label).join(', ')} : {ok:true};
}

// ==== submit/reset ====
async function submit(){
  const v=validate(); if(!v.ok){ setStatus(v.msg,'declined'); return; }
  const apps=load();
  const slug=$('#slugPreview').dataset.slug || uniqueSlug($('#parishName').value.trim());
  if(apps.some(a=>a.slug===slug && a.status!=='declined')){ setStatus('Адрес уже занят. Измените название прихода.','declined'); return; }
  const item={
    id:crypto.randomUUID(),
    priestName:$('#priestName').value.trim(),
    parishName:$('#parishName').value.trim(),
    city:$('#city').value.trim(),
    slug,
    description:$('#description').value.trim(),
    avatarDataUrl:$('#avatarPreview').dataset.dataurl || '',
    churchDataUrl:$('#churchPreview').dataset.dataurl || '',
    status:'pending', declineReason:'', createdAt:new Date().toISOString()
  };
  try{
    apps.push(item); save(apps);
    setStatus('Заявка отправлена на модерацию','pending');
    setTimeout(()=>location.href='admin.html',700);
  }catch(e){
    console.error(e); setStatus('Фото слишком большие или хранилище переполнено.','declined');
  }
}
function resetForm(){
  REQUIRED.forEach(f=>$(f.sel).value='');
  ['#avatarPreview','#churchPreview'].forEach(id=>{ const b=$(id); b.style.display='none'; b.innerHTML=''; delete b.dataset.dataurl; });
  updateSlug(); setStatus('');
}

// ==== init ====
document.addEventListener('DOMContentLoaded',()=>{
  console.log('app.v3.js loaded');
  $('#parishName').addEventListener('input', updateSlug); updateSlug();
  REQUIRED.forEach(f=>$(f.sel).addEventListener('input',()=>setStatus('')));
  $('#avatar').addEventListener('change', e=>buildPreview(e.target,'#avatarPreview'));
  $('#churchPhoto').addEventListener('change', e=>buildPreview(e.target,'#churchPreview'));
  $('#submitBtn').addEventListener('click', submit);
  $('#resetBtn').addEventListener('click', resetForm);
});
