; Datei: Bausteine.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Die Hauptdatei — sie laedt die Teile in fester Reihenfolge,
;        startet den Tasten-Horcher, holt jede Minute die Bausteine
;        und stellt das Symbol unten rechts mit seinem Menue. Beenden
;        heisst: Symbol -> Beenden, oder den Ordner loeschen — das
;        Skript installiert nichts und aendert nichts am System; einzige
;        Ausnahme (18.10): die Verknuepfung im Autostart-Ordner, damit es
;        mit Windows startet (im Menue "Mit Windows starten" abschaltbar).
;        18.16: holt neue Fassungen selbst von GitHub (update.ahk) - beim
;        Start und ueber "Jetzt aktualisieren"; "Zurueck zur letzten
;        Fassung" tauscht zurueck. Der Ordner heisst seit 18.16 an
;        beiden Orten Bausteine-Skript.
;        GRUNDSATZ: keine Patientendaten in Speicher, Ablage oder Netz.

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

#Include texte.ahk
#Include konfiguration.ahk
#Include standort.ahk
#Include json.ahk
#Include netz.ahk
#Include makros.ahk
#Include makros-masken.ahk
#Include einfuegen.ahk
#Include zwischenablage.ahk
#Include statistik.ahk
#Include fenster.ahk
#Include fenster-masken.ahk
#Include fenster-bericht-mc.ahk
#Include fenster-url.ahk
#Include fenster-pruefstand.ahk
#Include kuerzel.ahk
#Include pat.ahk
#Include autostart.ahk
#Include update.ahk

; ---- Symbol-Menue unten rechts ------------------------------------------
A_TrayMenu.Delete()
; 18.14: "TESTWELT" nur, wenn das Skript wirklich in der Testwelt laeuft
if (WELT = "dev")
    TX["appName"] := TX["appName"] " TESTWELT"
A_TrayMenu.Add(TX["appName"] " " FASSUNG, (*) => 0)
A_TrayMenu.Disable(TX["appName"] " " FASSUNG)
A_TrayMenu.Add()
; Zeile mit dem aktuellen Standort (nur Anzeige, nachgefuehrt beim Wechsel).
global standortMenueText := ""
StandortMenueNachziehen() {
    global standortMenueText, standortWert
    neuText := TX["standortAktuell"] ((standortWert != "") ? standortWert : TX["standortKeiner"])
    if (standortMenueText != "")
        A_TrayMenu.Rename(standortMenueText, neuText)
    else {
        A_TrayMenu.Add(neuText, (*) => 0)
    }
    A_TrayMenu.Disable(neuText)
    standortMenueText := neuText
}
StandortMenueNachziehen()
; 18.16: Zeile mit dem Ergebnis der letzten Update-Pruefung (nur Anzeige)
UpdZustandSetzen(TX["updNochNicht"], false)
A_TrayMenu.Add(TX["menueFaecher"], (*) => FaecherFenster())
A_TrayMenu.Add(TX["menueZustand"], (*) => ZustandFenster(0))
A_TrayMenu.Add(TX["menuePruefstand"], (*) => PruefstandOeffnen())

; Tastenwege ohne Mithoeren (28.9.): Auf dem Klinik-Rechner wird das
; Mithoeren der Tastatur offenbar blockiert. Tastenkombinationen laufen
; ueber eine andere Windows-Schnittstelle und oeffnen dieselben Fenster:
; zuerst ins Zielfeld klicken, dann die Kombination druecken.
^!t::ZustandFenster(WinExist("A"))
^!b::BerichtMcOeffnen(WinExist("A"))
^!Space::SucheOhneTippen()
^!p::PruefstandOeffnen()
^!g:: {
    global pruefHotkeyKam
    pruefHotkeyKam := "Strg+Alt+G"
}

SucheOhneTippen() {
    global wahlFenster, wahlSuche
    ziel := WinExist("A")
    WahlZeigen("suche", "", 0, ziel)
    if (wahlFenster != "") {
        try wahlFenster.Show()
        try wahlSuche.Focus()
    }
}
A_TrayMenu.Add(TX["menueZustand"], (*) => ZustandFenster(WinExist("A")))
if (WELT = "dev")
    A_TrayMenu.Add(TX["menueRtfFang"], (*) => RtfFangSichern())
A_TrayMenu.Add(TX["menueStandort"], (*) => (StandortWaehlen(), StandortMenueNachziehen(), WeicheMenueNachziehen(), CacheLaden()))
A_TrayMenu.Add(TX["menueWeiche"], WeicheKlick)

; Das Haekchen im Menue zeigt den Zustand der Browser-Weiche.
WeicheMenueNachziehen() {
    if BrowserRegelAktiv()
        A_TrayMenu.Check(TX["menueWeiche"])
    else
        A_TrayMenu.Uncheck(TX["menueWeiche"])
}

WeicheKlick(*) {
    WeicheUmschalten()
    WeicheMenueNachziehen()
    Toast(BrowserRegelAktiv() ? TX["zustandRegelAn"] : TX["zustandRegelAus"], false)
}
A_TrayMenu.Add(TX["menueHolen"], MenueHolen)
A_TrayMenu.Add(TX["menueAnmelden"], (*) => AnmeldeFenster())
A_TrayMenu.Add(TX["menueAbmelden"], MenueAbmelden)
A_TrayMenu.Add(TX["menueAutostart"], AutostartKlick)
A_TrayMenu.Add()
; 18.16: Selbst-Update (update.ahk)
A_TrayMenu.Add(TX["menueUpdate"], UpdPruefenMenue)
A_TrayMenu.Add(UpdZurueckBeschriftung(), UpdZurueckMenue)
A_TrayMenu.Add()
A_TrayMenu.Add(TX["menueBeenden"], (*) => ExitApp())
A_TrayMenu.Default := TX["menueFaecher"]
A_IconTip := TX["appName"] " " FASSUNG " (" WELT ")"

MenueHolen(*) {
    if Holen(false)
        Toast(TX["geholt"] bausteine.Length, false)
}

MenueAbmelden(*) {
    Abmelden()
    Toast(TX["abgemeldet"], false)
}

; ---- Anlauf --------------------------------------------------------------
; 18.16: Laeuft noch ein Bausteine-Skript aus einem ANDEREN Ordner (z. B.
; dem alten Spital_BausteineKuerzel), wird es zuerst beendet - sonst
; setzten zwei Skripte jedes Kuerzel doppelt ein.
AndereBausteineBeenden()
StandortLaden()
if (StandortName() = "") {
    ; Seit 15.14 ohne Wahlfenster: Das Skript laeuft nur am Spital,
    ; darum wird der Standort still vorbelegt (Naed 29.9.). Wechseln
    ; geht weiterhin im Menue des Symbols unten rechts.
    StandortVorbelegen()
}
StandortMenueNachziehen()
WeicheMenueNachziehen()
; 18.10: Am Morgen war das Skript wieder aus (Naed 13.10.) - die alte
; Autostart-Verknuepfung zeigte vermutlich noch auf den frueheren
; Ordnernamen. Jetzt richtet jeder Start sie selbst neu aus.
AutostartPflegen()
AutostartMenueNachziehen()
SitzungLaden()
StatistikLaden()
CacheLaden()
HorcherStart()
horcherAufgesetzt := FormatTime(A_Now, "HH:mm:ss")
SetTimer(HorcherNeuAufsetzen, 60000)
; Seit 11.1: Mit gemerkter Anmeldung meldet sich das Skript beim Start
; selbst an. Seit 15.14 oeffnet sich dabei KEIN Fenster mehr (Naed
; 29.9.): Ohne Anmeldung arbeitet das Skript still mit dem zuletzt
; geholten Bausteinstand weiter und zeigt nur eine kurze Meldung;
; das Anmeldefenster kommt nur noch ueber das Menue des Symbols —
; oder beim allerersten Start, wenn noch gar keine Bausteine da sind.
if !Angemeldet()
    AutoAnmeldenStill()
if !Angemeldet() {
    if (bausteine.Length > 0)
        Toast(TX["stillOhneAnmeldung"], true)
    else
        AnmeldeFenster()
}
else {
    if Holen(true)
        Toast(TX["bereit"] bausteine.Length, false)
    else if (bausteine.Length > 0)
        Toast(TX["offlineCache"], false)
    else
        Toast(TX["keineBausteine"], true)
}
global angemeldeteTasten := ""
FachTastenAnmelden()
SetTimer(Nachschubtakt, TAKT_MS)
; 18.16: Selbst-Update - melden, was beim letzten Neustart passiert ist,
; und kurz nach dem Start auf GitHub nach einer neuen Fassung schauen.
SetTimer(UpdNachStartMelden, -1500)
SetTimer(UpdPruefenStill, -6000)
; 18.17: zusaetzlich alle 2 Stunden still nachsehen (nur einspielen,
; wenn 10 Minuten lang nichts getippt wurde - update.ahk, UpdTakt).
SetTimer(UpdTakt, 7200000)

; Die Tastenkombination zum Merken kommt aus den App-Einstellungen und
; kann dort auch abgeschaltet werden (Feinschliff 20.9.).
FachTastenAnmelden() {
    global angemeldeteTasten
    neu := FachTasten()
    if (neu = angemeldeteTasten)
        return
    loop 9 {
        n := A_Index
        if (angemeldeteTasten != "") {
            try Hotkey(angemeldeteTasten n, "Off")
        }
        if (neu != "") {
            try Hotkey(neu n, FachMerkenTaste.Bind(n), "On")
        }
    }
    angemeldeteTasten := neu
}


; Holt den Nachschub selbsttätig (Näds Wunsch 23.9.: „dann gibt es
; weniger Verzögerung direkt nach neuen Bausteinen"). Der Takt ist
; kurz, aber der teure Ruf läuft nur, wenn die Vorab-Prüfung eine
; Änderung meldet. Und er läuft NIE, während gerade ein Kürzel
; eingesetzt wird oder ein Fenster offen steht — sonst könnte der
; Ruf das Skript ausgerechnet beim Tippen kurz anhalten.
; Wahr, solange gerade ein Kürzel eingesetzt wird oder ein Fenster
; der App offen steht.
BeschaeftigtJetzt() {
    global amEinsetzen
    if (amEinsetzen)
        return true
    try return WahlOffen()
    return false
}

Nachschubtakt() {
    if !Angemeldet()
        return
    if (BeschaeftigtJetzt())
        return
    if NeuesVorhanden()
        Holen(true)
    FachTastenAnmelden()
}
