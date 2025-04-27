class ArtikeltabelleColumns {

    constructor() {
        this.list = [];
    }

    addNameColumn(title='Name') {
        this.list.push({type: 'name', title: title});
    }

    addLosgroesseColumn(title='Losgröße') {
        this.list.push({type: 'losgroesse', title: title});
    }

    addValueColumn(title='Anzahl', positive=true) {
        this.list.push({type: 'value', title: title, factor: positive ? 1 : -1});
    }

    addSumColumn(title, summands) {
        this.list.push({type: 'sum', title: title, summands: summands});
    }

    addCostColumn(title, amount) {
        this.list.push({type: 'cost', title: title, amount: amount});
    }

    addNumberColumn(title) {
        this.list.push({type: 'number', title: title});
    }

    addDeleteColumn() {
        this.list.push({type: 'delete', title: '&#x1F5D1;&#xFE0F;'});
    }
}


class Artikeltabelle {

    constructor(columns, artikel_list, oeffnung_list, oeffnung_id, parent) {
        this.artikel_list = artikel_list;
        this.oeffnung_list = oeffnung_list;
        this.oeffnung_id = oeffnung_id;
        this.columns = columns.list;
        this.parent = parent;
        this.articles = {};
        if (oeffnung_id == null) {
            this.verbauch_list = [];
        } else {
            get_json('/func/oeffnungen/artikel', {'id': oeffnung_id})
                .then(resp => {this.verbrauch_list = resp;});
        }
    }

    loadOeffnung() {
        // Artikel von Öffnung laden
    }

    createTable() {
        this.output = document.createElement('table');
        this.output.className = 'standard';
        this.title_row = document.createElement('tr');
        this.output.appendChild(this.title_row);
        this.columns.forEach(col_scheme => {
            const col = document.createElement('th');
            this.title_row.appendChild(col);
            col.innerHTML = col_scheme.title;
        });
        this.parent.appendChild(this.output);
    }

    addLine(id, ...values) {
        if (id in this.articles) {

        } else {
            
        }
    }

    renderArticle(id) {

    }
}