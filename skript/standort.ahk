; Datei: standort.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Der Standort dieses Rechners (Spital Limmattal oder Praxis
;        Neuromed) und — seit 11.1 getrennt davon — die Browser-Weiche:
;        "Browserfenster der Erweiterung ueberlassen" an/aus. Der
;        Standort ist seit 15.14 ohne Rueckfrage auf Spital Limmattal
;        vorbelegt (das Skript laeuft nur dort) und
;        bestimmt nur noch die VORBELEGUNG der Weiche (Praxis: an,
;        Spital: aus); danach laesst sich die Weiche jederzeit im Menue
;        des gruenen Symbols umstellen, ohne den Standort zu wechseln.
;        Beides steht in einer kleinen Datei im Ordner. Die Statistik
;        zaehlt unter dem Standortnamen, damit immer klar ist, WO
;        eingefuegt wurde.

global standortWert := ""
global weicheWert := ""

StandortDatei() {
    return DatenOrdner() "\standort-" WELT ".txt"
}

WeicheVorbelegung(standort) {
    ; 18.26 (Erweiterungs-Abloesung): Die Erweiterung ist ausgeschaltet,
    ; das Skript arbeitet ueberall - auch in Browserfenstern. Die Weiche
    ; bleibt im Menue umstellbar, falls die Erweiterung je wieder laeuft;
    ; eine gespeicherte Wahl in der Standort-Datei gilt weiter.
    return "aus"
}

StandortLaden() {
    global standortWert, weicheWert
    if !FileExist(StandortDatei())
        return
    try {
        roh := FileRead(StandortDatei(), "UTF-8")
        zeilen := StrSplit(roh, "`n", "`r")
        wert := zeilen.Length >= 1 ? Trim(zeilen[1], " `t") : ""
        if (wert = TX["standortSpital"] or wert = TX["standortPraxis"])
            standortWert := wert
        weiche := zeilen.Length >= 2 ? Trim(zeilen[2], " `t") : ""
        if (weiche = "an" or weiche = "aus")
            weicheWert := weiche
        else if (standortWert != "")
            weicheWert := WeicheVorbelegung(standortWert)
    }
}

StandortSichern() {
    try FileDelete(StandortDatei())
    FileAppend(standortWert "`n" weicheWert, StandortDatei(), "UTF-8")
}

; Seit 15.14: Beim Start wird der Spital-Standort ohne Fenster
; gesetzt (Naed 29.9.). Wechseln geht weiterhin im Menue des
; Symbols unten rechts.
StandortVorbelegen() {
    global standortWert, weicheWert
    standortWert := TX["standortSpital"]
    weicheWert := WeicheVorbelegung(standortWert)
    StandortSichern()
}

StandortName() {
    global standortWert
    return standortWert
}

; Die Weiche: an heisst, Browserfenster gehoeren der Chrome-Erweiterung
; und das Skript haelt sich dort zurueck.
BrowserRegelAktiv() {
    return weicheWert = "an"
}

WeicheUmschalten() {
    global weicheWert
    weicheWert := BrowserRegelAktiv() ? "aus" : "an"
    StandortSichern()
}

; Gilt das gerade aktive Fenster als Browser? Erkannt am Programmnamen
; (Liste in konfiguration.ahk, aenderbar).
AktivesFensterIstBrowser() {
    programm := ""
    try programm := StrLower(WinGetProcessName("A"))
    if (programm = "")
        return false
    for p in BROWSER_PROZESSE {
        if (StrLower(p) = programm)
            return true
    }
    return false
}

; Die Weiche im Einsatz: true heisst, das Skript haelt sich hier zurueck.
ImBrowserGesperrt() {
    return BrowserRegelAktiv() and AktivesFensterIstBrowser()
}

; Das Wahl-Fenster: zwei grosse Knoepfe, kein Klein-Klein. Es blockiert,
; bis gewaehlt ist — ohne Standort laeuft das Skript nicht los. Die Wahl
; belegt auch die Browser-Weiche vor (im Menue jederzeit umstellbar).
StandortWaehlen() {
    global standortWert, weicheWert
    fertig := false
    g := Gui("+AlwaysOnTop", TX["standortTitel"])
    g.SetFont("s10", "Segoe UI")
    aktuell := (standortWert != "") ? standortWert : TX["standortKeiner"]
    g.Add("Text", "w420", TX["standortAktuell"] aktuell)
    g.Add("Text", "y+8 w420", TX["standortFrage"])
    k1 := g.Add("Button", "y+12 w420 h40", TX["standortSpital"])
    k2 := g.Add("Button", "y+8 w420 h40", TX["standortPraxis"])
    k1.OnEvent("Click", (*) => Nimm(TX["standortSpital"]))
    k2.OnEvent("Click", (*) => Nimm(TX["standortPraxis"]))
    g.OnEvent("Close", (*) => Zu())
    g.OnEvent("Escape", (*) => Zu())
    g.Show()
    Nimm(wert) {
        standortWert := wert
        weicheWert := WeicheVorbelegung(wert)
        StandortSichern()
        fertig := true
        g.Destroy()
        Toast(TX["standortGesetzt"] wert, false)
    }
    Zu() {
        fertig := true
        g.Destroy()
    }
    while !fertig
        Sleep 100
}
