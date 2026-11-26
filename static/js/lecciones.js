// Cada área STEAM usa su propia clase de actividad.
const ACTIVIDADES = {
    "Ciencia": ActividadClasificacion,
    "Tecnología": ActividadOrdenamiento,
    "Ingeniería": ActividadConstruccion,
    "Arte": ActividadPrediccion,
    "Matemáticas": ActividadPatron,
};

// Si después de este tiempo la actividad no se ha terminado, se muestra la pregunta
// de todas formas para que el estudiante no se quede bloqueado.
const ESPERA_MAXIMA_MS = 3 * 60 * 1000;

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function llevarA(elemento) {
    elemento.scrollIntoView({ behavior: reducirMovimiento ? "auto" : "smooth", block: "center" });
}

// Ajuste de la prueba de usabilidad: los botones "Siguiente ronda" y "Siguiente nivel"
// se destacan y la pantalla se mueve hasta ellos para que no pasen desapercibidos.
function destacarBotonesSiguiente(contenedor) {
    const revisar = (nodo) => {
        if (nodo.nodeType !== 1) return;
        const botones = nodo.matches("button") ? [nodo] : nodo.querySelectorAll("button");
        botones.forEach((boton) => {
            if (/^Siguiente/.test(boton.textContent.trim())) {
                boton.classList.add("boton-siguiente");
                llevarA(boton);
                boton.focus({ preventScroll: true });
            }
        });
    };
    new MutationObserver((cambios) => {
        cambios.forEach((cambio) => cambio.addedNodes.forEach(revisar));
    }).observe(contenedor, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("actividad");
    if (!contenedor) return;

    const Clase = ACTIVIDADES[contenedor.dataset.area];
    if (!Clase) return;

    const tarjetaActividad = contenedor.closest(".tarjeta");
    const tarjetaPregunta = document.getElementById("tarjeta-pregunta");
    const botonEmpezar = document.getElementById("empezar-actividad");

    destacarBotonesSiguiente(contenedor);

    // Ajuste de la prueba de usabilidad: la pregunta aparece cuando se termina la actividad.
    let esperaPregunta = null;
    const mostrarPregunta = () => {
        if (!tarjetaPregunta || !tarjetaPregunta.hidden) return;
        clearTimeout(esperaPregunta);
        tarjetaPregunta.hidden = false;
        llevarA(tarjetaPregunta);
    };
    if (tarjetaPregunta) {
        tarjetaPregunta.hidden = true;
        contenedor.addEventListener("actividad-terminada", () => {
            // Pequeña pausa para que el estudiante alcance a leer el mensaje de cierre.
            setTimeout(mostrarPregunta, reducirMovimiento ? 0 : 1200);
        });
    }

    const arrancar = () => {
        tarjetaActividad.hidden = false;
        new Clase(contenedor).iniciar();
        if (tarjetaPregunta) {
            esperaPregunta = setTimeout(mostrarPregunta, ESPERA_MAXIMA_MS);
        }
    };

    // Ajuste de la prueba de usabilidad: primero se lee el contenido y luego se juega.
    if (botonEmpezar) {
        botonEmpezar.hidden = false;
        botonEmpezar.addEventListener("click", () => {
            botonEmpezar.hidden = true;
            arrancar();
            llevarA(tarjetaActividad);
        });
    } else {
        arrancar();
    }
});