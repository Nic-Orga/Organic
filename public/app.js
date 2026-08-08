const GENRE_LABELS = { synthwave: 'Synthwave', game: 'Musique de jeu', calm: 'Ambient & Calme' };

let catalog = [];
let cart = [];
let artistMode = false;
let adminPassword = null;
let currentPlayingId = null;

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ============ ROUTER ============ */
const PAGES = ['home','synthwave','game','calm'];
function showPage(page){
  if(!PAGES.includes(page)) page = 'home';
  PAGES.forEach(p => document.getElementById('page-'+p).classList.toggle('active', p===page));
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.page===page));
  window.scrollTo(0,0);
  if(page === 'synthwave') requestAnimationFrame(updateSynthScroll);
  if(page === 'game') requestAnimationFrame(updateGameScroll);
}
window.addEventListener('hashchange', () => showPage(location.hash.slice(1) || 'home'));

/* ============ SYNTHWAVE SCROLL HERO (jour -> nuit) ============ */
const synthStage = document.getElementById('synthStage');
const synthHero = document.getElementById('synthHero');
const synthStars = document.getElementById('synthStars');
const synthWindowsGroup = document.getElementById('synthWindowsGroup');
const synthWindowsGroupReflect = document.getElementById('synthWindowsGroupReflect');
const synthWindows = [];
const SVG_NS = 'http://www.w3.org/2000/svg';

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function buildSynthStars(){
  if(!synthStars || synthStars.childElementCount) return;
  const frag = document.createDocumentFragment();
  for(let i = 0; i < 60; i++){
    const s = document.createElement('span');
    s.style.left = (Math.random()*100).toFixed(2) + '%';
    s.style.top = (Math.random()*55).toFixed(2) + '%';
    frag.appendChild(s);
  }
  synthStars.appendChild(frag);
}

function buildSynthWindows(){
  if(!synthWindowsGroup || !synthWindowsGroupReflect || synthWindowsGroup.childElementCount) return;
  for(let gx = 10; gx < 1190; gx += 20){
    for(let gy = 25; gy < 250; gy += 17){
      const jx = gx + (Math.random()*8 - 4);
      const jy = gy + (Math.random()*6 - 3);
      const colorRoll = Math.random();
      const color = colorRoll < .72 ? 'amber' : (colorRoll < .88 ? 'pink' : 'cyan');
      const neverLit = Math.random() < .3;
      const threshold = neverLit ? 2 : (.45 + Math.random()*.45);

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', jx.toFixed(1));
      rect.setAttribute('y', jy.toFixed(1));
      rect.setAttribute('width', '4');
      rect.setAttribute('height', '5');
      rect.setAttribute('rx', '.5');
      rect.setAttribute('class', 'win ' + color);
      synthWindowsGroup.appendChild(rect);

      const reflectRect = rect.cloneNode();
      synthWindowsGroupReflect.appendChild(reflectRect);

      synthWindows.push({ el: rect, reflectEl: reflectRect, threshold });
    }
  }
}

function updateSynthWindows(p){
  synthWindows.forEach(w => {
    const lit = p > w.threshold;
    w.el.classList.toggle('lit', lit);
    w.reflectEl.classList.toggle('lit', lit);
  });
}

function updateSynthScroll(){
  if(!synthStage || !synthHero || synthStage.offsetHeight === 0) return;
  const stageRect = synthStage.getBoundingClientRect();
  const scrollRange = Math.max(synthStage.offsetHeight - window.innerHeight, 1);
  const scrolled = -stageRect.top;
  const p = clamp(scrolled / scrollRange, 0, 1);
  const treeP = clamp(p * 1.6, 0, 1);
  const pTree = treeP * treeP;
  synthHero.style.setProperty('--p', p.toFixed(3));
  synthHero.style.setProperty('--pTree', pTree.toFixed(3));
  updateSynthWindows(p);
}

buildSynthStars();
buildSynthWindows();
updateSynthScroll();

/* ============ MUSIQUE DE JEU SCROLL HERO (descente dans les ruines) ============ */
const gameStage = document.getElementById('gameStage');
const gameHero = document.getElementById('gameHero');
const gameFireflies = document.getElementById('gameFireflies');
const gameGlowGroup = document.getElementById('gameGlowGroup');
const gameVinePath = document.getElementById('gameVinePath');
const gameGlowPoints = [];
let gameVineLength = 0;

function buildGameFireflies(){
  if(!gameFireflies || gameFireflies.childElementCount) return;
  const frag = document.createDocumentFragment();
  for(let i = 0; i < 22; i++){
    const s = document.createElement('span');
    s.style.left = (Math.random()*100).toFixed(2) + '%';
    s.style.top = (30 + Math.random()*60).toFixed(2) + '%';
    s.style.animationDuration = (5 + Math.random()*6).toFixed(2) + 's';
    s.style.animationDelay = (-Math.random()*10).toFixed(2) + 's';
    frag.appendChild(s);
  }
  gameFireflies.appendChild(frag);
}

function buildGameGlow(){
  if(!gameGlowGroup || gameGlowGroup.childElementCount) return;
  for(let gx = 20; gx < 1180; gx += 24){
    for(let gy = 30; gy < 300; gy += 20){
      const jx = gx + (Math.random()*10 - 5);
      const jy = gy + (Math.random()*8 - 4);
      const colorRoll = Math.random();
      const color = colorRoll < .55 ? 'emerald' : (colorRoll < .8 ? 'violet' : 'cyan');
      const neverLit = Math.random() < .35;
      const threshold = neverLit ? 2 : (.35 + Math.random()*.55);

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', jx.toFixed(1));
      dot.setAttribute('cy', jy.toFixed(1));
      dot.setAttribute('r', '2.6');
      dot.setAttribute('class', 'glow ' + color);
      gameGlowGroup.appendChild(dot);

      gameGlowPoints.push({ el: dot, threshold });
    }
  }
}

function setupGameVine(){
  if(!gameVinePath) return;
  gameVineLength = gameVinePath.getTotalLength();
  gameVinePath.style.strokeDasharray = gameVineLength.toFixed(1);
  gameVinePath.style.strokeDashoffset = gameVineLength.toFixed(1);
}

function updateGameGlow(gp){
  gameGlowPoints.forEach(w => w.el.classList.toggle('lit', gp > w.threshold));
}

function updateGameScroll(){
  if(!gameStage || !gameHero || gameStage.offsetHeight === 0) return;
  const stageRect = gameStage.getBoundingClientRect();
  const scrollRange = Math.max(gameStage.offsetHeight - window.innerHeight, 1);
  const scrolled = -stageRect.top;
  const gp = clamp(scrolled / scrollRange, 0, 1);
  const gpEase = gp * gp * (3 - 2 * gp);
  gameHero.style.setProperty('--gp', gp.toFixed(3));
  gameHero.style.setProperty('--gpEase', gpEase.toFixed(3));
  updateGameGlow(gp);
  if(gameVinePath && gameVineLength){
    gameVinePath.style.strokeDashoffset = (gameVineLength * (1 - gpEase)).toFixed(1);
  }
}

buildGameFireflies();
buildGameGlow();
setupGameVine();
updateGameScroll();

window.addEventListener('scroll', () => requestAnimationFrame(() => { updateSynthScroll(); updateGameScroll(); }), { passive: true });
window.addEventListener('resize', () => requestAnimationFrame(() => { updateSynthScroll(); updateGameScroll(); }));

/* ============ CATALOG ============ */
async function loadCatalog(){
  try{
    const res = await fetch('/api/tracks');
    catalog = await res.json();
  }catch(e){
    console.error('Impossible de charger le catalogue', e);
    catalog = [];
  }
  ['synthwave','game','calm'].forEach(renderGenrePage);
  renderHomeTeaser();
}

function emptyStateHTML(genre){
  const msg = {
    synthwave: "Aucun titre synthwave pour l'instant. Direction l'Espace artiste pour poser le premier.",
    game: "Le niveau est vide. Ajoute ton premier morceau depuis l'Espace artiste.",
    calm: "Rien à écouter ici, pour l'instant. Le silence, avant le premier titre."
  }[genre];
  return `<div class="empty-state">${msg}</div>`;
}

function trackCardHTML(t, i, genre){
  const coverStyle = t.coverUrl ? ` style="background-image:url('${t.coverUrl}')"` : '';
  const cfClass = t.coverUrl ? '' : ` cf-${(i%3)+1}`;
  const inCart = cart.some(c => c.id === t.id) ? ' in-cart' : '';
  const addLabel = inCart ? 'Ajouté ✓' : 'Ajouter';
  const delBtn = artistMode ? `<button class="tc-del" data-id="${t.id}" data-genre="${genre}">Supprimer</button>` : '';
  const playState = currentPlayingId === t.id;
  return `
  <div class="track-card tc-${genre}" id="card-${t.id}">
    <div class="tc-cover${cfClass}"${coverStyle}></div>
    <div class="tc-body">
      <p class="tc-title">${escapeHTML(t.title)}</p>
      <p class="tc-price mono">${t.price.toFixed(2).replace('.',',')}&nbsp;€</p>
      <div class="tc-controls">
        <button class="tc-play${playState?' is-playing':''}" data-id="${t.id}" aria-label="Écouter l'aperçu">${playState?'❚❚':'▶'}</button>
        <button class="tc-add${inCart}" data-id="${t.id}" data-genre="${genre}">${addLabel}</button>
        ${delBtn}
      </div>
    </div>
  </div>`;
}

function renderGenrePage(genre){
  const container = document.getElementById('list-'+genre);
  const tracks = catalog.filter(t => t.genre === genre).sort((a,b)=>a.createdAt-b.createdAt);
  container.innerHTML = tracks.length===0 ? emptyStateHTML(genre) : tracks.map((t,i)=>trackCardHTML(t,i,genre)).join('');
  renderBundleBar(genre, tracks);
}

function renderBundleBar(genre, tracks){
  const bar = document.getElementById('bundle-'+genre);
  if(tracks.length < 2){ bar.classList.add('hidden'); bar.innerHTML=''; return; }
  const sum = tracks.reduce((s,t)=>s+t.price,0);
  const price = Math.round(sum*0.75*2)/2;
  const bundleId = 'bundle:'+genre;
  const inCart = cart.some(c => c.id === bundleId) ? ' in-cart' : '';
  const label = inCart ? 'Ajouté ✓' : 'Ajouter le pack complet';
  bar.classList.remove('hidden');
  bar.innerHTML = `<p>Pack complet — ${GENRE_LABELS[genre]} (${tracks.length} titres)</p><span class="bp mono">${price.toFixed(2).replace('.',',')}&nbsp;€</span><button class="tc-add${inCart}" data-id="${bundleId}" data-genre="${genre}">${label}</button>`;
}

function renderHomeTeaser(){
  const wrap = document.getElementById('home-teaser');
  const latest = [...catalog].sort((a,b)=>b.createdAt-a.createdAt).slice(0,3);
  if(latest.length===0){
    wrap.innerHTML = `<p class="empty-note">Le catalogue est vide — direction l'Espace artiste (en bas de page) pour ajouter le premier titre.</p>`;
    return;
  }
  wrap.innerHTML = latest.map(t => {
    const style = t.coverUrl ? ` style="background-image:url('${t.coverUrl}');background-size:cover;background-position:center;"` : '';
    return `<a class="teaser-card" href="#${t.genre}" data-page="${t.genre}">
      <div class="teaser-cover"${style}></div>
      <div><p class="teaser-title">${escapeHTML(t.title)}</p><p class="teaser-genre">${GENRE_LABELS[t.genre]}</p></div>
    </a>`;
  }).join('');
}

/* ============ PLAYER ============ */
const player = document.getElementById('global-player');
player.addEventListener('ended', () => { currentPlayingId = null; refreshPlayIcons(); });
function refreshPlayIcons(){
  document.querySelectorAll('.tc-play').forEach(btn => {
    const playing = btn.dataset.id === currentPlayingId;
    btn.classList.toggle('is-playing', playing);
    btn.textContent = playing ? '❚❚' : '▶';
  });
}
function handlePlay(id){
  const t = catalog.find(t => t.id === id);
  if(!t || !t.audioUrl){ alert("Aucun aperçu audio n'a été ajouté pour ce titre."); return; }
  if(currentPlayingId === id){ player.pause(); currentPlayingId = null; refreshPlayIcons(); return; }
  player.src = t.audioUrl;
  player.play();
  currentPlayingId = id;
  refreshPlayIcons();
}

/* ============ CART ============ */
function genreLabel(g){ return GENRE_LABELS[g] || g; }
function addToCart(id, genre){
  let entry;
  if(id.startsWith('bundle:')){
    const tracks = catalog.filter(t => t.genre === genre);
    const sum = tracks.reduce((s,t)=>s+t.price,0);
    const price = Math.round(sum*0.75*2)/2;
    entry = { id, title: 'Pack complet — '+genreLabel(genre), price };
  } else {
    const t = catalog.find(t => t.id === id);
    if(!t) return;
    entry = { id, title: t.title, price: t.price };
  }
  cart.push(entry);
  renderCart();
  renderGenrePage(genre);
}
function removeFromCart(id, genre){
  cart = cart.filter(c => c.id !== id);
  renderCart();
  if(genre) renderGenrePage(genre);
}
function renderCart(){
  const itemsEl = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  countEl.textContent = cart.length;
  const total = cart.reduce((s,c)=>s+c.price,0);
  totalEl.textContent = total.toFixed(2).replace('.',',') + '\u00A0€';
  checkoutBtn.disabled = cart.length === 0;
  itemsEl.innerHTML = cart.length===0
    ? '<p class="cart-empty">Votre panier est vide.</p>'
    : cart.map(c => `<div class="cart-item"><span>${escapeHTML(c.title)}</span><span style="display:flex;align-items:center;gap:10px;"><span class="mono">${c.price.toFixed(2).replace('.',',')}\u00A0€</span><button class="rm" data-id="${c.id}">retirer</button></span></div>`).join('');
}

document.addEventListener('click', (e) => {
  const playBtn = e.target.closest('.tc-play');
  if(playBtn){ handlePlay(playBtn.dataset.id); return; }

  const addBtn = e.target.closest('.tc-add');
  if(addBtn){
    const id = addBtn.dataset.id, genre = addBtn.dataset.genre;
    if(cart.some(c => c.id === id)) removeFromCart(id, genre); else addToCart(id, genre);
    return;
  }
  const rm = e.target.closest('.rm');
  if(rm){
    const id = rm.dataset.id;
    const genre = id.startsWith('bundle:') ? id.split(':')[1] : (catalog.find(t=>t.id===id)||{}).genre;
    removeFromCart(id, genre);
    return;
  }
  const delBtn = e.target.closest('.tc-del');
  if(delBtn){ handleDeleteTrack(delBtn.dataset.id, delBtn.dataset.genre); return; }
});

const cartPanel = document.getElementById('cart-panel');
const scrim = document.getElementById('scrim');
function openCart(){ cartPanel.classList.add('open'); scrim.classList.add('show'); }
function closeCart(){ cartPanel.classList.remove('open'); if(!anyModalOpen()) scrim.classList.remove('show'); }
document.getElementById('cart-toggle').addEventListener('click', () => cartPanel.classList.contains('open') ? closeCart() : openCart());
document.getElementById('cart-close').addEventListener('click', closeCart);
function anyModalOpen(){ return ['artist-modal','add-modal'].some(id => document.getElementById(id).classList.contains('open')); }
scrim.addEventListener('click', () => { closeCart(); closeAllModals(); });
function closeAllModals(){ ['artist-modal','add-modal'].forEach(id => document.getElementById(id).classList.remove('open')); if(!cartPanel.classList.contains('open')) scrim.classList.remove('show'); }
document.addEventListener('keydown', (e) => { if(e.key==='Escape'){ closeCart(); closeAllModals(); } });

/* ============ CHECKOUT (Stripe réel) ============ */
document.getElementById('checkout-btn').addEventListener('click', async () => {
  if(cart.length === 0) return;
  const btn = document.getElementById('checkout-btn');
  btn.disabled = true; btn.textContent = 'Redirection…';
  try{
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart.map(c => ({ id: c.id })) })
    });
    const data = await res.json();
    if(!res.ok || !data.url) throw new Error(data.error || 'Erreur de paiement.');
    window.location.href = data.url;
  }catch(err){
    alert(err.message);
    btn.disabled = false; btn.textContent = 'Commander';
  }
});

/* ============ ARTIST MODE ============ */
const artistModal = document.getElementById('artist-modal');
document.getElementById('artist-link').addEventListener('click', () => {
  if(artistMode){
    artistMode = false; adminPassword = null;
    document.getElementById('artist-link').textContent = 'Espace artiste';
    document.getElementById('add-fab').classList.add('hidden');
    ['synthwave','game','calm'].forEach(renderGenrePage);
    return;
  }
  artistModal.classList.add('open'); scrim.classList.add('show');
  document.getElementById('artist-pass').focus();
});
document.getElementById('artist-cancel').addEventListener('click', () => { artistModal.classList.remove('open'); if(!cartPanel.classList.contains('open')) scrim.classList.remove('show'); });
document.getElementById('artist-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const val = document.getElementById('artist-pass').value;
  document.getElementById('artist-pass').value = '';
  const res = await fetch('/api/tracks/__check__', { method: 'DELETE', headers: { 'x-admin-password': val } });
  if(res.status === 401){
    alert('Mot de passe incorrect.');
    return;
  }
  adminPassword = val;
  artistMode = true;
  artistModal.classList.remove('open'); scrim.classList.remove('show');
  document.getElementById('artist-link').textContent = "Quitter l'espace artiste";
  document.getElementById('add-fab').classList.remove('hidden');
  ['synthwave','game','calm'].forEach(renderGenrePage);
});

/* ============ ADD TRACK ============ */
const addModal = document.getElementById('add-modal');
document.getElementById('add-fab').addEventListener('click', () => {
  const currentPage = PAGES.find(p => document.getElementById('page-'+p).classList.contains('active')) || 'synthwave';
  if(currentPage !== 'home') document.getElementById('at-genre').value = currentPage;
  addModal.classList.add('open'); scrim.classList.add('show');
});
document.getElementById('add-cancel').addEventListener('click', () => { addModal.classList.remove('open'); if(!cartPanel.classList.contains('open')) scrim.classList.remove('show'); });

document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Ajout en cours…';

  const fd = new FormData();
  fd.append('title', document.getElementById('at-title').value.trim());
  fd.append('genre', document.getElementById('at-genre').value);
  fd.append('price', document.getElementById('at-price').value);
  fd.append('downloadLink', document.getElementById('at-link').value.trim());
  const audioFile = document.getElementById('at-audio').files[0];
  const coverFile = document.getElementById('at-cover').files[0];
  if(audioFile) fd.append('audio', audioFile);
  if(coverFile) fd.append('cover', coverFile);

  try{
    const res = await fetch('/api/tracks', { method: 'POST', headers: { 'x-admin-password': adminPassword }, body: fd });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || "Erreur lors de l'ajout.");
    await loadCatalog();
    addModal.classList.remove('open'); if(!cartPanel.classList.contains('open')) scrim.classList.remove('show');
    e.target.reset();
    document.getElementById('at-price').value = '2.5';
  }catch(err){
    alert(err.message);
  }finally{
    btn.disabled = false; btn.textContent = 'Ajouter le titre';
  }
});

async function handleDeleteTrack(id, genre){
  if(!confirm('Supprimer ce titre ?')) return;
  const res = await fetch('/api/tracks/'+id, { method: 'DELETE', headers: { 'x-admin-password': adminPassword } });
  if(!res.ok){ alert('Erreur lors de la suppression.'); return; }
  cart = cart.filter(c => c.id !== id);
  renderCart();
  await loadCatalog();
}

/* ============ INIT ============ */
showPage(location.hash.slice(1) || 'home');
loadCatalog();
