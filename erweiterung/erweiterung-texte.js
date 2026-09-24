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
  faecherLeeren: "Fächer leeren",
  anmeldungMerken: "Anmeldung merken — meldet sich nach Ablauf selbst neu an (gespeichert nur auf diesem Gerät)",
  faecherGeleert: "Alle Fächer sind geleert.",

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
  sucheHinweis: "Tippen zum Filtern (auch im Text) · Pfeiltasten wählen · Eingabetaste fügt ein · Esc schliesst",
  sucheLeer: "Kein Baustein passt.",

  // ---- Auswahl-Fenster beim Tippen ---------------------------------------
  wahlHaeufigste: "——  Häufigste  ——",
  wahlAlphabetisch: "——  Alphabetisch  ——",
  wahlHinweis: "Klick fügt ein · Esc schliesst · Weitertippen verfeinert",

  // ---- Fächer (Zwischenspeicher) ------------------------------------------
  faecherKopf: "Zwischenspeicher — Klick setzt ein",
  faecherMerkenKopf: "Zwischenspeicher — Klick merkt die Zwischenablage",
  fachGemerkt: "Gemerkt in Fach ",
  fachEingesetzt: "Eingesetzt aus Fach ",
  fachLeer: "Dieses Fach ist leer oder abgelaufen (Fächer leeren sich nach 12 Stunden von selbst).",
  fachLeerZeile: "(leer)",
  fachNichtsKopiert: "Die Zwischenablage ist leer. Zuerst mit Strg+C kopieren, dann das Kürzel tippen.",
  fachLesenVerwehrt: "Chrome lässt das Lesen der Zwischenablage hier nicht zu — die Erweiterung einmal entfernen und neu laden, dann fragt Chrome nach der Erlaubnis.",

  // ---- Standort (Etappe 6) --------------------------------------------------
  standortTitel: "Standort dieses Geräts",
  standortKeiner: "(kein Standort)",
  standortHinweis: "Bausteine mit Standort-Fassungen liefern hier die passende Fassung. Gilt nur in diesem Browser.",

  // ---- Entwurf (;;neu) ------------------------------------------------------
  entwurfTitel: "Als Entwurf sichern",
  entwurfWarnung: "Das liegt in der Zwischenablage und wird als Entwurf in Deine Bausteine gelegt. KONTROLLIERE: kein Patientenname, keine Patientendaten!",
  entwurfSichern: "Als Entwurf sichern",
  entwurfGesichert: "Als Entwurf gesichert — am nächsten Gerät unter Entwürfe.",
  entwurfLeer: "Die Zwischenablage ist leer. Zuerst Text markieren und Strg+C drücken, dann ;;neu tippen.",
  entwurfFehler: "Der Entwurf konnte nicht hochgeladen werden: ",

  // ---- Masken (Etappe 8) ----------------------------------------------------
  weiter: "Weiter",
  maskeKategorie: "Aus der Kategorie „%s“ einfügen:",
  maskeKategorieLeer: "Noch kein Baustein mit dieser Kategorie — der Abschnitt bleibt leer, und Du diktierst später direkt ins Zielfeld."
};
