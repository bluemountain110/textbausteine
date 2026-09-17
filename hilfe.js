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
      ["Formatierung", [
        ["Die Leiste über dem Schreibfeld",
         "Beim Bearbeiten steht über dem Textfeld eine Leiste: fett, kursiv, unterstrichen, durchgestrichen, Aufzählung, nummerierte Liste und ganz rechts ⌫, das alle Auszeichnungen von der Markierung entfernt. Dazu vier Auswahlfelder für Schriftfarbe, Markierung, Schriftart und Schriftgrösse."],
        ["Mit der Tastatur",
         "Strg+B fett, Strg+I kursiv, Strg+U unterstrichen, Strg+Umschalt+X durchgestrichen, Strg+Umschalt+L Aufzählung, Strg+Umschalt+O nummerierte Liste, Strg+Leertaste entfernt Auszeichnungen. Am Mac zählt die Befehlstaste wie Strg. Jedes Kürzel lässt sich in den Einstellungen umbelegen; die Belegung wandert mit auf alle Geräte."],
        ["Was am Ziel ankommt",
         "Nicht jedes Programm kann alles. KISIM nimmt über die Brücke alles an, auch Schriftgrösse und Markierung. Axenita kennt fett, kursiv, unterstrichen, Schriftfarbe und Listen — Grösse und Markierung verwirft es. Word kann alles. Ein Hinweis unter der Leiste erinnert daran."],
        ["Platzhalter nie halb formatieren",
         "Ein Platzhalter muss GANZ ausgezeichnet sein oder gar nicht. Machst Du nur die Hälfte von {{Datum}} fett, wirkt er nicht mehr und stünde als roher Text im Befund. Die Prüfung unter der Leiste warnt Dich davor."],
        ["Text von aussen hereinholen",
         "Fügst Du etwas aus KISIM, Word oder Axenita ein, kommen die Auszeichnungen mit — der Rest (Formatvorlagen, Tabellen, Seitenaufbau) wird verworfen. KISIM kopiert in einem eigenen Format, das die App liest; daraus werden auch Aufzählungen und Nummerierungen wieder echte Listen."],
        ["Zwei Wege, die Lücken zu füllen",
         "Beim Bearbeiten wählst Du unten die Ausgabeart. „Vorher fragen“ ist die Vorgabe: Die Lücken werden abgefragt, der Text kommt fertig ins Zielprogramm. „Als Marken mitliefern“ ist fürs Diktieren: Der Text wird sofort eingefügt, die Lücken bleiben als [Beschriftung] stehen und lassen sich mit Dragon oder dem Speech Mike anspringen. Vorsicht: Eine übersprungene Marke bleibt im Befund stehen. Solche Bausteine tragen in der Liste die Kennzeichnung „Marken“."]
      ]],
      ["Entwürfe und Sammel-Erfassung", [
        ["Was ein Entwurf ist",
         "Ein Baustein, der noch nicht fertig ist. Er braucht keinen Titel, erscheint nicht in der Arbeitsliste und zählt nicht in der Statistik. Wird er fertig, behält er dieselbe Kennung — er wird nicht kopiert, sondern wächst auf."],
        ["Die schnelle Idee",
         "In der Bausteinliste neben „+ Neu“ steht „+ Idee“: ein einziges Textfeld, sonst nichts. Hineintippen, Strg+Enter (⌘+Enter), fertig. Für den Gedanken zwischen zwei Patienten."],
        ["Bestehende Bausteine übernehmen",
         "Im Reiter „Entwürfe“ steht oben ein grosses Feld. Im Quellprogramm kopieren, hier einfügen, Eingabetaste — und der nächste. Jeder Eintrag wird ein Entwurf, die Formatierung kommt mit. Umschalt+Eingabetaste macht einen Absatz INNERHALB des Entwurfs. „Letzten rückgängig“ nimmt den zuletzt erfassten wieder zurück."],
        ["Fertigstellen",
         "In der Entwurfsliste auf „Als fertig markieren“: Titel, Kürzel und Kategorie eintragen, fertig. Der Titel ist mit der ersten Zeile vorbelegt."]
      ]],
      ["Abgleich über die Geräte", [
        ["Wie es funktioniert",
         "Die App arbeitet immer zuerst aus dem Speicher des Geräts — sie wartet nie auf das Netz. Der Abgleich läuft im Hintergrund: beim Start, beim Zurückkommen ins Fenster, nach jeder Änderung und zusätzlich jede Minute von selbst. Unten am Fensterrand steht, wann zuletzt abgeglichen wurde."],
        ["Anmelden",
         "Einmal je Gerät, mit Mailadresse und Passwort. Danach bleibt das Gerät angemeldet, bis Du in den Einstellungen abmeldest. Beim Abmelden warnt die App, falls noch etwas nicht hochgeladen ist."],
        ["Ohne Netz",
         "Alles funktioniert weiter. Die Leiste wird rötlich und sagt, dass nicht abgeglichen wird; die Änderungen warten und gehen hoch, sobald die Verbindung zurück ist. Es geht nichts verloren."],
        ["Wenn zwei Geräte dasselbe ändern",
         "Dann wird NICHTS still überschrieben. Ein Fenster zeigt beide Fassungen mit Gerätenamen und Zeitpunkt, und Du wählst: diese, jene oder beide behalten."],
        ["Verbindung prüfen",
         "In den Einstellungen. Neun Zeilen, jede beantwortet eine eigene Frage — bis hin zu der, ob die Datenablage alle Felder der App kennt. Diese Prüfung gehört an jedem neuen Ort einmal gemacht."],
        ["Die Sicherung bleibt wichtig",
         "Der Abgleich verteilt Deine Bausteine, er bewahrt sie nicht auf. Zieh ab und zu eine Export-Datei, besonders vor grösseren Änderungen."]
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
         "Hängst Du an die Adresse ?welt=dev an, arbeitest Du in der Testwelt: roter Rahmen, Marke „DEV“, eigener Datenbestand, eigene Datenablage. Zum Ausprobieren gedacht — Deine echten Bausteine bleiben unberührt. Die beiden Welten teilen nichts."],
        ["Wo die App liegt",
         "Sie ist im Netz veröffentlicht und läuft an jedem Ort unter derselben Adresse — am Mac, an beiden Arbeitsorten und auf dem iPhone. Es muss nichts installiert und kein Ordner mehr herumgetragen werden. Welche Fassung gerade läuft, steht unter Einstellungen → Über die App."],
        ["Hinweis zur Tastatur am Arbeitsplatz",
         "Auf der MX Keys for Mac heisst die Alt-Taste „option“ — unter Windows sendet sie Alt."]
      ]],
      ["Was noch kommt", [
        ["Die nächsten Etappen",
         "Als Nächstes die Kürzel-Schicht für Webseiten: eine Browser-Erweiterung, mit der ;;kürzel direkt im Feld von Axenita, Outlook im Browser oder jedem Web-Formular den Baustein einsetzt — ohne Fensterwechsel. Danach dasselbe für Windows-Programme wie KISIM über ein kleines Hilfsprogramm, das auch die Formatierung überträgt. Später: das iPhone-Symbol, Masken für ganze Befunde und ein Werkzeug für EMG-Berichte."],
        ["Was noch nicht bewiesen ist",
         "Ob das Diktat die Marken anspringt, und wie sich die Formatierung in Axenita im Alltag anfühlt. Beides zeigt sich erst am Arbeitsplatz."]
      ]]
    ];
  }
  return { inhalt: inhalt };
})();
