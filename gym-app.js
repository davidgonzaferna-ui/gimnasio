/* Bienvenida, ajustes, exportar/importar y músculos de ejercicios nuevos. */
const P = window.GYMF;
window.GYM_MUSCULOS = ['Pecho', 'Hombro anterior', 'Hombro lateral', 'Hombro posterior', 'Trapecio', 'Dorsal', 'Espalda media', 'Lumbar', 'Bíceps', 'Tríceps', 'Antebrazo', 'Abdomen', 'Oblicuos', 'Cuádriceps', 'Isquiotibiales', 'Glúteo', 'Aductores', 'Gemelos'];
window.GYM_MUSC_FORM = (m) => { const o = {}; if (!m) return o; for (const s of m.secundarios || []) o[s] = 0.5; if (m.principal) o[m.principal] = 1; return o; };
const nuevo = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const toast = (txt, malo) => {
  let t = document.getElementById('toast');
  if (!t) { t = nuevo('div', 'g-toast'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = txt; t.className = 'g-toast on' + (malo ? ' malo' : '');
  clearTimeout(window.__toastT); window.__toastT = setTimeout(() => { t.className = 'g-toast'; }, 3500);
};
const selectorMusculos = (estado, alCambiar) => {
  const box = nuevo('div', 'g-musc-form');
  const lab = nuevo('label', 'g-campo'); lab.append(nuevo('span', '', 'Músculo principal'));
  const sel = nuevo('select', 'g-select');
  sel.append(new Option('Elige…', ''), ...window.GYM_MUSCULOS.map((m) => new Option(m, m)));
  sel.value = estado.principal || '';
  sel.onchange = () => { estado.principal = sel.value; estado.secundarios = estado.secundarios.filter((x) => x !== sel.value); pintarChips(); if (alCambiar) alCambiar(); };
  lab.appendChild(sel);
  const sec = nuevo('div', 'g-campo'); sec.append(nuevo('span', '', 'También trabaja (opcional)'));
  const chips = nuevo('div', 'g-chips'); sec.appendChild(chips);
  const pintarChips = () => {
    chips.replaceChildren();
    for (const m of window.GYM_MUSCULOS) {
      if (m === estado.principal) continue;
      const b = nuevo('button', 'g-chip-t' + (estado.secundarios.includes(m) ? ' on' : ''), m); b.type = 'button'; b.setAttribute('aria-pressed', String(estado.secundarios.includes(m)));
      b.onclick = () => { estado.secundarios = estado.secundarios.includes(m) ? estado.secundarios.filter((x) => x !== m) : [...estado.secundarios, m]; pintarChips(); if (alCambiar) alCambiar(); };
      chips.appendChild(b);
    }
  };
  pintarChips();
  box.append(lab, sec);
  return box;
};
dash.draw('draft_musc', (el) => {
  el.replaceChildren();
  const d = window.gymDraft;
  if (!d || d.sel !== '__nuevo') return;
  d.musc = d.musc || {principal: '', secundarios: []};
  el.append(nuevo('p', 'g-mini-t', `«${d.nombre}» es nuevo. Dime qué músculos trabaja para que cuente en tu clase y tu progreso.`), selectorMusculos(d.musc));
});
const perfilYo = () => ((P.rows('perfil') || []).find((p) => p.id === 'yo') || (P.rows('perfil') || [])[0] || {});
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
dash.draw('base_txt', (el) => { const f = String(perfilYo().inicio_progreso || ''); el.textContent = f.length === 10 ? `${+f.slice(8, 10)} de ${MESES[+f.slice(5, 7) - 1]}` : 'tu primer entreno'; });
dash.onData(() => {
  const hay = window.GYMAPP.hayPerfil();
  document.querySelectorAll('#bienvenida').forEach((n) => { n.hidden = hay; });
  document.querySelectorAll('.gym').forEach((n) => { n.setAttribute('aria-hidden', String(!hay)); });
});

const exportar = () => {
  const txt = window.GYMAPP.exportar();
  const nombre = `gimnasio-${P.hoy()}.json`;
  if (window.Android && window.Android.exportar) { window.Android.exportar(txt, nombre); return; }
  try {
    const f = new File([txt], nombre, {type: 'application/json'});
    if (navigator.canShare && navigator.canShare({files: [f]})) { navigator.share({files: [f], title: 'Copia de Gimnasio'}).catch(() => {}); return; }
  } catch (e) { /* sigue con la descarga */ }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'application/json'})); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
};
window.gymImportarTexto = (txt) => {
  try { window.GYMAPP.importar(txt); toast('Datos importados.'); }
  catch (e) { toast(`No se ha podido importar: ${e.message || e}`, true); }
};
window.gymAviso = (txt, malo) => toast(txt, malo);
const importar = () => {
  if (window.Android && window.Android.importar) { window.Android.importar(); return; }
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => window.gymImportarTexto(String(r.result)); r.readAsText(f); };
  i.click();
};
document.querySelectorAll('[data-accion="importar"]').forEach((b) => b.addEventListener('click', importar));

const campo = (txt, input) => { const l = nuevo('label', 'g-campo'); l.append(nuevo('span', '', txt), input); return l; };
const numero = (val, ph, paso) => { const i = nuevo('input', 'g-input g-input-s'); i.type = 'text'; i.inputMode = 'decimal'; i.placeholder = ph || ''; i.value = val == null || val === 0 ? '' : String(val).replace('.', ','); i.dataset.paso = paso || ''; return i; };
const leerNum = (i) => { const v = Number(String(i.value).replace(',', '.')); return i.value.trim() && v > 0 ? v : null; };

document.querySelectorAll('#form-bienvenida').forEach((f) => f.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const v = (id) => { const e = f.querySelector('#' + id); return e ? leerNum(e) : null; };
  const peso = v('bv-peso');
  if (!peso) { toast('Escribe tu peso corporal para calcular tus clases.', true); return; }
  if (window.GYM_ANTES_EMPEZAR && !(await window.GYM_ANTES_EMPEZAR())) return;
  const alt = v('bv-altura');
  const nombre = (f.querySelector('#bv-nombre') || {}).value || '';
  const db = await claude.use('db');
  await db.doc('data/gym/perfil/yo').set({nombre: nombre.trim(), peso, altura: alt ? (alt > 3 ? alt / 100 : alt) : null, inicio_progreso: P.hoy()});
  for (const [id, campoId] of [['banca', 'bv-banca'], ['sentadilla', 'bv-sentadilla'], ['peso-muerto', 'bv-pm']]) {
    const m = v(campoId); const prev = window.GYMAPP.leerDoc('data/gym/basicos/' + id) || {};
    await db.doc('data/gym/basicos/' + id).set({...prev, marca: m || 0, meta: m ? Math.ceil((m * 1.1) / 5) * 5 : 0});
  }
  toast('¡A entrenar!');
}));

dash.draw('ajustes', (el) => {
  el.replaceChildren();
  const yo = perfilYo();
  const bas = (P.rows('basicos') || []).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const f1 = nuevo('div', 'g-aj-bloque');
  f1.append(nuevo('h3', 'g-h3', 'Tu perfil'));
  const iNom = nuevo('input', 'g-input g-input-s'); iNom.type = 'text'; iNom.value = yo.nombre || ''; iNom.placeholder = 'Tu nombre'; iNom.autocomplete = 'off';
  const iPeso = numero(yo.peso, 'kg'), iAlt = numero(yo.altura, 'm');
  const iBase = nuevo('input', 'g-input g-input-s'); iBase.type = 'date'; iBase.value = yo.inicio_progreso || '';
  const fila = nuevo('div', 'g-aj-grid'); fila.append(campo('Nombre', iNom), campo('Peso corporal (kg)', iPeso), campo('Altura (m)', iAlt), campo('Progresión desde', iBase));
  f1.appendChild(fila);
  const f2 = nuevo('div', 'g-aj-bloque'); f2.append(nuevo('h3', 'g-h3', 'Básicos: récord y meta'));
  const ins = [];
  for (const b of bas) {
    const iM = numero(b.marca, 'récord'), iT = numero(b.meta, 'meta');
    const g = nuevo('div', 'g-aj-grid g-aj-bas'); g.append(nuevo('span', 'g-aj-n', b.nombre), campo('Récord (kg)', iM), campo('Meta (kg)', iT));
    f2.appendChild(g); ins.push([b, iM, iT]);
  }
  const bG = nuevo('button', 'g-btn g-btn-go', 'Guardar cambios'); bG.type = 'button';
  bG.onclick = async () => {
    const peso = leerNum(iPeso); if (!peso) { toast('El peso corporal no puede quedar vacío.', true); return; }
    const alt = leerNum(iAlt);
    const db = await claude.use('db');
    await db.doc('data/gym/perfil/yo').set({...yo, id: undefined, nombre: iNom.value.trim(), peso, altura: alt ? (alt > 3 ? alt / 100 : alt) : null, inicio_progreso: iBase.value || yo.inicio_progreso || P.hoy()});
    for (const [b, iM, iT] of ins) { const prev = window.GYMAPP.leerDoc('data/gym/basicos/' + b.id) || {}; await db.doc('data/gym/basicos/' + b.id).set({...prev, marca: leerNum(iM) || 0, meta: leerNum(iT) || 0}); }
    toast('Guardado.');
  };
  const f3 = nuevo('div', 'g-aj-bloque'); f3.append(nuevo('h3', 'g-h3', 'Músculos de un ejercicio'));
  const ejs = (P.rows('ejercicios') || []).slice().sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  const sinM = ejs.filter((e) => !Object.keys(window.GYM_MUSC(e)).length);
  if (sinM.length) f3.appendChild(nuevo('p', 'g-mini-t', `${sinM.length === 1 ? 'Hay 1 ejercicio' : `Hay ${sinM.length} ejercicios`} sin músculos asignados: ${sinM.map((e) => e.nombre).join(', ')}. No cuentan en tus clases hasta que se los pongas.`));
  const sel = nuevo('select', 'g-select'); sel.append(new Option('Elige un ejercicio…', ''), ...ejs.map((e) => new Option(e.nombre + (Object.keys(window.GYM_MUSC(e)).length ? '' : ' (sin músculos)'), e.id)));
  const zona = nuevo('div');
  let est = null;
  sel.onchange = () => {
    zona.replaceChildren(); const e = ejs.find((x) => x.id === sel.value); if (!e) return;
    const m = window.GYM_MUSC(e); const pr = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    est = {principal: pr ? pr[0] : '', secundarios: Object.keys(m).filter((k) => !pr || k !== pr[0])};
    const bM = nuevo('button', 'g-btn', 'Guardar músculos'); bM.type = 'button';
    bM.onclick = async () => { if (!est.principal) { toast('Elige el músculo principal.', true); return; } const db = await claude.use('db'); await db.doc('data/gym/ejercicios/' + e.id).set({...window.GYMAPP.leerDoc('data/gym/ejercicios/' + e.id), musculos: window.GYM_MUSC_FORM(est)}); toast('Músculos guardados.'); };
    zona.append(selectorMusculos(est), bM);
  };
  f3.append(sel, zona);
  const f4 = nuevo('div', 'g-aj-bloque'); f4.append(nuevo('h3', 'g-h3', 'Tus datos'), nuevo('p', 'g-mini-t', 'Todo se guarda solo en este móvil. Exporta de vez en cuando una copia por si lo cambias o borras la app.'));
  const fx = nuevo('div', 'g-row');
  const bE = nuevo('button', 'g-btn', 'Exportar copia'); bE.type = 'button'; bE.onclick = exportar;
  const bI = nuevo('button', 'g-btn g-btn-sec', 'Importar copia'); bI.type = 'button'; bI.onclick = importar;
  const bB = nuevo('button', 'g-btn g-btn-peligro', 'Borrar todo'); bB.type = 'button';
  bB.onclick = () => { if (bB.dataset.conf !== '1') { bB.dataset.conf = '1'; bB.textContent = 'Pulsa otra vez: se borra todo'; return; } window.GYMAPP.borrar(); toast('Datos borrados.'); };
  fx.append(bE, bI, bB); f4.appendChild(fx);
  el.append(f1, f2, bG, f3, f4);
});

/* ---------- Rutina ---------- */
const DIAS_SEM = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const PRESETS = [
  ['PPL + Brazo + Débiles', 5, [['Push', [0]], ['Pull', [1]], ['Pierna', [2]], ['Brazo', [3]], ['Puntos débiles', [4]]]],
  ['Push / Pull / Pierna', 3, [['Push', [0]], ['Pull', [2]], ['Pierna', [4]]]],
  ['PPL dos veces', 6, [['Push', [0, 3]], ['Pull', [1, 4]], ['Pierna', [2, 5]]]],
  ['Torso / Pierna', 4, [['Torso', [0, 3]], ['Pierna', [1, 4]]]],
  ['Full body', 3, [['Full body', [0, 2, 4]]]],
  ['Weider', 5, [['Pecho', [0]], ['Espalda', [1]], ['Pierna', [2]], ['Hombro', [3]], ['Brazo', [4]]]]
];
const copiaRutina = (r) => ({objetivo: r.objetivo, auto: false, dias: r.dias.map((d) => ({nombre: d.nombre, color: d.color, semana: [...(d.semana || [])], _orig: d.nombre}))});
const editorRutina = (estado) => {
  const box = nuevo('div', 'g-rut');
  const pres = nuevo('div', 'g-chips g-rut-pres');
  const lista = nuevo('div', 'g-rut-lista');
  const obj = numero(estado.objetivo, 'días'); obj.inputMode = 'numeric';
  const contar = () => new Set(estado.dias.flatMap((d) => d.semana)).size;
  const sincObjetivo = () => { if (estado.auto) { estado.objetivo = Math.max(1, contar() || estado.dias.length); obj.value = String(estado.objetivo); } };
  obj.oninput = () => { const v = Math.round(leerNum(obj) || 0); if (v > 0) { estado.objetivo = Math.min(7, v); estado.auto = false; } };
  const pintar = () => {
    lista.replaceChildren();
    estado.dias.forEach((d, i) => {
      const fila = nuevo('div', 'g-rut-dia');
      const col = nuevo('button', 'g-rut-col'); col.type = 'button'; col.style.background = d.color; col.setAttribute('aria-label', `Cambiar el color de ${d.nombre || 'este día'}`);
      col.onclick = () => { const P2 = window.GYM_PALETA; d.color = P2[(P2.indexOf(d.color) + 1) % P2.length]; col.style.background = d.color; };
      const nom = nuevo('input', 'g-input g-input-s'); nom.type = 'text'; nom.value = d.nombre; nom.placeholder = 'Nombre del día'; nom.setAttribute('aria-label', 'Nombre del día'); nom.autocomplete = 'off';
      nom.oninput = () => { d.nombre = nom.value; };
      const sem = nuevo('div', 'g-rut-sem');
      DIAS_SEM.forEach((l, k) => {
        const b = nuevo('button', 'g-rut-d' + (d.semana.includes(k) ? ' on' : ''), l); b.type = 'button'; b.setAttribute('aria-pressed', String(d.semana.includes(k)));
        b.onclick = () => { d.semana = d.semana.includes(k) ? d.semana.filter((x) => x !== k) : [...d.semana, k].sort(); pintar(); sincObjetivo(); };
        sem.appendChild(b);
      });
      const x = nuevo('button', 'g-x', 'Quitar'); x.type = 'button'; x.disabled = estado.dias.length < 2;
      x.onclick = () => { estado.dias.splice(i, 1); pintar(); sincObjetivo(); };
      const arriba = nuevo('div', 'g-rut-top'); arriba.append(col, nom, x);
      fila.append(arriba, sem); lista.appendChild(fila);
    });
  };
  for (const [nombre, objetivo, dias] of PRESETS) {
    const b = nuevo('button', 'g-chip-t', nombre); b.type = 'button';
    b.onclick = () => { estado.dias = dias.map(([n, s], i) => ({nombre: n, semana: [...s], color: window.GYM_PALETA[i % window.GYM_PALETA.length], _orig: null})); estado.objetivo = objetivo; estado.auto = false; obj.value = String(objetivo); pintar(); };
    pres.appendChild(b);
  }
  const mas = nuevo('button', 'g-btn g-btn-claro', 'Añadir día'); mas.type = 'button';
  mas.onclick = () => { estado.dias.push({nombre: '', semana: [], color: window.GYM_PALETA[estado.dias.length % window.GYM_PALETA.length], _orig: null}); pintar(); const ins = lista.querySelectorAll('input'); if (ins.length) ins[ins.length - 1].focus(); };
  pintar();
  box.append(nuevo('p', 'g-mini-t', 'Empieza con una plantilla o crea la tuya. Toca el círculo para cambiar el color y las letras para elegir qué días de la semana toca cada uno.'), pres, lista, mas, campo('Entrenos por semana (tu objetivo)', obj));
  return box;
};
const validarRutina = (estado) => {
  const dias = estado.dias.map((d) => ({...d, nombre: String(d.nombre || '').trim()})).filter((d) => d.nombre);
  if (!dias.length) return 'Añade al menos un día con nombre.';
  const n = dias.map((d) => d.nombre.toLowerCase());
  if (new Set(n).size !== n.length) return 'Hay dos días con el mismo nombre.';
  return null;
};
const guardarRutina = async (estado) => {
  const db = await claude.use('db');
  const dias = estado.dias.map((d) => ({...d, nombre: String(d.nombre || '').trim()})).filter((d) => d.nombre);
  for (const d of dias) {
    if (d._orig && d._orig !== d.nombre) {
      for (const r of P.rows('entrenos') || []) if (r.dia === d._orig) { const {id, ...resto} = r; window.GYMAPP.escribirSilencioso('data/gym/entrenos/' + id, {...resto, dia: d.nombre}); }
      for (const r of P.rows('sesiones') || []) if (r.dia === d._orig) { const {id, ...resto} = r; window.GYMAPP.escribirSilencioso('data/gym/sesiones/' + id, {...resto, dia: d.nombre}); }
    }
  }
  await db.doc('data/gym/rutina/yo').set({objetivo: Math.max(1, Math.min(7, Number(estado.objetivo) || dias.length)), dias: dias.map((d) => ({nombre: d.nombre, color: d.color, semana: d.semana}))});
  dias.forEach((d) => { d._orig = d.nombre; });
};
const estadoBienvenida = copiaRutina(window.GYM_RUTINA_DEF); estadoBienvenida.auto = true;
document.querySelectorAll('#bv-rutina').forEach((c) => { c.replaceChildren(editorRutina(estadoBienvenida)); });
window.GYM_ANTES_EMPEZAR = async () => { const err = validarRutina(estadoBienvenida); if (err) { toast(err, true); return false; } await guardarRutina(estadoBienvenida); return true; };
let estadoAjustes = null;
dash.draw('ajustes_rutina', (el) => {
  const firma = JSON.stringify(window.GYM_RUTINA());
  if (el.dataset.firma === firma && el.firstChild) return;
  el.dataset.firma = firma;
  el.replaceChildren();
  estadoAjustes = copiaRutina(window.GYM_RUTINA());
  const b = nuevo('button', 'g-btn g-btn-go', 'Guardar rutina'); b.type = 'button';
  b.onclick = async () => { const err = validarRutina(estadoAjustes); if (err) { toast(err, true); return; } await guardarRutina(estadoAjustes); toast('Rutina guardada.'); };
  el.append(editorRutina(estadoAjustes), b);
});
(() => {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalada = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (!ios || instalada) return;
  document.querySelectorAll('.g-bv-caja').forEach((c) => {
    const p = document.createElement('p'); p.className = 'g-aviso-ios';
    p.textContent = 'Consejo: antes de empezar, pulsa Compartir y luego «Añadir a pantalla de inicio». Así se abre como una app y tus datos quedan guardados.';
    c.insertBefore(p, c.children[1] || null);
  });
})();
