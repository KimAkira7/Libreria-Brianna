
"use strict";

const formularioBusqueda = document.getElementById(
    "formularioBusqueda"
);

const campoBusqueda = document.getElementById(
    "campoBusqueda"
);

const estadoBusqueda = document.getElementById(
    "estadoBusqueda"
);

const resultadosProductos = document.getElementById(
    "resultadosProductos"
);

formularioBusqueda.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const texto = campoBusqueda.value.trim();

    resultadosProductos.replaceChildren();

    if (!texto) {
        estadoBusqueda.textContent =
            "Escribe el nombre del producto que buscas.";
        return;
    }

    estadoBusqueda.textContent =
        "Buscando en el catálogo de Librería Brianna...";

    try {
        const productos = await buscarProductosBrihanna(texto);

        if (productos.length === 0) {
            estadoBusqueda.textContent =
                "No encontramos productos con ese nombre. Prueba con otras palabras.";
            return;
        }

        estadoBusqueda.textContent =
            `Encontramos ${productos.length} producto(s):`;

        productos.forEach((producto) => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "producto";

            const nombre = document.createElement("h3");
            nombre.textContent = producto.nombre || "Producto sin nombre";

            const precio = document.createElement("p");
            const precioNumero = Number(producto.precio);

            precio.textContent =
                Number.isFinite(precioNumero)
                    ? `Precio: Bs ${precioNumero.toFixed(2)}`
                    : "Precio no registrado";

            const disponibilidad = document.createElement("p");
            const disponible =
                producto.disponible !== false &&
                Number(producto.stock) > 0;

            disponibilidad.textContent = disponible
                ? `Disponible${producto.stock != null ? ` · Stock: ${producto.stock}` : ""}`
                : "No disponible";

            tarjeta.append(nombre, precio, disponibilidad);
            resultadosProductos.appendChild(tarjeta);
        });
    } catch (error) {
        console.error(error);

        estadoBusqueda.textContent =
            "No pudimos consultar el catálogo. Comprueba la conexión y los permisos de Supabase.";
    }
});



chrome.storage.local.get(
  ["busquedaBrianna"],
  (resultado) => {
    const busqueda = resultado.busquedaBrianna;

    if (busqueda) {
      campoBusqueda.value = busqueda;
      formularioBusqueda.requestSubmit();
    }
  }
);

campoBusqueda.addEventListener("input", () => {
  if (campoBusqueda.value.trim() === "") {
    chrome.storage.local.remove("busquedaBrianna");
  }
});