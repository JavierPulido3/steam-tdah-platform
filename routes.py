from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash

from models import Usuario

bp = Blueprint("main", __name__)


@bp.route("/")
def inicio():
    if "usuario_id" in session:
        return (
            f"Sesión iniciada, rol: {session['rol']}. "
            f"<a href='{url_for('main.logout')}'>Salir</a>"
        )
    return redirect(url_for("main.login"))


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