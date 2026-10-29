from datetime import datetime
from functools import wraps

from flask import (
    Blueprint,
    abort,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash

from models import Curso, Leccion, Opcion, Progreso, RespuestaEstudiante, Usuario, db

bp = Blueprint("main", __name__)


def login_requerido(vista):
    """Si no hay sesión iniciada, manda al login."""
    @wraps(vista)
    def envoltura(*args, **kwargs):
        if "usuario_id" not in session:
            return redirect(url_for("main.login"))
        return vista(*args, **kwargs)
    return envoltura


# NUEVO: va justo debajo de login_requerido
def instructor_requerido(vista):
    """Solo deja pasar al instructor; a los demás les responde 403."""
    @wraps(vista)
    def envoltura(*args, **kwargs):
        if "usuario_id" not in session:
            return redirect(url_for("main.login"))
        if session.get("rol") != "instructor":
            abort(403)
        return vista(*args, **kwargs)
    return envoltura


# CAMBIÓ: el instructor ahora va al panel en vez de ver el texto provisional
@bp.route("/")
def inicio():
    if "usuario_id" not in session:
        return redirect(url_for("main.login"))
    if session["rol"] == "instructor":
        return redirect(url_for("main.panel"))
    return redirect(url_for("main.lecciones"))


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        correo = request.form.get("correo", "").strip().lower()
        clave = request.form.get("clave", "")
        usuario = Usuario.query.filter_by(correo=correo).first()

        if usuario and check_password_hash(usuario.contrasena_hash, clave):
            session.clear()
            session["usuario_id"] = usuario.id
            session["rol"] = usuario.rol
            return redirect(url_for("main.inicio"))

        flash("Correo o contraseña incorrectos.")

    return render_template("login.html")


@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("main.login"))


@bp.route("/lecciones")
@login_requerido
def lecciones():
    curso = Curso.query.first()
    completadas = {
        p.leccion_id
        for p in Progreso.query.filter_by(
            usuario_id=session["usuario_id"], completada=True
        )
    }
    total = len(curso.lecciones)
    porcentaje = round(len(completadas) * 100 / total) if total else 0
    return render_template(
        "lecciones.html",
        curso=curso,
        completadas=completadas,
        porcentaje=porcentaje,
    )


@bp.route("/leccion/<int:leccion_id>")
@login_requerido
def leccion(leccion_id):
    leccion = db.get_or_404(Leccion, leccion_id)
    pregunta = leccion.preguntas[0] if leccion.preguntas else None
    respuesta = None
    if pregunta:
        respuesta = RespuestaEstudiante.query.filter_by(
            usuario_id=session["usuario_id"], pregunta_id=pregunta.id
        ).first()
    return render_template(
        "leccion.html", leccion=leccion, pregunta=pregunta, respuesta=respuesta
    )


@bp.route("/leccion/<int:leccion_id>/responder", methods=["POST"])
@login_requerido
def responder(leccion_id):
    if session["rol"] == "instructor":
        abort(403)

    leccion = db.get_or_404(Leccion, leccion_id)
    if not leccion.preguntas:
        abort(404)
    pregunta = leccion.preguntas[0]
    usuario_id = session["usuario_id"]

    ya_respondida = RespuestaEstudiante.query.filter_by(
        usuario_id=usuario_id, pregunta_id=pregunta.id
    ).first()
    if ya_respondida:
        return redirect(url_for("main.leccion", leccion_id=leccion.id))

    opcion_id = request.form.get("opcion_id", type=int)
    opcion = db.session.get(Opcion, opcion_id) if opcion_id else None
    if opcion is None or opcion.pregunta_id != pregunta.id:
        flash("Elige una de las opciones.")
        return redirect(url_for("main.leccion", leccion_id=leccion.id))

    db.session.add(
        RespuestaEstudiante(
            usuario_id=usuario_id,
            pregunta_id=pregunta.id,
            opcion_elegida_id=opcion.id,
            es_correcta=opcion.es_correcta,
        )
    )

    progreso = Progreso.query.filter_by(
        usuario_id=usuario_id, leccion_id=leccion.id
    ).first()
    if progreso is None:
        progreso = Progreso(usuario_id=usuario_id, leccion_id=leccion.id)
        db.session.add(progreso)
    progreso.completada = True
    progreso.fecha_completada = datetime.now()

    db.session.commit()
    return redirect(url_for("main.leccion", leccion_id=leccion.id))


# NUEVO: va al final del archivo
@bp.route("/panel")
@instructor_requerido
def panel():
    curso = Curso.query.first()
    total = len(curso.lecciones) or 1
    estudiantes = (
        Usuario.query.filter_by(rol="estudiante").order_by(Usuario.nombre).all()
    )

    filas = []
    for estudiante in estudiantes:
        completadas = {p.leccion_id for p in estudiante.progresos if p.completada}
        filas.append(
            {
                "nombre": estudiante.nombre,
                "completadas": completadas,
                "porcentaje": round(len(completadas) * 100 / total),
                "aciertos": sum(1 for r in estudiante.respuestas if r.es_correcta),
                "intentos": len(estudiante.respuestas),
            }
        )

    return render_template("panel.html", curso=curso, filas=filas)