window.addEventListener('load', _ => {
    jahr = new Date().getFullYear();
    loadTable();
});

jahr = null;
artikelliste = [];
oeffnungsliste = [];
bereichsliste = [];
kategorie_symbol = {'artikel': '&#x1F379;', 'öffnung': '&#x1F6AA;', 'bereich': '&#x1F4D9;'};

function setJahr(addition) {
    jahr += addition;
    loadTable();
}

function loadTable() {
    document.getElementById('jahreszahl').textContent = jahr.toString();
    const table = document.getElementById('einkauftable');
    table.innerHTML = '<tr style="font-weight:bold;"><td>Datum</td><td>Geschäft</td><td>Artikel</td><td class="button_title"><small>Bear-<br>beiten</small></td><td class="button_title"><small>L&ouml;-<br>schen</small></td></tr>';
    get_json('/func/einkaeufe/liste', {'jahr': jahr}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            // Datum
            let td = document.createElement('td');
            td.innerHTML = item.datum.ansicht;
            tr.appendChild(td);
            // Geschäft
            td = document.createElement('td');
            td.textContent = item.laden;
            tr.appendChild(td);
            // Artikel
            td = document.createElement('td');
            const liste = document.createElement('ul');
            td.appendChild(liste);
            item.artikel.forEach(artikel => {
                const list_item = document.createElement('li');
                list_item.textContent = artikel;
                liste.appendChild(list_item);
            });
            tr.appendChild(td);
            // Bearbeiten-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F58A;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.laden, item.einkaeufer, item.datum.ansicht, item.datum.parsed, item.notizen, false));
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
        get_json('/func/artikel/liste', {}).then(list => {
            list.forEach(item => {
                artikelliste.push([item.id, item.name, item.einheit.kurz, item.einheit.lang]);
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
    get_json('/func/einkaeufe/delete', {'id': id}).then(resp => {
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

function openEditField(id, laden, einkaeufer, datum, datum_parsed, notizen, is_new) {
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
            h2.textContent = 'Neuer Einkauf';
            h2.style.fontStyle = 'italic';
        } else {
            h2.textContent = laden + ', ' + datum;
        }
        div.appendChild(h2);
        // Geschäft
        const table = document.createElement('table');
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.textContent = 'Geschäft:';
        tr.appendChild(td);
        td = document.createElement('td');
        const name_input = document.createElement('input');
        name_input.id = 'name';
        name_input.value = laden;
        name_input.style.width = '100%';
        td.appendChild(name_input);
        tr.appendChild(td);
        table.appendChild(tr);
        // Einkäufer
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.textContent = 'Einkäufer:';
        tr.appendChild(td);
        td = document.createElement('td');
        const einkaeufer_input = document.createElement('input');
        einkaeufer_input.id = 'einkaeufer';
        einkaeufer_input.value = einkaeufer;
        einkaeufer_input.style.width = '100%';
        td.appendChild(einkaeufer_input);
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
        div.appendChild(table);
        // Artikel-Tabelle
        const artikel_table = document.createElement('table');
        artikel_table.className = 'standard';
        div.appendChild(artikel_table);
        artikel_table.innerHTML = '<tr style="font-weight:bold;"><td>Artikel</td><td>gesamt<br>brutto</td><td>MwSt<br>[%]</td><td>gesamt<br>netto</td><td>Anzahl</td><td>einzeln<br>netto</td><td>&#x1F5D1;&#xFE0F;</td></tr>';
        if (!is_new) {
            get_json('/func/einkaeufe/artikel', {'id': id}).then(resp => {
                resp.forEach(item => addArtikelLine(artikel_table, 
                                                    item.kategorie, 
                                                    item.artikel.id, 
                                                    item.artikel.name, 
                                                    item.gesamt.brutto, 
                                                    item.mwst, 
                                                    item.gesamt.netto, 
                                                    item.kategorie == 'artikel' ? item.menge : null, 
                                                    item.kategorie == 'artikel' ? item.artikel.einheit : null,
                                                    item.kategorie == 'artikel' ? item.artikel.einheit_lang : null, 
                                                    item.kategorie == 'artikel' ? item.einzel.netto : null,
                                                    item.los));
            });
        }
        // "Artikel hinzufügen"-Button
        const add_button = document.createElement('button');
        div.appendChild(add_button);
        add_button.innerHTML = '&#x2795;' + kategorie_symbol['artikel'] + ' Zu Artikel zugewiesenen Posten hinzufügen';
        add_button.style.justifySelf = 'right';
        add_button.id = 'add_button';
        add_button.addEventListener('click', _ => {
            setButtonDisabledStatus(div, true);
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
                const option = document.createElement('option');
                option.value = item[0];
                option.textContent = item[1];
                dropdown.appendChild(option);
            });
            const bin_cell = document.createElement('td');
            bin_cell.style.padding = 0;
            const bin_button = document.createElement('button');
            bin_button.innerHTML = '&#x1F5D1;&#xFE0F;';
            bin_cell.appendChild(bin_button);
            row.appendChild(bin_cell);
            bin_button.addEventListener('click', _ => {
                row.remove();
                setButtonDisabledStatus(div, false);
            });
            dropdown.addEventListener('change', _ => {
                const selected_id = dropdown.value;
                if (selected_id == -1) return;
                const artikel_tuple = artikelliste.filter(e => e[0] == selected_id)[0];
                const selected_name = artikel_tuple[1];
                const selected_einheit = artikel_tuple[2];
                const selected_einheit_lang = artikel_tuple[3];
                row.remove();
                addArtikelLine(artikel_table, 'artikel', selected_id, selected_name, 0, 19, 0, 1, selected_einheit, selected_einheit_lang, 0);
                setButtonDisabledStatus(div, false);
            });
        });
        // "Öffnung hinzufügen"-Button
        const oeff_button = document.createElement('button');
        div.appendChild(oeff_button);
        oeff_button.innerHTML = '&#x2795;' + kategorie_symbol['öffnung'] + ' Zu Öffnung zugewiesenen Posten hinzufügen';
        oeff_button.style.justifySelf = 'right';
        oeff_button.id = 'oeff_button';
        oeff_button.addEventListener('click', _ => {
            setButtonDisabledStatus(div, true);
            const row = document.createElement('tr');
            artikel_table.appendChild(row);
            const input_cell = document.createElement('td');
            row.appendChild(input_cell);
            input_cell.colSpan = 6;
            const dropdown = document.createElement('select');
            input_cell.appendChild(dropdown);
            const null_option = document.createElement('option');
            null_option.value = '-1';
            null_option.textContent = '== Öffnung auswählen ==';
            dropdown.appendChild(null_option);
            oeffnungsliste.forEach(item => {
                const option = document.createElement('option');
                option.value = item[0];
                option.textContent = item[1];
                dropdown.appendChild(option);
            });
            const bin_cell = document.createElement('td');
            bin_cell.style.padding = 0;
            const bin_button = document.createElement('button');
            bin_button.innerHTML = '&#x1F5D1;&#xFE0F;';
            bin_cell.appendChild(bin_button);
            row.appendChild(bin_cell);
            bin_button.addEventListener('click', _ => {
                row.remove();
                setButtonDisabledStatus(div, false);
            });
            dropdown.addEventListener('change', _ => {
                const selected_id = dropdown.value;
                if (selected_id == -1) return;
                const artikel_tuple = oeffnungsliste.filter(e => e[0] == selected_id)[0];
                const selected_name = artikel_tuple[1];
                row.remove();
                addArtikelLine(artikel_table, 'öffnung', selected_id, selected_name, 0, 19, 0, null, null, null, null);
                setButtonDisabledStatus(div, false);
            });
        });
        // "Bereich hinzufügen"-Button
        const ber_button = document.createElement('button');
        div.appendChild(ber_button);
        ber_button.innerHTML = '&#x2795;' + kategorie_symbol['bereich'] + ' Zu Bereich zugewiesenen Posten hinzufügen';
        ber_button.style.justifySelf = 'right';
        ber_button.id = 'ber_button';
        ber_button.addEventListener('click', _ => {
            setButtonDisabledStatus(div, true);
            const row = document.createElement('tr');
            artikel_table.appendChild(row);
            const input_cell = document.createElement('td');
            row.appendChild(input_cell);
            input_cell.colSpan = 6;
            const dropdown = document.createElement('select');
            input_cell.appendChild(dropdown);
            const null_option = document.createElement('option');
            null_option.value = '-1';
            null_option.textContent = '== Bereich auswählen ==';
            dropdown.appendChild(null_option);
            bereichsliste.forEach(item => {
                const option = document.createElement('option');
                option.value = item[0];
                option.textContent = item[1];
                dropdown.appendChild(option);
            });
            const bin_cell = document.createElement('td');
            bin_cell.style.padding = 0;
            const bin_button = document.createElement('button');
            bin_button.innerHTML = '&#x1F5D1;&#xFE0F;';
            bin_cell.appendChild(bin_button);
            row.appendChild(bin_cell);
            bin_button.addEventListener('click', _ => {
                row.remove();
                setButtonDisabledStatus(div, false);
            });
            dropdown.addEventListener('change', _ => {
                const selected_id = dropdown.value;
                if (selected_id == -1) return;
                const artikel_tuple = bereichsliste.filter(e => e[0] == selected_id)[0];
                const selected_name = artikel_tuple[1];
                row.remove();
                addArtikelLine(artikel_table, 'bereich', selected_id, selected_name, 0, 19, 0, null, null, null, null);
                setButtonDisabledStatus(div, false);
            });
        });
        // Notizfeld
        const notizen_p = document.createElement('p');
        notizen_p.style.fontWeight = 'bold';
        div.appendChild(notizen_p);
        notizen_p.textContent = 'Notizen:';
        const notizfeld = document.createElement('textarea');
        div.appendChild(notizfeld);
        notizfeld.id = 'notizfeld';
        notizfeld.value = notizen;
        notizfeld.style.marginBottom = '10px';
        notizfeld.style.height = '70px';
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
            const new_notizen = notizfeld.value;
            const new_einkaeufer = einkaeufer_input.value;
            const url = is_new ? '/func/einkaeufe/create' : '/func/einkaeufe/edit';
            get_json(url, {'id': id, 
                           'name': new_name, 
                           'datum': new_datum, 
                           'notizen': new_notizen,
                           'einkaeufer': new_einkaeufer,
                           'artikel': getArtikelliste(artikel_table)})
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

function addArtikelLine(tabelle, kategorie, id, artikelname, ges_brutto, mwst, ges_netto, anz, einheit, einheit_lang, einz_netto, los_id=-1) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', id.toString());
    row.setAttribute('data-kategorie', kategorie);
    row.setAttribute('data-einheit', einheit);
    tabelle.appendChild(row);
    // Artikelname
    const cell1 = document.createElement('td');
    row.appendChild(cell1);
    cell1.innerHTML = kategorie_symbol[kategorie] + ' ' + artikelname + '   ';
    // Einheit-Auswahl
    if (kategorie == 'artikel') {
        const dropdown = document.createElement('select');
        cell1.appendChild(dropdown);
        const null_option = document.createElement('option');
        null_option.value = '-1';
        null_option.setAttribute('data-faktor', 1);
        null_option.setAttribute('data-offset', 0);
        null_option.textContent = einheit_lang;
        dropdown.appendChild(null_option);
        get_json('/func/losgroessen/get', {'artikel': id}).then(resp => {
            resp.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name_;
                option.setAttribute('data-faktor', item.faktor);
                option.setAttribute('data-offset', item.offset);
                dropdown.appendChild(option);
                if (item.id == los_id) option.selected = true;
            });
        });
        dropdown.addEventListener('change', _ => cellLeave(dropdown, null));
    }
    // gesamt brutto
    const cell6 = document.createElement('td');
    row.appendChild(cell6);
    const input6 = document.createElement('input');
    cell6.appendChild(input6);
    input6.className = 'disabled';
    input6.value = getPreisString(ges_brutto);
    input6.addEventListener('focusin', _ => cellEnter(input6, 2));
    input6.addEventListener('focusout', _ => cellLeave(input6, 2));
    input6.addEventListener('keydown', event => cellUpAndDown(input6, 2, event.key));
    // MwSt
    const cell5 = document.createElement('td');
    row.appendChild(cell5);
    const input5 = document.createElement('input');
    cell5.appendChild(input5);
    input5.className = 'disabled';
    input5.style.width = '30px';
    input5.value = mwst.toString();
    input5.addEventListener('focusin', _ => cellEnter(input5, 3));
    input5.addEventListener('focusout', _ => cellLeave(input5, 3));
    input5.addEventListener('keydown', event => cellUpAndDown(input5, 3, event.key));
    // gesamt netto
    const cell4 = document.createElement('td');
    row.appendChild(cell4);
    const input4 = document.createElement('input');
    cell4.appendChild(input4);
    input4.className = 'disabled';
    input4.value = getPreisString(ges_netto);
    input4.addEventListener('focusin', _ => cellEnter(input4, 4));
    input4.addEventListener('focusout', _ => cellLeave(input4, 4));
    input4.addEventListener('keydown', event => cellUpAndDown(input4, 4, event.key));
    // Anzahl
    const cell3 = document.createElement('td');
    row.appendChild(cell3);
    if (anz != null) {
        const input3 = document.createElement('input');
        cell3.appendChild(input3);
        input3.className = 'disabled';
        input3.style.width = '40px';
        input3.value = anz.toString();
        input3.addEventListener('focusin', _ => cellEnter(input3, 5));
        input3.addEventListener('focusout', _ => cellLeave(input3, 5));
        input3.addEventListener('keydown', event => cellUpAndDown(input3, 5, event.key));
    }
    // einzeln netto
    const cell2 = document.createElement('td');
    row.appendChild(cell2);
    if (einz_netto != null) {
        const input2 = document.createElement('p');
        cell2.appendChild(input2);
        input2.textContent = getPreisString(einz_netto) + '/' + einheit;
    }
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

function cellLeave(cell, col) {
    let new_value = cell.value;
    let parsed;
    let okay = true;
    let error_message = null;
    const row = cell.parentElement.parentElement;
    const row_cells = row.querySelectorAll('td');
    const kategorie = row.getAttribute('data-kategorie');
    const is_artikel = kategorie == 'artikel';
    let anzahl = is_artikel ? getIntegerOrFloat(row_cells[4].querySelectorAll('input')[0].value) : 1;
    let gesamt_netto = getPreisInteger(row_cells[3].querySelectorAll('input')[0].value);
    let mwst = getIntegerOrFloat(row_cells[2].querySelectorAll('input')[0].value);
    let gesamt_brutto = getPreisInteger(row_cells[1].querySelectorAll('input')[0].value);
    let einzel_netto = gesamt_netto / anzahl;
    if (col == 5 || col == 3) {
        // Datentyp: Integer oder Float
        parsed = getIntegerOrFloat(new_value);
        const old_parsed = getIntegerOrFloat(cell_value);
        if (parsed != old_parsed) {
            if (parsed == null || isNaN(parsed)) {
                okay = false;
                error_message = 'Bitte gib einen korrekten ganzzahligen Wert oder eine Kommazahl ein.';
            } else {
                cell.value = getFloatString(parsed);
            }
            switch (col) {
                case 5: { // Anzahl
                    anzahl = parsed;
                    if (anzahl == 0) {
                        okay = false;
                        error_message = 'Die Menge darf nicht 0 sein. Wenn du den Eintrag löschen möchtest, verwende den Mülleimer-Button.';    
                    } else {
                        einzel_netto = Math.round(gesamt_netto / anzahl);
                    }
                    break;
                }
                case 3: { // MwSt
                    mwst = parsed;
                    if (mwst < 0) {
                        okay = false;
                        error_message = 'Bitte gib für die Mehrwertsteuer keinen negativen Wert ein. Das ergibt keinen Sinn. Ich bin persönlich enttäuscht von dir. Warum tust du das? Alles muss man hier kontrollieren. Meine Fresse, ey! Wegen Benutzern wie dir hat das Programmieren den doppelten Aufwand als es eigentlich müsste.';
                    } else {
                        gesamt_netto = Math.round(gesamt_brutto / (1 + mwst/100));
                        einzel_netto = Math.round(gesamt_netto / anzahl);
                    }
                    break;
                }
            }
        }
    }
    else if (col == 2 || col == 4 || col == 6) {
        // Datentyp: Preis
        parsed = getPreisInteger(new_value);
        const old_parsed = getPreisInteger(cell_value);
        if (parsed != old_parsed) {
            if (parsed == null) {
                okay = false;
                error_message = 'Bitte gib einen korrekten Geldbetrag ein.';
            } else {
                cell.value = getPreisString(parsed);
            }
            switch (col) {
                case 4: { // gesamt netto
                    gesamt_netto = parsed;
                    gesamt_brutto = Math.round(gesamt_netto * (1 + mwst / 100));
                    einzel_netto = Math.round(gesamt_netto / anzahl);
                    break;
                }
                case 2: { // gesamt brutto
                    gesamt_brutto = parsed;
                    gesamt_netto = Math.round(gesamt_brutto / (1 + mwst / 100));
                    einzel_netto = Math.round(gesamt_netto / anzahl);
                    break;
                }
            }
        }
    }
    if (okay) {
        // Herausfinden der Losgröße
        if (is_artikel) {
            const dropdown = row.querySelectorAll('select')[0];
            const losgroesse = dropdown.selectedOptions[0];
            if (losgroesse.value != "-1") {
                einzel_netto = gesamt_netto / anzahl;
                const faktor = parseFloat(losgroesse.getAttribute('data-faktor'));
                const offset = parseFloat(losgroesse.getAttribute('data-offset'));
                const orig_anzahl = anzahl * faktor - offset;
                einzel_netto = einzel_netto * anzahl / orig_anzahl;
            }
        }
        // Ausgabe
        if (col != null) cell.className = 'disabled';
        error_state = false;
        row_cells[1].querySelectorAll('input')[0].value = getPreisString(gesamt_brutto);
        row_cells[2].querySelectorAll('input')[0].value = getFloatString(mwst);
        row_cells[3].querySelectorAll('input')[0].value = getPreisString(gesamt_netto);
        if (is_artikel) {
            row_cells[4].querySelectorAll('input')[0].value = getFloatString(anzahl);
            const einheit = row.getAttribute('data-einheit');
            row_cells[5].querySelectorAll('p')[0].textContent = getPreisString(einzel_netto) + '/' + einheit;
        }
    } else {
        alert(error_message);
        cell.value = cell_value;
        error_state = cell;
    }
}

function cellUpAndDown(cell, col, key) {
    if (key === 'ArrowUp' || key == 'ArrowDown') {
        const row = cell.parentElement.parentElement;
        const new_row = key === 'ArrowUp' ? row.previousSibling : row.nextSibling;
        if (new_row != null && new_row.hasAttribute('data-id')) {
            const kategorie = new_row.getAttribute('data-kategorie');
            const limit = kategorie === 'artikel' ? 5 : 4;
            if (col > limit) return;
            const new_cell = new_row.querySelectorAll('td')[col-1].querySelectorAll('input')[0];
            new_cell.focus();
        }
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const new_col = col + (key === 'ArrowLeft' ? -1 : 1);
        const row = cell.parentElement.parentElement;
        const kategorie = row.getAttribute('data-kategorie');
        const limit = kategorie === 'artikel' ? 5 : 4;
        if (new_col >= 2 && new_col <= limit) {
            const new_cell = row.querySelectorAll('td')[new_col-1].querySelectorAll('input')[0];
            new_cell.focus();
        }
    } else if (key === 'Enter') {
        cellLeave(cell, col);
        cellEnter(cell, col);
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
            const kategorie = row.getAttribute('data-kategorie');
            if (kategorie === 'artikel') {
                const los_option = cells[0].querySelectorAll('select')[0].selectedOptions[0];
                const los = los_option.value;
                const faktor = parseFloat(los_option.getAttribute('data-faktor'));
                const offset = parseFloat(los_option.getAttribute('data-offset'));
                const menge = getIntegerOrFloat(cells[4].querySelectorAll('input')[0].value);
                return {
                    'id': id,
                    'menge': menge,
                    'gesamtnetto': getPreisInteger(cells[3].querySelectorAll('input')[0].value),
                    'einzelnetto': getPreisInteger(cells[5].querySelectorAll('p')[0].textContent.split('/')[0]),
                    'mwst': getIntegerOrFloat(cells[2].querySelectorAll('input')[0].value),
                    'gesamtbrutto': getPreisInteger(cells[1].querySelectorAll('input')[0].value),
                    'kategorie': 'artikel',
                    'los': los == '-1' ? null : parseInt(los),
                    'origmenge': menge * faktor - offset
                }
            } else {
                return {
                    'id': id,
                    'gesamtnetto': getPreisInteger(cells[3].querySelectorAll('input')[0].value),
                    'mwst': getIntegerOrFloat(cells[2].querySelectorAll('input')[0].value),
                    'gesamtbrutto': getPreisInteger(cells[1].querySelectorAll('input')[0].value),
                    'kategorie': kategorie
                }
            }
        });
}

function setButtonDisabledStatus(div, status) {
    ['add_button', 'oeff_button', 'ber_button'].forEach(button => {
        div.querySelector('#' + button).disabled = status;
    });
}