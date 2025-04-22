import connection
import artikel
from string_functions import trim_string
from typing import Generator, Dict, Any, List


def get_liste(jahr) -> Generator[Dict[str, Any], None, None]:
    rows = []
    for row in connection.get(f"""SELECT id, 
                                         STRFTIME('%d.%m.%Y', datum), 
                                         STRFTIME('%Y-%m-%d', datum), 
                                         notizen, 
                                         name, 
                                         COUNT(artikel)
                                  FROM Inventuren
                                  INNER JOIN InventurArtikel ON Inventuren.id=InventurArtikel.inventur
                                  WHERE STRFTIME('%Y', datum)='{jahr}'
                                  GROUP BY inventur;"""):
        rows.append(row)
    for row in rows:
        art_rows = []
        for art_row in connection.get(f"SELECT artikel, menge FROM InventurArtikel WHERE inventur={row[0]};"):
            art_rows.append(art_row)
        kosten = sum([artikel.get_kosten(art_row[0]) * art_row[1] for art_row in art_rows])
        yield {
            "id": row[0],
            "datum": {
                "ansicht": row[1],
                "parsed": row[2]
            },
            "notizen": row[3],
            "name_": row[4],
            "artikel": row[5],
            "wert": int(kosten)
        }


def delete(id: int) -> Dict[str, Any]:
    try:
        connection.execute([f"DELETE FROM Inventuren WHERE id={id};",
                            f"DELETE FROM InventurArtikel WHERE inventur={id};"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def edit(id: int, data: Dict[str, Any], is_new=False) -> Dict[str, Any]:
    try:
        datum = data["datum"]
        for _ in connection.get(f"SELECT * FROM Inventuren WHERE datum=DATETIME('{datum}') AND NOT(id={id});"):
            raise ValueError("Für dieses Datum gibt es schon eine Inventur. Aus Gründen der Chronologieintegrität dürfen nicht zwei Inventuren am selben Tag gemacht werden.")
        befehle = []
        if not is_new:
            befehle.append(f"DELETE FROM Inventuren WHERE id={id};")
            befehle.append(f"DELETE FROM InventurArtikel WHERE inventur={id};")
        notizen = trim_string(data["notizen"])
        name = trim_string(data["name"])
        befehle.append(f"INSERT INTO Inventuren VALUES ({id}, DATETIME('{datum}'), '{notizen}', '{name}');")
        for artikel in data["artikel"]:
            art_id = artikel["id"]
            menge = artikel["menge"]
            if menge is None:
                menge = "null"
            befehle.append(f"INSERT INTO InventurArtikel VALUES ({id}, {art_id}, {menge});")
        connection.execute(befehle)
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def create(data: Dict[str, Any]) -> Dict[str, Any]:
    return edit(connection.get_new_id("Inventuren"), data, True)


def get_letzter_stand(datum=None, comp="<") -> Generator[Dict[str, Any], None, None]:
    artikels = list(artikel.get_list(True))
    if datum is None:
        datum_sql = ""
    else:
        datum_sql = f" AND datum{comp}DATETIME('{datum}')"
    for art in artikels:
        art_id = art["id"]
        block = False
        menge = 0
        datum = None
        for row in connection.get(f"""SELECT STRFTIME('%d.%m.%Y', datum), STRFTIME('%Y-%m-%d', datum), menge
                                      FROM Inventur
                                      INNER JOIN InventurArtikel ON Inventur.id=InventurArtikel.inventur
                                      WHERE artikel={art_id}{datum_sql}
                                      ORDER BY datum DESC;"""):
            if row[1] is not None and not block:
                menge = row[2]
                datum = (row[0], row[1])
                block = True
        if block:
            yield {
                **art,
                "datum": {
                    "ansicht": datum[0],
                    "parsed": datum[1]
                },
                "menge": menge,
                "gesamtwert": art["kosten"] * menge
            }


def get_articles(id):
    for row in connection.get(f"""SELECT artikel, name, menge, einheit_kurz
                                  FROM InventurArtikel
                                  INNER JOIN Getraenke ON InventurArtikel.artikel=Getraenke.id;"""):
        yield {
            "name": row[1],
            "id": row[0],
            "menge": row[2],
            "einheit": row[3]
        }


def get_abweichungen(id):
    for row in connection.get(f"SELECT STRFTIME('%Y-%m-%d', datum) FROM Inventuren WHERE id={id};"):
        datum = row[0]
    aktuell = get_letzter_stand(datum, "<=")
    davor = get_letzter_stand(datum, "<")
    davor = {e["id"]: e for e in davor}
    for art in aktuell:
        art_id = art["id"]
        menge_jetzt = art["menge"]
        datum_jetzt = art["datum"]["parsed"]
        if art_id in davor:
            menge_davor = davor[art_id]["menge"]
            datum_davor = davor[art_id]["datum"]["parsed"]
        else:
            menge_davor = 0
            datum_davor = "2000-01-01"
        if datum_jetzt == datum_davor:
            continue
        for row in connection.get(f"SELECT einheit_kurz FROM Getraenke WHERE id={art_id};"):
            einheit = row[0]
        differenz_ist = menge_jetzt - menge_davor
        # Berechnen der Einkäufe
        einkaeufe = []
        for row in connection.get(f"""SELECT STRFTIME('%d.%m.%Y', datum),
                                             laden,
                                             menge
                                      FROM Einkaeufe
                                      INNER JOIN EinkaufArtikel ON Einkaeufe.id=EinkaufArtikel.einkauf
                                      WHERE getraenk={art_id}
                                      AND datum BETWEEN DATETIME('{datum_davor}') AND DATETIME('{datum_jetzt}')
                                      ORDER BY datum;"""):
            einkaeufe.append({
                "datum": row[0],
                "laden": row[1],
                "menge": row[2]
            })
        einkaeufe_summe = sum([e["menge"] for e in einkaeufe])
        # Berechnen der Verbrauche
        verbrauche = []
        for row in connection.get(f"""SELECT STRFTIME('%d.%m.%Y', datum),
                                             Oeffnungen.name,
                                             Oeffnungsarten.name,
                                             differenz
                                      FROM Oeffnungen
                                      INNER JOIN Oeffnungsarten ON Oeffnungen.art=Oeffnungsarten.id
                                      INNER JOIN OeffnungenVerbrauch ON Oeffnungen.id=OeffnungenVerbrauch.oeffnung
                                      WHERE getraenk={art_id}
                                      AND datum BETWEEN DATETIME('{datum_davor}') AND DATETIME('{datum_jetzt}')
                                      AND NOT(Oeffnungsarten.name='Abschreibungen')
                                      AND differenz>0;"""):
            verbrauche.append({
                "datum": row[0],
                "name_": row[1],
                "art": row[2],
                "menge": row[3]
            })
        verbrauche_summe = sum([e["menge"] for e in verbrauche])
        # vergangene Abschreibungen
        abschreibungen = []
        for row in connection.get(f"""SELECT STRFTIME('%d.%m.%Y', datum),
                                             Oeffnungen.name,
                                             differenz
                                      FROM Oeffnungen
                                      INNER JOIN Oeffnungsarten ON Oeffnungen.art=Oeffnungsarten.id
                                      INNER JOIN OeffnungenVerbrauch ON Oeffnungen.id=OeffnungenVerbrauch.oeffnung
                                      WHERE getraenk={art_id}
                                      AND datum BETWEEN DATETIME('{datum_davor}') AND DATETIME('{datum_jetzt}')
                                      AND Oeffnungsarten.name='Abschreibungen'
                                      AND differenz>0;"""):
            abschreibungen.append({
                "datum": row[0],
                "name_": row[1],
                "menge": row[2]
            })
        abschreibungen_summe = sum([e["menge"] for e in abschreibungen])
        # automatische Zuweisung zu Bereichen
        zug_bereich = None
        for row in connection.get(f"""SELECT Oeffnungsarten.name
                                      FROM Getraenke
                                      INNER JOIN Oeffnungsarten ON Getraenke.bereich=Oeffnungsarten.id
                                      WHERE Getraenke.id={art_id};"""):
            zug_bereich = row[0]
        # Berechnungen
        differenz_soll = einkaeufe_summe - verbrauche_summe - abschreibungen_summe
        luecke = differenz_soll - differenz_ist
        if zug_bereich is None:
            bereich_summe = 0
        else:
            if luecke < 0:
                bereich_summe = luecke
                luecke = 0
            else:
                bereich_summe = 0
        # Ausgabe
        yield {
            "datum": {
                "jetzt": datum_jetzt,
                "davor": datum_davor
            },
            "menge": {
                "jetzt": menge_jetzt,
                "davor": menge_davor
            },
            "einkaeufe": {
                "summe": einkaeufe_summe,
                "list": einkaeufe
            },
            "verbrauche": {
                "summe": verbrauche_summe,
                "list": verbrauche
            },
            "abschreibungen": {
                "summe": abschreibungen_summe,
                "list": abschreibungen
            },
            "bereich": {
                "name_": zug_bereich,
                "summe": bereich_summe
            },
            "luecke": luecke,
            "einheit": einheit
        }
