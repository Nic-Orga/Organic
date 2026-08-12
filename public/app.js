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
let currentPageId = null;
function showPage(page){
  if(!PAGES.includes(page)) page = 'home';
  PAGES.forEach(p => document.getElementById('page-'+p).classList.toggle('active', p===page));
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.page===page));
  window.scrollTo(0,0);
  if(page === 'synthwave') requestAnimationFrame(updateSynthScroll);
  if(page === 'game') requestAnimationFrame(updateGameScroll);
  if(page === 'calm') requestAnimationFrame(updateCalmScroll);

  if(page === 'calm' && currentPageId !== 'calm') initBlackHole();
  else if(page !== 'calm' && currentPageId === 'calm') stopBlackHole();
  if(page === 'home' && currentPageId !== 'home') initHalftone();
  else if(page !== 'home' && currentPageId === 'home') stopHalftone();
  currentPageId = page;
}
window.addEventListener('hashchange', () => showPage(location.hash.slice(1) || 'home'));

/* ============ HOME HERO WebGL HALFTONE BACKGROUND ============ */
let halftone = null;
function initHalftone(){
  const canvas = document.getElementById('homeCanvas');
  if(!canvas || halftone) return;
  const gl = canvas.getContext('webgl', { alpha:false, antialias:true, powerPreference:'high-performance' });
  if(!gl) return;
  const VERT = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}';
  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w
float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}
vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}
vec3 shade(vec2 uv, vec2 p, float t) {
  float cells = 18.0 + u_intensity * 30.0;
  vec2 f = fract(p * cells) - 0.5;
  float field = 0.5 + 0.5 * sin(p.x * 3.0 + t + u_seed) * sin(p.y * 2.4 - t * 0.7);
  float r = (0.06 + u_paramA * 0.34) + field * 0.2;
  float dotMask = 1.0 - smoothstep(r - 0.08, r, length(f));
  return mix(u_colors[0], palette(field), dotMask);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;
  if (u_cursorPresence > 0.001) {
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence
        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(
          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
  function compile(type, src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); return null; } return s; }
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if(!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(program)); return; }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  ['u_colors','u_scene','u_shape','u_surface','u_finish','u_transform','u_space','u_cursor'].forEach(n=>{ u[n]=gl.getUniformLocation(program, n); });
  const hexToLin = (hex)=>{ const n=parseInt(hex.replace('#',''),16); return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255]; };
  const colors = [hexToLin('#0B1026'), hexToLin('#3D46E8'), hexToLin('#B18CFF'), hexToLin('#FFD6E7')];
  while(colors.length<8) colors.push(colors[3]);
  const flatColors = new Float32Array(colors.flat());
  halftone = { gl, program, u, canvas, flatColors, raf:0, start: performance.now() };
  resizeHalftone();
  renderHalftone(0);
  halftone.resizeHandler = () => { resizeHalftone(); renderHalftone((performance.now()-halftone.start)/1000); };
  window.addEventListener('resize', halftone.resizeHandler);
  const loop = (now) => {
    if(!halftone) return;
    if(document.hidden){ halftone.raf = requestAnimationFrame(loop); return; }
    renderHalftone((now - halftone.start)/1000);
    halftone.raf = requestAnimationFrame(loop);
  };
  halftone.raf = requestAnimationFrame(loop);
}

function resizeHalftone(){
  if(!halftone) return;
  const rect = halftone.canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  const w = Math.max(2, Math.round(rect.width*dpr)), h = Math.max(2, Math.round(rect.height*dpr));
  halftone.canvas.width = w; halftone.canvas.height = h;
  halftone.gl.viewport(0,0,w,h);
}

function renderHalftone(t){
  const { gl, program, u, canvas, flatColors } = halftone;
  gl.useProgram(program);
  gl.uniform3fv(u.u_colors, flatColors);
  gl.uniform4f(u.u_scene, canvas.width, canvas.height, t*1.43, 4.0);
  gl.uniform4f(u.u_shape, 1.48, 0.88, 0.50, 0.00);
  gl.uniform4f(u.u_surface, 2.40, 0.91, 0.00, 1.00);
  gl.uniform4f(u.u_finish, 0.00, 0.00, 0.000, 0.06);
  gl.uniform4f(u.u_transform, 6.0, 0.00, 0.00, 0.0);
  gl.uniform4f(u.u_space, 0.00, 0.00, 0.0, 0.0);
  gl.uniform4f(u.u_cursor, 0.0, 2.0, 0.65, 0.46);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function stopHalftone(){
  if(!halftone) return;
  cancelAnimationFrame(halftone.raf);
  if(halftone.resizeHandler) window.removeEventListener('resize', halftone.resizeHandler);
  halftone = null;
}

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

let synthLastP = null;
function updateSynthScroll(){
  if(!synthStage || !synthHero || synthStage.offsetHeight === 0) return;
  const stageRect = synthStage.getBoundingClientRect();
  const scrollRange = Math.max(synthStage.offsetHeight - window.innerHeight, 1);
  const scrolled = -stageRect.top;
  const p = clamp(scrolled / scrollRange, 0, 1);
  if(p === synthLastP) return;
  synthLastP = p;
  const treeP = clamp(p * 1.6, 0, 1);
  const pTree = treeP * treeP;
  synthHero.style.setProperty('--p', p.toFixed(3));
  synthHero.style.setProperty('--pTree', pTree.toFixed(3));
  updateSynthWindows(p);
}

buildSynthStars();
buildSynthWindows();
updateSynthScroll();

/* ============ MUSIQUE DE JEU SCROLL HERO (route, lampadaire, etoile filante) ============ */
const gameStage = document.getElementById('gameStage');
const gameHero = document.getElementById('gameHero');
const gameFireflies = document.getElementById('gameFireflies');
const gameVinePath = document.getElementById('gameVinePath');
const gameCityWindowsGroup = document.getElementById('gameCityWindowsGroup');
const gameCityWindows = [];
const gameStars = document.getElementById('gameStars');
let gameVineLength = 0;

function buildGameStars(){
  if(!gameStars || gameStars.childElementCount) return;
  const frag = document.createDocumentFragment();
  for(let i = 0; i < 55; i++){
    const s = document.createElement('span');
    s.style.left = (Math.random()*100).toFixed(2) + '%';
    s.style.top = (Math.random()*50).toFixed(2) + '%';
    frag.appendChild(s);
  }
  gameStars.appendChild(frag);
}

function buildGameCityWindows(){
  if(!gameCityWindowsGroup || gameCityWindowsGroup.childElementCount) return;
  for(let gx = 12; gx < 1195; gx += 14){
    for(let gy = 30; gy < 210; gy += 14){
      const jx = gx + (Math.random()*6 - 3);
      const jy = gy + (Math.random()*5 - 2.5);
      // les fenetres basses (pres du sol) s'allument en premier, les plus hautes en dernier
      const heightFraction = clamp((220 - jy) / 220, 0, 1);
      const neverLit = Math.random() < .18;
      const threshold = neverLit ? 2 : clamp(heightFraction * .78 + Math.random() * .18, 0, .97);

      const win = document.createElementNS(SVG_NS, 'rect');
      win.setAttribute('x', jx.toFixed(1));
      win.setAttribute('y', jy.toFixed(1));
      win.setAttribute('width', '3');
      win.setAttribute('height', '4');
      win.setAttribute('rx', '.5');
      win.setAttribute('class', 'city-win');
      gameCityWindowsGroup.appendChild(win);

      gameCityWindows.push({ el: win, threshold });
    }
  }
}

function updateGameCityWindows(lampOn){
  gameCityWindows.forEach(w => w.el.classList.toggle('lit', lampOn > w.threshold));
}

function buildGameFireflies(){
  if(!gameFireflies || gameFireflies.childElementCount) return;
  const frag = document.createDocumentFragment();
  for(let i = 0; i < 9; i++){
    const s = document.createElement('span');
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 8;
    s.style.left = (40 + Math.cos(angle) * radius).toFixed(2) + '%';
    s.style.top = (82 + Math.sin(angle) * radius * .5).toFixed(2) + '%';
    s.style.animationDuration = (4 + Math.random()*5).toFixed(2) + 's';
    s.style.animationDelay = (-Math.random()*10).toFixed(2) + 's';
    frag.appendChild(s);
  }
  gameFireflies.appendChild(frag);
}

function setupGameVine(){
  if(!gameVinePath) return;
  gameVineLength = gameVinePath.getTotalLength();
  gameVinePath.style.strokeDasharray = gameVineLength.toFixed(1);
  gameVinePath.style.strokeDashoffset = gameVineLength.toFixed(1);
}

let gameLastGp = null;
function updateGameScroll(){
  if(!gameStage || !gameHero || gameStage.offsetHeight === 0) return;
  const stageRect = gameStage.getBoundingClientRect();
  const scrollRange = Math.max(gameStage.offsetHeight - window.innerHeight, 1);
  const scrolled = -stageRect.top;
  const gp = clamp(scrolled / scrollRange, 0, 1);
  if(gp === gameLastGp) return;
  gameLastGp = gp;
  const gpEase = gp * gp * (3 - 2 * gp);
  const moonFade = clamp(1 - gp / .6, 0, 1);
  const lampOn = clamp((gp - .25) / .55, 0, 1);
  const starP = clamp((gp - .15) / .35, 0, 1);
  let starOpacity = 0;
  if(starP > 0 && starP < 1){
    if(starP < .15) starOpacity = starP / .15;
    else if(starP > .85) starOpacity = (1 - starP) / .15;
    else starOpacity = 1;
  }
  // trainee pleine longueur la majeure partie du trajet, puis effondrement rapide en point sur la toute fin
  const starScale = starP > .72 ? clamp(1 - (starP - .72) / .28, .035, 1) : 1;
  // deuxieme etoile filante : plus bas dans le ciel, en diagonale, decalee dans le temps
  const star2P = clamp((gp - .28) / .32, 0, 1);
  let star2Opacity = 0;
  if(star2P > 0 && star2P < 1){
    if(star2P < .15) star2Opacity = star2P / .15;
    else if(star2P > .85) star2Opacity = (1 - star2P) / .15;
    else star2Opacity = 1;
  }
  const star2Scale = star2P > .72 ? clamp(1 - (star2P - .72) / .28, .035, 1) : 1;
  gameHero.style.setProperty('--gp', gp.toFixed(3));
  gameHero.style.setProperty('--gpEase', gpEase.toFixed(3));
  gameHero.style.setProperty('--moonFade', moonFade.toFixed(3));
  gameHero.style.setProperty('--lampOn', lampOn.toFixed(3));
  gameHero.style.setProperty('--starP', starP.toFixed(3));
  gameHero.style.setProperty('--starOpacity', starOpacity.toFixed(3));
  gameHero.style.setProperty('--starScale', starScale.toFixed(3));
  gameHero.style.setProperty('--star2P', star2P.toFixed(3));
  gameHero.style.setProperty('--star2Opacity', star2Opacity.toFixed(3));
  gameHero.style.setProperty('--star2Scale', star2Scale.toFixed(3));
  if(gameVinePath && gameVineLength){
    gameVinePath.style.strokeDashoffset = (gameVineLength * (1 - gpEase)).toFixed(1);
  }
  updateGameCityWindows(lampOn);
}

buildGameFireflies();
buildGameStars();
buildGameCityWindows();
setupGameVine();
updateGameScroll();

/* ============ AMBIENT & CALME SCROLL HERO (trou noir anime) ============ */
const calmStage = document.getElementById('calmStage');
const calmHero = document.getElementById('calmHero');
const calmStars = document.getElementById('calmStars');

function buildCalmStars(){
  if(!calmStars || calmStars.childElementCount) return;
  const frag = document.createDocumentFragment();
  for(let i = 0; i < 90; i++){
    const s = document.createElement('span');
    const size = (1 + Math.random()*2).toFixed(1);
    const tintRoll = Math.random();
    const tint = tintRoll < .15 ? '#bcd7ff' : (tintRoll < .3 ? '#ffe9c2' : '#fff');
    s.style.left = (Math.random()*100).toFixed(2) + '%';
    s.style.top = (Math.random()*100).toFixed(2) + '%';
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.background = tint;
    s.style.animationDuration = (2 + Math.random()*4).toFixed(2) + 's';
    frag.appendChild(s);
  }
  calmStars.appendChild(frag);
}

/* ---- trou noir WebGL (raymarching + disque d'accretion) ---- */
let blackHole = null;
function initBlackHole(){
  const canvas = document.getElementById('calmCanvas');
  const bloom = document.getElementById('calmBloom');
  if(!canvas || blackHole) return;
  const gl = canvas.getContext('webgl', { alpha:false, antialias:false, powerPreference:'high-performance', preserveDrawingBuffer:true });
  if(!gl) return;
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uCamPos, uRight, uUp, uFwd;
uniform float uTanHalf, uSteps, uSkyR, uDiskIn, uDiskOut, uThick, uDensity, uSpin, uGrain, uBright, uDoppler, uVignette, uExposure;
uniform vec3 uHot, uMid, uCool;
float hash13(vec3 p){ p=fract(p*0.3183099+vec3(.1,.2,.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  float n000=hash13(i+vec3(0.,0.,0.)), n100=hash13(i+vec3(1.,0.,0.)), n010=hash13(i+vec3(0.,1.,0.)), n110=hash13(i+vec3(1.,1.,0.));
  float n001=hash13(i+vec3(0.,0.,1.)), n101=hash13(i+vec3(1.,0.,1.)), n011=hash13(i+vec3(0.,1.,1.)), n111=hash13(i+vec3(1.,1.,1.));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y), mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}
float fbm(vec3 p){ float a=.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+vec3(11.3,7.1,3.7); a*=.5; } return s; }
void gasAt(vec3 p, float rd, out float dens, out vec3 tint, out float heat){
  float rn = clamp((rd-uDiskIn)/max(.001,uDiskOut-uDiskIn),0.0,1.0);
  float tk = uThick*(0.35+1.25*rn);
  float sheet = exp(-(p.y/tk)*(p.y/tk));
  float phi = atan(p.z,p.x);
  float omega = uSpin*pow(uDiskIn/rd,1.5);
  float lr = log(rd)*1.1 + uSpin*uTime*0.05;
  vec3 sp = vec3(vec2(cos(phi+omega*uTime), sin(phi+omega*uTime))*(rd*uGrain), lr);
  float clouds = fbm(sp);
  float filaments = clouds*clouds*1.75;
  float inner = smoothstep(0.0,0.07,rn);
  float outer = 1.0 - smoothstep(0.45,1.0,rn);
  float prof = inner*outer*pow(uDiskIn/rd,2.0);
  dens = max(0.0, filaments*1.5-0.30)*sheet*prof*uDensity*4.6;
  heat = pow(uDiskIn/rd,0.8)*(0.72+0.55*clouds);
  tint = mix(uCool,uMid,smoothstep(.10,.52,heat));
  tint = mix(tint,uHot,smoothstep(.52,1.05,heat));
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  vec3 dir = normalize(uFwd + (uv.x*uRight+uv.y*uUp)*2.0*uTanHalf);
  vec3 pos = uCamPos; vec3 vel = dir;
  vec3 hv = cross(pos,vel); float h2=dot(hv,hv);
  vec3 col = vec3(0.0); float transmit=1.0;
  for(int i=0;i<200;i++){
    if(float(i)>=uSteps) break;
    float r2=dot(pos,pos); float r=sqrt(r2);
    if(r<1.0){ break; }
    if(r>uSkyR && dot(pos,vel)>0.0) break;
    if(transmit<0.01) break;
    float dt = clamp(0.16*(r-1.0), 0.03, 1.2);
    if(r<uDiskOut*1.25){
      float rn=clamp((r-uDiskIn)/max(.001,uDiskOut-uDiskIn),0.0,1.0);
      float tk=uThick*(0.35+1.25*rn);
      dt=min(dt, max(tk*0.4, abs(pos.y)*0.5));
    }
    vec3 mid = pos+vel*dt*0.5;
    float rd = length(mid.xz);
    if(rd>uDiskIn && rd<uDiskOut && abs(mid.y)<uThick*5.0){
      float dens, heat; vec3 tint;
      gasAt(mid, rd, dens, tint, heat);
      if(dens>0.001){
        vec3 tang = normalize(cross(vec3(0.,1.,0.), vec3(mid.x,0.,mid.z)));
        float beta = min(0.85, sqrt(0.5/max(rd,1.5)));
        float gam = inversesqrt(max(1e-4,1.0-beta*beta));
        vec3 toObs = -normalize(vel);
        float g = 1.0/(gam*(1.0-beta*dot(tang,toObs)));
        g *= sqrt(max(0.05,1.0-1.0/rd));
        float boost = pow(max(g,0.02), 3.0*uDoppler);
        vec3 shift = mix(vec3(1.0), g>1.0?vec3(.86,.94,1.14):vec3(1.15,.82,.62), clamp(abs(g-1.0)*1.6,0.0,1.0)*uDoppler);
        float emit = uBright*(0.26+2.0*heat*heat);
        col += tint*shift*(emit*boost*dens*transmit*dt);
        transmit *= exp(-dens*0.30*dt);
      }
    }
    vec3 acc = -1.5*h2*pos/(r2*r2*r);
    vel += acc*dt;
    pos += vel*dt;
  }
  vec3 c = col;
  c = (c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);
  c = c*uExposure;
  c = pow(max(c,0.0), vec3(0.4545));
  c *= 1.0 - uVignette*dot(uv,uv)*0.9;
  gl_FragColor = vec4(c,1.0);
}`;
  function compile(type, src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); return null; } return s; }
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if(!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'a');
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(program)); return; }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  ['uRes','uTime','uCamPos','uRight','uUp','uFwd','uTanHalf','uSteps','uSkyR','uDiskIn','uDiskOut','uThick','uDensity','uSpin','uGrain','uBright','uDoppler','uVignette','uExposure','uHot','uMid','uCool'].forEach(n=>{ u[n]=gl.getUniformLocation(program, n); });
  const bloomCtx = bloom ? bloom.getContext('2d') : null;
  blackHole = { gl, program, u, canvas, bloom, bloomCtx, raf:0, start: performance.now() };
  resizeBlackHole();
  renderBlackHole(0);
  blackHole.resizeHandler = () => { resizeBlackHole(); renderBlackHole((performance.now()-blackHole.start)/1000); };
  window.addEventListener('resize', blackHole.resizeHandler);
  const loop = (now) => {
    if(!blackHole) return;
    renderBlackHole((now - blackHole.start)/1000);
    blackHole.raf = requestAnimationFrame(loop);
  };
  blackHole.raf = requestAnimationFrame(loop);
}

function resizeBlackHole(){
  if(!blackHole) return;
  const rect = blackHole.canvas.parentElement.getBoundingClientRect();
  const scale = 0.65;
  const w = Math.max(2, Math.round(rect.width*scale)), h = Math.max(2, Math.round(rect.height*scale));
  blackHole.canvas.width = w; blackHole.canvas.height = h;
  if(blackHole.bloom){ blackHole.bloom.width = Math.max(2,Math.round(w*.4)); blackHole.bloom.height = Math.max(2,Math.round(h*.4)); }
  blackHole.gl.viewport(0,0,w,h);
}

function renderBlackHole(t){
  const { gl, program, u, canvas, bloom, bloomCtx } = blackHole;
  gl.useProgram(program);
  const az = t*0.03, el = -0.12, dist = 22;
  const camX = dist*Math.cos(el)*Math.cos(az), camY = dist*Math.sin(el), camZ = dist*Math.cos(el)*Math.sin(az);
  const fx=-camX/dist, fy=-camY/dist, fz=-camZ/dist;
  let rx=fz, ry=0, rz=-fx; const rl=Math.hypot(rx,ry,rz)||1; rx/=rl; ry/=rl; rz/=rl;
  let ux=ry*fz-rz*fy, uy=rz*fx-rx*fz, uz=rx*fy-ry*fx;
  const roll = -18*Math.PI/180, cr=Math.cos(roll), sr=Math.sin(roll);
  const RX=rx*cr+ux*sr, RY=ry*cr+uy*sr, RZ=rz*cr+uz*sr;
  const UX=-rx*sr+ux*cr, UY=-ry*sr+uy*cr, UZ=-rz*sr+uz*cr;
  gl.uniform2f(u.uRes, canvas.width, canvas.height);
  gl.uniform1f(u.uTime, t);
  gl.uniform3f(u.uCamPos, camX, camY, camZ);
  gl.uniform3f(u.uRight, RX, RY, RZ);
  gl.uniform3f(u.uUp, UX, UY, UZ);
  gl.uniform3f(u.uFwd, fx, fy, fz);
  gl.uniform1f(u.uTanHalf, Math.tan(38*0.5*Math.PI/180));
  gl.uniform1f(u.uSteps, 140);
  gl.uniform1f(u.uSkyR, 30);
  gl.uniform1f(u.uDiskIn, 3);
  gl.uniform1f(u.uDiskOut, 14);
  gl.uniform1f(u.uThick, 0.28);
  gl.uniform1f(u.uDensity, 1.0);
  gl.uniform1f(u.uSpin, 0.4);
  gl.uniform1f(u.uGrain, 0.5);
  gl.uniform1f(u.uBright, 1.1);
  gl.uniform1f(u.uDoppler, 0.4);
  gl.uniform1f(u.uVignette, 0.35);
  gl.uniform1f(u.uExposure, 1.0);
  gl.uniform3f(u.uHot, 1.0, 0.953, 0.87);
  gl.uniform3f(u.uMid, 0.851, 0.718, 0.478);
  gl.uniform3f(u.uCool, 0.086, 0.188, 0.361);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  if(bloomCtx){ bloomCtx.clearRect(0,0,bloom.width,bloom.height); bloomCtx.drawImage(canvas, 0, 0, bloom.width, bloom.height); }
}

function stopBlackHole(){
  if(!blackHole) return;
  cancelAnimationFrame(blackHole.raf);
  if(blackHole.resizeHandler) window.removeEventListener('resize', blackHole.resizeHandler);
  blackHole = null;
}

let calmLastCp = null;
function updateCalmScroll(){
  if(!calmStage || !calmHero || calmStage.offsetHeight === 0) return;
  const stageRect = calmStage.getBoundingClientRect();
  const scrollRange = Math.max(calmStage.offsetHeight - window.innerHeight, 1);
  const scrolled = -stageRect.top;
  const cp = clamp(scrolled / scrollRange, 0, 1);
  if(cp === calmLastCp) return;
  calmLastCp = cp;
  const cpEase = cp * cp * (3 - 2 * cp);
  calmHero.style.setProperty('--cp', cp.toFixed(3));
  calmHero.style.setProperty('--cpEase', cpEase.toFixed(3));
}

buildCalmStars();
updateCalmScroll();

const HERO_UPDATERS = { synthwave: updateSynthScroll, game: updateGameScroll, calm: updateCalmScroll };
function updateActiveHeroScroll(){
  const activeEl = document.querySelector('main > .page.active');
  if(!activeEl) return;
  const page = activeEl.id.replace('page-', '');
  const updater = HERO_UPDATERS[page];
  if(updater) updater();
}
let heroScrollTicking = false;
function scheduleHeroScrollUpdate(){
  if(heroScrollTicking) return;
  heroScrollTicking = true;
  requestAnimationFrame(() => { updateActiveHeroScroll(); heroScrollTicking = false; });
}
window.addEventListener('scroll', scheduleHeroScrollUpdate, { passive: true });
window.addEventListener('resize', scheduleHeroScrollUpdate);

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
      <div class="teaser-cover"${style}>
        <div class="teaser-groove"></div>
        <div class="teaser-shine"></div>
        <div class="teaser-spindle"></div>
      </div>
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
