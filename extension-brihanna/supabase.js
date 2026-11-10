
"use strict";

const SUPABASE_URL =
    "https://mlzmqppmsgguplzcldly.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_E4QHAhzwTTbVq83Ip3EOFQ_iq-STFSA";

async function buscarProductosBrihanna(texto) {
    const busqueda = texto.trim();

    if (!busqueda) {
        return [];
    }

    const url = new URL(
        `${SUPABASE_URL}/rest/v1/productos`
    );

    url.searchParams.set(
        "select",
        "id,nombre,precio,stock,disponible"
    );

    url.searchParams.set(
        "nombre",
        `ilike.*${busqueda}*`
    );

    url.searchParams.set("limit", "10");

    const respuesta = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!respuesta.ok) {
        throw new Error(
            `Error de Supabase: ${respuesta.status}`
        );
    }

    return await respuesta.json();
}