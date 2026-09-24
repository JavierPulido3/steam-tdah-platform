from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Usuario(db.Model):
    __tablename__ = "usuario"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    contrasena_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False, default="estudiante")

    progresos = db.relationship("Progreso", backref="usuario", cascade="all, delete-orphan")
    respuestas = db.relationship("RespuestaEstudiante", backref="usuario", cascade="all, delete-orphan")

    @property
    def es_instructor(self):
        return self.rol == "instructor"


class Curso(db.Model):
    __tablename__ = "curso"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(160), nullable=False)
    descripcion = db.Column(db.Text)

    lecciones = db.relationship("Leccion", backref="curso", order_by="Leccion.orden", cascade="all, delete-orphan")


class Leccion(db.Model):
    __tablename__ = "leccion"

    id = db.Column(db.Integer, primary_key=True)
    curso_id = db.Column(db.Integer, db.ForeignKey("curso.id"), nullable=False)
    area = db.Column(db.String(40), nullable=False)
    titulo = db.Column(db.String(160), nullable=False)
    contenido = db.Column(db.Text, nullable=False)
    orden = db.Column(db.Integer, nullable=False, default=0)

    preguntas = db.relationship("Pregunta", backref="leccion", cascade="all, delete-orphan")
    progresos = db.relationship("Progreso", backref="leccion", cascade="all, delete-orphan")


class Progreso(db.Model):
    __tablename__ = "progreso"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    leccion_id = db.Column(db.Integer, db.ForeignKey("leccion.id"), nullable=False)
    completada = db.Column(db.Boolean, nullable=False, default=False)
    fecha_completada = db.Column(db.DateTime)


class Pregunta(db.Model):
    __tablename__ = "pregunta"

    id = db.Column(db.Integer, primary_key=True)
    leccion_id = db.Column(db.Integer, db.ForeignKey("leccion.id"), nullable=False)
    enunciado = db.Column(db.Text, nullable=False)

    opciones = db.relationship("Opcion", backref="pregunta", cascade="all, delete-orphan")


class Opcion(db.Model):
    __tablename__ = "opcion"

    id = db.Column(db.Integer, primary_key=True)
    pregunta_id = db.Column(db.Integer, db.ForeignKey("pregunta.id"), nullable=False)
    texto = db.Column(db.String(255), nullable=False)
    es_correcta = db.Column(db.Boolean, nullable=False, default=False)


class RespuestaEstudiante(db.Model):
    __tablename__ = "respuesta_estudiante"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    pregunta_id = db.Column(db.Integer, db.ForeignKey("pregunta.id"), nullable=False)
    opcion_elegida_id = db.Column(db.Integer, db.ForeignKey("opcion.id"), nullable=False)
    es_correcta = db.Column(db.Boolean, nullable=False, default=False)