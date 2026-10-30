class ActividadPrediccion extends Actividad {
    constructor(contenedor) {
        super(contenedor);
        this.colores = {
            "Rojo": "#d64545",
            "Azul": "#3b6fd4",
            "Amarillo": "#f2c230",
            "Naranja": "#f28c28",
            "Verde": "#3a9d5d",
            "Morado": "#8e5bb5",
        };
        this.rondas = [
            { a: "Rojo", b: "Azul", resultado: "Morado", opciones: ["Verde", "Naranja", "Morado"] },
            { a: "Rojo", b: "Amarillo", resultado: "Naranja", opciones: ["Naranja", "Verde", "Morado"] },
            { a: "Azul", b: "Amarillo", resultado: "Verde", opciones: ["Naranja", "Verde", "Morado"] },
        ];
        this.indice = 0;
    }

    instruccion() {
        return "Mira los dos colores y toca el color que crees que sale al mezclarlos.";
    }

    render() {
        this.zona = document.createElement("div");
        this.el.appendChild(this.zona);
        this.mostrarRonda();
    }

    crearMuestra(nombre) {
        const caja = document.createElement("div");
        caja.className = "muestra";
        const color = document.createElement("span");
        color.className = "color";
        color.style.background = this.colores[nombre];
        const etiqueta = document.createElement("span");
        etiqueta.textContent = nombre;
        caja.append(color, etiqueta);
        return caja;
    }

    crearSigno(texto) {
        const signo = document.createElement("span");
        signo.className = "signo";
        signo.textContent = texto;
        return signo;
    }

    mostrarRonda() {
        const ronda = this.rondas[this.indice];
        this.zona.innerHTML = "";

        const titulo = document.createElement("p");
        titulo.className = "ronda";
        titulo.textContent = "Ronda " + (this.indice + 1) + " de " + this.rondas.length;
        this.zona.appendChild(titulo);

        const mezcla = document.createElement("div");
        mezcla.className = "mezcla";

        // El resultado queda oculto con un "?" hasta que el niño elija.
        const incognita = document.createElement("div");
        incognita.className = "muestra";
        this.colorResultado = document.createElement("span");
        this.colorResultado.className = "color";
        this.colorResultado.textContent = "?";
        this.etiquetaResultado = document.createElement("span");
        this.etiquetaResultado.textContent = "¿Qué sale?";
        incognita.append(this.colorResultado, this.etiquetaResultado);

        mezcla.append(
            this.crearMuestra(ronda.a),
            this.crearSigno("+"),
            this.crearMuestra(ronda.b),
            this.crearSigno("="),
            incognita
        );
        this.zona.appendChild(mezcla);

        const opciones = document.createElement("div");
        opciones.className = "fila-objetos";
        ronda.opciones.forEach((nombre) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "objeto opcion-color";

            const mini = document.createElement("span");
            mini.className = "color-mini";
            mini.style.background = this.colores[nombre];
            const texto = document.createElement("span");
            texto.textContent = nombre;
            boton.append(mini, texto);

            boton.addEventListener("click", () => this.elegir(nombre, boton, opciones));
            opciones.appendChild(boton);
        });
        this.zona.appendChild(opciones);
    }

    elegir(nombre, boton, opciones) {
        const ronda = this.rondas[this.indice];
        const botones = opciones.querySelectorAll("button");
        botones.forEach((b) => (b.disabled = true));

        // Revelación: siempre se muestra la mezcla real para poder comparar.
        this.colorResultado.textContent = "";
        this.colorResultado.style.background = this.colores[ronda.resultado];
        this.etiquetaResultado.textContent = ronda.resultado;

        const mezcla = ronda.a.toLowerCase() + " más " + ronda.b.toLowerCase()
            + " da " + ronda.resultado.toLowerCase() + ".";
        const ultima = this.indice === this.rondas.length - 1;
        const cierre = ultima ? " ¡Terminaste la actividad! Ahora responde la pregunta de abajo." : "";

        if (nombre === ronda.resultado) {
            this.decir("¡Bien! " + mezcla.charAt(0).toUpperCase() + mezcla.slice(1) + cierre, "correcto");
        } else {
            this.decir("No fue ese, pero ahora lo ves: " + mezcla + cierre, "incorrecto");
        }

        if (ultima) return;

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