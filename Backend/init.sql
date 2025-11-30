create table Einkaeufe
(
    id         INTEGER primary key,
    datum      DATE,
    laden      TEXT default '',
    notizen    TEXT default '',
    einkaeufer TEXT default ''
);
create table EinkaufArtikel
(
    einkauf       INTEGER
        constraint ea_einkauf references Einkaeufe,
    getraenk      INTEGER
        constraint ea_artikel references Getraenke,
    menge         REAL    default 0,
    gesamt_netto  INTEGER default 0,
    einzel_netto  INTEGER default 0,
    mwst          REAL    default 0,
    gesamt_brutto INTEGER default 0,
    losgroesse    INTEGER default NULL,
    orig_menge    REAL    default 0,
    metadata      TEXT    default NULL
);
create table EinkaufBereich
(
    einkauf INTEGER
        constraint eb_einkauf references Einkaeufe,
    bereich INTEGER
        constraint eb_bereich references Oeffnungsarten,
    netto   INTEGER     default 0,
    mwst    REAL        default 0,
    brutto  INTEGER     default 0
);
create table EinkaufOeffnung
(
    einkauf  INTEGER
        constraint eo_einkauf references Einkaeufe,
    oeffnung INTEGER
        constraint eo_oeffnung references Oeffnungen,
    netto    INTEGER default 0,
    mwst     REAL    default 0,
    brutto   INTEGER default 0
);
create table Einnahmen
(
    id       INTEGER primary key,
    oeffnung INTEGER
        constraint einn_oeffnung references Oeffnungen,
    name     TEXT    default '',
    brutto   INTEGER default 0,
    mwst     INTEGER default 19,
    zehnt    INTEGER default 10,
    netto    INTEGER default 0
);
create table Getraenke
(
    id           INTEGER primary key,
    name         TEXT default '',
    einheit_lang TEXT default 'Liter',
    einheit_kurz TEXT default 'l',
    sichtbar     TINYINT default 1,
    reste        TINYINT default 1,
    notizen      TEXT    default NULL,
    bereich      INTEGER
        constraint getr_bereich references Oeffnungsarten
);
create table Kalkulationen
(
    id       INTEGER primary key,
    name     TEXT default '' not null,
    preis    INTEGER default 0,
    notizen  TEXT default '',
    anzeigen TINYINT default 1
);
create table KalkulationenArtikel
(
    kalk    INTEGER
        constraint ka_kalk references Kalkulationen,
    artikel INTEGER
        constraint ka_art references Getraenke,
    menge   REAL default 0
);
create table KalkulationenSonstigeArtikel
(
    kalk        INTEGER
        constraint ksa_kalk references Kalkulationen,
    name        TEXT    default '',
    einzelpreis INTEGER default 0,
    menge       REAL    default 0
);
create table Losgroessen
(
    id       INTEGER primary key,
    getraenk INTEGER not null
        constraint losgroesse_artikel references Getraenke,
    name     TEXT    default '' not null,
    faktor   REAL    default 0  not null,
    summand  REAL    default 0  not null,
    sichtbar TINYINT default 1  not null
);
create table Oeffnungen
(
    id      INTEGER primary key,
    datum   DATE,
    art     INTEGER
        constraint oef_art references Oeffnungsarten,
    notizen TEXT,
    name    TEXT default ''
);
create table OeffnungenVerbrauch
(
    oeffnung       INTEGER
        constraint ov_oeff references Oeffnungen,
    getraenk       INTEGER
        constraint ov_art references Getraenke,
    anfang         REAL,
    plus           REAL,
    ende           REAL,
    differenz      REAL,
    losgroesse     INTEGER,
    differenz_orig REAL default NULL,
    metadata       TEXT default NULL
);
create table Oeffnungsarten
(
    id       INTEGER primary key,
    name     TEXT default '',
    sichtbar TINYINT default 1,
    notizen  TEXT default ''
);
create table OeffnungsartGetraenke
(
    id         INTEGER
        constraint og_oeart references Oeffnungsarten,
    getraenk   INTEGER
        constraint og_art references Getraenke,
    nummer     INTEGER,
    losgroesse INTEGER
        constraint og_los references Losgroessen
);
create table VerbrauchsabrechnungStandardArtikel
(
    getraenk INTEGER
        constraint FK__Getraenke references Getraenke
);

INSERT INTO Oeffnungsarten VALUES (0, '> keinem Bereich zugeordnet', 1, '');