window.addEventListener('load', _ => { 
    // heutiges Datum in das Bis-Eingabefeld eintragen
    const datum = new Date();
    const date_string = `${datum.getFullYear()}-${String(datum.getMonth()+1).padStart(2, '0')}-${String(datum.getDate()+1).padStart(2, '0')}`;
    console.log(date_string);
    document.getElementById('date_bis').value = date_string;
    // Standard-Artikel abfragen
    get_json('/func/abrechnung/auswahl/get', {}).then(std_auswahl => {
        // Artikel in die Tabelle eintragen
        const artikel_table = document.getElementById('artikel_table');
        const alle_checkbox_1 = artikel_table.querySelector('#alle');
        alle_checkbox_1.addEventListener('change', _ => tableAllCheckChange(alle_checkbox_1, artikel_table));
        get_json('/func/artikel/liste', {}).then(resp => {
            resp.forEach(item => {
                const row = document.createElement('tr');
                artikel_table.appendChild(row);
                row.setAttribute('data-id', item.id);
                let cell = document.createElement('td');
                row.appendChild(cell);
                const checkbox = document.createElement('input');
                cell.appendChild(checkbox);
                checkbox.type = 'checkbox';
                if (std_auswahl.includes(item.id))
                    checkbox.checked = true;
                checkbox.addEventListener('change', _ => tableCheckChange(artikel_table));
                cell = document.createElement('td');
                row.appendChild(cell);
                cell.textContent = item.name;
            });
        });
    });
    // Öffnungs-Tabelle vorbereiten
    const oeffnung_tabelle = document.getElementById('oeffnung_tabelle');
    const alle_checkbox_2 = oeffnung_tabelle.querySelector('#alle');
    alle_checkbox_2.addEventListener('change', _ => tableAllCheckChange(alle_checkbox_2, oeffnung_tabelle));
});

function datePickerChange() {
    const von = document.getElementById('date_von').value;
    const bis = document.getElementById('date_bis').value;
    document.getElementById('zeitraum_button').disabled = von == null || bis == null;
}

function tableCheckChange(tabelle) {
    const haekchen = tabelle.querySelector('#alle');
    const states = Array.from(tabelle.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .map(row => row.querySelector('input').checked)
        .filter((value, index, self) => self.indexOf(value) === index);
    if (states.includes(true) && states.includes(false)) {
        haekchen.indeterminate = true;
    } else {
        haekchen.indeterminate = false;
        haekchen.checked = states.includes(true);
    }
}

function tableAllCheckChange(checkbox, tabelle) {
    Array.from(tabelle.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .map(row => row.querySelector('input'))
        .forEach(box => box.checked = checkbox.checked);
}

function dateSelection() {
    const von = document.getElementById('date_von').value;
    const bis = document.getElementById('date_bis').value;
    const tabelle = document.getElementById('oeffnung_tabelle');
    Array.from(tabelle.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .forEach(row => row.remove());
    get_json('/func/abrechnung/oeffnungen', {'von': von, 'bis': bis}).then(resp => {
        resp.forEach(item => {
            const row = document.createElement('tr');
            tabelle.appendChild(row);
            row.setAttribute('data-id', item.id);
            let cell = document.createElement('td');
            row.appendChild(cell);
            const checkbox = document.createElement('input');
            cell.appendChild(checkbox);
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', _ => tableCheckChange(tabelle));
            cell = document.createElement('td');
            row.appendChild(cell);
            cell.textContent = item.name;
            cell = document.createElement('td');
            row.appendChild(cell);
            cell.textContent = item.art;
            cell = document.createElement('td');
            row.appendChild(cell);
            cell.textContent = item.datum;
        });
    });
    document.getElementById('commit_button').disabled = false;
}

function erstelleBericht() {
    // Bericht zurücksetzen
    const liste = document.getElementById('oeffnung_liste');
    Array.from(liste.querySelectorAll('li'))
        .forEach(item => item.remove());
    const tabelle = document.getElementById('verbrauch_tabelle');
    Array.from(tabelle.querySelectorAll('tr'))
        .filter(row => !row.hasAttribute('data-title'))
        .forEach(item => item.remove());
    document.getElementById('datum_feld').textContent = new Date().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
    document.getElementById('bericht').style.display = 'block';
    document.getElementById('print_button').disabled = false;
    document.getElementById('bericht_notizen').innerHTML = document.getElementById('notizen').value.replace('\n', '<br>');
    // Öffnungsliste erstellen
    const oeff_tab = document.getElementById('oeffnung_tabelle');
    const oeffnungen = [];
    const oeff_ids = [];
    let alle = true;
    Array.from(oeff_tab.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .forEach(row => {
            const input = row.querySelector('input');
            if (input.checked) {
                oeffnungen.push(`${row.querySelectorAll('td')[1].textContent}, ${row.querySelectorAll('td')[3].textContent}`);
                oeff_ids.push(row.getAttribute('data-id'));
            } else {
                alle = false;
                return;
            }
        });
    if (alle) {
        const von = dateFromYYYYMMTTtoTTMMYYYY(document.getElementById('date_von').value);
        const bis = dateFromYYYYMMTTtoTTMMYYYY(document.getElementById('date_bis').value);
        const punkt = document.createElement('li');
        liste.appendChild(punkt);
        punkt.textContent = `alle Öffnungen vom ${von} bis zum ${bis}`;
    } else {
        oeffnungen.forEach(name => {
            const punkt = document.createElement('li');
            liste.appendChild(punkt);
            punkt.textContent = name;
        });
    }
    // Verbrauchsliste erstellen
    const artikel = Array.from(document.getElementById('artikel_table').querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .filter(row => row.querySelector('input').checked)
        .map(row => row.getAttribute('data-id'));
    const body = {'oeffnungen': oeff_ids, 'artikel': artikel};
    let index = 1;
    get_json('/func/abrechnung/verbrauch', body).then(resp => resp.forEach(item => {
        const row = document.createElement('tr');
        tabelle.appendChild(row);
        row.style.borderBottom = '1px solid darkgray';
        let td = document.createElement('td');
        row.appendChild(td);
        td.textContent = index.toString();
        td = document.createElement('td');
        row.appendChild(td);
        td.textContent = item.name;
        td = document.createElement('td');
        row.appendChild(td);
        td.textContent = getFloatString(item.menge);
        td = document.createElement('td');
        row.appendChild(td);
        td.textContent = item.einheit;
        index++;
    }));
    // Standard-Artikel speichern
    get_json('/func/abrechnung/auswahl/set', artikel);
}