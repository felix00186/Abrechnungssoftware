from typing import Generator, Dict, Any
import connection


def get_oeffnungen(von: str, bis: str) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''SELECT Oeffnungen.id,
                                         Oeffnungen.name,
                                         STRFTIME('%d.%m.%Y', datum),
                                         Oeffnungsarten.name
                                  FROM Oeffnungen
                                  INNER JOIN Oeffnungsarten ON Oeffnungen.art=Oeffnungsarten.id
                                  WHERE datum <= DATETIME('{bis}') AND datum >= DATETIME('{von}')
                                  AND Oeffnungen.id IN (SELECT oeffnung FROM OeffnungenVerbrauch)
                                  ORDER BY datum DESC;'''):
        yield {
            "id": row[0],
            "name": row[1],
            "datum": row[2],
            "art": row[3]
        }


def get_verbrauch(data: Dict[str, list]) -> Generator[Dict[str, Any], None, None]:
    oeffnungen = ", ".join(data["oeffnungen"])
    artikel = ", ".join(data["artikel"])
    for row in connection.get(f'''SELECT getraenk, SUM(differenz) AS menge, name, einheit_lang
                                  FROM OeffnungenVerbrauch
                                  INNER JOIN Getraenke ON OeffnungenVerbrauch.getraenk=Getraenke.id
                                  WHERE oeffnung IN ({oeffnungen})
                                  AND getraenk IN ({artikel})
                                  GROUP BY getraenk, name, einheit_lang
                                  HAVING SUM(differenz) > 0
                                  ORDER BY name;'''):
        yield {
            "name": row[2],
            "id": row[0],
            "menge": row[1],
            "einheit": row[3]
        }


def get_getraenkeauswahl() -> Generator[int, None, None]:
    for row in connection.get("SELECT getraenk FROM VerbrauchsabrechnungStandardArtikel;"):
        yield row[0]


def set_getraenkeauswahl(data):
    connection.execute("DELETE FROM VerbrauchsabrechnungStandardArtikel;")
    valuelist = ",".join([f"({e})" for e in data])
    connection.execute(f"INSERT INTO VerbrauchsabrechnungStandardArtikel VALUES {valuelist};")
