class Actividad {
    constructor(contenedor) {
        this.el = contenedor;
        this.mensaje = null;
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
    }

    acierto(texto) {
        this.decir(texto, "correcto");
    }

    error(texto) {
        this.decir(texto, "incorrecto");
    }

    terminar() {
        this.acierto("¡Terminaste la actividad! Ahora responde la pregunta de abajo.");
    }
}