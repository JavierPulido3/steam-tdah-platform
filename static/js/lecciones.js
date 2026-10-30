// Cada área STEAM usa su propia clase de actividad.
const ACTIVIDADES = {
    "Ciencia": ActividadClasificacion,
    "Arte": ActividadPrediccion,
    "Matemáticas": ActividadPatron,
};

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("actividad");
    if (!contenedor) return;

    const Clase = ACTIVIDADES[contenedor.dataset.area];
    if (!Clase) return;

    contenedor.closest(".tarjeta").hidden = false;
    new Clase(contenedor).iniciar();
});