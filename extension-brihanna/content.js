
"use strict";

(function () {
    const ID_SECCION = "brianna-resultados-extension";
    const URL_LIBRERIA = "https://kimakira7.github.io/Libreria-Brianna/";

    function obtenerBusqueda() {
        const parametros = new URLSearchParams(
            window.location.search
        );

        return parametros.get("q")?.trim() || "";
    }

    function crearSeccion() {
        const seccion = document.createElement("section");

        seccion.id = ID_SECCION;
        seccion.style.cssText = `
            margin: 20px 0;
            padding: 18px;
            background: #ffffff;
            border: 1px solid #d9e5e5;
            border-left: 5px solid #00AFC1;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            color: #202124;
        `;

        const titulo = document.createElement("h2");
        titulo.textContent = "Productos de Librería Brianna";
        titulo.style.cssText = `
            margin: 0 0 12px;
            color: #008D9A;
            font-size: 20px;
        `;

        const estado = document.createElement("p");
        estado.textContent = "Consultando el catálogo...";
        estado.style.cssText = `
            margin: 0;
            font-size: 14px;
        `;

        seccion.append(titulo, estado);

        return seccion;
    }

    function mostrarProductos(seccion, productos) {
        const estado = seccion.querySelector("p");
        estado.textContent = "";

        if (!productos.length) {
            estado.textContent =
                "No encontramos coincidencias en nuestro catálogo.";
            return;
        }

        productos.forEach((producto) => {
            const tarjeta = document.createElement("article");

            tarjeta.style.cssText = `
                padding: 12px 0;
                border-top: 1px solid #eeeeee;
            `;

            const nombre = document.createElement("h3");
            nombre.textContent = producto.nombre;
            nombre.style.cssText = `
                margin: 0 0 6px;
                font-size: 16px;
            `;
            const imagen = document.createElement("img");
            imagen.alt = producto.nombre || "Producto de Librería Brianna";
            imagen.style.cssText = `
                display: block;
                width: 100px;
                height: 100px;
                object-fit: contain;
                margin-bottom: 8px;
            `;

            if (producto.imagen) {
                imagen.src = producto.imagen;
            } else {
                imagen.style.display = "none";
            }
            const precio = document.createElement("p");
            const numeroPrecio = Number(producto.precio);

            precio.textContent = Number.isFinite(numeroPrecio)
                ? `Precio: Bs ${numeroPrecio.toFixed(2)}`
                : "Precio no registrado";

            precio.style.margin = "5px 0";

            const disponibilidad = document.createElement("p");
            const disponible =
                producto.disponible !== false &&
                Number(producto.stock) > 0;

            disponibilidad.textContent = disponible
                ? "Disponible"
                : "No disponible";

            disponibilidad.style.cssText = `
                margin: 5px 0;
                color: ${disponible ? "#188038" : "#b3261e"};
                font-size: 13px;
            `;

            const enlace = document.createElement("a");
            enlace.href = `${URL_LIBRERIA}?buscar=${encodeURIComponent(producto.nombre)}`;
            enlace.textContent = "Consultar en Librería Brianna";
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";
            enlace.style.cssText = `
                display: inline-block;
                margin-top: 5px;
                color: #008D9A;
                text-decoration: none;
                font-size: 13px;
            `;
            
            const whatsapp = document.createElement("a");

            const mensajeWhatsApp =
                "Hola, quisiera consultar por este producto de Librería Brianna: " +
                producto.nombre;

            whatsapp.href =
                "https://wa.me/59173622228?text=" +
                encodeURIComponent(mensajeWhatsApp);

            whatsapp.textContent = disponible
                ? "Consultar por WhatsApp"
                : "Consultar disponibilidad por WhatsApp";
            whatsapp.target = "_blank";
            whatsapp.rel = "noopener noreferrer";

            whatsapp.style.cssText = `
                display: inline-block;
                margin-top: 10px;
                margin-left: 10px;
                padding: 9px 12px;
                background: #25D366;
                color: #ffffff;
                border-radius: 6px;
                text-decoration: none;
                font-size: 13px;
                font-weight: bold;
            `;

            tarjeta.append(
                imagen,
                nombre,
                precio,
                disponibilidad,
                enlace,
                whatsapp
            );

            seccion.appendChild(tarjeta);
        });
    }

    async function iniciar() {
        const busqueda = obtenerBusqueda();

        if (!busqueda) {
            return;
        }

        const contenedor =
            document.querySelector("#search") ||
            document.querySelector("#rso");

        if (!contenedor) {
            return;
        }

        document.getElementById(ID_SECCION)?.remove();

        const seccion = crearSeccion();
        contenedor.prepend(seccion);

        try {
            const respuesta = await chrome.runtime.sendMessage({
                tipo: "BUSCAR_PRODUCTOS_BRIANNA",
                texto: busqueda
            });

            if (!respuesta || !respuesta.correcto) {
                seccion.querySelector("p").textContent =
                    "No pudimos consultar el catálogo en este momento.";
                return;
            }

            mostrarProductos(seccion, respuesta.productos);
        } catch (error) {
            console.error("Error en la extensión Brianna:", error);

            seccion.querySelector("p").textContent =
                "No pudimos conectar con el catálogo.";
        }
    }

    iniciar();
})();
