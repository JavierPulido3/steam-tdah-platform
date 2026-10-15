from werkzeug.security import generate_password_hash

from models import Curso, Leccion, Opcion, Pregunta, Usuario, db

USUARIOS = [
    ("Ana Torres", "ana@demo.com", "1234", "estudiante"),
    ("Luis Gómez", "luis@demo.com", "1234", "estudiante"),
    ("Profesora Elena", "profe@demo.com", "1234", "instructor"),
]

LECCIONES = [
    {
        "area": "Ciencia",
        "titulo": "Estados de la materia",
        "orden": 1,
        "contenido": (
            "Todo lo que nos rodea está hecho de materia. La materia tiene tres estados.\n"
            "Sólido: tiene forma fija, no cambia si lo mueves. Ejemplo: una piedra.\n"
            "Líquido: no tiene forma fija, toma la forma del recipiente. Ejemplo: el agua.\n"
            "Gas: no tiene forma ni volumen fijo, se expande. Ejemplo: el aire."
        ),
        "pregunta": "¿En qué estado está el hielo?",
        "opciones": [("Líquido", False), ("Sólido", True), ("Gas", False)],
    },
    {
        "area": "Tecnología",
        "titulo": "Algoritmos",
        "orden": 2,
        "contenido": (
            "Un algoritmo es una lista de pasos, en orden, para lograr algo. "
            "Si cambias el orden, el resultado puede salir mal.\n"
            "Ejemplo: para lavarte las manos el orden es abrir la llave, poner jabón, "
            "frotar, enjuagar y cerrar la llave."
        ),
        "pregunta": "Si un robot debe llegar a la puerta, ¿qué paso va primero?",
        "opciones": [
            ("Abrir la puerta", False),
            ("Caminar hacia la puerta", True),
            ("Cerrar la puerta", False),
        ],
    },
    {
        "area": "Ingeniería",
        "titulo": "Construcción de estructuras",
        "orden": 3,
        "contenido": (
            "Una estructura estable necesita una base ancha y el peso repartido de forma pareja.\n"
            "Si la base es muy angosta o el peso está mal repartido, la estructura se cae."
        ),
        "pregunta": "¿Dónde deben ir los bloques más grandes para que la torre sea estable?",
        "opciones": [("Arriba", False), ("Abajo", True), ("No importa", False)],
    },
    {
        "area": "Arte",
        "titulo": "Mezcla de colores",
        "orden": 4,
        "contenido": (
            "Los colores primarios son rojo, azul y amarillo. "
            "Al mezclar dos primarios se obtiene un color secundario.\n"
            "Rojo más amarillo da naranja.\n"
            "Azul más amarillo da verde.\n"
            "Rojo más azul da morado."
        ),
        "pregunta": "¿Qué color se obtiene al mezclar azul y amarillo?",
        "opciones": [("Verde", True), ("Naranja", False), ("Morado", False)],
    },
    {
        "area": "Matemáticas",
        "titulo": "Patrones y secuencias",
        "orden": 5,
        "contenido": (
            "Un patrón es algo que se repite siguiendo una regla. "
            "Si conoces la regla, puedes adivinar qué sigue.\n"
            "Ejemplo: círculo rojo, círculo azul, círculo rojo, círculo azul, "
            "sigue círculo rojo.\n"
            "Ejemplo: 2, 4, 6, 8, sigue 10 porque vamos sumando 2."
        ),
        "pregunta": "¿Qué número sigue en la secuencia 5, 10, 15, 20?",
        "opciones": [("22", False), ("25", True), ("30", False)],
    },
]


def cargar_datos_iniciales():
    """Crea el curso, las lecciones y los usuarios si la base está vacía."""
    if Curso.query.first() is not None:
        return

    curso = Curso(
        titulo="Explorando STEAM",
        descripcion=(
            "Cinco lecciones cortas, una por cada área STEAM, con una actividad "
            "práctica y una pregunta al final."
        ),
    )
    db.session.add(curso)
    db.session.flush()

    for datos in LECCIONES:
        leccion = Leccion(
            curso_id=curso.id,
            area=datos["area"],
            titulo=datos["titulo"],
            contenido=datos["contenido"],
            orden=datos["orden"],
        )
        db.session.add(leccion)
        db.session.flush()

        pregunta = Pregunta(leccion_id=leccion.id, enunciado=datos["pregunta"])
        db.session.add(pregunta)
        db.session.flush()

        for texto, correcta in datos["opciones"]:
            db.session.add(
                Opcion(pregunta_id=pregunta.id, texto=texto, es_correcta=correcta)
            )

    for nombre, correo, clave, rol in USUARIOS:
        db.session.add(
            Usuario(
                nombre=nombre,
                correo=correo,
                contrasena_hash=generate_password_hash(clave),
                rol=rol,
            )
        )

    db.session.commit()