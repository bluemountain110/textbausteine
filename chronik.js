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
      ["19.8.–13.9.2026", "Vorarbeit: die Machbarkeit",
       "Bevor eine Zeile der App entstand, wurde am Arbeitsrechner ohne Administratorrechte geprüft, was dort überhaupt möglich ist: Zwischenablage, Einfügen in KISIM, Dateizugriff, freies Internet — und mit einem eigenen Testpaket, ob systemweite Kürzel laufen.",
       "Alle Tests bestanden, auch der kritischste: AutoHotkey tippt aus einem einfachen Ordner heraus direkt in KISIM. Damit war klar, dass die App nichts einbüssen muss."],
      ["12.–13.9.2026", "Etappe 1: Das Bausteinfenster",
       "Bausteine anlegen, suchen, benutzen. Platzhalter für Datum, Zeit, Lücken, Auswahllisten, Konstanten und andere Bausteine. Papierkorb mit 30 Tagen, Export und Import mit Vorschau, Selbsttest, Statistik, ausführliche Anleitung, PDF-Berichte. Zwei getrennte Datenwelten (normal und Testdaten) von Anfang an.",
       "Der Formatierungs-Test am 13.9. brachte ein klares Ergebnis: KISIM nimmt und gibt nur reinen Text. Das vereinfachte die Planung — Bausteine werden als reiner Text gespeichert, Formatierung wird Sache der Ausgabe."]
    ];
  }
  return { eintraege: eintraege };
})();
