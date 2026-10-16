from flask import Flask

from models import db
from routes import bp
from seed import cargar_datos_iniciales


def crear_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "cambia-esta-clave-despues"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(bp)

    with app.app_context():
        db.create_all()
        cargar_datos_iniciales()

    return app


app = crear_app()

if __name__ == "__main__":
    app.run(debug=True)