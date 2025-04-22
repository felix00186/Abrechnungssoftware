const Kategorien = Object.freeze({
    EINKAUF:    Symbol('einkaeufe'),
    OEFFNUNG:   Symbol('oeffnungen'),
    ARTIKEL:    Symbol('artikel'),
    BEREICH:    Symbol('arten')
});


class Auswahlliste {

    constructor(div, kategorie, startdate, pagesize) {
        this.div = div;
        this.startdate = startdate;
        this.pagesize = pagesize;
        this.kategorie = kategorie;
        this.page = 0;
        this.cache = {};
        // Tabelle erstellen
        this.table = document.createElement('table');
        div.appendChild(this.table);
        this.table.className = 'standard';
        const title_row = document.createElement('tr');
        this.table.appendChild(title_row);
        const checkall_cell = document.createElement('th');
        title_row.appendChild(checkall_cell);
        this.checkall = document.createElement('input');
        checkall_cell.appendChild(this.checkall);
        this.checkall.type = 'checkbox';
        this.checkall.addEventListener('change', _ => this.checkAllChange());
        switch (kategorie) {
            case Kategorien.ARTIKEL: {
                this.title_keywords = ['Artikel'];
                this.object_keywords = ['name'];
                break;
            }
            case Kategorien.BEREICH: {
                this.title_keywords = ['Bereich'];
                this.object_keywords = ['name'];
                break;
            }
            case Kategorien.EINKAUF: {
                this.title_keywords = ['Geschäft', 'Datum'];
                this.object_keywords = ['laden', 'datum_ansicht'];
                break;
            }
            case Kategorien.OEFFNUNG: {
                this.title_keywords = ['Öffnung', 'Datum'];
                this.object_keywords = ['name', 'datum_ansicht'];
                break;
            }
        }
        this.title_keywords.forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            title_row.appendChild(th);
        });
        // mehr laden
        this.button = document.createElement('button');
        div.appendChild(this.button);
        this.button.textContent = 'mehr laden ...';
        this.button.style.minWidth = '45%';
        this.button.style.justifySelf = 'center';
        this.button.style.display = 'flex';
        this.button.style.justifyContent = 'center';
        this.button.addEventListener('click', _ => this.loadPage());
        // erste Seite laden
        this.loadPage();
    }

    loadPage() {
        this.button.disabled = true;
        get_json(`/func/${this.kategorie.description}/pages`, 
            {'size': this.pagesize, 'page': this.page, 'date': this.startdate})
            .then(resp => {
                resp.forEach(item => {
                    const row = document.createElement('tr');
                    this.table.appendChild(row);
                    let cell = document.createElement('td');
                    row.appendChild(cell);
                    const checkbox = document.createElement('input');
                    cell.appendChild(checkbox);
                    checkbox.type = 'checkbox';
                    checkbox.checked = this.checkall.checked;
                    checkbox.setAttribute('data-id', item.id);
                    this.cache[item.id] = item;
                    this.object_keywords.forEach(key => {
                        cell = document.createElement('td');
                        row.appendChild(cell);
                        cell.textContent = item[key];
                    });
                });
                this.page++;
                this.button.disabled = false;
                if (resp.length < this.pagesize)
                    this.button.remove();
            });
        console.log(this.getItems());
    }

    checkAllChange() {
        [...this.table.querySelectorAll('input')]
        .forEach(box => box.checked = this.checkall.checked);
    }

    getItems() {
        return [...this.table.querySelectorAll('input')]
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.getAttribute('data-id'))
            .filter(value => value != null)
            .map(s => this.cache[parseInt(s)]);
    }

    setItems(items) {
        [...this.table.querySelectorAll('input')]
        .filter(box => items.includes(parseInt(box.getAttribute('data-id'))))
        .forEach(box => { box.checked = true; });
    }

}