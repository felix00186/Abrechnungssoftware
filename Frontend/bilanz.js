function datePickerChange() {
    const von = document.getElementById('date_von').value;
    const bis = document.getElementById('date_bis').value;
    document.getElementById('commit_button').disabled = von == '' || bis == '' || von == null || bis == null;
}

function erstelleBericht() {
    // Einlesen der Einstellungen
    const von = document.getElementById('date_von').value;
    const bis = document.getElementById('date_bis').value;
    const option_artikel = document.getElementById('checkbox1').checked;
    const option_einkaeufe = document.getElementById('checkbox2').checked;
    // Titel
    const von_parsed = new Date(von);
    const bis_parsed = new Date(bis);
    const next_day = new Date(bis_parsed);
    next_day.setDate(next_day.getDate()+1);
    let titel = 'Finanzbericht';
    let zeit_str = `${von_parsed.getDate()}.${von_parsed.getMonth()+1}.${von_parsed.getFullYear()} - ${bis_parsed.getDate()}.${bis_parsed.getMonth()+1}.${bis_parsed.getFullYear()}`;
    if (von_parsed.getMonth() == 0 && von_parsed.getDate() == 1
        && bis_parsed.getMonth() == 11 && bis_parsed.getDate() == 31
        && von_parsed.getFullYear() == bis_parsed.getFullYear()) {
            titel = 'Jahres-Finanzbericht';
            zeit_str = von_parsed.getFullYear().toString();
    } else
    if (von_parsed.getDate() == 1 && next_day.getDate() == 1
        && von_parsed.getMonth() == bis_parsed.getMonth()
        && von_parsed.getFullYear() == bis_parsed.getFullYear()) {
            titel = 'Monats-Finanzbericht';
            zeit_str = `${von_parsed.getMonth()+1}.${von_parsed.getFullYear()}`;
    } else
    if (von_parsed.getDate() == 1 && next_day.getDate() == 1
        && von_parsed.getMonth() in [0, 6]
        && bis_parsed.getMonth() == von_parsed.getMonth()+5
        && von_parsed.getFullYear() == bis_parsed.getFullYear()) {
            titel = 'Halbjahres-Finanzbericht';
            zeit_str = `${von_parsed.getFullYear()} / ${von_parsed.getMonth() == 0 ? 'I' : 'II'}`;
    } else
    if (von_parsed.getDate() == 1 && next_day.getDate() == 1
        && von_parsed.getMonth() in [0, 3, 6, 9]
        && bis_parsed.getMonth() == von_parsed.getMonth() + 2
        && von_parsed.getFullYear() == bis_parsed.getFullYear()) {
            titel = 'Quartals-Finanzbericht';
            let quartal;
            switch (von_parsed.getMonth()) {
                case 0: {quartal = 'I'; break;}
                case 3: {quartal = 'II'; break;}
                case 6: {quartal = 'III'; break;}
                case 9: {quartal = 'IV'; break;}
            }
            zeit_str = `${von_parsed.getFullYear()} / ${quartal}`;
    }
    document.getElementById('bilanz_titel').textContent = titel;
    document.getElementById('bilanz_zeitraum').textContent = zeit_str;
    // Laden der Bilanz
    get_json('/func/bilanz/detail', {'von': von, 'bis': bis}).then(resp => {
        console.log(resp);
        document.getElementById('einnahmen_feld').textContent = getPreisString(resp.summe_einnahmen);
        document.getElementById('ausgaben_feld').textContent = getPreisString(resp.summe_ausgaben);
        document.getElementById('saldo_feld').textContent = getPreisString(resp.summe_einnahmen - resp.summe_ausgaben);
        // Bereiche
        let div = document.getElementById('bereiche');
        resp.bereiche.forEach(bereich => {
            titel = document.createElement('h2');
            div.appendChild(titel);
            titel.textContent = bereich.name;
            titel.style.paddingTop = '40px';
            // Bilanz-Tabelle
            let p = document.createElement('p');
            div.appendChild(p);
            p.textContent = 'Für diesen Bereich ergibt sich die folgende Bilanz:';
            let table = document.createElement('table');
            div.appendChild(table);
            let tr = document.createElement('tr');
            table.appendChild(tr);
            let td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = 'Einnahmen';
            td.style.paddingRight = '20px';
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = getPreisString(bereich.summe_einnahmen);
            td.style.textAlign = 'right';
            tr = document.createElement('tr');
            table.appendChild(tr);
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = 'Ausgaben';
            td.style.paddingRight = '20px';
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = getPreisString(bereich.summe_ausgaben);
            td.style.textAlign = 'right';
            tr = document.createElement('tr');
            table.appendChild(tr);
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = 'Saldo';
            td.style.paddingRight = '20px';
            td = document.createElement('td');
            tr.appendChild(td);
            td.textContent = getPreisString(bereich.summe_einnahmen - bereich.summe_ausgaben);
            td.style.textAlign = 'right';
            // Einnahmen und Verbrauche
            if (bereich.oeffnungen.length > 0) {
                let h3 = document.createElement('h3');
                div.appendChild(h3);
                h3.textContent = 'Einnahmen und Verbrauche';
                p = document.createElement('p');
                div.appendChild(p);
                p.textContent = 'Hier finden sich alle Möglichkeiten, bei denen Einnahmen erzielt wurden. Diesen zugeordnet sind Verbrauche und Einkäufe, die direkt dieser Einnahme zuzuordnen sind.';
                bereich.oeffnungen.forEach(oeffnung => {
                    const feld = document.createElement('div');
                    feld.className = 'edit_field';
                    div.appendChild(feld);
                    const h4 = document.createElement('b');
                    feld.appendChild(h4);
                    h4.textContent = oeffnung.name;
                    h4.style.textDecorationLine = 'underline';
                    p = document.createElement('p');
                    feld.appendChild(p);
                    p.textContent = oeffnung.datum;
                    // Öffnungs-Einnahmen
                    if (oeffnung.einnahmen.length > 0) {
                        table = document.createElement('table');
                        feld.appendChild(table);
                        table.style.border = '1px solid gray';
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        td = document.createElement('td');
                        td.setAttribute('colspan', '5');
                        tr.appendChild(td);
                        td.style.fontWeight = 'bold';
                        td.style.textAlign = 'center';
                        td.textContent = 'Einnahmen';
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        ['Bezeichnung', 'brutto', 'MwSt.', 'e.V.-Zehnt', 'netto'].forEach(bez => {
                            td = document.createElement('td');
                            tr.appendChild(td);
                            td.textContent = bez;
                            td.style.fontStyle = 'italic';
                            td.style.borderBottom = '1px solid gray';
                        });
                        oeffnung.einnahmen.forEach(einnahme => {
                            tr = document.createElement('tr');
                            table.appendChild(tr);
                            td = document.createElement('td');
                            tr.appendChild(td);
                            td.textContent = einnahme.name;
                            [einnahme.brutto, einnahme.mwst, einnahme.zehnt, einnahme.netto].forEach(e => {
                                td = document.createElement('td');
                                tr.appendChild(td);
                                td.textContent = getPreisString(e);
                            });
                        });
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        td = document.createElement('td');
                        td.style.borderTop = '1px solid gray';
                        tr.appendChild(td);
                        td.setAttribute('colspan', '4');
                        td.textContent = 'SUMME';
                        td = document.createElement('td');
                        td.style.borderTop = '1px solid gray';
                        tr.appendChild(td);
                        td.textContent = getPreisString(oeffnung.summe_einnahmen);
                        td.style.textDecorationLine = 'underline';
                        td.style.textDecorationStyle = 'double';
                    }
                    // Öffnungs-Verbrauche
                    if (oeffnung.verbrauch.length > 0) {
                        table = document.createElement('table');
                        table.style.marginTop = '30px';
                        feld.appendChild(table);
                        table.style.border = '1px solid gray';
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        td = document.createElement('td');
                        td.setAttribute('colspan', '3');
                        tr.appendChild(td);
                        td.style.fontWeight = 'bold';
                        td.style.textAlign = 'center';
                        td.textContent = 'Verbrauchte Artikel';
                        if (option_artikel) {
                            tr = document.createElement('tr');
                            table.appendChild(tr);
                            ['Bezeichnung', 'Menge', 'Wert netto'].forEach(bez => {
                                td = document.createElement('td');
                                tr.appendChild(td);
                                td.textContent = bez;
                                td.style.fontStyle = 'italic';
                                td.style.borderBottom = '1px solid gray';
                            });
                            oeffnung.verbrauch.forEach(verbrauch => {
                                tr = document.createElement('tr');
                                table.appendChild(tr);
                                td = document.createElement('td');
                                tr.appendChild(td);
                                td.textContent = verbrauch.name;
                                td = document.createElement('td');
                                tr.appendChild(td);
                                td.textContent = `${getFloatString(verbrauch.menge)} ${verbrauch.einheit}`;
                                td = document.createElement('td');
                                tr.appendChild(td);
                                td.textContent = getPreisString(verbrauch.kosten);
                            });
                        }
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        td = document.createElement('td');
                        td.style.borderTop = '1px solid gray';
                        tr.appendChild(td);
                        td.setAttribute('colspan', '2');
                        td.textContent = 'SUMME';
                        td = document.createElement('td');
                        td.style.borderTop = '1px solid gray';
                        tr.appendChild(td);
                        td.textContent = getPreisString(oeffnung.verbrauch.map(v => v.kosten).reduce((a, b) => a + b, 0));
                        td.style.textDecorationLine = 'underline';
                        td.style.textDecorationStyle = 'double';
                    }
                    // Einkäufe für die Öffnung
                    if (oeffnung.einkaeufe.length > 0) {
                        table = document.createElement('table');
                        table.style.marginTop = '30px';
                        feld.appendChild(table);
                        table.style.border = '1px solid gray';
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        td = document.createElement('td');
                        td.setAttribute('colspan', '3');
                        tr.appendChild(td);
                        td.style.fontWeight = 'bold';
                        td.style.textAlign = 'center';
                        td.textContent = 'Einkäufe für diese Öffnung';
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        ['Datum', 'Verkäufer', 'Preis netto'].forEach(bez => {
                            td = document.createElement('td');
                            tr.appendChild(td);
                            td.textContent = bez;
                            td.style.fontStyle = 'italic';
                            td.style.borderBottom = '1px solid gray';
                        });
                        oeffnung.einkaeufe.forEach(einkauf => {
                            tr = document.createElement('tr');
                            table.appendChild(tr);
                            td = document.createElement('td');
                            tr.appendChild(td);
                            td.textContent = einkauf.datum;
                            td = document.createElement('td');
                            tr.appendChild(td);
                            td.textContent = einkauf.laden;
                            td = document.createElement('td');
                            tr.appendChild(td);
                            td.textContent = getPreisString(einkauf.kosten);
                        });
                        tr = document.createElement('tr');
                        table.appendChild(tr);
                        td = document.createElement('td');
                        td.style.borderTop = '1px solid gray';
                        tr.appendChild(td);
                        td.setAttribute('colspan', '2');
                        td.textContent = 'SUMME';
                        td = document.createElement('td');
                        td.style.borderTop = '1px solid gray';
                        tr.appendChild(td);
                        td.textContent = getPreisString(oeffnung.einkaeufe.map(v => v.kosten).reduce((a, b) => a + b, 0));
                        td.style.textDecorationLine = 'underline';
                        td.style.textDecorationStyle = 'double';
                    }
                });
            }
            // Verbrauche
            h3 = document.createElement('h3');
            div.appendChild(h3);
            h3.textContent = 'Verbrauche';
            p = document.createElement('p');
            div.appendChild(p);
            p.textContent = 'Hier finden sich Verbrauche, die diesem Bereich, aber nicht einer speziellen Öffnung, zugewiesen sind.';
            // Einkäufe
            h3 = document.createElement('h3');
            div.appendChild(h3);
            h3.textContent = 'Einkäufe';
            p = document.createElement('p');
            div.appendChild(p);
            p.textContent = 'Hier finden sich alle Einkäufe, die für diesen Bereich, aber nicht für eine spezielle Öffnung oder klar definierten Verbrauchsartikel getätigt wurden.';
        });
    });
}