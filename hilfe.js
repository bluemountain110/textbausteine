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
         "Erstens das App-Fenster: Baustein anklicken, im Zielprogramm Strg+V — geht überall, auch in Outlook und Word. Zweitens die Chrome-Erweiterung: ;;kürzel direkt im Feld einer Webseite tippen, Leertaste — der Baustein steht da, ohne Fensterwechsel (Kapitel „Kürzel im Browser“). Drittens das Windows-Skript am Spital: ;;kürzel und Leertaste in JEDEM Programm, allen voran KISIM (Kapitel „Kürzel in Windows-Programmen“)."]
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
      ["Standort-Fassungen — ein Kürzel, je Ort der richtige Text", [
        ["Wozu sie da sind",
         "Manche Bausteine brauchen am Spital einen anderen Wortlaut als in der Praxis — Briefkopf, Medikamentenliste, Klinikname. Dafür bekommt EIN Baustein eigene Fassungen je Arbeitsort: Dasselbe Kürzel liefert am Spital die Spitalfassung und in der Praxis die Praxisfassung. Alle anderen Bausteine bleiben, wie sie sind."],
        ["So legst Du eine an",
         "Baustein bearbeiten, zum Abschnitt „Standort-Fassungen“ scrollen, „Fassung für <Ort> anlegen“ drücken. Das Feld startet mit einer Kopie der Standardfassung — Du änderst nur, was am Ort anders ist. „Fassung löschen“ entfernt sie wieder; dann gilt dort erneut die Standardfassung. In der Bausteinliste trägt so ein Baustein die Marke „Standorte“."],
        ["Woher die App den Ort kennt",
         "In den Einstellungen unter „Standort dieses Geräts“ — die Wahl bleibt bewusst auf DIESEM Gerät und wird nie abgeglichen, denn der Spitalrechner soll Spital bleiben und der Praxisrechner Praxis. Das Windows-Skript kennt seinen Standort aus dem Menü, die Chrome-Erweiterung aus ihrem Symbol-Fenster (dort ist die Praxis vorbelegt). Der gewählte Standort steht in der App oben in der Kopfzeile."],
        ["Die eine Regel",
         "Hat ein Baustein für den eingestellten Standort KEINE eigene Fassung — oder hat das Gerät keinen Standort —, kommt IMMER die Standardfassung. Es scheitert nie etwas still. Beim Kopieren sagt die Meldung dazu, welche Fassung es war. Die Suche findet auch Text, der nur in einer Standort-Fassung steht."]
      ]],
      ["Der Ideen-Speicher — Wünsche an die App", [
        ["Wozu er da ist",
         "Im Bereich „Ideen“ hältst Du Wünsche und Einfälle für die WEITERENTWICKLUNG dieser App fest, bevor sie verloren gehen — kurzer Titel, ein paar Worte dazu, fertig. Ideen sind keine Bausteine: Sie erscheinen nie in der Bausteinliste, der Suche oder bei den Kürzeln, wandern aber wie alles andere auf alle Deine Geräte. (Für halbfertige BAUSTEINE gibt es weiterhin die Entwürfe.)"],
        ["Einplanen, verwerfen, exportieren",
         "„eingeplant“ hakt eine Idee ab, ohne sie zu löschen; „Verwerfen“ legt sie in den Papierkorb (30 Tage zurückholbar). Der Knopf „Als Dokument für den Bau-Chat sichern“ erzeugt eine md-Datei mit allen offenen und eingeplanten Ideen — die hängst Du im nächsten Bau-Chat einfach an, und nichts geht vergessen."]
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
         "Fügst Du etwas aus KISIM, Word oder Axenita ein, kommen die Auszeichnungen mit — der Rest (Formatvorlagen, Seitenaufbau) wird verworfen. KISIM kopiert in einem eigenen Format, das die App liest; daraus werden auch Aufzählungen und Nummerierungen wieder echte Listen. Seit Etappe 7 kommen auch TABELLEN mit, samt verbundenen Zellen, Spaltenbreiten, Linien und Hintergründen."],
        ["Tabellen bearbeiten",
         "Steht die Schreibmarke in einer Tabelle, erscheint unter der Formatierungsleiste eine zweite Zeile mit Tabellen-Werkzeugen: Zeile und Spalte einfügen oder löschen, Spaltenbreite in Stufen ändern, Ausrichtung und Hintergrund je Zelle, Zellen nach rechts oder unten verbinden und einen Verbund wieder lösen. Mit Tab springst Du zur nächsten Zelle, mit Tab in der letzten Zelle entsteht eine neue Zeile. Eine ganz neue Tabelle legt der Knopf ⊞ an. Bei Tabellen mit verbundenen Zellen bleiben Zeilen und Spalten geschützt — der Verbund würde sonst zerreissen; Inhalte, Breiten und Farben lassen sich dort trotzdem ändern."],
        ["Einen Baustein als Vorlage nehmen",
         "Neben „Bearbeiten“ steht „Kopieren“. Der ganze Inhalt wird übernommen, Titel und Kürzel bleiben leer und müssen neu vergeben werden — das Original bleibt unangetastet. Gedacht für Arbeitsfassungen einer grossen Vorlage."],
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
         "Wie die App: die DEV-Fassung (rotes Symbol, Testwelt) gehört nur auf den Mac, die normale (blaugrünes Symbol) in die Praxis. Sind beide auf derselben Seite aktiv, schweigt die DEV-Fassung."],
        ["MRI-Anmeldung (nur Praxis)",
         "Das ausgefüllte Anmeldeformular in Axenita markieren (Strg+A) und kopieren (Strg+C), dann ;;mri in einem Feld tippen oder im Symbol-Fenster der Erweiterung „MRI-Anmeldung“ klicken. Erkannt werden Medizinisch Radiologisches Institut, RNR, Hirslanden und RIMED; das Menü zeigt nur die Adressen des erkannten Formulars, das passende ist vorgewählt (RIMED: Altstetten). Herr oder Frau wählst Du immer selbst. Der Knopf öffnet die fertige Mail im klassischen Outlook mit Signatur; das PDF ziehst Du hinein, gesendet wird von Hand."],
        ["Patienten-Kette für die Excel-Liste (nur Praxis)",
         "In Axenita die Patienteninformation markieren und kopieren, dann in irgendein Feld ;;pat tippen: Die Zeile „Name, Geburtsdatum, Strasse, PLZ Ort“ liegt danach in der Zwischenablage — ins Feld wird nichts geschrieben. In der Patientenliste mit Strg+V einsetzen."],
        ["Nach einem Update der Erweiterung",
         "Nach dem Aktualisieren-Pfeil in chrome://extensions die offenen Axenita-Reiter mit F5 neu laden — sonst arbeitet dort noch die alte Fassung."]
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
      ["Masken und Berichte — ganze Befunde aus einem Kürzel", [
        ["Was eine Maske ist",
         "Ein Baustein, der Dich beim Benutzen zuerst etwas FRAGT und dann genau den Text einsetzt, der zu Deinen Antworten passt. Ein normaler Baustein ist ein fertiger Text mit Lücken — eine Maske ist ein Text mit Schaltern: Kästchen zum An- und Abwählen ganzer Abschnitte, Auswahllisten, deren Antwort weitere Sätze steuert, und Listen, aus denen Du andere Bausteine dazuwählst. Das Vorbild ist Dein Berichtsgerüst: ein Kürzel, ein Fenster, ein fertiger Bericht."],
        ["So BENUTZT Du eine Maske",
         "Wie jeden Baustein: in der App anklicken, oder ;;kürzel im Zielprogramm. Es öffnet sich das Ausfüll-Fenster mit allen Kästchen, Feldern und Listen; unten zeigt die Vorschau laufend, wie der Text herauskommt. „Weiter“ führt Dich der Reihe nach durch die dazugewählten Bausteine (falls die eigene Fragen haben), das letzte Fenster heisst „Einfuegen“. Esc bricht überall ab — dann wird nichts eingesetzt. Mehr musst Du im Alltag nicht wissen."],
        ["Die Kärtchen im Bearbeiten-Fenster",
         "Öffnest Du eine Maske zum Bearbeiten, siehst Du keine Klammer-Codes, sondern KÄRTCHEN im Text — kleine beschriftete Knöpfe an genau der Stelle, wo etwas passiert. Ein Klick auf ein Kärtchen öffnet sein Fenster: Beschriftung ändern, Vorgaben setzen, übernehmen — oder das Kärtchen löschen. Zusammengehörende Anfangs- und Ende-Kärtchen tragen dieselbe Farbe; fehlt einem Partner das Gegenstück, wird das Paar rot gestrichelt markiert. Der Schalter „Rohtext“ zeigt Dir auf Wunsch den nackten Klammer-Code — brauchst Du nie, er ist nur für die Fehlersuche da."],
        ["Die Kärtchen-Arten, einzeln erklärt",
         "KÄSTCHEN ({{Ankreuz:Name}}): erscheint im Fenster als Häkchen-Kästchen und schreibt selbst nichts — es ist der Schalter für Wenn-Abschnitte. Mit /aus hinter dem Namen startet es abgewählt. ANKREUZ-LÜCKE ({{Ankreuz:Name=Satz}}): Kästchen MIT Text — ist es angekreuzt, erscheint der Satz, und Du kannst ihn im Fenster vorher noch überschreiben. WENN-PAAR ({{Wenn:Name}} … {{Ende}}): alles zwischen den beiden Kärtchen erscheint nur, wenn das gleichnamige Kästchen angekreuzt ist. WENN NICHT ({{WennNicht:Name}} … {{Ende}}): das Gegenteil — der Abschnitt erscheint nur bei ABGEWÄHLTEM Kästchen; so gibt es für beide Fälle den passenden Satz. WENN MIT WERT ({{Wenn:Seite=links}}): reagiert auf eine Auswahlliste statt auf ein Kästchen. AUS KATEGORIE ({{Aus Kategorie:Status}}): zeigt im Fenster alle fertigen Bausteine dieser Kategorie zum Ankreuzen; die gewählten werden an dieser Stelle eingesetzt, in der Reihenfolge Deines Anklickens. Ist die Kategorie noch leer, sagt das Fenster das, und der Abschnitt bleibt frei. SPRUNG ({{Sprung:2}}): nur fürs Spital — das Windows-Skript drückt an dieser Stelle so oft Strg+Tab und füllt damit die KISIM-Feldmaske Feld für Feld; in der App und im Browser wird daraus ein Zeilenumbruch."],
        ["Die Leerzeile mit dem geschützten Leerzeichen",
         "Zwischen den Kapiteln des Berichts stehen Leerzeilen, die nur erscheinen, wenn ihr Kapitel angekreuzt ist. Technisch ist das ein eigener kleiner Absatz mit einem geschützten Leerzeichen innerhalb des Wenn-Paars — beim Diktieren und Tippen verhält er sich wie eine ganz normale leere Zeile. Nur wissen musst Du das, wenn Du selbst eine Maske baust: Für eine mit-schaltbare Leerzeile den Absatz {{Wenn:Name}} geschütztes Leerzeichen {{Ende}} verwenden."],
        ["Dein Bericht ;;ber als Vorbild",
         "Der „Ambulante neurologische Bericht“ führt alles vor: zehn Kästchen für die Anamnese-Unterkapitel (teils vorangekreuzt), zwei Aus-Kategorie-Listen für Status und Untersuchungen, unterstrichene Untertitel mit Leerzeilen, in der Praxis die fetten Haupttitel Diagnosen bis Procedere — und am Spital dieselbe Maske als Standort-Fassung ohne Haupttitel, dafür mit Sprüngen durch die KISIM-Felder bis zur Endposition in Procedere. Willst Du eine neue Maske, ist Kopieren der schnellste Weg: Bericht kopieren (Knopf „Kopieren“), Titel und Kürzel vergeben, Kärtchen anpassen."],
        ["Kochbuch: eine kleine Maske in fünf Schritten",
         "Ziel: ein Kurzbefund mit einem an-/abwählbaren Satz und einer Seiten-Auswahl. 1) Neuen Baustein anlegen, Titel „Probe Maske“, Kürzel z. B. probem, Text schreiben: „Kontrolle in unserer Sprechstunde.“ 2) Schreibmarke ans Ende setzen, Platzhalter-Knopf „Ankreuz-Lücke“ drücken, Beschriftung „Begleitperson“, Text „Die Untersuchung fand in Begleitung statt.“ — das Kärtchen erscheint im Text. 3) Knopf „Auswahl“: Beschriftung „Seite“, Möglichkeiten „links|rechts“. 4) Knopf „Wenn-Abschnitt“: Beschriftung „Seite=links“ — zwischen die beiden neuen Kärtchen schreibst Du „Betroffen ist die linke Seite.“ Dasselbe nochmals mit „Seite=rechts“ und dem rechten Satz. 5) Speichern (Kürzel ist bei fertigen Bausteinen Pflicht) und ausprobieren: Benutzen öffnet das Fenster mit Kästchen und Auswahl, die Vorschau zeigt das Ergebnis. Wenn etwas rot gestrichelt ist, fehlt einem Wenn sein Ende — Kärtchen anklicken hilft."],
        ["Kategorien für den Bericht pflegen",
         "Damit ein Status- oder Untersuchungs-Baustein im Berichts-Fenster zur Wahl steht, braucht er nur die richtige Kategorie: Baustein bearbeiten, Kategorie exakt „Status“ bzw. „Untersuchungen“ eintragen, speichern. Beim nächsten ;;ber steht er in der Liste. Entwürfe und Ideen erscheinen dort nie — nur fertige Bausteine."],
        ["Wenn Du nicht weiterkommst",
         "Komplexe Masken sind Bau-Arbeit — auch die grossen kommerziellen Programme lösen das mit denselben Marken und Fenstern. Du musst sie nicht selbst bauen können: Beschreibe im Bau-Chat, was der Bericht können soll, und lass Dir die Maske bauen; ändern kannst Du danach jederzeit Sätze über die Kärtchen. Ein Frage-Assistent, der neue Masken aus Antworten zusammenbaut, steht im Ideen-Speicher."]
      ]],
      ["Das EEG-Werk — der Schnell-Befund", [
        ["Wozu es da ist",
         "Im Bereich „EEG“ entsteht der ganze EEG-Befund samt Beurteilung in Sekunden — der NORMALBEFUND ist beim Öffnen schon vorangewählt, Du tippst nur die Grundrhythmus-Frequenz (vorgegeben 9 Hz). Ableitung (Standard · Notfall · IPS — IPS bringt die 50-Hz-Artefakte mit), Vigilanz und die drei Artefakt-Kästchen sind Knopfzeilen. Das Häufige steht offen, Seltenes (Vor-EEG, Anfallsmuster, die Intensiv-Muster, Salzburg-Kriterien, Normvarianten, Knochenlücke, Ereignisse) ist eingeklappt und erscheint erst auf Aufklappen. Die Vorlage Normal (;;eeg) ist ein fertiges Normal-EEG; ;;eegips bringt die Intensiv-Fassung mit Reaktivität, Kontinuität und den Status-epilepticus-Bausteinen."],
        ["Herde und Entladungen als Zeilen",
         "Zwei Herd-Zeilen und eine Entladungs-Zeile stehen beim Öffnen schon bereit — sie zählen erst, wenn Du sie anfasst (jede Änderung kreuzt sie von selbst an; ✕ leert sie wieder). „+ Herd“ hängt weitere an: Häufigkeit, Band (Theta · Theta-Delta · Delta-Theta · Delta · Subdelta) und bis vier Lokalisations-Kästchen, die sich verketten — frontal+temporal wird fronto-temporal, temporal+frontal wird temporo-frontal; im ersten Kästchen gibt es auch generalisiert und hemisphärisch. Dazu Ausbreitung (bis zur Mittellinie, bis zur Gegenseite …) und Seite. Entladungen funktionieren gleich („+ Entladung“), mit der Form statt des Bands (Spike-Wave-Komplexe zuerst). Solange keine Zeile da ist, steht „keine.“ — die erste Zeile ersetzt es, das Löschen der letzten bringt es zurück."],
        ["Die Beurteilung macht sich selbst",
         "Die Kern-Beurteilung entsteht automatisch aus dem Befund: Die Grundrhythmus-Frequenz ergibt den ersten Satz (ab 8 Hz normal, unter 8 leichte, unter 6 mittelschwere Allgemeinveränderung — 8,0 ist noch normal, 6,0 noch leicht; Kommazahlen wie 7,5 werden verstanden). Das fGRDA-Kreuz bei der Grundaktivität ergänzt „Intermittierende fGRDA.“. Jede Herd-Zeile wird zu ihrem Satz mit Schweregrad nach Band (Theta leicht, Theta-Delta mässiggradig, Delta-Theta mittelschwer, Delta schwer, Subdelta schwer mit Zusatz), ohne Häufigkeit; jede Entladungs-Zeile zu „Epilepsietypische Potentiale …“. Jeden automatischen Satz kannst Du anklicken und überschreiben, ↺ holt ihn zurück. Überschriebenes wird nirgends hervorgehoben — im EEG steht nur, was auffällig ist."],
        ["So füllst Du aus",
         "Oben eine Vorlage wählen — die passenden Punkte sind angekreuzt, die Zusätze stehen mit ☆ bereit. In jedem Satz sind die veränderlichen Stellen Auswahllisten oder kleine Felder (z. B. die Frequenz). Klickst Du auf den Satztext selbst, kannst Du ihn frei überschreiben. Rechts wachsen Befund und Beurteilung live mit; drei Knöpfe kopieren Befund, Beurteilung oder beides als einen Block mit unterstrichenen Titeln."],
        ["Eigene Vorlagen",
         "„Auswahl als eigene Vorlage speichern“ merkt sich Ankreuz-Muster, Zusätze, Herd- und Entladungs-Zeilen und Deine Auswahl-Vorwahlen — nie die Freifeld-Inhalte und nie überschriebene Texte, denn die können Patientenangaben enthalten. Gibst Du der Vorlage ein Kürzel, öffnet ;;kürzel sie künftig am Arbeitsplatz — so kannst Du Dir z. B. eine Nachtschlaf-Vorlage selbst anlegen."],
        ["Pflege",
         "„EEG-Pflege“ zeigt den ganzen Katalog: Texte anklicken und umformulieren, Punkte ziehen (auch in eine andere Kategorie), häufig/selten schalten, neue Punkte anlegen. Auswahl-Stellen schreibst Du als {{Auswahl:Name:eins|zwei}}, Freifelder als {{Feld:Name=Vorgabe}} — die erste Auswahl ist immer der Normalfall. Alles synct sofort auf alle Geräte; gepflegt wird nur hier in der App."]
      ]],
      ["Das Status-Werk — der Neurostatus aus einem Gesamtkatalog", [
        ["Die Idee",
         "Im Hintergrund liegt EIN Gesamtstatus mit allen Untersuchungen, je mit Normalbefund, nach Kategorien geordnet (Allgemein, Stand und Gang, Kopf und Hirnnerven …). Deine einzelnen Status (CTS, Parkinson, Stroke …) sind Auswahlen daraus: Ein Klick auf den Status-Knopf oben kreuzt seine Untersuchungen an. Rechts entsteht laufend der fertige Fliesstext, nach Kategorien gegliedert, mit „Kopieren“ für KISIM, Axenita oder Word."],
        ["Einen Status benutzen",
         "Bereich „Status“ öffnen, oben einen oder mehrere Status anklicken. Die Ansicht zeigt dann nur noch die gewählten Untersuchungen und die Zusätze (Knopf „Nur Gewählte und Zusätze“ — ausschalten zeigt wieder alles). Weitere Untersuchungen kreuzt Du einfach an; häufige stehen offen da, seltene klappst Du je Kategorie mit „weitere …“ auf; das Suchfeld findet jede Untersuchung sofort."],
        ["Pathologisches überschreiben",
         "Ein Klick auf den Befundtext einer Untersuchung öffnet ihn zum Bearbeiten. Was Du änderst, erscheint im fertigen Text FETT und dunkelgrau — nur der veränderte Teil, damit Pathologisches sofort ins Auge springt. Der kleine Pfeil ↺ stellt den Normalbefund wieder her. Bei der Einzelkraftprüfung klappt „Muskeln (x/y)“ die einzelnen Muskeln auf; „alle abwählen“ und dann nur die geprüften anhaken — der Text nennt nur die gewählten."],
        ["Eigene Status speichern — mit Zusätzen",
         "Hast Du eine Auswahl beisammen, sichert „Als eigenen Status speichern“ sie unter einem Namen (gleicher Name ersetzt den alten). ZUSÄTZE: Mit dem Stern ☆ rechts merkst Du Untersuchungen vor, die Du bei diesem Status MANCHMAL machst — sie werden gelb und erscheinen beim nächsten Laden des Status sichtbar, aber NICHT angekreuzt, damit Du sie nicht suchen musst. Dasselbe gibt es in der Muskelliste: Ein Stern bei einem Muskel zeigt ihn beim Laden gelb und nicht angehakt, und die Liste steht dann gleich offen."],
        ["Die Tardoc-Anzeige",
         "Oben zeigt die Ampel laufend, ob Deine Auswahl für Neurostatus A oder B und Hirnnervenstatus A oder B reicht (A = mindestens vier erfüllte Gruppen), und nennt, was für A am nächsten fehlt. Gezählt werden Gruppen nach TARDOC — ob die Exploration als eigenständige Leistung erbracht wurde, beurteilst Du. „Tardoc-Kriterien nachlesen“ zeigt alle Gruppen mit ihren Merkmalen; jeder Positions-Titel führt direkt zur Position im LKAAT-Browser."],
        ["Den Gesamtkatalog pflegen",
         "„Status-Pflege“ oben rechts: Untersuchungen ändern (Name, Normalbefund, häufig/selten), neue anlegen, Kategorien umbenennen und ordnen. Verschieben geht mit der Maus: Zeile am Griff ⠇ packen und dort loslassen, wo sie hin soll — auch in eine andere Kategorie (die blaue Linie zeigt die Stelle). Die Pfeile gehen weiterhin. „Status als Datei sichern“ legt den ganzen Katalog samt Deinen Status als Datei ab — so bringst Du Änderungswünsche in den Bau-Chat."]
      ]],
      ["Bericht Memory Clinic — der KISIM-Bericht aus dem Vorbericht", [
        ["Was er tut",
         "Er übernimmt aus dem neuropsychologischen Vorbericht die Anamnese-Abschnitte und die Demenz-Scores (IQCODE, IADL, CDR) und baut daraus die Felder Anamnese und Untersuchungen des KISIM-Berichts — mit Leerzeilen, Unterstreichungen und der Medikamentenliste als Fliesstext („Name Stärke x-x-x“). Was die App nicht findet, steht gelb markiert da."],
        ["Am Spital in KISIM (der Hauptweg)",
         "Im KISIM-Bericht ins erste Feld klicken, ;;bermc und Leertaste. Im Fenster den Vorbericht einfügen, Anrede und Begleitung prüfen, die Zusatzbefunde einlesen (siehe unten) und „Ganzen KISIM-Bericht ausfüllen“ drücken: Das Skript ersetzt das erste Feld durch den Dank-Satz, springt mit Strg+Tab ins Anamnese-Feld, füllt es, springt weiter zu den Untersuchungen und füllt auch diese."],
        ["Zusatzbefunde einlesen",
         "Ins Feld „Zusatzbefunde“ kommt, was Du hast: ein EEG-Brief, ein Radiologie-Bericht (auch der „Radiology Report“), die Viollier-Demenzmarker, das LP-Punktat — oder gleich der GANZE übernommene Untersuchungsblock aus KISIM auf einmal. Jeder Befund wird zu einer Zeile „Name vom Datum (Ort): Befund“, unterstrichen bis und mit der Klammer, nach Datum geordnet (ältestes zuoberst). „Zusatzuntersuchung“ und „Neurologie“ fallen weg, das EEG heisst Standard-EEG, Striche verschwinden, echte Aufzählungspunkte bleiben, eine Unterschrift wird abgeschnitten. Jedes MR Schädel bekommt „(in der Eigendurchsicht: xx.)“."],
        ["Was immer und was nur bei Bedarf erscheint",
         "Immer: die Demenz-Scores (mit dem Datum der Neuropsychologie — nie das Geburtsdatum; findet die App keines, steht es gelb) und das Demenzlabor als Vorlage. Alles andere, auch die Lumbalpunktion, erscheint nur, wenn Du es eingelesen hast. A, T und N der Lumbalpunktion bleiben immer gelb — das ist Deine ärztliche Wertung."],
        ["Über die App statt das Skript",
         "Derselbe Bericht geht auch in der App (Bereich „Bericht MC“): einlesen, „Kopieren“, in KISIM Strg+V. Das funktioniert nur direkt am Spital-Rechner, nicht über die Fernsitzung vom Mac (deren Zwischenablage trägt nur reinen Text). Auf diesem Weg ist die Einrückung der Score-Liste noch nicht perfekt — der Weg über ;;bermc ist der vollständige."]
      ]],
      ["Die Bausteine-Übersicht", [
        ["Spickzettel und Inventar",
         "Bereich „Übersicht“: alle fertigen Bausteine als Liste, sortierbar nach Kategorie, Titel, Kürzel oder „zuletzt benutzt“, mit der ersten Textzeile — und als PDF ausgebbar, zum Ausdrucken neben KISIM oder zum Aufräumen."]
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
         "Das Status-Werk und der Bericht Memory Clinic sind da. Als Nächstes überarbeitest Du Deine einzelnen Status (mit Zusätzen), dann folgen der EEG-Befund und die ENMG-Berichte (mehrstufig, mit Normwerten nach Alter und Geschlecht). Danach je nach Wunsch: Medikamenteneingabe für Praxis und Spital, Diagnoselisten, SEP-Befund, Formular-Abläufe, KI-Gegenlesen, die Kürzel auf dem Mac, die iPhone-Darstellung und eine Statistik mit mehr Aussagekraft."],
        ["Was noch nicht bewiesen ist",
         "Ob das Diktat die Marken anspringt, und ob die Zählung der Erweiterung in der Statistik der App als eigenes Gerät auftaucht. Beides zeigt sich erst im Alltag."]
      ]]
    ];
  }
  return { inhalt: inhalt };
})();
