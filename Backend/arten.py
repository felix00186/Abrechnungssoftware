import connection
from typing import Generator, Dict, Any, List, Union
from string_functions import trim_string


def get_list(inkl_null: bool) -> Generator[Dict[str, Any], None, None]:
    bedingung = "true" if inkl_null else "Oeffnungsarten.id>0"
    for row in connection.get(f'''SELECT Oeffnungsarten.id, name, anzahl, notizen
                                  FROM Oeffnungsarten
                                  LEFT JOIN (
                                    SELECT id, COUNT(getraenk) AS Anzahl 
                                    FROM OeffnungsartGetraenke 
                                    GROUP BY id) Anzahlen
                                  ON Oeffnungsarten.id=Anzahlen.id
                                  WHERE {bedingung}
                                  AND sichtbar=1
                                  ORDER BY (Oeffnungsarten.id=0) DESC, name;'''):
        yield {
            "id": row[0],
            "name": row[1],
            "artikel": 0 if row[2] is None else row[2],
            "notizen": row[3]
        }


def get_artikel(id: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''SELECT Getraenke.id, Getraenke.name, losgroesse, Getraenke.einheit_lang
                                  FROM OeffnungsartGetraenke
                                  INNER JOIN Getraenke ON OeffnungsartGetraenke.getraenk=Getraenke.id
                                  WHERE OeffnungsartGetraenke.id={id}
                                  ORDER BY nummer;'''):
        yield {
            "id": row[0],
            "name": row[1],
            "losgroesse": row[2],
            "einheit": row[3]
        }


def edit(id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        name = trim_string(data["name"])
        notizen = trim_string(data["notizen"])
        for _ in connection.get(f"SELECT * FROM Oeffnungsarten WHERE name='{name}' AND NOT(id={id});"):
            raise Exception("Der Name ist schon vergeben.")
        connection.execute(f"UPDATE Oeffnungsarten SET name='{name}', notizen='{notizen}' WHERE id={id};")
        edit_article_list(data["id"], data["articles"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def delete(id: int):
    try:
        connection.execute(f"UPDATE Oeffnungsarten SET sichtbar=0 WHERE id={id};")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def create(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        name = trim_string(data["name"])
        notizen = trim_string(data["notizen"])
        for _ in connection.get(f"SELECT * FROM Oeffnungsarten WHERE name='{name}';"):
            raise Exception("Der Name ist schon vergeben.")
        id = connection.get_new_id("Oeffnungsarten")
        connection.execute(f"INSERT INTO Oeffnungsarten VALUES ({id}, '{name}', 1, '{notizen}');")
        edit_article_list(id, data["articles"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def edit_article_list(id: int, articles: List[List[Union[int, None]]]):
    connection.execute(f"DELETE FROM OeffnungsartGetraenke WHERE id={id};")
    if len(articles) > 0:
        articles = [f"({id}, {e[1]}, {e[0]}, {e[2]})" for e in articles]
        articles = ", ".join(articles)
        connection.execute(f"INSERT INTO OeffnungsartGetraenke VALUES {articles};")


def get_pages(pagesize: int, page: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f"""SELECT id, name
                                  FROM Oeffnungsarten
                                  WHERE sichtbar=1
                                  ORDER BY name
                                  LIMIT {page * pagesize}, {pagesize}"""):
        yield {
            "id": row[0],
            "name": row[1]
        }