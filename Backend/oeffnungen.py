import artikel
import connection
from typing import Generator, Dict, Any
from string_functions import trim_string


def get_liste(jahr=None, von=None, bis=None) -> Generator[Dict[str, Any], None, None]:
    if jahr is not None:
        von = f"{jahr}-01-01"
        bis = f"{jahr}-12-31"
    for row in connection.get(f'''
            SELECT OeffnungenJahr.id,
                OeffnungenJahr.name,
                art,
                Oeffnungsarten.name,
                OeffnungEinnahmen.summe,
                STRFTIME('%d.%m.%Y', datum), 
                STRFTIME('%Y-%m-%d', datum),
                OeffnungenJahr.notizen
          FROM (SELECT * 
                FROM Oeffnungen 
                WHERE datum>=DATETIME('{von}')
                AND datum<=DATETIME('{bis}')
            ) OeffnungenJahr
            INNER JOIN Oeffnungsarten ON OeffnungenJahr.art=Oeffnungsarten.id
            LEFT JOIN (
                SELECT oeffnung, SUM(netto) AS summe
                FROM Einnahmen
                GROUP BY oeffnung
            ) OeffnungEinnahmen ON OeffnungenJahr.id=OeffnungEinnahmen.oeffnung
            ORDER BY datum DESC;'''):
        yield {
            "id": row[0],
            "name": row[1],
            "art": {
                "id": row[2],
                "name": row[3]
            },
            "summe": 0 if row[4] is None else row[4],
            "datum": {
                "ansicht": row[5],
                "parsed": row[6]
            },
            "notizen": row[7]
        }


def delete(id: int) -> Dict[str, Any]:
    try:
        connection.execute([f"DELETE FROM Oeffnungen WHERE id={id};",
                            f"DELETE FROM OeffnungenVerbrauch WHERE oeffnung={id};",
                            f"DELETE FROM Einnahmen WHERE oeffnung={id};"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def edit(id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        name = trim_string(data["name"])
        datum = data["datum"]
        art = data["art"]
        notizen = trim_string(data["notizen"])
        artikel = data["artikel"]
        einnahmen = data["einnahmen"]
        sql_list = [f"DELETE FROM OeffnungenVerbrauch WHERE oeffnung={id};",
                    f"DELETE FROM Einnahmen WHERE oeffnung={id};",
                    f"UPDATE Oeffnungen SET name='{name}', datum=DATETIME('{datum}'), art={art}, notizen='{notizen}' WHERE id={id};"]
        for item in artikel:
            anfang = item["anfang"]
            plus = item["plus"]
            ende = item["ende"]
            differenz = item["differenz"]
            los = "null" if item["los"] is None else item["los"]
            orig_diff = item["orig_differenz"]
            sql_list.append(f"INSERT INTO OeffnungenVerbrauch VALUES ({id}, {item['id']}, {anfang}, {plus}, {ende}, {differenz}, {los}, {orig_diff}, null);")
        einnahmen_id = connection.get_new_id("Einnahmen")
        for item in einnahmen:
            sql_list.append(f"INSERT INTO Einnahmen VALUES ({einnahmen_id}, {id}, '{trim_string(item['name'])}', {item['brutto']}, {item['mwst']}, {item['zehnt']}, {item['netto']});")
            einnahmen_id += 1
        connection.execute(sql_list)
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def create(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        id = connection.get_new_id("Oeffnungen")
        name = trim_string(data["name"])
        datum = data["datum"]
        art = data["art"]
        notizen = trim_string(data["notizen"])
        artikel = data["artikel"]
        einnahmen = data["einnahmen"]
        sql_list = [f"INSERT INTO Oeffnungen VALUES ({id}, DATETIME('{datum}'), {art}, '{notizen}', '{name}');"]
        for item in artikel:
            anfang = item["anfang"]
            plus = item["plus"]
            ende = item["ende"]
            differenz = item["differenz"]
            los = "null" if item["los"] is None else item["los"]
            orig_diff = item["orig_differenz"]
            sql_list.append(f"INSERT INTO OeffnungenVerbrauch VALUES ({id}, {item['id']}, {anfang}, {plus}, {ende}, {differenz}, {los}, {orig_diff}, null);")
        einnahmen_id = connection.get_new_id("Einnahmen")
        for item in einnahmen:
            sql_list.append(f"INSERT INTO Einnahmen VALUES ({einnahmen_id}, {id}, '{trim_string(item['name'])}', {item['brutto']}, {item['mwst']}, {item['zehnt']}, {item['netto']});")
            einnahmen_id += 1
        connection.execute(sql_list)
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def get_artikel(id: int) -> Generator[Dict[str, Any], None, None]:
    rows = []
    for row in connection.get(f'''SELECT Getraenke.id,
                                         Getraenke.name,
                                         Getraenke.einheit_lang,
                                         anfang,
                                         plus,
                                         ende,
                                         differenz,
                                         losgroesse
                                   FROM OeffnungenVerbrauch
                                   INNER JOIN Getraenke ON OeffnungenVerbrauch.getraenk=Getraenke.id
                                   WHERE oeffnung={id}
                                   ORDER BY Getraenke.name;'''):
        rows.append(row)
    for row in rows:
        yield {
            "artikel": {
                "id": row[0],
                "name": row[1],
                "einheit": row[2]
            },
            "anfang": row[3],
            "plus": row[4],
            "ende": row[5],
            "differenz": row[6],
            "kosten": artikel.get_kosten(row[0]),
            "los": row[7]
        }


def get_einnahmen(id: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''SELECT Einnahmen.id, name, brutto, mwst, zehnt, netto
                                  FROM Einnahmen
                                  WHERE oeffnung={id};'''):
        yield {
            "id": row[0],
            "name": row[1],
            "brutto": row[2],
            "mwst": row[3],
            "zehnt": row[4],
            "netto": row[5]
        }


def get_pages(startdate: str, pagesize: int, page: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f"""SELECT id, name, STRFTIME('%d.%m.%Y', datum), STRFTIME('%Y-%m-%d', datum)
                                  FROM Oeffnungen
                                  WHERE datum<=date('{startdate}')
                                  ORDER BY datum DESC
                                  LIMIT {page * pagesize}, {pagesize}"""):
        yield {
            "id": row[0],
            "name": row[1],
            "datum_ansicht": row[2],
            "datum_parsed": row[3]
        }
