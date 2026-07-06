# Proyecto Final de Entrega — Curso Talento Tech

Este es el proyecto final del curso de Desarrollo Web de Talento Tech. Es una landing page de e-commerce para **Integración de Sistemas HW**, un comercio ficticio de hardware de alta gama pensado para desarrolladores y gamers (laptops, teclados y placas gráficas).

La pre-entrega de la Clase 08 era básicamente una página estática: HTML y CSS bien maquetados, pero sin comportamiento propio. Para esta entrega final le sumé la parte que faltaba, `script.js`, y con eso el sitio pasó de ser una vidriera a ser algo que realmente se puede usar: buscar productos, agregarlos a un carrito, simular un login, recibir notificaciones, y demás.

## Qué tecnologías y conceptos usé

En HTML organicé todo con etiquetas semánticas (`header`, `main`, `section`, `article`, `nav`, `footer`), tratando de que la estructura tenga sentido por sí sola más allá del diseño visual.

En CSS trabajé con variables (design tokens) para no repetir colores y espaciados por todos lados, y agregué soporte de modo oscuro automático según la preferencia del sistema. Para el layout combiné Flexbox (nav, sección de productos, barra del footer) y Grid (reseñas, grilla de productos, barra informativa del footer), y todo el sitio es responsive con media queries para celular, tablet y escritorio.

La parte nueva es el JavaScript. Ahí fui incorporando, de a poco, distintos módulos:

- Los productos se renderizan dinámicamente desde un array de datos, no están escritos a mano en el HTML.
- Hay un buscador con filtros por categoría que se combinan entre sí.
- El carrito de compras es funcional: se pueden sumar y restar cantidades, sacar productos, y calcula subtotal, envío e interés según el método de pago y la cantidad de cuotas.
- El login y el registro son una simulación con `localStorage` (aclaro esto también en el código, porque para producción real habría que reemplazarlo por un backend con autenticación de verdad).
- Agregué un modal de detalle de producto navegable por teclado, notificaciones tipo *toast*, un reloj y un widget de clima en vivo (con geolocalización y un par de APIs externas como respaldo si alguna falla), y un botón flotante para volver arriba de la página cuando bajás mucho.
- El formulario de contacto está conectado a Formspree y valida los campos antes de enviar.

Traté de no perder de vista la accesibilidad en el camino: atributos ARIA, foco visible, soporte para quienes prefieren menos animaciones (`prefers-reduced-motion`), y que todo lo interactivo se pueda usar con el teclado.

## Estructura del repositorio

- `index.html` — la estructura del sitio.
- `styles.css` — todos los estilos y la maquetación.
- `script.js` — la lógica: carrito, buscador, filtros, modales, login/registro, clima, reloj, botón de volver arriba, validaciones.
- `.gitignore` — para no subir archivos innecesarios al repo.

## Cómo verlo

Bajás los archivos del repositorio y abrís `index.html` en el navegador. Si el proyecto ya está desplegado, también se puede ver directamente desde el link de GitHub Pages.

---

Desarrollado por Abad Mauro — 2026
