import connection
from typing import Generator, Dict, Any, List
from string_functions import trim_string


def get_list(jahr=None, von=None, bis=None) -> Generator[Dict[str, Any], None, None]:
    if jahr is not None:
        von = f"{jahr}-01-01"
        bis = f"{jahr}-12-31"
    for row in connection.get(f'''WITH Artikellisten AS (
                                    SELECT einkauf, GROUP_CONCAT(name, '$$') AS artikelliste
                                    FROM (SELECT DISTINCT einkauf, getraenk FROM EinkaufArtikel) EArt
                                    INNER JOIN Getraenke ON EArt.getraenk=Getraenke.id
                                    GROUP BY einkauf
                                  ), Bereichlisten AS (
                                    SELECT einkauf, GROUP_CONCAT(name, '$$') AS bereichliste
                                    FROM (SELECT DISTINCT einkauf, bereich FROM EinkaufBereich) EBer
                                    INNER JOIN Oeffnungsarten ON EBer.bereich=Oeffnungsarten.id
                                    GROUP BY einkauf
                                  ), Oeffnungslisten AS (
                                    SELECT einkauf, GROUP_CONCAT(name, '$$') AS oeffnungsliste
                                    FROM (SELECT DISTINCT einkauf, oeffnung FROM EinkaufOeffnung) EOeff
                                    INNER JOIN Oeffnungen ON EOeff.oeffnung=Oeffnungen.id
                                    GROUP BY einkauf
                                  )
                                  SELECT id,
                                         laden, 
                                         STRFTIME('%d.%m.%Y', datum), 
                                         STRFTIME('%Y-%m-%d', datum),
                                         artikelliste,
                                         bereichliste,
                                         oeffnungsliste,
                                         EinkaeufeJahr.notizen,
                                         einkaeufer
                                  FROM (    SELECT * 
                                            FROM Einkaeufe 
                                            WHERE datum>=DATETIME('{von}') 
                                            AND datum<=DATETIME('{bis}')
                                        ) EinkaeufeJahr
                                  LEFT JOIN Artikellisten ON EinkaeufeJahr.id=Artikellisten.einkauf
                                  LEFT JOIN Bereichlisten ON EinkaeufeJahr.id=Bereichlisten.einkauf
                                  LEFT JOIN Oeffnungslisten ON EinkaeufeJahr.id=Oeffnungslisten.einkauf
                                  ORDER BY datum DESC;'''):
        yield {
            "id": row[0],
            "laden": row[1],
            "datum": {
                "ansicht": row[2],
                "parsed": row[3]
            },
            "artikel": [item for sublist in [[] if row[col] is None else row[col].split("$$") for col in range(4, 7)] for item in sublist],
            "kategorien": [item for sublist in [[kat] * len(col) for col, kat in zip([[] if row[i] is None else row[i] for i in range(4, 7)], ["A", "B", "O"])] for item in sublist],
            "notizen": row[7],
            "einkaeufer": row[8]
        }


def get_artikel(id: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''SELECT Getraenke.name,
                                    getraenk,
                                    menge,
                                    einheit_kurz,
                                    gesamt_netto,
                                    einzel_netto,
                                    mwst,
                                    gesamt_brutto,
                                    einheit_lang,
                                    losgroesse
                                  FROM EinkaufArtikel
                                  INNER JOIN Getraenke ON EinkaufArtikel.getraenk=Getraenke.id
                                  WHERE EinkaufArtikel.einkauf={id}
                                  ORDER BY Getraenke.name;'''):
        yield {
            "artikel": {
                "name": row[0],
                "id": row[1],
                "einheit": row[3],
                "einheit_lang": row[8]
            },
            "menge": row[2],
            "gesamt": {
                "netto": row[4],
                "brutto": row[7]
            },
            "einzel": {
                "netto": row[5]
            },
            "mwst": row[6],
            "kategorie": "artikel",
            "los": row[9]
        }
    for row in connection.get(f'''SELECT Oeffnungsarten.name,
                                    bereich,
                                    netto,
                                    EinkaufBereich.mwst,
                                    brutto
                                  FROM EinkaufBereich
                                  INNER JOIN Oeffnungsarten ON EinkaufBereich.bereich=Oeffnungsarten.id
                                  WHERE EinkaufBereich.einkauf={id}
                                  ORDER BY Oeffnungsarten.name;'''):
        yield {
            "artikel": {
                "name": row[0],
                "id": row[1]
            },
            "gesamt": {
                "netto": row[2],
                "brutto": row[4]
            },
            "mwst": row[3],
            "kategorie": "bereich"
        }
    for row in connection.get(f'''SELECT Oeffnungen.name || ', ' || STRFTIME('%d.%m.%Y', datum),
                                    oeffnung,
                                    netto,
                                    mwst,
                                    brutto
                                  FROM EinkaufOeffnung
                                  INNER JOIN Oeffnungen ON EinkaufOeffnung.oeffnung=Oeffnungen.id
                                  WHERE EinkaufOeffnung.einkauf={id}
                                  ORDER BY Oeffnungen.name;'''):
        yield {
            "artikel": {
                "name": row[0],
                "id": row[1]
            },
            "gesamt": {
                "netto": row[2],
                "brutto": row[4]
            },
            "mwst": row[3],
            "kategorie": "öffnung"
        }


def delete(id: int) -> Dict[str, Any]:
    try:
        connection.execute([f"DELETE FROM Einkaeufe WHERE id={id};",
                            f"DELETE FROM EinkaufArtikel WHERE einkauf={id};",
                            f"DELETE FROM EinkaufBereich WHERE einkauf={id};",
                            f"DELETE FROM EinkaufOeffnung WHERE einkauf={id};"])
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def edit(id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        datum = data["datum"]
        laden = trim_string(data["name"])
        artikel = data["artikel"]
        notizen = trim_string(data["notizen"])
        einkaeufer = trim_string(data["einkaeufer"])
        sql_list = [f"UPDATE Einkaeufe SET datum=DATETIME('{datum}'), laden='{laden}', notizen='{notizen}', einkaeufer='{einkaeufer}' WHERE id={id};",
                    f"DELETE FROM EinkaufArtikel WHERE einkauf={id};",
                    f"DELETE FROM EinkaufOeffnung WHERE einkauf={id};",
                    f"DELETE FROM EinkaufBereich WHERE einkauf={id};"]
        for item in artikel:
            if item["kategorie"] == "artikel":
                los = "null" if item["los"] is None else item["los"]
                sql_list.append(f"INSERT INTO EinkaufArtikel VALUES ({id}, {item['id']}, {item['menge']}, {item['gesamtnetto']}, {item['einzelnetto']}, {item['mwst']}, {item['gesamtbrutto']}, {los}, {item['origmenge']}, null);")
            elif item["kategorie"] == "öffnung":
                sql_list.append(f"INSERT INTO EinkaufOeffnung VALUES ({id}, {item['id']}, {item['gesamtnetto']}, {item['mwst']}, {item['gesamtbrutto']});")
            elif item["kategorie"] == "bereich":
                sql_list.append(f"INSERT INTO EinkaufBereich VALUES ({id}, {item['id']}, {item['gesamtnetto']}, {item['mwst']}, {item['gesamtbrutto']});")
        connection.execute(sql_list)
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def create(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        id = connection.get_new_id("Einkaeufe")
        datum = data["datum"]
        laden = trim_string(data["name"])
        notizen = trim_string(data["notizen"])
        artikel = data["artikel"]
        einkaeufer = trim_string(data["einkaeufer"])
        sql_list = [f"INSERT INTO Einkaeufe VALUES ({id}, DATETIME('{datum}'), '{laden}', '{notizen}', '{einkaeufer}');"]
        for item in artikel:
            if item["kategorie"] == "artikel":
                los = "null" if item["los"] is None else item["los"]
                sql_list.append(f"INSERT INTO EinkaufArtikel VALUES ({id}, {item['id']}, {item['menge']}, {item['gesamtnetto']}, {item['einzelnetto']}, {item['mwst']}, {item['gesamtbrutto']}, {los}, {item['origmenge']}, null);")
            elif item["kategorie"] == "öffnung":
                sql_list.append(
                    f"INSERT INTO EinkaufOeffnung VALUES ({id}, {item['id']}, {item['gesamtnetto']}, {item['mwst']}, {item['gesamtbrutto']});")
            elif item["kategorie"] == "bereich":
                sql_list.append(
                    f"INSERT INTO EinkaufBereich VALUES ({id}, {item['id']}, {item['gesamtnetto']}, {item['mwst']}, {item['gesamtbrutto']});")
        connection.execute(sql_list)
    except Exception as e:
        return {"success": False, "message": str(e.with_traceback(None))}
    else:
        return {"success": True}


def get_pages(startdate: str, pagesize: int, page: int) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f"""SELECT id, laden, STRFTIME('%d.%m.%Y', datum), STRFTIME('%Y-%m-%d', datum)
                                  FROM Einkaeufe
                                  WHERE datum<=date('{startdate}')
                                  ORDER BY datum DESC
                                  LIMIT {page * pagesize}, {pagesize}"""):
        yield {
            "id": row[0],
            "laden": row[1],
            "datum_ansicht": row[2],
            "datum_parsed": row[3]
        }
