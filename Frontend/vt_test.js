artikelliste = [];
bereichsliste = [];
oeffnungsliste = [];
get_json('/func/artikel/kosten', {}).then(list => {
    list.forEach(item => {
        artikelliste.push([item.id, item.name, item.einheit.lang, item.kosten]);
    });
});
get_json('/func/arten/liste', {}).then(list => {
    list.forEach(item => {
        bereichsliste.push([item.id, item.name]);
    });
});
get_json('/func/oeffnungen/liste', {'jahr': 2024}).then(list => {
    list.forEach(item => {
        oeffnungsliste.push([item.id, `${item.name}, ${item.datum.ansicht}`]);
    });
});

const cols = new ArtikeltabelleColumns();
cols.addNameColumn('Name');
cols.addLosgroesseColumn('Losgröße');
cols.addValueColumn('Anfang', true);
cols.addValueColumn('Plus', true);
cols.addValueColumn('Ende', false);
cols.addSumColumn('Differenz', [2, 3, 4]);
cols.addCostColumn('Kosten', 5);
cols.addDeleteColumn();

window.addEventListener('load', _ => {
    const tab = new Artikeltabelle(cols, artikelliste, oeffnungsliste, null, document.getElementById('edit_field'));
    tab.createTable();
});