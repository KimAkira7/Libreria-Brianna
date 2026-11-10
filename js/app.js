const STORAGE_USUARIOS = "brianna_usuarios";
const STORAGE_SESION = "brianna_sesion";
const STORAGE_ADMIN = "brianna_admin";
const STORAGE_PRODUCTOS = "brianna_productos";
const STORAGE_PEDIDOS = "brianna_pedidos";
const STORAGE_CATEGORIAS = "brianna_categorias";
const STORAGE_FAVORITOS = "brianna_favoritos";
const STORAGE_CARRITOS = "brianna_carritos";
const STORAGE_CONFIG = "brianna_configuracion";

const LIMITE_CARRITO = 20;

async function cargarCategoriasSupabase() {
    const { data, error } =
        await supabaseBrihanna
            .from("categorias")
            .select(
                "id, nombre, activa"
            )
            .eq(
                "activa",
                true
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );

    if (error) {
        mostrarMensaje(
            "No se pudieron cargar las categorías.",
            "error"
        );

        return false;
    }

    const categorias =
        (data || []).map(
            categoria =>
                categoria.nombre
        );

    guardarStorage(
        STORAGE_CATEGORIAS,
        categorias
    );

    return true;
}

async function cargarProductosSupabase() {
    const { data, error } =
        await supabaseBrihanna
            .from("productos")
            .select(`
                id,
                nombre,
                precio,
                stock,
                disponible,
                descuento,
                imagen,
                categorias (
                    nombre
                )
            `)
            .order("id", {
                ascending: true
            });

    if (error) {
        mostrarMensaje(
            "No se pudieron cargar los productos.",
            "error"
        );

        return false;
    }

    const productos =
        (data || []).map(
            producto => ({
                id: producto.id,
                nombre: producto.nombre,
                categoria:
                    producto.categorias
                        ? producto.categorias.nombre
                        : "",
                precio:
                    Number(producto.precio),
                stock:
                    Number(producto.stock),
                descuento:
                    Number(
                        producto.descuento
                    ) || 0,
                disponible:
                    producto.disponible,
                imagen:
                    producto.imagen || ""
            })
        );

    guardarStorage(
        STORAGE_PRODUCTOS,
        productos
    );

    return true;
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        inicializarDatos();
        migrarDatos();
        configurarNavegacion();
        configurarBuscador();
        configurarAccionesHeader();
        configurarOverlay();

        await cargarCategoriasSupabase();
        await cargarProductosSupabase();
        await cargarFavoritosSupabase();
        await cargarCarritoSupabase();
        await cargarConfiguracionSupabase();

        renderizarTodo();
    }
);

function leerStorage(clave, valorDefecto) {
    try {
        const valor = localStorage.getItem(clave);

        if (valor === null) {
            return valorDefecto;
        }

        return JSON.parse(valor);
    } catch {
        return valorDefecto;
    }
}

function guardarStorage(clave, valor) {
    try {
        localStorage.setItem(
            clave,
            JSON.stringify(valor)
        );

        return true;
    } catch {
        mostrarMensaje(
            "No se pudo guardar la información.",
            "error"
        );

        return false;
    }
}


function inicializarDatos() {

    // Clientes: caché local vacía.
    if (!localStorage.getItem(STORAGE_USUARIOS)) {
        guardarStorage(STORAGE_USUARIOS, []);
    }

    // Categorías: se cargarán desde Supabase.
    if (!localStorage.getItem(STORAGE_CATEGORIAS)) {
        guardarStorage(STORAGE_CATEGORIAS, []);
    }

    // Productos: se cargarán desde Supabase.
    if (!localStorage.getItem(STORAGE_PRODUCTOS)) {
        guardarStorage(STORAGE_PRODUCTOS, []);
    }

    // Pedidos: caché local vacía.
    if (!localStorage.getItem(STORAGE_PEDIDOS)) {
        guardarStorage(STORAGE_PEDIDOS, []);
    }

    // Favoritos.
    if (!localStorage.getItem(STORAGE_FAVORITOS)) {
        guardarStorage(STORAGE_FAVORITOS, {});
    }

    // Carritos.
    if (!localStorage.getItem(STORAGE_CARRITOS)) {
        guardarStorage(STORAGE_CARRITOS, {});
    }

    // Configuración de respaldo.
    if (!localStorage.getItem(STORAGE_CONFIG)) {
        guardarStorage(STORAGE_CONFIG, {
            direccion: "Santa Cruz de la Sierra, Bolivia",
            whatsapp: "",
            horario: "Lunes a sábado: 8:00 a 18:00",
            qr_url: ""
        });
    }
}

function generarId() {
    return (
        Date.now().toString() +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}

function mismoId(a, b) {
    return String(a) === String(b);
}

function migrarDatos() {
    let productos = obtenerProductos();
    let modificado = false;

    const mapaCategorias = {
        cuadernos: "Material escolar",
        escritura: "Material escolar",
        papeleria: "Material escolar",
        "papelería": "Material escolar",
        oficina: "Material escolar",
        mochilas: "Material escolar",
        arte: "Material de arte"
    };

    productos = productos.map(producto => {
        const copia = {
            ...producto
        };

        const categoriaNormal =
            normalizarTexto(copia.categoria);

        if (mapaCategorias[categoriaNormal]) {
            copia.categoria =
                mapaCategorias[categoriaNormal];

            modificado = true;
        }

        if (copia.disponible === undefined) {
            copia.disponible =
                Number(copia.stock) > 0;

            modificado = true;
        }

        if (copia.descuento === undefined) {
            copia.descuento = 0;
            modificado = true;
        }

        if (!copia.id) {
            copia.id = generarId();
            modificado = true;
        }

        return copia;
    });

    if (modificado) {
        guardarStorage(
            STORAGE_PRODUCTOS,
            productos
        );
    }

    const usuarios = obtenerUsuarios().map(
        usuario => ({
            ...usuario,
            rol: "cliente"
        })
    );

    guardarStorage(
        STORAGE_USUARIOS,
        usuarios
    );
}

function obtenerAdmin() {
    return leerStorage(
        STORAGE_ADMIN,
        {
            nombre: "Administrador",
            correo: "admin@brianna.com",
            contrasena: "Admin123"
        }
    );
}

function guardarAdmin(admin) {
    return guardarStorage(
        STORAGE_ADMIN,
        admin
    );
}

function obtenerUsuarios() {
    const usuarios = leerStorage(
        STORAGE_USUARIOS,
        []
    );

    return Array.isArray(usuarios)
        ? usuarios
        : [];
}

function guardarUsuarios(usuarios) {
    return guardarStorage(
        STORAGE_USUARIOS,
        usuarios
    );
}

function obtenerSesion() {
    return leerStorage(
        STORAGE_SESION,
        null
    );
}

function guardarSesion(sesion) {
    guardarStorage(
        STORAGE_SESION,
        sesion
    );

    actualizarInterfazSesion();
}

function obtenerProductos() {
    const productos = leerStorage(
        STORAGE_PRODUCTOS,
        []
    );

    return Array.isArray(productos)
        ? productos
        : [];
}

function guardarProductos(productos) {
    const resultado = guardarStorage(
        STORAGE_PRODUCTOS,
        productos
    );

    if (resultado) {
        renderizarTodo();
    }

    return resultado;
}

function obtenerPedidos() {
    const pedidos = leerStorage(
        STORAGE_PEDIDOS,
        []
    );

    return Array.isArray(pedidos)
        ? pedidos
        : [];
}

function guardarPedidos(pedidos) {
    return guardarStorage(
        STORAGE_PEDIDOS,
        pedidos
    );
}

function obtenerCategorias() {
    const categorias = leerStorage(
        STORAGE_CATEGORIAS,
        []
    );

    return Array.isArray(categorias)
        ? categorias
        : [];
}

function guardarCategorias(categorias) {
    const resultado = guardarStorage(
        STORAGE_CATEGORIAS,
        categorias
    );

    if (resultado) {
        renderizarCategorias();
    }

    return resultado;
}

function obtenerFavoritosTodos() {
    const favoritos = leerStorage(
        STORAGE_FAVORITOS,
        {}
    );

    return favoritos &&
        typeof favoritos === "object" &&
        !Array.isArray(favoritos)
        ? favoritos
        : {};
}

function guardarFavoritosTodos(favoritos) {
    return guardarStorage(
        STORAGE_FAVORITOS,
        favoritos
    );
}

function obtenerCarritosTodos() {
    const carritos = leerStorage(
        STORAGE_CARRITOS,
        {}
    );

    return carritos &&
        typeof carritos === "object" &&
        !Array.isArray(carritos)
        ? carritos
        : {};
}

function guardarCarritosTodos(carritos) {
    return guardarStorage(
        STORAGE_CARRITOS,
        carritos
    );
}

function obtenerConfiguracion() {
    return leerStorage(
        STORAGE_CONFIG,
        {
            direccion:
                "Santa Cruz de la Sierra, Bolivia",
            whatsapp: "",
            horario:
                "Lunes a sábado: 8:00 a 18:00"
        }
    );
}


async function cargarConfiguracionSupabase() {
    try {
        const { data, error } = await supabaseBrihanna
            .from("configuracion")
            .select("direccion, whatsapp, horario, qr_url")
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            console.warn("No se encontró la configuración en Supabase.");
            return obtenerConfiguracion();
        }

        const configuracion = {
            direccion: data.direccion || "",
            whatsapp: data.whatsapp || "",
            horario: data.horario || "",
            qr_url: data.qr_url || ""
        };

        guardarConfiguracion(configuracion);

        return configuracion;

    } catch (error) {
        console.error(
            "Error al cargar la configuración:",
            error
        );

        return obtenerConfiguracion();
    }
}

function guardarConfiguracion(configuracion) {
    const resultado = guardarStorage(
        STORAGE_CONFIG,
        configuracion
    );

    if (resultado) {
        renderizarConfiguracion();
    }

    return resultado;
}

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}

function escapeHTML(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAtributo(texto) {
    return escapeHTML(texto);
}

function precioFinal(producto) {
    const precio =
        Number(producto.precio) || 0;

    const descuento =
        Number(producto.descuento) || 0;

    if (descuento <= 0) {
        return precio;
    }

    return precio * (
        1 - descuento / 100
    );
}

function estaDisponible(producto) {
    return (
        producto.disponible !== false &&
        Number(producto.stock) > 0
    );
}

function esAdministrador() {
    const sesion = obtenerSesion();

    return Boolean(
        sesion &&
        sesion.rol === "administrador"
    );
}

function esCliente() {
    const sesion = obtenerSesion();

    return Boolean(
        sesion &&
        sesion.rol === "cliente"
    );
}

function configurarNavegacion() {
    document.addEventListener(
        "click",
        evento => {
            const elemento =
                evento.target.closest(
                    "[data-seccion]"
                );

            if (!elemento) {
                return;
            }

            evento.preventDefault();

            const seccion =
                elemento.dataset.seccion;

            if (seccion) {
                mostrarSeccion(seccion);
            }
        }
    );

    const botonProductos =
        document.getElementById(
            "btn-ver-productos"
        );

    if (botonProductos) {
        botonProductos.addEventListener(
            "click",
            () => {
                mostrarSeccion(
                    "productos"
                );
            }
        );
    }

    const categoriasInicio =
        document.getElementById(
            "categorias-inicio"
        );

    if (categoriasInicio) {
        categoriasInicio.addEventListener(
            "click",
            evento => {
                const tarjeta =
                    evento.target.closest(
                        ".categoria"
                    );

                if (!tarjeta) {
                    return;
                }

                const categoria =
                    tarjeta.dataset.categoria ||
                    tarjeta
                        .querySelector(
                            "h3, h4, p"
                        )
                        ?.textContent
                        ?.trim();

                if (!categoria) {
                    return;
                }

                mostrarSeccion(
                    "categorias"
                );

                mostrarProductosCategoria(
                    categoria
                );
            }
        );
    }
}

function mostrarSeccion(nombre) {
    const secciones =
        document.querySelectorAll(
            ".pagina-seccion"
        );

    secciones.forEach(seccion => {
        seccion.classList.remove(
            "activa"
        );
    });

    const destino =
        document.getElementById(nombre);

    if (!destino) {
        return;
    }

    destino.classList.add("activa");

    document
        .querySelectorAll(
            "nav [data-seccion]"
        )
        .forEach(enlace => {
            enlace.classList.toggle(
                "activo",
                enlace.dataset.seccion ===
                    nombre
            );
        });

    if (nombre === "productos") {
        renderizarProductos();
    }

    if (nombre === "categorias") {
        renderizarCategorias();
    }

    if (nombre === "ofertas") {
        renderizarOfertas();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function configurarBuscador() {
    const input =
        document.getElementById(
            "buscador-productos"
        );

    const boton =
        document.getElementById(
            "btn-buscar"
        );

    if (!input || !boton) {
        return;
    }
    const botonLimpiar = document.getElementById(
        "btn-limpiar-busqueda"
    );

    if (botonLimpiar) {
        botonLimpiar.addEventListener("click", () => {
            input.value = "";
            input.focus();

            mostrarSeccion("productos");
            renderizarProductos("");
        });
    }
    const ejecutarBusqueda = () => {
        mostrarSeccion("productos");

        renderizarProductos(
            input.value.trim()
        );
    };

    boton.addEventListener(
        "click",
        ejecutarBusqueda
    );

    input.addEventListener(
        "keydown",
        evento => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                ejecutarBusqueda();
            }
        }
    );
    if (window.location.search.includes("buscar=")) {
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );
    }
}

function configurarAccionesHeader() {
    const cuenta =
        document.getElementById(
            "btn-cuenta"
        );

    const favoritos =
        document.getElementById(
            "btn-favoritos"
        );

    const carrito =
        document.getElementById(
            "btn-carrito"
        );

    if (cuenta) {
        cuenta.addEventListener(
            "click",
            manejarCuenta
        );
    }

    if (favoritos) {
        favoritos.addEventListener(
            "click",
            mostrarFavoritos
        );
    }

    if (carrito) {
        carrito.addEventListener(
            "click",
            mostrarCarrito
        );
    }
}

function obtenerOverlay() {
    let overlay = document.getElementById("brianna-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "brianna-overlay";
        overlay.className = "brianna-overlay";
        document.body.appendChild(overlay);
    }

    return overlay;
}

function configurarOverlay() {
    const overlay =
        obtenerOverlay();

    overlay.addEventListener(
        "click",
        evento => {
            if (evento.target === overlay) {
                cerrarVentana();
            }

            const cerrar =
                evento.target.closest(
                    ".btn-cerrar-modal, .brianna-cerrar"
                );

            if (cerrar) {
                cerrarVentana();
            }
        }
    );

    document.addEventListener(
        "keydown",
        evento => {
            if (evento.key === "Escape") {
                cerrarVentana();
            }
        }
    );
}


function abrirVentana(
    contenido,
    clase = ""
) {
    const overlay = obtenerOverlay();

    overlay.innerHTML = `
        <div class="modal-brianna ${escapeAtributo(clase)}">
            ${contenido}
        </div>
    `;

    overlay.classList.add("activo");
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Activar los botones para cerrar las ventanas
    const botonesCerrar = overlay.querySelectorAll(
        ".btn-cerrar-modal, .cerrar-modal, [data-cerrar-modal]"
    );

    botonesCerrar.forEach(boton => {
        boton.addEventListener("click", evento => {
            evento.preventDefault();
            evento.stopPropagation();
            cerrarVentana();
        });
    });
}

function cerrarVentana() {
    const overlay =
        document.getElementById(
            "brianna-overlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove("activo");
    overlay.style.display = "none";
    overlay.innerHTML = "";

    document.body.style.overflow = "";
}

function mostrarMensaje(
    mensaje,
    tipo = "exito"
) {
    const notificacion =
        document.getElementById(
            "notificacion"
        );

    if (!notificacion) {
        alert(mensaje);
        return;
    }

    notificacion.textContent =
        mensaje;

    notificacion.className =
        `notificacion ${tipo} mostrar`;

    clearTimeout(
        mostrarMensaje.temporizador
    );

    mostrarMensaje.temporizador =
        setTimeout(() => {
            notificacion.classList.remove(
                "mostrar"
            );
        }, 3000);
}

function mostrarError(id, mensaje) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent =
            mensaje;

        elemento.style.display =
            "block";
    }
}

function manejarCuenta() {
    const sesion =
        obtenerSesion();

    if (!sesion) {
        mostrarLogin();
        return;
    }

    if (
        sesion.rol ===
        "administrador"
    ) {
        mostrarPanelAdministrador();
        return;
    }

    mostrarCuentaCliente();
}


function mostrarLogin() {
    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>Iniciar sesión</h2>
                <p>
                    Ingresa a tu cuenta de
                    Librería Brianna.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <form
            id="form-login"
            class="formulario-brianna"
        >
            <div
                id="login-error"
                class="mensaje-error"
            ></div>

            <div class="form-grupo">
                <label for="login-correo">
                    Correo electrónico
                </label>

                <input
                    id="login-correo"
                    type="email"
                    required
                    autocomplete="email"
                >
            </div>

            <div class="form-grupo">
                <label for="login-contrasena">
                    Contraseña
                </label>

                <input
                    id="login-contrasena"
                    type="password"
                    required
                    autocomplete="current-password"
                >
            </div>

            <button
                class="btn-sistema btn-azul"
                type="submit"
            >
                Iniciar sesión
            </button>

            <div class="brianna-extension">
                <div class="extension-icono">
                    <img src="extension-brihanna/img/extension128.png"
                    alt="Icono de la extensión Librería Brianna">
                </div>

                <div class="extension-info">
                    <strong>
                        Extensión de Brianna
                    </strong>

                    <span>
                        Consulta productos mientras navegas.
                    </span>
                </div>

                <a
                    href="https://github.com/user-attachments/files/34606595/extension-brihanna.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-descargar-extension"
                >
                    <i class="fas fa-download"></i>
                    Descargar
                </a>
            </div>

            <p class="brianna-cambio">
                ¿No tienes una cuenta?

                <button
                    id="ir-registro"
                    type="button"
                >
                    Crear cuenta
                </button>
            </p>
        </form>
    `);

    document
        .getElementById("form-login")
        .addEventListener(
            "submit",
            iniciarSesion
        );

    document
        .getElementById("ir-registro")
        .addEventListener(
            "click",
            mostrarRegistro
        );
}

async function iniciarSesion(evento) {
    evento.preventDefault();

    const correo =
        document
            .getElementById("login-correo")
            .value
            .trim()
            .toLowerCase();

    const contrasena =
        document
            .getElementById("login-contrasena")
            .value;

    const { data, error } =
        await supabaseBrihanna.auth.signInWithPassword({
            email: correo,
            password: contrasena
        });

    if (error || !data.user) {
        mostrarError(
            "login-error",
            "Correo o contraseña incorrectos."
        );

        return;
    }

    const {
        data: administrador,
        error: errorAdministrador
    } = await supabaseBrihanna
        .from("administradores")
        .select("usuario_id, correo, nombre")
        .eq("usuario_id", data.user.id)
        .maybeSingle();

    if (errorAdministrador) {
        await supabaseBrihanna.auth.signOut();

        mostrarError(
            "login-error",
            "No se pudo verificar la cuenta."
        );

        return;
    }

    if (administrador) {
        guardarSesion({
            id: data.user.id,
            nombre: administrador.nombre,
            correo: administrador.correo,
            rol: "administrador"
        });

        cerrarVentana();
        actualizarInterfazSesion();

        mostrarMensaje(
            "Bienvenido al panel de administrador.",
            "exito"
        );

        mostrarPanelAdministrador();

        return;
    }

    const {
        data: cliente,
        error: errorCliente
    } = await supabaseBrihanna
        .from("clientes")
        .select("id, nombre, correo, activo")
        .eq("id", data.user.id)
        .maybeSingle();

    if (errorCliente) {
        await supabaseBrihanna.auth.signOut();

        mostrarError(
            "login-error",
            "No se pudo verificar la cuenta del cliente."
        );

        return;
    }

    if (!cliente) {
        await supabaseBrihanna.auth.signOut();

        mostrarError(
            "login-error",
            "La cuenta existe, pero no tiene un perfil de cliente."
        );

        return;
    }

    if (!cliente.activo) {
        await supabaseBrihanna.auth.signOut();

        mostrarError(
            "login-error",
            "Esta cuenta se encuentra desactivada."
        );

        return;
    }

    guardarSesion({
        id: cliente.id,
        nombre: cliente.nombre,
        correo: cliente.correo,
        rol: "cliente"
    });

    cerrarVentana();

    actualizarInterfazSesion();

    await cargarFavoritosSupabase();
    await cargarCarritoSupabase();

    mostrarMensaje(
        `Bienvenido, ${cliente.nombre}.`,
        "exito"
    );

    renderizarTodo();
}


function mostrarRegistro() {
    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>Crear cuenta</h2>
                <p>
                    Regístrate como cliente.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <form
            id="form-registro"
            class="formulario-brianna"
        >
            <div
                id="registro-error"
                class="mensaje-error"
            ></div>

            <div class="form-grupo">
                <label for="registro-nombre">
                    Nombre completo
                </label>

                <input
                    id="registro-nombre"
                    type="text"
                    required
                    minlength="2"
                >
            </div>

            <div class="form-grupo">
                <label for="registro-correo">
                    Correo electrónico
                </label>

                <input
                    id="registro-correo"
                    type="email"
                    required
                >
            </div>

            <div class="form-grupo">
                <label for="registro-contrasena">
                    Contraseña
                </label>

                <input
                    id="registro-contrasena"
                    type="password"
                    required
                    minlength="6"
                >
            </div>

            <div class="form-grupo">
                <label for="registro-confirmacion">
                    Confirmar contraseña
                </label>

                <input
                    id="registro-confirmacion"
                    type="password"
                    required
                    minlength="6"
                >
            </div>

            <button
                class="btn-sistema btn-verde"
                type="submit"
            >
                Crear cuenta
            </button>

            <div class="brianna-extension">
                <div class="brianna-extension">
                    <div class="extension-icono">
                        <img src="extension-brihanna/img/extension128.png"
                        alt="Extensión Librería Brianna">
                    </div>

                <div class="extension-info">
                    <strong>
                        Extensión de Brianna
                    </strong>

                    <span>
                        Consulta productos mientras navegas.
                    </span>
                </div>

                <a
                    href="ENLACE_DE_TU_EXTENSION"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-descargar-extension"
                >
                    <i class="fas fa-download"></i>
                    Descargar
                </a>
            </div>

            <p class="brianna-cambio">
                ¿Ya tienes una cuenta?

                <button
                    id="ir-login"
                    type="button"
                >
                    Iniciar sesión
                </button>
            </p>
        </form>
    `);

    document
        .getElementById("form-registro")
        .addEventListener(
            "submit",
            registrarCliente
        );

    document
        .getElementById("ir-login")
        .addEventListener(
            "click",
            mostrarLogin
        );
}

async function registrarCliente(evento) {
    evento.preventDefault();

    const nombre =
        document
            .getElementById("registro-nombre")
            .value
            .trim();

    const correo =
        document
            .getElementById("registro-correo")
            .value
            .trim()
            .toLowerCase();

    const contrasena =
        document
            .getElementById("registro-contrasena")
            .value;

    const confirmacion =
        document
            .getElementById("registro-confirmacion")
            .value;

    if (nombre.length < 2) {
        mostrarError(
            "registro-error",
            "Escribe un nombre válido."
        );

        return;
    }

    if (contrasena.length < 6) {
        mostrarError(
            "registro-error",
            "La contraseña debe tener al menos 6 caracteres."
        );

        return;
    }

    if (contrasena !== confirmacion) {
        mostrarError(
            "registro-error",
            "Las contraseñas no coinciden."
        );

        return;
    }

    if (correo === "admin@brianna.com") {
        mostrarError(
            "registro-error",
            "Ese correo pertenece a la cuenta administrativa."
        );

        return;
    }

    const { data, error } =
        await supabaseBrihanna.auth.signUp({
            email: correo,
            password: contrasena,
            options: {
                data: {
                    nombre: nombre
                }
            }
        });

    if (error) {
        if (
            error.message
                .toLowerCase()
                .includes("already")
        ) {
            mostrarError(
                "registro-error",
                "Ya existe una cuenta con ese correo."
            );
        } else {
            mostrarError(
                "registro-error",
                "No se pudo crear la cuenta: " + error.message
            );
        }

        return;
    }

    if (!data.user) {
        mostrarError(
            "registro-error",
            "No se pudo crear la cuenta."
        );

        return;
    }

    if (!data.session) {
        mostrarLogin();

        setTimeout(() => {
            mostrarMensaje(
                "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
                "exito"
            );
        }, 100);

        return;
    }

    const { error: errorPerfil } =
        await supabaseBrihanna
            .from("clientes")
            .insert({
                id: data.user.id,
                nombre: nombre,
                correo: correo,
                activo: true
            });

    if (errorPerfil) {
        await supabaseBrihanna.auth.signOut();

        mostrarError(
            "registro-error",
            "La cuenta fue creada, pero no se pudo registrar el perfil del cliente."
        );

        return;
    }

    await supabaseBrihanna.auth.signOut();

    mostrarLogin();

    setTimeout(() => {
        mostrarMensaje(
            "Cuenta creada correctamente. Ya puedes iniciar sesión.",
            "exito"
        );
    }, 100);
}

async function cerrarSesion() {
    const { error } =
        await supabaseBrihanna.auth.signOut();

    if (error) {
        mostrarMensaje(
            "No se pudo cerrar la sesión correctamente.",
            "error"
        );

        return;
    }

    localStorage.removeItem(
        STORAGE_SESION
    );

    actualizarInterfazSesion();
    renderizarTodo();
    cerrarVentana();

    mostrarMensaje(
        "Sesión cerrada correctamente.",
        "exito"
    );
}

function actualizarInterfazSesion() {
    const boton =
        document.getElementById(
            "btn-cuenta"
        );

    if (!boton) {
        return;
    }

    const sesion =
        obtenerSesion();

    if (!sesion) {
        boton.title =
            "Iniciar sesión";
        return;
    }

    boton.title =
        sesion.rol ===
        "administrador"
            ? "Panel de administrador"
            : `Cuenta de ${sesion.nombre}`;
}

async function mostrarCuentaCliente() {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    try {
        const { count, error } = await supabaseBrihanna
            .from("pedidos")
            .select("id", { count: "exact", head: true })
            .eq("cliente_id", sesion.id);

        if (error) throw error;

        abrirVentana(`
            <div class="modal-encabezado">
                <div>
                    <h2>Mi cuenta</h2>
                    <p>
                        Información de tu cuenta.
                    </p>
                </div>

                <button
                    class="btn-cerrar-modal"
                    type="button"
                >
                    ×
                </button>
            </div>

            <div class="brianna-info">
                <p>
                    <strong>Nombre:</strong>
                    ${escapeHTML(sesion.nombre)}
                </p>

                <p>
                    <strong>Correo:</strong>
                    ${escapeHTML(sesion.correo)}
                </p>

                <p>
                    <strong>Pedidos:</strong>
                    ${count || 0}
                </p>
            </div>

            <div class="acciones-formulario">
                <button
                    id="ver-mis-pedidos"
                    class="btn-sistema btn-azul"
                    type="button"
                >
                    Mis pedidos
                </button>

                <button
                    id="cerrar-sesion-cliente"
                    class="btn-sistema btn-secundario"
                    type="button"
                >
                    Cerrar sesión
                </button>
            </div>
        `);

        document
            .getElementById("ver-mis-pedidos")
            .addEventListener("click", mostrarPedidosCliente);

        document
            .getElementById("cerrar-sesion-cliente")
            .addEventListener("click", cerrarSesion);

    } catch (error) {
        console.error("Error al cargar la cuenta:", error);

        mostrarMensaje(
            "No se pudo cargar la información de tu cuenta.",
            "error"
        );
    }
}

function renderizarTodo() {
    renderizarProductos();
    renderizarProductosDestacados();
    renderizarCategorias();
    renderizarOfertas();
    renderizarConfiguracion();
    actualizarContadores();
}

function crearTarjetaProducto(producto) {
    const disponible =
        estaDisponible(producto);

    const descuento =
        Math.max(
            0,
            Number(producto.descuento) || 0
        );

    const precio =
        Number(producto.precio) || 0;

    const precioOferta =
        precioFinal(producto);

    const sesion =
        obtenerSesion();

    const administrador =
        sesion &&
        sesion.rol === "administrador";

    let favorito = false;

    if (
        sesion &&
        sesion.rol === "cliente"
    ) {
        const favoritos =
            obtenerFavoritosTodos();

        const lista =
            favoritos[sesion.correo] || [];

        favorito =
            lista.some(
                id =>
                    mismoId(
                        id,
                        producto.id
                    )
            );
    }

    const imagen = producto.imagen
        ? `
            <img
                src="${escapeAtributo(
                    producto.imagen
                )}"
                alt="${escapeAtributo(
                    producto.nombre
                )}"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >

            <div
                class="producto-sin-imagen"
                style="display:none;"
            >
                📚
            </div>
        `
        : `
            <div
                class="producto-sin-imagen"
            >
                📚
            </div>
        `;

    const bloquePrecio =
        descuento > 0
            ? `
                <div class="precio-oferta">
                    <span class="precio-anterior">
                        Bs ${precio.toFixed(2)}
                    </span>

                    <span class="producto-precio precio-actual">
                        Bs ${precioOferta.toFixed(2)}
                    </span>
                </div>

                <span class="etiqueta-descuento">
                    -${descuento}%
                </span>
            `
            : `
                <div class="producto-precio">
                    Bs ${precio.toFixed(2)}
                </div>
            `;

    const accionesCliente =
        administrador
            ? ""
            : `
                <div class="acciones-producto">
                    <button
                        class="btn-favorito-producto ${
                            favorito
                                ? "activo"
                                : ""
                        }"
                        type="button"
                        data-favorito-producto="${escapeAtributo(
                            producto.id
                        )}"
                        title="${
                            favorito
                                ? "Quitar de favoritos"
                                : "Agregar a favoritos"
                        }"
                    >
                        ${
                            favorito
                                ? "♥"
                                : "♡"
                        }
                    </button>

                    <button
                        class="btn-agregar-carrito"
                        type="button"
                        data-carrito-producto="${escapeAtributo(
                            producto.id
                        )}"
                        ${
                            disponible
                                ? ""
                                : "disabled"
                        }
                    >
                        ${
                            disponible
                                ? "Agregar al carrito"
                                : "No disponible"
                        }
                    </button>
                </div>
            `;

    return `
        <article
            class="producto"
            data-producto-id="${escapeAtributo(
                producto.id
            )}"
        >
            <div class="producto-imagen">
                ${imagen}

                ${
                    descuento > 0
                        ? `
                            <span class="badge-producto">
                                Oferta
                            </span>
                        `
                        : ""
                }

                ${
                    !disponible
                        ? `
                            <span class="badge-no-disponible">
                                Agotado
                            </span>
                        `
                        : ""
                }
            </div>

            <div class="producto-contenido">
                <span class="producto-categoria">
                    ${escapeHTML(
                        producto.categoria
                    )}
                </span>

                <h3>
                    ${escapeHTML(
                        producto.nombre
                    )}
                </h3>

                ${bloquePrecio}

                <p class="producto-stock">
                    ${
                        disponible
                            ? `Stock disponible: ${Math.max(
                                0,
                                Number(
                                    producto.stock
                                ) || 0
                            )}`
                            : "Producto no disponible"
                    }
                </p>

                ${accionesCliente}
            </div>
        </article>
    `;
}

function renderizarProductos(
    busqueda = ""
) {
    const contenedor =
        document.getElementById(
            "productos-grid"
        );

    if (!contenedor) {
        return;
    }

    let productos =
        obtenerProductos();

    const termino =
        normalizarTexto(busqueda);

    if (termino) {
        productos =
            productos
                .filter(producto => {
                    const nombre =
                        normalizarTexto(
                            producto.nombre
                        );

                    const categoria =
                        normalizarTexto(
                            producto.categoria
                        );

                    return (
                        nombre.includes(
                            termino
                        ) ||
                        categoria.includes(
                            termino
                        )
                    );
                })
                .sort((a, b) => {
                    const nombreA =
                        normalizarTexto(
                            a.nombre
                        );

                    const nombreB =
                        normalizarTexto(
                            b.nombre
                        );

                    const exactoA =
                        nombreA === termino
                            ? 0
                            : 1;

                    const exactoB =
                        nombreB === termino
                            ? 0
                            : 1;

                    if (
                        exactoA !==
                        exactoB
                    ) {
                        return (
                            exactoA -
                            exactoB
                        );
                    }

                    return nombreA.localeCompare(
                        nombreB
                    );
                });
    }

    const resultado =
        document.getElementById(
            "resultado-busqueda"
        );

    if (resultado) {
        if (termino) {
            resultado.textContent =
                productos.length
                    ? `${productos.length} resultado(s) para "${busqueda}".`
                    : `No se encontraron productos para "${busqueda}".`;
        } else {
            resultado.textContent = "";
        }
    }

    if (!productos.length) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <h3>
                    No hay productos para mostrar
                </h3>

                <p>
                    Intenta realizar otra búsqueda
                    o vuelve más tarde.
                </p>
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        productos
            .map(
                crearTarjetaProducto
            )
            .join("");

    configurarAccionesProductos(
        contenedor
    );
}

function renderizarProductosDestacados() {
    const contenedor =
        document.getElementById(
            "productos-destacados-grid"
        );

    if (!contenedor) {
        return;
    }

    const productos =
        obtenerProductos()
            .filter(
                producto =>
                    estaDisponible(
                        producto
                    )
            )
            .slice(0, 4);

    if (!productos.length) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <p>
                    Todavía no hay productos
                    destacados disponibles.
                </p>
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        productos
            .map(
                crearTarjetaProducto
            )
            .join("");

    configurarAccionesProductos(
        contenedor
    );
}

function configurarAccionesProductos(
    contenedor
) {
    if (!contenedor) {
        return;
    }

    contenedor
        .querySelectorAll(
            "[data-favorito-producto]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                evento => {
                    evento.preventDefault();

                    alternarFavorito(
                        boton.dataset
                            .favoritoProducto
                    );
                }
            );
        });

    contenedor
        .querySelectorAll(
            "[data-carrito-producto]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                evento => {
                    evento.preventDefault();

                    agregarAlCarrito(
                        boton.dataset
                            .carritoProducto
                    );
                }
            );
        });
}

async function cargarCarritoSupabase() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        return true;
    }

    let { data: carrito, error } =
        await supabaseBrihanna
            .from("carritos")
            .select("id")
            .eq(
                "cliente_id",
                sesion.id
            )
            .maybeSingle();

    if (error) {
        mostrarMensaje(
            "No se pudo cargar el carrito.",
            "error"
        );

        return false;
    }

    if (!carrito) {
        const { data, error: errorCrear } =
            await supabaseBrihanna
                .from("carritos")
                .insert({
                    cliente_id:
                        sesion.id
                })
                .select("id")
                .single();

        if (errorCrear) {
            mostrarMensaje(
                "No se pudo crear el carrito.",
                "error"
            );

            return false;
        }

        carrito = data;
    }

    const { data: detalles, error: errorDetalles } =
        await supabaseBrihanna
            .from("carrito_detalle")
            .select(
                "producto_id, cantidad"
            )
            .eq(
                "carrito_id",
                carrito.id
            );

    if (errorDetalles) {
        mostrarMensaje(
            "No se pudieron cargar los productos del carrito.",
            "error"
        );

        return false;
    }

    const lista =
        (detalles || []).map(
            item => ({
                idProducto:
                    item.producto_id,
                cantidad:
                    Number(
                        item.cantidad
                    )
            })
        );

    const carritos =
        leerStorage(
            STORAGE_CARRITOS,
            {}
        );

    carritos[sesion.correo] =
        lista;

    guardarStorage(
        STORAGE_CARRITOS,
        carritos
    );

    actualizarContadores();

    return true;
}

async function cargarFavoritosSupabase() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        guardarFavoritosTodos({});
        return true;
    }

    const { data, error } =
        await supabaseBrihanna
            .from("favoritos")
            .select("producto_id")
            .eq(
                "cliente_id",
                sesion.id
            );

    if (error) {
        mostrarMensaje(
            "No se pudieron cargar los favoritos.",
            "error"
        );

        return false;
    }

    const favoritos = {};

    favoritos[sesion.correo] =
        (data || []).map(
            favorito =>
                favorito.producto_id
        );

    guardarFavoritosTodos(
        favoritos
    );

    return true;
}

function obtenerFavoritosCliente() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        return [];
    }

    const favoritos =
        obtenerFavoritosTodos();

    const lista =
        favoritos[sesion.correo];

    return Array.isArray(lista)
        ? lista
        : [];
}

async function alternarFavorito(
    idProducto
) {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        mostrarMensaje(
            "Inicia sesión como cliente para guardar favoritos.",
            "aviso"
        );

        mostrarLogin();

        return;
    }

    const producto =
        obtenerProductos().find(
            item =>
                mismoId(
                    item.id,
                    idProducto
                )
        );

    if (!producto) {
        mostrarMensaje(
            "El producto ya no existe.",
            "error"
        );

        return;
    }

    const { data: favorito, error: errorConsulta } =
        await supabaseBrihanna
            .from("favoritos")
            .select("id")
            .eq(
                "cliente_id",
                sesion.id
            )
            .eq(
                "producto_id",
                producto.id
            )
            .maybeSingle();

    if (errorConsulta) {
        mostrarMensaje(
            "No se pudieron consultar los favoritos.",
            "error"
        );

        return;
    }

    if (favorito) {
        const { error } =
            await supabaseBrihanna
                .from("favoritos")
                .delete()
                .eq(
                    "id",
                    favorito.id
                );

        if (error) {
            mostrarMensaje(
                "No se pudo eliminar de favoritos.",
                "error"
            );

            return;
        }

        mostrarMensaje(
            "Producto eliminado de favoritos.",
            "exito"
        );
    } else {
        const { error } =
            await supabaseBrihanna
                .from("favoritos")
                .insert({
                    cliente_id:
                        sesion.id,
                    producto_id:
                        producto.id
                });

        if (error) {
            mostrarMensaje(
                "No se pudo agregar a favoritos.",
                "error"
            );

            return;
        }

        mostrarMensaje(
            "Producto agregado a favoritos.",
            "exito"
        );
    }

    await cargarFavoritosSupabase();

    actualizarContadores();
    renderizarProductos();
    renderizarProductosDestacados();
    renderizarOfertas();
}

function mostrarFavoritos() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        mostrarMensaje(
            "Inicia sesión como cliente para ver tus favoritos.",
            "aviso"
        );

        mostrarLogin();

        return;
    }

    const ids =
        obtenerFavoritosCliente();

    const productos =
        obtenerProductos().filter(
            producto =>
                ids.some(
                    id =>
                        mismoId(
                            id,
                            producto.id
                        )
                )
        );

    const contenido =
        productos.length
            ? `
                <div class="productos-modal-grid">
                    ${productos
                        .map(
                            crearTarjetaProducto
                        )
                        .join("")}
                </div>
            `
            : `
                <div class="estado-vacio">
                    <h3>
                        No tienes favoritos
                    </h3>

                    <p>
                        Guarda los productos que
                        más te interesen usando
                        el corazón.
                    </p>
                </div>
            `;

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>Mis favoritos</h2>

                <p>
                    Tus productos guardados.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        ${contenido}
    `, "modal-grande");

    const overlay =
        obtenerOverlay();

    configurarAccionesProductos(
        overlay
    );
}

function renderizarCategorias() {
    const contenedor =
        document.getElementById(
            "categorias-grid"
        );

    if (!contenedor) {
        return;
    }

    const categorias =
        obtenerCategorias();

    if (!categorias.length) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                No hay categorías registradas.
            </div>
        `;

        return;
    }

    const productos =
        obtenerProductos();

    contenedor.innerHTML =
        categorias
            .map(categoria => {
                const cantidad =
                    productos.filter(
                        producto =>
                            normalizarTexto(
                                producto
                                    .categoria
                            ) ===
                            normalizarTexto(
                                categoria
                            )
                    ).length;

                return `
                    <button
                        class="categoria"
                        type="button"
                        data-categoria="${escapeAtributo(
                            categoria
                        )}"
                    >
                        <span class="categoria-icono">
                            ${obtenerIconoCategoria(
                                categoria
                            )}
                        </span>

                        <h3>
                            ${escapeHTML(
                                categoria
                            )}
                        </h3>

                        <p>
                            ${cantidad}
                            producto${
                                cantidad === 1
                                    ? ""
                                    : "s"
                            }
                        </p>
                    </button>
                `;
            })
            .join("");

    contenedor
        .querySelectorAll(
            "[data-categoria]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    mostrarProductosCategoria(
                        boton.dataset
                            .categoria
                    );
                }
            );
        });
}

function obtenerIconoCategoria(
    categoria
) {
    const nombre =
        normalizarTexto(
            categoria
        );

    if (
        nombre.includes(
            "belleza"
        )
    ) {
        return "✨";
    }

    if (
        nombre.includes(
            "electron"
        )
    ) {
        return "💻";
    }

    if (
        nombre.includes(
            "arte"
        )
    ) {
        return "🎨";
    }

    if (
        nombre.includes(
            "escolar"
        )
    ) {
        return "📚";
    }

    return "🛍️";
}

function mostrarProductosCategoria(
    categoria
) {
    const contenedor =
        document.getElementById(
            "productos-categoria"
        );

    if (!contenedor) {
        return;
    }

    const productos =
        obtenerProductos().filter(
            producto =>
                normalizarTexto(
                    producto.categoria
                ) ===
                normalizarTexto(
                    categoria
                )
        );

    contenedor.innerHTML = `
        <div class="encabezado-categoria-productos">
            <h2>
                ${escapeHTML(
                    categoria
                )}
            </h2>

            <p>
                ${
                    productos.length
                } producto${
                    productos.length === 1
                        ? ""
                        : "s"
                }
            </p>
        </div>

        ${
            productos.length
                ? `
                    <div class="productos-grid">
                        ${productos
                            .map(
                                crearTarjetaProducto
                            )
                            .join("")}
                    </div>
                `
                : `
                    <div class="estado-vacio">
                        <p>
                            Todavía no hay productos
                            en esta categoría.
                        </p>
                    </div>
                `
        }
    `;

    configurarAccionesProductos(
        contenedor
    );

    contenedor.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function renderizarOfertas() {
    const contenedor =
        document.getElementById(
            "ofertas-grid"
        );

    if (!contenedor) {
        return;
    }

    const productos =
        obtenerProductos().filter(
            producto =>
                Number(
                    producto.descuento
                ) > 0
        );

    if (!productos.length) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <h3>
                    No hay ofertas activas
                </h3>

                <p>
                    Las promociones aparecerán
                    aquí cuando el administrador
                    las configure.
                </p>
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        productos
            .map(
                crearTarjetaProducto
            )
            .join("");

    configurarAccionesProductos(
        contenedor
    );
}

function actualizarContadores() {
    const contadorFavoritos =
        document.getElementById(
            "contador-favoritos"
        );

    const contadorCarrito =
        document.getElementById(
            "contador-carrito"
        );

    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        if (contadorFavoritos) {
            contadorFavoritos.textContent =
                "0";
        }

        if (contadorCarrito) {
            contadorCarrito.textContent =
                "0";
        }

        return;
    }

    const favoritos =
        obtenerFavoritosCliente();

    if (contadorFavoritos) {
        contadorFavoritos.textContent =
            String(
                favoritos.length
            );
    }

    const carritos =
        obtenerCarritosTodos();

    const carrito =
        Array.isArray(
            carritos[
                sesion.correo
            ]
        )
            ? carritos[
                sesion.correo
            ]
            : [];

    const cantidad =
        carrito.reduce(
            (
                total,
                item
            ) =>
                total +
                Math.max(
                    0,
                    Number(
                        item.cantidad
                    ) || 0
                ),
            0
        );

    if (contadorCarrito) {
        contadorCarrito.textContent =
            String(cantidad);
    }
}
function obtenerCarritoCliente() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        return [];
    }

    const carritos =
        obtenerCarritosTodos();

    const carrito =
        carritos[
            sesion.correo
        ];

    return Array.isArray(
        carrito
    )
        ? carrito
        : [];
}

function guardarCarritoCliente(
    carrito
) {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        return false;
    }

    const carritos =
        obtenerCarritosTodos();

    carritos[
        sesion.correo
    ] = carrito;

    const resultado =
        guardarCarritosTodos(
            carritos
        );

    if (resultado) {
        actualizarContadores();
    }

    return resultado;
}

function cantidadTotalCarrito(
    carrito
) {
    return carrito.reduce(
        (
            total,
            item
        ) =>
            total +
            Math.max(
                0,
                Number(
                    item.cantidad
                ) || 0
            ),
        0
    );
}

async function agregarAlCarrito(
    idProducto
) {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        mostrarMensaje(
            "Inicia sesión como cliente para agregar productos al carrito.",
            "aviso"
        );

        mostrarLogin();

        return;
    }

    const producto =
        obtenerProductos().find(
            item =>
                mismoId(
                    item.id,
                    idProducto
                )
        );

    if (!producto) {
        mostrarMensaje(
            "El producto ya no existe.",
            "error"
        );

        return;
    }

    if (!estaDisponible(producto)) {
        mostrarMensaje(
            "Este producto no está disponible.",
            "error"
        );

        return;
    }

    const { data: carrito, error: errorCarrito } =
        await supabaseBrihanna
            .from("carritos")
            .select("id")
            .eq(
                "cliente_id",
                sesion.id
            )
            .maybeSingle();

    if (errorCarrito || !carrito) {
        mostrarMensaje(
            "No se pudo encontrar el carrito.",
            "error"
        );

        return;
    }

    const { data: detalles, error: errorDetalles } =
        await supabaseBrihanna
            .from("carrito_detalle")
            .select(
                "id, producto_id, cantidad"
            )
            .eq(
                "carrito_id",
                carrito.id
            );

    if (errorDetalles) {
        mostrarMensaje(
            "No se pudo consultar el carrito.",
            "error"
        );

        return;
    }

    const totalActual =
        (detalles || []).reduce(
            (total, item) =>
                total +
                Number(item.cantidad),
            0
        );

    if (
        totalActual >=
        LIMITE_CARRITO
    ) {
        mostrarMensaje(
            `El carrito permite un máximo de ${LIMITE_CARRITO} unidades.`,
            "error"
        );

        return;
    }

    const existente =
        (detalles || []).find(
            item =>
                mismoId(
                    item.producto_id,
                    producto.id
                )
        );

    if (existente) {
        const nuevaCantidad =
            Number(
                existente.cantidad
            ) + 1;

        if (
            nuevaCantidad >
            Number(producto.stock)
        ) {
            mostrarMensaje(
                "No hay más unidades disponibles de este producto.",
                "error"
            );

            return;
        }

        const { error } =
            await supabaseBrihanna
                .from("carrito_detalle")
                .update({
                    cantidad:
                        nuevaCantidad
                })
                .eq(
                    "id",
                    existente.id
                );

        if (error) {
            mostrarMensaje(
                "No se pudo actualizar el carrito.",
                "error"
            );

            return;
        }
    } else {
        const { error } =
            await supabaseBrihanna
                .from("carrito_detalle")
                .insert({
                    carrito_id:
                        carrito.id,
                    producto_id:
                        producto.id,
                    cantidad: 1
                });

        if (error) {
            mostrarMensaje(
                "No se pudo agregar el producto al carrito.",
                "error"
            );

            return;
        }
    }

    await cargarCarritoSupabase();

    mostrarMensaje(
        "Producto agregado al carrito.",
        "exito"
    );

    actualizarContadores();
}

function mostrarCarrito() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        mostrarMensaje(
            "Inicia sesión como cliente para ver tu carrito.",
            "aviso"
        );

        mostrarLogin();

        return;
    }

    const carrito =
        obtenerCarritoCliente();

    const productos =
        obtenerProductos();

    const items =
        carrito
            .map(item => {
                const producto =
                    productos.find(
                        producto =>
                            mismoId(
                                producto.id,
                                item.idProducto
                            )
                    );

                if (!producto) {
                    return null;
                }

                const cantidad =
                    Math.max(
                        1,
                        Number(
                            item.cantidad
                        ) || 1
                    );

                const precio =
                    precioFinal(
                        producto
                    );

                return {
                    producto,
                    cantidad,
                    subtotal:
                        precio *
                        cantidad
                };
            })
            .filter(Boolean);

    if (!items.length) {
        abrirVentana(`
            <div class="modal-encabezado">
                <div>
                    <h2>
                        Mi carrito
                    </h2>

                    <p>
                        Revisa los productos
                        que deseas comprar.
                    </p>
                </div>

                <button
                    class="btn-cerrar-modal"
                    type="button"
                >
                    ×
                </button>
            </div>

            <div class="estado-vacio">
                <h3>
                    Tu carrito está vacío
                </h3>

                <p>
                    Agrega productos desde
                    nuestro catálogo.
                </p>

                <button
                    id="carrito-ver-productos"
                    class="btn-sistema btn-azul"
                    type="button"
                >
                    Ver productos
                </button>
            </div>
        `);

        const boton =
            document.getElementById(
                "carrito-ver-productos"
            );

        if (boton) {
            boton.addEventListener(
                "click",
                () => {
                    cerrarVentana();

                    mostrarSeccion(
                        "productos"
                    );
                }
            );
        }

        return;
    }

    const total =
        items.reduce(
            (
                suma,
                item
            ) =>
                suma +
                item.subtotal,
            0
        );

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    Mi carrito
                </h2>

                <p>
                    Puedes agregar hasta
                    ${LIMITE_CARRITO}
                    unidades en total.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <div class="carrito-lista">
            ${items
                .map(item => {
                    const producto =
                        item.producto;

                    return `
                        <div
                            class="carrito-item"
                            data-carrito-item="${escapeAtributo(
                                producto.id
                            )}"
                        >
                            <div class="carrito-item-info">
                                <h3>
                                    ${escapeHTML(
                                        producto.nombre
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        producto.categoria
                                    )}
                                </p>

                                <strong>
                                    Bs ${precioFinal(
                                        producto
                                    ).toFixed(
                                        2
                                    )}
                                </strong>
                            </div>

                            <div class="carrito-cantidad">
                                <button
                                    type="button"
                                    data-carrito-restar="${escapeAtributo(
                                        producto.id
                                    )}"
                                    aria-label="Restar una unidad"
                                >
                                    −
                                </button>

                                <span>
                                    ${item.cantidad}
                                </span>

                                <button
                                    type="button"
                                    data-carrito-sumar="${escapeAtributo(
                                        producto.id
                                    )}"
                                    aria-label="Agregar una unidad"
                                >
                                    +
                                </button>
                            </div>

                            <div class="carrito-subtotal">
                                Bs ${item.subtotal.toFixed(
                                    2
                                )}
                            </div>

                            <button
                                class="btn-eliminar-carrito"
                                type="button"
                                data-carrito-eliminar="${escapeAtributo(
                                    producto.id
                                )}"
                            >
                                Eliminar
                            </button>
                        </div>
                    `;
                })
                .join("")}
        </div>

        <div class="carrito-resumen">
            <p>
                Productos:
                <strong>
                    ${cantidadTotalCarrito(
                        carrito
                    )}
                </strong>
            </p>

            <p class="carrito-total">
                Total:
                <strong>
                    Bs ${total.toFixed(
                        2
                    )}
                </strong>
            </p>
        </div>

        <div class="acciones-formulario">
            <button
                id="vaciar-carrito"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Vaciar carrito
            </button>

            <button
                id="realizar-pedido"
                class="btn-sistema btn-verde"
                type="button"
            >
                Realizar pedido
            </button>
        </div>
    `, "modal-grande");

    configurarBotonesCarrito();
}

function configurarBotonesCarrito() {
    document
        .querySelectorAll(
            "[data-carrito-restar]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    cambiarCantidadCarrito(
                        boton.dataset
                            .carritoRestar,
                        -1
                    );
                }
            );
        });

    document
        .querySelectorAll(
            "[data-carrito-sumar]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    cambiarCantidadCarrito(
                        boton.dataset
                            .carritoSumar,
                        1
                    );
                }
            );
        });

    document
        .querySelectorAll(
            "[data-carrito-eliminar]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    eliminarDelCarrito(
                        boton.dataset
                            .carritoEliminar
                    );
                }
            );
        });

    const vaciar =
        document.getElementById(
            "vaciar-carrito"
        );

    if (vaciar) {
        vaciar.addEventListener(
            "click",
            vaciarCarrito
        );
    }

    const pedido =
        document.getElementById(
            "realizar-pedido"
        );

    if (pedido) {
        pedido.addEventListener(
            "click",
            confirmarPedido
        );
    }
}

async function cambiarCantidadCarrito(idProducto, cambio) {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    const carrito = obtenerCarritoCliente();

    const item = carrito.find(elemento =>
        mismoId(elemento.idProducto, idProducto)
    );

    if (!item) return;

    const producto = obtenerProductos().find(elemento =>
        mismoId(elemento.id, idProducto)
    );

    if (!producto) {
        await eliminarDelCarrito(idProducto);
        return;
    }

    const nuevaCantidad = Number(item.cantidad) + Number(cambio);

    if (nuevaCantidad <= 0) {
        await eliminarDelCarrito(idProducto);
        return;
    }

    if (
        cambio > 0 &&
        cantidadTotalCarrito(carrito) >= LIMITE_CARRITO
    ) {
        mostrarMensaje(
            `Solo puedes agregar ${LIMITE_CARRITO} unidades en total.`,
            "error"
        );
        return;
    }

    if (nuevaCantidad > Number(producto.stock)) {
        mostrarMensaje(
            `Solo quedan ${producto.stock} unidades disponibles.`,
            "error"
        );
        return;
    }

    if (!estaDisponible(producto)) {
        mostrarMensaje(
            "Este producto ya no está disponible.",
            "error"
        );
        return;
    }

    try {
        const { data: carritoBD, error: errorCarrito } =
            await supabaseBrihanna
                .from("carritos")
                .select("id")
                .eq("cliente_id", sesion.id)
                .maybeSingle();

        if (errorCarrito) throw errorCarrito;

        if (!carritoBD) {
            throw new Error("No se encontró tu carrito.");
        }

        const { error } = await supabaseBrihanna
            .from("carrito_detalle")
            .update({ cantidad: nuevaCantidad })
            .eq("carrito_id", carritoBD.id)
            .eq("producto_id", idProducto);

        if (error) throw error;

        item.cantidad = nuevaCantidad;

        guardarCarritoCliente(carrito);

        mostrarCarrito();

    } catch (error) {
        console.error("Error al cambiar la cantidad:", error);

        mostrarMensaje(
            "No se pudo actualizar la cantidad en Supabase.",
            "error"
        );
    }
}

async function eliminarDelCarrito(idProducto) {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    try {
        const { data: carritoBD, error: errorCarrito } =
            await supabaseBrihanna
                .from("carritos")
                .select("id")
                .eq("cliente_id", sesion.id)
                .maybeSingle();

        if (errorCarrito) throw errorCarrito;

        if (!carritoBD) {
            throw new Error("No se encontró tu carrito.");
        }

        const { error } = await supabaseBrihanna
            .from("carrito_detalle")
            .delete()
            .eq("carrito_id", carritoBD.id)
            .eq("producto_id", idProducto);

        if (error) throw error;

        const nuevoCarrito = obtenerCarritoCliente().filter(
            item => !mismoId(item.idProducto, idProducto)
        );

        guardarCarritoCliente(nuevoCarrito);

        mostrarMensaje(
            "Producto eliminado del carrito.",
            "exito"
        );

        mostrarCarrito();

    } catch (error) {
        console.error("Error al eliminar del carrito:", error);

        mostrarMensaje(
            "No se pudo eliminar el producto de Supabase.",
            "error"
        );
    }
}

async function vaciarCarrito() {
    const confirmar = window.confirm(
        "¿Deseas vaciar todo el carrito?"
    );

    if (!confirmar) return;

    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    try {
        const { data: carritoBD, error: errorCarrito } =
            await supabaseBrihanna
                .from("carritos")
                .select("id")
                .eq("cliente_id", sesion.id)
                .maybeSingle();

        if (errorCarrito) throw errorCarrito;

        if (carritoBD) {
            const { error } = await supabaseBrihanna
                .from("carrito_detalle")
                .delete()
                .eq("carrito_id", carritoBD.id);

            if (error) throw error;
        }

        guardarCarritoCliente([]);

        mostrarMensaje(
            "El carrito se vació correctamente.",
            "exito"
        );

        mostrarCarrito();

    } catch (error) {
        console.error("Error al vaciar el carrito:", error);

        mostrarMensaje(
            "No se pudo vaciar el carrito en Supabase.",
            "error"
        );
    }
}

function confirmarPedido() {
    const sesion =
        obtenerSesion();

    if (
        !sesion ||
        sesion.rol !== "cliente"
    ) {
        mostrarLogin();

        return;
    }

    const carrito =
        obtenerCarritoCliente();

    if (!carrito.length) {
        mostrarMensaje(
            "Tu carrito está vacío.",
            "error"
        );

        return;
    }

    const productos =
        obtenerProductos();

    const detalles = [];

    let total = 0;

    for (
        const item of carrito
    ) {
        const producto =
            productos.find(
                elemento =>
                    mismoId(
                        elemento.id,
                        item.idProducto
                    )
            );

        if (!producto) {
            mostrarMensaje(
                "Uno de los productos del carrito ya no existe.",
                "error"
            );

            return;
        }

        const cantidad =
            Math.max(
                1,
                Number(
                    item.cantidad
                ) || 1
            );

        if (
            !estaDisponible(
                producto
            )
        ) {
            mostrarMensaje(
                `${producto.nombre} ya no está disponible.`,
                "error"
            );

            return;
        }

        if (
            cantidad >
            Number(
                producto.stock
            )
        ) {
            mostrarMensaje(
                `No hay suficiente stock de ${producto.nombre}. Solo quedan ${producto.stock} unidades.`,
                "error"
            );

            return;
        }

        const precio =
            precioFinal(
                producto
            );

        const subtotal =
            precio *
            cantidad;

        detalles.push({
            idProducto:
                producto.id,
            nombre:
                producto.nombre,
            precio,
            cantidad,
            subtotal
        });

        total += subtotal;
    }

    const cantidadTotal =
        cantidadTotalCarrito(
            carrito
        );

    if (
        cantidadTotal >
        LIMITE_CARRITO
    ) {
        mostrarMensaje(
            `El pedido supera el límite de ${LIMITE_CARRITO} unidades.`,
            "error"
        );

        return;
    }

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    Confirmar pedido
                </h2>

                <p>
                    Revisa la información
                    antes de continuar.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <div class="resumen-confirmacion">
            <p>
                <strong>Cliente:</strong>
                ${escapeHTML(
                    sesion.nombre
                )}
            </p>

            <p>
                <strong>Correo:</strong>
                ${escapeHTML(
                    sesion.correo
                )}
            </p>

            <p>
                <strong>Productos:</strong>
                ${cantidadTotal}
            </p>

            <p>
                <strong>Total:</strong>
                Bs ${total.toFixed(
                    2
                )}
            </p>
        </div>

        <div class="acciones-formulario">
            <button
                id="volver-carrito"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Volver
            </button>

            <button
                id="confirmar-compra"
                class="btn-sistema btn-verde"
                type="button"
            >
                Confirmar pedido
            </button>
        </div>
    `);

    document
        .getElementById(
            "volver-carrito"
        )
        .addEventListener(
            "click",
            mostrarCarrito
        );

    document
        .getElementById(
            "confirmar-compra"
        )
        .addEventListener(
            "click",
            () => {
                mostrarMetodosPago(
                    detalles,
                    total
                );
            }
        );
}


async function crearPedido(detalles, total, imagenSeleccionada) {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
        mostrarMensaje("El carrito está vacío.", "error");
        return;
    }

    if (!imagenSeleccionada) {
        mostrarMensaje("Selecciona una imagen de demostración.", "error");
        return;
    }

    if (
        !["image/jpeg", "image/png", "image/webp"].includes(
            imagenSeleccionada.type
        ) ||
        imagenSeleccionada.size > 3 * 1024 * 1024
    ) {
        mostrarMensaje("La imagen no es válida o supera los 3 MB.", "error");
        return;
    }

    let rutaImagen = null;

    try {
        const numero = generarNumeroPedido();

        const detallesPedido = detalles.map(detalle => ({
            idProducto: Number(detalle.idProducto),
            cantidad: Number(detalle.cantidad)
        }));

        if (detallesPedido.some(detalle =>
            !Number.isInteger(detalle.idProducto) ||
            !Number.isInteger(detalle.cantidad) ||
            detalle.idProducto <= 0 ||
            detalle.cantidad <= 0
        )) {
            mostrarMensaje("Los productos del pedido no son válidos.", "error");
            return;
        }

        const extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }[imagenSeleccionada.type];

        rutaImagen =
            `demostracion/${sesion.id}/${numero}-${Date.now()}.${extension}`;

        // Subir imagen de demostración a Supabase Storage
        const { error: errorSubida } = await supabaseBrihanna
            .storage
            .from("comprobantes-demo")
            .upload(rutaImagen, imagenSeleccionada, {
                contentType: imagenSeleccionada.type,
                upsert: false
            });

        if (errorSubida) throw errorSubida;

        const { data: urlImagen } = supabaseBrihanna
            .storage
            .from("comprobantes-demo")
            .getPublicUrl(rutaImagen);

        if (!urlImagen?.publicUrl) {
            throw new Error("No se pudo obtener la dirección de la imagen.");
        }

        // Registrar pedido y descontar stock
        const { data, error } = await supabaseBrihanna.rpc(
            "crear_pedido_seguro",
            {
                p_numero: numero,
                p_detalles: detallesPedido
            }
        );

        if (error) throw error;

        // Asociar la imagen al pedido
        const { error: errorComprobante } = await supabaseBrihanna.rpc(
            "guardar_comprobante_demo",
            {
                p_pedido_id: data.id,
                p_comprobante_url: urlImagen.publicUrl
            }
        );

        if (errorComprobante) {
            console.error(
                "El pedido se registró, pero no se pudo asociar la imagen:",
                errorComprobante
            );

            await cargarProductosSupabase();
            await cargarCarritoSupabase();
            guardarCarritoCliente([]);
            cerrarVentana();
            renderizarTodo();

            mostrarMensaje(
                `El pedido ${data.numero} se registró, pero no se pudo guardar la imagen.`,
                "error"
            );

            return;
        }

        const pedido = {
            id: data.id,
            numero: data.numero,
            clienteId: sesion.id,
            clienteNombre: sesion.nombre,
            clienteCorreo: sesion.correo,
            productos: detalles,
            total: Number(data.total),
            estado: "Pendiente",
            fecha: new Date().toISOString(),
            stockDevuelto: false,
            comprobanteUrl: urlImagen.publicUrl
        };

        await cargarProductosSupabase();
        await cargarCarritoSupabase();

        guardarCarritoCliente([]);

        cerrarVentana();
        renderizarTodo();

        mostrarMensaje(
            `Pedido ${pedido.numero} registrado correctamente.`,
            "exito"
        );

        mostrarPedidoExitoso(pedido);

    } catch (error) {
        console.error("Error al crear el pedido:", error);

        // Eliminar la imagen si el registro del pedido falló
        if (rutaImagen) {
            await supabaseBrihanna
                .storage
                .from("comprobantes-demo")
                .remove([rutaImagen]);
        }

        mostrarMensaje(
            error.message || "No se pudo registrar el pedido.",
            "error"
        );
    }
}



function generarNumeroPedido() {
    const fecha = new Date();

    const marcaTiempo =
        fecha.getTime().toString(36).toUpperCase();

    const identificador =
        crypto.randomUUID()
            .replace(/-/g, "")
            .substring(0, 6)
            .toUpperCase();

    return `BR-${marcaTiempo}-${identificador}`;
}

function mostrarPedidoExitoso(
    pedido
) {
    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    ¡Pedido realizado!
                </h2>

                <p>
                    Tu pedido fue registrado
                    correctamente.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <div class="pedido-exitoso">
            <div class="pedido-exitoso-icono">
                ✓
            </div>

            <h3>
                ${escapeHTML(
                    pedido.numero
                )}
            </h3>

            <p>
                Estado:
                <strong>
                    ${escapeHTML(
                        pedido.estado
                    )}
                </strong>
            </p>

            <p>
                Total:
                <strong>
                    Bs ${Number(
                        pedido.total
                    ).toFixed(
                        2
                    )}
                </strong>
            </p>
        </div>

        <div class="acciones-formulario">
            <button
                id="pedido-seguir-comprando"
                class="btn-sistema btn-azul"
                type="button"
            >
                Seguir comprando
            </button>

            <button
                id="pedido-ver-mis-pedidos"
                class="btn-sistema btn-verde"
                type="button"
            >
                Ver mis pedidos
            </button>
        </div>
    `);

    document
        .getElementById(
            "pedido-seguir-comprando"
        )
        .addEventListener(
            "click",
            () => {
                cerrarVentana();

                mostrarSeccion(
                    "productos"
                );
            }
        );

    document
        .getElementById(
            "pedido-ver-mis-pedidos"
        )
        .addEventListener(
            "click",
            mostrarPedidosCliente
        );
}

async function mostrarPedidosCliente() {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    try {
        const { data, error } = await supabaseBrihanna
            .from("pedidos")
            .select(`
                id,
                numero,
                cliente_id,
                estado,
                total,
                fecha,
                stock_devuelto,
                detalle_pedido (
                    id,
                    producto_id,
                    nombre_producto,
                    precio,
                    cantidad,
                    subtotal
                )
            `)
            .eq("cliente_id", sesion.id)
            .order("fecha", { ascending: false });

        if (error) throw error;

        const pedidos = (data || []).map(pedido => ({
            id: pedido.id,
            numero: pedido.numero,
            clienteId: pedido.cliente_id,
            clienteNombre: sesion.nombre,
            clienteCorreo: sesion.correo,
            estado: pedido.estado,
            total: Number(pedido.total),
            fecha: pedido.fecha,
            stockDevuelto: pedido.stock_devuelto,
            productos: (pedido.detalle_pedido || []).map(detalle => ({
                idProducto: detalle.producto_id,
                nombre: detalle.nombre_producto,
                precio: Number(detalle.precio),
                cantidad: Number(detalle.cantidad),
                subtotal: Number(detalle.subtotal)
            }))
        }));

        const contenido = pedidos.length
            ? pedidos.map(crearTarjetaPedidoCliente).join("")
            : `
                <div class="estado-vacio">
                    <h3>Aún no tienes pedidos</h3>
                    <p>
                        Tus compras aparecerán
                        aquí después de realizar
                        un pedido.
                    </p>
                </div>
            `;

        abrirVentana(`
            <div class="modal-encabezado">
                <div>
                    <h2>Mis pedidos</h2>
                    <p>
                        Consulta el estado de
                        tus compras.
                    </p>
                </div>

                <button
                    class="btn-cerrar-modal"
                    type="button"
                >
                    ×
                </button>
            </div>

            <div class="pedidos-lista">
                ${contenido}
            </div>

            <div class="acciones-formulario">
                <button
                    id="volver-mi-cuenta"
                    class="btn-sistema btn-secundario"
                    type="button"
                >
                    Volver a mi cuenta
                </button>
            </div>
        `, "modal-grande");

        const volver = document.getElementById(
            "volver-mi-cuenta"
        );

        if (volver) {
            volver.addEventListener(
                "click",
                mostrarCuentaCliente
            );
        }

    } catch (error) {
        console.error("Error al cargar los pedidos:", error);

        mostrarMensaje(
            "No se pudo cargar tu historial de pedidos.",
            "error"
        );
    }
}

function crearTarjetaPedidoCliente(pedido) {
    const productos = Array.isArray(pedido.productos)
        ? pedido.productos
        : [];

    const fecha = formatearFecha(pedido.fecha);

    const estado = pedido.estado || "Pendiente";

    return `
        <article class="pedido-card">
            <div class="pedido-cabecera">
                <div>
                    <h3>
                        ${escapeHTML(pedido.numero || "Pedido")}
                    </h3>

                    <p>
                        ${escapeHTML(fecha)}
                    </p>
                </div>

                <span class="estado-pedido estado-${normalizarTexto(estado).replace(/\s+/g, "-")}">
                    ${escapeHTML(estado)}
                </span>
            </div>

            <div class="pedido-productos">
                ${productos.length
                    ? productos.map(producto => `
                        <div class="pedido-producto-linea">
                            <span>
                                ${escapeHTML(producto.nombre || "Producto")}
                                ×
                                ${Number(producto.cantidad) || 0}
                            </span>

                            <strong>
                                Bs ${(Number(producto.subtotal) || 0).toFixed(2)}
                            </strong>
                        </div>
                    `).join("")
                    : `
                        <p>No hay detalles disponibles.</p>
                    `
                }
            </div>

            <div class="pedido-total">
                <span>Total</span>

                <strong>
                    Bs ${(Number(pedido.total) || 0).toFixed(2)}
                </strong>
            </div>
        </article>
    `;
}

function formatearFecha(
    fecha
) {
    if (!fecha) {
        return "Fecha no disponible";
    }

    const valor =
        new Date(
            fecha
        );

    if (
        Number.isNaN(
            valor.getTime()
        )
    ) {
        return String(
            fecha
        );
    }

    return valor.toLocaleString(
        "es-BO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}
function mostrarPanelAdministrador() {
    if (!esAdministrador()) {
        mostrarLogin();
        return;
    }

    const productos = obtenerProductos();
    const pedidos = obtenerPedidos();
    const usuarios = obtenerUsuarios();

    const pendientes = pedidos.filter(
        pedido =>
            pedido.estado !== "Entregado" &&
            pedido.estado !== "Cancelado"
    ).length;

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>Panel de administrador</h2>
                <p>
                    Administra la Librería Brianna.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <div class="admin-resumen">
            <div class="admin-resumen-card">
                <strong>
                    ${productos.length}
                </strong>
                <span>
                    Productos
                </span>
            </div>

            <div class="admin-resumen-card">
                <strong>
                    ${pedidos.length}
                </strong>
                <span>
                    Pedidos
                </span>
            </div>

            <div class="admin-resumen-card">
                <strong>
                    ${pendientes}
                </strong>
                <span>
                    Por atender
                </span>
            </div>

            <div class="admin-resumen-card">
                <strong>
                    ${usuarios.length}
                </strong>
                <span>
                    Clientes
                </span>
            </div>
        </div>

        <div class="admin-opciones">
            <button
                id="admin-productos"
                class="btn-sistema btn-azul"
                type="button"
            >
                Productos
            </button>

            <button
                id="admin-categorias"
                class="btn-sistema btn-azul"
                type="button"
            >
                Categorías
            </button>

            <button
                id="admin-ofertas"
                class="btn-sistema btn-azul"
                type="button"
            >
                Ofertas
            </button>

            <button
                id="admin-pedidos"
                class="btn-sistema btn-verde"
                type="button"
            >
                Pedidos
            </button>

            <button
                id="admin-clientes"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Clientes
            </button>

            <button
                id="admin-tienda"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Datos de la tienda
            </button>

            <button
                id="admin-cuenta"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Cuenta administrativa
            </button>

            <button
                id="admin-cerrar-sesion"
                class="btn-sistema btn-peligro"
                type="button"
            >
                Cerrar sesión
            </button>
        </div>
    `, "modal-grande");

    asignarEvento(
        "admin-productos",
        mostrarAdministradorProductos
    );

    asignarEvento(
        "admin-categorias",
        mostrarAdministradorCategorias
    );

    asignarEvento(
        "admin-ofertas",
        mostrarAdministradorOfertas
    );

    asignarEvento(
        "admin-pedidos",
        mostrarAdministradorPedidos
    );

    asignarEvento(
        "admin-clientes",
        mostrarAdministradorClientes
    );

    asignarEvento(
        "admin-tienda",
        mostrarConfiguracionTienda
    );

    asignarEvento(
        "admin-cuenta",
        mostrarConfiguracionAdmin
    );

    asignarEvento(
        "admin-cerrar-sesion",
        cerrarSesion
    );
    agregarAccesoConfiguracionQR();
}

function asignarEvento(
    id,
    funcion
) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.addEventListener(
            "click",
            funcion
        );
    }
}

function mostrarAdministradorProductos() {
    if (!esAdministrador()) {
        return;
    }

    const productos =
        obtenerProductos();

    const contenido =
        productos.length
            ? productos
                .map(producto => `
                    <article class="admin-producto-card">
                        <div class="admin-producto-info">
                            <h3>
                                ${escapeHTML(
                                    producto.nombre
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    producto.categoria
                                )}
                            </p>

                            <p>
                                Precio:
                                <strong>
                                    Bs ${Number(
                                        producto.precio
                                    ).toFixed(2)}
                                </strong>
                            </p>

                            <p>
                                Stock:
                                <strong>
                                    ${Number(
                                        producto.stock
                                    ) || 0}
                                </strong>
                            </p>

                            <p>
                                Estado:
                                <strong>
                                    ${
                                        estaDisponible(
                                            producto
                                        )
                                            ? "Disponible"
                                            : "No disponible"
                                    }
                                </strong>
                            </p>
                        </div>

                        <div class="admin-producto-acciones">
                            <button
                                type="button"
                                class="btn-sistema btn-azul"
                                data-editar-producto="${escapeAtributo(
                                    producto.id
                                )}"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                class="btn-sistema btn-peligro"
                                data-eliminar-producto="${escapeAtributo(
                                    producto.id
                                )}"
                            >
                                Eliminar
                            </button>
                        </div>
                    </article>
                `)
                .join("")
            : `
                <div class="estado-vacio">
                    <p>
                        No hay productos registrados.
                    </p>
                </div>
            `;

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    Administrar productos
                </h2>

                <p>
                    Agrega, modifica o elimina
                    productos del catálogo.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <div class="acciones-formulario">
            <button
                id="admin-nuevo-producto"
                class="btn-sistema btn-verde"
                type="button"
            >
                + Agregar producto
            </button>

            <button
                id="admin-volver-productos"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Volver al panel
            </button>
        </div>

        <div class="admin-lista-productos">
            ${contenido}
        </div>
    `, "modal-grande");

    asignarEvento(
        "admin-nuevo-producto",
        () => mostrarFormularioProducto()
    );

    asignarEvento(
        "admin-volver-productos",
        mostrarPanelAdministrador
    );

    document
        .querySelectorAll(
            "[data-editar-producto]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    mostrarFormularioProducto(
                        boton.dataset
                            .editarProducto
                    );
                }
            );
        });

    document
        .querySelectorAll(
            "[data-eliminar-producto]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    eliminarProducto(
                        boton.dataset
                            .eliminarProducto
                    );
                }
            );
        });
}

function mostrarFormularioProducto(
    idProducto = null
) {
    if (!esAdministrador()) {
        return;
    }

    const producto =
        idProducto
            ? obtenerProductos().find(
                item =>
                    mismoId(
                        item.id,
                        idProducto
                    )
            )
            : null;

    if (
        idProducto &&
        !producto
    ) {
        mostrarMensaje(
            "No se encontró el producto.",
            "error"
        );

        mostrarAdministradorProductos();
        return;
    }

    const categorias =
        obtenerCategorias();

    const titulo =
        producto
            ? "Editar producto"
            : "Agregar producto";

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    ${titulo}
                </h2>

                <p>
                    Completa los datos
                    del producto.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <form
            id="form-producto"
            class="formulario-brianna"
        >
            <div
                id="producto-error"
                class="mensaje-error"
            ></div>

            <div class="form-grupo">
                <label for="producto-nombre">
                    Nombre
                </label>

                <input
                    id="producto-nombre"
                    type="text"
                    required
                    maxlength="100"
                    value="${escapeAtributo(
                        producto
                            ? producto.nombre
                            : ""
                    )}"
                >
            </div>

            <div class="form-grupo">
                <label for="producto-categoria">
                    Categoría
                </label>

                <select
                    id="producto-categoria"
                    required
                >
                    <option value="">
                        Selecciona una categoría
                    </option>

                    ${categorias
                        .map(categoria => `
                            <option
                                value="${escapeAtributo(
                                    categoria
                                )}"
                                ${
                                    producto &&
                                    normalizarTexto(
                                        producto.categoria
                                    ) ===
                                    normalizarTexto(
                                        categoria
                                    )
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHTML(
                                    categoria
                                )}
                            </option>
                        `)
                        .join("")}
                </select>
            </div>

            <div class="form-grupo">
                <label for="producto-precio">
                    Precio en Bs
                </label>

                <input
                    id="producto-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value="${
                        producto
                            ? Number(
                                producto.precio
                            )
                            : ""
                    }"
                >
            </div>

            <div class="form-grupo">
                <label for="producto-stock">
                    Stock
                </label>

                <input
                    id="producto-stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value="${
                        producto
                            ? Number(
                                producto.stock
                            )
                            : ""
                    }"
                >
            </div>

            <div class="form-grupo">
                <label for="producto-descuento">
                    Descuento %
                </label>

                <input
                    id="producto-descuento"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value="${
                        producto
                            ? Number(
                                producto.descuento
                            ) || 0
                            : 0
                    }"
                >
            </div>

            <div class="form-grupo">
                <label for="producto-imagen">
                    Imagen
                </label>

                <input
                    id="producto-imagen"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                >

                <small>
                    PNG, JPG o WEBP.
                    Máximo 1.5 MB.
                </small>
            </div>

            ${
                producto &&
                producto.imagen
                    ? `
                        <div class="producto-imagen-actual">
                            <p>
                                Imagen actual:
                            </p>

                            <img
                                src="${escapeAtributo(
                                    producto.imagen
                                )}"
                                alt="${escapeAtributo(
                                    producto.nombre
                                )}"
                            >

                            <label>
                                <input
                                    id="eliminar-imagen-producto"
                                    type="checkbox"
                                >
                                Eliminar imagen actual
                            </label>
                        </div>
                    `
                    : ""
            }

            <div class="form-grupo">
                <label>
                    <input
                        id="producto-disponible"
                        type="checkbox"
                        ${
                            !producto ||
                            producto.disponible !== false
                                ? "checked"
                                : ""
                        }
                    >
                    Producto disponible
                </label>
            </div>

            <div class="acciones-formulario">
                <button
                    type="button"
                    id="cancelar-producto"
                    class="btn-sistema btn-secundario"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn-sistema btn-verde"
                >
                    Guardar producto
                </button>
            </div>
        </form>
    `);

    asignarEvento(
        "cancelar-producto",
        mostrarAdministradorProductos
    );

    const formulario =
        document.getElementById(
            "form-producto"
        );

    formulario.addEventListener(
        "submit",
        evento => {
            guardarProductoFormulario(
                evento,
                producto
                    ? producto.id
                    : null
            );
        }
    );
}

async function guardarProductoFormulario(
    evento,
    idProducto
) {
    evento.preventDefault();

    if (!esAdministrador()) {
        return;
    }

    const nombre =
        document
            .getElementById("producto-nombre")
            .value
            .trim();

    const categoria =
        document
            .getElementById("producto-categoria")
            .value;

    const precio =
        Number(
            document
                .getElementById("producto-precio")
                .value
        );

    const stock =
        Number(
            document
                .getElementById("producto-stock")
                .value
        );

    const descuento =
        Number(
            document
                .getElementById("producto-descuento")
                .value
        ) || 0;

    const disponible =
        document
            .getElementById("producto-disponible")
            .checked;

    if (!nombre || !categoria) {
        mostrarError(
            "producto-error",
            "Completa todos los datos obligatorios."
        );

        return;
    }

    if (
        !Number.isFinite(precio) ||
        precio < 0
    ) {
        mostrarError(
            "producto-error",
            "El precio no es válido."
        );

        return;
    }

    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        mostrarError(
            "producto-error",
            "El stock debe ser un número entero igual o mayor a 0."
        );

        return;
    }

    if (
        descuento < 0 ||
        descuento > 100
    ) {
        mostrarError(
            "producto-error",
            "El descuento debe estar entre 0 y 100."
        );

        return;
    }

    const categoriaId =
        await obtenerIdCategoriaSupabase(
            categoria
        );

    if (!categoriaId) {
        mostrarError(
            "producto-error",
            "No se encontró la categoría en la base de datos."
        );

        return;
    }

    const productos =
        obtenerProductos();

    const existente =
        idProducto
            ? productos.find(
                item =>
                    mismoId(
                        item.id,
                        idProducto
                    )
            )
            : null;

    let imagen =
        existente
            ? existente.imagen || ""
            : "";

    const eliminarImagen =
        document.getElementById(
            "eliminar-imagen-producto"
        );

    if (
        eliminarImagen &&
        eliminarImagen.checked
    ) {
        imagen = "";
    }

    const archivo =
        document
            .getElementById("producto-imagen")
            .files[0];

    if (archivo) {
    try {
        imagen =
            await subirImagenProducto(
                archivo
            );
    } catch (error) {
        mostrarError(
            "producto-error",
            error.message
        );

        return;
    }
    }
    const datosProducto = {
        nombre: nombre,
        categoria_id: categoriaId,
        precio: precio,
        stock: stock,
        descuento: descuento,
        disponible:
            disponible &&
            stock > 0,
        imagen: imagen,
        fecha_actualizacion:
            new Date().toISOString()
    };

    let resultado;

    if (idProducto) {
        resultado =
            await supabaseBrihanna
                .from("productos")
                .update(datosProducto)
                .eq(
                    "id",
                    idProducto
                )
                .select();
    } else {
        resultado =
            await supabaseBrihanna
                .from("productos")
                .insert(datosProducto)
                .select();
    }

    if (resultado.error) {
        mostrarError(
            "producto-error",
            "No se pudo guardar el producto: " +
                resultado.error.message
        );

        return;
    }

    console.log(
    "PRODUCTO GUARDADO EN SUPABASE:",
    resultado
    );

    mostrarMensaje(
        idProducto
            ? "Producto actualizado correctamente."
            : "Producto agregado correctamente.",
        "exito"
    );

    await cargarProductosSupabase();
    mostrarAdministradorProductos();
    renderizarTodo();
}

async function obtenerIdCategoriaSupabase(
    nombreCategoria
) {
    const { data, error } =
        await supabaseBrihanna
            .from("categorias")
            .select("id")
            .eq(
                "nombre",
                nombreCategoria
            )
            .maybeSingle();

    if (error) {
        return null;
    }

    return data
        ? data.id
        : null;
}

async function subirImagenProducto(
    archivo
) {
    if (!archivo) {
        return null;
    }

    const limite =
        1.5 * 1024 * 1024;

    if (archivo.size > limite) {
        throw new Error(
            "La imagen no puede superar 1.5 MB."
        );
    }

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !tiposPermitidos.includes(
            archivo.type
        )
    ) {
        throw new Error(
            "La imagen debe ser JPG, PNG o WEBP."
        );
    }

    const extension =
        archivo.name
            .split(".")
            .pop()
            .toLowerCase();

    const nombreArchivo =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } =
        await supabaseBrihanna.storage
            .from("productos")
            .upload(
                nombreArchivo,
                archivo,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );

    if (error) {
        throw new Error(
            "No se pudo subir la imagen: " +
            error.message
        );
    }

    const { data } =
        supabaseBrihanna.storage
            .from("productos")
            .getPublicUrl(
                nombreArchivo
            );

    return data.publicUrl;
}

function leerImagenProducto(
    archivo
) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (
                !tiposPermitidos.includes(
                    archivo.type
                )
            ) {
                reject(
                    new Error(
                        "La imagen debe ser JPG, PNG o WEBP."
                    )
                );

                return;
            }

            const limite =
                1.5 *
                1024 *
                1024;

            if (
                archivo.size >
                limite
            ) {
                reject(
                    new Error(
                        "La imagen no puede superar 1.5 MB."
                    )
                );

                return;
            }

            const lector =
                new FileReader();

            lector.onload =
                () => {
                    resolve(
                        lector.result
                    );
                };

            lector.onerror =
                () => {
                    reject(
                        new Error(
                            "No se pudo leer la imagen."
                        )
                    );
                };

            lector.readAsDataURL(
                archivo
            );
        }
    );
}

async function eliminarProducto(
    idProducto
) {
    if (!esAdministrador()) {
        return;
    }

    const producto =
        obtenerProductos().find(
            item =>
                mismoId(
                    item.id,
                    idProducto
                )
        );

    if (!producto) {
        mostrarMensaje(
            "No se encontró el producto.",
            "error"
        );

        return;
    }

    const confirmar =
        window.confirm(
            `¿Deseas eliminar "${producto.nombre}"?`
        );

    if (!confirmar) {
        return;
    }

    const { error } =
        await supabaseBrihanna
            .from("productos")
            .delete()
            .eq(
                "id",
                idProducto
            );

    if (error) {
        mostrarMensaje(
            "No se pudo eliminar el producto: " +
                error.message,
            "error"
        );

        return;
    }

    limpiarProductoDeCarritos(
        idProducto
    );

    limpiarProductoDeFavoritos(
        idProducto
    );

    await cargarProductosSupabase();

    renderizarTodo();

    mostrarMensaje(
        "Producto eliminado correctamente.",
        "exito"
    );

    mostrarAdministradorProductos();
}

function limpiarProductoDeCarritos(
    idProducto
) {
    const carritos =
        obtenerCarritosTodos();

    Object.keys(
        carritos
    ).forEach(correo => {
        if (
            Array.isArray(
                carritos[correo]
            )
        ) {
            carritos[correo] =
                carritos[
                    correo
                ].filter(
                    item =>
                        !mismoId(
                            item.idProducto,
                            idProducto
                        )
                );
        }
    });

    guardarCarritosTodos(
        carritos
    );
}

function limpiarProductoDeFavoritos(
    idProducto
) {
    const favoritos =
        obtenerFavoritosTodos();

    Object.keys(
        favoritos
    ).forEach(correo => {
        if (
            Array.isArray(
                favoritos[correo]
            )
        ) {
            favoritos[correo] =
                favoritos[
                    correo
                ].filter(
                    id =>
                        !mismoId(
                            id,
                            idProducto
                        )
                );
        }
    });

    guardarFavoritosTodos(
        favoritos
    );
}

function mostrarAdministradorCategorias() {
    if (!esAdministrador()) {
        return;
    }

    const categorias =
        obtenerCategorias();

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    Administrar categorías
                </h2>

                <p>
                    Organiza las categorías
                    del catálogo.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <form
            id="form-nueva-categoria"
            class="formulario-brihanna"
        >
            <div class="form-grupo">
                <label for="nueva-categoria">
                    Nueva categoría
                </label>

                <input
                    id="nueva-categoria"
                    type="text"
                    required
                    maxlength="60"
                    placeholder="Nombre de la categoría"
                >
            </div>

            <button
                class="btn-sistema btn-verde"
                type="submit"
            >
                Agregar categoría
            </button>
        </form>

        <div class="admin-categorias-lista">
            ${categorias
                .map(categoria => `
                    <div class="admin-categoria-item">
                        <span>
                            ${escapeHTML(
                                categoria
                            )}
                        </span>

                        <div>
                            <button
                                type="button"
                                class="btn-sistema btn-azul"
                                data-editar-categoria="${escapeAtributo(
                                    categoria
                                )}"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                class="btn-sistema btn-peligro"
                                data-eliminar-categoria="${escapeAtributo(
                                    categoria
                                )}"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                `)
                .join("")}
        </div>

        <div class="acciones-formulario">
            <button
                id="categorias-volver-panel"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Volver al panel
            </button>
        </div>
    `, "modal-grande");

    document
        .getElementById(
            "form-nueva-categoria"
        )
        .addEventListener(
            "submit",
            agregarCategoria
        );

    document
        .querySelectorAll(
            "[data-editar-categoria]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    editarCategoria(
                        boton.dataset
                            .editarCategoria
                    );
                }
            );
        });

    document
        .querySelectorAll(
            "[data-eliminar-categoria]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    eliminarCategoria(
                        boton.dataset
                            .eliminarCategoria
                    );
                }
            );
        });

    asignarEvento(
        "categorias-volver-panel",
        mostrarPanelAdministrador
    );
}

async function agregarCategoria(
    evento
) {
    evento.preventDefault();

    if (!esAdministrador()) {
        return;
    }

    const input =
        document.getElementById(
            "nueva-categoria"
        );

    const nombre =
        input.value.trim();

    if (!nombre) {
        return;
    }

    const categorias =
        obtenerCategorias();

    const existe =
        categorias.some(
            categoria =>
                normalizarTexto(
                    categoria
                ) ===
                normalizarTexto(
                    nombre
                )
        );

    if (existe) {
        mostrarMensaje(
            "Esa categoría ya existe.",
            "error"
        );

        return;
    }

    const { error } =
        await supabaseBrihanna
            .from("categorias")
            .insert({
                nombre: nombre,
                activa: true
            });

    if (error) {
        mostrarMensaje(
            "No se pudo agregar la categoría: " +
                error.message,
            "error"
        );

        return;
    }

    await cargarCategoriasSupabase();

    renderizarTodo();

    mostrarMensaje(
        "Categoría agregada correctamente.",
        "exito"
    );

    mostrarAdministradorCategorias();
}

async function editarCategoria(
    categoriaAnterior
) {
    if (!esAdministrador()) {
        return;
    }

    const nuevoNombre =
        window.prompt(
            "Nuevo nombre de la categoría:",
            categoriaAnterior
        );

    if (nuevoNombre === null) {
        return;
    }

    const nombre =
        nuevoNombre.trim();

    if (!nombre) {
        mostrarMensaje(
            "El nombre no puede estar vacío.",
            "error"
        );

        return;
    }

    const categorias =
        obtenerCategorias();

    const repetida =
        categorias.some(
            categoria =>
                normalizarTexto(
                    categoria
                ) ===
                    normalizarTexto(
                        nombre
                    ) &&
                normalizarTexto(
                    categoria
                ) !==
                    normalizarTexto(
                        categoriaAnterior
                    )
        );

    if (repetida) {
        mostrarMensaje(
            "Ya existe una categoría con ese nombre.",
            "error"
        );

        return;
    }

    const { error } =
        await supabaseBrihanna
            .from("categorias")
            .update({
                nombre: nombre
            })
            .eq(
                "nombre",
                categoriaAnterior
            );

    if (error) {
        mostrarMensaje(
            "No se pudo actualizar la categoría: " +
                error.message,
            "error"
        );

        return;
    }

    await cargarCategoriasSupabase();
    await cargarProductosSupabase();

    renderizarTodo();

    mostrarMensaje(
        "Categoría actualizada correctamente.",
        "exito"
    );

    mostrarAdministradorCategorias();
}

async function eliminarCategoria(
    categoria
) {
    if (!esAdministrador()) {
        return;
    }

    const productos =
        obtenerProductos();

    const enUso =
        productos.some(
            producto =>
                normalizarTexto(
                    producto.categoria
                ) ===
                normalizarTexto(
                    categoria
                )
        );

    if (enUso) {
        mostrarMensaje(
            "No puedes eliminar esta categoría porque tiene productos registrados.",
            "error"
        );

        return;
    }

    const confirmar =
        window.confirm(
            `¿Deseas eliminar la categoría "${categoria}"?`
        );

    if (!confirmar) {
        return;
    }

    const { error } =
        await supabaseBrihanna
            .from("categorias")
            .delete()
            .eq(
                "nombre",
                categoria
            );

    if (error) {
        mostrarMensaje(
            "No se pudo eliminar la categoría: " +
                error.message,
            "error"
        );

        return;
    }

    await cargarCategoriasSupabase();

    renderizarTodo();

    mostrarMensaje(
        "Categoría eliminada correctamente.",
        "exito"
    );

    mostrarAdministradorCategorias();
}

function mostrarAdministradorOfertas() {
    if (!esAdministrador()) {
        return;
    }

    const productos =
        obtenerProductos();

    const contenido =
        productos.length
            ? productos
                .map(producto => `
                    <div class="admin-oferta-item">
                        <div>
                            <h3>
                                ${escapeHTML(
                                    producto.nombre
                                )}
                            </h3>

                            <p>
                                Precio:
                                Bs ${Number(
                                    producto.precio
                                ).toFixed(2)}
                            </p>

                            <p>
                                Descuento actual:
                                <strong>
                                    ${Number(
                                        producto.descuento
                                    ) || 0}%
                                </strong>
                            </p>
                        </div>

                        <button
                            type="button"
                            class="btn-sistema btn-azul"
                            data-editar-oferta="${escapeAtributo(
                                producto.id
                            )}"
                        >
                            Configurar oferta
                        </button>
                    </div>
                `)
                .join("")
            : `
                <div class="estado-vacio">
                    No hay productos registrados.
                </div>
            `;

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    Administrar ofertas
                </h2>

                <p>
                    Asigna descuentos a los
                    productos del catálogo.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <div class="admin-ofertas-lista">
            ${contenido}
        </div>

        <div class="acciones-formulario">
            <button
                id="ofertas-volver-panel"
                class="btn-sistema btn-secundario"
                type="button"
            >
                Volver al panel
            </button>
        </div>
    `, "modal-grande");

    document
        .querySelectorAll(
            "[data-editar-oferta]"
        )
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => {
                    configurarOfertaProducto(
                        boton.dataset
                            .editarOferta
                    );
                }
            );
        });

    asignarEvento(
        "ofertas-volver-panel",
        mostrarPanelAdministrador
    );
}

async function configurarOfertaProducto(idProducto) {
    if (!esAdministrador()) {
        mostrarMensaje(
            "No tienes permiso para modificar ofertas.",
            "error"
        );
        return;
    }

    const productos = obtenerProductos();

    const producto = productos.find(
        item => mismoId(item.id, idProducto)
    );

    if (!producto) {
        mostrarMensaje(
            "No se encontró el producto.",
            "error"
        );
        return;
    }

    const respuesta = window.prompt(
        `Descuento para "${producto.nombre}" entre 0 y 100:`,
        String(Number(producto.descuento) || 0)
    );

    if (respuesta === null) {
        return;
    }

    const descuento = Number(respuesta);

    if (
        !Number.isFinite(descuento) ||
        descuento < 0 ||
        descuento > 100
    ) {
        mostrarMensaje(
            "Ingresa un descuento válido entre 0 y 100.",
            "error"
        );
        return;
    }

    const { error } = await supabaseBrihanna
        .from("productos")
        .update({
            descuento: descuento,
            fecha_actualizacion: new Date().toISOString()
        })
        .eq("id", producto.id);

    if (error) {
        console.error("Error al actualizar la oferta:", error);

        mostrarMensaje(
            "No se pudo guardar la oferta en la base de datos.",
            "error"
        );
        return;
    }

    await cargarProductosSupabase();

    mostrarMensaje(
        descuento > 0
            ? "Oferta actualizada correctamente."
            : "La oferta fue retirada.",
        "exito"
    );

    mostrarAdministradorOfertas();
}



async function mostrarAdministradorPedidos() {
    if (!esAdministrador()) {
        return;
    }

    try {
        const { data: pedidos, error: errorPedidos } =
            await supabaseBrihanna
                .from("pedidos")
                .select(`
                    id,
                    numero,
                    cliente_id,
                    estado,
                    total,
                    fecha,
                    stock_devuelto,
                    comprobante_url
                `)
                .order("fecha", { ascending: false });

        if (errorPedidos) throw errorPedidos;

        const { data: detalles, error: errorDetalles } =
            await supabaseBrihanna
                .from("detalle_pedido")
                .select(`
                    pedido_id,
                    producto_id,
                    nombre_producto,
                    precio,
                    cantidad,
                    subtotal
                `);

        if (errorDetalles) throw errorDetalles;

        const pedidosCompletos = (pedidos || []).map(pedido => ({
            id: pedido.id,
            numero: pedido.numero,
            clienteId: pedido.cliente_id,
            estado: pedido.estado,
            total: Number(pedido.total) || 0,
            fecha: pedido.fecha,
            stockDevuelto: pedido.stock_devuelto,
            comprobanteUrl: pedido.comprobante_url || "",

            detalles: (detalles || [])
                .filter(detalle =>
                    String(detalle.pedido_id) === String(pedido.id)
                )
                .map(detalle => ({
                    productoId: detalle.producto_id,
                    nombre: detalle.nombre_producto,
                    precio: Number(detalle.precio) || 0,
                    cantidad: Number(detalle.cantidad) || 0,
                    subtotal: Number(detalle.subtotal) || 0
                }))
        }));

        const contenido = pedidosCompletos.length
            ? pedidosCompletos
                .map(pedido => {
                    const tarjeta = crearTarjetaPedidoAdmin(pedido);

                    const urlValida =
                        /^https:\/\/[^\s"'<>]+$/i.test(
                            pedido.comprobanteUrl
                        );

                    const comprobanteHTML = urlValida
                        ? `
                            <div class="pedido-comprobante">
                                <h4>Comprobante adjunto</h4>

                                <a
                                    href="${escapeHTML(pedido.comprobanteUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src="${escapeHTML(pedido.comprobanteUrl)}"
                                        alt="Imagen ilustrativa adjunta al pedido"
                                        style="
                                            width: 100%;
                                            max-width: 280px;
                                            height: auto;
                                            display: block;
                                            margin: 10px 0;
                                            border-radius: 10px;
                                            object-fit: contain;
                                        "
                                    >
                                </a>
                            </div>
                        `
                        : `
                            <div class="pedido-comprobante">
                                <h4>Comprobante adjunto</h4>
                                <p>No se adjuntó ninguna imagen.</p>
                            </div>
                        `;

                    return `
                        ${tarjeta}
                        ${comprobanteHTML}
                    `;
                })
                .join("")
            : `
                <div class="estado-vacio">
                    <h3>No hay pedidos</h3>
                    <p>
                        Los pedidos realizados por los clientes aparecerán aquí.
                    </p>
                </div>
            `;

        abrirVentana(`
            <div class="modal-encabezado">
                <div>
                    <h2>Administrar pedidos</h2>
                    <p>
                        Revisa los pedidos, sus productos y las imágenes adjuntas.
                    </p>
                </div>

                <button
                    class="btn-cerrar-modal"
                    type="button"
                >
                    ×
                </button>
            </div>

            <div class="pedidos-lista">
                ${contenido}
            </div>

            <div class="acciones-formulario">
                <button
                    id="pedidos-volver-panel"
                    class="btn-sistema btn-secundario"
                    type="button"
                >
                    Volver al panel
                </button>
            </div>
        `, "modal-grande");

        document
            .querySelectorAll("[data-estado-pedido]")
            .forEach(select => {
                select.addEventListener("change", () => {
                    cambiarEstadoPedido(
                        select.dataset.estadoPedido,
                        select.value
                    );
                });
            });

        document
            .querySelectorAll("[data-eliminar-pedido]")
            .forEach(boton => {
                boton.addEventListener("click", () => {
                    eliminarPedidoFinalizado(
                        boton.dataset.eliminarPedido
                    );
                });
            });

        asignarEvento(
            "pedidos-volver-panel",
            mostrarPanelAdministrador
        );

    } catch (error) {
        console.error(
            "Error al cargar los pedidos:",
            error
        );

        mostrarMensaje(
            "No se pudieron cargar los pedidos desde Supabase.",
            "error"
        );
    }
}

function crearTarjetaPedidoAdmin(
    pedido
) {
    const estados = [
        "Pendiente",
        "En preparación",
        "Listo",
        "Entregado",
        "Cancelado"
    ];

    const productos =
        Array.isArray(
            pedido.productos
        )
            ? pedido.productos
            : [];

    const terminal =
        pedido.estado ===
        "Cancelado";

    const puedeEliminar =
        pedido.estado ===
            "Entregado" ||
        pedido.estado ===
            "Cancelado";

    return `
        <article class="pedido-card admin-pedido-card">
            <div class="pedido-cabecera">
                <div>
                    <h3>
                        ${escapeHTML(
                            pedido.numero ||
                            "Pedido"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            formatearFecha(
                                pedido.fecha
                            )
                        )}
                    </p>
                </div>

                <strong>
                    Bs ${Number(
                        pedido.total
                    ).toFixed(2)}
                </strong>
            </div>

            <div class="pedido-cliente">
                <p>
                    <strong>
                        Cliente:
                    </strong>

                    ${escapeHTML(
                        pedido.clienteNombre
                    )}
                </p>

                <p>
                    <strong>
                        Correo:
                    </strong>

                    ${escapeHTML(
                        pedido.clienteCorreo
                    )}
                </p>
            </div>

            <div class="pedido-productos">
                ${productos
                    .map(producto => `
                        <div class="pedido-producto-linea">
                            <span>
                                ${escapeHTML(
                                    producto.nombre
                                )}
                                ×
                                ${Number(
                                    producto.cantidad
                                ) || 0}
                            </span>

                            <strong>
                                Bs ${Number(
                                    producto.subtotal
                                ).toFixed(2)}
                            </strong>
                        </div>
                    `)
                    .join("")}
            </div>

            <div class="form-grupo">
                <label>
                    Estado del pedido
                </label>

                <select
                    data-estado-pedido="${escapeAtributo(
                        pedido.id
                    )}"
                    ${
                        terminal
                            ? "disabled"
                            : ""
                    }
                >
                    ${estados
                        .map(estado => `
                            <option
                                value="${escapeAtributo(
                                    estado
                                )}"
                                ${
                                    pedido.estado ===
                                    estado
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHTML(
                                    estado
                                )}
                            </option>
                        `)
                        .join("")}
                </select>
            </div>

            ${
                puedeEliminar
                    ? `
                        <button
                            type="button"
                            class="btn-sistema btn-peligro"
                            data-eliminar-pedido="${escapeAtributo(
                                pedido.id
                            )}"
                        >
                            Eliminar pedido
                        </button>
                    `
                    : ""
            }
        </article>
    `;
}


async function cambiarEstadoPedido(
    idPedido,
    nuevoEstado
) {
    if (!esAdministrador()) {
        return;
    }

    const estadosValidos = [
        "Pendiente",
        "En preparación",
        "Listo",
        "Entregado",
        "Cancelado"
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
        return;
    }

    try {
        const { data: pedido, error: errorPedido } =
            await supabaseBrihanna
                .from("pedidos")
                .select("id, estado, stock_devuelto")
                .eq("id", idPedido)
                .single();

        if (errorPedido) throw errorPedido;

        if (pedido.estado === "Cancelado") {
            mostrarMensaje(
                "Un pedido cancelado ya no puede cambiar de estado.",
                "error"
            );
            await mostrarAdministradorPedidos();
            return;
        }

        if (nuevoEstado === "Cancelado") {
            const confirmar = window.confirm(
                "¿Deseas cancelar este pedido? El stock de sus productos será devuelto."
            );

            if (!confirmar) {
                await mostrarAdministradorPedidos();
                return;
            }

            if (!pedido.stock_devuelto) {
                const { data: detalles, error: errorDetalles } =
                    await supabaseBrihanna
                        .from("detalle_pedido")
                        .select("producto_id, cantidad")
                        .eq("pedido_id", pedido.id);

                if (errorDetalles) throw errorDetalles;

                for (const detalle of detalles || []) {
                    if (!detalle.producto_id) continue;

                    const { data: producto, error: errorProducto } =
                        await supabaseBrihanna
                            .from("productos")
                            .select("stock")
                            .eq("id", detalle.producto_id)
                            .single();

                    if (errorProducto) throw errorProducto;

                    const { error: errorStock } =
                        await supabaseBrihanna
                            .from("productos")
                            .update({
                                stock: Number(producto.stock) +
                                    Number(detalle.cantidad)
                            })
                            .eq("id", detalle.producto_id);

                    if (errorStock) throw errorStock;
                }

                const { error: errorDevolucion } =
                    await supabaseBrihanna
                        .from("pedidos")
                        .update({ stock_devuelto: true })
                        .eq("id", pedido.id);

                if (errorDevolucion) throw errorDevolucion;
            }
        }

        const { error: errorActualizacion } =
            await supabaseBrihanna
                .from("pedidos")
                .update({ estado: nuevoEstado })
                .eq("id", pedido.id);

        if (errorActualizacion) throw errorActualizacion;

        await cargarProductosSupabase();
        await mostrarAdministradorPedidos();
        renderizarTodo();

        mostrarMensaje(
            "Estado del pedido actualizado correctamente.",
            "exito"
        );

    } catch (error) {
        console.error(
            "Error al actualizar el pedido:",
            error
        );

        mostrarMensaje(
            "No se pudo actualizar el pedido en Supabase. Revisa la consola.",
            "error"
        );
    }
}

function devolverStockPedido(
    pedido
) {
    if (
        pedido.stockDevuelto
    ) {
        return;
    }

    const productos =
        obtenerProductos();

    const detalles =
        Array.isArray(
            pedido.productos
        )
            ? pedido.productos
            : [];

    detalles.forEach(
        detalle => {
            const producto =
                productos.find(
                    item =>
                        mismoId(
                            item.id,
                            detalle.idProducto
                        )
                );

            if (!producto) {
                return;
            }

            producto.stock =
                Number(
                    producto.stock
                ) +
                Number(
                    detalle.cantidad
                );

            if (
                producto.stock > 0
            ) {
                producto.disponible =
                    true;
            }
        }
    );

    guardarStorage(
        STORAGE_PRODUCTOS,
        productos
    );

    pedido.stockDevuelto =
        true;
}


async function eliminarPedidoFinalizado(idPedido) {
    if (!esAdministrador()) {
        return;
    }

    try {
        const { data: pedido, error: errorPedido } =
            await supabaseBrihanna
                .from("pedidos")
                .select("id, numero, estado")
                .eq("id", idPedido)
                .single();

        if (errorPedido) throw errorPedido;

        if (
            pedido.estado !== "Entregado" &&
            pedido.estado !== "Cancelado"
        ) {
            mostrarMensaje(
                "Solo puedes eliminar pedidos entregados o cancelados.",
                "error"
            );
            return;
        }

        const confirmar = window.confirm(
            `¿Deseas eliminar el pedido ${pedido.numero}?`
        );

        if (!confirmar) {
            return;
        }

        // Primero eliminar los detalles del pedido.
        const { error: errorDetalles } =
            await supabaseBrihanna
                .from("detalle_pedido")
                .delete()
                .eq("pedido_id", pedido.id);

        if (errorDetalles) throw errorDetalles;

        // Después eliminar el pedido principal.
        const { error: errorEliminar } =
            await supabaseBrihanna
                .from("pedidos")
                .delete()
                .eq("id", pedido.id);

        if (errorEliminar) throw errorEliminar;

        mostrarMensaje(
            "Pedido eliminado correctamente.",
            "exito"
        );

        await mostrarAdministradorPedidos();

    } catch (error) {
        console.error(
            "Error al eliminar el pedido:",
            error
        );

        mostrarMensaje(
            "No se pudo eliminar el pedido. Revisa los permisos de Supabase.",
            "error"
        );
    }
}

async function mostrarAdministradorClientes() {
    if (!esAdministrador()) {
        return;
    }

    try {
        const { data: usuarios, error: errorClientes } =
            await supabaseBrihanna
                .from("clientes")
                .select("id, nombre, correo, activo")
                .order("nombre", { ascending: true });

        if (errorClientes) throw errorClientes;

        const { data: pedidos, error: errorPedidos } =
            await supabaseBrihanna
                .from("pedidos")
                .select("cliente_id");

        if (errorPedidos) throw errorPedidos;

        const contenido = usuarios.length
            ? usuarios.map(usuario => {
                const pedidosCliente = pedidos.filter(
                    pedido =>
                        String(pedido.cliente_id) ===
                        String(usuario.id)
                );

                return `
                    <div class="admin-cliente-card">
                        <h3>
                            ${escapeHTML(usuario.nombre || "Sin nombre")}
                        </h3>

                        <p>
                            ${escapeHTML(usuario.correo)}
                        </p>

                        <p>
                            Pedidos:
                            <strong>
                                ${pedidosCliente.length}
                            </strong>
                        </p>
                    </div>
                `;
            }).join("")
            : `
                <div class="estado-vacio">
                    <h3>
                        No hay clientes registrados
                    </h3>
                </div>
            `;

        abrirVentana(`
            <div class="modal-encabezado">
                <div>
                    <h2>Clientes</h2>

                    <p>
                        Cuentas registradas en la página.
                    </p>
                </div>

                <button
                    class="btn-cerrar-modal"
                    type="button"
                >
                    ×
                </button>
            </div>

            <div class="admin-clientes-lista">
                ${contenido}
            </div>

            <div class="acciones-formulario">
                <button
                    id="clientes-volver-panel"
                    class="btn-sistema btn-secundario"
                    type="button"
                >
                    Volver al panel
                </button>
            </div>
        `, "modal-grande");

        asignarEvento(
            "clientes-volver-panel",
            mostrarPanelAdministrador
        );

    } catch (error) {
        console.error(
            "Error al cargar los clientes:",
            error
        );

        mostrarMensaje(
            "No se pudieron cargar los clientes desde Supabase.",
            "error"
        );
    }
}


async function renderizarConfiguracion() {
    const configuracion =
        await cargarConfiguracionSupabase();

    const direccion =
        configuracion.direccion ||
        "Dirección no configurada";

    const whatsapp =
        configuracion.whatsapp ||
        "WhatsApp no configurado";

    const horario =
        configuracion.horario ||
        "Horario no configurado";

    const idsDireccion = [
        "contacto-direccion",
        "contacto-direccion-pagina",
        "footer-direccion"
    ];

    const idsWhatsapp = [
        "contacto-whatsapp",
        "contacto-whatsapp-pagina",
        "footer-whatsapp"
    ];

    const idsHorario = [
        "contacto-horario",
        "contacto-horario-pagina",
        "footer-horario"
    ];

    idsDireccion.forEach(id => {
        const elemento =
            document.getElementById(id);

        if (elemento) {
            elemento.textContent = direccion;
        }
    });

    idsWhatsapp.forEach(id => {
        const elemento =
            document.getElementById(id);

        if (elemento) {
            elemento.textContent = whatsapp;
        }
    });

    idsHorario.forEach(id => {
        const elemento =
            document.getElementById(id);

        if (elemento) {
            elemento.textContent = horario;
        }
    });

    configurarWhatsApp();
}

function configurarWhatsApp() {
    const configuracion =
        obtenerConfiguracion();

    const numero =
        String(
            configuracion.whatsapp ||
            ""
        ).replace(
            /\D/g,
            ""
        );

    const botones = [
        document.getElementById(
            "btn-whatsapp"
        ),
        document.getElementById(
            "btn-whatsapp-pagina"
        )
    ].filter(Boolean);

    document
        .querySelectorAll(
            "[data-whatsapp]"
        )
        .forEach(boton => {
            if (
                !botones.includes(
                    boton
                )
            ) {
                botones.push(
                    boton
                );
            }
        });

    botones.forEach(boton => {
        boton.onclick =
            evento => {
                evento.preventDefault();

                abrirWhatsApp();
            };

        if (!numero) {
            boton.title =
                "WhatsApp aún no configurado";
        } else {
            boton.title =
                "Contactar por WhatsApp";
        }
    });
}

function abrirWhatsApp() {
    const configuracion =
        obtenerConfiguracion();

    const numero =
        String(
            configuracion.whatsapp ||
            ""
        ).replace(
            /\D/g,
            ""
        );

    if (!numero) {
        mostrarMensaje(
            "El número de WhatsApp todavía no fue configurado.",
            "aviso"
        );

        return;
    }

    const mensaje =
        encodeURIComponent(
            "Hola, quisiera consultar sobre los productos de Librería Brianna."
        );

    const enlace =
        `https://wa.me/${numero}?text=${mensaje}`;

    window.open(
        enlace,
        "_blank",
        "noopener,noreferrer"
    );
}


async function mostrarConfiguracionTienda() {
    if (!esAdministrador()) {
        mostrarLogin();
        return;
    }

    const configuracion =
        await cargarConfiguracionSupabase();

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>Datos de la tienda</h2>

                <p>
                    Modifica la información que ven los clientes.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <form
            id="form-configuracion-tienda"
            class="formulario-brianna"
        >
            <div
                id="configuracion-error"
                class="mensaje-error"
            ></div>

            <div class="form-grupo">
                <label for="config-direccion">
                    Dirección
                </label>

                <input
                    id="config-direccion"
                    type="text"
                    required
                    maxlength="150"
                    value="${escapeAtributo(configuracion.direccion || "")}"
                    placeholder="Dirección de la librería"
                >
            </div>

            <div class="form-grupo">
                <label for="config-whatsapp">
                    WhatsApp
                </label>

                <input
                    id="config-whatsapp"
                    type="text"
                    maxlength="20"
                    value="${escapeAtributo(configuracion.whatsapp || "")}"
                    placeholder="Ejemplo: 59170000000"
                >

                <small>
                    Escribe el código del país seguido del número.
                    Para Bolivia puedes comenzar con 591.
                </small>
            </div>

            <div class="form-grupo">
                <label for="config-horario">
                    Horario de atención
                </label>

                <input
                    id="config-horario"
                    type="text"
                    required
                    maxlength="150"
                    value="${escapeAtributo(configuracion.horario || "")}"
                    placeholder="Ejemplo: Lunes a sábado: 8:00 a 18:00"
                >
            </div>

            <div class="acciones-formulario">
                <button
                    id="config-tienda-cancelar"
                    class="btn-sistema btn-secundario"
                    type="button"
                >
                    Cancelar
                </button>

                <button
                    class="btn-sistema btn-verde"
                    type="submit"
                >
                    Guardar cambios
                </button>
            </div>
        </form>
    `);

    asignarEvento(
        "config-tienda-cancelar",
        mostrarPanelAdministrador
    );

    document
        .getElementById("form-configuracion-tienda")
        .addEventListener(
            "submit",
            guardarConfiguracionTienda
        );
}

async function guardarConfiguracionTienda(evento) {
    evento.preventDefault();

    if (!esAdministrador()) {
        return;
    }

    const direccion = document
        .getElementById("config-direccion")
        .value.trim();

    const whatsappOriginal = document
        .getElementById("config-whatsapp")
        .value.trim();

    const horario = document
        .getElementById("config-horario")
        .value.trim();

    if (!direccion || !horario) {
        mostrarError(
            "configuracion-error",
            "Completa la dirección y el horario."
        );
        return;
    }

    const whatsapp = whatsappOriginal.replace(/\D/g, "");

    if (
        whatsapp &&
        (whatsapp.length < 8 || whatsapp.length > 15)
    ) {
        mostrarError(
            "configuracion-error",
            "Ingresa un número de WhatsApp válido con código de país."
        );
        return;
    }

    try {
        const { data: configuracion, error: errorConsulta } =
            await supabaseBrihanna
                .from("configuracion")
                .select("id")
                .order("id", { ascending: true })
                .limit(1)
                .maybeSingle();

        if (errorConsulta) {
            throw errorConsulta;
        }

        if (!configuracion) {
            mostrarError(
                "configuracion-error",
                "No se encontró la configuración de la tienda."
            );
            return;
        }

        const { error } = await supabaseBrihanna
            .from("configuracion")
            .update({
                direccion,
                whatsapp,
                horario,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq("id", configuracion.id);

        if (error) {
            throw error;
        }

        guardarConfiguracion({
            direccion,
            whatsapp,
            horario
        });

        mostrarMensaje(
            "Datos de la tienda actualizados correctamente.",
            "exito"
        );

        mostrarPanelAdministrador();

    } catch (error) {
        console.error(
            "Error al guardar la configuración:",
            error
        );

        mostrarError(
            "configuracion-error",
            "No se pudieron guardar los datos en Supabase."
        );
    }
}

function mostrarConfiguracionAdmin() {
    if (!esAdministrador()) {
        mostrarLogin();
        return;
    }

    const admin =
        obtenerAdmin();

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>
                    Cuenta administrativa
                </h2>

                <p>
                    Modifica los datos
                    de acceso del administrador.
                </p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
            >
                ×
            </button>
        </div>

        <form
            id="form-config-admin"
            class="formulario-brianna"
        >
            <div
                id="admin-config-error"
                class="mensaje-error"
            ></div>

            <div class="form-grupo">
                <label
                    for="admin-config-nombre"
                >
                    Nombre
                </label>

                <input
                    id="admin-config-nombre"
                    type="text"
                    required
                    maxlength="80"
                    value="${escapeAtributo(
                        admin.nombre
                    )}"
                >
            </div>

            <div class="form-grupo">
                <label
                    for="admin-config-correo"
                >
                    Correo electrónico
                </label>

                <input
                    id="admin-config-correo"
                    type="email"
                    required
                    value="${escapeAtributo(
                        admin.correo
                    )}"
                >
            </div>

            <div class="form-grupo">
                <label
                    for="admin-config-actual"
                >
                    Contraseña actual
                </label>

                <input
                    id="admin-config-actual"
                    type="password"
                    required
                    autocomplete="current-password"
                >
            </div>

            <div class="form-grupo">
                <label
                    for="admin-config-nueva"
                >
                    Nueva contraseña
                </label>

                <input
                    id="admin-config-nueva"
                    type="password"
                    minlength="6"
                    autocomplete="new-password"
                    placeholder="Déjala vacía para conservar la actual"
                >
            </div>

            <div class="form-grupo">
                <label
                    for="admin-config-confirmar"
                >
                    Confirmar nueva contraseña
                </label>

                <input
                    id="admin-config-confirmar"
                    type="password"
                    minlength="6"
                    autocomplete="new-password"
                >
            </div>

            <div class="acciones-formulario">
                <button
                    id="admin-config-cancelar"
                    class="btn-sistema btn-secundario"
                    type="button"
                >
                    Cancelar
                </button>

                <button
                    class="btn-sistema btn-verde"
                    type="submit"
                >
                    Guardar cambios
                </button>
            </div>
        </form>
    `);

    asignarEvento(
        "admin-config-cancelar",
        mostrarPanelAdministrador
    );

    document
        .getElementById(
            "form-config-admin"
        )
        .addEventListener(
            "submit",
            guardarConfiguracionAdmin
        );
}


async function guardarConfiguracionAdmin(evento) {
    evento.preventDefault();

    if (!esAdministrador()) {
        return;
    }

    const nombre = document
        .getElementById("admin-config-nombre")
        .value.trim();

    const correo = document
        .getElementById("admin-config-correo")
        .value.trim()
        .toLowerCase();

    const actual = document
        .getElementById("admin-config-actual")
        .value;

    const nueva = document
        .getElementById("admin-config-nueva")
        .value;

    const confirmar = document
        .getElementById("admin-config-confirmar")
        .value;

    if (!nombre || !correo || !actual) {
        mostrarError(
            "admin-config-error",
            "Completa el nombre, el correo y la contraseña actual."
        );
        return;
    }

    if (nueva && nueva.length < 6) {
        mostrarError(
            "admin-config-error",
            "La nueva contraseña debe tener al menos 6 caracteres."
        );
        return;
    }

    if (nueva !== confirmar) {
        mostrarError(
            "admin-config-error",
            "Las nuevas contraseñas no coinciden."
        );
        return;
    }

    try {
        const { data: usuarioActual, error: errorUsuario } =
            await supabaseBrihanna.auth.getUser();

        if (errorUsuario) throw errorUsuario;

        const usuario = usuarioActual.user;

        if (!usuario) {
            throw new Error("No hay una sesión administrativa activa.");
        }

        // Comprobar que el correo no pertenezca a un cliente.
        const { data: cliente, error: errorCliente } =
            await supabaseBrihanna
                .from("clientes")
                .select("id")
                .ilike("correo", correo)
                .limit(1)
                .maybeSingle();

        if (errorCliente) throw errorCliente;

        if (cliente) {
            mostrarError(
                "admin-config-error",
                "Ese correo ya pertenece a un cliente."
            );
            return;
        }

        // Verificar la contraseña actual.
        const { error: errorVerificacion } =
            await supabaseBrihanna.auth.signInWithPassword({
                email: usuario.email,
                password: actual
            });

        if (errorVerificacion) {
            mostrarError(
                "admin-config-error",
                "La contraseña actual es incorrecta."
            );
            return;
        }

        // Actualizar los datos de autenticación.
        const cambios = {
            data: { nombre }
        };

        if (correo !== usuario.email) {
            cambios.email = correo;
        }

        if (nueva) {
            cambios.password = nueva;
        }

        const { data: actualizacion, error: errorActualizacion } =
            await supabaseBrihanna.auth.updateUser(cambios);

        if (errorActualizacion) throw errorActualizacion;

        // Actualizar el registro del administrador.
        const datosAdmin = { nombre };

        if (actualizacion.user.email === correo) {
            datosAdmin.correo = correo;
        }

        const { error: errorPerfil } =
            await supabaseBrihanna
                .from("administradores")
                .update(datosAdmin)
                .eq("usuario_id", usuario.id);

        if (errorPerfil) throw errorPerfil;

        guardarSesion({
            nombre,
            correo: actualizacion.user.email || usuario.email,
            rol: "administrador"
        });

        mostrarPanelAdministrador();

        mostrarMensaje(
            correo !== usuario.email &&
            actualizacion.user.email !== correo
                ? "Datos actualizados. Debes confirmar el cambio de correo desde tu email."
                : "Cuenta administrativa actualizada correctamente.",
            "exito"
        );

    } catch (error) {
        console.error(
            "Error al actualizar la cuenta administrativa:",
            error
        );

        mostrarError(
            "admin-config-error",
            "No se pudieron actualizar los datos. Revisa la consola."
        );
    }
}

function repararCarritos() {
    const carritos =
        obtenerCarritosTodos();

    const productos =
        obtenerProductos();

    let modificado = false;

    Object.keys(
        carritos
    ).forEach(correo => {
        if (
            !Array.isArray(
                carritos[correo]
            )
        ) {
            carritos[correo] = [];
            modificado = true;
            return;
        }

        const reparado = [];

        let total = 0;

        carritos[
            correo
        ].forEach(item => {
            const producto =
                productos.find(
                    producto =>
                        mismoId(
                            producto.id,
                            item.idProducto
                        )
                );

            if (
                !producto ||
                !estaDisponible(
                    producto
                )
            ) {
                modificado = true;
                return;
            }

            let cantidad =
                Math.max(
                    1,
                    Math.floor(
                        Number(
                            item.cantidad
                        ) || 1
                    )
                );

            cantidad =
                Math.min(
                    cantidad,
                    Number(
                        producto.stock
                    )
                );

            cantidad =
                Math.min(
                    cantidad,
                    LIMITE_CARRITO -
                    total
                );

            if (
                cantidad <= 0
            ) {
                modificado = true;
                return;
            }

            if (
                cantidad !==
                Number(
                    item.cantidad
                )
            ) {
                modificado = true;
            }

            reparado.push({
                idProducto:
                    producto.id,
                cantidad
            });

            total += cantidad;
        });

        if (
            reparado.length !==
            carritos[
                correo
            ].length
        ) {
            modificado = true;
        }

        carritos[
            correo
        ] = reparado;
    });

    if (modificado) {
        guardarCarritosTodos(
            carritos
        );
    }
}

function repararFavoritos() {
    const favoritos =
        obtenerFavoritosTodos();

    const productos =
        obtenerProductos();

    let modificado = false;

    Object.keys(
        favoritos
    ).forEach(correo => {
        if (
            !Array.isArray(
                favoritos[
                    correo
                ]
            )
        ) {
            favoritos[
                correo
            ] = [];

            modificado = true;
            return;
        }

        const nuevaLista = [];

        favoritos[
            correo
        ].forEach(id => {
            const producto =
                productos.find(
                    producto =>
                        mismoId(
                            producto.id,
                            id
                        )
                );

            if (!producto) {
                modificado = true;
                return;
            }

            const repetido =
                nuevaLista.some(
                    guardado =>
                        mismoId(
                            guardado,
                            producto.id
                        )
                );

            if (repetido) {
                modificado = true;
                return;
            }

            nuevaLista.push(
                producto.id
            );
        });

        favoritos[
            correo
        ] = nuevaLista;
    });

    if (modificado) {
        guardarFavoritosTodos(
            favoritos
        );
    }
}

function repararProductos() {
    const productos =
        obtenerProductos();

    let modificado = false;

    productos.forEach(
        producto => {
            if (!producto.id) {
                producto.id =
                    generarId();

                modificado = true;
            }

            producto.precio =
                Math.max(
                    0,
                    Number(
                        producto.precio
                    ) || 0
                );

            producto.stock =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            producto.stock
                        ) || 0
                    )
                );

            producto.descuento =
                Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            producto.descuento
                        ) || 0
                    )
                );

            if (
                producto.stock === 0
            ) {
                producto.disponible =
                    false;
            }

            if (
                typeof
                    producto.imagen !==
                "string"
            ) {
                producto.imagen = "";
                modificado = true;
            }
        }
    );

    if (modificado) {
        guardarStorage(
            STORAGE_PRODUCTOS,
            productos
        );
    }
}

function repararPedidos() {
    const pedidos =
        obtenerPedidos();

    let modificado = false;

    pedidos.forEach(
        pedido => {
            if (!pedido.id) {
                pedido.id =
                    generarId();

                modificado = true;
            }

            if (!pedido.numero) {
                pedido.numero =
                    generarNumeroPedido();

                modificado = true;
            }

            if (
                !pedido.estado
            ) {
                pedido.estado =
                    "Pendiente";

                modificado = true;
            }

            if (
                pedido.stockDevuelto ===
                undefined
            ) {
                pedido.stockDevuelto =
                    pedido.estado ===
                    "Cancelado";

                modificado = true;
            }

            if (
                !Array.isArray(
                    pedido.productos
                )
            ) {
                pedido.productos =
                    [];

                modificado = true;
            }
        }
    );

    if (modificado) {
        guardarPedidos(
            pedidos
        );
    }
}

function prepararSistemaFinal() {
    repararProductos();
    repararCarritos();
    repararFavoritos();
    repararPedidos();

    renderizarTodo();
    actualizarInterfazSesion();
    actualizarContadores();
}

prepararSistemaFinal();
document.addEventListener("click", function (evento) {
    const botonCuenta = evento.target.closest("#btn-cuenta");

    if (!botonCuenta) {
        return;
    }

    evento.preventDefault();
    evento.stopPropagation();

    manejarCuenta();
});




async function mostrarMetodosPago(detalles, total) {
    const sesion = obtenerSesion();

    if (!sesion || sesion.rol !== "cliente") {
        mostrarLogin();
        return;
    }

    abrirVentana(`
        <div class="modal-encabezado">
            <div>
                <h2>Métodos de pago</h2>
                <p>Revisa la información antes de registrar tu pedido.</p>
            </div>

            <button
                class="btn-cerrar-modal"
                type="button"
                aria-label="Cerrar"
            >
                ×
            </button>
        </div>

        <div class="pago-resumen">
            <span>Total de tu pedido</span>
            <strong>Bs ${Number(total).toFixed(2)}</strong>
        </div>

        <div class="pago-opciones">
            <button
                type="button"
                id="pago-metodo-qr"
                class="pago-tarjeta-opcion"
                aria-expanded="false"
            >
                <span class="pago-icono pago-icono-qr">▦</span>
                <span class="pago-textos">
                    <strong>QR ilustrativo</strong>
                    <small>Imagen de demostración</small>
                </span>
                <span class="pago-flecha">›</span>
            </button>

            <div id="pago-info-qr" class="pago-aviso" hidden>
                <div id="pago-imagen-qr"></div>
            </div>
        </div>

        <div class="pago-aviso">
            <strong>Agregue su comprobante aquí:</strong>
            <p>
                Selecciona la imagen de su comprobante de pago.
            </p>

            <input
                type="file"
                id="pago-comprobante"
                accept="image/png,image/jpeg,image/webp"
            >

            <div id="pago-vista-comprobante"></div>
        </div>

        <div class="pago-pie">
            <button
                id="pago-volver-confirmacion"
                class="pago-volver"
                type="button"
            >
                Volver al pedido
            </button>

            <button
                id="pago-confirmar-pedido"
                class="btn-sistema btn-azul"
                type="button"
            >
                Registrar pedido
            </button>
        </div>
    `, "modal-medios-pago");

    const botonQR = document.getElementById("pago-metodo-qr");
    const infoQR = document.getElementById("pago-info-qr");
    const contenedorQR = document.getElementById("pago-imagen-qr");

    const inputComprobante =
        document.getElementById("pago-comprobante");

    const vistaComprobante =
        document.getElementById("pago-vista-comprobante");

    const botonConfirmar =
        document.getElementById("pago-confirmar-pedido");

    const volver =
        document.getElementById("pago-volver-confirmacion");

    let imagenSeleccionada = null;
    let urlVistaPrevia = null;

    if (botonQR && infoQR && contenedorQR) {
        botonQR.addEventListener("click", async () => {
            infoQR.hidden = !infoQR.hidden;

            botonQR.setAttribute(
                "aria-expanded",
                String(!infoQR.hidden)
            );

            if (!infoQR.hidden && !contenedorQR.dataset.cargado) {
                contenedorQR.dataset.cargado = "true";
                contenedorQR.textContent = "Cargando imagen...";

                try {
                    const { data, error } = await supabaseBrihanna
                        .from("configuracion")
                        .select("qr_url")
                        .order("id", { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    if (error) throw error;

                    contenedorQR.textContent = "";

                    if (data?.qr_url) {
                        const imagen = document.createElement("img");

                        imagen.src = data.qr_url;
                        imagen.alt = "QR ilustrativo";
                        imagen.style.width = "100%";
                        imagen.style.maxWidth = "280px";
                        imagen.style.height = "auto";
                        imagen.style.display = "block";
                        imagen.style.margin = "15px auto";
                        imagen.style.objectFit = "contain";

                        contenedorQR.appendChild(imagen);
                    } else {
                        contenedorQR.textContent =
                            "El administrador todavía no ha agregado una imagen.";
                    }

                } catch (error) {
                    console.error("Error al cargar la imagen QR:", error);

                    contenedorQR.textContent =
                        "No se pudo cargar la imagen.";

                    delete contenedorQR.dataset.cargado;
                }
            }
        });
    }

    if (inputComprobante && vistaComprobante) {
        inputComprobante.addEventListener("change", () => {
            const archivo = inputComprobante.files[0];

            imagenSeleccionada = null;

            if (urlVistaPrevia) {
                URL.revokeObjectURL(urlVistaPrevia);
                urlVistaPrevia = null;
            }

            vistaComprobante.textContent = "";

            if (!archivo) return;

            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!tiposPermitidos.includes(archivo.type)) {
                mostrarMensaje(
                    "Selecciona una imagen JPG, PNG o WEBP.",
                    "error"
                );

                inputComprobante.value = "";
                return;
            }

            if (archivo.size > 3 * 1024 * 1024) {
                mostrarMensaje(
                    "La imagen no debe superar los 3 MB.",
                    "error"
                );

                inputComprobante.value = "";
                return;
            }

            imagenSeleccionada = archivo;
            urlVistaPrevia = URL.createObjectURL(archivo);

            const imagen = document.createElement("img");

            imagen.src = urlVistaPrevia;
            imagen.alt = "Vista previa de imagen de demostración";
            imagen.style.width = "100%";
            imagen.style.maxWidth = "260px";
            imagen.style.height = "auto";
            imagen.style.display = "block";
            imagen.style.margin = "15px auto";
            imagen.style.borderRadius = "10px";

            vistaComprobante.appendChild(imagen);
        });
    }

    if (volver) {
        volver.addEventListener("click", () => {
            cerrarVentana();
            confirmarPedido();
        });
    }

    if (botonConfirmar) {
        botonConfirmar.addEventListener("click", async () => {
            if (!imagenSeleccionada) {
                mostrarMensaje(
                    "Selecciona una imagen de demostración.",
                    "error"
                );
                return;
            }

            botonConfirmar.disabled = true;
            botonConfirmar.textContent = "Registrando pedido...";

            try {
                await crearPedido(
                    detalles,
                    total,
                    imagenSeleccionada
                );
            } finally {
                botonConfirmar.disabled = false;
                botonConfirmar.textContent = "Registrar pedido";
            }
        });
    }
}

function agregarAccesoConfiguracionQR() {
    const botonTienda = document.getElementById("admin-tienda");

    if (!botonTienda || document.getElementById("admin-qr")) {
        return;
    }

    const botonQR = document.createElement("button");
    botonQR.id = "admin-qr";
    botonQR.className = "btn-sistema btn-secundario";
    botonQR.type = "button";
    botonQR.textContent = "Configurar método de pago";

    botonTienda.insertAdjacentElement("afterend", botonQR);

    botonQR.addEventListener("click", configurarMetodoPagoQR);
}

async function configurarMetodoPagoQR() {
    try {
        const { data: { user }, error: errorUsuario } =
            await supabaseBrihanna.auth.getUser();

        if (errorUsuario || !user) {
            alert("Debes iniciar sesión como administrador.");
            return;
        }

        const { data: administrador, error: errorAdmin } =
            await supabaseBrihanna
                .from("administradores")
                .select("usuario_id")
                .eq("usuario_id", user.id)
                .maybeSingle();

        if (errorAdmin || !administrador) {
            alert("No tienes permisos para cambiar el método de pago.");
            return;
        }

        const selector = document.createElement("input");
        selector.type = "file";
        selector.accept = "image/png,image/jpeg,image/webp";

        selector.addEventListener("change", async () => {
            const archivo = selector.files[0];

            if (!archivo) return;

            if (!["image/png", "image/jpeg", "image/webp"].includes(archivo.type)) {
                alert("Selecciona una imagen PNG, JPG o WEBP.");
                return;
            }

            if (archivo.size > 2 * 1024 * 1024) {
                alert("La imagen no debe superar los 2 MB.");
                return;
            }

            const extension = archivo.name.split(".").pop().toLowerCase();
            const ruta = `qr/metodo-pago-${Date.now()}.${extension}`;

            const { error: errorSubida } = await supabaseBrihanna
                .storage
                .from("metodos-pago")
                .upload(ruta, archivo, {
                    contentType: archivo.type,
                    upsert: false
                });

            if (errorSubida) {
                console.error(errorSubida);
                alert("No se pudo subir la imagen. Revisa los permisos del almacenamiento.");
                return;
            }

            const { data: imagenPublica } = supabaseBrihanna
                .storage
                .from("metodos-pago")
                .getPublicUrl(ruta);

            const { data: configuracion, error: errorConfig } =
                await supabaseBrihanna
                    .from("configuracion")
                    .select("id")
                    .order("id", { ascending: true })
                    .limit(1)
                    .maybeSingle();

            if (errorConfig || !configuracion) {
                alert("No se encontró el registro de configuración de la tienda.");
                return;
            }

            const { error: errorGuardar } = await supabaseBrihanna
                .from("configuracion")
                .update({
                    qr_url: imagenPublica.publicUrl,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq("id", configuracion.id);

            if (errorGuardar) {
                console.error(errorGuardar);
                alert("La imagen se subió, pero no se pudo guardar su dirección en la base de datos.");
                return;
            }

            alert("La imagen del método de pago se actualizó correctamente.");
        });

        selector.click();

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al configurar el método de pago.");
    }
}

async function eliminarPedidoFinalizado(id) {
    if (!esAdministrador()) {
        return;
    }

    try {
        const confirmar = confirm(
            "¿Deseas eliminar este pedido cancelado y todos sus detalles?"
        );

        if (!confirmar) return;

        // Comprobar que el pedido existe y está cancelado.
        const { data: pedido, error: errorPedido } =
            await supabaseBrihanna
                .from("pedidos")
                .select("id, estado, stock_devuelto")
                .eq("id", id)
                .maybeSingle();

        if (errorPedido) throw errorPedido;

        if (!pedido) {
            throw new Error("No se encontró el pedido.");
        }

        if (pedido.estado !== "Cancelado") {
            mostrarMensaje(
                "Solo puedes eliminar pedidos cancelados.",
                "error"
            );
            return;
        }

        if (!pedido.stock_devuelto) {
            mostrarMensaje(
                "No se puede eliminar: el stock todavía no ha sido devuelto.",
                "error"
            );
            return;
        }

        // Eliminar los detalles del pedido.
        const { error: errorDetalles } =
            await supabaseBrihanna
                .from("detalle_pedido")
                .delete()
                .eq("pedido_id", id);

        if (errorDetalles) throw errorDetalles;

        // Eliminar únicamente el pedido seleccionado.
        const { data: eliminado, error: errorEliminar } =
            await supabaseBrihanna
                .from("pedidos")
                .delete()
                .eq("id", id)
                .eq("estado", "Cancelado")
                .select("id");

        if (errorEliminar) throw errorEliminar;

        if (!eliminado || eliminado.length === 0) {
            throw new Error("No se pudo eliminar el pedido.");
        }

        mostrarMensaje(
            "Pedido cancelado eliminado correctamente.",
            "exito"
        );

        await mostrarAdministradorPedidos();

    } catch (error) {
        console.error("Error al eliminar pedido:", error);

        mostrarMensaje(
            error.message || "No se pudo eliminar el pedido.",
            "error"
        );
    }
}
