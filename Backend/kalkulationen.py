import artikel
import connection
from typing import Generator, Dict, Any
from string_functions import trim_string


def get_liste() -> Generator[Dict[str, Any], None, None]:
    for row in connection.get("SELECT id, name, preis, notizen, anzeigen FROM Kalkulationen ORDER BY name;"):
        yield {"id": row[0], "name": row[1], "preis": row[2], "notizen": row[3], "anzeigen": bool(row[4])}


def create(data: Dict[str, Any], id=None):
    try:
        if id is None:
            id = connection.get_new_id("Kalkulationen")
        name = trim_string(data["name"])
        notizen = trim_string(data["notizen"])
        anzeigen = int(data["anzeigen"])
        connection.execute(f"INSERT INTO Kalkulationen VALUES ({id}, '{name}', {data['preis']}, '{notizen}', {anzeigen});")
        for a in data["artikel"]:
            connection.execute(f"INSERT INTO KalkulationenArtikel VALUES ({id}, {a['id']}, {a['menge']});")
        for a in data["sonstige"]:
            name = trim_string(a["name"])
            connection.execute(f"INSERT INTO KalkulationenSonstigeArtikel VALUES ({id}, '{name}', {a['preis']}, {a['menge']});")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def edit(data: Dict[str, Any]):
    msg1 = remove(data["id"])
    if msg1["success"]:
        return create(data, data["id"])
    else:
        return msg1


def remove(id: int):
    try:
        connection.execute(f"DELETE FROM Kalkulationen WHERE id={id};")
        connection.execute(f"DELETE FROM KalkulationenArtikel WHERE kalk={id};")
        connection.execute(f"DELETE FROM KalkulationenSonstigeArtikel WHERE kalk={id};")
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def get_details(id: int) -> Dict[str, Any]:
    data = {"artikel": {"standard": [], "sonstige": []}}
    for row in connection.get(f"SELECT name, preis FROM Kalkulationen WHERE id={id};"):
        data["name"] = row[0]
        data["preis"] = row[1]
    rows = []
    for row in connection.get(f'''
            SELECT artikel, menge, name, einheit_kurz
            FROM KalkulationenArtikel
            INNER JOIN Getraenke ON KalkulationenArtikel.artikel=Getraenke.id
            WHERE kalk={id}
            ORDER BY name;'''):
        rows.append(row)
    for row in rows:
        data["artikel"]["standard"].append({
            "id": row[0],
            "name": row[2],
            "menge": row[1],
            "einheit": row[3],
            "kosten": artikel.get_kosten(row[0])
        })
    for row in connection.get(f"SELECT * FROM KalkulationenSonstigeArtikel WHERE kalk={id} ORDER BY name;"):
        data["artikel"]["sonstige"].append({
            "name": row[1],
            "einheit": row[2],
            "preis": row[3],
            "menge": row[4]
        })
    return data


def get_diagramme(data) -> Generator[Dict[str, Any], None, None]:
    for id in [e["id"] for e in get_liste() if e["anzeigen"]]:
        item = get_details(id)
        standard = item["artikel"]["standard"]
        sonstige = item["artikel"]["sonstige"]
        kosten = [e["kosten"] * e["menge"] for e in standard]
        kosten += [e["preis"] * e["menge"] for e in sonstige]
        if min(kosten) < 0:
            continue
        kosten = sum(kosten)
        preis_brutto = item["preis"]
        preis_original = preis_brutto
        if str(id) in data:
            preis_brutto = data[str(id)]
        if preis_brutto is None:
            continue
        ohne_mwst = preis_brutto / 1.19
        mwst = preis_brutto - ohne_mwst
        preis_netto = ohne_mwst / 1.1
        zehnt = ohne_mwst - preis_netto
        gewinn = preis_netto - kosten
        faktor = preis_netto / kosten
        yield {
            "waren": kosten,
            "mwst": mwst,
            "zehnt": zehnt,
            "gewinn": gewinn,
            "name": item["name"],
            "preis": preis_brutto,
            "faktor": faktor,
            "id": id,
            "preis_original": None if preis_brutto == preis_original else preis_original
        }


def set_preise(data):
    for e in data:
        id = e[0]
        preis = e[1]
        connection.execute(f"UPDATE Kalkulationen SET preis={preis} WHERE id={id};")
    return {}
