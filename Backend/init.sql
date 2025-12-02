create table Einkaeufe
(
    id              INTEGER primary key,
    datum           DATE    not null,
    laden           TEXT    not null    default '',
    notizen         TEXT    not null    default '',
    einkaeufer      TEXT    not null    default ''
);

create table EinkaufArtikel
(
    einkauf         INTEGER not null                    references Einkaeufe(id),
    getraenk        INTEGER not null                    references Getraenke(id),
    menge           REAL    not null    default 0                                           check (menge > 0),
    gesamt_netto    INTEGER not null    default 0                                           check (gesamt_netto >= 0),
    einzel_netto    INTEGER not null    default 0                                           check (einzel_netto >= 0),
    mwst            REAL    not null    default 0                                           check (mwst >= 0),
    gesamt_brutto   INTEGER not null    default 0                                           check (gesamt_brutto >= 0),
    losgroesse      INTEGER             default null    references Losgroessen(id),
    orig_menge      REAL    not null    default 0                                           check (orig_menge >= 0),
    metadata        TEXT                default null
);

create table EinkaufBereich
(
    einkauf         INTEGER not null                    references Einkaeufe(id),
    bereich         INTEGER not null                    references Oeffnungsarten(id),
    netto           INTEGER not null    default 0                                           check (netto >= 0),
    mwst            REAL    not null    default 0                                           check (mwst >= 0),
    brutto          INTEGER not null    default 0                                           check (brutto >= 0)
);

create table EinkaufOeffnung
(
    einkauf         INTEGER not null                    references Einkaeufe(id),
    oeffnung        INTEGER not null                    references Oeffnungen(id),
    netto           INTEGER not null    default 0                                           check (netto >= 0),
    mwst            REAL    not null    default 0                                           check (mwst >= 0),
    brutto          INTEGER not null    default 0                                           check (brutto >= 0)
);

create table Einnahmen
(
    id              INTEGER primary key,
    oeffnung        INTEGER not null                    references Oeffnungen(id),
    name            TEXT    not null    default '',
    brutto          INTEGER not null    default 0                                           check (brutto >= 0),
    mwst            INTEGER not null    default 19                                          check (mwst between 0 and 99),
    zehnt           INTEGER not null    default 10                                          check (zehnt between 0 and 99),
    netto           INTEGER not null    default 0                                           check (netto >= 0)
);

create table Getraenke
(
    id              INTEGER primary key,
    name            TEXT    not null    default '',
    einheit_lang    TEXT    not null    default 'Liter'                                     check (einheit_lang in ('Liter', 'Centiliter', 'Milliliter', 'Kilogramm', 'Gramm', 'Stück', 'Flaschen', 'Dosen', 'Kannen', 'Packungen', 'Kilometer')),
    einheit_kurz    TEXT    not null    default 'l'                                         check (einheit_kurz in ('l', 'cl', 'ml', 'kg', 'g', 'Stk.', 'Fl.', 'Dos.', 'Kan.', 'Pck.', 'km')),
    sichtbar        TINYINT not null    default 1                                           check (sichtbar in (0, 1)),
    reste           TINYINT not null    default 1                                           check (reste in (0, 1)),
    notizen         TEXT    not null    default '',
    bereich         INTEGER             default null    references Oeffnungsarten(id),
    check (einheit_kurz = case einheit_lang when 'Liter'       then 'l'
                                            when 'Centiliter'  then 'cl'
                                            when 'Milliliter'  then 'ml'
                                            when 'Kilogramm'   then 'kg'
                                            when 'Gramm'       then 'g'
                                            when 'Stück'       then 'Stk.'
                                            when 'Flaschen'    then 'Fl.'
                                            when 'Dosen'       then 'Dos.'
                                            when 'Kannen'      then 'Kan.'
                                            when 'Packungen'   then 'Pck.'
                                            when 'Kilometer'   then 'km'
                                            else '__INVALID__' end)
);

create table Kalkulationen
(
    id              INTEGER primary key,
    name            TEXT    not null    default '',
    preis           INTEGER not null    default 0                                           check (preis >= 0),
    notizen         TEXT    not null    default '',
    anzeigen        TINYINT not null    default 1                                           check (anzeigen in (0, 1))
);

create table KalkulationenArtikel
(
    kalk            INTEGER not null                    references Kalkulationen(id),
    artikel         INTEGER not null                    references Getraenke(id),
    menge           REAL    not null    default 0                                           check (menge >= 0)
);

create table KalkulationenSonstigeArtikel
(
    kalk            INTEGER                             references Kalkulationen(id),
    name            TEXT    not null    default '',
    einzelpreis     INTEGER not null    default 0,
    menge           REAL    not null    default 0                                           check (menge >= 0)
);

create table Losgroessen
(
    id              INTEGER primary key,
    getraenk        INTEGER not null                    references Getraenke(id),
    name            TEXT    not null    default '',
    faktor          REAL    not null    default 0,
    summand         REAL                default 0,
    sichtbar        TINYINT not null    default 1                                           check (sichtbar in (0, 1)),
    check (not(faktor = 0 and summand = 0))
);

create table Oeffnungen
(
    id              INTEGER primary key,
    datum           DATE    not null,
    art             INTEGER not null                    references Oeffnungsarten(id),
    notizen         TEXT    not null    default '',
    name            TEXT    not null    default ''
);

create table OeffnungenVerbrauch
(
    oeffnung        INTEGER not null                    references Oeffnungen(id),
    getraenk        INTEGER not null                    references Getraenke(id),
    anfang          REAL    not null    default 0.0                                         check (anfang >= 0),
    plus            REAL    not null    default 0.0                                         check (plus >= 0),
    ende            REAL    not null    default 0.0                                         check (ende >= 0),
    differenz       REAL    not null    default 0.0                                         check (differenz >= 0),
    losgroesse      INTEGER             default null    references Losgroessen(id),
    differenz_orig  REAL    not null    default 0.0                                         check (differenz_orig >= 0),
    metadata        TEXT                default null
);

create table Oeffnungsarten
(
    id              INTEGER primary key,
    name            TEXT    not null    default 'Öffnung'                                   check (length(name) > 0),
    sichtbar        TINYINT not null    default 1                                           check (sichtbar in (0, 1)),
    notizen         TEXT    not null    default ''
);

create table OeffnungsartGetraenke
(
    id              INTEGER not null                    references Oeffnungsarten(id),
    getraenk        INTEGER not null                    references Getraenke(id),
    nummer          INTEGER not null    default 0                                           check (nummer >= 0),
    losgroesse      INTEGER             default null    references Losgroessen(id)
);

create table VerbrauchsabrechnungStandardArtikel
(
    getraenk        INTEGER                             references Getraenke(id)
);

INSERT INTO Oeffnungsarten VALUES (0, '> keinem Bereich zugeordnet', 1, '');
