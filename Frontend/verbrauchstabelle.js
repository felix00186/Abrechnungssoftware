class Verbrauchstabelle {

    constructor(artikel_list, oeffnung_list, oeffnung_id, parent) {
        this.artikel_list = artikel_list;
        this.oeffnung_list = oeffnung_list;
        this.oeffnung_id = oeffnung_id;
        this.parent = parent;
        if (oeffnung_id == null) {
            this.verbauch_list = [];
        } else {
            get_json('/func/oeffnungen/artikel', {'id': oeffnung_id})
                .then(resp => {this.verbrauch_list = resp;});
        }
        this.createTable();
    }

    loadOeffnung() {
        // Artikel von Öffnung laden
    }

    createTable() {

    }

}