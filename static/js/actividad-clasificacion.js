class ActividadClasificacion extends Actividad {
    constructor(contenedor) {
        super(contenedor);
        this.objetos = [
            { nombre: "Piedra", icono: "🪨", estado: "Sólido" },
            { nombre: "Agua", icono: "💧", estado: "Líquido" },
            { nombre: "Aire", icono: "💨", estado: "Gas" },
            { nombre: "Hielo", icono: "🧊", estado: "Sólido" },
            { nombre: "Jugo", icono: "🧃", estado: "Líquido" },
            { nombre: "Humo", icono: "🌫️", estado: "Gas" },
        ];
        this.estados = ["Sólido", "Líquido", "Gas"];
        this.seleccionado = null;
        this.colocados = 0;
    }

    instruccion() {
        return "Toca un objeto y después toca la caja donde va.";
    }

    render() {
        const fila = document.createElement("div");
        fila.className = "fila-objetos";

        this.objetos.forEach((obj) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "objeto";
            boton.textContent = obj.icono + " " + obj.nombre;
            boton.setAttribute("aria-pressed", "false");
            boton.addEventListener("click", () => this.elegir(obj, boton));
            obj.boton = boton;
            fila.appendChild(boton);
        });

        const cajas = document.createElement("div");
        cajas.className = "fila-cajas";

        this.estados.forEach((estado) => {
            const caja = document.createElement("button");
            caja.type = "button";
            caja.className = "caja";
            caja.innerHTML = "<strong>" + estado + "</strong><span class='contenido-caja'></span>";
            caja.addEventListener("click", () => this.soltar(estado, caja));
            cajas.appendChild(caja);
        });

        this.el.appendChild(fila);
        this.el.appendChild(cajas);
    }

    elegir(obj, boton) {
        if (obj.colocado) return;
        if (this.seleccionado) {
            this.seleccionado.boton.setAttribute("aria-pressed", "false");
            this.seleccionado.boton.classList.remove("elegido");
        }
        this.seleccionado = obj;
        boton.setAttribute("aria-pressed", "true");
        boton.classList.add("elegido");
        this.decir("Elegiste " + obj.nombre + ". Ahora toca su caja.");
    }

    soltar(estado, caja) {
        if (!this.seleccionado) {
            this.decir("Primero toca un objeto.");
            return;
        }
        const obj = this.seleccionado;

        if (obj.estado === estado) {
            obj.colocado = true;
            obj.boton.disabled = true;
            obj.boton.classList.remove("elegido");
            caja.querySelector(".contenido-caja").textContent += " " + obj.icono;
            this.seleccionado = null;
            this.colocados += 1;
            this.acierto("¡Bien! " + obj.nombre + " es " + estado.toLowerCase() + ".");
            if (this.colocados === this.objetos.length) {
                this.terminar();
            }
        } else {
            this.error(obj.nombre + " no va en " + estado + ". Prueba con otra caja.");
        }
    }
}