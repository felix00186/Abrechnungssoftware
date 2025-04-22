function addInventurTools(div, artikel_table) {
    // Box erstellen
    const top_box = document.createElement('div');
    div.appendChild(top_box);
    top_box.className = 'container box';
    top_box.addEventListener('click', _ => toggleBox(div));
    const title_span = document.createElement('span');
    title_span.textContent = 'Tools für die Inventur';
    top_box.appendChild(title_span);
    const arrow_span = document.createElement('span');
    arrow_span.textContent = '▶';
    arrow_span.className = 'arrow';
    top_box.appendChild(arrow_span);
    const bottom_box = document.createElement('div');
    div.appendChild(bottom_box);
    bottom_box.className = 'content box closed';
    // Buttons und Funktionen hinzufügen
    addEndstandÜbernehmenButton(bottom_box, artikel_table);
    addEinkaufAnrechnenButton(bottom_box, artikel_table);
}

function toggleBox(div) {
    let content = div.querySelector('.content');
    let arrow = div.querySelector('.arrow');
    content.classList.toggle('expanded');
    content.classList.toggle('closed');
    arrow.classList.toggle('expanded_arrow');
}


// EINKAUF ANRECHNEN

function addEinkaufAnrechnenButton(div, artikel_table) {

}


// ENDSTÄNDE VON ANDEREN ÖFFNUNGEN ÜBERNEHMEN

function addEndstandÜbernehmenButton(div, artikel_table) {
    const end_div = document.createElement('div');
    div.appendChild(end_div);
    end_div.style.display = 'none';
    end_div.style.flexDirection = 'row';
    end_div.style.justifySelf = 'right';
    end_div.style.maxWidth = '95%';
    const end_button = document.createElement('button');
    div.appendChild(end_button);
    end_button.innerHTML = '&#x1F6AA; Endstand von anderer &Ouml;ffnung &uuml;bernehmen';
    end_button.id = 'end_button';
    const end_select = document.createElement('select');
    end_div.appendChild(end_select);
    oeffnungsliste.forEach(item => {
        const option = document.createElement('option');
        option.value = item[0];
        option.textContent = item[1];
        end_select.appendChild(option);
    });
    end_select.style.maxWidth = '80%';
    end_button.addEventListener('click', handleEndButtonClick(end_button, end_div));
    const best_button = document.createElement('button');
    end_div.appendChild(best_button);
    best_button.addEventListener('click', handleEndBestButtonClick(end_button, end_div, end_select, artikel_table));
    best_button.innerHTML = '&#x2714;&#xFE0F;';
    end_div.appendChild(best_button);
    const abbr_button = document.createElement('button');
    end_div.appendChild(abbr_button);
    abbr_button.innerHTML = '&#x274C;';
    abbr_button.addEventListener('click', handleEndAbbrButtonClick(end_button, end_div));
}

function handleEndButtonClick(end_button, end_div) {
    return _ => {
        end_div.style.display = 'flex';
        end_button.style.display = 'none';
    };
}

function handleEndBestButtonClick(end_button, end_div, end_select, artikel_table) {
    return _ => {
        end_div.style.display = 'none';
        end_button.style.display = 'flex';
        get_json('/func/oeffnungen/artikel', {'id': end_select.value})
        .then(resp => resp.forEach(artikel => {
            if (artikel.ende > 0)
                addArtikelLine(artikel_table, 
                               artikel.artikel.id, 
                               artikel.artikel.name, 
                               artikel.ende, 
                               0, 
                               0, 
                               artikel.ende,
                               artikel.kosten, 
                               artikel.artikel.einheit, 
                               artikel.los, 
                               0);
        }));
    };
}

function handleEndAbbrButtonClick(end_button, end_div) {
    return _ => {
        end_div.style.display = 'none';
        end_button.style.display = 'flex';
    };
}