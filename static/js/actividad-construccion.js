class ActividadConstruccion extends Actividad {
    constructor(contenedor) {
        super(contenedor);
        this.ancho = 600;
        this.alto = 360;
        this.sueloY = this.alto - 30; // parte alta del suelo
        this.altoBloque = 34;
        this.minimoPisos = 4;
        this.pasos = 240; // 4 segundos de simulación a 60 cuadros por segundo
        this.tipos = [
            { nombre: "Muy grande", ancho: 180, color: "#2f6fb3" },
            { nombre: "Grande", ancho: 140, color: "#3a9d5d" },
            { nombre: "Mediano", ancho: 100, color: "#f2c230" },
            { nombre: "Pequeño", ancho: 70, color: "#d64545" },
            { nombre: "Mini", ancho: 40, color: "#8e5bb5" },
        ];
        this.reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.estado = "construccion"; // construccion, probando, resuelto
        this.terminado = false;
        this.colocados = [];
        this.disponibles = [...this.tipos];
        this.elegido = null;
        this.fantasmaX = this.ancho / 2;
        this.raf = null;
        this.ticks = 0;
        this.botonVolver = null;
    }

    instruccion() {
        return "Toca un bloque, luego toca en el dibujo dónde ponerlo. Cuando termines, toca Probar.";
    }

    render() {
        const { Engine, Render, Bodies, Composite, Events } = Matter;

        const guia = document.createElement("p");
        guia.textContent =
            "Usa los 5 bloques para armar una torre de al menos 4 pisos. " +
            "Al tocar Probar, la gravedad decide si la torre resiste.";
        this.el.appendChild(guia);

        // Mundo físico: suelo y dos paredes invisibles para que nada salga del dibujo.
        this.engine = Engine.create();
        this.engine.positionIterations = 10;
        this.engine.velocityIterations = 8;
        const fijo = { isStatic: true, friction: 1, render: { fillStyle: "#9aa5b1" } };
        Composite.add(this.engine.world, [
            Bodies.rectangle(this.ancho / 2, this.sueloY + 15, this.ancho, 30, fijo),
            Bodies.rectangle(-25, this.alto / 2, 50, this.alto * 2, fijo),
            Bodies.rectangle(this.ancho + 25, this.alto / 2, 50, this.alto * 2, fijo),
        ]);

        const envoltura = document.createElement("div");
        envoltura.className = "lienzo";
        this.lienzo = document.createElement("canvas");
        this.lienzo.tabIndex = 0;
        this.lienzo.setAttribute(
            "aria-label",
            "Zona de construcción. Con el teclado, usa las flechas para mover y Enter para colocar el bloque elegido."
        );
        envoltura.appendChild(this.lienzo);
        this.el.appendChild(envoltura);

        this.dibujo = Render.create({
            canvas: this.lienzo,
            engine: this.engine,
            options: { width: this.ancho, height: this.alto, wireframes: false, background: "#eef3f8" },
        });
        Render.run(this.dibujo);
        Events.on(this.dibujo, "afterRender", () => this.dibujarFantasma());

        this.lienzo.addEventListener("pointermove", (e) => {
            this.fantasmaX = this.xDesde(e);
        });
        this.lienzo.addEventListener("click", (e) => {
            this.fantasmaX = this.xDesde(e);
            this.colocar();
        });
        this.lienzo.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                this.fantasmaX = Math.max(0, this.fantasmaX - 10);
                e.preventDefault();
            } else if (e.key === "ArrowRight") {
                this.fantasmaX = Math.min(this.ancho, this.fantasmaX + 10);
                e.preventDefault();
            } else if (e.key === "Enter" || e.key === " ") {
                this.colocar();
                e.preventDefault();
            }
        });

        // Lista de bloques
        this.contador = document.createElement("p");
        this.contador.className = "ronda";
        this.el.appendChild(this.contador);

        this.zonaBanco = document.createElement("div");
        this.zonaBanco.className = "zona-bloques";
        this.el.appendChild(this.zonaBanco);

        // Botones de acción
        this.acciones = document.createElement("div");
        this.acciones.className = "acciones";

        this.botonProbar = document.createElement("button");
        this.botonProbar.type = "button";
        this.botonProbar.className = "boton";
        this.botonProbar.textContent = "▶ Probar";
        this.botonProbar.addEventListener("click", () => this.probar());

        this.botonDeshacer = document.createElement("button");
        this.botonDeshacer.type = "button";
        this.botonDeshacer.className = "objeto";
        this.botonDeshacer.textContent = "Deshacer último";
        this.botonDeshacer.addEventListener("click", () => this.deshacer());

        this.botonReiniciar = document.createElement("button");
        this.botonReiniciar.type = "button";
        this.botonReiniciar.className = "objeto";
        this.botonReiniciar.textContent = "Empezar de nuevo";
        this.botonReiniciar.addEventListener("click", () => this.reiniciar());

        this.acciones.append(this.botonProbar, this.botonDeshacer, this.botonReiniciar);
        this.el.appendChild(this.acciones);

        this.pintarBanco();
        this.actualizarControles();
    }

    xDesde(evento) {
        const caja = this.lienzo.getBoundingClientRect();
        return (evento.clientX - caja.left) * (this.ancho / caja.width);
    }

    // Calcula dónde quedaría un bloque al caer sobre lo que ya hay construido.
    posicionReposo(anchoBloque, xDeseado) {
        const x = Math.min(Math.max(xDeseado, anchoBloque / 2), this.ancho - anchoBloque / 2);
        let tope = this.sueloY;
        this.colocados.forEach((c) => {
            const solapa =
                x - anchoBloque / 2 < c.x + c.ancho / 2 - 1 &&
                x + anchoBloque / 2 > c.x - c.ancho / 2 + 1;
            if (solapa) tope = Math.min(tope, c.y - this.altoBloque / 2);
        });
        return { x, y: tope - this.altoBloque / 2 - 0.5 };
    }

    dibujarFantasma() {
        if (this.estado !== "construccion" || !this.elegido) return;
        const ctx = this.dibujo.context;
        const t = this.elegido;
        const pos = this.posicionReposo(t.ancho, this.fantasmaX);
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = t.color;
        ctx.fillRect(pos.x - t.ancho / 2, pos.y - this.altoBloque / 2, t.ancho, this.altoBloque);
        ctx.globalAlpha = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "#1f2933";
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - t.ancho / 2, pos.y - this.altoBloque / 2, t.ancho, this.altoBloque);
        ctx.restore();
    }

    pintarBanco() {
        this.contador.textContent =
            "Bloques colocados: " + this.colocados.length + " de " + this.tipos.length;
        this.zonaBanco.innerHTML = "";

        if (this.disponibles.length === 0) {
            const listo = document.createElement("p");
            listo.className = "vacio";
            listo.textContent = "Ya usaste todos los bloques. Toca Probar.";
            this.zonaBanco.appendChild(listo);
            return;
        }

        this.disponibles.forEach((tipo) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "objeto";
            if (tipo === this.elegido) boton.classList.add("elegido");
            boton.disabled = this.estado !== "construccion";

            const muestra = document.createElement("span");
            muestra.className = "muestra-bloque";
            muestra.style.width = tipo.ancho / 3 + "px";
            muestra.style.background = tipo.color;
            const texto = document.createElement("span");
            texto.textContent = tipo.nombre;
            boton.append(muestra, texto);

            boton.addEventListener("click", () => {
                this.elegido = tipo;
                this.pintarBanco();
                this.decir("Elegiste el bloque " + tipo.nombre.toLowerCase() + ". Ahora toca en el dibujo dónde ponerlo.");
            });
            this.zonaBanco.appendChild(boton);
        });
    }

    actualizarControles() {
        const editando = this.estado === "construccion";
        this.botonProbar.disabled = !editando;
        this.botonDeshacer.disabled = !editando || this.colocados.length === 0;
        this.botonReiniciar.disabled = this.estado === "probando" || this.terminado;
        this.pintarBanco();
    }

    colocar() {
        if (this.estado !== "construccion") return;
        if (!this.elegido) {
            this.decir("Primero toca un bloque de la lista.");
            return;
        }
        const tipo = this.elegido;
        const pos = this.posicionReposo(tipo.ancho, this.fantasmaX);
        if (pos.y - this.altoBloque / 2 < 0) {
            this.decir("Ahí ya no cabe. Pon el bloque en otro lugar.");
            return;
        }

        const cuerpo = Matter.Bodies.rectangle(pos.x, pos.y, tipo.ancho, this.altoBloque, {
            friction: 0.8,
            frictionStatic: 1,
            restitution: 0,
            render: { fillStyle: tipo.color, strokeStyle: "#1f2933", lineWidth: 2 },
        });
        Matter.Composite.add(this.engine.world, cuerpo);
        this.colocados.push({ tipo, cuerpo, x: pos.x, y: pos.y, ancho: tipo.ancho });
        this.disponibles = this.disponibles.filter((t) => t !== tipo);
        this.elegido = null;
        this.actualizarControles();

        const faltan = this.tipos.length - this.colocados.length;
        this.decir(
            faltan > 0
                ? "Bloque colocado. Te faltan " + faltan + "."
                : "Colocaste todos los bloques. Toca Probar."
        );
    }

    deshacer() {
        if (this.estado !== "construccion" || this.colocados.length === 0) return;
        const ultimo = this.colocados.pop();
        Matter.Composite.remove(this.engine.world, ultimo.cuerpo);
        this.disponibles = this.tipos.filter((t) => !this.colocados.some((c) => c.tipo === t));
        this.actualizarControles();
        this.decir("Quitaste el bloque " + ultimo.tipo.nombre.toLowerCase() + ".");
    }

    reiniciar() {
        if (this.estado === "probando" || this.terminado) return;
        this.colocados.forEach((c) => Matter.Composite.remove(this.engine.world, c.cuerpo));
        this.colocados = [];
        this.disponibles = [...this.tipos];
        this.elegido = null;
        this.estado = "construccion";
        this.quitarBotonVolver();
        this.actualizarControles();
        this.decir(this.instruccion());
    }

    quitarBotonVolver() {
        if (this.botonVolver) {
            this.botonVolver.remove();
            this.botonVolver = null;
        }
    }

    probar() {
        if (this.estado !== "construccion") return;

        const faltan = this.tipos.length - this.colocados.length;
        if (faltan > 0) {
            this.decir("Usa los 5 bloques antes de probar. Te faltan " + faltan + ".");
            return;
        }

        const cima = Math.min(...this.colocados.map((c) => c.y - this.altoBloque / 2));
        const alto = this.sueloY - cima;
        if (alto < this.minimoPisos * this.altoBloque - 1) {
            this.decir("Eso parece una fila, no una torre. Apila los bloques para llegar a 4 pisos.");
            return;
        }

        this.estado = "probando";
        this.elegido = null;
        this.actualizarControles();
        this.decir("Probando la torre con la gravedad...");
        this.ticks = 0;

        if (this.reducirMovimiento) {
            for (let i = 0; i < this.pasos; i++) Matter.Engine.update(this.engine, 1000 / 60);
            this.evaluar();
        } else {
            this.paso();
        }
    }

    paso() {
        Matter.Engine.update(this.engine, 1000 / 60);
        this.ticks += 1;
        if (this.ticks < this.pasos) {
            this.raf = requestAnimationFrame(() => this.paso());
        } else {
            this.evaluar();
        }
    }

    evaluar() {
        // La torre se cayó si algún bloque se desplazó o giró más de lo normal.
        const cayo = this.colocados.some((c) => {
            const desplazamiento = Math.hypot(
                c.cuerpo.position.x - c.x,
                c.cuerpo.position.y - c.y
            );
            return desplazamiento > 20 || Math.abs(c.cuerpo.angle) > 0.15;
        });
        this.estado = "resuelto";

        if (cayo) {
            this.error(
                "La torre se cayó. Si la base es angosta o el peso queda mal repartido, no resiste. " +
                "Toca Volver a mi torre y cambia algo."
            );
            this.botonVolver = document.createElement("button");
            this.botonVolver.type = "button";
            this.botonVolver.className = "boton";
            this.botonVolver.textContent = "Volver a mi torre";
            this.botonVolver.addEventListener("click", () => this.volverATorre());
            this.acciones.appendChild(this.botonVolver);
            this.actualizarControles();
            return;
        }

        this.terminado = true;
        const enSuelo = this.colocados.filter((c) => c.y + this.altoBloque / 2 >= this.sueloY - 2);
        const anchoBase = Math.max(...enSuelo.map((c) => c.ancho));
        const baseAncha = anchoBase === this.tipos[0].ancho;
        const cierre = " ¡Terminaste la actividad! Ahora responde la pregunta de abajo.";

        this.acierto(
            baseAncha
                ? "¡La torre resiste! Su base ancha la mantiene firme." + cierre
                : "¡La torre resiste! Con el bloque más grande abajo sería todavía más firme." + cierre
        );
        this.actualizarControles();
    }

    volverATorre() {
        const { Body } = Matter;
        this.colocados.forEach((c) => {
            Body.setPosition(c.cuerpo, { x: c.x, y: c.y });
            Body.setAngle(c.cuerpo, 0);
            Body.setVelocity(c.cuerpo, { x: 0, y: 0 });
            Body.setAngularVelocity(c.cuerpo, 0);
        });
        this.estado = "construccion";
        this.quitarBotonVolver();
        this.actualizarControles();
        this.decir("Tu torre volvió a su lugar. Cambia algo con Deshacer último y prueba otra vez.");
    }
}