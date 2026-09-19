; Datei: texte.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Alle sichtbaren Texte des Skripts an einem Ort, deutsch,
;        nach dem Vorbild von texte.js der App. Wer eine Meldung
;        aendern will, aendert sie hier — nirgends sonst.

global TX := Map()

; ---- Fenster-Titel ----------------------------------------------------
TX["appName"] := "Bausteine"
TX["anmeldeTitel"] := "Bausteine - Anmelden"
TX["lueckenTitel"] := "Bausteine - Ausfuellen"
TX["wahlTitel"] := "Bausteine - Auswahl"
TX["faecherTitel"] := "Bausteine - Zwischenspeicher"
TX["entwurfTitel"] := "Bausteine - Als Entwurf sichern"

; ---- Anmeldung --------------------------------------------------------
TX["anmeldeText"] := "Einmal anmelden, danach merkt sich das Skript die Sitzung (nie das Passwort)."
TX["mail"] := "E-Mail"
TX["passwort"] := "Passwort"
TX["anmelden"] := "Anmelden"
TX["anmeldenLaeuft"] := "Meldet an ..."
TX["anmeldungFehlt"] := "Bitte E-Mail und Passwort eintragen."

; ---- Netz-Fehler (nach dem Muster von wolke.js) -----------------------
TX["fehlerNetz"] := "Keine Verbindung zur Datenablage."
TX["fehlerAnmeldung"] := "E-Mail oder Passwort stimmt nicht."
TX["fehlerAbgemeldet"] := "Die Anmeldung ist abgelaufen - im Bausteine-Symbol unten rechts neu anmelden."
TX["fehlerPause"] := "Die Datenablage antwortet nicht (moeglicherweise pausiert)."
TX["fehlerAllgemein"] := "Die Datenablage meldet einen Fehler"

; ---- Meldungen unten (Toast) ------------------------------------------
TX["bereit"] := "Bausteine bereit - Bausteine an Bord: "
TX["geholt"] := "Frisch geholt - Bausteine an Bord: "
TX["unbekannt"] := "Kein Baustein mit dem Kuerzel"
TX["rtfFehlt"] := "Dieser Baustein hat noch kein Druckformat - in der App einmal oeffnen und speichern. Er wurde als reiner Text eingefuegt."
TX["eingefuegt"] := "Eingefuegt: "
TX["abgebrochen"] := "Abgebrochen - das Kuerzel steht noch da."
TX["fachLeer"] := "Dieses Fach ist leer. Zuerst im Zwischenspeicher-Fenster auf Merken druecken."
TX["fachGemerkt"] := "Gemerkt in Fach "
TX["fachEingesetzt"] := "Eingesetzt aus Fach "
TX["keineBausteine"] := "Noch keine Bausteine an Bord. Im Bausteine-Symbol unten rechts anmelden oder Jetzt holen druecken."
TX["offlineCache"] := "Ohne Netz gestartet - es gilt der zuletzt geholte Stand."

; ---- Auswahl-Fenster (Vorschau und Suche) -----------------------------
TX["suchfeld"] := "Suchen (Titel, Kuerzel, Kategorie und Text)"
TX["keineTreffer"] := "Kein Baustein passt."
TX["haeufigste"] := "Haeufigste"
TX["alleWeiteren"] := "Alphabetisch"
TX["wahlHinweis"] := "Klick fuegt ein | Esc schliesst | Weitertippen verfeinert"

; ---- Luecken-Fenster ---------------------------------------------------
TX["lueckenEinfuegen"] := "Einfuegen"
TX["abbrechen"] := "Abbrechen"
TX["vorschau"] := "Vorschau"

; ---- Entwurf (;;neu) ---------------------------------------------------
TX["entwurfText"] := "Das liegt in der Zwischenablage und wird als Entwurf in Deine Bausteine gelegt. KONTROLLIERE: kein Patientenname, keine Patientendaten!"
TX["entwurfSichern"] := "Als Entwurf sichern"
TX["entwurfGesichert"] := "Als Entwurf gesichert - am naechsten Geraet unter Entwuerfe."
TX["entwurfLeer"] := "Die Zwischenablage ist leer. Zuerst Text markieren und Strg+C druecken, dann " Chr(59) ";neu tippen."
TX["entwurfFehler"] := "Der Entwurf konnte nicht hochgeladen werden: "

; ---- Zwischenspeicher-Fenster ------------------------------------------
TX["merken"] := "Merken"
TX["einsetzen"] := "Einsetzen"
TX["faecherHinweis"] := "Neun Faecher, nur im Arbeitsspeicher - beim Beenden ist alles weg. Einsetzen auch per Kuerzel " Chr(59) ";z1 bis " Chr(59) ";z9."
TX["leerFach"] := "(leer)"

; ---- Symbol-Menue unten rechts ------------------------------------------
TX["menueFaecher"] := "Zwischenspeicher-Fenster"
TX["menueHolen"] := "Jetzt holen"
TX["menueAnmelden"] := "Anmelden"
TX["menueAbmelden"] := "Abmelden"
TX["menueBeenden"] := "Beenden"
TX["abgemeldet"] := "Abgemeldet. Die Kuerzel wirken erst nach neuer Anmeldung wieder."
