# SaborUPC · mfe-catalogo

**Equipo:** Descubrimiento · **Dueño:** Brayan · **Puerto local:** 8081 · **Tecnología:** Vue 3 (CDN, sin compilación)

Muestra los platos, permite buscar y filtrar por categoría y publica `carrito:agregar`.

## Contrato

- `window.renderCatalogo(idContenedor)` → devuelve una `Promise` que se resuelve cuando ya está montado.
- `window.unmountCatalogo(idContenedor)`
- Publica: `carrito:agregar` (ver `CONTRATOS.md` del contenedor).

## Cómo ejecutar

```bash
python -m http.server 8081
```

- http://localhost:8081 → modo independiente (sin contenedor)
- http://localhost:8081/contrato.html → prueba de contrato
