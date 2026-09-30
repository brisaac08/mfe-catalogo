# SaborUPC 2.0 — mfe-catalogo

**Dueño:** Brayan · Equipo Descubrimiento
**Puerto:** 8081 · **Publicado en:** https://brisaac08.github.io/mfe-catalogo/catalogo.js
**Tecnología:** Vue 3.5.43 desde CDN, sin paso de compilación · **Versión:** 2.0.0

Micro frontend del catálogo de platos: lista, búsqueda por nombre, filtro por categoría y botón para agregar al carrito.

## Cómo ejecutarlo

```bash
python -m http.server 8081
```

- `http://localhost:8081/` → modo independiente (sin contenedor), con la lista de eventos publicados.
- `http://localhost:8081/contrato.html` → prueba de contrato automática.

## Contrato de montaje

| Función | Descripción |
|---|---|
| `window.renderCatalogo(idContenedor)` | Monta el catálogo. **Devuelve una Promise** que se resuelve con `{ montado: true, version }` cuando ya está en pantalla (Vue se descarga de forma asíncrona). |
| `window.unmountCatalogo(idContenedor)` | Desmonta y limpia. Si se llama antes de que Vue termine de cargar, el montaje pendiente se cancela y la Promise resuelve con `{ montado: false }`. |

## Eventos

| Evento | Rol | Versión | detail |
|---|---|---|---|
| `carrito:agregar` | Publica | 1.1 | `{ version: '1.1', id, nombre, precio, categoria }` |

**Compatibilidad hacia atrás:** la versión 1.0 era `{ id, nombre, precio }`. La 1.1 agrega `version` y `categoria`. El carrito no tuvo que cambiar, porque ignora los campos que no conoce.

## Dependencias

| Dependencia | Origen | Por qué |
|---|---|---|
| Vue 3.5.43 (`vue.esm-browser.prod.js`) | unpkg.com | Build completo con compilador de plantillas; se importa con `import()` sin compilar. Versión fija para evitar sorpresas. |
| `tokens.css` | design-system (:8085) | Colores, tipografía y espaciado, siempre con valor de respaldo. |

## Prueba de contrato (`contrato.html`)

Verifica sin el contenedor: que existan `renderCatalogo` y `unmountCatalogo`, que desmontar durante la carga no deje nada montado, que al montar aparezcan los platos, la búsqueda y el filtro, que `carrito:agregar` cumpla la estructura v1.1 y que desmontar limpie el contenedor.

## Publicación en GitHub Pages

Settings → Pages → *Deploy from a branch* → `main` / `(root)`. No hay paso de compilación: Pages sirve `catalogo.js` tal cual. Para usarlo, el contenedor cambia la `url` de `/catalogo` en `registro.js`.

## Aislamiento de estilos

Todas las clases usan el prefijo `cat-`.
