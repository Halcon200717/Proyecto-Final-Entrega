/**
 * INTEGRACIÓN DE SISTEMAS HW — script.js
 * Módulos: Reloj, Clima, Productos, Filtros, Buscador,
 *          Modal, Carrito, Toast, Formulario.
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ================================================
       MÓDULO: TOAST (notificaciones visuales)
    ================================================ */
  const toastContainer = document.getElementById("toast-container");

  function mostrarToast(mensaje, tipo = "info") {
    const toast = document.createElement("div");
    toast.className = `toast${tipo === "error" ? " error" : ""}`;
    toast.textContent = mensaje;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("salir");
      toast.addEventListener("animationend", () => toast.remove(), {
        once: true,
      });
    }, 3200);
  }

  /* ================================================
       MÓDULO: RELOJ
    ================================================ */
  const timeDisplay = document.getElementById("time-display");
  const dateDisplay = document.getElementById("date-display");

  function actualizarHora() {
    const ahora = new Date();
    if (timeDisplay)
      timeDisplay.textContent = ahora.toLocaleTimeString("es-AR");
    if (dateDisplay)
      dateDisplay.textContent = ahora.toLocaleDateString("es-AR");
  }

  actualizarHora();
  setInterval(actualizarHora, 1000);

  /* ================================================
       MÓDULO: CLIMA
       Coordenadas por defecto: Monte Grande, Buenos Aires
    ================================================ */
  const ICONO_MAP = {
    0: "☀️",
    1: "🌤️",
    2: "🌤️",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌧️",
    53: "🌧️",
    55: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    80: "🌧️",
    81: "🌧️",
    82: "🌧️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  async function fetchConTimeout(url, ms = 5000) {
    const controlador = new AbortController();
    const idTimeout = setTimeout(() => controlador.abort(), ms);
    try {
      const respuesta = await fetch(url, { signal: controlador.signal });
      clearTimeout(idTimeout);
      return respuesta;
    } catch (error) {
      clearTimeout(idTimeout);
      throw error;
    }
  }

  function iconoPorDescripcion(descripcion = "") {
    const d = descripcion.toLowerCase();
    if (d.includes("thunder")) return "⛈️";
    if (d.includes("snow")) return "❄️";
    if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
    if (d.includes("fog") || d.includes("mist")) return "🌫️";
    if (d.includes("cloud")) return d.includes("partly") ? "🌤️" : "☁️";
    if (d.includes("clear") || d.includes("sunny")) return "☀️";
    return "🌤️";
  }

  async function obtenerClima(lat = -34.8166, lon = -58.4597) {
    const iconoEl = document.getElementById("weather-icon");
    const tempEl = document.getElementById("temp-display");
    const cityEl = document.getElementById("city-display");

    // --- Temperatura: Open-Meteo primero, wttr.in como respaldo ---
    try {
      const respuesta = await fetchConTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
      );

      if (!respuesta.ok) throw new Error("Open-Meteo respondió con error");

      const datos = await respuesta.json();

      tempEl.textContent = `${Math.round(datos.current.temperature_2m)}°C`;
      iconoEl.textContent = ICONO_MAP[datos.current.weather_code] || "🌤️";
    } catch (errorPrincipal) {
      console.warn(
        "Open-Meteo no respondió, probando fuente alternativa:",
        errorPrincipal,
      );

      try {
        const respuestaAlt = await fetchConTimeout(
          `https://wttr.in/${lat},${lon}?format=j1`,
        );

        if (!respuestaAlt.ok) throw new Error("wttr.in respondió con error");

        const datosAlt = await respuestaAlt.json();
        const actual = datosAlt.current_condition[0];

        tempEl.textContent = `${Math.round(actual.temp_C)}°C`;
        iconoEl.textContent = iconoPorDescripcion(
          actual.weatherDesc[0].value,
        );
      } catch (errorAlt) {
        console.error("Error del clima (ambas fuentes fallaron):", errorAlt);
        tempEl.textContent = "--°C";
        iconoEl.textContent = "🌤️";
      }
    }

    // --- Ciudad: independiente de la temperatura ---
    try {
      const ciudadRespuesta = await fetchConTimeout(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      );

      if (!ciudadRespuesta.ok) throw new Error("Error obteniendo la ciudad");

      const ciudadDatos = await ciudadRespuesta.json();

      cityEl.textContent =
        ciudadDatos.address.city ||
        ciudadDatos.address.town ||
        ciudadDatos.address.village ||
        ciudadDatos.address.suburb ||
        ciudadDatos.address.county ||
        "Monte Grande";
    } catch (error) {
      console.warn("No se pudo obtener la ciudad:", error);
      cityEl.textContent = "Monte Grande";
    }
  }

  // Intentar ubicación real; fallback a Monte Grande
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => obtenerClima(pos.coords.latitude, pos.coords.longitude),
      () => obtenerClima(),
    );
  } else {
    obtenerClima();
  }

  setInterval(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => obtenerClima(pos.coords.latitude, pos.coords.longitude),
        () => obtenerClima(),
      );
    } else {
      obtenerClima();
    }
  }, 600000);
  // Actualizar cada 10 minutos

  /* ================================================
       MÓDULO: BASE DE DATOS DE PRODUCTOS
    ================================================ */
  const PRODUCTOS = [
    // LAPTOPS
    {
      id: "lap-1",
      categoria: "laptops",
      titulo: "Laptop Pro X15",
      precio: "$1.250.000",
      descripcion:
        "Procesador de última generación con 16GB RAM y 512GB SSD. Ideal para desarrollo de software.",
      imagen: "imagenes/img Laptops/Laptop Pro X15.jpg",
    },
    {
      id: "lap-2",
      categoria: "laptops",
      titulo: "Apple MacBook Air Intel Core i5 4GB 128GB",
      precio: "$1.900.000",
      descripcion:
        'Intel Core i5 de doble núcleo a 1,6 GHz (Turbo Boost hasta 2,7 GHz), 3 MB caché L3. Pantalla 13,3" LED 1440×900. Intel HD Graphics 6000.',
      imagen: "imagenes/img Laptops/Apple MacBook Air Intel Core i5.jpg",
    },
    {
      id: "lap-3",
      categoria: "laptops",
      titulo: "Lenovo Legion Pro 7i Gen 10",
      precio: "$3.450.000",
      descripcion:
        "Intel Core Ultra 9 275HX 24C, NVIDIA GeForce RTX 5090 24GB, 64GB RAM, 2TB NVMe SSD, OLED WQXGA 240Hz, Windows 11 Home.",
      imagen: "imagenes/img Laptops/Lenovo Legion Pro 7i Gen 10.jpg",
    },
    {
      id: "lap-4",
      categoria: "laptops",
      titulo: 'MSI Stealth 18 HX AI 18" 120Hz UHD+',
      precio: "$2.990.000",
      descripcion:
        '18" QHD+ 240Hz Mini LED. Intel Core i9-14900HX, RTX 4090 175W, 32GB DDR5, 2TB PCIe Gen4, Wi-Fi 7, Windows 11 Pro.',
      imagen: "imagenes/img Laptops/MSI Stealth 18 HX AI 18” 120Hz UHD+.jpg",
    },
    {
      id: "lap-5",
      categoria: "laptops",
      titulo: "Dell Alienware 16 Aurora Gaming Intel 7",
      precio: "$3.150.000",
      descripcion:
        'Intel Core i7-14900HX hasta 5.8GHz, RTX 4090 16GB, 16" QHD+ 165Hz, 64GB DDR5, 4TB SSD RAID 0, Windows 11 Pro.',
      imagen:
        "imagenes/img Laptops/Dell Alienware 16 Aurora Gaming Intel 7.jpg",
    },
    {
      id: "lap-6",
      categoria: "laptops",
      titulo: "Acer Nitro V 16S AI",
      precio: "$2.100.000",
      descripcion:
        'AMD Ryzen 7 260, NVIDIA RTX 5060, pantalla IPS WUXGA 180Hz 16", DDR5 32GB, SSD Gen 4 1TB, Wi-Fi.',
      imagen: "imagenes/img Laptops/Acer Nitro V 16S AI .jpg",
    },

    // TECLADOS
    {
      id: "tec-1",
      categoria: "teclados",
      titulo: "AULA Teclado mecánico inalámbrico F99",
      precio: "$185.000",
      descripcion:
        "Triple modo BT5.0/2.4GHz/USB-C, intercambiable en caliente, interruptores lineales prelubricados.",
      imagen: "imagenes/img teclado/AULA Teclado mecánico inalámbrico F99.jpg",
    },
    {
      id: "tec-2",
      categoria: "teclados",
      titulo: "Lenovo 800 Teclado Bluetooth Autocargable",
      precio: "$195.000",
      descripcion:
        "Carga por luz ambiental, Bluetooth 5.1, soporta 3 dispositivos, blanco.",
      imagen:
        "imagenes/img teclado/Lenovo 800 Teclado Bluetooth Autocargable.jpg",
    },
    {
      id: "tec-3",
      categoria: "teclados",
      titulo: "RedThunder Teclado mecánico inalámbrico K95",
      precio: "$240.000",
      descripcion:
        'Pantalla TFT 1.14" y perilla CNC. Tri-Mode BT5.0/2.4GHz/USB-C, interruptores rosados prelubricados.',
      imagen:
        "imagenes/img teclado/RedThunder Teclado mecánico inalámbrico K95.jpg",
    },
    {
      id: "tec-4",
      categoria: "teclados",
      titulo: "Logitech MX Keys S Combo",
      precio: "$295.000",
      descripcion:
        "Teclado + mouse inalámbricos con reposamanos, Bluetooth/USB, 8000 dpi, batería recargable, negro.",
      imagen:
        "imagenes/img teclado/Logitech MX Keys S Combo - Teclado y ratón inalámbrico.jpg",
    },
    {
      id: "tec-5",
      categoria: "teclados",
      titulo: "FINEDAY 2.0 Plus",
      precio: "$320.000",
      descripcion:
        "Estilo máquina de escribir retro, cuerpo aluminio aeronáutico, Cherry MX Blue, control de volumen y brillo.",
      imagen: "imagenes/img teclado/FINEDAY 2.0 Plus.jpg",
    },

    // PLACAS GRÁFICAS
    {
      id: "gpu-1",
      categoria: "graficas",
      titulo: "ASUS ROG Astral GeForce RTX 5090 OC",
      precio: "$3.100.000",
      descripcion:
        "PCIe 5.0, 32GB GDDR7, HDMI/DP 2.1, 4 ventiladores Axial-tech, cámara de vapor.",
      imagen:
        "imagenes/img T.G/ASUS ROG Astral GeForce RTX™ 5090 OC Edition.jpg",
    },
    {
      id: "gpu-2",
      categoria: "graficas",
      titulo: "ASUS ROG Strix GeForce RTX 4090 White OC",
      precio: "$2.800.000",
      descripcion: "PCIe 4.0, 24GB GDDR6X, HDMI 2.1a, DisplayPort 1.4a.",
      imagen:
        "imagenes/img T.G/ASUS ROG Strix GeForce RTX™ 4090 White OC Edition.jpg",
    },
    {
      id: "gpu-3",
      categoria: "graficas",
      titulo: "MSI Gaming RTX 4080 Super 16G",
      precio: "$1.950.000",
      descripcion:
        "NVIDIA RTX 4080 Super, 256 bits, 2625 MHz, 16GB GDDR6X 23 Gbps, Arquitectura Ada Lovelace.",
      imagen: "imagenes/img T.G/MSI Gaming RTX 4080 Super 16G .jpg",
    },
    {
      id: "gpu-4",
      categoria: "graficas",
      titulo: "ASRock AMD Radeon RX 7900 XTX Phantom Gaming 24GB",
      precio: "$1.890.000",
      descripcion:
        "GDDR6 384-Bit, refrigeración Phantom Gaming 3X, PCI-Express x16.",
      imagen:
        "imagenes/img T.G/ASRock AMD Radeon RX 7900 XTX Phantom Gaming 24GB OC GDDR6.jpg",
    },
    {
      id: "gpu-5",
      categoria: "graficas",
      titulo: "MSI GeForce RTX 4070 Ti Super 16G Expert",
      precio: "$1.350.000",
      descripcion:
        "16GB GDDR6X, PCI Express 4.0, 2670 MHz / 21000 MHz, DisplayPort y HDMI.",
      imagen: "imagenes/img T.G/MSI GeForce RTX 4070 Ti Super 16G Expert.jpg",
    },
  ];

  /* ================================================
       MÓDULO: CARRITO
    ================================================ */
  let carrito = [];

  const COSTO_ENVIO = 8000; // costo de envío fijo (ARS)

  const carritoCount = document.getElementById("carrito-count");
  const btnCarrito = document.getElementById("btn-carrito");
  const panelCarrito = document.getElementById("panel-carrito");
  const listaCarrito = document.getElementById("lista-carrito");
  const subtotalCarrito = document.getElementById("subtotal-carrito");
  const envioCarrito = document.getElementById("envio-carrito");
  const totalCarrito = document.getElementById("total-carrito");
  const totalCarritoDetalle = document.getElementById(
    "total-carrito-detalle",
  );
  const cerrarCarrito = document.getElementById("cerrar-carrito");
  const btnVaciar = document.getElementById("btn-vaciar");
  const btnFinalizar = document.getElementById("btn-finalizar");
  const metodoPagoInputs = document.querySelectorAll(
    'input[name="metodo-pago"]',
  );
  const cuotasContainer = document.getElementById("cuotas-container");
  const cuotasPago = document.getElementById("cuotas-pago");
  const overlayCarrito = document.getElementById("overlay-carrito");

  // Porcentaje de interés según cantidad de cuotas (solo tarjeta de crédito)
  const CUOTAS_INTERES = {
    "1": 0,
    "3": 0.02,
    "6": 0.04,
    "12": 0.08,
  };

  function obtenerMetodoPago() {
    const seleccionado = document.querySelector(
      'input[name="metodo-pago"]:checked',
    );
    return seleccionado ? seleccionado.value : "debito";
  }

  function obtenerEtiquetaMetodoPago() {
    const mapa = {
      debito: "💳 Tarjeta de débito",
      credito: "💳 Tarjeta de crédito",
      mercadopago: "🏦 Mercado Pago",
      paypal: "🅿️ PayPal",
    };
    return mapa[obtenerMetodoPago()] || "";
  }

  function actualizarVisibilidadCuotas() {
    const esCredito = obtenerMetodoPago() === "credito";
    if (cuotasContainer) cuotasContainer.hidden = !esCredito;
    renderizarCarrito();
  }

  metodoPagoInputs.forEach((input) => {
    input.addEventListener("change", actualizarVisibilidadCuotas);
  });

  cuotasPago?.addEventListener("change", renderizarCarrito);

  function abrirPanelCarrito() {
    panelCarrito.hidden = false;
    overlayCarrito.hidden = false;
    renderizarCarrito();
  }

  function cerrarPanelCarrito() {
    panelCarrito.hidden = true;
    overlayCarrito.hidden = true;
  }

  function agregarAlCarrito(producto, cantidad = 1) {
    if (!producto) return;
    cantidad = Math.max(1, Math.min(99, Math.round(cantidad) || 1));

    const existente = carrito.find((i) => i.id === producto.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      carrito.push({ ...producto, cantidad });
    }
    actualizarContadorCarrito();

    const detalleCantidad = cantidad > 1 ? `${cantidad} × ` : "";
    mostrarToast(`✅ ${detalleCantidad}"${producto.titulo}" agregado al carrito`);
  }

  function eliminarDelCarrito(id) {
    carrito = carrito.filter((i) => i.id !== id);
    actualizarContadorCarrito();
    renderizarCarrito();
  }

  function actualizarContadorCarrito() {
    const total = carrito.reduce((acc, i) => acc + i.cantidad, 0);
    carritoCount.textContent = total;

    // Animación "bump"
    carritoCount.classList.remove("bump");
    void carritoCount.offsetWidth; // reflow
    carritoCount.classList.add("bump");
  }

  function parsearPrecio(precioStr) {
    // "$1.250.000" → 1250000
    return parseInt(precioStr.replace(/\$|\./g, ""), 10) || 0;
  }

  function calcularTotales() {
    const subtotal = carrito.reduce(
      (acc, i) => acc + parsearPrecio(i.precio) * i.cantidad,
      0,
    );
    const envio = carrito.length > 0 ? COSTO_ENVIO : 0;
    const totalSinInteres = subtotal + envio;

    let interes = 0;
    let cuotas = 1;
    if (obtenerMetodoPago() === "credito") {
      cuotas = parseInt(cuotasPago?.value, 10) || 1;
      const tasa = CUOTAS_INTERES[String(cuotas)] || 0;
      interes = Math.round(totalSinInteres * tasa);
    }

    const total = totalSinInteres + interes;
    const valorCuota = cuotas > 0 ? Math.round(total / cuotas) : total;

    return { subtotal, envio, interes, cuotas, valorCuota, total };
  }

  function formatearPesos(monto) {
    return "$" + monto.toLocaleString("es-AR");
  }

  function cambiarCantidadCarrito(id, delta) {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    actualizarContadorCarrito();
    renderizarCarrito();
  }

  function generarEnlacesCompartir(item) {
    const url = window.location.href;
    const texto = `Mirá "${item.titulo}" a ${item.precio} en Integración de Sistemas HW`;
    const textoCod = encodeURIComponent(texto);
    const urlCod = encodeURIComponent(url);

    return {
      email: `mailto:?subject=${encodeURIComponent(item.titulo)}&body=${textoCod}%20${urlCod}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${urlCod}`,
      x: `https://twitter.com/intent/tweet?text=${textoCod}&url=${urlCod}`,
      whatsapp: `https://wa.me/?text=${textoCod}%20${urlCod}`,
    };
  }

  function renderizarCarrito() {
    listaCarrito.innerHTML = "";

    if (carrito.length === 0) {
      listaCarrito.innerHTML =
        '<p class="carrito-vacio">El carrito está vacío 🛒</p>';
      subtotalCarrito.textContent = "$0";
      envioCarrito.textContent = "$0";
      totalCarrito.textContent = "$0";
      return;
    }

    carrito.forEach((item) => {
      const enlaces = generarEnlacesCompartir(item);
      const el = document.createElement("div");
      el.className = "carrito-item";
      el.innerHTML = `
                <div class="carrito-item-top">
                    <img src="${item.imagen}" alt="${item.titulo}" loading="lazy">
                    <div class="carrito-item-info">
                        <p>${item.titulo}</p>
                        <span>${item.precio} × ${item.cantidad}</span>
                    </div>
                </div>
                <div class="carrito-item-acciones">
                    <div class="carrito-item-cantidad">
                        <button type="button" class="btn-cantidad-carrito btn-menos-carrito" data-id="${item.id}" aria-label="Restar cantidad de ${item.titulo}">−</button>
                        <span class="cantidad-valor-carrito">${item.cantidad}</span>
                        <button type="button" class="btn-cantidad-carrito btn-mas-carrito" data-id="${item.id}" aria-label="Sumar cantidad de ${item.titulo}">+</button>
                    </div>
                    <button type="button" class="carrito-item-remove" data-id="${item.id}" aria-label="Eliminar ${item.titulo}">Eliminar</button>
                    <div class="compartir-wrapper">
                        <button type="button" class="btn-compartir-item" data-id="${item.id}" aria-haspopup="true" aria-expanded="false">Compartir</button>
                        <div class="compartir-menu" id="compartir-${item.id}" hidden>
                            <a href="${enlaces.email}" target="_blank" rel="noopener">📧 Email</a>
                            <a href="${enlaces.facebook}" target="_blank" rel="noopener">📘 Facebook</a>
                            <a href="${enlaces.x}" target="_blank" rel="noopener">✖️ X</a>
                            <a href="${enlaces.whatsapp}" target="_blank" rel="noopener">💬 WhatsApp</a>
                        </div>
                    </div>
                </div>
            `;
      listaCarrito.appendChild(el);
    });

    // Actualizar resumen: subtotal + envío + interés (si aplica) + total
    const { subtotal, envio, interes, cuotas, valorCuota, total } =
      calcularTotales();
    subtotalCarrito.textContent = formatearPesos(subtotal);
    envioCarrito.textContent = formatearPesos(envio);

    const filaInteres = document.getElementById("interes-carrito-fila");

    if (interes > 0) {
      if (filaInteres) {
        filaInteres.hidden = false;
        filaInteres.querySelector(
          ".interes-monto",
        ).textContent = `+ ${formatearPesos(interes)}`;
      }
      totalCarrito.textContent = formatearPesos(total);
      if (totalCarritoDetalle) {
        totalCarritoDetalle.hidden = false;
        totalCarritoDetalle.textContent = `${cuotas} cuotas de ${formatearPesos(valorCuota)}`;
      }
    } else {
      if (filaInteres) filaInteres.hidden = true;
      totalCarrito.textContent = formatearPesos(total);
      if (totalCarritoDetalle) totalCarritoDetalle.hidden = true;
    }
  }

  // Eventos del carrito
  btnCarrito?.addEventListener("click", abrirPanelCarrito);
  cerrarCarrito.addEventListener("click", cerrarPanelCarrito);
  overlayCarrito.addEventListener("click", cerrarPanelCarrito);

  btnVaciar.addEventListener("click", () => {
    carrito = [];
    actualizarContadorCarrito();
    renderizarCarrito();
    mostrarToast("🗑️ Carrito vaciado");
  });

  btnFinalizar?.addEventListener("click", () => {
    if (carrito.length === 0) {
      mostrarToast("🛒 Tu carrito está vacío.", "error");
      return;
    }

    const metodoTexto = obtenerEtiquetaMetodoPago();
    const { total, cuotas, valorCuota, interes } = calcularTotales();

    const detalleCuotas =
      interes > 0
        ? ` en ${cuotas} cuotas de ${formatearPesos(valorCuota)}`
        : "";

    mostrarToast(
      `✅ Compra confirmada por ${formatearPesos(total)} con ${metodoTexto}${detalleCuotas}.`,
    );

    carrito = [];
    actualizarContadorCarrito();
    renderizarCarrito();
    cerrarPanelCarrito();
  });

  listaCarrito.addEventListener("click", (e) => {
    const btnRemove = e.target.closest(".carrito-item-remove");
    const btnMenos = e.target.closest(".btn-menos-carrito");
    const btnMas = e.target.closest(".btn-mas-carrito");
    const btnCompartir = e.target.closest(".btn-compartir-item");

    if (btnRemove) {
      eliminarDelCarrito(btnRemove.dataset.id);
      return;
    }

    if (btnMenos || btnMas) {
      const id = (btnMenos || btnMas).dataset.id;
      cambiarCantidadCarrito(id, btnMas ? 1 : -1);
      return;
    }

    if (btnCompartir) {
      e.stopPropagation();
      const menu = document.getElementById(
        `compartir-${btnCompartir.dataset.id}`,
      );
      const yaEstabaAbierto = menu && !menu.hidden;

      // Cerrar todos los menús de compartir abiertos
      document
        .querySelectorAll(".compartir-menu")
        .forEach((m) => (m.hidden = true));

      if (menu) {
        menu.hidden = yaEstabaAbierto;
        btnCompartir.setAttribute("aria-expanded", String(!yaEstabaAbierto));
      }
    }
  });

  // Cerrar menús de "compartir" al hacer clic fuera de ellos
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".compartir-wrapper")) {
      document
        .querySelectorAll(".compartir-menu")
        .forEach((m) => (m.hidden = true));
    }
  });

  /* ================================================
       MÓDULO: MODAL
    ================================================ */
  const modal = document.getElementById("modal-producto");
  const modalImagen = document.getElementById("modal-imagen");
  const modalTitulo = document.getElementById("modal-titulo");
  const modalDesc = document.getElementById("modal-descripcion");
  const modalPrecio = document.getElementById("modal-precio");
  const btnCerrarModal = document.querySelector(".close-modal");
  const btnModalCarrito = document.getElementById("btn-modal-carrito");

  let productoEnModal = null;

  function abrirModal(producto) {
    productoEnModal = producto;
    modalImagen.src = producto.imagen;
    modalImagen.alt = producto.titulo;
    modalTitulo.textContent = producto.titulo;
    modalDesc.textContent = producto.descripcion;
    modalPrecio.textContent = producto.precio;
    modal.hidden = false;
    modal.focus();
    document.body.style.overflow = "hidden";
  }

  function cerrarModal() {
    modal.hidden = true;
    productoEnModal = null;
    document.body.style.overflow = "";
  }

  btnCerrarModal.addEventListener("click", cerrarModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!modal.hidden) cerrarModal();
      if (!panelCarrito.hidden) cerrarPanelCarrito();
      if (modalLogin && !modalLogin.hidden) cerrarModalAuth(modalLogin);
      if (modalRegistro && !modalRegistro.hidden)
        cerrarModalAuth(modalRegistro);
    }
  });

  btnModalCarrito.addEventListener("click", () => {
    if (productoEnModal) {
      agregarAlCarrito(productoEnModal);
    }
  });

  /* ================================================
       MÓDULO: RENDERIZADO DE PRODUCTOS
    ================================================ */
  const contenedor = document.getElementById("contenedor-productos");
  const sinResultados = document.getElementById("sin-resultados");
  const resultadoCount = document.getElementById("resultado-count");

  function crearTarjeta(producto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "card";
    tarjeta.setAttribute("data-categoria", producto.categoria);
    tarjeta.setAttribute("data-titulo", producto.titulo.toLowerCase());
    tarjeta.setAttribute("data-id", producto.id);

    // Accesibilidad
    tarjeta.tabIndex = 0;
    tarjeta.setAttribute("role", "button");
    tarjeta.setAttribute("aria-label", `Ver detalles de ${producto.titulo}`);

    tarjeta.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.titulo}" loading="lazy">
        <div class="card-content">
            <h3>${producto.titulo}</h3>
            <p>${producto.descripcion}</p>
            <p class="card-precio">${producto.precio}</p>
            <div class="cantidad-selector" role="group" aria-label="Seleccionar cantidad">
                <button
                    type="button"
                    class="btn-cantidad btn-menos"
                    data-id="${producto.id}"
                    aria-label="Restar cantidad"
                >−</button>
                <span
                    class="cantidad-valor"
                    id="cantidad-${producto.id}"
                    aria-live="polite"
                >1</span>
                <button
                    type="button"
                    class="btn-cantidad btn-mas"
                    data-id="${producto.id}"
                    aria-label="Sumar cantidad"
                >+</button>
            </div>
            <div class="card-botones">
                <button class="btn-comprar" data-id="${producto.id}">
                    Comprar ahora
                </button>
                <button class="btn-card" data-id="${producto.id}">
                    🛒 Agregar al carrito
                </button>
            </div>
        </div>
        `;

    // Doble clic → abrir modal
    tarjeta.addEventListener("dblclick", () => abrirModal(producto));

    // Permitir abrir con Enter o Espacio
    tarjeta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirModal(producto);
      }
    });

    return tarjeta;
  }

  // Renderizar todos los productos al inicio
  if (contenedor) {
    PRODUCTOS.forEach((p) => contenedor.appendChild(crearTarjeta(p)));
    actualizarContador();
  }

  /* ================================================
       MÓDULO: FILTROS + BUSCADOR (combinados)
    ================================================ */
  const botonesFiltro = document.querySelectorAll(".btn-filtro");
  const buscador = document.getElementById("buscador");

  let filtroActivo = "todos";
  let textoBusqueda = "";

  function aplicarFiltros() {
    const tarjetas = contenedor.querySelectorAll(".card");
    let visibles = 0;

    tarjetas.forEach((tarjeta) => {
      const categoria = tarjeta.getAttribute("data-categoria");
      const titulo = tarjeta.getAttribute("data-titulo");

      const coincideCategoria =
        filtroActivo === "todos" || categoria === filtroActivo;
      const coincideBusqueda = titulo.includes(textoBusqueda);

      const mostrar = coincideCategoria && coincideBusqueda;
      tarjeta.style.display = mostrar ? "" : "none";
      if (mostrar) visibles++;
    });

    // Mostrar/ocultar mensaje sin resultados
    sinResultados.hidden = visibles > 0;
    actualizarContador(visibles);
  }

  function actualizarContador(n) {
    const total = n !== undefined ? n : PRODUCTOS.length;
    resultadoCount.textContent = `${total} producto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;
  }

  // Eventos filtros
  botonesFiltro.forEach((btn) => {
    btn.addEventListener("click", () => {
      botonesFiltro.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtroActivo = btn.getAttribute("data-filtro");
      aplicarFiltros();
    });
  });

  // Evento buscador (con pequeño debounce)
  let debounceTimer;
  buscador?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      textoBusqueda = buscador.value.toLowerCase().trim();
      aplicarFiltros();
    }, 220);
  });

  /* ================================================
       MÓDULO: SELECTOR DE CANTIDAD en las tarjetas (+ / -)
    ================================================ */
  const cantidadesSeleccionadas = {};

  function obtenerCantidadSeleccionada(id) {
    return cantidadesSeleccionadas[id] || 1;
  }

  function fijarCantidadSeleccionada(id, cantidad) {
    cantidad = Math.max(1, Math.min(99, cantidad));
    cantidadesSeleccionadas[id] = cantidad;
    const span = document.getElementById(`cantidad-${id}`);
    if (span) span.textContent = cantidad;
    return cantidad;
  }

  /* ================================================
       MÓDULO: BOTONES "AGREGAR AL CARRITO" Y "COMPRAR AHORA" en las tarjetas
    ================================================ */
  contenedor?.addEventListener("click", (e) => {
    const btnMenos = e.target.closest(".btn-menos");
    const btnMas = e.target.closest(".btn-mas");
    const btnAgregar = e.target.closest(".btn-card");
    const btnComprar = e.target.closest(".btn-comprar");

    // Botones + / - de cantidad
    if (btnMenos || btnMas) {
      e.stopPropagation();
      const id = (btnMenos || btnMas).dataset.id;
      const actual = obtenerCantidadSeleccionada(id);
      fijarCantidadSeleccionada(id, btnMas ? actual + 1 : actual - 1);
      return;
    }

    // Evitar que cualquiera de los dos dispare el dblclick del padre (abrir modal)
    if (btnAgregar) {
      e.stopPropagation();
      const producto = PRODUCTOS.find((p) => p.id === btnAgregar.dataset.id);
      if (producto) {
        const cantidad = obtenerCantidadSeleccionada(producto.id);
        agregarAlCarrito(producto, cantidad);
        fijarCantidadSeleccionada(producto.id, 1);
      }
      return;
    }

    if (btnComprar) {
      e.stopPropagation();
      const producto = PRODUCTOS.find((p) => p.id === btnComprar.dataset.id);
      if (producto) {
        const cantidad = obtenerCantidadSeleccionada(producto.id);
        agregarAlCarrito(producto, cantidad);
        fijarCantidadSeleccionada(producto.id, 1);
        abrirPanelCarrito();
      }
    }
  });

  /* ================================================
       MÓDULO: AUTENTICACIÓN (login / registro)
       Nota: es una simulación 100% del lado del cliente
       usando localStorage. No hay backend ni cifrado real
       de contraseñas: para producción hay que reemplazar
       esta lógica por un servicio de autenticación seguro.
    ================================================ */
  const modalLogin = document.getElementById("modal-login");
  const modalRegistro = document.getElementById("modal-registro");
  const btnLogin = document.getElementById("btn-login");
  const btnRegistro = document.getElementById("btn-registro");
  const closeLogin = document.getElementById("close-login");
  const closeRegistro = document.getElementById("close-registro");
  const formLogin = document.getElementById("form-login");
  const formRegistro = document.getElementById("form-registro");
  const irARegistro = document.getElementById("ir-a-registro");
  const irALogin = document.getElementById("ir-a-login");
  const usuarioInfo = document.getElementById("usuario-info");
  const usuarioNombreDisplay = document.getElementById(
    "usuario-nombre-display",
  );
  const btnLogout = document.getElementById("btn-logout");

  function abrirModalAuth(modal) {
    if (!modal) return;
    modal.hidden = false;
    modal.focus();
    document.body.style.overflow = "hidden";
  }

  function cerrarModalAuth(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  btnLogin?.addEventListener("click", () => abrirModalAuth(modalLogin));
  btnRegistro?.addEventListener("click", () => abrirModalAuth(modalRegistro));
  closeLogin?.addEventListener("click", () => cerrarModalAuth(modalLogin));
  closeRegistro?.addEventListener("click", () =>
    cerrarModalAuth(modalRegistro),
  );

  modalLogin?.addEventListener("click", (e) => {
    if (e.target === modalLogin) cerrarModalAuth(modalLogin);
  });
  modalRegistro?.addEventListener("click", (e) => {
    if (e.target === modalRegistro) cerrarModalAuth(modalRegistro);
  });

  irARegistro?.addEventListener("click", () => {
    cerrarModalAuth(modalLogin);
    abrirModalAuth(modalRegistro);
  });
  irALogin?.addEventListener("click", () => {
    cerrarModalAuth(modalRegistro);
    abrirModalAuth(modalLogin);
  });

  function obtenerUsuarios() {
    try {
      return JSON.parse(localStorage.getItem("hw_usuarios") || "[]");
    } catch {
      return [];
    }
  }

  function guardarUsuarios(usuarios) {
    localStorage.setItem("hw_usuarios", JSON.stringify(usuarios));
  }

  function obtenerSesion() {
    try {
      return JSON.parse(localStorage.getItem("hw_sesion") || "null");
    } catch {
      return null;
    }
  }

  function guardarSesion(usuario) {
    localStorage.setItem("hw_sesion", JSON.stringify(usuario));
  }

  function actualizarUIUsuario() {
    const sesion = obtenerSesion();
    if (sesion) {
      if (btnLogin) btnLogin.hidden = true;
      if (btnRegistro) btnRegistro.hidden = true;
      if (usuarioInfo) usuarioInfo.hidden = false;
      if (usuarioNombreDisplay) {
        usuarioNombreDisplay.textContent = `👋 ${sesion.nombre.split(" ")[0]}`;
      }
    } else {
      if (btnLogin) btnLogin.hidden = false;
      if (btnRegistro) btnRegistro.hidden = false;
      if (usuarioInfo) usuarioInfo.hidden = true;
    }
  }

  actualizarUIUsuario();

  formRegistro?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("registro-nombre").value.trim();
    const email = document
      .getElementById("registro-email")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("registro-password").value;

    const errorNombre = document.getElementById("error-registro-nombre");
    const errorEmail = document.getElementById("error-registro-email");
    const errorPassword = document.getElementById("error-registro-password");

    let valido = true;

    if (nombre.length < 3) {
      errorNombre.textContent = "Ingresá un nombre válido (mínimo 3 caracteres).";
      valido = false;
    } else {
      errorNombre.textContent = "";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEmail.textContent = "Ingresá un correo electrónico válido.";
      valido = false;
    } else {
      errorEmail.textContent = "";
    }

    if (password.length < 6) {
      errorPassword.textContent = "La contraseña debe tener al menos 6 caracteres.";
      valido = false;
    } else {
      errorPassword.textContent = "";
    }

    if (!valido) return;

    const usuarios = obtenerUsuarios();
    if (usuarios.some((u) => u.email === email)) {
      errorEmail.textContent = "Ese correo ya está registrado.";
      return;
    }

    usuarios.push({ nombre, email, password });
    guardarUsuarios(usuarios);
    guardarSesion({ nombre, email });
    actualizarUIUsuario();
    cerrarModalAuth(modalRegistro);
    formRegistro.reset();
    mostrarToast(`✅ ¡Bienvenido/a, ${nombre}!`);
  });

  formLogin?.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document
      .getElementById("login-email")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("login-password").value;
    const errorPassword = document.getElementById("error-login-password");

    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password,
    );

    if (!usuario) {
      errorPassword.textContent = "Correo o contraseña incorrectos.";
      return;
    }

    errorPassword.textContent = "";
    guardarSesion({ nombre: usuario.nombre, email: usuario.email });
    actualizarUIUsuario();
    cerrarModalAuth(modalLogin);
    formLogin.reset();
    mostrarToast(`✅ ¡Hola de nuevo, ${usuario.nombre}!`);
  });

  btnLogout?.addEventListener("click", () => {
    localStorage.removeItem("hw_sesion");
    actualizarUIUsuario();
    mostrarToast("👋 Sesión cerrada");
  });

  // Limpiar errores de los formularios de auth al escribir
  [
    "registro-nombre",
    "registro-email",
    "registro-password",
    "login-email",
    "login-password",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      const error = document.getElementById(`error-${id}`);
      if (error) error.textContent = "";
    });
  });

  /* ================================================
       MÓDULO: FORMULARIO DE CONTACTO
    ================================================ */
  const formulario = document.getElementById("form-contacto");

  function validarCampo(id, errorId, condicion, mensaje) {
    const campo = document.getElementById(id);
    const error = document.getElementById(errorId);
    if (!campo || !error) return true;

    if (!condicion(campo.value.trim())) {
      campo.classList.add("invalid");
      error.textContent = mensaje;
      return false;
    }

    campo.classList.remove("invalid");
    error.textContent = "";
    return true;
  }

  formulario?.addEventListener("submit", (e) => {
    const nombreOk = validarCampo(
      "nombre",
      "error-nombre",
      (v) => v.length >= 3,
      "Ingresá un nombre válido (mínimo 3 caracteres).",
    );
    const emailOk = validarCampo(
      "email",
      "error-email",
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Ingresá un correo electrónico válido.",
    );
    const mensajeOk = validarCampo(
      "mensaje",
      "error-mensaje",
      (v) => v.length >= 10,
      "El mensaje debe tener al menos 10 caracteres.",
    );

    if (!nombreOk || !emailOk || !mensajeOk) {
      e.preventDefault();
      mostrarToast("⚠️ Revisá los campos del formulario.", "error");
      return;
    }

    // Si todo es válido, el formulario se envía normalmente a Formspree
    const nombre = document.getElementById("nombre")?.value.trim() ?? "";
    mostrarToast(`¡Gracias ${nombre}! Tu consulta fue enviada.`);
  });

  // Limpiar errores al escribir
  ["nombre", "email", "mensaje"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      document.getElementById(id)?.classList.remove("invalid");
      document.getElementById(`error-${id}`).textContent = "";
    });
  });

  /* ================================================
       MÓDULO: BOTÓN "VOLVER ARRIBA"
    ================================================ */
  const btnVolverArriba = document.getElementById("btn-volver-arriba");
  const UMBRAL_SCROLL = 300; // px desde el tope para mostrar el botón

  if (btnVolverArriba) {
    let scrollTickeando = false;

    function actualizarVisibilidadBotonSubir() {
      const mostrar = window.scrollY > UMBRAL_SCROLL;
      btnVolverArriba.classList.toggle("visible", mostrar);
      scrollTickeando = false;
    }

    // Estado inicial (por si la página carga con scroll restaurado)
    actualizarVisibilidadBotonSubir();

    window.addEventListener("scroll", () => {
      if (!scrollTickeando) {
        scrollTickeando = true;
        requestAnimationFrame(actualizarVisibilidadBotonSubir);
      }
    });

    btnVolverArriba.addEventListener("click", () => {
      const prefiereMovimientoReducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: 0,
        behavior: prefiereMovimientoReducido ? "auto" : "smooth",
      });
    });
  }
}); // fin DOMContentLoaded
