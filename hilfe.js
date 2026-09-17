// Datei: hilfe.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die ausführliche Anleitung in den Einstellungen, in
//        Alltagssprache und nach Kapiteln geordnet. Sie wird bei jeder
//        Abnahme um die neuen Fähigkeiten ergänzt (Teil des Quartetts)
//        und ist der Prüfstein: Was sich hier nicht in wenigen Sätzen
//        erklären lässt, ist zu kompliziert gebaut.

"use strict";
window.TB = window.TB || {};

TB.hilfe = (function () {
  // Aufbau: [Kapitel, [ [Überschrift, Text], … ] ]
  function inhalt() {
    return [
      ["Das Wichtigste in Kürze", [
        ["Wozu die App da ist",
         "Sie ist Deine Sammlung von Textbausteinen für die Arbeit. Du suchst einen Baustein, klickst ihn an, füllst allfällige Lücken aus — und er liegt in der Zwischenablage. Im Zielprogramm (KISIM, Word, Mail) fügst Du ihn mit Strg+V ein (am Mac ⌘V)."],
        ["Der schnellste Weg",
         "App öffnen, zwei, drei Buchstaben tippen, Eingabetaste. Die Eingabetaste nimmt immer den ersten Treffer der Liste. Hat der Baustein Lücken, geht das Ausfüll-Fenster auf: mit Tab von Feld zu Feld, Eingabetaste kopiert, Esc bricht ab."],
        ["Wo Deine Bausteine liegen",
         "Zurzeit im Browser dieses Rechners — sonst nirgends. Der Abgleich über die Cloud kommt in der nächsten Etappe. Bis dahin gilt: in den Einstellungen regelmässig „Alle Bausteine exportieren“ drücken. Die Datei ist Deine Sicherung und zugleich der Weg, Bausteine an den zweiten Arbeitsort mitzunehmen."]
      ]],
      ["Bausteine verwalten", [
        ["Anlegen",
         "Oben rechts „+ Neu“, oder Strg+N (⌘N). Pflicht ist nur der Titel. Die Kategorie ist frei — tippe ein Wort, die App schlägt Dir bestehende Kategorien vor, sobald Du welche hast."],
        ["Das Kürzel",
         "Das kurze Wort (z. B. vk), mit dem Du den Baustein später direkt im Zielprogramm abrufen wirst. Es muss eindeutig sein; die App meldet ein bereits vergebenes Kürzel und nennt den Baustein, der es hat. Das vorangestellte Zeichen (heute ;) tippst Du nicht mit — es wird in der Kürzel-Etappe automatisch vorangestellt und ist dann umstellbar."],
        ["Ändern und löschen",
         "„Bearbeiten“ an der Zeile öffnet denselben Dialog. „In den Papierkorb“ legt den Baustein für 30 Tage beiseite; im Bereich Papierkorb holst Du ihn mit einem Klick zurück oder löschst ihn endgültig — dann fragt die App mit Anzahl nach."],
        ["Suchen und finden",
         "Das Suchfeld durchsucht Titel, Kürzel, Kategorie, Text UND Notiz. Zusätzlich kannst Du auf eine Kategorie einschränken. Solange Du nichts eingibst, zeigt die Liste zuoberst die fünf zuletzt benutzten Bausteine, darunter die Kategorien."]
      ]],
      ["Platzhalter — die Lücken im Text", [
        ["Wozu sie da sind",
         "Ein Platzhalter ist eine Stelle im Bausteintext, die beim Einfügen gefüllt wird — mit dem heutigen Datum, mit einer Auswahl oder mit etwas, das Du eintippst. So genügt EIN Baustein für viele Fälle."],
        ["Am einfachsten über die Knöpfe",
         "Im Bearbeiten-Fenster steht unter dem Textfeld eine Reihe Knöpfe: Datum, Zeit, Lücke zum Ausfüllen, Auswahl, Konstante, anderer Baustein. Ein Klick setzt das fertige Gerüst an die Cursor-Stelle — Du überschreibst nur noch die Beispielwörter. Die geschweiften Klammern und das Trennzeichen musst Du nie selbst tippen."],
        ["Die einzelnen Platzhalter",
         "{{Datum}} wird zum heutigen Datum, {{Datum+7}} zu heute plus sieben Tagen, {{Datum-1}} zu gestern. {{Zeit}} wird zur Uhrzeit. {{Feld:Wochen=6}} fragt „Wochen“ ab und schlägt 6 vor (das „=6“ kannst Du weglassen). {{Auswahl:Seite:rechts/links/beidseits}} zeigt eine Auswahlliste — als Trennzeichen geht der Schrägstrich / oder der senkrechte Strich |. {{Untersucher}} holt den Wert aus Deinen Konstanten. {{Baustein:mfg}} fügt einen anderen Baustein ein (bis zu drei Ebenen tief)."],
        ["Gleiche Lücke mehrfach",
         "Kommt dieselbe Beschriftung mehrmals vor, fragt die App nur EINMAL und setzt die Antwort überall ein."],
        ["Die Prüfung beim Schreiben",
         "Unter dem Textfeld prüft die App laufend mit. Grün heisst in Ordnung und nennt die Zahl der Lücken. Rot listet jeden Fehler einzeln auf — etwa einen Platzhalter, den es nicht gibt, oder eine Auswahl mit nur einer Möglichkeit."]
      ]],
      ["Einstellungen", [
        ["Name der App",
         "Der Name oben und im Fenstertitel — änderbar, wann immer Du willst."],
        ["Datumsformat",
         "Das Muster für {{Datum}}: TT ist der Tag, MM der Monat, JJJJ das Jahr (JJ die zweistellige Form). „TT.MM.JJJJ“ ergibt 13.09.2026."],
        ["Eigene Konstanten",
         "Werte, die in vielen Bausteinen gleich sind: Dein Name, eine Telefonnummer, eine Klinikbezeichnung. Einmal hier eintragen, im Baustein als {{Name}} verwenden — änderst Du den Wert, ändern sich alle Bausteine mit."],
        ["Sicherung",
         "„Alle Bausteine exportieren“ erzeugt eine Datei mit allem — Bausteinen, Papierkorb, Einstellungen und Zählung. „Aus Datei importieren“ zeigt zuerst eine Vorschau, was passieren würde, und fügt dann nur hinzu; es überschreibt nie etwas."],
        ["Selbsttest",
         "Prüft die App selbst: Rechnen die Platzhalter richtig? Ist der Bestand in Ordnung (keine doppelten Kürzel, kein Baustein ohne Titel)? Übersteht ein Export die Rundreise? Grün heisst bewiesen. Bei Rot den Bericht kopieren und Claude schicken."],
        ["Statistik",
         "Zählt, wie oft Du welchen Baustein eingefügt und welche Funktion benutzt hast — nie, was darin steht. Nützlich, um zu sehen, welche Bausteine sich lohnen und welche Du nie brauchst."],
        ["Berichte als PDF",
         "Selbsttest und Statistik haben je einen Knopf „Als PDF sichern“. Er öffnet den Druckdialog — dort wählst Du „Als PDF sichern“, der Dateiname ist bereits gesetzt: Gerät, Art des Berichts, Datum und Uhrzeit mit Sekunden. Gleichzeitig landet derselbe Bericht als Text in der Zwischenablage, damit Du ihn sofort verschicken kannst. Ein PDF selbst lässt sich technisch nicht in die Zwischenablage legen — darum beides."],
        ["Chronik",
         "Unter „Chronik“ steht, welche Etappe wann gebaut wurde und was sie gebracht hat."]
      ]],
      ["Tastatur und Bedienung", [
        ["Tastenkürzel in der App",
         "Strg+F (⌘F) springt ins Suchfeld, Strg+N (⌘N) öffnet „Neu“, Esc schliesst jedes Fenster ohne zu speichern, die Eingabetaste übernimmt. Wichtig: Diese Kürzel wirken nur, solange das App-Fenster vorne ist — die Kürzel, die überall wirken, kommen in der Kürzel-Etappe."],
        ["Zwei getrennte Welten",
         "Hängst Du an die Adresse ?welt=dev an, arbeitest Du in der Testwelt: roter Rahmen, Marke „DEV“, eigener Datenbestand. Zum Ausprobieren gedacht — Deine echten Bausteine bleiben unberührt. Die beiden Welten teilen nichts."],
        ["Hinweis zur Tastatur am Arbeitsplatz",
         "Auf der MX Keys for Mac heisst die Alt-Taste „option“ — unter Windows sendet sie Alt."]
      ]],
      ["Was noch kommt", [
        ["Die nächsten Etappen",
         "Abgleich über die Cloud (dann sind dieselben Bausteine an beiden Arbeitsorten und am Mac). Danach die Kürzel-Schicht: ein Zeichen wie ;; direkt im Zielprogramm getippt öffnet die Bausteinübersicht oder fügt gleich ein, plus ein schmales Fenster statt Vollbild. Danach Ausgabe-Profile (Spital, Praxis, Outlook) mit Schriftart und Formatierung."]
      ]]
    ];
  }
  return { inhalt: inhalt };
})();
