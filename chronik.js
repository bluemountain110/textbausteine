// Datei: chronik.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Entwicklungs-Chronik in der App: welche Etappe wann
//        gebaut wurde, was sie brachte und welche besonderen Momente
//        es gab. Wird bei jeder Abnahme um einen Eintrag ergänzt
//        (Teil des Quartetts).

"use strict";
window.TB = window.TB || {};

TB.chronik = (function () {
  // Neueste zuoberst. [Zeitraum, Titel, Was, Besonderer Moment]
  function eintraege() {
    return [
      ["17.–18.9.2026", "Etappe 3: Kürzel im Browser",
       "Eine Chrome-Erweiterung, die auf freigeschalteten Seiten ;;kürzel erkennt und den Baustein formatiert an der Schreibmarke einsetzt — Lücken-Fenster und Suche als Einblendung in der Seite, Übungsfeld zum gefahrlosen Ausprobieren, zwei Fassungen wie die App. Fünf App-Dateien reisen byteweise identisch mit, damit die Kürzel dieselbe Platzhalter-Sprache sprechen. In der Praxis in Axenita bewiesen, in einem Zug gebaut, ohne Nachbesserung an der Erweiterung.",
       "Der erste Praxis-Test scheiterte an nichts Technischem: Die Seite war nach dem Einschalten nicht neu geladen. Das Diagnose-Kürzel ;;qqq — bewusst unbekannt — zeigte in einer Sekunde, ob die Erweiterung mitliest. Und der Duplex-Befund aus KISIM bewies, dass Tabellen ihre eigene Etappe brauchen."],
      ["19.8.–13.9.2026", "Vorarbeit: die Machbarkeit",
       "Bevor eine Zeile der App entstand, wurde am Arbeitsrechner ohne Administratorrechte geprüft, was dort überhaupt möglich ist: Zwischenablage, Einfügen in KISIM, Dateizugriff, freies Internet — und mit einem eigenen Testpaket, ob systemweite Kürzel laufen.",
       "Alle Tests bestanden, auch der kritischste: AutoHotkey tippt aus einem einfachen Ordner heraus direkt in KISIM. Damit war klar, dass die App nichts einbüssen muss."],
      ["12.–13.9.2026", "Etappe 1: Das Bausteinfenster",
       "Bausteine anlegen, suchen, benutzen. Platzhalter für Datum, Zeit, Lücken, Auswahllisten, Konstanten und andere Bausteine. Papierkorb mit 30 Tagen, Export und Import mit Vorschau, Selbsttest, Statistik, ausführliche Anleitung, PDF-Berichte. Zwei getrennte Datenwelten (normal und Testdaten) von Anfang an.",
       "Der Formatierungs-Test am 13.9. schien ein klares Ergebnis zu bringen: KISIM nehme und gebe nur reinen Text. Das war falsch — und die Korrektur am 14.9. wurde zur wichtigsten Wendung des Projekts."],
      ["13.–17.9.2026", "Etappe 2: Abgleich, Formatierung, Veröffentlichung",
       "Anmeldung und Abgleich über eine gemeinsame Datenablage; zwei getrennte Projekte für Testdaten und Normalbetrieb. Formatierung im Baustein: fett, kursiv, unterstrichen, durchgestrichen, Schriftart, Grösse, Farbe, Markierung, Listen — mit Tastenkürzeln, die sich umbelegen lassen. Ein Leser für das Format, in dem KISIM kopiert. Entwürfe und Sammel-Erfassung für die Übernahme bestehender Bausteine. Und zum Schluss die Veröffentlichung im Netz: kein Ordner mehr, der herumgetragen werden muss.",
       "Näd widersprach dem Formatierungs-Ergebnis vom 13.9. — zu Recht. Drei Tests später war bewiesen: KISIM nimmt Formatierung sehr wohl an, es spricht nur eine andere Sprache als der Browser. Ohne diesen Widerspruch wäre die App dauerhaft auf reinen Text beschränkt geblieben."]
    ];
  }
  return { eintraege: eintraege };
})();
