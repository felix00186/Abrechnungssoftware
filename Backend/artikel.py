import datetime
import connection
from typing import Generator, Dict, Any, Union
from string_functions import trim_string
import losgroessen


lang_zu_kurz = {
    "Liter": "l",
    "Centiliter": "cl",
    "Milliliter": "ml",
    "Kilogramm": "kg",
    "Gramm": "g",
    "Stück": "Stk.",
    "Flaschen": "Fl.",
    "Kannen": "Kan.",
    "Packungen": "Pck."
}


def get_infolist(jahr: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''
            WITH ArtIds AS (
                SELECT DISTINCT getraenk AS id
                FROM EinkaufArtikel
                INNER JOIN Einkaeufe
                ON EinkaufArtikel.einkauf=Einkaeufe.id
                WHERE STRFTIME('%Y', datum)='{jahr}'
            UNION
                SELECT DISTINCT getraenk AS id
                FROM OeffnungenVerbrauch
                INNER JOIN Oeffnungen
                ON Oeffnungen.id=OeffnungenVerbrauch.oeffnung
                WHERE STRFTIME('%Y', datum)='{jahr}'
            )
            SELECT id, name, einheit_kurz
            FROM Getraenke
            NATURAL JOIN ArtIds
            ORDER BY name;'''):
        yield {
            "id": row[0],
            "name": row[1],
            "einheit": row[2]
        }


def get_einkaeufe(id: int, jahr: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''
            SELECT STRFTIME('%d.%m.', datum), laden, orig_menge, einzel_netto, gesamt_netto, STRFTIME('%Y-%m-%d', datum)
            FROM Einkaeufe
            INNER JOIN EinkaufArtikel ON Einkaeufe.id=EinkaufArtikel.einkauf
            WHERE getraenk={id}
            AND STRFTIME('%Y', datum)='{jahr}'
            ORDER BY datum DESC;'''):
        yield {
            "datum": row[0],
            "laden": row[1],
            "menge": row[2],
            "einzel": row[3],
            "gesamt": row[4],
            "datum_parsed": row[5]
        }


def get_verbrauche(id: int, jahr: int) -> Generator[Dict[str, Any], None, None]:
    liste = []
    for row in connection.get(f'''
            SELECT STRFTIME('%d.%m.', datum), name, differenz_orig, STRFTIME('%Y-%m-%d', datum)
            FROM Oeffnungen
            INNER JOIN OeffnungenVerbrauch ON OeffnungenVerbrauch.oeffnung=Oeffnungen.id
            WHERE STRFTIME('%Y', datum)='{jahr}'
            AND getraenk={id}
            AND differenz_orig>0
            ORDER BY datum DESC;'''):
        liste.append([*row])
    for row in liste:
        kosten = get_kosten(id, jahr, jahr)
        yield {
            "datum": row[0],
            "name_": row[1],
            "differenz": row[2],
            "preis": int(kosten * row[2]),
            "preis_da": kosten > -1,
            "datum_parsed": row[3]
        }


def get_list(mit_kosten: bool, mit_losgroessen:bool=False) -> Generator[Dict[str, Any], None, None]:
    rows = []
    for row in connection.get('''SELECT id, name, einheit_lang, einheit_kurz, reste, notizen, bereich
                                 FROM Getraenke 
                                 WHERE sichtbar=1 
                                 ORDER BY name;'''):
        rows.append(row)
    for row in rows:
        data = {
            "id": row[0],
            "name": row[1],
            "einheit": {
                "lang": row[2],
                "kurz": row[3]
            },
            "reste": bool(row[4]),
            "notizen": row[5],
            "bereich": row[6]
        }
        if mit_kosten:
            data["kosten"] = get_kosten(row[0])
        if mit_losgroessen:
            data["losgroessen"] = list(losgroessen.get(row[0]))
        yield data


def delete(id: int):
    try:
        connection.execute(f"UPDATE Getraenke SET sichtbar=0 WHERE id={id};")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def edit(id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        name = trim_string(data["name"])
        lang = data["einheit"]
        if lang not in lang_zu_kurz:
            raise Exception("Bitte wähle eine Einheit aus.")
        kurz = lang_zu_kurz[lang]
        for _ in connection.get(f"SELECT * FROM Getraenke WHERE name='{name}' AND NOT(id={id});"):
            raise Exception("Der Name ist schon vergeben.")
        reste = int(data["reste"])
        notizen = trim_string(data["notizen"])
        bereich = "null" if data["bereich"] is None else data["bereich"]
        connection.execute(f"UPDATE Getraenke SET name='{name}', einheit_kurz='{kurz}', einheit_lang='{lang}', reste={reste}, notizen='{notizen}', bereich={bereich} WHERE id={id};")
        losgroessen.table_update(id, data["los"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def create(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        name = trim_string(data["name"])
        lang = data["einheit"]
        if lang not in lang_zu_kurz:
            raise Exception("Bitte wähle eine Einheit aus.")
        kurz = lang_zu_kurz[lang]
        for _ in connection.get(f"SELECT * FROM Getraenke WHERE name='{name}';"):
            raise Exception("Der Name ist schon vergeben.")
        id = connection.get_new_id("Getraenke")
        reste = int(data["reste"])
        notizen = trim_string(data["notizen"])
        bereich = "null" if data["bereich"] is None else data["bereich"]
        connection.execute(f"INSERT INTO Getraenke VALUES ({id}, '{name}', '{lang}', '{kurz}', 1, {reste}, '{notizen}', {bereich});")
        losgroessen.table_update(id, data["los"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def get_kosten(id: int, jahr=None, start_jahr=None) -> Union[None, float]:
    if jahr is None:
        jahr = datetime.datetime.now().year
    if start_jahr is None:
        start_jahr = jahr
    for row in connection.get(f'''SELECT SUM(gesamt_netto)/SUM(orig_menge)
                                  FROM EinkaufArtikel
                                  INNER JOIN Einkaeufe
                                  ON EinkaufArtikel.einkauf=Einkaeufe.id
                                  WHERE getraenk={id}
                                  AND STRFTIME('%Y', datum)='{jahr}';'''):
        value = row[0]
    if value is None:
        if start_jahr - jahr < 3:
            return get_kosten(id, jahr-1, start_jahr)
        else:
            return -1
    else:
        return value


def get_einkauf_menge(id: int, von: str, bis: str) -> float:
    for row in connection.get(f'''
            SELECT SUM(orig_menge)
            FROM EinkaufArtikel
            INNER JOIN Einkaeufe ON EinkaufArtikel.einkauf=Einkaeufe.id
            WHERE getraenk = {id}
            AND datum >= DATETIME('{von}')
            AND datum <= DATETIME('{bis}');'''):
        return row[0]


def get_oeffnungsverbrauch_menge(id: int, von: str, bis: str) -> float:
    for row in connection.get(f'''
            SELECT SUM(differenz_orig)
            FROM OeffnungenVerbrauch
            INNER JOIN Oeffnungen ON OeffnungenVerbauch.oeffnung=Oeffnungen.id
            WHERE getraenk = {id}
            AND datum >= DATETIME('{von}')
            AND datum <= DATETIME('{bis}');'''):
        return row[0]


def get_pages(pagesize: int, page: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f"""SELECT id, name, einheit_lang, einheit_kurz
                                  FROM Getraenke
                                  WHERE sichtbar=1
                                  ORDER BY name
                                  LIMIT {page * pagesize}, {pagesize}"""):
        yield {
            "id": row[0],
            "name": row[1],
            "einheit_lang": row[2],
            "einheit_kurz": row[3]
        }