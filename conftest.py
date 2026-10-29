import pytest

from app import crear_app
from models import db


@pytest.fixture()
def app(tmp_path):
    """Una app nueva por prueba, con su propia base temporal ya sembrada."""
    app = crear_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///" + (tmp_path / "test.db").as_posix(),
        }
    )
    yield app
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture()
def client(app):
    return app.test_client()


def iniciar_sesion(client, correo, clave="1234"):
    return client.post("/login", data={"correo": correo, "clave": clave})