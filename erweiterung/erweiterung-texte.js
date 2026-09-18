// Datei: erweiterung-texte.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Alle sichtbaren Texte der Erweiterung, nach dem Vorbild von
//        texte.js der App. Die App-Texte (texte.js) reisen unverändert
//        mit; hier stehen NUR die Texte, die es in der App nicht gibt:
//        das Symbol-Fenster, die Einblendungen in der Seite und die
//        kleinen Meldungen. Deutsch, keine Programmierer-Begriffe.

"use strict";
window.TB = window.TB || {};

TB.TE = {

  // ---- Symbol-Fenster (Popup) ---------------------------------------
  weltDev: "Testwelt (Dev)",
  weltProd: "Normale Welt",
  nichtAngemeldet: "Noch nicht angemeldet.",
  angemeldetAls: "Angemeldet als ",
  anzahlBausteine: "Bausteine an Bord: ",
  zuletztGeholt: "Zuletzt geholt: ",
  nieGeholt: "noch nie",
  fassung: "Fassung: ",
  mail: "E-Mail",
  passwort: "Passwort",
  anmelden: "Anmelden",
  abmelden: "Abmelden",
  jetztHolen: "Jetzt holen",
  holtGerade: "Holt …",
  uebungsfeldOeffnen: "Übungsfeld öffnen",
  seiteEinschalten: "Auf dieser Seite einschalten",
  seiteEntfernen: "Von dieser Seite entfernen",
  seitenTitel: "Eingeschaltete Seiten",
  keineSeiten: "Noch keine. Die Kürzel wirken nur auf Seiten, die Du hier einschaltest — und immer im Übungsfeld.",
  seiteEingeschaltet: "Eingeschaltet. Die Seite einmal neu laden, dann wirken die Kürzel dort.",
  seiteAbgelehnt: "Chrome hat die Erlaubnis nicht erteilt — nichts geändert.",
  seiteUnpassend: "Auf dieser Art von Seite kann die Erweiterung nicht wirken (z. B. Chrome-eigene Seiten).",
  anmeldungFehlt: "Bitte E-Mail und Passwort eintragen.",

  // ---- Meldungen in der Seite (Toast) --------------------------------
  unbekanntesKuerzel: "Kein Baustein mit dem Kürzel „;;%s“.",
  inZwischenablage: "Einfügen ging hier nicht — der Baustein liegt in der Zwischenablage: mit Strg+V einsetzen.",
  bausteinFehler: "Der Baustein meldet: ",

  // ---- Lücken-Fenster --------------------------------------------------
  lueckenEinfuegen: "Einfügen",
  abbrechen: "Abbrechen (Esc)",
  vorschau: "Vorschau",

  // ---- Such-Fenster (;;?) ----------------------------------------------
  sucheTitel: "Baustein suchen",
  sucheHinweis: "Tippen zum Filtern · Pfeiltasten wählen · Eingabetaste fügt ein · Esc schliesst",
  sucheLeer: "Kein Baustein passt."
};
