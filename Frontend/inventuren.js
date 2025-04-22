window.addEventListener('load', _ => {
    jahr = new Date().getFullYear();
    loadTable();
});

jahr = null;
artikelliste = [];

function setJahr(addition) {
    jahr += addition;
    loadTable();
}

function loadTable() {
    document.getElementById('jahreszahl').textContent = jahr.toString();
    const table = document.getElementById('inventurtable');
    table.innerHTML = '<tr><th>Datum</th><th>Wert</th><th class="button_title"><small>Bear-<br>beiten</small></th><th class="button_title"><small>L&ouml;-<br>schen</small></th></tr>';
    get_json('/func/inventur/liste', {'jahr': jahr}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id.toString());
            // Datum
            let td = document.createElement('td');
            td.innerHTML = item.datum.ansicht;
            tr.appendChild(td);
            // Wert
            td = document.createElement('td');
            tr.appendChild(td);
            td.innerHTML = getPreisString(item.wert);
            // Bearbeiten-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x1F58A;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.datum.parsed, item.name_, item.notizen, false));
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

function openEditField(id, datum, name_, notizen, is_new) {
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
            h2.textContent = 'Neue Inventur';
            h2.style.fontStyle = 'italic';
        } else {
            h2.textContent = 'Inventur vom ' + datum;
        }
        div.appendChild(h2);
        // Name
        const table = document.createElement('table');
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.textContent = 'Name des Zählenden:';
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
        // Artikelliste
        const artikel_title = document.createElement('h3');
        div.appendChild(artikel_title);
        artikel_title.textContent = 'Artikel-Liste';
        const hinweis_p = document.createElement('p');
        div.appendChild(hinweis_p);
        hinweis_p.textContent = 'Hinweis: Wenn von einem Artikel nichts mehr vorhanden ist, trage bitte 0 als Wert ein. Ansonsten wird davon ausgegangen, dass dieser Artikel nicht gezählt wurde und der Wert der letzten Zählung übernommen.';
        const artikel_table = document.createElement('table');
        artikel_table.className = 'standard';
        div.appendChild(artikel_table);
        artikel_table.innerHTML = '<tr style="font-weight:bold;"><td>Artikel</td><td>Menge</td><td>Wert</td><td>&#x1F5D1;&#xFE0F;</td></tr>';
        if (is_new) {
            
        } else {
            get_json('/func/inventur/stand', {'id': id}).then(resp => {
                resp.forEach(item => addArtikelLine(artikel_table, item.artikel.id, item.artikel.name, item.anfang, item.plus, item.ende, item.differenz, item.kosten, item.artikel.einheit));
            });
        }
        // Einfügen des Feldes
        const parent_field = document.getElementById('edit_field');
        parent_field.insertBefore(div, parent_field.firstChild);
        parent_field.prepend(document.getElementById('neu_button'));
        article_edit_list.push([id, div]);
        setTimeout(() => name_input.focus(), 0);
    }
}

function remove(id) {
    get_json('/func/inventur/delete', {'id': id}).then(resp => {
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