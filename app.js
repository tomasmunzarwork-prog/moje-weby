'use strict';

const fleet = {
  '5': {type:'SKŘÍŇ / VALNÍK S PLACHTOU',title:'KDYŽ STAČÍ\nMENŠÍ VŮZ.',description:'Pro menší dodávky a paletové zboží. Možnost hydraulického čela pro snadnější manipulaci s nákladem.',pallets:'až 18 palet',length:'do 7,2 m',size:'2,48 × 2,4 m'},
  '8': {type:'SKŘÍŇ / VALNÍK S PLACHTOU',title:'VÍCE PROSTORU.\nVÍCE MOŽNOSTÍ.',description:'Pro těžší paletové zásilky, materiál i strojní zařízení. Skříňová nástavba nebo valník s plachtou podle typu nákladu.',pallets:'až 18 palet',length:'do 7,2 m',size:'2,48 × 2,8 m'},
  '14': {type:'SOUPRAVA / VALNÍK S PLACHTOU',title:'PRO VĚTŠÍ\nOBJEM NÁKLADU.',description:'Souprava s přívěsem pro objemnější zásilky. Dvě ložné plochy a kapacita až 36 paletových míst.',pallets:'až 36 palet',length:'do 7,2 + 7,2 m',size:'2,48 × 2,8 m'},
  '24': {type:'NÁVĚS / VALNÍK S PLACHTOU',title:'CELÝ NÁVĚS.\nJEDEN PARTNER.',description:'Pro kompletní náklady do 24 tun. Ložná délka až 13,6 metru pro paletové zboží, materiál a další zásilky.',pallets:'až 33 palet',length:'do 13,6 m',size:'2,48 × 2,8 m'}
};
let selectedTonnage = '5';
const tabs = [...document.querySelectorAll('[data-tonnage]')];
const form = document.querySelector('#quote-form');
const services = ['Vnitrostátní autodoprava','Spediční služby','Stěhování'];

function selectVehicle(tonnage, focus = false) {
  const item = fleet[tonnage];
  if (!item) throw new Error('Vyberte hmotnost 5, 8, 14 nebo 24 tun.');
  selectedTonnage = tonnage;
  tabs.forEach(tab => {
    const selected = tab.dataset.tonnage === tonnage;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  document.querySelector('#fleet-panel').setAttribute('aria-labelledby','tab-'+tonnage);
  document.querySelector('#fleet-type').textContent = item.type;
  const title = document.querySelector('#fleet-title');
  title.replaceChildren();
  item.title.split('\n').forEach((line,index) => {if(index) title.append(document.createTextNode(' '),document.createElement('br')); title.append(document.createTextNode(line));});
  document.querySelector('#fleet-description').textContent = item.description;
  document.querySelector('#fleet-weight').textContent = 'do '+tonnage+' tun';
  for (const key of ['pallets','length','size']) document.querySelector('#fleet-'+key).textContent = item[key];
  return {tonnage, ...item};
}
tabs.forEach((tab,index) => {
  tab.addEventListener('click',() => selectVehicle(tab.dataset.tonnage));
  tab.addEventListener('keydown',event => {
    let next;
    if(event.key === 'ArrowRight') next = (index+1)%tabs.length;
    else if(event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
    else if(event.key === 'Home') next=0;
    else if(event.key === 'End') next=tabs.length-1;
    if(next !== undefined){event.preventDefault();selectVehicle(tabs[next].dataset.tonnage,true);}
  });
});
document.querySelector('#fleet-request').addEventListener('click',() => {
  form.elements.tonnage.value=selectedTonnage;
  form.elements.service.value=services[0];
  resetQuotePreview();
});
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click',() => {
  form.elements.service.value=link.dataset.service;
  form.elements.tonnage.value='unknown';
  resetQuotePreview();
}));

const menuToggle=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Otevřít menu');mobileNav.hidden=true;}
menuToggle.addEventListener('click',() => {
  const open=menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded',String(open));
  menuToggle.setAttribute('aria-label',open?'Zavřít menu':'Otevřít menu');
  mobileNav.hidden=!open;
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event => {if(event.key==='Escape' && !mobileNav.hidden){closeMenu();menuToggle.focus();}});
window.matchMedia('(min-width: 901px)').addEventListener('change',event => {if(event.matches) closeMenu();});

function validateQuote(input) {
  if(!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Poptávka musí obsahovat údaje o přepravě.');
  const limits={origin:160,destination:160,name:120,email:200,phone:40,cargo:1600,quantity:100,date:10};
  const data={};
  for(const [key,max] of Object.entries(limits)){
    if(input[key] !== undefined && typeof input[key] !== 'string') throw new Error('Údaj '+key+' musí být text.');
    data[key]=(input[key] || '').trim();
    if(data[key].length > max) throw new Error('Údaj '+key+' je příliš dlouhý.');
  }
  if(!data.origin || !data.destination || !data.name || !data.email) throw new Error('Vyplňte místo nakládky, místo vykládky, jméno a e-mail.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Zadejte platnou e-mailovou adresu.');
  data.service=input.service === undefined ? services[0] : input.service;
  data.tonnage=input.tonnage === undefined ? 'unknown' : input.tonnage;
  if(!services.includes(data.service)) throw new Error('Vyberte jednu z dostupných služeb.');
  if(!['unknown','5','8','14','24'].includes(data.tonnage)) throw new Error('Vyberte dostupnou kategorii hmotnosti.');
  if(data.date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('Termín musí být ve formátu RRRR-MM-DD.');
    const parsed=new Date(data.date+'T12:00:00Z');
    if(Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==data.date) throw new Error('Zadejte platné datum.');
  }
  return data;
}
function renderQuote(data, focus=false){
  const date=data.date ? new Intl.DateTimeFormat('cs-CZ',{timeZone:'Europe/Prague'}).format(new Date(data.date+'T12:00:00Z')) : 'Dohodou';
  const lines=[
    'POPTÁVKA PŘEPRAVY',
    'Služba: '+data.service,
    'Nakládka: '+data.origin,
    'Vykládka: '+data.destination,
    'Hmotnost: '+(data.tonnage==='unknown'?'Potřebuji poradit':'Do '+data.tonnage+' tun'),
    'Termín: '+date,
    'Počet palet / kusů: '+(data.quantity || 'Nespecifikováno'),
    'Náklad: '+(data.cargo || 'Nespecifikováno'),
    '',
    'Kontakt: '+data.name,
    'E-mail: '+data.email,
    'Telefon: '+(data.phone || 'Neuvedeno')
  ];
  const summary=lines.join('\n');
  document.querySelector('#quote-summary').textContent=summary;
  document.querySelector('#copy-status').textContent='';
  const result=document.querySelector('#quote-result');
  result.hidden=false;
  if(focus) result.focus({preventScroll:false});
  return {status:'prepared',sent:false,summary};
}
form.addEventListener('submit',event => {
  event.preventDefault();
  if(!form.reportValidity()) return;
  try{renderQuote(validateQuote(Object.fromEntries(new FormData(form))),true);}catch(error){
    form.elements.email.setCustomValidity(error.message);
    form.elements.email.reportValidity();
  }
});
function resetQuotePreview(){
  form.elements.email.setCustomValidity('');
  document.querySelector('#quote-result').hidden=true;
  document.querySelector('#copy-status').textContent='';
}
form.addEventListener('input',resetQuotePreview);
form.addEventListener('change',resetQuotePreview);
document.querySelector('#copy-quote').addEventListener('click',async () => {
  const text=document.querySelector('#quote-summary').textContent;
  const status=document.querySelector('#copy-status');
  try{
    if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    status.textContent='Údaje zkopírovány. Nic nebylo odesláno.';
  }catch{
    const selection=window.getSelection();
    const range=document.createRange();range.selectNodeContents(document.querySelector('#quote-summary'));
    selection.removeAllRanges();selection.addRange(range);
    status.textContent='Text je označený. Použijte kopírování ve svém zařízení.';
  }
});
document.querySelector('#year').textContent=String(new Date().getFullYear());

// These tools prepare the same local quote as the form; they never send data.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>{
    try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  };
  register({name:'select_transport_vehicle',title:'Vybrat typ vozidla',description:'Zobrazí možnosti přepravy podle hmotnosti v přehledu vozového parku. Nic neobjednává.',inputSchema:{type:'object',properties:{tonnage:{type:'string',enum:['5','8','14','24']}},required:['tonnage'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input || typeof input.tonnage!=='string') throw new Error('Vyberte hmotnost přepravy.');return selectVehicle(input.tonnage);}});
  register({name:'prepare_transport_quote',title:'Připravit poptávku přepravy',description:'Vyplní ukázkový formulář a zobrazí souhrn k ověření. Údaje nikam neodesílá ani neukládá.',inputSchema:{type:'object',properties:{origin:{type:'string',maxLength:160},destination:{type:'string',maxLength:160},name:{type:'string',maxLength:120},email:{type:'string',maxLength:200},phone:{type:'string',maxLength:40},service:{type:'string',enum:services},tonnage:{type:'string',enum:['unknown','5','8','14','24']},date:{type:'string',description:'Volitelný termín ve formátu RRRR-MM-DD.'},quantity:{type:'string',maxLength:100},cargo:{type:'string',maxLength:1600}},required:['origin','destination','name','email'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){const data=validateQuote(input);for(const [key,value] of Object.entries(data)){if(form.elements[key]) form.elements[key].value=value;}return renderQuote(data);}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
