from conftest import iniciar_sesion
from models import Leccion, RespuestaEstudiante


def datos_leccion(app, orden=1):
    """Devuelve (id de la lección, id de opción correcta, id de opción incorrecta)."""
    with app.app_context():
        leccion = Leccion.query.filter_by(orden=orden).first()
        pregunta = leccion.preguntas[0]
        correcta = next(o.id for o in pregunta.opciones if o.es_correcta)
        incorrecta = next(o.id for o in pregunta.opciones if not o.es_correcta)
        return leccion.id, correcta, incorrecta


def responder(client, leccion_id, opcion_id):
    return client.post(
        f"/leccion/{leccion_id}/responder", data={"opcion_id": opcion_id}
    )


# ---------- Autenticación ----------

def test_login_correcto_lleva_a_las_lecciones(client):
    r = iniciar_sesion(client, "ana@demo.com")
    r = client.get("/lecciones")
    assert r.status_code == 200
    assert "Tu avance: 0%" in r.get_data(as_text=True)


def test_login_incorrecto_muestra_error(client):
    r = iniciar_sesion(client, "ana@demo.com", clave="mala")
    assert r.status_code == 200
    assert "Correo o contraseña incorrectos." in r.get_data(as_text=True)


def test_lecciones_exige_sesion(client):
    r = client.get("/lecciones")
    assert r.status_code == 302
    assert "/login" in r.headers["Location"]


def test_logout_cierra_la_sesion(client):
    iniciar_sesion(client, "ana@demo.com")
    client.get("/logout")
    r = client.get("/lecciones")
    assert r.status_code == 302


# ---------- Cuestionario y progreso ----------

def test_respuesta_correcta_completa_leccion_y_sube_avance(app, client):
    iniciar_sesion(client, "ana@demo.com")
    leccion_id, correcta, _ = datos_leccion(app)

    responder(client, leccion_id, correcta)

    r = client.get("/lecciones")
    assert "Tu avance: 20%" in r.get_data(as_text=True)
    with app.app_context():
        respuesta = RespuestaEstudiante.query.one()
        assert respuesta.es_correcta is True


def test_respuesta_incorrecta_tambien_completa_pero_no_cuenta_como_acierto(app, client):
    iniciar_sesion(client, "ana@demo.com")
    leccion_id, _, incorrecta = datos_leccion(app)

    responder(client, leccion_id, incorrecta)

    r = client.get("/lecciones")
    assert "Tu avance: 20%" in r.get_data(as_text=True)
    with app.app_context():
        assert RespuestaEstudiante.query.one().es_correcta is False


def test_reenviar_la_misma_respuesta_no_duplica(app, client):
    iniciar_sesion(client, "ana@demo.com")
    leccion_id, correcta, _ = datos_leccion(app)

    responder(client, leccion_id, correcta)
    responder(client, leccion_id, correcta)

    with app.app_context():
        assert RespuestaEstudiante.query.count() == 1


def test_opcion_de_otra_leccion_se_rechaza(app, client):
    iniciar_sesion(client, "ana@demo.com")
    leccion_1, _, _ = datos_leccion(app, orden=1)
    _, opcion_de_leccion_2, _ = datos_leccion(app, orden=2)

    responder(client, leccion_1, opcion_de_leccion_2)

    with app.app_context():
        assert RespuestaEstudiante.query.count() == 0


def test_el_avance_es_por_estudiante(app, client):
    iniciar_sesion(client, "ana@demo.com")
    leccion_id, correcta, _ = datos_leccion(app)
    responder(client, leccion_id, correcta)

    otro = app.test_client()
    iniciar_sesion(otro, "luis@demo.com")
    r = otro.get("/lecciones")
    assert "Tu avance: 0%" in r.get_data(as_text=True)


# ---------- Panel del instructor y permisos ----------

def test_estudiante_no_puede_ver_el_panel(client):
    iniciar_sesion(client, "ana@demo.com")
    assert client.get("/panel").status_code == 403


def test_panel_exige_sesion(client):
    r = client.get("/panel")
    assert r.status_code == 302
    assert "/login" in r.headers["Location"]


def test_instructor_ve_el_panel_con_los_estudiantes(client):
    iniciar_sesion(client, "profe@demo.com")
    r = client.get("/panel")
    assert r.status_code == 200
    texto = r.get_data(as_text=True)
    assert "Ana Torres" in texto
    assert "Luis Gómez" in texto


def test_panel_refleja_el_avance_de_un_estudiante(app, client):
    iniciar_sesion(client, "ana@demo.com")
    leccion_id, correcta, _ = datos_leccion(app)
    responder(client, leccion_id, correcta)

    instructor = app.test_client()
    iniciar_sesion(instructor, "profe@demo.com")
    r = instructor.get("/panel")
    assert "20%" in r.get_data(as_text=True)


def test_instructor_no_puede_responder_cuestionarios(app, client):
    iniciar_sesion(client, "profe@demo.com")
    leccion_id, correcta, _ = datos_leccion(app)
    assert responder(client, leccion_id, correcta).status_code == 403