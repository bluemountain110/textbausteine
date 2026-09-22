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
      ["22.9.2026", "Etappe 6: Standort-Fassungen und Ideen-Speicher",
       "Ein Baustein, je Arbeitsort der richtige Wortlaut: Bausteine können jetzt eigene Fassungen für das Spital Limmattal und die Praxis Neuromed tragen — angelegt im Bearbeiten-Fenster als Kopie der Standardfassung, erkennbar an der Marke „Standorte“. Die App kennt ihren Standort aus den Einstellungen (bewusst je Gerät, nie abgeglichen), das Windows-Skript aus seinem Menü, die Erweiterung aus dem Symbol-Fenster; ohne eigene Fassung gilt überall die Standardfassung, nichts scheitert still. Dazu der Ideen-Speicher: ein eigener Bereich für Wünsche an die App, mit Export als Dokument für den Bau-Chat. Und als Vorbereitung der Tabellen-Etappe sichert das Testwelt-Skript die Zwischenablage als RTF-Datei.",
       "Die ganze Etappe brauchte genau eine Nachbesserung: Das Bearbeiten-Fenster war mit zwei Standort-Fassungen höher als der Bildschirm, der Speichern-Knopf ausser Reichweite — seither scrollt der Inhalt und die Knopfzeile bleibt stehen. Und die ersten RTF-Proben aus KISIM kamen als leere Hüllen an, bis der Umweg über eine Mail sie heil vom Spital-Netzlaufwerk holte."],
      ["20.–21.9.2026", "Etappe 5: Arbeitsplatz gleichziehen",
       "Die Chrome-Erweiterung zieht mit dem Windows-Skript gleich: Auswahl-Fenster an der Schreibmarke (häufigste fünf zuoberst), Suche auch im Bausteintext, neun Zwischenspeicher-Fächer mit 12-Stunden-Frist, ;;neu mit Kontroll-Vorschau und Warnsatz als einziger Schreibweg — und Tab löst nichts mehr aus. Das Skript kennt neu seinen Standort (Spital Limmattal oder Praxis Neuromed), die Browser-Weiche als eigene Einstellung, das Diagnose-Kürzel ;;test mit kopierbarem Zustandsbericht und die gemerkte Anmeldung mit Windows-verschlüsseltem Passwort. Die Statistik zählt unter sprechenden Standortnamen. Alles trägt erstmals dieselbe Fassungsnummer.",
       "Zwei Wächter zeigten sich erst am echten Gerät: Smart App Control in der Praxis lässt AutoHotkey grundsätzlich nicht laufen — die Praxis arbeitet darum browserseitig mit der Erweiterung. Und ein Kürzel-Griff aus Etappe 4 (Strg+Alt fürs Fächer-Merken) entpuppte sich als AltGr-Falle: Er verschluckte am Spital das @-Zeichen, überall. Eine Einstellung, keine Zeile Code, gab es zurück."],
      ["18.–20.9.2026", "Etappe 4: Kürzel in allen Windows-Programmen",
       "Ein kleines Programm für Windows, das keine Installation braucht: Es holt die Bausteine aus derselben Ablage wie die App und macht ;;kürzel und Leertaste in JEDEM Programm zum fertigen Text — zuerst und vor allem in KISIM. Dazu ein Auswahl-Fenster, das beim Tippen die passenden Bausteine neben der Schreibmarke zeigt, eine Suche über Titel, Kürzel, Kategorie und Text, ein Ausfüll-Fenster für Lücken, neun Zwischenspeicher-Fächer mit ;;c und ;;v, und der Weg zurück: markierter Text aus KISIM wird mit ;;neu zum Entwurf in der App, samt Formatierung. Damit das Format überall stimmt, erzeugt die App beim Speichern das Druckformat gleich mit und legt es in einer neuen Spalte ab.",
       "Ein Test klärte eine alte Hoffnung: KISIM füllt seine eigenen Patienten-Makros nur aus, wenn der Text über KISIMs eigene Bausteine kommt. Eingefügter Text bleibt unangetastet — was zugleich die beruhigende Kehrseite hat, dass unser System die Patientendaten gar nie zu sehen bekommt."],
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
