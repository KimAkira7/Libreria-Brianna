
"use strict";

const SUPABASE_URL =
    "https://mlzmqppmsgguplzcldly.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_E4QHAhzwTTbVq83Ip3EOFQ_iq-STFSA";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Librería Brianna está instalada.");
});

chrome.runtime.onMessage.addListener(
    (mensaje, remitente, responder) => {
        if (mensaje.tipo !== "BUSCAR_PRODUCTOS_BRIANNA") {
            return;
        }

        buscarEnCatalogo(mensaje.texto)
            .then((productos) => {
                responder({
                    correcto: true,
                    productos
                });
            })
            .catch((error) => {
                console.error(
                    "Error al consultar el catálogo:",
                    error
                );

                responder({
                    correcto: false,
                    productos: []
                });
            });

        return true;
    }
);

async function buscarEnCatalogo(texto) {
    const busqueda = String(texto || "").trim();

    if (!busqueda) {
        return [];
    }

    const url = new URL(
        `${SUPABASE_URL}/rest/v1/productos`
    );

    url.searchParams.set(
        "select",
        "id,nombre,precio,stock,disponible,imagen"
    );

    url.searchParams.set(
        "nombre",
        `ilike.*${busqueda}*`
    );

    url.searchParams.set("limit", "5");

    const respuesta = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!respuesta.ok) {
        throw new Error(
            `Supabase respondió con el código ${respuesta.status}`
        );
    }

    return await respuesta.json();
}