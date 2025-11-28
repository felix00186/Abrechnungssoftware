import datetime

def get_kosten(db, id: int, jahr=None, start_jahr=None):
    if jahr is None:
        jahr = datetime.datetime.now().year
    if start_jahr is None:
        start_jahr = jahr
    for row in db.execute(f'''SELECT SUM(gesamt_netto)/SUM(menge)
                                  FROM EinkaufArtikel
                                  INNER JOIN Einkaeufe
                                  ON EinkaufArtikel.einkauf=Einkaeufe.id
                                  WHERE getraenk={id}
                                  AND STRFTIME('%Y', datum)='{jahr}';'''):
        value = row[0]
    if value is None:
        if start_jahr - jahr < 3:
            return get_kosten(db, id, jahr-1, start_jahr)
        else:
            return -1
    else:
        return value

def preis_string(p):
    if p is None:
        return "?"
    return f"{p/100:.2f} €"