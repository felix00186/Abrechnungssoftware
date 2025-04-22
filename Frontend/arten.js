window.addEventListener('load', _ => { loadTable(); });

artikelliste = [];

function loadTable() {
    const table = document.getElementById('artentable');
    table.innerHTML = '<tr style="font-weight:bold;"><td>Name</td><td>Standard-Artikel</td><td class="button_title">Bearbeiten</td><td class="button_title">L&ouml;schen</td></tr>';
    get_json('/func/arten/listeohnenull', {}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            // Name
            let td = document.createElement('td');
            td.innerHTML = item.name;
            tr.appendChild(td);
            // Standard-Artikel
            td = document.createElement('td');
            td.innerHTML = item.artikel.toString() + ' Artikel';
            tr.appendChild(td);
            // Bearbeiten-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F58A;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.name, item.notizen, false));
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
    get_json('/func/artikel/mit_losgroessen', {}).then(list => {
        list.forEach(item => {
            artikelliste.push([item.id, item.name, item.losgroessen, item.einheit.lang]);
        });
    });
}

function remove(id) {
    get_json('/func/arten/delete', {'id': id}).then(resp => {
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

function openEditField(id, name_, notizen, is_new) {
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
        const name_table = document.createElement('table');
        name_table.style.marginBottom = '15px';
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
        name_table.appendChild(tr);
        div.appendChild(name_table);
        // Artikelauswahl
        let info_p = document.createElement('p');
        div.appendChild(info_p);
        info_p.textContent = 'Falls es Öffnungen mit Verkauf gibt, die auf diesen Bereich fallen, kannst du hier Artikel auswählen, die der Öffnung automatisch zugewiesen werden. Das erleichtert dir beim Übertragen der AV-Zettel die Arbeit.';
        const artikel_table = document.createElement('table');
        artikel_table.className = 'standard';
        artikel_table.innerHTML = '<tr><th>Artikel</th><th>Losgr&ouml;&szlig;e</th><th></th></tr>';
        get_json('/func/arten/artikel', {'id': id}).then(resp => {
            resp.forEach(item => addArtikelLine(artikel_table, item.id, item.name, item.einheit, item.losgroesse));
        });
        div.appendChild(artikel_table);
        const add_button = document.createElement('button');
        div.appendChild(add_button);
        add_button.innerHTML = '&#x2795; Artikel hinzufügen';
        add_button.style.justifySelf = 'right';
        add_button.id = 'add_button';
        add_button.addEventListener('click', _ => {
            add_button.disabled = true;
            const artikel_row = document.createElement('tr');
            const artikel_cell = document.createElement('td');
            artikel_row.appendChild(artikel_cell);
            artikel_row.appendChild(document.createElement('td'));
            artikel_table.appendChild(artikel_row);
            const dropdown = document.createElement('select');
            const null_option = document.createElement('option');
            null_option.value = '-1';
            null_option.textContent = '== Artikel auswählen ==';
            dropdown.appendChild(null_option);
            artikelliste.forEach(item => {
                let vergeben = false;
                artikel_table.childNodes.forEach(row => {
                    const p = row.firstChild.firstChild;
                    if (p != null) {
                        const row_id = p.getAttribute('data-id');
                        if (item[0].toString() == row_id) vergeben = true;
                    }
                });
                if (!vergeben) {
                    const opt = document.createElement('option');
                    opt.value = item[0].toString();
                    opt.textContent = item[1];
                    dropdown.appendChild(opt);
                }
            });
            dropdown.addEventListener('change', _ => {
                const selected_id = dropdown.value;
                if (selected_id == -1) return;
                const selected_item = artikelliste.filter(item => item[0] == selected_id)[0];
                addArtikelLine(artikel_table, selected_id, selected_item[1], selected_item[3], null);
                add_button.disabled = false;
                artikel_row.remove();
            });
            artikel_cell.appendChild(dropdown);
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
        // Buttons
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
        button.addEventListener('click', _ => {
            const new_name = name_input.value;
            const new_notizen = notizfeld.value;
            const artikel_list = [];
            const rows = artikel_table.childNodes;
            for (let i = 1; i < rows.length; i++) {
                if (add_button.disabled && i+1 == rows.length) break;
                artikel_list.push([i, 
                                   parseInt(rows[i].firstChild.firstChild.getAttribute('data-id')),
                                   (v => v == -1 ? 'null' : v)(parseInt(rows[i].querySelectorAll('td')[1].querySelector('select').value))
                                ]);
            }
            const url = is_new ? '/func/arten/create' : '/func/arten/edit';
            get_json(url, {'id': id, 'name': new_name, 'articles': artikel_list, 'notizen': new_notizen})
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

function addArtikelLine(tab, id_, name_, einheit, losgroesse) {
    const tr = document.createElement('tr');
    tab.appendChild(tr);
    // Zelle mit Namen
    let td = document.createElement('td');
    tr.appendChild(td);
    const p = document.createElement('p');
    td.appendChild(p);
    p.setAttribute('data-id', id_.toString());
    p.textContent = name_;
    // Zelle mit Losgröße
    td = document.createElement('td');
    tr.appendChild(td);
    const dropdown = document.createElement('select');
    td.appendChild(dropdown);
    const null_option = document.createElement('option');
    null_option.value = '-1';
    null_option.setAttribute('data-faktor', 1);
    null_option.setAttribute('data-offset', 0);
    null_option.textContent = einheit;
    dropdown.appendChild(null_option);
    artikelliste.filter(item => item[0] == id_)[0][2].forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name_;
        dropdown.appendChild(option);
        if (item.id == losgroesse) option.selected = true;
    });
    // Zelle mit Pfeil
    td = document.createElement('td');
    tr.appendChild(td);
    const up_button = document.createElement('button');
    const down_button = document.createElement('button');
    up_button.addEventListener('click', function() {
        const previous = tr.previousSibling;
        if (previous && previous.tagName == 'TR') {
            tab.insertBefore(tr, previous);
        } else {
            alert('Ja wat denn nu noch, ick bin ja nu schon janz oben. Höher jeht ja nu nicht mehr, Meester.');
        }
    });
    down_button.addEventListener('click', function() {
        const next = tr.nextSibling;
        if (next) {
            tab.insertBefore(next, tr);
        } else {
            alert('Ey jetzt bin ick schon so tief jesunken wie dit nur jeht und du willst mir noch tiefer schicken. Na schönen Dank ooch.');
        }
    });
    td.appendChild(up_button);
    td.appendChild(down_button);
    up_button.innerHTML = '&uArr;'
    down_button.innerHTML = '&dArr;';
    // Zelle mit Löschen
    td = document.createElement('td');
    tr.appendChild(td);
    const delete_button = document.createElement('button');
    td.appendChild(delete_button);
    delete_button.addEventListener('click', function() {tr.remove();});
    delete_button.innerHTML = '&#x1F5D1;&#xFE0F;';
}