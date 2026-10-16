from functools import wraps

from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash

from models import Curso, Leccion, Progreso, Usuario, db

bp = Blueprint("main", __name__)


def login_requerido(vista):
    """Si no hay sesión iniciada, manda al login."""
    @wraps(vista)
    def envoltura(*args, **kwargs):
        if "usuario_id" not in session:
            return redirect(url_for("main.login"))
        return vista(*args, **kwargs)
    return envoltura


@bp.route("/")
def inicio():
    if "usuario_id" not in session:
        return redirect(url_for("main.login"))
    if session["rol"] == "instructor":
        return (
            "Panel del instructor (pendiente). "
            f"<a href='{url_for('main.logout')}'>Salir</a>"
        )
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
    return render_template("leccion.html", leccion=leccion)