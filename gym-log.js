const A = window.GYMF;
window.gymDraft = null;
const ejs = () => A.rows('ejercicios') || [];
const ents = () => (A.rows('entrenos') || []).filter((r) => r.ejercicio !== '_registro');
const vis = (sel, on) => document.querySelectorAll(sel).forEach((n) => { n.hidden = !on; });
const valorDe = (sel) => { let v = ''; document.querySelectorAll(sel).forEach((n) => { v = n.value; }); return v; };
const diaPorDefecto = (ejId) => {
  const h = A.hoy(); const r = ents().find((x) => x.fecha === h && x.dia);
  if (r) return r.dia;
  const e = ejs().find((x) => x.id === ejId);
  const nombres = window.GYM_NOMBRES_DIA(), hoyDia = window.GYM_DIA_HOY();
  if (hoyDia) return hoyDia;
  const d = e && e.dias ? String(e.dias).split(',').map((x) => x.trim()).find((x) => nombres.includes(x)) : null;
  return d || nombres[0] || 'Entreno';
};
const cerrar = () => { window.gymDraft = null; vis('#draft', false); vis('#draft-msg', false); vis('#draft-msg-ej', false); document.querySelectorAll('#in-texto').forEach((i) => { i.value = ''; }); };
document.querySelectorAll('#form-apuntar').forEach((f) => f.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const txt = valorDe('#in-texto');
  if (!txt.trim()) return;
  const p = A.parse(txt, ejs());
  if (!p.series.length) p.series.push({peso: null, reps: null});
  p.sel = p.ejercicio || (p.nombre ? '__nuevo' : '');
  window.gymDraft = p;
  window.gymDraft.dia = diaPorDefecto(p.ejercicio);
  p.musc = {principal: '', secundarios: []};
  vis('#draft-msg', false); vis('#draft-msg-ej', false); vis('#unsaved', false); vis('#draft', true);
  dash.draw('draft_ej'); dash.draw('draft_dia'); dash.draw('draft_series'); dash.draw('draft_musc');
}));
dash.draw('draft_ej', (sel) => {
  const d = window.gymDraft;
  const lista = ejs().slice().sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  const ops = [new Option('Elige ejercicio…', '')];
  if (d && !d.ejercicio && d.nombre) ops.push(new Option(`Nuevo: ${d.nombre}`, '__nuevo'));
  for (const e of lista) ops.push(new Option(e.nombre || e.id, e.id));
  sel.replaceChildren(...ops);
  sel.value = d ? d.sel || '' : '';
  sel.onchange = () => { if (window.gymDraft) window.gymDraft.sel = sel.value; dash.draw('draft_musc'); };
});
dash.draw('draft_series', (el) => {
  el.replaceChildren();
  const d = window.gymDraft; if (!d) return;
  d.series.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'g-set';
    const lab = document.createElement('span'); lab.className = 'g-set-l'; lab.textContent = `Serie ${i + 1}`;
    const p = document.createElement('input'); p.type = 'text'; p.inputMode = 'decimal'; p.placeholder = 'kg'; p.autocomplete = 'off'; p.name = `peso${i + 1}`; p.value = s.peso == null ? '' : String(s.peso).replace('.', ','); p.setAttribute('aria-label', `Peso de la serie ${i + 1}`);
    p.addEventListener('input', () => { const v = Number(p.value.replace(',', '.')); s.peso = p.value.trim() && v > 0 ? v : null; });
    const x = document.createElement('span'); x.textContent = 'kg ×';
    const r = document.createElement('input'); r.type = 'text'; r.inputMode = 'numeric'; r.placeholder = 'reps'; r.autocomplete = 'off'; r.name = `reps${i + 1}`; r.value = s.reps == null ? '' : String(s.reps); r.setAttribute('aria-label', `Repeticiones de la serie ${i + 1}`);
    r.addEventListener('input', () => { const v = Math.round(Number(r.value)); s.reps = r.value.trim() && v > 0 ? v : null; });
    const del = document.createElement('button'); del.type = 'button'; del.className = 'g-x'; del.textContent = 'Quitar'; del.disabled = d.series.length < 2; del.setAttribute('aria-label', `Quitar la serie ${i + 1}`);
    del.addEventListener('click', () => { d.series.splice(i, 1); dash.draw('draft_series'); });
    row.append(lab, p, x, r, del); el.appendChild(row);
    if (s.reps == null && s.peso != null && i === 0) setTimeout(() => r.focus(), 0);
  });
});
document.querySelectorAll('#btn-serie').forEach((b) => b.addEventListener('click', () => {
  const d = window.gymDraft; if (!d) return;
  const last = d.series[d.series.length - 1] || {};
  d.series.push({peso: last.peso == null ? null : last.peso, reps: null});
  dash.draw('draft_series');
}));
document.querySelectorAll('#btn-cancelar').forEach((b) => b.addEventListener('click', cerrar));
let guardando = false;
document.querySelectorAll('#btn-guardar').forEach((b) => b.addEventListener('click', async () => {
  const d = window.gymDraft; if (!d || guardando) return;
  const series = d.series.filter((s) => s.peso > 0 && s.reps > 0).map((s) => ({peso: s.peso, reps: s.reps}));
  const okSeries = series.length > 0 && series.length === d.series.length;
  const okEj = !!d.sel && !(d.sel === '__nuevo' && !d.nombre);
  vis('#draft-msg', !okSeries); vis('#draft-msg-ej', !okEj);
  if (!okSeries || !okEj) return;
  const dia = valorDe('#draft-dia') || d.dia || window.GYM_NOMBRES_DIA()[0] || 'Entreno';
  guardando = true; b.disabled = true;
  let ok = true;
  try {
    const db = await claude.use('db');
    if (!db) throw new Error('sin db');
    let ejId = d.sel;
    if (ejId === '__nuevo') {
      ejId = A.slug(d.nombre);
      if (!ejs().some((e) => e.id === ejId)) await db.doc(`data/gym/ejercicios/${ejId}`).set({nombre: d.nombre.charAt(0).toUpperCase() + d.nombre.slice(1), dias: dia, musculos: window.GYM_MUSC_FORM(d.musc), alias: [A.norm(d.nombre)]});
    }
    const h = A.hoy(), id = `${h}_${ejId}`;
    const prev = ents().find((r) => r.id === id);
    let prevSeries = prev ? prev.series : [];
    if (typeof prevSeries === 'string') { try { prevSeries = JSON.parse(prevSeries); } catch (x) { prevSeries = []; } }
    if (!Array.isArray(prevSeries)) prevSeries = [];
    const orden = prev ? prev.orden : new Set(ents().filter((r) => r.fecha === h).map((r) => r.ejercicio)).size + 1;
    await db.doc(`data/gym/entrenos/${id}`).set({fecha: h, dia, ejercicio: ejId, orden, series: [...prevSeries, ...series]});
  } catch (x) { ok = false; }
  guardando = false; b.disabled = false;
  vis('#unsaved', !ok);
  if (ok) cerrar();
}));
dash.draw('hoy', (ul) => {
  ul.replaceChildren();
  const h = A.hoy();
  const nombres = new Map(ejs().map((e) => [e.id, e.nombre]));
  const lista = ents().filter((r) => r.fecha === h).sort((a, b) => a.orden - b.orden);
  const hecho = (A.rows('sesiones') || []).find((s) => s.fecha === h);
  if (hecho && Number(hecho.ejercicios) === lista.length) return;
  for (const r of lista) {
    const li = document.createElement('li');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = String(r.orden); n.style.color = A.diaColor(r.dia) === '#e9e5dc' ? '#1a1e23' : A.diaColor(r.dia);
    const s = document.createElement('span'); s.className = 't';
    const series = window.GYM_ARR(r.series);
    const sm = document.createElement('small'); sm.textContent = series.map((x) => `${String(x.peso).replace('.', ',')} × ${x.reps}`).join(', ');
    s.append(nombres.get(r.ejercicio) || r.ejercicio, sm);
    const del = document.createElement('button'); del.type = 'button'; del.className = 'g-x'; del.textContent = 'Borrar'; del.setAttribute('aria-label', `Borrar ${nombres.get(r.ejercicio) || r.ejercicio}`);
    del.addEventListener('click', async () => {
      if (del.dataset.conf !== '1') { del.dataset.conf = '1'; del.textContent = '¿Seguro?'; return; }
      del.disabled = true;
      try { const db = await claude.use('db'); if (!db) throw new Error('sin db'); await db.doc(`data/gym/entrenos/${r.id}`).delete(); vis('#unsaved', false); }
      catch (x) { del.disabled = false; vis('#unsaved', true); }
    });
    li.append(n, s, del); ul.appendChild(li);
  }
});
let terminando = false;
dash.draw('fin', (el) => {
  el.replaceChildren();
  const h = A.hoy();
  const hoyEnt = ents().filter((r) => r.fecha === h && window.GYM_ARR(r.series).length);
  const hecho = (A.rows('sesiones') || []).find((s) => s.fecha === h);
  if (!hoyEnt.length && !hecho) return;
  const ses = A.rows('sesiones_ejercicio') || [];
  const ini = String(((A.rows('perfil') || [])[0] || {}).inicio_progreso || '');
  const deHoy = ses.filter((s) => s.fecha === h).sort((a, b) => a.orden - b.orden);
  const nSeries = hoyEnt.reduce((a, r) => a + window.GYM_ARR(r.series).filter((s) => Number(s.peso) > 0 && Number(s.reps) > 0).length, 0);
  const dia = [...new Set(hoyEnt.map((r) => r.dia).filter(Boolean))].join(' + ') || 'Entreno';
  const pendiente = !hecho || Number(hecho.ejercicios) !== hoyEnt.length || Number(hecho.series) !== nSeries;
  if (hecho) {
    const box = document.createElement('div'); box.className = 'g-fin-box';
    const t = document.createElement('h3'); t.className = 'g-fin-t'; t.textContent = `${hecho.dia || dia} terminado`;
    t.style.color = A.diaColor(hecho.dia || dia);
    const st = document.createElement('div'); st.className = 'g-fin-stats';
    const stat = (v, l) => { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = v; d.append(b, l); return d; };
    let suben = 0, comparables = 0;
    const ul = document.createElement('ul');
    for (const s of deHoy) {
      const prev = ses.filter((x) => x.ejercicio === s.ejercicio && x.fecha < h && x.fecha >= ini).pop();
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = s.nombre;
      const b = document.createElement('span');
      if (!prev) { b.textContent = 'Base'; b.className = 'base'; }
      else {
        comparables++;
        const dlt = Math.round((s.e1rm_ajustado - prev.e1rm_ajustado) * 10) / 10;
        const p = (s.e1rm_ajustado / prev.e1rm_ajustado - 1) * 100;
        if (dlt > 0) suben++;
        b.textContent = dlt === 0 ? 'Igual' : `${dlt > 0 ? '+' : ''}${A.num1(dlt)} kg (${A.pct(p)})`;
        b.className = dlt > 0 ? 'sube' : dlt < 0 ? 'baja' : '';
      }
      li.append(a, b); ul.appendChild(li);
    }
    st.append(stat(String(deHoy.length), 'ejercicios'), stat(String(nSeries), 'series'));
    const recHoy = (A.rows('prs') || []).filter((p) => p.fecha === h).length;
    st.append(stat(`+${window.GYM_XP.entreno + window.GYM_XP.serie * nSeries + window.GYM_XP.record * recHoy}`, 'XP ganada'));
    if (comparables) st.append(stat(`${suben}/${comparables}`, 'mejoran'));
    const pie = document.createElement('p'); pie.className = 'g-fin-pie';
    pie.textContent = `Terminado a las ${hecho.hora || '—'}. Cada ejercicio se compara con la última vez que lo hiciste; «Base» marca la primera vez desde tu entreno base (${A.fechaCorta(ini) || 'el primero'}).`;
    box.append(t, st, ul, pie); el.appendChild(box);
  }
  if (hoyEnt.length && pendiente) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'g-btn g-btn-go'; b.textContent = hecho ? 'Actualizar entreno terminado' : 'Terminar entreno';
    b.addEventListener('click', async () => {
      if (terminando) return; terminando = true; b.disabled = true; b.textContent = 'Guardando…';
      try {
        const db = await claude.use('db'); if (!db) throw new Error('sin db');
        const d = new Date();
        await db.doc(`data/gym/sesiones/${h}`).set({fecha: h, dia, ejercicios: hoyEnt.length, series: nSeries, hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`});
        err.hidden = true; cerrar();
      } catch (x) { err.textContent = `No se ha podido guardar: ${x && x.message ? x.message : x}. Vuelve a pulsar el botón.`; err.hidden = false; b.disabled = false; b.textContent = 'Terminar entreno'; }
      terminando = false;
    });
    const err = document.createElement('p'); err.className = 'g-warn'; err.hidden = true; err.style.marginTop = '8px';
    el.append(b, err);
  }
});
dash.draw('draft_dia', (sel) => {
  const d = window.gymDraft, nombres = window.GYM_NOMBRES_DIA();
  const ops = nombres.map((n) => new Option(n, n));
  if (d && d.dia && !nombres.includes(d.dia)) ops.push(new Option(d.dia, d.dia));
  sel.replaceChildren(...ops);
  if (d && d.dia) sel.value = d.dia;
  sel.onchange = () => { if (window.gymDraft) window.gymDraft.dia = sel.value; };
});
