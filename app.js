(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const ITER = 150000;
const PALETTE = ['#e9c46a', '#f6dca0', '#f4a9c0', '#ffd3e0', '#ffffff', '#6f9cff', '#2c55a8'];

/* =============== SKY: estrellas + corazones =============== */
const sky = $('#sky'), sctx = sky.getContext('2d');
let W = 0, H = 0, stars = [], hearts = [], shoot = null;
function sizeCanvases() {
  W = innerWidth; H = innerHeight;
  for (const c of [sky, fxc]) { c.width = W * DPR; c.height = H * DPR; c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0); }
  const n = Math.min(150, Math.round(W * H / 6000));
  stars = Array.from({ length: n }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.3, 1.5), p: rand(0, 6.3), s: rand(.5, 2) }));
}
function heartPath(c, x, y, s) {
  c.beginPath(); c.moveTo(x, y + s * .3);
  c.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3);
  c.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s);
  c.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3);
  c.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); c.closePath();
}
function drawSky(t) {
  sctx.clearRect(0, 0, W, H);
  for (const s of stars) {
    const a = .35 + .65 * Math.abs(Math.sin(t / 1000 * s.s + s.p));
    sctx.globalAlpha = a; sctx.fillStyle = '#fff';
    sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, 6.283); sctx.fill();
  }
  if (Math.random() < .025 && hearts.length < 14) hearts.push({ x: rand(0, W), y: H + 20, s: rand(8, 20), v: rand(.3, .9), p: rand(0, 6), c: Math.random() < .5 ? '#f4a9c0' : '#6f9cff' });
  hearts = hearts.filter(h => h.y > -40);
  for (const h of hearts) {
    h.y -= h.v; h.p += .02;
    sctx.globalAlpha = Math.min(.55, (H - h.y) / 300) * Math.min(1, h.y / 120);
    sctx.fillStyle = h.c; heartPath(sctx, h.x + Math.sin(h.p) * 18, h.y, h.s); sctx.fill();
  }
  if (!shoot && Math.random() < .003) shoot = { x: rand(W * .2, W), y: rand(0, H * .4), l: 0 };
  if (shoot) {
    shoot.l += 1; const len = 90, px = shoot.x - shoot.l * 9, py = shoot.y + shoot.l * 4;
    const g = sctx.createLinearGradient(px, py, px + len, py - len * .45);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.globalAlpha = 1 - shoot.l / 50; sctx.strokeStyle = g; sctx.lineWidth = 2;
    sctx.beginPath(); sctx.moveTo(px, py); sctx.lineTo(px + len, py - len * .45); sctx.stroke();
    if (shoot.l > 50) shoot = null;
  }
  sctx.globalAlpha = 1;
  requestAnimationFrame(drawSky);
}

/* =============== FX: confeti y fuegos artificiales =============== */
const fxc = $('#fx'), fctx = fxc.getContext('2d');
let parts = [], fxRunning = false;
function confetti(x = W / 2, y = H / 3, n = 120, spread = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.283), v = rand(3, 11) * spread;
    parts.push({ k: Math.random() < .25 ? 'h' : 'c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, g: .22, d: .985, w: rand(6, 11), h: rand(4, 7), r: rand(0, 6), vr: rand(-.3, .3), c: PALETTE[i % PALETTE.length], life: rand(140, 220) });
  }
  runFx();
}
function rocket(x, ty) {
  parts.push({ k: 'r', x, y: H + 10, vx: rand(-1, 1), vy: -Math.sqrt(2 * .18 * (H - ty)), g: .18, d: 1, c: '#fff', life: 999, ty });
  runFx();
}
function explode(x, y) {
  const c = PALETTE[Math.floor(rand(0, PALETTE.length))], n = 70, heart = Math.random() < .35;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283; let vx, vy;
    if (heart) { const t = a; vx = 16 * Math.sin(t) ** 3 / 4; vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 4; }
    else { const v = rand(2, 6.5); vx = Math.cos(a) * v; vy = Math.sin(a) * v; }
    parts.push({ k: 's', x, y, vx, vy, g: .06, d: .975, c: Math.random() < .2 ? '#fff' : c, life: rand(60, 100), max: 100 });
  }
}
function fireworks(seconds = 6) {
  const end = performance.now() + seconds * 1000;
  (function loop() {
    rocket(rand(W * .15, W * .85), rand(H * .12, H * .45));
    if (performance.now() < end) setTimeout(loop, rand(250, 600));
  })();
}
function runFx() { if (!fxRunning) { fxRunning = true; requestAnimationFrame(stepFx); } }
function stepFx() {
  fctx.clearRect(0, 0, W, H);
  const cur = parts; parts = [];
  for (const p of cur) {
    p.vx *= p.d; p.vy = p.vy * p.d + p.g; p.x += p.vx; p.y += p.vy; p.life--;
    if (p.k === 'r') {
      fctx.fillStyle = '#fff'; fctx.globalAlpha = 1; fctx.beginPath(); fctx.arc(p.x, p.y, 2.2, 0, 6.283); fctx.fill();
      for (let i = 0; i < 2; i++) parts.push({ k: 's', x: p.x, y: p.y, vx: rand(-.4, .4), vy: rand(.5, 1.5), g: .02, d: .96, c: '#f6dca0', life: 25, max: 25 });
      if (p.vy >= -1 || p.y <= p.ty) { explode(p.x, p.y); continue; }
    } else if (p.k === 's') {
      fctx.globalAlpha = Math.max(0, p.life / p.max); fctx.fillStyle = p.c;
      fctx.beginPath(); fctx.arc(p.x, p.y, 2, 0, 6.283); fctx.fill();
    } else {
      p.r += p.vr; fctx.globalAlpha = Math.min(1, p.life / 40); fctx.fillStyle = p.c;
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r);
      if (p.k === 'h') { heartPath(fctx, 0, -p.w / 2, p.w * 1.3); fctx.fill(); }
      else fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1);
      fctx.restore();
    }
    if (p.life > 0 && p.y < H + 60) parts.push(p);
  }
  fctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(stepFx); else { fxRunning = false; fctx.clearRect(0, 0, W, H); }
}

addEventListener('resize', sizeCanvases);
sizeCanvases(); requestAnimationFrame(drawSky);

/* =============== MÚSICA: “Cumpleaños feliz” en marimba =============== */
const music = { ctx: null, master: null, on: false, pass: null, timer: null, ducked: false };
const SONG = [[67,.75],[67,.25],[69,1,48],[67,1],[72,1],[71,2,43],[67,.75],[67,.25],[69,1,43],[67,1],[74,1],[72,2,48],
  [67,.75],[67,.25],[79,1,48],[76,1],[72,1],[71,1,41],[69,2],[77,.75],[77,.25],[76,1,48],[72,1],[74,1,43],[72,3,48]];
const hz = m => 440 * 2 ** ((m - 69) / 12);
function ensureAudio() {
  if (!music.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    music.ctx = new AC(); music.master = music.ctx.createGain(); music.master.gain.value = .0001;
    music.master.connect(music.ctx.destination);
  }
  if (music.ctx.state === 'suspended') music.ctx.resume();
}
function marimba(dest, t, f, vol, len) {
  const c = music.ctx;
  [[1, vol, len], [4, vol * .22, len * .25], [10, vol * .05, len * .08]].forEach(([m, v, d]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f * m;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + .05);
  });
}
function schedulePass() {
  if (!music.on) return;
  const c = music.ctx, g = c.createGain(); g.connect(music.master); music.pass = g;
  const beat = .43; let t = c.currentTime + .15;
  for (const [m, d, bass] of SONG) {
    marimba(g, t, hz(m), .32, Math.max(.9, d * beat * 2));
    if (bass) { marimba(g, t, hz(bass), .2, 1.6); marimba(g, t + beat, hz(bass + 7), .08, .8); marimba(g, t + beat * 2, hz(bass + 12), .07, .8); }
    t += d * beat;
  }
  const total = (t - c.currentTime + beat * 2) * 1000;
  music.timer = setTimeout(schedulePass, total);
}
function setMusic(on) {
  ensureAudio(); if (!music.ctx) return;
  music.on = on; $('#musicBtn').classList.toggle('on', on);
  const g = music.master.gain, now = music.ctx.currentTime;
  g.cancelScheduledValues(now); g.setValueAtTime(Math.max(g.value, .0001), now);
  if (on) {
    g.exponentialRampToValueAtTime(music.ducked ? .0001 : .7, now + .6);
    clearTimeout(music.timer); if (music.pass) music.pass.disconnect(); schedulePass();
  } else {
    g.exponentialRampToValueAtTime(.0001, now + .4); clearTimeout(music.timer);
    setTimeout(() => { if (!music.on && music.pass) { music.pass.disconnect(); music.pass = null; } }, 450);
  }
}
function duck(d) {
  music.ducked = d; if (!music.ctx || !music.on) return;
  const g = music.master.gain, now = music.ctx.currentTime;
  g.cancelScheduledValues(now); g.setValueAtTime(Math.max(g.value, .0001), now);
  g.exponentialRampToValueAtTime(d ? .0001 : .7, now + .5);
}
$('#musicBtn').addEventListener('click', () => setMusic(!music.on));

/* =============== CRIPTO =============== */
let MK = null;
const hexToBytes = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
async function unlock(pin) {
  const b = new Uint8Array(await (await fetch('data/key.bin', { cache: 'no-store' })).arrayBuffer());
  const salt = b.slice(8, 16), ct = b.slice(16);
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, 384));
  const k = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-CBC', false, ['decrypt']);
  let txt;
  try { txt = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-CBC', iv: bits.slice(32, 48) }, k, ct)); }
  catch { return false; }
  if (!txt.startsWith('CAMI:')) return false;
  MK = await crypto.subtle.importKey('raw', hexToBytes(txt.slice(5, 69)), 'AES-CBC', false, ['decrypt']);
  return true;
}
async function dec(name) {
  const b = new Uint8Array(await (await fetch('data/' + name + '.bin')).arrayBuffer());
  return crypto.subtle.decrypt({ name: 'AES-CBC', iv: b.slice(0, 16) }, MK, b.slice(16));
}
const blobCache = {};
function blobUrl(name, type) {
  return blobCache[name] ||= dec(name).then(buf => URL.createObjectURL(new Blob([buf], { type })));
}

/* =============== PIN =============== */
let digits = '', busy = false, fails = 0;
const pinEl = $('#pin'), msg = $('#pinMsg'), slots = $$('#pin i');
function renderPin() { slots.forEach((s, i) => { s.textContent = digits[i] || ''; s.classList.toggle('f', i < digits.length); }); }
function press(k) {
  if (busy) return;
  ensureAudio();
  if (k === 'del') digits = digits.slice(0, -1);
  else if (k === 'hint') { msg.textContent = 'Pista: el día, el mes y el año en que llegaste al mundo 💙'; return; }
  else if (digits.length < 8) digits += k;
  renderPin();
  if (music.ctx) marimba(music.ctx.destination, music.ctx.currentTime, hz(72 + digits.length * 2), .12, .4);
  if (digits.length === 8) check();
}
async function check() {
  busy = true; msg.textContent = 'Comprobando… ✨';
  let ok = false;
  try { ok = await unlock(digits); }
  catch (e) { msg.textContent = 'Uy, algo falló al abrir el regalo. Revisa tu conexión e inténtalo otra vez.'; busy = false; digits = ''; renderPin(); return; }
  if (!ok) {
    fails++;
    const m = ['Mmm… esa no es 🙈', 'Casi casi… piensa en tu día especial 🎂', 'Pista: día / mes / año en que naciste 💙'];
    msg.textContent = m[Math.min(fails - 1, 2)];
    pinEl.classList.remove('bad'); void pinEl.offsetWidth; pinEl.classList.add('bad');
    $('#gift').classList.remove('wiggle'); void $('#gift').offsetWidth; $('#gift').classList.add('wiggle');
    await sleep(600); digits = ''; renderPin(); busy = false; return;
  }
  pinEl.classList.add('ok'); msg.textContent = '¡Es correcto! 🎉';
  openGift();
}
$('#keypad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) press(b.dataset.k || b.textContent.trim()); });
addEventListener('keydown', e => {
  if ($('#lock').hidden) return;
  if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del');
});

async function openGift() {
  const contentP = dec('content').then(b => new TextDecoder().decode(b));
  await sleep(500);
  $('#gift').classList.add('open');
  confetti(W / 2, H * .3, 160);
  await sleep(1300);
  $('#lock').classList.add('out');
  await sleep(700);
  $('#lock').hidden = true;
  const op = $('#opening'); op.hidden = false;
  const html = await contentP;
  const app = $('#app'); app.innerHTML = html;
  const imgs = $$('img[data-enc]', app), total = imgs.length; let done = 0;
  const bar = $('#barFill'); bar.style.width = '8%';
  await Promise.all(imgs.map(img => blobUrl(img.dataset.enc, 'image/jpeg').then(u => { img.src = u; bar.style.width = (8 + 92 * ++done / total) + '%'; })));
  await sleep(350);
  op.hidden = true; app.hidden = false; $('#musicBtn').hidden = false;
  scrollTo(0, 0);
  init();
  setMusic(true);
  confetti(W / 2, H * .45, 200, 1.2);
  setTimeout(() => fireworks(3), 600);
}

/* =============== CONTENIDO =============== */
function init() {
  const data = JSON.parse($('#giftData').textContent);

  // Nombre letra por letra
  const nm = $('#heroName'); const word = nm.textContent;
  nm.innerHTML = [...word].map((ch, i) => `<span style="animation-delay:${.5 + i * .12}s">${ch}</span>`).join('');

  // Aparición al hacer scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  $$('.pola').forEach((el, i) => el.style.transitionDelay = (i % 4) * .08 + 's');

  // Contadores
  const day = 864e5, now = new Date();
  $('#daysAlive').dataset.to = Math.floor((now - new Date(2003, 9, 15)) / day);
  $('#daysTogether').dataset.to = Math.floor((now - new Date(2026, 1, 11)) / day);
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = 1800;
    (function f(t) { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - (1 - k) ** 3)).toLocaleString('es'); if (k < 1) requestAnimationFrame(f); })(t0);
  }), { threshold: .5 });
  $$('.count').forEach(el => cio.observe(el));

  // Carta
  const env = $('#envelope');
  const openEnv = async () => {
    if (env.classList.contains('open')) return;
    env.classList.add('open'); $('#envHint').textContent = '💌';
    confetti(env.getBoundingClientRect().left + env.offsetWidth / 2, env.getBoundingClientRect().top, 60, .7);
    await sleep(1400);
    const letter = $('#letter'); letter.hidden = false;
    letter.scrollIntoView({ behavior: 'smooth', block: 'start' });
    for (const p of $$('p', letter)) { await sleep(650); p.classList.add('in'); }
  };
  env.addEventListener('click', openEnv);
  env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnv(); } });

  // Galería + lightbox
  const polas = $$('.pola'); let cur = 0;
  const lb = $('#lightbox');
  const show = i => { cur = (i + polas.length) % polas.length; const im = $('img', polas[cur]); $('#lbImg').src = im.src; $('#lbImg').style.animation = 'none'; void $('#lbImg').offsetWidth; $('#lbImg').style.animation = ''; $('#lbCap').textContent = polas[cur].dataset.cap; };
  polas.forEach((p, i) => p.addEventListener('click', () => { show(i); lb.hidden = false; }));
  $('.lb-close', lb).onclick = () => lb.hidden = true;
  $('.prev', lb).onclick = () => show(cur - 1);
  $('.next', lb).onclick = () => show(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lb.hidden = true; });
  let sx = null;
  lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') lb.hidden = true; if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });

  // 23 razones
  const rbox = $('#reasons'), seen = new Set();
  data.reasons.forEach(([emo, txt], i) => {
    const b = document.createElement('button'); b.className = 'rcard reveal';
    b.innerHTML = `<div class="inner"><div class="f"><b>${i + 1}</b><small>TOCA</small></div><div class="b"><span>${emo}</span>${txt}</div></div>`;
    b.addEventListener('click', () => {
      b.classList.toggle('flip'); seen.add(i); $('#flipCount').textContent = seen.size;
      if (seen.size === data.reasons.length && !rbox.dataset.done) { rbox.dataset.done = 1; const r = b.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 160); }
    });
    rbox.appendChild(b); io.observe(b);
  });

  // Videos
  const reels = $$('.reel');
  reels.forEach((r, i) => { r.innerHTML = `<div class="loading">Cargando… 🎞️</div><span class="num">${i + 1}</span>`; });
  (async () => {
    for (const r of reels) {
      try {
        const u = await blobUrl(r.dataset.v, 'video/mp4');
        const v = document.createElement('video');
        v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'metadata'; v.src = u + '#t=0.1';
        const btn = document.createElement('button'); btn.className = 'play'; btn.setAttribute('aria-label', 'Reproducir'); btn.innerHTML = '<i>▶</i>';
        r.innerHTML = ''; r.append(v, btn); r.insertAdjacentHTML('beforeend', `<span class="num">${reels.indexOf(r) + 1}</span>`);
        const toggle = () => {
          if (v.paused) { $$('video').forEach(o => o !== v && o.pause()); v.play(); } else v.pause();
        };
        btn.onclick = toggle; v.onclick = toggle;
        v.onplay = () => { r.classList.add('playing'); duck(true); };
        v.onpause = v.onended = () => { r.classList.remove('playing'); if (!$$('video').some(o => !o.paused)) duck(false); };
      } catch { r.querySelector('.loading').textContent = 'No se pudo cargar 😢'; }
    }
  })();

  // Chat animado
  const chat = $('#chat'), bubs = $$('.bub', chat);
  bubs.forEach(b => b.hidden = true);
  const chatIO = new IntersectionObserver(async es => {
    if (!es[0].isIntersecting) return; chatIO.disconnect();
    for (const b of bubs) {
      let ty = null;
      if (b.classList.contains('her')) { ty = document.createElement('div'); ty.className = 'typing'; ty.innerHTML = '<span></span><span></span><span></span>'; chat.insertBefore(ty, b); await sleep(900); ty.remove(); }
      else await sleep(500);
      b.hidden = false; void b.offsetWidth; b.classList.add('in');
      await sleep(550);
    }
  }, { threshold: .3 });
  chatIO.observe(chat);

  // Abra cuando…
  const modal = $('#modal');
  $$('.ow').forEach(b => b.addEventListener('click', () => {
    const [t, x] = data.openWhen[+b.dataset.ow];
    $('#modalTitle').textContent = t; $('#modalText').textContent = x; modal.hidden = false;
  }));
  $('.lb-close', modal).onclick = () => modal.hidden = true;
  modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });

  // Respiración
  const bc = $('#breathe'), bt = $('#breatheTxt'); let bOn = false, bTimer;
  const cycle = async () => {
    const steps = [['inhale', 'Inhala…', 4000], ['inhale', 'Sostén…', 4000], ['exhale', 'Exhala…', 6000]];
    while (bOn) for (const [c, t, ms] of steps) {
      if (!bOn) return;
      bc.className = 'breathe-circle ' + c; bt.textContent = t;
      await new Promise(r => bTimer = setTimeout(r, ms));
    }
  };
  bc.addEventListener('click', () => {
    bOn = !bOn; clearTimeout(bTimer);
    if (bOn) cycle(); else { bc.className = 'breathe-circle'; bt.textContent = 'Toque aquí'; }
  });

  // Vales
  let used = {}; try { used = JSON.parse(localStorage.getItem('vales-cami') || '{}'); } catch {}
  const cbox = $('#coupons');
  data.coupons.forEach(([ic, t, d], i) => {
    const el = document.createElement('div'); el.className = 'coupon reveal' + (used[i] ? ' used' : '');
    el.innerHTML = `<div class="ic">${ic}</div><div><h4>${t}</h4><p>${d}</p><button>Canjear</button></div><div class="stamp">¡CANJEADO!<br><small>${used[i] || ''}</small></div>`;
    $('button', el).onclick = e => {
      const f = new Date().toLocaleDateString('es-EC'); used[i] = f;
      try { localStorage.setItem('vales-cami', JSON.stringify(used)); } catch {}
      $('.stamp small', el).textContent = f; el.classList.add('used');
      confetti(e.clientX, e.clientY, 70, .7);
    };
    cbox.appendChild(el); io.observe(el);
  });

  // Pastel
  const candles = $$('.candle'), blowBtn = $('#blowBtn');
  const checkCandles = () => {
    if (!candles.every(c => c.classList.contains('out'))) return;
    blowBtn.hidden = true;
    setTimeout(() => {
      $('#finale').hidden = false; fireworks(7);
      const r = $('#cake').getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 220, 1.2);
      $('#finale').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 700);
  };
  candles.forEach(c => c.addEventListener('click', () => { c.classList.add('out'); checkCandles(); }));
  blowBtn.onclick = async () => { for (const c of candles) { c.classList.add('out'); await sleep(350); } checkCandles(); };
  $('#againBtn').onclick = () => { fireworks(5); confetti(W / 2, H / 2, 150); };
}
})();
