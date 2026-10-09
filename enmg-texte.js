// Datei: enmg-texte.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Alle sichtbaren Texte des ENMG-Werks (TB.enmgTexte), nach dem
//        Vorbild von status-texte.js. Sie wird VOR enmg.js geladen.
//        Wer eine Beschriftung ändern will, ändert sie hier.

"use strict";
window.TB = window.TB || {};

TB.enmgTexte = {
  bereichEnmg: "ENMG",
  enmgTitel: "ENMG-Werk",
  einleitung: "Export-Datei des ENMG-Geräts (PDF oder Word) hierhin ziehen — oder klicken und die Datei wählen. Die Datei wird nur in diesem Fenster gelesen: nichts davon wird gespeichert oder abgeglichen.",
  dateiKnopf: "Datei wählen …",
  liest: "Datei wird gelesen …",
  leseFehler: "Diese Datei konnte nicht gelesen werden: %s",
  falscheArt: "Bitte eine PDF- oder Word-Datei (.pdf, .docx) des ENMG-Exports wählen.",
  keineMesswerte: "In dieser Datei wurden keine NLG-Tabellen erkannt. Ist es ein ENMG-Export des Geräts?",
  patientTitel: "Patient",
  geburtsdatum: "Geburtsdatum",
  untersuchungsdatum: "Untersuchung",
  alterWort: "Alter",
  alterUnbekannt: "Alter nicht bestimmbar — ohne Alter keine Färbung (alles bleibt schwarz).",
  jahre: "%s Jahre",
  motorTitel: "Motorische Neurographie",
  sensTitel: "Sensible Neurographie",
  spalteSegment: "Segment",
  spalteLat: "Lat (ms)",
  spalteAmpM: "Amp (mV)",
  spalteAmpU: "Amp (µV)",
  spalteDur: "Dur (ms)",
  spalteNlg: "NLG (m/s)",
  spalteFLat: "F-Lat (ms)",
  spalteAbstand: "Abstand (mm)",
  grenzeKurz: "Grenze %s",
  zuordnungKurz: "%s · Grenze %s",
  ohneZuordnung: "kein Normwert hinterlegt oder zugeordnet",
  legende: "Rot = ausserhalb Deiner Grenzwerte · Grün = innerhalb · Schwarz = kein Normwert hinterlegt oder zugeordnet. Die Grenze steht klein neben jedem gefärbten Wert — so siehst Du immer, womit verglichen wurde.",
  quelleZeile: "Normwerte: %s (alterskorrigiert, linear zwischen den 5-Jahres-Stützstellen)",
  kopierenKnopf: "Tabelle kopieren",
  kopiertMeldung: "ENMG-Tabelle kopiert — am Zielort mit Strg+V (Mac: Cmd+V) einfügen.",
  kopiertNurText: "Kopiert — nur als reiner Text (ohne Farben).",
  kopierenFehl: "Kopieren fehlgeschlagen.",
  nichtsZuKopieren: "Noch keine Datei gelesen — es gibt nichts zu kopieren.",
  zuruecksetzenKnopf: "Leeren",
  zurueckgesetzt: "Ansicht geleert — es war nichts gespeichert.",
  nichtVerstanden: "Nicht zugeordnete Zeilen (bleiben unverändert stehen):",
  pflegeKnopf: "Normwert-Pflege",
  unbekannterNerv: "Nerv nicht erkannt — keine Färbung",
  // Pflege
  pflegeTitel: "ENMG-Normwert-Pflege",
  pflegeHinweis: "Die Grenzwerte je Nerv und Alter. Änderungen wirken sofort und syncen auf alle Geräte. NLG und Amplituden sind UNTERE Grenzen (darunter = rot), Latenzen und F-Wellen OBERE Grenzen (darüber = rot). Patientendaten stehen hier nie.",
  quelleFeld: "Name der Normwert-Quelle (erscheint unter jeder Tabelle):",
  zurueckZumWerk: "Zurück zum ENMG-Werk",
  grundKnopf: "Auf Grundausstattung zurücksetzen",
  grundWarnung: "Das ersetzt ALLE Normwerte durch die mitgelieferte Grundausstattung (Stand %s). Eigene Änderungen gehen verloren. Fortfahren?",
  grundFertig: "Grundausstattung übernommen.",
  gespeichert: "Gespeichert.",
  wertUngueltig: "„%s“ ist keine Zahl — der alte Wert bleibt.",
  festWort: "fest",
  richtungMax: "obere Grenze",
  richtungMin: "untere Grenze",
  fensterKnopf: "An KISIM übergeben",
  fensterKnopfAxenita: "An Axenita übergeben",
  fensterLeer: "Noch keine Datei gelesen — es gibt nichts zu übergeben."
};
