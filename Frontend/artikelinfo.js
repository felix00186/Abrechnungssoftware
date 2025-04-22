window.addEventListener('load', _ => { 
    jahr = new Date().getFullYear();
    loadTable();
});

jahr = null;

function setJahr(addition) {
    jahr += addition;
    loadTable();
    Array.from(document.getElementsByClassName('edit_field')).forEach(div => div.remove());
    article_edit_list = [];
}

function getMondayOfWeek(dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    date.setDate(date.getDate() - diffToMonday);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadTable() {
    document.getElementById('jahreszahl').textContent = jahr.toString();
    const table = document.getElementById('artikeltable');
    table.innerHTML = '<tr style="font-weight:bold;"><td>Name</td><td class="button_title">Info</td></tr>';
    get_json('/func/artikel/infoliste', {'jahr': jahr}).then(list => {
        list.forEach(item => {
            const tr = document.createElement('tr');
            // Name
            let td = document.createElement('td');
            td.innerHTML = item.name;
            tr.appendChild(td);
            // Ansehen-Button
            td = document.createElement('td');
            td.style.padding = 0;
            button = document.createElement('button');
            button.innerHTML = '&#x2139;&#xFE0F;';
            button.addEventListener('click', _ => openEditField(item.id, item.name, item.einheit));
            td.appendChild(button);
            tr.appendChild(td);
            // Zeile anhängen
            table.appendChild(tr);
        });
    });
}

article_edit_list = []

function openEditField(id, name_, einheit) {
    let is_open = false;
    article_edit_list.forEach(tuple => {
        if (tuple[0] == id) {
            const field = tuple[1];
            const parent = field.parentElement;
            parent.prepend(field);
            is_open = true;
        }
    });
    if (!is_open) {
        const div = document.createElement('div');
        div.setAttribute('data-id', id.toString());
        div.className = 'edit_field';
        // Schließen-Button
        const close_button = document.createElement('button');
        close_button.innerHTML = '&#x2716;&#xFE0F;';
        close_button.style.justifySelf = 'right';
        div.appendChild(close_button);
        close_button.addEventListener('click', _ => closeField(id, div));
        // Titel
        const h2 = document.createElement('h2');
        h2.textContent = name_;
        div.appendChild(h2);
        const startDate = new Date(jahr, 0, 1, 0, 0, 0);
        const endDate = new Date(jahr, 11, 31, 23, 59, 59);
        // Einkäufe 
        get_json('/func/artikel/einkaeufe', {'id': id, 'jahr': jahr}).then(resp => {
            const eink_h3 = document.createElement('h3');
            eink_h3.textContent = 'Einkäufe';
            div.appendChild(eink_h3);
            if (resp.length > 0) {
                const ek_table = document.createElement('table');
                ek_table.className = 'standard';
                div.appendChild(ek_table);
                ek_table.innerHTML = '<tr style="font-weight:bold;"><td>Datum</td><td>Laden</td><td>Preis</td><td>Menge</td><td>Einzelpreis</td></tr>';
                resp.forEach(item => {
                    let row = document.createElement('tr');
                    ek_table.appendChild(row);
                    let cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = item.datum;
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = item.laden;
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = getPreisString(item.gesamt);
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = `${getFloatString(item.menge)} ${einheit}`;
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = getPreisString(item.einzel);
                });
                const preis_summe = resp.map(item => item.gesamt).reduce((a, b) => a + b, 0);
                const menge_summe = resp.map(item => item.menge).reduce((a, b) => a + b, 0);
                const schnitt = Math.round(preis_summe / menge_summe);
                const sum_row = document.createElement('tr');
                ek_table.appendChild(sum_row);
                sum_row.style.fontWeight = 'bold';
                let sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = 'SUMME';
                sum_cell.setAttribute('colspan', '2');
                sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = getPreisString(preis_summe);
                sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = `${getFloatString(menge_summe)} ${einheit}`;
                sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = getPreisString(schnitt);
                // Diagramm zeichnen
                const canvas_div = document.createElement('div');
                div.append(canvas_div);
                const canvas = document.createElement('canvas');
                canvas_div.appendChild(canvas);
                let einkauf_groups = resp.reduce((acc, item) => {
                    const key = `${item.datum}§${item.einzel}`;
                        if (!acc[key]) {
                            acc[key] = {
                                datum: item.datum_parsed,
                                menge: 0,
                                preis: item.einzel
                            }
                        }
                        acc[key].menge += item.menge;
                        return acc;
                    }, {});
                einkauf_groups = Object.values(einkauf_groups);
                const max_menge = Math.max(...einkauf_groups.map(item => item.menge));
                const data = {
                    labels: einkauf_groups.map(item => item.datum),
                    datasets: [{
                        label: 'Einkaufspreis',
                        data: einkauf_groups.map(item => ({
                                x: item.datum,
                                y: item.preis/100.0,
                                r: Math.sqrt(item.menge / max_menge) * 20
                            })),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                };
                const config = {
                    type: 'bubble',
                    data: data,
                    options: {
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'month'
                                },
                                min: startDate,
                                max: endDate,
                                title: {
                                    display: true,
                                    text: 'Datum'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Einzelpreis (€)'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(tooltipItem) {
                                        return `Preis: ${tooltipItem.raw.y} €, Menge: ${einkauf_groups[tooltipItem.dataIndex].menge} ${einheit}`;
                                    }
                                }
                            }
                        }
                    }
                };
                const context = canvas.getContext('2d');
                new Chart(context, config);
            } else {
                const hinweis = document.createElement('p');
                div.appendChild(hinweis);
                hinweis.textContent = `Im Jahr ${jahr} gibt es keine Einkäufe zu diesem Artikel.`;
            }
        });
        // Verbrauche
        get_json('/func/artikel/verbrauche', {'id': id, 'jahr': jahr}).then(resp => {
            const ve_h3 = document.createElement('h3');
            ve_h3.textContent = 'Verbrauche';
            div.appendChild(ve_h3);
            if (resp.length > 0) {
                const ve_table = document.createElement('table');
                ve_table.className = 'standard';
                div.appendChild(ve_table);
                ve_table.innerHTML = '<tr style="font-weight:bold;"><td>Datum</td><td>Name</td><td>Menge</td><td>Preis</td></tr>';
                let preise_da = true;
                resp.forEach(item => {
                    let row = document.createElement('tr');
                    ve_table.appendChild(row);
                    let cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = item.datum;
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = item.name_;
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = `${getFloatString(item.differenz)} ${einheit}`;
                    cell = document.createElement('td');
                    row.appendChild(cell);
                    cell.textContent = item.preis_da ? getPreisString(item.preis) : '?';
                    preise_da &= item.preis_da;
                });
                const preis_summe = resp.map(item => item.preis).reduce((a, b) => a + b, 0);
                const menge_summe = resp.map(item => item.differenz).reduce((a, b) => a + b, 0);
                const sum_row = document.createElement('tr');
                ve_table.appendChild(sum_row);
                sum_row.style.fontWeight = 'bold';
                let sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = 'SUMME';
                sum_cell.setAttribute('colspan', '2');
                sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = `${getFloatString(menge_summe)} ${einheit}`;
                sum_cell = document.createElement('td');
                sum_row.appendChild(sum_cell);
                sum_cell.textContent = preise_da ? getPreisString(preis_summe) : '?';
                // Diagramm zeichnen
                const canvas_div = document.createElement('div');
                div.append(canvas_div);
                const canvas = document.createElement('canvas');
                canvas_div.appendChild(canvas);
                canvas.style.width = '90%';
                let verbrauch_groups = resp.reduce((acc, item) => {
                        const key = getMondayOfWeek(item.datum_parsed);
                        if (!acc[key]) {
                            acc[key] = 0
                        }
                        acc[key] += item.differenz;
                        return acc;
                    }, {});
                verbrauch_groups = Object.entries(verbrauch_groups);
                const labels = verbrauch_groups.map(data => data[0]);
                const dataPoints = verbrauch_groups.map(data => data[1]);
                console.log(dataPoints);
                const data = {
                    labels: labels,
                    datasets: [{
                        label: `Verbrauch (${einheit})`,
                        data: dataPoints,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                };
                const config = {
                    type: 'bar',
                    data: data,
                    options: {
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'week', // Zeitachse in Wochen
                                    stepSize: 1,  // Intervall zwischen den Wochen
                                    tooltipFormat: 'dd.MM.yyyy', // Format des Tooltips
                                    displayFormats: {
                                        week: 'dd.MM.yyyy' // Format der x-Achsen-Beschriftung
                                    }
                                },
                                min: startDate,
                                max: endDate,
                                title: {
                                    display: true,
                                    text: 'Datum'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: `Wochenverbrauch (${einheit})`
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                };
                // Zeichnen des Diagramms
                const context = canvas.getContext('2d');
                new Chart(context, config);
            } else {
                const hinweis = document.createElement('p');
                div.appendChild(hinweis);
                hinweis.textContent = `Im Jahr ${jahr} gibt es keine aufgezeichneten Verbrauche zu diesem Artikel.`;
            }
        });
        // Anhängen
        const parent_field = document.getElementById('edit_field');
        parent_field.insertBefore(div, parent_field.firstChild);
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