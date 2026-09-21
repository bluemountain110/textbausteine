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
         "In der Datenablage im Netz, abgeglichen auf jedes Gerät, auf dem Du angemeldet bist — und zusätzlich im Browser jedes Geräts, damit alles auch ohne Netz weitergeht. Die Sicherung bleibt trotzdem wichtig: in den Einstellungen ab und zu „Alle Bausteine exportieren“ drücken."],
        ["Drei Wege zum Baustein",
         "Erstens das App-Fenster: Baustein anklicken, im Zielprogramm Strg+V — geht überall, auch in Outlook und Word. Zweitens die Chrome-Erweiterung: ;;kürzel direkt im Feld einer Webseite tippen, Leertaste — der Baustein steht da, ohne Fensterwechsel (Kapitel „Kürzel im Browser“). Drittens, geplant: dasselbe für Windows-Programme wie KISIM über ein kleines Hilfsprogramm."]
      ]],
      ["Bausteine verwalten", [
        ["Anlegen",
         "Oben rechts „+ Neu“, oder Strg+N (⌘N). Pflicht ist nur der Titel. Die Kategorie ist frei — tippe ein Wort, die App schlägt Dir bestehende Kategorien vor, sobald Du welche hast."],
        ["Das Kürzel",
         "Das kurze Wort (z. B. vk), mit dem Du den Baustein direkt im Zielprogramm abrufst: ;;vk tippen, Leertaste — fertig. Ein Kürzel gibt es nur EINMAL: Die App meldet ein bereits vergebenes und nennt den Baustein, der es hat; auch „Beispiele einfügen“ legt kein Doppel an. Die beiden Strichpunkte tippst Du nur im Zielprogramm, nie ins Kürzel-Feld."],
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
         "Fügst Du etwas aus KISIM, Word oder Axenita ein, kommen die Auszeichnungen mit — der Rest (Formatvorlagen, Seitenaufbau, Tabellen) wird verworfen. KISIM kopiert in einem eigenen Format, das die App liest; daraus werden auch Aufzählungen und Nummerierungen wieder echte Listen. Tabellen-Vorlagen wie die Duplex-Vorlage bleiben deshalb vorerst in KISIM — die Tabellen bekommen eine eigene Etappe."],
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
      ["Kürzel im Browser — die Chrome-Erweiterung", [
        ["Was sie ist",
         "Ein kleines Zusatzprogramm, das im Chrome wohnt. Auf Seiten, die Du freischaltest (z. B. Axenita), tippst Du ;;kürzel und die Leertaste — und der Baustein steht formatiert an der Schreibmarke, ohne Fensterwechsel. Tab löst absichtlich nie aus (es wechselt Felder), die Eingabetaste auch nicht (sie kann Web-Formulare abschicken). Sie holt Deine fertigen Bausteine selbst aus der Datenablage, jede Minute; Entwürfe kennt sie nicht."],
        ["Installieren",
         "Einmal je Rechner (die Erweiterung wandert nicht mit dem Chrome-Profil): Zip von der App-Adresse herunterladen, „Alle extrahieren“ in einen festen Ordner, dann chrome://extensions → Entwicklermodus → „Entpackte Erweiterung laden“ → den Ordner wählen → Symbol anpinnen. Ein Hinweis beim Chrome-Start wegen Entwicklermodus ist der Preis dafür — wegklicken."],
        ["Anmelden und Stand",
         "Klick auf das B-Symbol: anmelden mit denselben Zugangsdaten wie in der App. Das Fenster zeigt, wie viele Bausteine an Bord sind, wann zuletzt geholt wurde, und „Jetzt holen“ für sofort. Ein rotes «!» am Symbol heisst: nicht angemeldet oder keine Verbindung."],
        ["Seiten einschalten",
         "Die Erweiterung liest Tastendrücke NUR auf Seiten mit, die Du eingeschaltet hast. Auf der Seite das Symbol anklicken → „Auf dieser Seite einschalten“ → Chrome fragt um Erlaubnis → Seite einmal neu laden. Mit dem × in der Liste schaltest Du sie wieder aus. Das Übungsfeld (Knopf im Symbol-Fenster) geht immer, ohne Freischaltung."],
        ["Das Auswahl-Fenster",
         "Sobald Du nach ;; den ersten Buchstaben tippst, erscheint bei der Schreibmarke eine Liste der passenden Bausteine: zuoberst die häufigsten, darunter die übrigen alphabetisch — und sie verdeckt nie die Zeile, in der Du tippst. Ein Klick fügt ein, Weitertippen verfeinert, Esc schliesst. Du kannst die Liste auch ignorieren und einfach fertig tippen."],
        ["Neun Zwischenspeicher-Fächer",
         "Wie im Windows-Skript: Mit Strg+C kopieren (am Mac Cmd+C), dann ;;c1 und Leertaste — der Inhalt liegt in Fach 1, samt Formatierung. Mit ;;v1 setzt Du ihn wieder ein; ;;v1 nur getippt zeigt alle neun Fächer zum Anklicken. Die Fächer bleiben auf DIESEM Gerät (nie in der Datenablage — es könnte Patiententext darin liegen) und leeren sich 12 Stunden nach dem Merken von selbst; der Knopf „Fächer leeren“ im Symbol-Fenster leert sofort. Ein echter Baustein mit demselben Kürzel hat immer Vorrang."],
        ["Neue Bausteine mit ;;neu",
         "Text markieren, Strg+C, irgendwo ;;neu und Leertaste: Ein Fenster zeigt den Text zur Kontrolle mit einem roten Warnsatz — bitte auf Patientendaten achten! Erst der Knopf legt ihn als Entwurf in Deine App, samt Formatierung. Das ist der einzige Weg, auf dem die Erweiterung je in Deine Bausteine schreibt: nur neue Entwürfe, nie Änderungen."],
        ["Anmeldung merken",
         "Im Symbol-Fenster hat die Anmeldung ein Häkchen „Anmeldung merken“: Dann meldet sich die Erweiterung nach Ablauf der Sitzung selbst neu an, und nach einem Abmelden sind E-Mail und Passwort vorbelegt — ein Klick genügt. Nach einem Abmelden von Hand bleibt sie abgemeldet, bis Du selbst wieder anmeldest."],
        ["Lücken und Suche",
         "Hat der Baustein Lücken, erscheint das Ausfüll-Fenster über der Seite, mit Vorschau: Tab wandert, Eingabetaste fügt ein, Esc bricht ab und stellt das getippte ;;kürzel wieder her. ;;? öffnet die Suche: tippen (sie durchsucht Titel, Kürzel, Kategorie UND den Text), Pfeiltasten, Eingabetaste. Ein unbekanntes Kürzel bleibt stehen, unten erscheint kurz eine Meldung — dieselbe Meldung sagt Dir auch, ob die Erweiterung auf einer Seite überhaupt aktiv ist."],
        ["Wo sie nicht wirkt",
         "Nur in Chrome: Im Outlook-Programm, in Word oder KISIM kann sie nicht tippen — dort gilt am Spital das Windows-Hilfsprogramm, in der Praxis das App-Fenster mit Strg+V (das Hilfsprogramm lässt der dortige Windows-Schutz „Smart App Control“ nicht zu). Kommt ein Baustein in einem exotischen Feld nicht an, legt sie ihn in die Zwischenablage und sagt es: dann Strg+V. Bearbeitet werden Bausteine nur in der App; die Erweiterung schreibt nie in Deine Bausteine, sie zählt nur die Statistik."],
        ["Zwei Fassungen",
         "Wie die App: die DEV-Fassung (rotes Symbol, Testwelt) gehört nur auf den Mac, die normale (blaugrünes Symbol) in die Praxis. Sind beide auf derselben Seite aktiv, schweigt die DEV-Fassung."]
      ]],
      ["Kürzel in Windows-Programmen — das kleine Hilfsprogramm", [
        ["Was es ist",
         "Ein Ordner mit einem kleinen Programm, das im Hintergrund läuft — es wird nichts installiert und es braucht keine Administratorrechte. Es holt Deine Bausteine selbst aus der Datenablage, jede Minute. Danach tippst Du in JEDEM Windows-Programm ;;kürzel und die Leertaste, und der Baustein steht formatiert da: in KISIM, in Word, in Outlook. Die App muss dafür nicht offen sein, nicht einmal der Browser."],
        ["Einrichten",
         "Den Ordner BausteineKuerzel aus dem Zip nach Dokumente legen und darin Start-Bausteine.cmd doppelklicken. Beim ersten Mal einmal anmelden, mit denselben Zugangsdaten wie in der App — mit dem Häkchen „Anmeldung merken“ meldet es sich fortan selbst neu an (das Passwort liegt dafür Windows-verschlüsselt im Ordner — nur Dein Windows-Konto auf diesem Rechner kann es lesen), und ein @-Knopf hilft, wenn die Tastatur das Zeichen gerade nicht hergibt. Beim allerersten Start fragt es einmal nach dem Standort (Spital Limmattal oder Praxis Neuromed) — daraus folgen der Statistik-Name und die Vorbelegung der Browser-Weiche. Damit es bei jeder Anmeldung von selbst startet: im Explorer in die Adresszeile shell:startup eintippen, Enter, und eine Verknüpfung von Start-Bausteine.cmd hineinziehen."],
        ["Nur die Leertaste löst aus",
         "Anders als im Browser wirkt Tab hier NIE als Auslöser — Tab wird in KISIM zum Wechseln zwischen Feldern gebraucht. Ein unbekanntes Kürzel löscht nichts und meldet sich nur unten; daran erkennst Du auch, ob das Programm überhaupt mitliest."],
        ["Das Auswahl-Fenster",
         "Sobald Du nach ;; den ersten Buchstaben tippst, erscheint neben der Schreibmarke eine Liste der passenden Bausteine: zuoberst die häufigsten, darunter die übrigen alphabetisch. Ein Klick fügt ein. Du kannst die Liste auch ignorieren und einfach fertig tippen. Esc schliesst sie. ;;? öffnet dieselbe Liste mit einem Suchfeld, das Titel, Kürzel, Kategorie UND den Text durchsucht."],
        ["Lücken ausfüllen",
         "Hat der Baustein Lücken, geht das Ausfüll-Fenster auf, mit Vorschau. Tab wandert von Feld zu Feld, Eingabetaste fügt ein, Esc bricht ab — das getippte Kürzel bleibt dabei stehen, bis wirklich eingefügt wird."],
        ["Neue Bausteine aus KISIM holen",
         "Text in KISIM markieren, Strg+C, dann irgendwo ;;neu tippen und Leertaste. Ein Fenster zeigt den Text zur Kontrolle (bitte auf Patientendaten achten!) und legt ihn als Entwurf in Deine App — samt Formatierung. Fertigstellen tust Du ihn später in Ruhe in der App."],
        ["Neun Zwischenspeicher-Fächer",
         "Wie Kopieren und Einfügen, nur neunfach: Mit Strg+C kopieren, dann ;;c1 tippen und Leertaste — der Inhalt liegt in Fach 1. Mit ;;v1 setzt Du ihn wieder ein. Tippst Du nur ;;v, zeigt das Fenster alle neun Fächer mit ihrem Inhalt. Die Fächer leben nur im Arbeitsspeicher und sind beim Beenden weg. Welche Buchstaben gelten, bestimmst Du in den Einstellungen."],
        ["Die Browser-Weiche",
         "Im Menü des grünen Symbols steht „Browserfenster der Erweiterung überlassen“: Mit Häkchen hält sich das Skript aus Chrome, Edge und Firefox heraus und sagt bei einem Kürzel, dass dort die Erweiterung zuständig ist — so fügen nie zwei gleichzeitig ein. Ohne Häkchen arbeitet das Skript überall, auch im Browser (dann ohne Formatierung). Die Standortwahl belegt die Weiche nur vor (Praxis: an, Spital: aus); umstellen kannst Du sie jederzeit."],
        ["Das Kürzel ;;test",
         ";;test und Leertaste zeigen auf einen Blick, welches Glied der Kette steht: Fassung, Welt, Standort, Anmeldung, Bausteinzahl, letzter Abgleich, ob das aktive Fenster als Browser gilt und ob die Weiche wirkt. „Bericht kopieren“ legt alles mit Datum und Sekunden in die Zwischenablage. Derselbe Blick geht immer über das Menü („Zustand anzeigen“) — das Kürzel test darum bitte nie an einen echten Baustein vergeben."],
        ["Beenden und loswerden",
         "Rechtsklick auf das grüne Symbol unten rechts: dort stehen die Fassung, das Zwischenspeicher-Fenster, Jetzt holen, An- und Abmelden sowie Beenden. Loswerden heisst einfach: Ordner löschen. Es bleibt nichts im System zurück."]
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
         "Strg+F (⌘F) springt ins Suchfeld, Strg+N (⌘N) öffnet „Neu“, Esc schliesst jedes Fenster ohne zu speichern, die Eingabetaste übernimmt. Wichtig: Diese Kürzel wirken nur, solange das App-Fenster vorne ist — die ;;kürzel auf Webseiten kommen von der Chrome-Erweiterung, die windowsweiten von Etappe 4."],
        ["Zwei getrennte Welten",
         "Hängst Du an die Adresse ?welt=dev an, arbeitest Du in der Testwelt: roter Rahmen, Marke „DEV“, eigener Datenbestand, eigene Datenablage. Zum Ausprobieren gedacht — Deine echten Bausteine bleiben unberührt. Die beiden Welten teilen nichts."],
        ["Wo die App liegt",
         "Sie ist im Netz veröffentlicht und läuft an jedem Ort unter derselben Adresse — am Mac, an beiden Arbeitsorten und auf dem iPhone. Es muss nichts installiert und kein Ordner mehr herumgetragen werden. Welche Fassung gerade läuft, steht unter Einstellungen → Über die App."],
        ["Hinweis zur Tastatur am Arbeitsplatz",
         "Auf der MX Keys for Mac heisst die Alt-Taste „option“ — unter Windows sendet sie Alt."]
      ]],
      ["Was noch kommt", [
        ["Die nächsten Etappen",
         "Kandidaten sind die Tabellen (Duplex- und andere Tabellen-Vorlagen), standortabhängige Inhalte (z. B. Medikamentenlisten je Standort — der Grundstein mit den Standortnamen liegt), die Kürzel auf dem Mac, das iPhone-Symbol, Masken für ganze Befunde und Werkzeuge wie der EMG-Bericht. Offen bleibt auch, ob das Spital zusätzlich die Chrome-Erweiterung bekommt (die Probe hat gezeigt: es ginge) und ob die Praxis einen Weg für Word und Outlook braucht."],
        ["Was noch nicht bewiesen ist",
         "Ob das Diktat die Marken anspringt, und ob die Zählung der Erweiterung in der Statistik der App als eigenes Gerät auftaucht. Beides zeigt sich erst im Alltag."]
      ]]
    ];
  }
  return { inhalt: inhalt };
})();
