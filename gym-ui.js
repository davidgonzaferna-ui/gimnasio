const G = window.GYMF;
dash.onData(() => {
  const e = dash.data('entrenos');
  if (e.status === 'loading') return;
  const hay = e.status === 'ok' && Array.isArray(e.data) && e.data.length > 0;
  document.querySelectorAll('#gym-cuerpo').forEach((n) => { n.hidden = !hay; });
  document.querySelectorAll('#lede-vacio').forEach((n) => { n.hidden = hay || e.status === 'error'; });
  const h = G.hoy();
  const nHoy = hay ? e.data.filter((r) => r.fecha === h && r.ejercicio !== '_registro').length : 0;
  document.querySelectorAll('#hoy-vacio').forEach((n) => { n.hidden = nHoy > 0; });
  const p = dash.data('perfil');
  if (p.status !== 'loading') { const yo = Array.isArray(p.data) && p.data[0] ? p.data[0] : {}; document.querySelectorAll('#sin-peso').forEach((n) => { n.hidden = Number(yo.peso) > 0; }); }
});
const uno = (id, campo, fmt) => (el) => { const r = G.rows(id); el.textContent = r && r.length ? fmt(r[0][campo]) : '—'; };
dash.draw('sem_n', uno('semana_actual', 'entrenos', (v) => String(v)));
dash.draw('objetivo', (el) => { el.textContent = String(window.GYM_OBJETIVO); });
dash.draw('fatiga', (el) => { el.textContent = G.num1(window.GYM_FATIGA * 100) + ' %'; });
dash.draw('fatiga4', (el) => { el.textContent = G.num1(window.GYM_FATIGA * 300) + ' %'; });
dash.draw('leyenda', (el) => {
  el.replaceChildren();
  for (const c of G.CLASES) { const s = document.createElement('span'); s.style.background = c.color; s.style.color = c.texto; s.textContent = c.nombre; el.appendChild(s); }
});
const mkEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const marca = (e, src, field, where) => { e.dataset.source = src; e.dataset.field = field; if (where) e.dataset.where = where; else e.dataset.row = '0'; return e; };

window.GYM_ICONOS = {"mancuerna": "M1 10h2v4H1zM3.5 7h3.5v10H3.5zM7 11h10v2H7zM17 7h3.5v10H17zM21 10h2v4h-2z", "pesa": "M8 3h8a2 2 0 0 1 2 2v3.2A7.5 7.5 0 1 1 6 8.2V5a2 2 0 0 1 2-2zm1 2.2v1.9a7.5 7.5 0 0 1 6 0V5.2z", "escudo": "M12 2l8.5 3v6.5c0 5-3.6 9.1-8.5 10.5-4.9-1.4-8.5-5.5-8.5-10.5V5z", "espadas": "M3 2h3l9 9-3 3-9-9zM21 2h-3l-9 9 3 3 9-9zM5.5 14.5l2 2-3 3 1 1-1.5 1.5-3-3L2.5 17.5l1 1zM18.5 14.5l-2 2 3 3-1 1 1.5 1.5 3-3-1.5-1.5-1 1z", "yelmo": "M12 2C6.5 2 4 6.5 4 11v6l4 4h3v-7H7v-2.5h10V14h-4v7h3l4-4v-6c0-4.5-2.5-9-8-9z", "laurel": "M12 1.5l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.3l-6.4 3.6 1.5-7.1L1.7 8.9l7.2-.8z", "martillo": "M3 3h13l3 3v4h-6v12h-4V10H3z", "trofeo": "M6 2h12v2h4v3a5 5 0 0 1-5 5h-.5A5 5 0 0 1 13 15v3h4v4H7v-4h4v-3a5 5 0 0 1-3.5-3H7a5 5 0 0 1-5-5V4h4zM4 6v1a3 3 0 0 0 2 2.8V6zm16 0h-2v3.8A3 3 0 0 0 20 7z", "rayo": "M14 1L3 14h7.5L9 23l12-14h-7.5z", "corona": "M2 6l5 5 5-8 5 8 5-5-2 14H4zM4 21h16v2H4z"};
const icono = (nombre, size, color) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', window.GYM_ICONOS[nombre] || ''); p.setAttribute('fill-rule', 'evenodd'); p.setAttribute('fill', color || 'currentColor'); s.appendChild(p); return s;
};
dash.draw('pj', (el) => {
  el.replaceChildren();
  const r = (G.rows('rpg') || [])[0];
  if (!r) { G.fallo(el, 'rpg'); return; }
  const T = window.GYM_TIERS, t = T[r.categoria - 1];
  const top = mkEl('div', 'g-pj-top');
  const esc = mkEl('div', 'g-pj-escudo'); esc.style.background = t.color;
  esc.append(icono(t.icono, 26, '#1a1e23'), marca(mkEl('b', '', String(r.nivel)), 'rpg', 'nivel'));
  const txt = mkEl('div', 'g-pj-txt');
  txt.append(mkEl('div', 'g-pj-cat', `Categoría ${r.categoria} de ${T.length}`), marca(mkEl('div', 'g-pj-tit', r.titulo), 'rpg', 'titulo'));
  const bar = mkEl('div', 'g-xpbar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', 'Experiencia para el siguiente nivel'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(r.xp_necesaria)); bar.setAttribute('aria-valuenow', String(r.xp_nivel));
  const f = mkEl('span'); f.style.width = Math.min(100, (r.xp_nivel / r.xp_necesaria) * 100) + '%'; bar.appendChild(f);
  const sub = mkEl('div', 'g-pj-sub');
  sub.append(marca(mkEl('b', '', G.num1(r.xp_nivel)), 'rpg', 'xp_nivel'), ' / ', marca(mkEl('span', '', G.num1(r.xp_necesaria)), 'rpg', 'xp_necesaria'), ` XP para el nivel ${r.nivel + 1}`);
  txt.append(bar, sub);
  top.append(esc, txt);
  const camino = mkEl('div', 'g-camino'); camino.setAttribute('role', 'list'); camino.setAttribute('aria-label', 'Categorías');
  T.forEach((x, i) => {
    const on = i < r.categoria;
    const c = mkEl('div', 'g-cam' + (on ? ' on' : '') + (i === r.categoria - 1 ? ' act' : '')); c.setAttribute('role', 'listitem');
    c.title = `${x.titulo} (nivel ${x.nv})`; c.setAttribute('aria-label', `${x.titulo}, desde el nivel ${x.nv}${on ? '' : ', bloqueada'}`);
    const b = mkEl('span', 'g-cam-ic'); if (on) b.style.background = x.color; b.appendChild(icono(x.icono, 16, on ? '#1a1e23' : '#5b636b'));
    c.append(b, mkEl('small', '', String(x.nv))); camino.appendChild(c);
  });
  const prox = mkEl('div', 'g-pj-sub', r.siguiente ? `Siguiente categoría: ${r.siguiente}, en el nivel ${r.siguiente_nv}.` : 'Has llegado a la categoría más alta.');
  const st = mkEl('div', 'g-pj-stats');
  const ATR = [['fuerza', 'Fuerza', '#e2463b', 'Media de tus clases de músculo'], ['constancia', 'Constancia', '#3a75e6', 'Semanas con 4 entrenos o más, de las últimas 8'], ['aguante', 'Aguante', '#25a866', 'Series por semana del último mes frente a 80'], ['equilibrio', 'Equilibrio', '#a77bff', 'Tu grupo más flojo frente al más fuerte'], ['racha', 'Racha', '#f59e30', `${r.racha_semanas} semanas seguidas con 4 entrenos o más`], ['superacion', 'Superación', '#f5c330', `${r.records_mes} récords en las últimas 4 semanas`]];
  for (const [k, lab, col, ayuda] of ATR) {
    const s = mkEl('div', 'g-stat'); s.title = ayuda;
    const l = mkEl('div', 'g-stat-l'); l.append(lab, marca(mkEl('b', '', String(r[k])), 'rpg', k));
    const b = mkEl('div', 'g-stat-b'); const i = mkEl('span'); i.style.width = r[k] + '%'; i.style.background = col; b.appendChild(i);
    s.append(l, b, mkEl('small', '', ayuda)); st.appendChild(s);
  }
  el.append(top, camino, prox, st);
});

dash.draw('semana', (el) => {
  el.replaceChildren();
  const map = new Map((G.rows('dias') || []).map((d) => [d.fecha, d]));
  const h = G.hoy(), lun = G.lunes(h), L = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const W = Math.max(280, el.clientWidth || 600), H = 150, cy = 58, pad = 14;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Esta semana: cada disco es un día entrenado');
  const t = G.tip(el);
  const x0 = pad + 26, x1 = W - pad - 26, step = (x1 - x0) / 6;
  svg.append('rect').attr('x', 0).attr('y', cy - 5).attr('width', W).attr('height', 10).attr('rx', 5).style('fill', '#9aa3ad');
  svg.append('rect').attr('x', 0).attr('y', cy - 5).attr('width', W).attr('height', 3).attr('rx', 2).style('fill', '#fff').style('opacity', 0.25);
  for (const cx of [10, W - 16]) svg.append('rect').attr('x', cx).attr('y', cy - 14).attr('width', 6).attr('height', 28).attr('rx', 2).style('fill', '#c3c9cf');
  const pw = Math.max(16, Math.min(40, step * 0.42));
  for (let i = 0; i < 7; i++) {
    const f = G.addDias(lun, i), d = map.get(f), cx = x0 + i * step, fut = f > h;
    const g = svg.append('g').attr('role', 'img');
    if (d) {
      const ph = 62 + Math.min(1, (d.series || 10) / 22) * 44;
      const col = G.diaColor(d.dia);
      g.append('rect').attr('x', cx - pw / 2).attr('y', cy - ph / 2).attr('width', pw).attr('height', ph).attr('rx', 6).style('fill', col);
      g.append('rect').attr('x', cx - pw / 2 + 3).attr('y', cy - ph / 2 + 4).attr('width', Math.max(3, pw * 0.18)).attr('height', ph - 8).attr('rx', 2).style('fill', '#fff').style('opacity', 0.22);
      g.append('rect').attr('x', cx - 3).attr('y', cy - 6).attr('width', 6).attr('height', 12).attr('rx', 2).style('fill', '#1a1e23').style('opacity', 0.35);
    } else {
      g.append('rect').attr('x', cx - pw / 2 + 2).attr('y', cy - 34).attr('width', pw - 4).attr('height', 68).attr('rx', 6).style('fill', 'none').style('stroke', fut ? '#2d343c' : '#4b545e').style('stroke-width', 2).style('stroke-dasharray', fut ? '0' : '4 4');
    }
    const lbl = d ? `${G.fechaDia(f)}: ${d.dia || 'Entreno'}${d.series ? `, ${d.series} series` : ''}` : `${G.fechaDia(f)}: ${fut ? 'por llegar' : 'sin entreno'}`;
    g.attr('aria-label', lbl);
    g.append('rect').attr('x', cx - step / 2).attr('y', 0).attr('width', step).attr('height', H).style('fill', 'transparent')
      .on('mousemove click', (ev) => { const [px, py] = d3.pointer(ev, el); t.show(px, py, lbl); }).on('mouseleave', () => t.hide());
    svg.append('text').attr('x', cx).attr('y', H - 24).attr('text-anchor', 'middle').attr('class', f === h ? 'hoy' : null).text(L[i]);
    svg.append('text').attr('x', cx).attr('y', H - 6).attr('text-anchor', 'middle').attr('class', f === h ? 'hoy' : null).style('opacity', fut ? 0.5 : 1).text(String(+f.slice(8, 10)));
    if (f === h) svg.append('circle').attr('cx', cx).attr('cy', H - 40).attr('r', 3).style('fill', '#f5c330');
  }
});

dash.draw('misiones', (el) => {
  el.replaceChildren();
  const rows = G.rows('misiones');
  if (!rows) { G.fallo(el, 'misiones'); return; }
  for (const m of rows) {
    const li = mkEl('li', m.valor >= m.meta ? 'hecha' : '');
    const ck = mkEl('span', 'g-ck', m.valor >= m.meta ? '✓' : '');
    const tx = mkEl('div', 'g-mis-t'); tx.append(mkEl('span', '', m.mision));
    const b = mkEl('div', 'g-stat-b'); const i = mkEl('span'); i.style.width = Math.min(100, (m.valor / m.meta) * 100) + '%'; b.appendChild(i); tx.appendChild(b);
    const v = mkEl('span', 'g-mis-v'); v.append(marca(mkEl('b', '', String(m.valor)), 'misiones', 'valor', 'id=' + m.id), `/${m.meta}`);
    const xp = mkEl('span', 'g-mis-xp', `+${m.xp} XP`);
    li.append(ck, tx, v, xp); el.appendChild(li);
  }
});

const COLOR_BAS = {'press-banca': '#e2463b', sentadilla: '#f5c330', 'peso-muerto': '#3a75e6'};
dash.draw('basicos_mini', (el) => {
  el.replaceChildren();
  const rows = G.rows('basicos_estado');
  if (!rows) { G.fallo(el, 'basicos_estado'); return; }
  for (const b of rows) {
    const c = mkEl('div', 'g-bmini'); c.style.setProperty('--c', COLOR_BAS[b.ejercicio] || '#f5c330');
    const w = 'id=' + encodeURIComponent(b.id);
    const v = mkEl('div', 'g-bmini-v'); v.append(marca(mkEl('span', '', G.num1(b.record)), 'basicos_estado', 'record', w), mkEl('small', '', 'kg'));
    const m = mkEl('div', 'g-bmini-s'); m.append('meta ', marca(mkEl('span', '', G.num1(b.meta)), 'basicos_estado', 'meta', w));
    const bar = mkEl('div', 'g-stat-b'); const i = mkEl('span'); i.style.width = Math.min(100, b.pct_meta || 0) + '%'; i.style.background = 'var(--c)'; bar.appendChild(i);
    c.append(mkEl('div', 'g-bmini-n', b.nombre), v, bar, m);
    el.appendChild(c);
  }
});

dash.draw('grupos', (el) => {
  el.replaceChildren();
  const rows = G.rows('grupos');
  if (!rows) { G.fallo(el, 'grupos'); return; }
  for (const g of rows) {
    const k = g.nivel == null ? null : G.clase(g.nivel);
    const c = mkEl('div', 'g-grupo');
    if (k) { c.style.background = k.color; c.style.color = k.texto; }
    const w = 'grupo=' + encodeURIComponent(g.grupo);
    c.append(mkEl('div', 'g-grupo-n', g.grupo), marca(mkEl('div', 'g-grupo-c', g.clase), 'grupos', 'clase', w));
    if (k) { const s = mkEl('div', 'g-grupo-s'); s.append('Nivel ', marca(mkEl('span', '', G.num1(g.nivel)), 'grupos', 'nivel', w), ' de 5'); c.appendChild(s); }
    el.appendChild(c);
  }
});

window.gymModo = window.gymModo || 'dia';
window.gymSel = window.gymSel || {};
const opcionesProg = () => {
  if (window.gymModo === 'musc') return (G.rows('progreso_actual') || []).map((r) => r.musculo);
  const ds = [...new Set((G.rows('progreso_dia') || []).map((r) => r.dia))];
  const ORDEN_DIAS = window.GYM_NOMBRES_DIA();
  return ds.sort((a, b) => ((ORDEN_DIAS.indexOf(a) + 1 || 99) - (ORDEN_DIAS.indexOf(b) + 1 || 99)) || a.localeCompare(b));
};
const elegidoProg = () => { const ops = opcionesProg(); const m = window.gymModo; if (!ops.includes(window.gymSel[m])) window.gymSel[m] = ops[0] || null; return window.gymSel[m]; };
document.querySelectorAll('#seg-dia, #seg-musc').forEach((b) => b.addEventListener('click', () => {
  window.gymModo = b.id === 'seg-musc' ? 'musc' : 'dia';
  document.querySelectorAll('#seg-dia').forEach((x) => { x.classList.toggle('on', window.gymModo === 'dia'); x.setAttribute('aria-pressed', String(window.gymModo === 'dia')); });
  document.querySelectorAll('#seg-musc').forEach((x) => { x.classList.toggle('on', window.gymModo === 'musc'); x.setAttribute('aria-pressed', String(window.gymModo === 'musc')); });
  dash.draw('sel_prog'); dash.draw('evolucion');
}));
dash.draw('sel_prog', (sel) => {
  const ops = opcionesProg(); const v = elegidoProg();
  sel.replaceChildren(...ops.map((x) => new Option(x, x)));
  if (v) sel.value = v;
  sel.onchange = () => { window.gymSel[window.gymModo] = sel.value; dash.draw('evolucion'); };
});
dash.draw('evolucion', (el) => {
  el.replaceChildren();
  const v = elegidoProg();
  const vacio = (txt) => { const p = mkEl('div', 'g-vacio'); p.append(mkEl('b', '', 'Aún no hay nada que comparar'), mkEl('span', '', txt)); el.appendChild(p); };
  let pts = [], o = {};
  if (window.gymModo === 'musc') {
    const all = G.rows('progreso'); if (!all) { G.fallo(el, 'progreso'); return; }
    pts = all.filter((r) => r.musculo === v).map((r) => ({d: new Date(r.semana + 'T00:00:00Z'), v: r.progreso_pct, f: r.semana})).sort((a, b) => a.d - b.d);
    o = {aria: `Progreso semanal de ${v}`, color: '#f5c330', tip: (p) => `Semana del ${G.fechaCorta(p.f)}: ${G.pct(p.v)}`};
    if (pts.length < 2) { vacio(`Esta semana es la primera desde la base. La semana que viene verás aquí cuánto ha subido ${v || 'cada músculo'}.`); return; }
  } else {
    const all = G.rows('progreso_dia'); if (!all) { G.fallo(el, 'progreso_dia'); return; }
    pts = all.filter((r) => r.dia === v).map((r) => ({d: new Date(r.fecha + 'T00:00:00Z'), v: r.progreso_pct, f: r.fecha, n: r.ejercicios})).sort((a, b) => a.d - b.d);
    const c = G.diaColor(v);
    o = {aria: `Progreso de las sesiones de ${v}`, color: c === '#e9e5dc' ? '#f5c330' : c, tip: (p) => `${G.fechaDia(p.f)}: ${G.pct(p.v)} (${p.n} ejercicios)`};
    if (pts.length < 2) { vacio(v ? `Tu ${v} del ${G.fechaCorta(pts.length ? pts[0].f : '')} es el punto de partida (0 %). En el próximo ${v} verás aquí si subes o bajas.` : 'Termina un entreno y aquí empezará tu línea de progreso.'); return; }
  }
  G.linea(el, pts, o);
});

window.gymMes = window.gymMes || G.hoy().slice(0, 7);
const moverMes = (n) => { const [y, m] = window.gymMes.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); window.gymMes = d.toISOString().slice(0, 7); dash.draw('cal'); };
document.querySelectorAll('#cal-prev').forEach((b) => b.addEventListener('click', () => moverMes(-1)));
document.querySelectorAll('#cal-next').forEach((b) => b.addEventListener('click', () => moverMes(1)));
dash.draw('cal', (el) => {
  el.replaceChildren();
  const map = new Map((G.rows('dias') || []).map((d) => [d.fecha, d]));
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const [y, m] = window.gymMes.split('-').map(Number), h = G.hoy();
  const ini = `${window.gymMes}-01`, nDias = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const hueco = (new Date(ini + 'T00:00:00Z').getUTCDay() + 6) % 7;
  let n = 0; for (let i = 1; i <= nDias; i++) if (map.has(`${window.gymMes}-${String(i).padStart(2, '0')}`)) n++;
  const head = mkEl('div', 'g-cal-head'); head.append(mkEl('b', '', `${MESES[m - 1]} ${y}`), mkEl('span', '', n === 1 ? '1 entreno' : `${n} entrenos`));
  const grid = mkEl('div', 'g-cal-grid');
  for (const l of ['L', 'M', 'X', 'J', 'V', 'S', 'D']) grid.appendChild(mkEl('span', 'g-cal-dow', l));
  for (let i = 0; i < hueco; i++) grid.appendChild(mkEl('span', 'g-cal-x'));
  for (let i = 1; i <= nDias; i++) {
    const f = `${window.gymMes}-${String(i).padStart(2, '0')}`, d = map.get(f);
    const c = mkEl('span', 'g-cal-d' + (f === h ? ' hoy' : '') + (f > h ? ' fut' : ''), String(i));
    if (d) { const col = G.diaColor(d.dia); c.classList.add('on'); c.style.background = col; c.style.color = col === '#e9e5dc' || col === '#f5c330' ? '#1a1e23' : '#fff'; c.title = `${G.fechaDia(f)}: ${d.dia || 'Entreno'}`; }
    c.setAttribute('aria-label', d ? `${G.fechaDia(f)}: ${d.dia || 'entreno'}` : `${G.fechaDia(f)}: descanso`);
    grid.appendChild(c);
  }
  el.append(head, grid);
});

dash.draw('historial', (el) => {
  el.replaceChildren();
  const rows = G.rows('entrenos_hist'), ses = G.rows('sesiones_ejercicio') || [];
  if (!rows) { G.fallo(el, 'entrenos_hist'); return; }
  const recs = new Set((G.rows('prs') || []).map((p) => p.id));
  for (const r of rows.slice(0, 12)) {
    const d = mkEl('details', 'g-ent');
    const s = mkEl('summary');
    const dot = mkEl('i', 'g-ent-dot'); dot.style.background = G.diaColor(r.dia);
    const t = mkEl('div', 'g-ent-t'); t.append(mkEl('b', '', r.dia || 'Entreno'), mkEl('span', '', G.fechaDia(r.fecha)));
    const meta = mkEl('div', 'g-ent-m'); meta.append(`${r.ejercicios} ${r.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}, ${r.series} ${r.series === 1 ? 'serie' : 'series'}`);
    if (r.records) meta.appendChild(mkEl('span', 'g-pr', r.records === 1 ? '1 récord' : `${r.records} récords`));
    s.append(dot, t, meta); d.appendChild(s);
    const ul = mkEl('ul');
    for (const x of ses.filter((q) => q.fecha === r.fecha).sort((a, b) => a.orden - b.orden)) {
      const li = mkEl('li'); li.append(mkEl('span', '', x.nombre), mkEl('span', 'g-ent-s', x.series_txt));
      if (recs.has(x.id)) li.appendChild(mkEl('span', 'g-pr', 'récord'));
      ul.appendChild(li);
    }
    d.appendChild(ul); el.appendChild(d);
  }
});

const fila = (tb, key, cells) => { const tr = document.createElement('tr'); tr.dataset.key = encodeURIComponent(key); for (const [txt, cls] of cells) { const td = document.createElement('td'); td.append(txt); if (cls) td.className = cls; tr.appendChild(td); } tb.appendChild(tr); };
dash.draw('tabla_reparto', (tb) => {
  tb.replaceChildren();
  const s = G.rows('reparto');
  if (!s) return;
  for (const r of s) fila(tb, r.id, [[r.nombre], [r.dias], [r.reparto]]);
});
dash.draw('plan', (el) => {
  el.replaceChildren();
  const rows = G.rows('ultimo_por_dia');
  if (!rows) { G.fallo(el, 'ultimo_por_dia'); return; }
  const hoyDia = window.GYM_DIA_HOY();
  for (const dia of window.GYM_NOMBRES_DIA()) {
    const ej = rows.filter((r) => r.dia === dia).sort((a, b) => a.orden - b.orden);
    const d = mkEl('details', 'g-ent g-plan'); if (dia === hoyDia) d.open = true;
    const s = mkEl('summary');
    const dot = mkEl('i', 'g-ent-dot'); dot.style.background = G.diaColor(dia);
    const t = mkEl('div', 'g-ent-t'); t.append(mkEl('b', '', dia + (dia === hoyDia ? ' (toca hoy)' : '')), mkEl('span', '', ej.length ? `Última vez: ${G.fechaDia(ej[0].fecha)}` : 'Aún no lo has hecho'));
    const m = mkEl('div', 'g-ent-m');
    const nSub = ej.filter((r) => r.accion === 'subir').length;
    if (nSub) m.appendChild(mkEl('span', 'g-sube-n', nSub === 1 ? '1 para subir' : `${nSub} para subir`));
    s.append(dot, t, m); d.appendChild(s);
    const ul = mkEl('ul', 'g-plan-l');
    for (const r of ej) {
      const li = mkEl('li', 'g-plan-i ' + r.accion);
      const a = mkEl('div', 'g-plan-n'); a.append(mkEl('b', '', r.nombre), mkEl('span', 'g-ent-s', r.series_txt));
      const w = 'id=' + encodeURIComponent(r.id);
      const ch = mkEl('div', 'g-chip-acc');
      if (r.accion === 'subir') ch.append('↑ Sube a ', marca(mkEl('b', '', G.num1(r.sugerido) + ' kg'), 'ultimo_por_dia', 'sugerido', w));
      else if (r.accion === 'bajar') ch.append('↓ Baja a ', marca(mkEl('b', '', G.num1(r.sugerido) + ' kg'), 'ultimo_por_dia', 'sugerido', w));
      else ch.append(`Mantén ${G.num1(r.peso)} kg y busca ${r.reps + 1} reps`);
      li.append(a, ch); ul.appendChild(li);
    }
    if (!ej.length) ul.appendChild(mkEl('li', 'g-plan-vacio', 'Cuando termines tu primer entreno de este día, aquí verás sus pesos.'));
    d.appendChild(ul); el.appendChild(d);
  }
});
dash.draw('leyenda_dias', (el) => {
  el.replaceChildren();
  for (const d of window.GYM_RUTINA().dias) { const s = mkEl('span'); const i = mkEl('i'); i.style.background = d.color || '#6b737c'; s.append(i, d.nombre); el.appendChild(s); }
  const nombres = new Set(window.GYM_NOMBRES_DIA());
  if ((G.rows('dias') || []).some((d) => d.dia && !nombres.has(String(d.dia).split(' + ')[0]))) { const s = mkEl('span'); const i = mkEl('i'); i.style.background = '#6b737c'; s.append(i, 'Otros'); el.appendChild(s); }
});
