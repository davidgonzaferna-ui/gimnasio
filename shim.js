/* Capa local: sustituye a la plataforma de Claude. Guarda todo en el móvil. */
(function () {
  const CLAVE = 'gymrpg-db-v1';
  const DATASETS = {
    entrenos: 'data/gym/entrenos', ejercicios: 'data/gym/ejercicios', estandares: 'data/gym/estandares',
    basicos: 'data/gym/basicos', perfil: 'data/gym/perfil', sesiones: 'data/gym/sesiones'
  };
  const nativo = typeof window.Android !== 'undefined';
  let DB = {};
  const leer = () => {
    let txt = null;
    try { txt = nativo ? window.Android.cargar() : localStorage.getItem(CLAVE); } catch (e) { txt = null; }
    if (!txt && nativo) { try { txt = localStorage.getItem(CLAVE); } catch (e) { txt = null; } }
    try { DB = txt ? JSON.parse(txt) : {}; } catch (e) { DB = {}; }
    if (!DB || typeof DB !== 'object') DB = {};
  };
  const guardar = () => {
    const txt = JSON.stringify(DB);
    try { if (nativo) window.Android.guardar(txt); } catch (e) { /* sigue con localStorage */ }
    try { localStorage.setItem(CLAVE, txt); } catch (e) { /* sin espacio */ }
  };
  leer();
  const col = (ruta) => (DB[ruta] = DB[ruta] || {});
  const partir = (path) => { const p = path.split('/'); return {coleccion: p.slice(0, -1).join('/'), id: p[p.length - 1]}; };

  const CALCS = {}, DRAWS = {}, ONDATA = [];
  let cache = {};
  const filas = (ruta) => Object.entries(DB[ruta] || {}).map(([id, d]) => ({id, ...d})).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const dash = {
    calc(id, o) { CALCS[id] = o; },
    data(id) {
      if (DATASETS[id]) return {status: 'ok', data: filas(DATASETS[id]), refreshing: false, truncated: false};
      if (CALCS[id]) {
        if (!(id in cache)) {
          cache[id] = null;
          try { cache[id] = CALCS[id].fn(...CALCS[id].inputs.map((i) => { const d = dash.data(i); return d.status === 'ok' ? d.data : []; })); }
          catch (e) { console.error('calc ' + id, e); cache[id] = {__error: e}; }
        }
        const v = cache[id];
        if (v && v.__error) return {status: 'error', data: null, message: String(v.__error)};
        return {status: 'ok', data: v};
      }
      return {status: 'missing', data: []};
    },
    draw(nombre, fn) { if (fn) DRAWS[nombre] = fn; if (listo) dibujar(nombre); },
    onData(fn) { ONDATA.push(fn); if (listo) try { fn(); } catch (e) { console.error(e); } },
    params: () => ({}), setParams() {}, resetParams() {}, setLink() {}, refresh() {}, colors: []
  };
  let listo = false;
  const dibujar = (nombre) => {
    document.querySelectorAll('[data-draw="' + nombre + '"]').forEach((el) => {
      if (el.closest('[hidden]')) return;
      try { DRAWS[nombre](el); } catch (e) { console.error('draw ' + nombre, e); }
    });
  };
  const todo = () => {
    cache = {};
    ONDATA.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    Object.keys(DRAWS).forEach(dibujar);
  };
  window.GYMAPP = {
    todo,
    exportar: () => JSON.stringify({app: 'gymrpg', version: 1, fecha: new Date().toISOString(), datos: DB}),
    importar(txt) {
      const o = JSON.parse(txt);
      const datos = o && o.datos ? o.datos : o;
      if (!datos || typeof datos !== 'object' || !datos['data/gym/entrenos'] && !datos['data/gym/perfil']) throw new Error('El archivo no tiene datos del gimnasio');
      DB = datos;
      for (const [k, v] of Object.entries(window.GYM_CATALOGO || {})) { const c = col(k); for (const [id, d] of Object.entries(v)) if (!(id in c)) c[id] = d; }
      guardar(); todo();
    },
    borrar() { DB = {}; sembrar(); guardar(); todo(); },
    hayPerfil: () => Object.keys(DB['data/gym/perfil'] || {}).length > 0,
    escribirSilencioso(path, data) { const {coleccion, id} = partir(path); col(coleccion)[id] = JSON.parse(JSON.stringify(data)); },
    escribir(path, data) { const {coleccion, id} = partir(path); col(coleccion)[id] = JSON.parse(JSON.stringify(data)); guardar(); setTimeout(todo, 0); },
    leerDoc(path) { const {coleccion, id} = partir(path); return (DB[coleccion] || {})[id] || null; }
  };
  const sembrar = () => {
    for (const [k, v] of Object.entries(window.GYM_CATALOGO || {})) { const c = col(k); for (const [id, d] of Object.entries(v)) if (!(id in c)) c[id] = d; }
  };
  const db = {
    doc(path) {
      return {
        set: async (data) => window.GYMAPP.escribir(path, data),
        update: async (data) => { const prev = window.GYMAPP.leerDoc(path) || {}; window.GYMAPP.escribir(path, {...prev, ...data}); },
        delete: async () => { const {coleccion, id} = partir(path); if (DB[coleccion]) delete DB[coleccion][id]; guardar(); setTimeout(todo, 0); },
        get: async () => window.GYMAPP.leerDoc(path)
      };
    }
  };
  window.dash = dash;
  window.claude = {use: async (n) => (n === 'db' ? db : null)};
  window.addEventListener('DOMContentLoaded', () => {
    sembrar(); guardar();
    listo = true; todo();
    let t = null, w = window.innerWidth;
    window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - w) < 20) return; w = window.innerWidth; clearTimeout(t); t = setTimeout(todo, 200); });
  });
  window.addEventListener('error', (e) => console.error(e.message));
})();
