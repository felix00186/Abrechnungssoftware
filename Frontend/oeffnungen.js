window.addEventListener('load', _ => {
    jahr = new Date().getFullYear();
    loadTable();
});

jahr = null;
artikelliste = [];
bereichsliste = [];
oeffnungsliste = [];
kategorie_symbol = {'artikel': '&#x1F379;', 'öffnung': '&#x1F6AA;', 'bereich': '&#x1F4D9;'};

function setJahr(addition) {
    jahr += addition;
    loadTable();
}

function loadTable() {
    document.getElementById('jahreszahl').textContent = jahr.toString();
    const table = document.getElementById('oeffnungtable');
    table.innerHTML = '<tr style="font-weight:bold;"><td>Datum</td><td>Bezeichnung</td><td>Bereich</td><td>Einnahmen</td><td class="button_title"><small>Bear-<br>beiten</small></td><td class="button_title"><small>L&ouml;-<br>schen</small></td></tr>';
    get_json('/func/oeffnungen/liste', {'jahr': jahr}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id.toString());
            // Datum
            let td = document.createElement('td');
            td.innerHTML = item.datum.ansicht;
            tr.appendChild(td);
            // Bezeichnung
            td = document.createElement('td');
            td.textContent = item.name;
            tr.appendChild(td);
            // Bereich
            tr.setAttribute('data-bereich', item.art.id.toString());
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = item.art.name;
            // Einnahmen
            td = document.createElement('td');
            tr.appendChild(td);
            td.innerHTML = getPreisString(item.summe);
            // Bearbeiten-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F58A;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.name, item.notizen, item.datum.parsed, item.art.id, item.art.name, false));
            td.appendChild(button);
            tr.appendChild(td);
            // Müll-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F5D1;&#xFE0F;';
            button.addEventListener('click', _ => remove(item.id));
            td.appendChild(button);
            tr.appendChild(td);
            // Zeile anhängen
            table.appendChild(tr);
        });
    });
    if (artikelliste.length == 0) {
        get_json('/func/artikel/kosten', {}).then(list => {
            list.forEach(item => {
                artikelliste.push([item.id, item.name, item.einheit.lang, item.kosten]);
            });
        });
    }
    if (bereichsliste.length == 0) {
        get_json('/func/arten/liste', {}).then(list => {
            list.forEach(item => {
                bereichsliste.push([item.id, item.name]);
            });
        });
    }
    oeffnungsliste = [];
    for (let j = jahr; j <= new Date().getFullYear(); j++) {
        get_json('/func/oeffnungen/liste', {'jahr': j}).then(list => {
            list.forEach(item => {
                oeffnungsliste.push([item.id, `${item.name}, ${item.datum.ansicht}`]);
            });
        });
    }
}

function remove(id) {
    get_json('/func/oeffnungen/delete', {'id': id}).then(resp => {
        if (resp.success) {
            loadTable();
        } else {
            alert(resp.message);
        }
    });
    for (const div of document.getElementsByClassName('edit_field')) {
        if (div.getAttribute('data-id') == id.toString()) div.remove();
    }
}

article_edit_list = []

function openEditField(id, name_, notizen, datum_parsed, art_id, art_name, is_new) {
    let is_open = false;
    if (is_new) {
        id = -1;
        const datum_raw = new Date();
        const tag = String(datum_raw.getDate()).padStart(2, '0');
        const monat = String(datum_raw.getMonth() + 1).padStart(2, '0');
        const jahr = datum_raw.getFullYear();
        datum = `${tag}.${monat}.${jahr}`;
        datum_parsed = `${jahr}-${monat}-${tag}`;
    } else {
        article_edit_list.forEach(tuple => {
            if (tuple[0] == id) {
                const field = tuple[1];
                const parent = field.parentElement;
                parent.prepend(field);
                parent.prepend(document.getElementById('neu_button'));
                is_open = true;
            }
        });
    }
    if (!is_open) {
        const div = document.createElement('div');
        div.setAttribute('data-id', id.toString());
        div.className = 'edit_field';
        // Überschrift
        const h2 = document.createElement('h2');
        if (is_new) {
            h2.textContent = 'Neue Öffnung';
            h2.style.fontStyle = 'italic';
        } else {
            h2.textContent = name_;
        }
        div.appendChild(h2);
        // Name
        const table = document.createElement('table');
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.textContent = 'Bezeichnung:';
        tr.appendChild(td);
        td = document.createElement('td');
        const name_input = document.createElement('input');
        name_input.id = 'name';
        name_input.value = name_;
        name_input.style.width = '100%';
        td.appendChild(name_input);
        tr.appendChild(td);
        table.appendChild(tr);
        // Datum
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.textContent = 'Datum:';
        tr.appendChild(td);
        const datum_input = document.createElement('input');
        datum_input.id = 'datum';
        datum_input.type = 'date';
        datum_input.value = datum_parsed;
        td = document.createElement('td');
        td.appendChild(datum_input);
        tr.appendChild(td);
        table.appendChild(tr);
        // Art
        tr = document.createElement('tr');
        table.appendChild(tr);
        td = document.createElement('td');
        tr.appendChild(td);
        td.textContent = 'Bereich';
        td = document.createElement('td');
        tr.appendChild(td);
        const art_input = document.createElement('select');
        td.appendChild(art_input);
        art_input.id = 'art';
        bereichsliste.forEach(bereich => {
            const option = document.createElement('option');
            option.value = bereich[0].toString();
            option.textContent = bereich[1];
            if (bereich[0] == art_id) option.selected = true;
            art_input.appendChild(option);
        });
        art_input.addEventListener('change', event => {
            const art_number = parseInt(event.target.value);
            if (art_number == -1) return;
            get_json('/func/arten/artikel', {'id': art_number}).then(resp => {
                resp.forEach(item => {
                    const is_there = Array.from(artikel_table.querySelectorAll('tr'))
                                        .map(row => row.getAttribute('data-id') == item.id)
                                        .reduce((b1, b2) => b1 || b2);
                    if (!is_there) {
                        const tuple = artikelliste.filter(e => e[0] == item.id)[0];
                        addArtikelLine(artikel_table, tuple[0], tuple[1], 0, 0, 0, 0, tuple[3], tuple[2], item.losgroesse, 0);
                    }
                });
            });
        });
        div.appendChild(table);
        // Notizen
        const notizen_p = document.createElement('p');
        notizen_p.style.fontWeight = 'bold';
        div.appendChild(notizen_p);
        notizen_p.textContent = 'Notizen:';
        const notizfeld = document.createElement('textarea');
        div.appendChild(notizfeld);
        notizfeld.id = 'notizfeld';
        notizfeld.value = notizen;
        notizfeld.style.marginBottom = '10px';
        notizfeld.style.height = '100px';
        // Artikel-Tabelle
        const artikel_p = document.createElement('p');
        div.appendChild(artikel_p);
        artikel_p.textContent = 'Artikel:';
        artikel_p.style.fontWeight = 'bold';
        const artikel_p2 = document.createElement('p');
        div.appendChild(artikel_p2);
        artikel_p2.textContent = 'Es folgt eine Auflistung aller verbrauchter Artikel.';
        const artikel_table = document.createElement('table');
        artikel_table.className = 'standard';
        div.appendChild(artikel_table);
        artikel_table.innerHTML = '<tr><th>Artikel</th><th>Einheit</th><th>Anfang</th><th>Plus</th><th>Ende</th><th>extern</th><th>Differenz</th><th>Kosten</th><th>&#x1F5D1;&#xFE0F;</th></tr>';
        if (!is_new) {
            get_json('/func/oeffnungen/artikel', {'id': id}).then(resp => {
                resp.forEach(item => addArtikelLine(artikel_table, item.artikel.id, item.artikel.name, item.anfang, item.plus, item.ende, item.differenz, item.kosten, item.artikel.einheit, item.los, 0));
            });
        }
        // "Artikel hinzufügen"-Button
        const add_button = document.createElement('button');
        div.appendChild(add_button);
        add_button.innerHTML = '&#x2795;' + kategorie_symbol['artikel'] + ' Artikel hinzufügen';
        add_button.style.justifySelf = 'right';
        add_button.id = 'add_button';
        add_button.addEventListener('click', _ => {
            add_button.disabled = true;
            const row = document.createElement('tr');
            artikel_table.appendChild(row);
            const input_cell = document.createElement('td');
            row.appendChild(input_cell);
            input_cell.colSpan = 6;
            const dropdown = document.createElement('select');
            input_cell.appendChild(dropdown);
            const null_option = document.createElement('option');
            null_option.value = '-1';
            null_option.textContent = '== Artikel auswählen ==';
            dropdown.appendChild(null_option);
            artikelliste.forEach(item => {
                let vorhanden = false;
                artikel_table.querySelectorAll('tr').forEach(item_row => {
                    if (item_row.hasAttribute('data-id') && item_row.getAttribute('data-id') == item[0]
                        && item_row.hasAttribute('data-kategorie') && item_row.getAttribute('data-kategorie') == 'artikel')
                        vorhanden = true;
                });
                if (!vorhanden) {
                    const option = document.createElement('option');
                    option.value = item[0];
                    option.textContent = item[1];
                    dropdown.appendChild(option);
                }
            });
            const bin_cell = document.createElement('td');
            bin_cell.style.padding = 0;
            const bin_button = document.createElement('button');
            bin_button.innerHTML = '&#x1F5D1;&#xFE0F;';
            bin_cell.appendChild(bin_button);
            row.appendChild(bin_cell);
            bin_button.addEventListener('click', _ => {
                row.remove();
                add_button.disabled = false;
            });
            dropdown.addEventListener('change', _ => {
                const selected_id = dropdown.value;
                if (selected_id == -1) return;
                const artikel_tuple = artikelliste.filter(e => e[0] == selected_id)[0];
                const selected_name = artikel_tuple[1];
                const selected_einheit = artikel_tuple[2];
                const selected_kosten = artikel_tuple[3];
                row.remove();
                addArtikelLine(artikel_table, selected_id, selected_name, 0, 0, 0, 0, selected_kosten, selected_einheit, -1, 0);
                add_button.disabled = false;
            });
        });
        // Inventur-Tools
        addInventurTools(div, artikel_table);
        // Kosten-Anzeige
        const kosten_p = document.createElement('p');
        div.appendChild(kosten_p);
        kosten_p.textContent = 'Gesamtkosten: 0,00 €';
        kosten_p.id = 'gesamtkosten';
        // Einnahmen-Tabelle
        const einnahmen_p = document.createElement('p');
        div.appendChild(einnahmen_p);
        einnahmen_p.textContent = 'Einnahmen:';
        einnahmen_p.style.fontWeight = 'bold';
        const einnahmen_p2 = document.createElement('p');
        div.appendChild(einnahmen_p2);
        einnahmen_p2.textContent = 'Hier können verschiedene Einnahmen zu dieser Öffnung eingetragen werden.';
        const einnahmen_table = document.createElement('table');
        einnahmen_table.className = 'standard';
        div.appendChild(einnahmen_table);
        einnahmen_table.innerHTML = '<tr style="font-weight:bold;"><td>Bezeichnung</td><td>Brutto</td><td>MwSt.</td><td>e.V.-Zehnt</td><td>Netto</td><td>&#x1F5D1;&#xFE0F;</td></tr>';
        if (!is_new) {
            get_json('/func/oeffnungen/einnahmen', {'id': id}).then(resp => {
                resp.forEach(item => addEinnahmenLine(einnahmen_table, item.id, item.name, item.brutto, item.mwst, item.zehnt, item.netto));
            });
        }
        const einn_add_button = document.createElement('button');
        div.appendChild(einn_add_button);
        einn_add_button.innerHTML = '&#x2795;&#x1F4B0; Einnahmenquelle hinzufügen';
        einn_add_button.style.justifySelf = 'right';
        einn_add_button.id = 'einn_add_button';
        einn_add_button.addEventListener('click', _ => {
            addEinnahmenLine(einnahmen_table, -1, '', 0, 19, 10, 0);
        });
        // Warnungs-Textfeld
        const warn_p = document.createElement('p');
        warn_p.style.color = 'red';
        warn_p.style.display = 'none';
        div.appendChild(warn_p);
        // Speichern oder abbrechen
        const button_div = document.createElement('div');
        button_div.className = 'button_div';
        div.appendChild(button_div);
        let button = document.createElement('button');
        button.innerHTML = '&#x274C;  Abbrechen';
        button.addEventListener('click', _ => closeField(id, div));
        button_div.appendChild(button);
        button = document.createElement('button');
        button.style.fontWeight = 'bolder';
        button.innerHTML = '&#x1F4BE;  Speichern';
        button.addEventListener('click', function() {
            const new_name = name_input.value;
            const new_datum = datum_input.value;
            const new_art = art_input.value;
            const new_notizen = notizfeld.value;
            const url = is_new ? '/func/oeffnungen/create' : '/func/oeffnungen/edit';
            get_json(url, {'id': id, 
                           'name': new_name, 
                           'datum': new_datum,
                           'art': new_art,
                           'notizen': new_notizen,
                           'artikel': getArtikelliste(artikel_table),
                           'einnahmen': getEinnahmenliste(einnahmen_table)})
                .then(resp => {
                    if (resp.success) {
                        closeField(id, div);
                        loadTable();
                    } else {
                        warn_p.textContent = resp.message;
                        warn_p.style.display = 'block';
                    }
                });
        });
        button_div.appendChild(button);
        const parent_field = document.getElementById('edit_field');
        parent_field.insertBefore(div, parent_field.firstChild);
        parent_field.prepend(document.getElementById('neu_button'));
        article_edit_list.push([id, div]);
        setTimeout(() => name_input.focus(), 0);
    } 
}

function addEinnahmenLine(tabelle, id, name_, brutto, mwst, zehnt, netto) {
    const row = document.createElement('tr');
    tabelle.appendChild(row);
    row.setAttribute('data-id', id);
    // Name
    const cell1 = document.createElement('td');
    row.appendChild(cell1);
    const datalist = document.createElement('datalist');
    cell1.appendChild(datalist);
    datalist.id = 'name_list';
    ['', 'Bargeldkasse', 'Kartenzahlungen', 'Überweisung', 'Förderung'].forEach(posten => {
        const option = document.createElement('option');
        option.value = posten;
        datalist.appendChild(option);
    });
    const name_input = document.createElement('input');
    cell1.appendChild(name_input);
    name_input.setAttribute('list', 'name_list');
    name_input.value = name_;
    // brutto
    const cell2 = document.createElement('td');
    row.appendChild(cell2);
    const input2 = document.createElement('input');
    cell2.appendChild(input2);
    input2.className = 'disabled';
    input2.value = getPreisString(brutto);
    input2.addEventListener('focusin', _ => cellEnter(input2, 2));
    input2.addEventListener('focusout', _ => cellLeave('einnahmen', input2, 2));
    input2.addEventListener('keydown', event => cellUpAndDown(tabelle, input2, 3, event.key));
    // MwSt
    const cell3 = document.createElement('td');
    row.appendChild(cell3);
    const input3 = document.createElement('input');
    cell3.appendChild(input3);
    input3.className = 'disabled';
    input3.style.width = '30px';
    input3.value = getFloatString(mwst);
    input3.addEventListener('focusin', _ => cellEnter(input3, 3));
    input3.addEventListener('focusout', _ => cellLeave('einnahmen', input3, 3));
    input3.addEventListener('keydown', event => cellUpAndDown(tabelle, input3, 4, event.key));
    const input3a = document.createElement('a');
    cell3.appendChild(input3a);
    input3a.textContent = ' %';
    // ILSC-Zehnt
    const cell4 = document.createElement('td');
    row.appendChild(cell4);
    const input4 = document.createElement('input');
    cell4.appendChild(input4);
    input4.className = 'disabled';
    input4.style.width = '30px';
    input4.value = getFloatString(zehnt);
    input4.addEventListener('focusin', _ => cellEnter(input4, 4));
    input4.addEventListener('focusout', _ => cellLeave('einnahmen', input4, 4));
    input4.addEventListener('keydown', event => cellUpAndDown(tabelle, input4, 5, event.key));
    const input4a = document.createElement('a');
    cell4.appendChild(input4a);
    input4a.textContent = ' %';
    // netto
    const cell5 = document.createElement('td');
    row.appendChild(cell5);
    cell5.textContent = getPreisString(netto);
    // Löschen-Button
    cell = document.createElement('td');
    cell.style.padding = 0;
    const button = document.createElement('button');
    button.innerHTML = '&#x1F5D1;&#xFE0F;';
    button.addEventListener('click', _ => {row.remove();});
    cell.appendChild(button);
    row.appendChild(cell);
}

function addArtikelLine(tabelle, id, name_, anfang, plus, ende, differenz, kosten, einheit_lang, los_id=-1, extern) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', id);
    row.setAttribute('data-kosten', kosten.toString());
    tabelle.appendChild(row);
    // Artikelname
    const cell1 = document.createElement('td');
    row.appendChild(cell1);
    cell1.innerHTML = name_;
    // Losgröße
    const cell1_5 = document.createElement('td');
    row.appendChild(cell1_5);
    // Anfang
    const cell2 = document.createElement('td');
    row.appendChild(cell2);
    const input2 = document.createElement('input');
    cell2.appendChild(input2);
    input2.className = 'disabled';
    input2.style.width = '40px';
    input2.id = 'anfang';
    input2.value = getFloatString(anfang);
    input2.addEventListener('focusin', _ => cellEnter(input2, 2));
    input2.addEventListener('focusout', _ => cellLeave('artikel', input2, 2));
    input2.addEventListener('keydown', event => cellUpAndDown(tabelle, input2, 3, event.key));
    // Plus
    const cell3 = document.createElement('td');
    row.appendChild(cell3);
    const input3 = document.createElement('input');
    cell3.appendChild(input3);
    input3.className = 'disabled';
    input3.style.width = '40px';
    input3.id = 'plus';
    input3.value = getFloatString(plus);
    input3.addEventListener('focusin', _ => cellEnter(input3, 3));
    input3.addEventListener('focusout', _ => cellLeave('artikel', input3, 3));
    input3.addEventListener('keydown', event => cellUpAndDown(tabelle, input3, 4, event.key));
    // Ende
    const cell4 = document.createElement('td');
    row.appendChild(cell4);
    const input4 = document.createElement('input');
    cell4.appendChild(input4);
    input4.className = 'disabled';
    input4.style.width = '40px';
    input4.value = getFloatString(ende);
    input4.id = 'ende';
    input4.addEventListener('focusin', _ => cellEnter(input4, 4));
    input4.addEventListener('focusout', _ => cellLeave('artikel', input4, 4));
    input4.addEventListener('keydown', event => cellUpAndDown(tabelle, input4, 5, event.key));
    // extern
    const cell4a = document.createElement('td');
    row.appendChild(cell4a);
    const input4a = document.createElement('p');
    input4a.id = 'extern';
    cell4a.appendChild(input4a);
    input4a.innerHTML = getFloatString(extern);
    // Differenz
    const cell5 = document.createElement('td');
    row.appendChild(cell5);
    const input5 = document.createElement('p');
    input5.id = 'diff';
    cell5.appendChild(input5);
    input5.innerHTML = getFloatString(differenz);
    // Kosten
    const cell6 = document.createElement('td');
    row.appendChild(cell6);
    const input6 = document.createElement('p');
    cell6.appendChild(input6);
    input6.id = 'kosten';
    // Losgröße
    const los_select = document.createElement('select');
    cell1_5.appendChild(los_select);
    const null_los = document.createElement('option');
    los_select.appendChild(null_los);
    null_los.textContent = einheit_lang;
    null_los.value = -1;
    null_los.setAttribute('data-faktor', 1);
    null_los.setAttribute('data-offset', 0);
    get_json('/func/losgroessen/get', {'artikel': id}).then(resp => {
        resp.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name_;
            option.setAttribute('data-faktor', item.faktor);
            option.setAttribute('data-offset', item.offset);
            los_select.appendChild(option);
            if (item.id == los_id) option.selected = true;
        });
        refreshKosten(row);
    });
    los_select.addEventListener('change', _ => refreshKosten(row));
    // Löschen-Button
    cell = document.createElement('td');
    cell.style.padding = 0;
    const button = document.createElement('button');
    button.innerHTML = '&#x1F5D1;&#xFE0F;';
    button.addEventListener('click', _ => {row.remove();});
    cell.appendChild(button);
    row.appendChild(cell);
}

function closeField(id, div) {
    for (let i = 0; i < article_edit_list.length; i++) {
        if (article_edit_list[i][0] == id) {
            article_edit_list.splice(i);
            break;
        }
    }
    div.remove();
}

// Hierhin wird der Wert der Zelle beim Betreten geschrieben. Dies dient dazu, dass auf diesen
// Wert zurückgesetzt werden kann, falls der neu eingegebene Wert ungültig ist.
cell_value = null;

// Nimmt den Wert eines Input-Objekts an, wenn dieses mit einem ungültigen Wert verlassen wird.
// Beim Verlassen selbst kann man nicht direkt zur Zelle zurückkehren. Deshalb wird der Error-State
// gesetzt, der beim Betreten einer neuen Zelle überprüft wird, damit dann von dortaus direkt zur
// fehlerhafen Zelle zurückgegangen werden kann.
error_state = false;

function cellEnter(cell, col) {
    if (error_state == false) {
        cell_value = cell.value;
        cell.className = 'enabled';
        setTimeout(() => cell.select(), 0);
    } else {
        const error_cell = error_state;
        error_state = false;
        error_cell.focus();
    }
}

function cellLeave(tabelle, cell, col) {
    let new_value = cell.value;
    let okay = true;
    let error_message = null;
    const row = cell.parentElement.parentElement;
    const row_cells = row.querySelectorAll('td');
    if (tabelle == 'einnahmen') {
        let brutto = getPreisInteger(row_cells[1].querySelector('input').value);
        let mwst = getIntegerOrFloat(row_cells[2].querySelector('input').value);
        let zehnt = getIntegerOrFloat(row_cells[3].querySelector('input').value);
        if (col == 2) {
            // Geldbeträge
            const parsed = getPreisInteger(new_value);
            const old_parsed = getPreisInteger(cell_value);
            if (parsed != old_parsed) {
                if (parsed == null || isNaN(parsed)) {
                    okay = false;
                    error_message = 'Bitte gib einen korrekten Geldbetrag ein.';
                } else {
                    cell.value = getPreisString(parsed);
                    brutto = parsed;
                }
            }
        } else if (col == 3 || col == 4) {
            // Zahl
            const parsed = getIntegerOrFloat(new_value);
            const old_parsed = getIntegerOrFloat(cell_value);
            if (parsed != old_parsed) {
                if (parsed == null || isNaN(parsed) || parsed < 0) {
                    okay = false;
                    error_message = 'Bitte gib eine korrekte positive Zahl oder 0 ein.';
                } else {
                    cell.value = getFloatString(parsed);
                    switch (col) {
                        case 3: {mwst = parsed; break;}
                        case 4: {zehnt = parsed; break;}
                    }
                }
            }
        }
        if (okay) {
            const netto = Math.round(brutto / (1+mwst/100) / (1+zehnt/100));
            row_cells[4].textContent = getPreisString(netto);
        }
    } else if (tabelle == 'artikel') {
        const parsed = getIntegerOrFloat(new_value);
        const old_parsed = getIntegerOrFloat(cell_value);
        if (parsed != old_parsed) {
            const anfang = getIntegerOrFloat(row_cells[2].querySelector('input').value);
            const plus = getIntegerOrFloat(row_cells[3].querySelector('input').value);
            const ende = getIntegerOrFloat(row_cells[4].querySelector('input').value);
            if (parsed == null || isNaN(parsed)) {
                okay = false;
                error_message = 'Bitte gib einen korrekten ganzzahligen Wert oder eine Kommazahl ein.';
            } else {
                cell.value = getFloatString(parsed);
                const differenz = anfang + plus - ende;
                const einheit_p = row_cells[6].querySelector('p');
                einheit_p.innerHTML = getFloatString(differenz);
                refreshKosten(row);
            }
        }
    }
    if (okay) {
        cell.className = 'disabled';
        error_state = false;
    } else {
        alert(error_message);
        cell.value = cell_value;
        error_state = cell;
    }
}

function cellUpAndDown(tabelle, cell, col, key) {
    if (key === 'ArrowUp' || key == 'ArrowDown') {
        const row = cell.parentElement.parentElement;
        const new_row = key === 'ArrowUp' ? row.previousSibling : row.nextSibling;
        if (new_row != null && new_row.hasAttribute('data-id')) {
            const new_cell = new_row.querySelectorAll('td')[col-1].querySelector('input');
            if (new_cell != null) new_cell.focus();
        }
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const new_col = col + (key === 'ArrowLeft' ? -1 : 1);
        const row = cell.parentElement.parentElement;
        const new_cell = row.querySelectorAll('td')[new_col-1].querySelector('input');
        if (new_cell != null) new_cell.focus();
    } else if (key === 'Enter') {
        const row = cell.parentElement.parentElement;
        const new_row = row.nextSibling;
        if (new_row != null && new_row.hasAttribute('data-id')) {
            const new_cell = new_row.querySelectorAll('td')[2].querySelector('input');
            if (new_cell != null) new_cell.focus();
        } else {
            cellLeave(tabelle, cell, col);
            cellEnter(cell, col);
        }
    } else if (key === 'Escape') {
        cell.value = cell_value;
        cell.select();
    }
}

function getArtikelliste(tabelle) {
    return Array.from(tabelle.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .map(row => {
            const id = row.getAttribute('data-id');
            const cells = row.querySelectorAll('td');
            const anfang = getIntegerOrFloat(cells[2].querySelector('input').value);
            const plus = getIntegerOrFloat(cells[3].querySelector('input').value);
            const ende = getIntegerOrFloat(cells[4].querySelector('input').value);
            const extern = getIntegerOrFloat(cells[5].querySelector('p').textContent);
            const differenz = anfang + plus - extern - ende;
            const los_option = row.querySelectorAll('select')[0].selectedOptions[0];
            const los_id = los_option.value;
            const faktor = parseFloat(los_option.getAttribute('data-faktor'));
            const offset = parseFloat(los_option.getAttribute('data-offset'));
            return {
                'id': id,
                'anfang': anfang,
                'plus': plus,
                'ende': ende,
                'extern': extern,
                'differenz': differenz,
                'los': los_id == '-1' ? null : parseInt(los_id),
                'orig_differenz': differenz * faktor - offset
            }
        })
        .filter(row => !(row.anfang == 0 && row.plus == 0 && row.ende == 0));
}

function getEinnahmenliste(tabelle) {
    return Array.from(tabelle.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-id'))
        .map(row => {
            const cells = row.querySelectorAll('td');
            return {
                'name': cells[0].querySelector('input').value,
                'brutto': getPreisInteger(cells[1].querySelector('input').value),
                'mwst': getIntegerOrFloat(cells[2].querySelector('input').value),
                'zehnt': getIntegerOrFloat(cells[3].querySelector('input').value),
                'netto': getPreisInteger(cells[4].textContent)
            }
        });
}

function refreshKosten(row) {
    // Kosten in der Zeile aktualisieren
    const kosten = getIntegerOrFloat(row.getAttribute('data-kosten'));
    const kosten_feld = row.querySelector('#kosten');
    const anzahl_feld = row.querySelector('#diff');
    const anzahl = getIntegerOrFloat(anzahl_feld.textContent);
    if (anzahl == 0) {
        kosten_feld.textContent = getPreisString(0);
    } else if (kosten > 0) {
        const los_option = row.querySelectorAll('select')[0].selectedOptions[0];
        const faktor = parseFloat(los_option.getAttribute('data-faktor'));
        const offset = parseFloat(los_option.getAttribute('data-offset'));
        const kosten_ges = Math.round(kosten * (anzahl * faktor - offset));
        kosten_feld.textContent = getPreisString(kosten_ges);
        row.setAttribute('data-gesamtkosten', kosten_ges);
    } else {
        kosten_feld.textContent = 'unbek.';
    }
    // Gesamtkosten aktualisieren
    const tabelle = row.parentElement;
    const div = tabelle.parentElement;
    const kosten_p = div.querySelector('#gesamtkosten');
    const summe = Array.from(tabelle.querySelectorAll('tr'))
                       .map(row => row.getAttribute('data-gesamtkosten'))
                       .filter(kosten => kosten != null)
                       .map(s => parseInt(s))
                       .reduce((a, b) => a + b, 0);
    kosten_p.textContent = 'Gesamtkosten: ' + getPreisString(summe);
}