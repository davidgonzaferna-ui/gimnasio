window.GYM_GRUPOS = {Pecho: ['Pecho'], Espalda: ['Dorsal', 'Espalda media', 'Trapecio', 'Lumbar'], Hombros: ['Hombro anterior', 'Hombro lateral', 'Hombro posterior'], Brazos: ['Bíceps', 'Tríceps', 'Antebrazo'], Piernas: ['Cuádriceps', 'Isquiotibiales', 'Glúteo', 'Aductores', 'Gemelos'], Core: ['Abdomen', 'Oblicuos']};
window.GYM_RANGOS = [
  {nivel: 1, nombre: 'Aprendiz de la barra', icono: 'barra', color: '#9aa3ad'},
  {nivel: 3, nombre: 'Novato del rack', icono: 'mancuerna', color: '#b07a4f'},
  {nivel: 5, nombre: 'Escudero de hierro', icono: 'escudo', color: '#c58a5a'},
  {nivel: 8, nombre: 'Guerrero del banco', icono: 'espada', color: '#25a866'},
  {nivel: 10, nombre: 'Caballero del press', icono: 'casco', color: '#3a75e6'},
  {nivel: 13, nombre: 'Gladiador de la jaula', icono: 'espadas', color: '#e2463b'},
  {nivel: 16, nombre: 'Paladín del rack', icono: 'martillo', color: '#a77bff'},
  {nivel: 20, nombre: 'Señor de los discos', icono: 'disco', color: '#f5c330'},
  {nivel: 25, nombre: 'Titán de hierro', icono: 'rayo', color: '#ff8a3d'},
  {nivel: 30, nombre: 'Leyenda del gimnasio', icono: 'corona', color: '#f3efe6'}
];
window.GYM_XP = {entreno: 100, serie: 4, record: 50, semana5: 150, pierna: 50, recordSemana: 50};
dash.calc('grupos', {
  title: 'Clase por grupo muscular',
  description: 'Media del nivel de fuerza de los músculos de cada grupo (0–5): Iniciación, Principiante, Novato, Intermedio, Avanzado, Élite.',
  inputs: ['niveles_musculo'],
  fn: (niveles) => {
    const NOM = ['Iniciación', 'Principiante', 'Novato', 'Intermedio', 'Avanzado', 'Élite'];
    const m = new Map((niveles || []).map((r) => [r.musculo, Number(r.nivel)]));
    return Object.entries(window.GYM_GRUPOS).map(([g, ms]) => {
      const v = ms.filter((x) => m.has(x)).map((x) => m.get(x));
      if (!v.length) return {grupo: g, nivel: null, clase: 'Sin datos'};
      const n = Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
      return {grupo: g, nivel: n, clase: NOM[Math.min(5, Math.floor(n))]};
    });
  }
});
dash.calc('prs', {
  title: 'Récords personales',
  description: 'Sesiones en las que el 1RM estimado de un ejercicio superó el mejor anterior de ese ejercicio.',
  inputs: ['sesiones_ejercicio'],
  fn: (ses) => {
    const best = new Map(), out = [];
    for (const s of ses || []) {
      const b = best.get(s.ejercicio);
      if (b != null && s.e1rm > b) out.push({id: s.id, fecha: s.fecha, semana: s.semana, ejercicio: s.ejercicio, nombre: s.nombre, e1rm: s.e1rm, anterior: b});
      if (b == null || s.e1rm > b) best.set(s.ejercicio, s.e1rm);
    }
    return out;
  }
});
dash.calc('dias_cerrados', {
  title: 'Entrenos que cuentan',
  description: 'Días entrenados hasta ayer, más hoy si pulsaste Terminar entreno.',
  inputs: ['dias', 'sesiones'],
  fn: (dias, sesiones) => {
    const G = window.GYMF, h = G.hoy();
    const cer = new Set((sesiones || []).map((s) => String(s.fecha || s.id || '')));
    return (dias || []).filter((d) => d.fecha < h || cer.has(d.fecha)).map((d) => ({...d, semana: G.lunes(d.fecha)}));
  }
});
window.GYM_TIERS = [
  {nv: 1, titulo: 'Aprendiz de la barra', icono: 'mancuerna', color: '#b9c4cf'},
  {nv: 3, titulo: 'Recluta del rack', icono: 'pesa', color: '#c58a5a'},
  {nv: 5, titulo: 'Escudero de hierro', icono: 'escudo', color: '#9aa3ad'},
  {nv: 8, titulo: 'Guerrero del banco', icono: 'espadas', color: '#25a866'},
  {nv: 10, titulo: 'Caballero del press', icono: 'yelmo', color: '#3a75e6'},
  {nv: 13, titulo: 'Gladiador de la jaula', icono: 'laurel', color: '#e2463b'},
  {nv: 16, titulo: 'Paladín del rack', icono: 'martillo', color: '#f5c330'},
  {nv: 20, titulo: 'Campeón de los discos', icono: 'trofeo', color: '#f59e30'},
  {nv: 25, titulo: 'Titán de acero', icono: 'rayo', color: '#a77bff'},
  {nv: 30, titulo: 'Leyenda del gimnasio', icono: 'corona', color: '#ffd76a'}
];
dash.calc('rpg', {
  title: 'Tu personaje',
  description: 'Experiencia: 100 por entreno, 4 por serie, 50 por récord personal, y misiones semanales (150 por 5 entrenos, 50 por hacer pierna, 50 por batir un récord). Cada nivel pide 300 + 100 × nivel de experiencia. Atributos de 0 a 100.',
  inputs: ['dias_cerrados', 'prs', 'grupos'],
  fn: (dias, prs, grupos) => {
    const X = window.GYM_XP, G = window.GYMF;
    const semanas = new Map();
    let xp = 0;
    for (const d of dias || []) {
      xp += X.entreno + X.serie * (Number(d.series) || 0);
      const s = semanas.get(d.semana) || {dias: 0, pierna: false, series: 0}; s.dias++; s.series += Number(d.series) || 0; if (window.GYM_ES_PIERNA(d.dia)) s.pierna = true; (s.tipos = s.tipos || new Set()).add(d.dia); s.maxSeries = Math.max(s.maxSeries || 0, Number(d.series) || 0); semanas.set(d.semana, s);
    }
    const prSem = new Map();
    for (const p of prs || []) { xp += X.record; prSem.set(p.semana, (prSem.get(p.semana) || 0) + 1); }
    const objetivo = window.GYM_OBJETIVO, hayPierna = window.GYM_NOMBRES_DIA().some(window.GYM_ES_PIERNA), metaVar = Math.min(3, window.GYM_NOMBRES_DIA().length);
    for (const [sem, s] of semanas) { if (s.dias >= objetivo) xp += X.semana5; if (hayPierna ? s.pierna : metaVar >= 2 ? (s.tipos && s.tipos.size >= metaVar) : (s.maxSeries || 0) >= 15) xp += X.pierna; if (prSem.has(sem)) xp += X.recordSemana; }
    let nivel = 1, resto = xp;
    while (resto >= 300 + 100 * nivel) { resto -= 300 + 100 * nivel; nivel++; }
    const T = window.GYM_TIERS;
    const k = T.filter((t) => nivel >= t.nv).length - 1, sig = T[k + 1];
    const g = (grupos || []).filter((x) => x.nivel != null);
    const fuerza = g.length ? Math.round((g.reduce((a, x) => a + x.nivel, 0) / g.length / 5) * 100) : 0;
    const equilibrio = g.length > 1 ? Math.round((Math.min(...g.map((x) => x.nivel)) / Math.max(...g.map((x) => x.nivel))) * 100) : 0;
    const lunHoy = G.lunes(G.hoy());
    const ult = (n) => Array.from({length: n}, (_, i) => G.addDias(lunHoy, -7 * (i + 1)));
    const constancia = Math.round((ult(8).filter((w) => (semanas.get(w) || {}).dias >= 4).length / 8) * 100);
    const media = ult(4).reduce((a, w) => a + ((semanas.get(w) || {}).series || 0), 0) / 4;
    const aguante = Math.min(100, Math.round((media / 80) * 100));
    let rachaSem = 0; for (const w of ult(12)) { if ((semanas.get(w) || {}).dias >= 4) rachaSem++; else break; }
    const racha = Math.min(100, Math.round((rachaSem / 8) * 100));
    const recs4 = [lunHoy, ...ult(3)].reduce((a, w) => a + (prSem.get(w) || 0), 0);
    const superacion = Math.min(100, recs4 * 10);
    return [{xp, nivel, xp_nivel: resto, xp_necesaria: 300 + 100 * nivel, titulo: T[k].titulo, categoria: k + 1, siguiente: sig ? sig.titulo : '', siguiente_nv: sig ? sig.nv : null, fuerza, constancia, aguante, equilibrio, racha, racha_semanas: rachaSem, superacion, records_mes: recs4, entrenos: (dias || []).length, records: (prs || []).length}];
  }
});
dash.calc('misiones', {
  title: 'Misiones de esta semana',
  description: 'Objetivos de la semana en curso y la experiencia que dan.',
  inputs: ['dias_cerrados', 'prs'],
  fn: (dias, prs) => {
    const G = window.GYMF, X = window.GYM_XP, lun = G.lunes(G.hoy());
    const sem = (dias || []).filter((d) => d.semana === lun);
    const rec = (prs || []).filter((p) => p.semana === lun).length;
    const nombres = window.GYM_NOMBRES_DIA(), hayPierna = nombres.some(window.GYM_ES_PIERNA);
    const pierna = sem.some((d) => window.GYM_ES_PIERNA(d.dia)) ? 1 : 0;
    const metaVar = Math.min(3, nombres.length), variedad = Math.min(new Set(sem.map((d) => d.dia)).size, metaVar);
    return [
      {id: 'cinco', mision: `Entrena ${window.GYM_OBJETIVO} días`, valor: Math.min(sem.length, window.GYM_OBJETIVO), meta: window.GYM_OBJETIVO, xp: X.semana5},
      hayPierna ? {id: 'pierna', mision: 'No te saltes la pierna', valor: pierna, meta: 1, xp: X.pierna} : metaVar >= 2 ? {id: 'pierna', mision: `Haz ${metaVar} días distintos de tu rutina`, valor: variedad, meta: metaVar, xp: X.pierna} : {id: 'pierna', mision: 'Haz un entreno de 15 series o más', valor: Math.min(1, sem.some((d) => (Number(d.series) || 0) >= 15) ? 1 : 0), meta: 1, xp: X.pierna},
      {id: 'record', mision: 'Bate un récord personal', valor: Math.min(rec, 1), meta: 1, xp: X.recordSemana}
    ];
  }
});
dash.calc('entrenos_hist', {
  title: 'Historial de entrenos',
  description: 'Un registro por entreno con sus ejercicios, series y récords.',
  inputs: ['sesiones_ejercicio', 'prs'],
  fn: (ses, prs) => {
    const rec = new Map(); for (const p of prs || []) rec.set(p.fecha, (rec.get(p.fecha) || 0) + 1);
    const acc = new Map();
    for (const s of ses || []) {
      const a = acc.get(s.fecha) || {id: s.fecha, fecha: s.fecha, dias: new Set(), ejercicios: 0, series: 0};
      if (s.dia) a.dias.add(s.dia); a.ejercicios++; a.series += s.series; acc.set(s.fecha, a);
    }
    return [...acc.values()].map((a) => ({id: a.id, fecha: a.fecha, dia: [...a.dias].join(' + '), ejercicios: a.ejercicios, series: a.series, records: rec.get(a.fecha) || 0})).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }
});
dash.calc('ultimo_por_dia', {
  title: 'Tu último entreno de cada día',
  description: 'Para cada tipo de día, los ejercicios de la última vez que lo hiciste con el peso más alto y las repeticiones de la primera serie con ese peso. Toca subir si llegas a 10 repeticiones (12 en ejercicios de un solo músculo); toca bajar si haces menos de 4.',
  inputs: ['entrenos', 'ejercicios', 'sesiones'],
  fn: (entrenos, ejercicios, sesiones) => {
    const G = window.GYMF, h = G.hoy();
    const cer = new Set((sesiones || []).map((s) => String(s.fecha || s.id || '')));
    const ej = new Map((ejercicios || []).map((e) => [e.id, e]));
    const DIAS = window.GYM_NOMBRES_DIA();
    const validos = (entrenos || []).filter((r) => r.ejercicio !== '_registro' && (r.fecha < h || cer.has(r.fecha)) && DIAS.includes(r.dia) && window.GYM_ARR(r.series).length);
    const out = [];
    for (const dia of DIAS) {
      const fechas = validos.filter((r) => r.dia === dia).map((r) => r.fecha).sort();
      if (!fechas.length) continue;
      const f = fechas[fechas.length - 1];
      for (const r of validos.filter((x) => x.dia === dia && x.fecha === f).sort((a, b) => (a.orden || 0) - (b.orden || 0))) {
        const ser = window.GYM_ARR(r.series).map((s) => ({peso: Number(s.peso), reps: Number(s.reps)})).filter((s) => s.peso > 0 && s.reps > 0);
        if (!ser.length) continue;
        const peso = Math.max(...ser.map((s) => s.peso));
        const reps = ser.find((s) => s.peso === peso).reps;
        const e = ej.get(r.ejercicio) || {};
        const aisl = Object.values(window.GYM_MUSC(e)).filter((w) => Number(w) >= 0.5).length <= 1;
        const tope = aisl ? 12 : 10;
        const inc = peso < 20 ? 1 : peso < 60 ? 2.5 : 5;
        const accion = reps >= tope ? 'subir' : reps < 4 ? 'bajar' : 'mantener';
        const sugerido = accion === 'subir' ? peso + inc : accion === 'bajar' ? Math.max(0, peso - inc) : peso;
        out.push({id: `${dia}|${r.ejercicio}`, dia, fecha: f, orden: r.orden || 0, ejercicio: r.ejercicio, nombre: e.nombre || r.ejercicio, series_txt: ser.map((s) => `${String(s.peso).replace('.', ',')}×${s.reps}`).join(', '), peso, reps, tope, accion, sugerido});
      }
    }
    return out;
  }
});
