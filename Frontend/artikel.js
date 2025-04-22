window.addEventListener('load', _ => { loadTable(); });

bereichsliste = [];

function loadTable() {
    const table = document.getElementById('artikeltable');
    table.innerHTML = '<tr style="font-weight:bold;"><td>Name</td><td>Einheit</td><td class="button_title">Bearbeiten</td><td class="button_title">L&ouml;schen</td></tr>';
    get_json('/func/artikel/liste', {}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            // Name
            let td = document.createElement('td');
            td.innerHTML = item.name;
            tr.appendChild(td);
            // Einheit
            td = document.createElement('td');
            td.innerHTML = item.einheit.lang + ' [' + item.einheit.kurz + ']';
            tr.appendChild(td);
            // Bearbeiten-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F58A;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.name, item.einheit.kurz, item.einheit.lang, item.reste, item.notizen, item.bereich, false));
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
    if (bereichsliste.length == 0) {
        get_json('/func/arten/liste', {}).then(list => {
            list.forEach(item => {
                bereichsliste.push([item.id, item.name]);
            });
        });
    }
}

function remove(id) {
    get_json('/func/artikel/delete', {'id': id}).then(resp => {
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
einheiten_list = ['====== VOLUMEN ======', 'Liter', 'Centiliter', 'Milliliter',
                  '====== MASSE ======', 'Kilogramm', 'Gramm',
                  '====== STÜCKE ======', 'Stück', 'Flaschen', 'Kannen', 'Packungen'];

function openEditField(id, name_, einheit_kurz, einheit, reste, notizen, bereich, is_new) {
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
        const h2 = document.createElement('h2');
        if (is_new) {
            h2.textContent = 'Neuer Artikel';
            h2.style.fontStyle = 'italic';
        } else {
            h2.textContent = name_;
        }
        div.appendChild(h2);
        const table = document.createElement('table');
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.textContent = 'Name:';
        tr.appendChild(td);
        td = document.createElement('td');
        const name_input = document.createElement('input');
        name_input.id = 'name';
        name_input.value = name_;
        name_input.style.width = '100%';
        td.appendChild(name_input);
        tr.appendChild(td);
        table.appendChild(tr);
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.textContent = 'Einheit:';
        tr.appendChild(td);
        const einheit_input = document.createElement('select');
        einheit_input.id = 'einheit';
        einheiten_list.forEach(einheit => {
            const opt = document.createElement('option');
            opt.value = einheit;
            opt.textContent = einheit;
            einheit_input.appendChild(opt);
        });
        einheit_input.value = einheit;
        td = document.createElement('td');
        td.appendChild(einheit_input);
        tr.appendChild(td);
        table.appendChild(tr);
        div.appendChild(table);
        // Resteverwertung
        const reste_info = document.createElement('h3');
        reste_info.textContent = 'Was passiert mit den Resten des Artikels nach der Öffnung?';
        div.appendChild(reste_info);
        const form = document.createElement('form');
        div.appendChild(form);
        let rest_p = document.createElement('p');
        form.appendChild(rest_p);
        const rest_input_1 = document.createElement('input');
        rest_p.appendChild(rest_input_1);
        rest_input_1.type = 'radio';
        rest_input_1.name = 'reste';
        rest_input_1.id = 'option1';
        rest_input_1.checked = reste;
        let label = document.createElement('label');
        label.setAttribute('for', 'option1');
        label.textContent = 'Sie wandern zurück in den Warenbestand.';
        rest_p.appendChild(label);
        rest_p = document.createElement('p');
        form.appendChild(rest_p);
        const rest_input_2 = document.createElement('input');
        rest_p.appendChild(rest_input_2);
        rest_input_2.type = 'radio';
        rest_input_2.name = 'reste';
        rest_input_2.id = 'option2';
        rest_input_2.checked = !reste;
        label = document.createElement('label');
        label.setAttribute('for', 'option2');
        label.textContent = 'Sie werden weggeschüttet.';
        rest_p.appendChild(label);
        // Bereichszuordnung
        const bereich_info = document.createElement('h3');
        div.appendChild(bereich_info);
        bereich_info.textContent = 'Wie sollen die Einkäufe dieses Artikels verrechnet werden?';
        const bereich_form = document.createElement('form');
        div.appendChild(bereich_form);
        let bereich_p = document.createElement('p');
        bereich_form.appendChild(bereich_p);
        const bereich_input_1 = document.createElement('input');
        bereich_p.appendChild(bereich_input_1);
        bereich_input_1.type = 'radio';
        bereich_input_1.name = 'bereich';
        bereich_input_1.id = 'bereich1';
        bereich_input_1.checked = bereich == null;
        label = document.createElement('label');
        label.setAttribute('for', 'bereich1');
        label.textContent = 'Der Verbrauch dieses Artikels wird dokumentiert. Die Abrechnung erfolgt verbrauchsabhängig.';
        bereich_p.appendChild(label);
        bereich_p = document.createElement('p');
        bereich_form.appendChild(bereich_p);
        const bereich_input_2 = document.createElement('input');
        bereich_p.appendChild(bereich_input_2);
        bereich_input_2.type = 'radio';
        bereich_input_2.name = 'bereich';
        bereich_input_2.id = 'bereich2';
        bereich_input_2.checked = bereich != null;
        label = document.createElement('label');
        label.setAttribute('for', 'bereich2');
        bereich_p.appendChild(label);
        label.textContent = 'Die Artikel werden in den folgenden Bereich verbucht:';
        const bereich_input_3 = document.createElement('select');
        bereich_form.appendChild(bereich_input_3);
        bereichsliste.forEach(tuple => {
            const option = document.createElement('option');
            option.value = tuple[0];
            option.textContent = tuple[1];
            bereich_input_3.appendChild(option);
        });
        if (bereich != null)
            bereich_input_3.value = bereich;
        // Losgrößen
        const los_text = document.createElement('h3');
        div.appendChild(los_text);
        los_text.textContent = 'Losgrößen';
        const los_hinweis = document.createElement('p');
        div.appendChild(los_hinweis);
        los_hinweis.textContent = 'Hier kannst du angeben, in welchen Gebinden dieser Artikel vorhanden ist. Beispielsweise sind Zusammenhänge wie 1 Kasten = 20 Flaschen oder 1 Flasche = 200g Leergewicht + 500g Inhalt hier einstellbar und können dann bei der Abrechnung verwendet werden.';
        const los_table = document.createElement('table');
        los_table.className = 'standard';
        div.appendChild(los_table);
        let row = document.createElement('tr');
        los_table.appendChild(row);
        ['Bezeichnung', 'Inhaltsmenge', 'Leermenge', '&#x1F5D1;&#xFE0F;'].forEach(s => {
            const titlecell = document.createElement('th');
            row.appendChild(titlecell);
            titlecell.innerHTML = s;
        });
        function add_line(line_id, line_new, line_name, line_faktor, line_offset) {
            row = document.createElement('tr');
            los_table.appendChild(row);
            let cell = document.createElement('td');
            row.appendChild(cell);
            const bez_input = document.createElement('input');
            bez_input.value = line_name;
            cell.appendChild(bez_input);
            cell = document.createElement('td');
            row.appendChild(cell);
            let cell_p = document.createElement('p');
            cell.appendChild(cell_p);
            let cell_input = document.createElement('input');
            cell_input.value = line_faktor;
            cell_input.style.maxWidth = 55;
            cell_p.appendChild(cell_input);
            let einheit_a = document.createElement('a');
            cell_p.appendChild(einheit_a);
            einheit_a.textContent = ' ' + einheit_kurz;
            cell = document.createElement('td');
            row.appendChild(cell);
            cell_p = document.createElement('p');
            cell.appendChild(cell_p);
            cell_input = document.createElement('input');
            cell_input.value = line_offset;
            cell_input.style.maxWidth = 55;
            cell_p.appendChild(cell_input);
            einheit_a = document.createElement('a');
            cell_p.appendChild(einheit_a);
            einheit_a.textContent = ' ' + einheit_kurz;
            cell = document.createElement('td');
            row.appendChild(cell);
            const del_button = document.createElement('button');
            del_button.innerHTML = '&#x1F5D1;&#xFE0F;';
            del_button.addEventListener('click', _ => {
                row.style.display = 'none';
                row.setAttribute('data-deleted', 1);
            });
            cell.appendChild(del_button);
            cell.style.padding = 0;
            row.setAttribute('data-id', line_id);
            row.setAttribute('data-new', line_new);
            row.setAttribute('data-deleted', 0);
        }
        get_json('/func/losgroessen/get', {'artikel': id}).then(list => {
            list.forEach(los => add_line(los.id, 0, los.name_, los.faktor, los.offset));
        });
        const add_los_button = document.createElement('button');
        add_los_button.innerHTML = '&#x2795; Losgröße hinzufügen';
        div.appendChild(add_los_button);
        add_los_button.addEventListener('click', _ => add_line(-1, 1, '', 1, 0));
        // Notizfeld
        const notizen_p = document.createElement('h3');
        notizen_p.style.fontWeight = 'bold';
        div.appendChild(notizen_p);
        notizen_p.textContent = 'Notizen';
        const notizfeld = document.createElement('textarea');
        div.appendChild(notizfeld);
        notizfeld.id = 'notizfeld';
        notizfeld.value = notizen;
        notizfeld.style.marginBottom = '10px';
        notizfeld.style.height = '70px';
        // Warnung
        const warn_p = document.createElement('p');
        warn_p.style.color = 'red';
        warn_p.style.display = 'none';
        div.appendChild(warn_p);
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
            // Basis-Infos
            const new_name = name_input.value;
            const new_einheit = einheit_input.value;
            const new_reste = rest_input_1.checked;
            const new_notizen = notizfeld.value;
            let new_bereich = null;
            if (bereich_input_2.checked) new_bereich = bereich_input_3.value;
            // Losgrößen
            let is_header = true;
            const losgroessen = [];
            let error = false;
            los_table.childNodes.forEach(row => {
                if (is_header) {
                    is_header = false;
                } else {
                    const row_data = {};
                    row_data['deleted'] = row.getAttribute('data-deleted') == '1';
                    row_data['new'] = row.getAttribute('data-new') == '1';
                    row_data['id'] = row.getAttribute('data-id');
                    const inputs = Array.from(row.querySelectorAll('input'));
                    if (inputs[0].value == '') {
                        alert('Der Name einer Losgröße darf nicht leer sein.');
                        error = true;
                    }
                    row_data['name'] = inputs[0].value;
                    let zahl = parseFloat(inputs[1].value.replace(',', '.'));
                    if (isNaN(zahl) || inputs[1].value == '') {
                        alert('In der Losgrößentabelle befindet sich eine ungültige Zahl. Vorgang abgebrochen.');
                        error = true;
                    } else {
                        row_data['faktor'] = parseFloat(zahl);
                    }
                    zahl = parseFloat(inputs[2].value.replace(',', '.'));
                    if (isNaN(zahl) || inputs[2].value == '') {
                        alert('In der Losgrößentabelle befindet sich eine ungültige Zahl. Vorgang abgebrochen.');
                        error = true;
                    } else {
                        row_data['offset'] = parseFloat(zahl);
                    }
                    losgroessen.push(row_data);
                }
            });
            if (error) return;
            // Absenden
            const url = is_new ? '/func/artikel/create' : '/func/artikel/edit';
            get_json(url, {'id': id, 
                           'name': new_name, 
                           'einheit': new_einheit, 
                           'reste': new_reste, 
                           'notizen': new_notizen,
                           'bereich': new_bereich,
                           'los': losgroessen})
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
    } 
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