window.addEventListener('load', _ => loadTable());

artikelliste = [];
charts = {};

function loadTable() {
    const table = document.getElementById('kalktabelle');
    table.innerHTML = '<tr style="font-weight:bold;"><td>Name</td><td>Verkaufspreis</td><td><small>Bear-<br>beiten</small></td><td><small>L&ouml;-<br>schen</small></td></tr>';
    get_json('/func/kalk/liste', {}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id);
            // Name
            let td = document.createElement('td');
            td.innerHTML = item.name;
            tr.appendChild(td);
            // Preis
            td = document.createElement('td');
            td.innerHTML = getPreisString(item.preis);
            tr.appendChild(td);
            // Bearbeiten-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F58A;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.name, item.preis, item.notizen, item.anzeigen, false));
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
                artikelliste.push([item.id, item.name, item.einheit.kurz, item.kosten]);
            });
        });
    }
}

article_edit_list = []

function openEditField(id, name_, preis, notizen, anzeigen, is_new) {
    let is_open = false;
    if (is_new) {
        id = -1;
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
            h2.textContent = 'Neue Kalkulation';
            h2.style.fontStyle = 'italic';
        } else {
            h2.textContent = name_;
        }
        div.appendChild(h2);
        // Name
        const table = document.createElement('table');
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.textContent = 'Verkaufsbezeichnung:';
        tr.appendChild(td);
        td = document.createElement('td');
        const name_input = document.createElement('input');
        name_input.id = 'name';
        name_input.value = name_;
        name_input.style.width = '100%';
        td.appendChild(name_input);
        tr.appendChild(td);
        table.appendChild(tr);
        // Preis
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.textContent = 'Verkaufspreis:';
        tr.appendChild(td);
        const preis_input = document.createElement('input');
        preis_input.id = 'preis';
        preis_input.value = preis == null ? 'undefiniert' : getPreisString(preis);
        preis_input.addEventListener('focusout', _ => {
            const new_preis = getPreisInteger(preis_input.value);
            if (new_preis == null) {
                preis_input.value = 'undefiniert';
            } else {
                preis_input.value = getPreisString(new_preis);
                updateStatistiken(div);
            }
        });
        td = document.createElement('td');
        td.appendChild(preis_input);
        tr.appendChild(td);
        table.appendChild(tr);
        div.appendChild(table);
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
        // Artikel-Tabelle
        const artikel_table = document.createElement('table');
        artikel_table.className = 'standard';
        div.appendChild(artikel_table);
        artikel_table.innerHTML = '<tr style="font-weight:bold;"><td>Artikel</td><td><small>Einzelpreis<br>netto</small></td><td>Menge</td><td><small>Gesamtpreis<br>netto</small></td><td>&#x1F5D1;&#xFE0F;</td></tr>';
        // "Artikel hinzufügen"-Button
        const add_button = document.createElement('button');
        div.appendChild(add_button);
        add_button.innerHTML = '&#x2795; Artikel aus Liste hinzufügen';
        add_button.style.justifySelf = 'right';
        add_button.id = 'std_button';
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
                const selected_kosten = artikel_tuple[3];
                row.remove();
                addStandardArtikelLine(artikel_table, selected_id, selected_name, 0, selected_einheit, selected_kosten);
                setButtonDisabledStatus(div, false);
            });
        });
        // "Sonstige Artikel hinzufügen"-Button
        const sons_button = document.createElement('button');
        div.appendChild(sons_button);
        sons_button.innerHTML = '&#x2795; Artikel manuell hinzufügen';
        sons_button.style.justifySelf = 'right';
        sons_button.id = 'sons_button';
        sons_button.addEventListener('click', _ => {
            addSonstigeArtikelLine(artikel_table, '', 0, 0);
        });
        // "Artikel anzeigen"-Abfrage
        const form = document.createElement('form');
        div.appendChild(form);
        const anzeigen_p = document.createElement('p');
        form.appendChild(anzeigen_p);
        const anzeigen_input = document.createElement('input');
        anzeigen_p.appendChild(anzeigen_input);
        anzeigen_input.type = 'checkbox';
        anzeigen_input.name = 'reste';
        anzeigen_input.id = 'option1';
        anzeigen_input.checked = anzeigen;
        let label = document.createElement('label');
        label.setAttribute('for', 'option1');
        label.textContent = 'diesen Artikel in der Grafik anzeigen';
        anzeigen_p.appendChild(label);
        // Berechnungen
        const ber_div = document.createElement('div');
        div.appendChild(ber_div);
        ber_div.style.width = '90%';
        ber_div.style.padding = '3%';
        ber_div.style.margin = '3%';
        ber_div.style.border = '1px solid gray';
        ber_div.innerHTML = '\
            <h3>Berechnungen</h3>\
            <table class="info_tabelle">\
                <tr><td>Wareneinsatz netto</td><td id="wareneinsatz"></td></tr>\
                <tr><td>Verkaufspreis brutto</td><td id="vk_brutto"></td></tr>\
                <tr><td>Mehrwertsteuer</td><td id="mwst"></td></tr>\
                <tr><td>e.V.-Zehnt</td><td id="zehnt"></td></tr>\
                <tr><td>Verkaufspreis netto</td><td id="vk_netto"></td></tr>\
                <tr><td>Gewinn netto</td><td id="gewinn"></td></tr>\
                <tr><td>Marge</td><td id="marge"></td></tr>\
                <tr><td></td><td id="marge2"></td></tr>\
            </table>\
            <canvas id="chart" style="width:90%;height:90px;"></canvas>';
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
            const new_notizen = notizfeld.value;
            const new_preis = getPreisInteger(preis_input.value);
            const standard_list = [];
            const sonstige_list = [];
            const new_anzeigen = anzeigen_input.checked;
            Array.from(artikel_table.querySelectorAll('tr'))
                .filter(row => row.hasAttribute('data-modus'))
                .forEach(row => {
                    if (row.getAttribute('data-modus') == 'standard') {
                        const art_id = row.getAttribute('data-id');
                        const art_menge = getIntegerOrFloat(row.querySelector('input').value);
                        standard_list.push({'id': art_id, 'menge': art_menge});
                    } else if (row.getAttribute('data-modus') == 'sonstige') {
                        const row_cells = row.querySelectorAll('input');
                        const art_name = row_cells[0].value;
                        const art_preis = getPreisInteger(row_cells[1].value);
                        const art_menge = getIntegerOrFloat(row_cells[2].value);
                        sonstige_list.push({'name': art_name, 'preis': art_preis, 'menge': art_menge})
                    }
                });
            const url = is_new ? '/func/kalk/create' : '/func/kalk/edit';
            get_json(url, {'id': id, 
                           'name': new_name, 
                           'notizen': new_notizen,
                           'preis': new_preis,
                           'artikel': standard_list,
                           'sonstige': sonstige_list,
                           'anzeigen': new_anzeigen})
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
        // Artikel eintragen
        if (!is_new) {
            get_json('/func/kalk/details', {'id': id}).then(resp => {
                resp.artikel.standard.forEach(item => addStandardArtikelLine(artikel_table, item.id, item.name, item.menge, item.einheit, item.kosten));
                resp.artikel.sonstige.forEach(item => addSonstigeArtikelLine(artikel_table, item.name, item.menge, item.preis));
                updateStatistiken(div);
            });
        }
        // Div einsortieren
        const parent_field = document.getElementById('edit_field');
        parent_field.insertBefore(div, parent_field.firstChild);
        parent_field.prepend(document.getElementById('neu_button'));
        article_edit_list.push([id, div]);
        setTimeout(() => name_input.focus(), 0);
    }
}

function addStandardArtikelLine(table, id, name_, menge, einheit, einzelpreis) {
    const row = document.createElement('tr');
    table.appendChild(row);
    row.setAttribute('data-id', id.toString());
    row.setAttribute('data-modus', 'standard');
    // Name
    let cell = document.createElement('td');
    row.appendChild(cell);
    cell.textContent = name_;
    // Einzelpreis
    cell = document.createElement('td');
    row.appendChild(cell);
    if (einzelpreis == -1) {
        cell.textContent = 'unbek.';
    } else {
        cell.textContent = getPreisString(einzelpreis);
    }
    // Menge
    cell = document.createElement('td');
    row.appendChild(cell);
    const p = document.createElement('p');
    cell.appendChild(p);
    const input = document.createElement('input');
    input.className = 'disabled';
    input.value = getFloatString(menge);
    input.style.width = '40px';
    input.id = 'menge';
    p.appendChild(input);
    const a = document.createElement('a');
    p.appendChild(a);
    a.textContent = ' ' + einheit;
    input.addEventListener('focusin', _ => cellEnter(input, 2));
    input.addEventListener('focusout', _ => cellLeave(input, 2));
    // Gesamtpreis
    cell = document.createElement('td');
    row.appendChild(cell);
    if (einzelpreis == -1) {
        cell.textContent = 'unbek.';
        cell.setAttribute('data-preis', 'X');
    } else {
        const gesamtpreis = einzelpreis * menge;
        cell.textContent = getPreisString(gesamtpreis);
        cell.setAttribute('data-preis', gesamtpreis);
    }
    // Löschen-Button
    cell = document.createElement('td');
    cell.style.padding = 0;
    const button = document.createElement('button');
    button.innerHTML = '&#x1F5D1;&#xFE0F;';
    button.addEventListener('click', _ => { row.remove(); updateStatistiken(div); });
    cell.appendChild(button);
    row.appendChild(cell);
}

function addSonstigeArtikelLine(table, name_, menge, einzelpreis) {
    const row = document.createElement('tr');
    table.appendChild(row);
    row.setAttribute('data-modus', 'sonstige');
    // Name
    let cell = document.createElement('td');
    row.appendChild(cell);
    const name_input = document.createElement('input');
    cell.appendChild(name_input);
    name_input.id = 'name';
    name_input.className = 'disabled';
    name_input.value = name_;
    name_input.style.width = '120px';
    name_input.style.textAlign = 'left';
    name_input.addEventListener('focusin', _ => cellEnter(name_input, 0));
    name_input.addEventListener('focusout', _ => cellLeave(name_input, 0));
    // Einzelpreis
    cell = document.createElement('td');
    row.appendChild(cell);
    const preis_p = document.createElement('p');
    cell.appendChild(preis_p);
    const preis_input = document.createElement('input');
    preis_p.appendChild(preis_input);
    preis_input.id = 'preis';
    preis_input.className = 'disabled';
    preis_input.value = getPreisString(einzelpreis);
    preis_input.addEventListener('focusin', _ => cellEnter(preis_input, 1));
    preis_input.addEventListener('focusout', _ => cellLeave(preis_input, 1));
    // Menge
    cell = document.createElement('td');
    row.appendChild(cell);
    const menge_p = document.createElement('p');
    cell.appendChild(menge_p);
    const menge_input = document.createElement('input');
    menge_input.className = 'disabled';
    menge_input.value = getFloatString(menge);
    menge_input.style.width = '40px';
    menge_input.id = 'menge';
    menge_p.appendChild(menge_input);
    menge_input.addEventListener('focusin', _ => cellEnter(menge_input, 2));
    menge_input.addEventListener('focusout', _ => cellLeave(menge_input, 2));
    // Gesamtpreis
    cell = document.createElement('td');
    row.appendChild(cell);
    cell.textContent = getPreisString(einzelpreis * menge);
    // Löschen-Button
    cell = document.createElement('td');
    cell.style.padding = 0;
    const button = document.createElement('button');
    button.innerHTML = '&#x1F5D1;&#xFE0F;';
    button.addEventListener('click', _ => { row.remove(); updateStatistiken(div); });
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

function setButtonDisabledStatus(div, status) {
    ['std_button', 'sons_button'].forEach(button => {
        div.querySelector('#' + button).disabled = status;
    });
}

// Hierhin wird der Wert der Zelle beim Betreten geschrieben. Dies dient dazu, dass auf diesen
// Wert zurückgesetzt werden kann, falls der neu eingegebene Wert ungültig ist.
cell_value = null;

// Nimmt den Wert eines Input-Objekts an, wenn dieses mit einem ungültigen Wert verlassen wird.
// Beim Verlassen selbst kann man nicht direkt zur Zelle zurückkehren. Deshalb wird der Error-State
// gesetzt, der beim Betreten einer neuen Zelle überprüft wird, damit dann von dortaus direkt zur
// fehlerhafen Zelle zurückgegangen werden kann.
error_state = false;

function cellEnter(cell) {
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
    let okay = true;
    let error_message = null;
    const row = cell.parentElement.parentElement.parentElement;
    const row_cells = row.querySelectorAll('td');
    const div = row.parentElement.parentElement;
    if (row.getAttribute('data-modus') == 'standard') {
        const menge = getIntegerOrFloat(new_value);
        const old_menge = getIntegerOrFloat(cell_value);
        if (menge != old_menge) {
            if (menge == null || isNaN(menge) || menge < 0) {
                okay = false;
                error_message = 'Bitte gib eine korrekte positive Zahl ein.';
            } else {
                cell.value = getFloatString(menge);
                const gesamt_cell = row_cells[3];
                let einzelpreis = row_cells[1].textContent;
                if (einzelpreis == 'unbek.') {
                    gesamt_cell.textContent = 'unbek.';
                    gesamt_cell.setAttribute('data-preis', 'X');
                } else {
                    const gesamtpreis = menge * getPreisInteger(einzelpreis);
                    gesamt_cell.textContent = getPreisString(gesamtpreis);
                    gesamt_cell.setAttribute('data-preis', gesamtpreis);
                }
                updateStatistiken(div);
            }
        }
    } else if (row.getAttribute('data-modus') == 'sonstige') {
        if (col == 1) {
            // Einzelpreis
            const parsed = getPreisInteger(new_value);
            const old_parsed = getPreisInteger(cell_value);
            if (parsed != old_parsed) {
                if (parsed == null || isNaN(parsed) || parsed < 0) {
                    okay = false;
                    error_message = 'Bitte gib einen korrekten positiven Geldbetrag ein.';
                } else {
                    const menge = getIntegerOrFloat(row_cells[2].querySelector('input').value);
                    const gesamtpreis = menge * parsed;
                    const gesamt_cell = row_cells[3];
                    gesamt_cell.setAttribute('data-preis', gesamtpreis);
                    gesamt_cell.textContent = getPreisString(gesamtpreis);
                    cell.value = getPreisString(parsed);
                    updateStatistiken(div);
                }
            }
        } else if (col == 2) {
            // Menge
            const parsed = getIntegerOrFloat(new_value);
            const old_parsed = getIntegerOrFloat(cell_value);
            if (parsed != old_parsed) {
                if (parsed == null || isNaN(parsed) || parsed < 0) {
                    okay = false;
                    error_message = 'Bitte gib eine korrekte positive Zahl ein.';
                } else {
                    const einzelpreis = getPreisInteger(row_cells[1].querySelector('input').value);
                    const gesamtpreis = parsed * einzelpreis;
                    const gesamt_cell = row_cells[3];
                    gesamt_cell.setAttribute('data-preis', gesamtpreis);
                    gesamt_cell.textContent = getPreisString(gesamtpreis);
                    cell.value = getFloatString(parsed);
                    updateStatistiken(div);
                }
            }
        }
    } else {
        okay = 'false';
        error_message = 'Unbekannter Zeilentyp.';
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

function updateStatistiken(div) {
    const table = div.querySelectorAll('table')[1];
    let kosten = Array.from(table.querySelectorAll('tr'))
            .filter(row => row.hasAttribute('data-modus'))
            .map(row => row.querySelectorAll('td')[3].getAttribute('data-preis'))
            .map(preis => preis == 'X' ? null : getIntegerOrFloat(preis))
            .reduce((s1, s2) => s1 == null || s2 == null ? null : s1 + s2, 0);
    if (kosten == 0) kosten = null;
    let preis_brutto = div.querySelector('#preis').value;
    if (preis_brutto == 'undefiniert') {
        preis_brutto = null;
    } else {
        preis_brutto = getPreisInteger(preis_brutto);
    }
    div.querySelector('#wareneinsatz').textContent = getPreisString(kosten);
    div.querySelector('#vk_brutto').textContent = getPreisString(preis_brutto);
    const ohne_mwst = preis_brutto == null ? null : preis_brutto / 1.19;
    const mwst = preis_brutto == null ? null : preis_brutto - ohne_mwst;
    div.querySelector('#mwst').textContent = getPreisString(mwst);
    const preis_netto = ohne_mwst == null ? null : ohne_mwst / 1.1;
    const zehnt = preis_netto == null ? null : ohne_mwst - preis_netto;
    div.querySelector('#zehnt').textContent = getPreisString(zehnt);
    div.querySelector('#vk_netto').textContent = getPreisString(preis_netto);
    const gewinn = preis_netto == null || kosten == null ? null : preis_netto - kosten;
    div.querySelector('#gewinn').textContent = getPreisString(gewinn);
    let marge = gewinn == null ? null : Math.round(gewinn / kosten * 100);
    if (marge == null) { marge = 'unbekannt'; } else { marge = marge.toString() + ' %'; }
    div.querySelector('#marge').textContent = marge;
    marge = gewinn == null ? null : preis_netto / kosten;
    if (marge == null) { marge = ''; } else { marge = `≙ ${getFloatString(marge)}&#215; Wareneinsatz`;}
    div.querySelector('#marge2').innerHTML = marge;
    // Chart
    const canvas = div.querySelector('#chart');
    if (preis_brutto == null || kosten == null || gewinn < 0) {
        canvas.display = 'none';
    } else {
        canvas.display = 'block';
        const components = [
            ['Wareneinsatz', kosten],
            ['e.V.-Zehnt', zehnt],
            ['Mehrwertsteuer', mwst],
            ['Gewinn', gewinn]
        ];
        const data = components.map(component => component[1]);
        const backgroundColors = ['rgb(255, 0, 0)', 'rgb(255, 102, 102)', 'rgb(255, 204, 204)', 'rgb(0, 255, 0)'];
        const total = data.reduce((acc, amount) => acc + amount, 0);
        const relativeData = data.map(amount => (amount / total) * 100);
        const ctx = document.getElementById('chart').getContext('2d');
        const labels = components.map(component => getPreisString(component[1]));
        if (div in charts) charts[div].destroy();
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
            labels: [''],
            datasets: components.map((component, index) => ({
                label: component[0],
                data: [relativeData[index]], // Prozentsatz des Gesamtbetrags
                backgroundColor: backgroundColors[index],
                borderColor: backgroundColors[index],
                borderWidth: 1
            }))
            },
            options: {
                indexAxis: 'y',  // Wechselt das Diagramm auf horizontal
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => [
                                    context.dataset.label,
                                    context.raw.toFixed(2) + '%',
                                    labels[context.datasetIndex]
                                ]
                        }
                    },
                    datalabels: {
                        color: 'white',  // Textfarbe in den Balken
                        align: 'center',  // Text in der Mitte des Balkens zentrieren
                        anchor: 'center',
                        formatter: (value, context) => labels[context.datasetIndex]  // Beschriftet mit dem tatsächlichen Wert in Euro
                    },
                },
                scales: {
                    x: {
                    stacked: true,  // Aktiviert das Stapeln der Balken
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `${value}%`;  // Prozentsatz auf der x-Achse
                        }
                    }
                    },
                    y: {
                        stacked: true
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        charts[div] = chart;
    }
}

function remove(id) {
    get_json('/func/kalk/delete', {'id': id}).then(resp => {
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