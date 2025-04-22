function get_json(url, body) {
    const options = {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(body)
    };
    return fetch(url, options)
        .then(response => { return response.json(); })
        .catch(_ => { return null; });
}

function getPreisString(i) {
    if (i == null) return 'unbekannt';
    i = Math.round(i);
    let vorzeichen = '';
    if (i < 0) { vorzeichen = '- '; i *= -1; }
    const euro = (~~(i / 100)).toString();
    const cent = (i % 100).toString();
    return vorzeichen + euro + ',' + (cent.length < 2 ? '0' + cent : cent) + '\u00a0€';
}

function getPreisInteger(s) {
    const regex = /\d+([,.]\d{1,2})?\s*€?/;
    try {
        if (!regex.test(s)) return null;
        s = s.replace(' ', '').replace('\u00a0', '').replace('€', '').replace(',', '.').split('.');
        let euro = s[0];
        let cent = s.length == 2 ? s[1] : 0;
        if (cent.length == 1) cent += '0';
        return parseInt(euro) * 100 + parseInt(cent);
    } catch {
        return null;
    }
}

function getFloatString(f) {
    if (f === null) return 'unbekannt';
    if (Number.isInteger(f)) {
        return f.toString();
    } else {
        return f.toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
    }
}

function getIntegerOrFloat(s) {
    s = s.replace(',', '.');
    try {
        if (s.includes('.')) {
            return parseFloat(s);
        } else {
            return parseInt(s);
        }
    } catch {
        return null;
    }
}

function dateFromYYYYMMTTtoTTMMYYYY(d) {
    d = d.split('-');
    return `${d[2]}.${d[1]}.${d[0]}`;
}