// =====================================================================
// Micro frontend: CATÁLOGO 2.0   (equipo "Descubrimiento")
// ---------------------------------------------------------------------
// Tecnología : Vue 3 (CDN, import dinámico, sin compilación)
// Contrato   : window.renderCatalogo(id) -> Promise
//              window.unmountCatalogo(id)
// Publica    : 'carrito:agregar' versión 1.1
//              { version: '1.1', id, nombre, precio, categoria }
// Consume    : tokens.css del sistema de diseño (solo variables CSS)
// =====================================================================
(function () {
  'use strict';

  const VERSION = '2.0.0';
  const URL_VUE = 'https://unpkg.com/vue@3.5.43/dist/vue.esm-browser.prod.js';

  const EVENTO_AGREGAR = 'carrito:agregar';
  const VERSION_EVENTO = '1.1';   // 1.0 era { id, nombre, precio }; 1.1 agrega version y categoria

  const TODAS = 'Todas';

  const PLATOS = [
    { id: 1,  nombre: 'Chivo guisado',          precio: 28000, categoria: 'Plato fuerte' },
    { id: 2,  nombre: 'Arroz de payaso',        precio: 22000, categoria: 'Plato fuerte' },
    { id: 3,  nombre: 'Sancocho de gallina',    precio: 25000, categoria: 'Plato fuerte' },
    { id: 4,  nombre: 'Arepa de huevo',         precio: 6000,  categoria: 'Entrada' },
    { id: 5,  nombre: 'Carimañola',             precio: 4500,  categoria: 'Entrada' },
    { id: 6,  nombre: 'Empanada de carne',      precio: 5000,  categoria: 'Entrada' },
    { id: 7,  nombre: 'Jugo de corozo',         precio: 5000,  categoria: 'Bebida' },
    { id: 8,  nombre: 'Limonada de panela',     precio: 4000,  categoria: 'Bebida' },
    { id: 9,  nombre: 'Dulce de leche cortada', precio: 7000,  categoria: 'Postre' }
  ];

  // Categorías sin repetir, en el orden en que aparecen
  const CATEGORIAS = PLATOS
    .map(function (p) { return p.categoria; })
    .filter(function (c, i, lista) { return lista.indexOf(c) === i; });

  const pesos = new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  });

  // -------------------------------------------------------------------
  // 1. Estilos propios, con prefijo "cat-" para no chocar con otros MFE.
  //    Los colores salen de tokens.css (sistema de diseño del equipo
  //    Plataforma) y cada uno lleva su respaldo para que el catálogo
  //    siga viéndose bien si ese servidor no está levantado.
  // -------------------------------------------------------------------
  const CSS = `
    .cat-raiz { font-family: var(--sabor-fuente, Verdana, Geneva, Tahoma, sans-serif); }
    .cat-titulo { color: var(--sabor-color-primario, #0b4f8a); margin: 0; font-size: 22px; }
    .cat-version { font-size: 12px; color: var(--sabor-color-texto, #1f2a37); opacity: .65; }
    .cat-filtros { display: flex; flex-wrap: wrap; gap: var(--sabor-espacio-s, 8px);
                   margin: var(--sabor-espacio-m, 16px) 0; }
    .cat-buscar, .cat-select {
      font: inherit; padding: var(--sabor-espacio-s, 8px);
      color: var(--sabor-color-texto, #1f2a37);
      background: var(--sabor-color-fondo, #fff);
      border: 1px solid color-mix(in srgb, var(--sabor-color-texto, #1f2a37) 22%, transparent);
      border-radius: var(--sabor-radio, 6px);
    }
    .cat-buscar { flex: 1 1 220px; }
    .cat-select { flex: 0 0 auto; }
    .cat-resumen { font-size: 13px; margin: 0 0 var(--sabor-espacio-s, 8px);
                   color: var(--sabor-color-texto, #1f2a37); opacity: .7; }
    .cat-grilla { display: grid; gap: var(--sabor-espacio-m, 16px);
                  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
    .cat-tarjeta {
      background: var(--sabor-color-fondo, #fff);
      border: 1px solid color-mix(in srgb, var(--sabor-color-texto, #1f2a37) 14%, transparent);
      border-radius: var(--sabor-radio, 6px);
      padding: var(--sabor-espacio-m, 16px);
    }
    .cat-categoria { font-size: 12px; letter-spacing: .4px; text-transform: uppercase;
                     color: var(--sabor-color-secundario, #1b7a3e); }
    .cat-nombre { font-size: 17px; margin: 6px 0; }
    .cat-precio { font-weight: bold; margin-bottom: var(--sabor-espacio-m, 12px); }
    .cat-boton {
      font: inherit; cursor: pointer; border: 0; color: #fff;
      padding: var(--sabor-espacio-s, 8px) var(--sabor-espacio-m, 12px);
      border-radius: var(--sabor-radio, 6px);
      background: var(--sabor-color-primario, #0b4f8a);
    }
    .cat-boton:hover { background: color-mix(in srgb, var(--sabor-color-primario, #0b4f8a) 84%, #000); }
    .cat-vacio { color: var(--sabor-color-texto, #1f2a37); opacity: .7; }
  `;

  function asegurarEstilos() {
    if (document.getElementById('cat-estilos')) return;
    const style = document.createElement('style');
    style.id = 'cat-estilos';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // -------------------------------------------------------------------
  // 2. Carga de Vue: import dinámico, una sola vez por sesión.
  //    Si falla, se borra la promesa cacheada para que el botón
  //    "Reintentar" del contenedor pueda volver a intentarlo.
  // -------------------------------------------------------------------
  let vueListo = null;

  function cargarVue() {
    if (!vueListo) {
      vueListo = import(URL_VUE).catch(function (error) {
        vueListo = null;
        throw error;
      });
    }
    return vueListo;
  }

  // -------------------------------------------------------------------
  // 3. Estado del MFE. Vive fuera del componente, así que sobrevive a
  //    un remontaje: si el usuario navega a otro sitio y vuelve, el
  //    catálogo recuerda su búsqueda.
  //    Los ref() se crean cuando Vue ya cargó (no hay Vue antes de eso).
  // -------------------------------------------------------------------
  let estado = null;

  function crearEstado(vue) {
    if (!estado) {
      estado = {
        busqueda: vue.ref(''),
        categoria: vue.ref(TODAS),
        agregado: vue.ref(null)   // id del plato que acaba de agregarse
      };
    }
    return estado;
  }

  const PLANTILLA = `
    <section class="cat-raiz">
      <h2 class="cat-titulo">Catálogo de platos</h2>
      <p class="cat-version">mfe-catalogo v{{ version }} · Vue 3 desde CDN</p>

      <div class="cat-filtros">
        <input class="cat-buscar" type="search" v-model="busqueda"
               placeholder="Buscar un plato por nombre..." aria-label="Buscar un plato por nombre">
        <select class="cat-select" v-model="categoria" aria-label="Filtrar por categoría">
          <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <p class="cat-resumen">{{ filtrados.length }} de {{ total }} platos</p>

      <div class="cat-grilla">
        <article class="cat-tarjeta" v-for="p in filtrados" :key="p.id">
          <div class="cat-categoria">{{ p.categoria }}</div>
          <div class="cat-nombre">{{ p.nombre }}</div>
          <div class="cat-precio">{{ precio(p.precio) }}</div>
          <button class="cat-boton" type="button" @click="agregar(p)">
            {{ agregado === p.id ? '¡Agregado!' : 'Agregar al carrito' }}
          </button>
        </article>
      </div>

      <p class="cat-vacio" v-if="filtrados.length === 0">
        No hay platos que coincidan con la búsqueda o la categoría elegida.
      </p>
    </section>
  `;

  function crearComponente(vue, st) {
    return {
      setup() {
        // Búsqueda por nombre + filtro por categoría (las dos cosas a la vez).
        const filtrados = vue.computed(function () {
          const texto = st.busqueda.value.trim().toLowerCase();
          return PLATOS.filter(function (p) {
            const porNombre = p.nombre.toLowerCase().indexOf(texto) !== -1;
            const porCategoria = st.categoria.value === TODAS || p.categoria === st.categoria.value;
            return porNombre && porCategoria;
          });
        });

        return {
          version: VERSION,
          total: PLATOS.length,
          categorias: [TODAS].concat(CATEGORIAS),
          busqueda: st.busqueda,
          categoria: st.categoria,
          agregado: st.agregado,
          filtrados: filtrados,
          precio: function (valor) { return pesos.format(valor); },
          agregar: agregar
        };
      },
      template: PLANTILLA
    };
  }

  // -------------------------------------------------------------------
  // 4. Comunicación: solo eventos públicos sobre window.
  //    No sabemos (ni necesitamos saber) quién los escucha.
  //    El campo `categoria` es nuevo en la versión 1.1; los consumidores
  //    antiguos simplemente lo ignoran (compatibilidad hacia atrás).
  // -------------------------------------------------------------------
  let temporizador = null;

  function agregar(plato) {
    window.dispatchEvent(new CustomEvent(EVENTO_AGREGAR, {
      detail: {
        version: VERSION_EVENTO,
        id: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        categoria: plato.categoria
      }
    }));

    if (!estado) return;
    estado.agregado.value = plato.id;
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      if (estado) estado.agregado.value = null;
      temporizador = null;
    }, 900);
  }

  // -------------------------------------------------------------------
  // 5. Montaje y desmontaje (el contrato con el contenedor)
  // -------------------------------------------------------------------
  let app = null;          // instancia de Vue viva
  let idMontado = null;    // id del contenedor donde está montada
  let generacion = 0;      // invalida los renders que quedaron a medias

  function soltar() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    if (app) {
      app.unmount();
      app = null;
    }
    if (idMontado) {
      const raiz = document.getElementById(idMontado);
      if (raiz) raiz.innerHTML = '';
    }
    idMontado = null;
    if (estado) estado.agregado.value = null;
  }

  // Devuelve una Promise. Se resuelve cuando el catálogo YA está en pantalla,
  // así el contenedor puede esperar con `await` antes de dizer "montado".
  window.renderCatalogo = function (idContenedor) {
    const miGeneracion = ++generacion;
    asegurarEstilos();

    return cargarVue().then(function (vue) {
      // El usuario navegó a otra ruta (o se llamó unmountCatalogo) mientras
      // se descargaba Vue: en ese caso NO montamos nada y no queda rastro.
      if (miGeneracion !== generacion) {
        return { montado: false, version: VERSION, motivo: 'se desmontó mientras Vue cargaba' };
      }

      soltar();  // por si se vuelve a montar sin desmontar antes

      const raiz = document.getElementById(idContenedor);
      if (!raiz) {
        throw new Error('mfe-catalogo: no existe el contenedor #' + idContenedor);
      }

      const st = crearEstado(vue);
      idMontado = idContenedor;
      app = vue.createApp(crearComponente(vue, st));
      app.mount(raiz);

      return { montado: true, version: VERSION };
    });
  };

  window.unmountCatalogo = function (idContenedor) {
    // Sumar a la generación cancela cualquier renderCatalogo pendiente.
    generacion++;
    soltar();
  };

  // Versión publicada, útil para el video y para la documentación.
  window.CATALOGO_VERSION = VERSION;
})();
