class ActividadOrdenamiento extends Actividad {
    constructor(contenedor) {
        super(contenedor);
        this.celda = 68; // 64 px de la celda + 4 px de separación
        this.direcciones = [
            { dx: 1, dy: 0, flecha: "→" },
            { dx: 0, dy: 1, flecha: "↓" },
            { dx: -1, dy: 0, flecha: "←" },
            { dx: 0, dy: -1, flecha: "↑" },
        ];
        this.bloques = [
            { accion: "avanzar", texto: "🐾 Avanzar" },
            { accion: "derecha", texto: "↪️ Girar a la derecha" },
            { accion: "izquierda", texto: "↩️ Girar a la izquierda" },
        ];
        // dir: 0 derecha, 1 abajo, 2 izquierda, 3 arriba
        this.niveles = [
            {
                filas: 5,
                columnas: 5,
                inicio: { x: 0, y: 0, dir: 0 },
                meta: { x: 2, y: 2 },
                rocas: [],
                maximo: 7,
                guia: "Robi empieza arriba a la izquierda, mirando hacia la derecha. El hueso 🦴 es la meta.",
            },
            {
                filas: 5,
                columnas: 5,
                inicio: { x: 0, y: 0, dir: 0 },
                meta: { x: 4, y: 2 },
                rocas: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 3, y: 1 }],
                maximo: 10,
                guia: "Ahora hay rocas 🪨 que bloquean el paso. Busca otro camino hasta el hueso 🦴.",
            },
            {
                filas: 5,
                columnas: 5,
                inicio: { x: 0, y: 0, dir: 0 },
                meta: { x: 4, y: 4 },
                rocas: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
                maximo: 12,
                guia: "Hay un muro de rocas 🪨. Robi tiene que rodearlo para llegar al hueso 🦴.",
            },
        ];
        this.nivel = 0;
        this.corrida = 0;
        this.corriendo = false;
        this.terminado = false;
        this.reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    instruccion() {
        return "Toca los bloques para armar el camino de Robi hasta el hueso. Luego toca Ejecutar.";
    }

    dormir(ms) {
        return new Promise((resolver) => setTimeout(resolver, ms));
    }

    pausa(ms) {
        return this.reducirMovimiento ? 150 : ms;
    }

    render() {
        this.zona = document.createElement("div");
        this.el.appendChild(this.zona);
        this.cargarNivel();
    }

    cargarNivel() {
        const n = this.niveles[this.nivel];
        this.actual = n;
        this.programa = [];
        this.corriendo = false;
        this.terminado = false;
        this.corrida += 1;
        this.zona.innerHTML = "";

        const titulo = document.createElement("p");
        titulo.className = "ronda";
        titulo.textContent = "Nivel " + (this.nivel + 1) + " de " + this.niveles.length;
        this.zona.appendChild(titulo);

        const guia = document.createElement("p");
        guia.textContent = n.guia;
        this.zona.appendChild(guia);

        // Tablero
        this.tablero = document.createElement("div");
        this.tablero.className = "tablero";
        this.tablero.style.gridTemplateColumns = "repeat(" + n.columnas + ", 64px)";
        this.celdas = [];
        for (let y = 0; y < n.filas; y++) {
            this.celdas[y] = [];
            for (let x = 0; x < n.columnas; x++) {
                const celda = document.createElement("div");
                celda.className = "celda";
                if (n.rocas.some((r) => r.x === x && r.y === y)) {
                    celda.classList.add("roca");
                    celda.textContent = "🪨";
                }
                if (x === n.meta.x && y === n.meta.y) {
                    celda.classList.add("meta");
                    celda.textContent = "🦴";
                }
                this.celdas[y][x] = celda;
                this.tablero.appendChild(celda);
            }
        }

        this.perro = document.createElement("span");
        this.perro.className = "perro";
        this.cuerpo = document.createElement("span");
        this.cuerpo.className = "cuerpo";
        const emoji = document.createElement("span");
        emoji.className = "emoji";
        emoji.textContent = "🐕";
        this.cuerpo.appendChild(emoji);
        this.flecha = document.createElement("span");
        this.flecha.className = "flecha";
        this.perro.append(this.cuerpo, this.flecha);
        this.tablero.appendChild(this.perro);
        this.zona.appendChild(this.tablero);
        this.colocarPerro(n.inicio.x, n.inicio.y, n.inicio.dir);

        // Bloques disponibles
        const t1 = document.createElement("p");
        t1.className = "ronda";
        t1.textContent = "Bloques (puedes usar cada uno las veces que quieras)";
        this.zona.appendChild(t1);

        this.zonaBanco = document.createElement("div");
        this.zonaBanco.className = "zona-bloques";
        this.botonesBanco = this.bloques.map((bloque) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "objeto";
            boton.textContent = bloque.texto;
            boton.addEventListener("click", () => this.agregar(bloque));
            this.zonaBanco.appendChild(boton);
            return boton;
        });
        this.zona.appendChild(this.zonaBanco);

        // Programa
        this.contador = document.createElement("p");
        this.contador.className = "ronda";
        this.zona.appendChild(this.contador);

        this.zonaPrograma = document.createElement("div");
        this.zonaPrograma.className = "zona-bloques";
        this.zona.appendChild(this.zonaPrograma);

        // Botones de acción
        this.acciones = document.createElement("div");
        this.acciones.className = "acciones";

        this.botonEjecutar = document.createElement("button");
        this.botonEjecutar.type = "button";
        this.botonEjecutar.className = "boton";
        this.botonEjecutar.textContent = "▶ Ejecutar";
        this.botonEjecutar.addEventListener("click", () => this.ejecutar());

        this.botonBorrar = document.createElement("button");
        this.botonBorrar.type = "button";
        this.botonBorrar.className = "objeto";
        this.botonBorrar.textContent = "Borrar todo";
        this.botonBorrar.addEventListener("click", () => this.borrarTodo());

        this.acciones.append(this.botonEjecutar, this.botonBorrar);
        this.zona.appendChild(this.acciones);

        this.pintarPrograma(-1);
    }

    colocarPerro(x, y, dir) {
        this.perro.style.transform =
            "translate(" + x * this.celda + "px, " + y * this.celda + "px)";
        this.flecha.textContent = this.direcciones[dir].flecha;
        // El emoji mira a la izquierda: se voltea al ir hacia la derecha.
        if (dir === 0) this.cuerpo.classList.add("derecha");
        if (dir === 2) this.cuerpo.classList.remove("derecha");
    }

    limpiarTablero() {
        this.celdas.forEach((fila) => fila.forEach((c) => c.classList.remove("rastro")));
        const i = this.actual.inicio;
        this.colocarPerro(i.x, i.y, i.dir);
    }

    bloquearEdicion(si) {
        this.corriendo = si;
        this.botonesBanco.forEach((b) => (b.disabled = si));
        this.botonEjecutar.disabled = si;
        this.botonBorrar.disabled = si;
    }

    pintarPrograma(activo) {
        this.contador.textContent =
            "Tu programa: " + this.programa.length + " de " + this.actual.maximo +
            " bloques (toca un bloque para quitarlo)";
        this.zonaPrograma.innerHTML = "";

        if (this.programa.length === 0) {
            const vacio = document.createElement("p");
            vacio.className = "vacio";
            vacio.textContent = "Todavía no hay bloques.";
            this.zonaPrograma.appendChild(vacio);
            return;
        }

        this.programa.forEach((bloque, i) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "objeto elegido";
            if (i === activo) boton.classList.add("bloque-activo");
            boton.textContent = i + 1 + ". " + bloque.texto;
            boton.disabled = this.corriendo || this.terminado;
            boton.addEventListener("click", () => this.quitar(i));
            this.zonaPrograma.appendChild(boton);
        });
    }

    agregar(bloque) {
        if (this.corriendo || this.terminado) return;
        if (this.programa.length >= this.actual.maximo) {
            this.decir("Tu programa ya tiene el máximo de bloques. Quita alguno para cambiarlo.");
            return;
        }
        this.programa.push(bloque);
        this.pintarPrograma(-1);
        this.decir("Pusiste: " + bloque.texto + ".");
    }

    quitar(indice) {
        if (this.corriendo || this.terminado) return;
        const [quitado] = this.programa.splice(indice, 1);
        this.pintarPrograma(-1);
        this.decir("Quitaste: " + quitado.texto + ".");
    }

    borrarTodo() {
        if (this.corriendo || this.terminado) return;
        this.programa = [];
        this.limpiarTablero();
        this.pintarPrograma(-1);
        this.decir(this.instruccion());
    }

    sacudir() {
        const emoji = this.perro.querySelector(".emoji");
        emoji.classList.remove("choque");
        void emoji.offsetWidth; // reinicia la animación
        emoji.classList.add("choque");
    }

    async ejecutar() {
        if (this.corriendo || this.terminado) return;
        if (this.programa.length === 0) {
            this.decir("Agrega bloques a tu programa antes de ejecutar.");
            return;
        }

        const turno = ++this.corrida;
        this.bloquearEdicion(true);
        this.limpiarTablero();
        this.pintarPrograma(-1);
        this.decir("Robi está caminando...");
        await this.dormir(this.pausa(500));
        if (turno !== this.corrida) return;

        const n = this.actual;
        let { x, y, dir } = n.inicio;
        let choque = "";
        this.celdas[y][x].classList.add("rastro");

        for (let i = 0; i < this.programa.length; i++) {
            this.pintarPrograma(i);
            const accion = this.programa[i].accion;

            if (accion === "derecha") {
                dir = (dir + 1) % 4;
            } else if (accion === "izquierda") {
                dir = (dir + 3) % 4;
            } else {
                const nx = x + this.direcciones[dir].dx;
                const ny = y + this.direcciones[dir].dy;
                const fuera = nx < 0 || ny < 0 || nx >= n.columnas || ny >= n.filas;
                const roca = n.rocas.some((r) => r.x === nx && r.y === ny);
                if (fuera || roca) {
                    choque = fuera ? "la pared" : "una roca";
                    this.sacudir();
                    await this.dormir(this.pausa(500));
                    break;
                }
                x = nx;
                y = ny;
                this.celdas[y][x].classList.add("rastro");
            }

            this.colocarPerro(x, y, dir);
            await this.dormir(this.pausa(accion === "avanzar" ? 600 : 450));
            if (turno !== this.corrida) return;
        }

        this.corriendo = false;
        this.bloquearEdicion(false);
        this.pintarPrograma(-1);

        const llego = !choque && x === n.meta.x && y === n.meta.y;

        if (llego) {
            this.terminado = true;
            this.botonEjecutar.disabled = true;
            this.botonBorrar.disabled = true;
            this.pintarPrograma(-1);

            if (this.nivel === this.niveles.length - 1) {
                this.acierto(
                    "¡Robi llegó al hueso! ¡Terminaste la actividad! " +
                    "Ahora responde la pregunta de abajo."
                );
            } else {
                this.acierto("¡Robi llegó al hueso! Muy bien. Pasa al siguiente nivel.");
                const siguiente = document.createElement("button");
                siguiente.type = "button";
                siguiente.className = "boton";
                siguiente.textContent = "Siguiente nivel";
                siguiente.addEventListener("click", () => {
                    this.nivel += 1;
                    this.cargarNivel();
                    this.decir(this.instruccion());
                });
                this.acciones.appendChild(siguiente);
            }
        } else if (choque) {
            this.error(
                "Robi chocó con " + choque + ". Cambia tu programa y toca Ejecutar otra vez."
            );
        } else {
            this.error(
                "Robi no llegó al hueso. Cambia tu programa y toca Ejecutar otra vez."
            );
        }
    }
}