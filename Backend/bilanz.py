from typing import Generator, Dict, Any

import artikel
import connection


def einnahmen_nach_kategorie(von: str, bis: str) -> Generator[Dict[str, Any], None, None]:
    for row in connection.get(f'''  
            WITH EinnahmenSumme AS (
                SELECT oeffnung,
                    SUM(netto) AS netto,
                    SUM(brutto-brutto/(1+mwst/100.0)) AS mwst,
                    SUM((brutto/(1+mwst/100.0))-(brutto/(1+mwst/100.0))/(1+zehnt/100.0)) AS zehnt,
                    SUM(brutto) AS brutto
                FROM Einnahmen
                GROUP BY oeffnung
            )
            SELECT Oeffnungsarten.id,
                Oeffnungsarten.name,
                SUM(EinnahmenSumme.netto),
                SUM(EinnahmenSumme.mwst),
                SUM(EinnahmenSumme.zehnt),
                SUM(EinnahmenSumme.brutto)
            FROM Oeffnungen
            INNER JOIN Oeffnungsarten ON Oeffnungen.art=Oeffnungsarten.id
            INNER JOIN EinnahmenSumme ON Oeffnungen.id=EinnahmenSumme.oeffnung
            WHERE Oeffnungen.datum >= DATETIME('{von}')
            AND Oeffnungen.datum <= DATETIME('{bis}')
            GROUP BY Oeffnungsarten.id, Oeffnungsarten.name;'''):
        yield {
            "id": row[0],
            "name": row[1],
            "netto": row[2],
            "mwst": row[3],
            "zehnt": row[4],
            "brutto": row[5]
        }


def get_detailbilanz(von: str, bis: str):
    bereichsliste = []
    for row in connection.get("SELECT id, name, notizen FROM Oeffnungsarten;"):
        bereichsliste.append([*row])
    bereichsliste = [get_bereichsbilanz(*e, von, bis) for e in bereichsliste]
    bereichsliste = list(filter(lambda e: e["summe_einnahmen"]>0 or e["summe_ausgaben"]>0, bereichsliste))
    return {
        "bereiche": bereichsliste,
        "summe_einnahmen": sum([e["summe_einnahmen"] for e in bereichsliste]),
        "summe_ausgaben": sum([e["summe_ausgaben"] for e in bereichsliste])
    }


def get_bereichsbilanz(id: int, name: str, notizen: str, von: str, bis: str):
    # Einkäufe für den Bereich
    einkaufliste = []
    for row in connection.get(f'''
            WITH BerEinkauf AS (
                SELECT einkauf AS id, SUM(netto) AS netto
                FROM EinkaufBereich
                WHERE bereich={id}
                GROUP BY einkauf
            )
            SELECT id, STRFTIME('%d.%m.%y', datum), laden, netto
            FROM Einkaeufe
            NATURAL JOIN BerEinkauf
            ORDER BY datum;'''):
        einkaufliste.append({
            "id": row[0],
            "datum": row[1],
            "laden": row[2],
            "kosten": row[3]
        })
    # Verbrauch für den Bereich
    verbrauchsliste = []
    for row in connection.get(f'''
            SELECT Getraenke.name, getraenk, SUM(menge), Getraenke.einheit_kurz
            FROM EinkaufArtikel
            INNER JOIN Einkaeufe ON EinkaufArtikel.einkauf=Einkaeufe.id
            INNER JOIN Getraenke ON EinkaufArtikel.getraenk=Getraenke.id
            WHERE Getraenke.bereich = {id}
            AND Einkaeufe.datum >= DATETIME('{von}')
            AND Einkaeufe.datum <= DATETIME('{bis}')
            GROUP BY Getraenke.name, getraenk, Getraenke.einheit_kurz;'''):
        verbrauchsliste.append({
            "name": row[0],
            "id": row[1],
            "verbrauch": row[2],
            "einheit": row[3]
        })
    for item in verbrauchsliste:
        item["einkauf"] = artikel.get_einkauf_menge(item["id"], von, bis)
        item["kosten"] = artikel.get_kosten(item["id"], int(bis.split("-")[0]))
        item["differenz"] = item["einkauf"] - item["verbrauch"]
        item["bereichskosten"] = int(item["differenz"] * item["kosten"])
    verbrauchsliste = [{
        "name": item["name"],
        "menge": item["differenz"],
        "einheit": item["einheit"],
        "kosten": int(item["differenz"] * item["kosten"])
    } for item in verbrauchsliste]
    # Öffnungen
    oeffnungsliste = []
    for row in connection.get(f'''
            SELECT Oeffnungen.id, Oeffnungen.name, STRFTIME('%d.%m.%Y', Oeffnungen.datum), SUM(Einnahmen.netto)
            FROM Oeffnungen
            INNER JOIN Einnahmen ON Oeffnungen.id=Einnahmen.oeffnung
            WHERE art = {id}
            AND datum >= DATETIME('{von}')
            AND datum <= DATETIME('{bis}')
            GROUP BY Oeffnungen.id, Oeffnungen.datum, Oeffnungen.name
            ORDER BY datum;'''):
        oeffnungsliste.append([*row])
    # Ausgabe
    return {
        "id": id,
        "name": name,
        "notizen": notizen,
        "verbrauch": verbrauchsliste,
        "einkaeufe": einkaufliste,
        "summe_einnahmen": sum([row[3] for row in oeffnungsliste]),
        "summe_ausgaben": sum([e["kosten"] for e in einkaufliste]) + sum([e["kosten"] for e in verbrauchsliste]),
        "oeffnungen": [get_oeffnungsbilanz(*row) for row in oeffnungsliste]
    }


def get_oeffnungsbilanz(id, name, datum, einnahmen: int):
    # Einkäufe für die Öffnung
    einkaufliste = []
    for row in connection.get(f'''
            WITH OeffEinkauf AS (
                SELECT einkauf AS id, SUM(netto) AS netto
                FROM EinkaufOeffnung
                WHERE oeffnung={id}
                GROUP BY einkauf
            )
            SELECT id, STRFTIME('%d.%m.%Y', datum), laden, netto
            FROM Einkaeufe
            NATURAL JOIN OeffEinkauf
            ORDER BY datum;'''):
        einkaufliste.append({
            "id": row[0],
            "datum": row[1],
            "laden": row[2],
            "kosten": row[3]
        })
    # verbrauchte Artikel
    artikelliste = []
    rows = []
    for row in connection.get(f'''SELECT Getraenke.id,
                                         Getraenke.name AS name,
                                         Getraenke.einheit_kurz,
                                         differenz AS menge
                                   FROM OeffnungenVerbrauch
                                   INNER JOIN Getraenke ON OeffnungenVerbrauch.getraenk=Getraenke.id
                                   WHERE oeffnung={id}
                                   AND differenz > 0
                                   UNION ALL
                                   SELECT Getraenke.id,
                                        Getraenke.name || ' (weggeschüttet)' AS name,
                                        Getraenke.einheit_kurz,
                                        ende AS menge
                                    FROM OeffnungenVerbrauch
                                    INNER JOIN Getraenke ON OeffnungenVerbrauch.getraenk=Getraenke.id
                                    WHERE oeffnung={id}
                                    AND reste=0
                                    AND ende>0
                                    ORDER BY name;'''):
        rows.append(row)
    for row in rows:
        artikelliste.append({
            "name": row[1],
            "menge": row[3],
            "einheit": row[2],
            "kosten": artikel.get_kosten(row[0]) * row[3]
        })
    # Einnahmen
    einnahmenliste = []
    for row in connection.get(f"SELECT name, brutto, brutto-brutto/(1+mwst/100.0) AS mwst, (brutto/(1+mwst/100.0))-(brutto/(1+mwst/100.0))/(1+zehnt/100.0) AS zehnt, netto FROM Einnahmen WHERE oeffnung={id};"):
        einnahmenliste.append({
            "name": row[0],
            "brutto": row[1],
            "mwst": row[2],
            "zehnt": row[3],
            "netto": row[4]
        })
    # Ausgabe
    return {
        "name": name,
        "datum": datum,
        "summe_einnahmen": einnahmen,
        "summe_ausgaben": sum([e["kosten"] for e in artikelliste]) + sum([e["kosten"] for e in einkaufliste]),
        "einkaeufe": einkaufliste,
        "verbrauch": artikelliste,
        "einnahmen": einnahmenliste
    }