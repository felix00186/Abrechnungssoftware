import json

import connection
from typing import Generator, Dict, Any
from string_functions import trim_string


def get(artikel) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f"""SELECT id, name, faktor, summand
                                  FROM Losgroessen
                                  WHERE getraenk={artikel} AND sichtbar=1;"""):
        yield {
            "id": row[0],
            "name_": row[1],
            "faktor": row[2],
            "offset": row[3]
        }


def delete(id):
    try:
        connection.execute(f"UPDATE Losgroessen SET sichtbar=0 WHERE id={id};")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def update(id, data):
    try:
        name = trim_string(data["name"])
        faktor = data["faktor"]
        offset = data["offset"]
        connection.execute(f"UPDATE Losgroessen SET name='{name}', faktor={faktor}, summand={offset} WHERE id={id};")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def create(artikel, data):
    try:
        name = trim_string(data["name"])
        faktor = data["faktor"]
        offset = data["offset"]
        id = connection.get_new_id("Losgroessen")
        connection.execute(f"INSERT INTO Losgroessen VALUES ({id}, {artikel}, '{name}', {faktor}, {offset}, 1);")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def table_update(artikel, data):
    sql = []
    new_id = None
    for row in data:
        if row["deleted"]:
            if not row["new"]:
                sql.append(f"UPDATE Losgroessen SET sichtbar=0 WHERE id={row['id']};")
        else:
            name = trim_string(row["name"])
            offset = row["offset"]
            faktor = row["faktor"]
            if row["new"]:
                if new_id is None:
                    new_id = connection.get_new_id("Losgroessen")
                else:
                    new_id += 1
                sql.append(f"INSERT INTO Losgroessen VALUES ({new_id}, {artikel}, '{name}', {faktor}, {offset}, 1);")
            else:
                id = row["id"]
                sql.append(f"UPDATE Losgroessen SET name='{name}', faktor={faktor}, summand={offset} WHERE id={id};")
    if len(sql) > 0:
        connection.execute(sql)