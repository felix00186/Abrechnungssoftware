from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import codecs
import webbrowser

import arten
import artikel
import einkaeufe
import oeffnungen
import abrechnung
import bilanz
import kalkulationen
import inventur
import losgroessen
import connection

hostName = "localhost"
port = 1987
with codecs.open("../Frontend/sektionen/sektion.txt", "r", "utf-8") as f: sektion = f.read().strip()


class MyServer(BaseHTTPRequestHandler):

    def do_GET(self):
        if not self.path.startswith("/func"):
            self.path = self.path.replace("SEKTION", sektion)
            self.send_response(200)
            splitted = self.path.split("?")
            self.path = splitted[0]
            image = False
            if self.path == "/":
                self.path = "/index.html"
            if self.path.endswith("html"):
                self.send_header("Content-Type", "text/html")
            elif self.path.endswith("js"):
                self.send_header("Content-Type", "application/javascript")
            elif self.path.endswith("csv"):
                self.send_header("Content-Type", "text/csv")
            elif self.path.endswith("png"):
                self.send_header("Content-Type", "image/png")
                image = True
            elif self.path.endswith("svg"):
                self.send_header("Content-Type", "image/svg+xml")
            else:
                self.send_header("Content-Type", "application/json")
            self.end_headers()
            try:
                if image:
                    with open("../Frontend" + self.path, "rb") as f:
                        self.wfile.write(f.read())
                else:
                    with codecs.open("../Frontend" + self.path, "r", "UTF-8") as f:
                        self.wfile.write(bytes(f.read(), "utf-8"))
            except:
                self.wfile.write(bytes("{'message': 'requested path is not valid'}", "utf-8"))

    def do_POST(self):
        path = self.path
        resp = {"success": False, "message": "Die URL ist ungültig."}
        if path.startswith("/func"):
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                data = json.loads(self.rfile.read(content_length).decode("UTF-8"))
            else:
                data = None
            print(data)
            path = path.replace("/func", "", 1)
            if path.startswith("/artikel"):
                path = path.replace("/artikel", "", 1)
                if path.startswith("/liste"):
                    resp = list(artikel.get_list(False, False))
                elif path.startswith("/mit_losgroessen"):
                    resp = list(artikel.get_list(False, True))
                elif path.startswith("/delete"):
                    resp = artikel.delete(data["id"])
                elif path.startswith("/edit"):
                    resp = artikel.edit(data["id"], data)
                elif path.startswith("/create"):
                    resp = artikel.create(data)
                elif path.startswith("/kosten"):
                    resp = list(artikel.get_list(True))
                elif path.startswith("/infoliste"):
                    resp = list(artikel.get_infolist(data["jahr"]))
                elif path.startswith("/einkaeufe"):
                    resp = list(artikel.get_einkaeufe(data["id"], data["jahr"]))
                elif path.startswith("/verbrauche"):
                    resp = list(artikel.get_verbrauche(data["id"], data["jahr"]))
                elif path.startswith("/pages"):
                    resp = list(artikel.get_pages(data["size"], data["page"]))
            elif path.startswith("/arten"):
                path = path.replace("/arten", "", 1)
                if path.startswith("/listeohnenull"):
                    resp = list(arten.get_list(False))
                elif path.startswith("/liste"):
                    resp = list(arten.get_list(True))
                elif path.startswith("/artikel"):
                    resp = list(arten.get_artikel(data["id"]))
                elif path.startswith("/delete"):
                    resp = arten.delete(data["id"])
                elif path.startswith("/edit"):
                    resp = arten.edit(data["id"], data)
                elif path.startswith("/create"):
                    resp = arten.create(data)
                elif path.startswith("/pages"):
                    resp = list(arten.get_pages(data["size"], data["page"]))
            elif path.startswith("/einkaeufe"):
                path = path.replace("/einkaeufe", "", 1)
                if path.startswith("/liste"):
                    resp = list(einkaeufe.get_list(jahr=data["jahr"]))
                elif path.startswith("/artikel"):
                    resp = list(einkaeufe.get_artikel(data["id"]))
                elif path.startswith("/delete"):
                    resp = einkaeufe.delete(data["id"])
                elif path.startswith("/edit"):
                    resp = einkaeufe.edit(data["id"], data)
                elif path.startswith("/create"):
                    resp = einkaeufe.create(data)
                elif path.startswith("/pages"):
                    resp = list(einkaeufe.get_pages(data["date"], data["size"], data["page"]))
            elif path.startswith("/oeffnungen"):
                path = path.replace("/oeffnungen", "", 1)
                if path.startswith("/liste"):
                    resp = list(oeffnungen.get_liste(jahr=data["jahr"]))
                elif path.startswith("/delete"):
                    resp = oeffnungen.delete(data["id"])
                elif path.startswith("/edit"):
                    resp = oeffnungen.edit(data["id"], data)
                elif path.startswith("/create"):
                    resp = oeffnungen.create(data)
                elif path.startswith("/artikel"):
                    resp = list(oeffnungen.get_artikel(data["id"]))
                elif path.startswith("/einnahmen"):
                    resp = list(oeffnungen.get_einnahmen(data["id"]))
                elif path.startswith("/pages"):
                    resp = list(oeffnungen.get_pages(data["date"], data["size"], data["page"]))
            elif path.startswith("/abrechnung"):
                path = path.replace("/abrechnung", "", 1)
                if path.startswith("/oeffnungen"):
                    resp = list(abrechnung.get_oeffnungen(data["von"], data["bis"]))
                elif path.startswith("/verbrauch"):
                    resp = list(abrechnung.get_verbrauch(data))
                elif path.startswith("/auswahl/get"):
                    resp = list(abrechnung.get_getraenkeauswahl())
                elif path.startswith("/auswahl/set"):
                    abrechnung.set_getraenkeauswahl(data)
                    resp = None
            elif path.startswith("/bilanz"):
                path = path.replace("/bilanz", "", 1)
                if path.startswith("/einnahmen"):
                    resp = list(bilanz.einnahmen_nach_kategorie(data["von"], data["bis"]))
                elif path.startswith("/detail"):
                    resp = bilanz.get_detailbilanz(data["von"], data["bis"])
                elif path.startswith("/einkaeufe"):
                    resp = list(einkaeufe.get_list(von=data["von"], bis=data["bis"]))
            elif path.startswith("/kalk"):
                path = path.replace("/kalk", "", 1)
                if path.startswith("/liste"):
                    resp = list(kalkulationen.get_liste())
                elif path.startswith("/create"):
                    resp = kalkulationen.create(data)
                elif path.startswith("/edit"):
                    resp = kalkulationen.edit(data)
                elif path.startswith("/delete"):
                    resp = kalkulationen.remove(data["id"])
                elif path.startswith("/details"):
                    resp = kalkulationen.get_details(data["id"])
                elif path.startswith("/diagramm"):
                    resp = list(kalkulationen.get_diagramme(data))
                elif path.startswith("/set_prices"):
                    resp = kalkulationen.set_preise(data)
            elif path.startswith("/inventur"):
                path = path.replace("/inventur", "", 1)
                if path.startswith("/liste"):
                    resp = list(inventur.get_liste(jahr=data["jahr"]))
                elif path.startswith("/delete"):
                    resp = inventur.delete(data["id"])
                elif path.startswith("/edit"):
                    resp = inventur.edit(data["id"], data)
                elif path.startswith("/create"):
                    resp = inventur.create(data)
                elif path.startswith("/vergleich"):
                    resp = inventur.get_abweichungen(data["id"])
                elif path.startswith("/stand"):
                    resp = list(inventur.get_letzter_stand())
                elif path.startswith("/artikelliste"):
                    resp = list(inventur.get_articles(data["id"]))
            elif path.startswith("/losgroessen"):
                path = path.replace("/losgroessen", "", 1)
                if path.startswith("/create"):
                    resp = losgroessen.create(data["artikel"], data)
                elif path.startswith("/edit"):
                    resp = losgroessen.update(data["id"], data)
                elif path.startswith("/delete"):
                    resp = losgroessen.delete(data["id"])
                elif path.startswith("/get"):
                    resp = list(losgroessen.get(data["artikel"]))
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            print(resp)
            self.wfile.write(bytes(json.dumps(resp), "utf-8"))


connection.init_db()
webbrowser.open(f"http://{hostName}:{port}", new=0, autoraise=True)

webServer = HTTPServer((hostName, port), MyServer)
try:
    webServer.serve_forever()
except KeyboardInterrupt:
    webServer.server_close()
    print("ENDE")
