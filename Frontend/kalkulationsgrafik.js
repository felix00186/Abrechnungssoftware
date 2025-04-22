cell_entry = null;

window.onload = function() {
    const new_preise = getUrlParams();
    const feld = document.getElementById('feld');
    const max_width = document.getElementById('content').getBoundingClientRect().width - 250;
    const backgroundColors = ['rgb(255, 0, 0)', 'rgb(255, 102, 102)', 'rgb(255, 204, 204)', 'rgb(0, 255, 0)'];
    get_json('/func/kalk/diagramm', new_preise).then(resp => {
        const max_preis = Math.max(...resp.map(item => item.preis));
        resp.forEach(item => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', item.id);
            row.setAttribute('data-preis', item.preis);
            feld.appendChild(row);
            const cell1 = document.createElement('td');
            row.appendChild(cell1);
            const p = document.createElement('p');
            cell1.appendChild(p);
            p.textContent = item.name;
            if (item.preis_original != null && item.preis_original != item.preis) {
                row.setAttribute('data-bearbeitet', 1);
                const p2 = document.createElement('p');
                p2.style.color = 'gray';
                p2.textContent = getPreisString(item.preis_original);
                cell1.appendChild(p2);
            }
            const input = document.createElement('input');
            input.style.width = '70px';
            input.addEventListener('focusin', _ => {
                cell_entry = input.value;
                setTimeout(() => input.select(), 0);
            });
            input.addEventListener('focusout', _ => {
                if (input.value != cell_entry) {
                    const new_value = getPreisInteger(input.value);
                    if (new_value == null || new_value < 0) {
                        alert('Das ist kein gültiger Preis.');
                        input.value = cell_entry;
                    } else {
                        new_preise[item.id.toString()] = new_value;
                        const url = Object.entries(new_preise)
                                    .map(tuple => `id${tuple[0]}=${tuple[1]}`)
                                    .join('&');
                        window.location.href = '/kalkulationsgrafik.html?' + url;
                    }
                }
            });
            cell1.appendChild(input);
            input.value = getPreisString(item.preis);
            const cell2 = document.createElement('td');
            row.appendChild(cell2);
            const cell3 = document.createElement('td');
            row.appendChild(cell3);
            cell3.innerHTML = `${item.faktor.toFixed(2)}&#215;`;
            const components = [
                ['Wareneinsatz', item.waren],
                ['e.V.-Zehnt', item.zehnt],
                ['Mehrwertsteuer', item.mwst],
                ['Gewinn', item.gewinn]
            ];
            const canvas = document.createElement('canvas');
            cell2.appendChild(canvas);
            canvas.style.height = '100px';
            canvas.style.width = `${Math.round(item.preis/max_preis*max_width)}px`;
            const data = components.map(component => component[1]);
            const total = data.reduce((acc, amount) => acc + amount, 0);
            const relativeData = data.map(amount => (amount / total) * 100);
            const ctx = canvas.getContext('2d');
            const labels = components.map(component => getPreisString(component[1]));
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
                    responsive: false,
                    maintainAspectRatio: false,
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
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,  // Aktiviert das Stapeln der Balken
                            beginAtZero: true,
                            min: 0,
                            max: 100,
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
        });
    });
};

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
        if (key.startsWith('id')) {
            const newKey = key.slice(2);
            result[newKey] = Number(value);
        }
    }
    return result;
}

function savePrices() {
    const table = document.getElementById('feld');
    const data = Array.from(table.querySelectorAll('tr'))
        .filter(row => row.hasAttribute('data-bearbeitet'))
        .map(row => [row.getAttribute('data-id'), row.getAttribute('data-preis')]);
    get_json('/func/kalk/set_prices', data).then(_ => { window.location.href = '/kalkulationsgrafik.html'; });
}