class Actividad {
    constructor(contenedor) {
        this.el = contenedor;
        this.mensaje = null;
        // La plantilla avisa si el estudiante ya respondió la pregunta de esta lección.
        this.yaRespondida = contenedor.dataset.respondida === "true";
        this.avisoEnviado = false;
    }

    iniciar() {
        this.el.innerHTML = "";
        this.mensaje = document.createElement("p");
        this.mensaje.className = "mensaje-actividad";
        this.mensaje.setAttribute("role", "status");
        this.mensaje.setAttribute("aria-live", "polite");
        this.render();
        this.el.appendChild(this.mensaje);
        this.decir(this.instruccion());
    }

    // Cada actividad hija debe implementar estos dos métodos.
    render() {
        throw new Error("La actividad debe implementar render()");
    }

    instruccion() {
        throw new Error("La actividad debe implementar instruccion()");
    }

    // Retroalimentación común a todas: mismo lugar, mismo estilo.
    decir(texto, tipo = "neutro") {
        this.mensaje.textContent = texto;
        this.mensaje.className = "mensaje-actividad " + tipo;

        // Todas las actividades cierran con "¡Terminaste la actividad!".
        // Cuando aparece ese texto se avisa a la página para que muestre la pregunta.
        if (!this.avisoEnviado && texto.includes("Terminaste la actividad")) {
            this.avisoEnviado = true;
            this.el.dispatchEvent(new CustomEvent("actividad-terminada", { bubbles: true }));
        }
    }

    acierto(texto) {
        this.decir(texto, "correcto");
    }

    error(texto) {
        this.decir(texto, "incorrecto");
    }

    // Texto de cierre único para todos los juegos.
    cierre() {
        return this.yaRespondida
            ? "¡Terminaste la actividad!"
            : "¡Terminaste la actividad! Ahora responde la pregunta de abajo.";
    }

    terminar() {
        this.acierto(this.cierre());
    }
}