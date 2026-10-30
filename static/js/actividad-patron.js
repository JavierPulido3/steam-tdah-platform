class ActividadPatron extends Actividad {
    constructor(contenedor) {
        super(contenedor);
        this.rondas = [
            {
                secuencia: ["🔴", "🔵", "🔴", "🔵", "🔴"],
                opciones: ["🟡", "🔵", "🔴"],
                correcta: "🔵",
                regla: "Se repite rojo, azul, rojo, azul.",
            },
            {
                secuencia: ["3", "6", "9", "12"],
                opciones: ["15", "14", "18"],
                correcta: "15",
                regla: "Vamos sumando 3 cada vez.",
            },
            {
                secuencia: ["🔺", "🔺", "⬛", "🔺", "🔺"],
                opciones: ["⭐", "🔺", "⬛"],
                correcta: "⬛",
                regla: "Se repiten dos triángulos y un cuadrado.",
            },
        ];
        this.indice = 0;
    }

    instruccion() {
        return "Mira la secuencia y toca lo que sigue.";
    }

    render() {
        this.zona = document.createElement("div");
        this.el.appendChild(this.zona);
        this.mostrarRonda();
    }

    mostrarRonda() {
        const ronda = this.rondas[this.indice];
        this.zona.innerHTML = "";

        const titulo = document.createElement("p");
        titulo.className = "ronda";
        titulo.textContent = "Ronda " + (this.indice + 1) + " de " + this.rondas.length;
        this.zona.appendChild(titulo);

        const secuencia = document.createElement("div");
        secuencia.className = "secuencia";
        ronda.secuencia.forEach((valor) => {
            const item = document.createElement("span");
            item.className = "item-secuencia";
            item.textContent = valor;
            secuencia.appendChild(item);
        });
        const incognita = document.createElement("span");
        incognita.className = "item-secuencia pregunta";
        incognita.textContent = "?";
        secuencia.appendChild(incognita);
        this.zona.appendChild(secuencia);

        const opciones = document.createElement("div");
        opciones.className = "fila-objetos";
        ronda.opciones.forEach((valor) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "objeto";
            boton.textContent = valor;
            boton.addEventListener("click", () => this.elegir(valor, boton, opciones));
            opciones.appendChild(boton);
        });
        this.zona.appendChild(opciones);
    }

    elegir(valor, boton, opciones) {
        const ronda = this.rondas[this.indice];

        if (valor !== ronda.correcta) {
            boton.disabled = true;
            this.error("Esa no sigue el patrón. Prueba con otra.");
            return;
        }

        opciones.querySelectorAll("button").forEach((b) => (b.disabled = true));
        this.acierto("¡Bien! " + ronda.regla);

        if (this.indice === this.rondas.length - 1) {
            this.terminar();
            return;
        }

        const siguiente = document.createElement("button");
        siguiente.type = "button";
        siguiente.className = "boton";
        siguiente.textContent = "Siguiente ronda";
        siguiente.addEventListener("click", () => {
            this.indice += 1;
            this.mostrarRonda();
            this.decir(this.instruccion());
        });
        this.zona.appendChild(siguiente);
    }
}