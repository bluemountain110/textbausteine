; Datei: fenster-pruefstand.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey v2)
; Zweck: Der Pruefstand (Naeds Wunsch 28.9.): findet am jeweiligen
;        Rechner Stufe fuer Stufe heraus, was moeglich ist -
;        P1 Mithoeren (drei Ziele), P2 Tastenkombination (F8 oder
;        Strg+Alt+G), P3 Einfuegen mit Formatierung, P4 Loeschen,
;        P5 Zwischenablage. Ablauf seit Fassung 15.11: erst Pruefung
;        waehlen, Anweisung in Ruhe lesen, dann "Jetzt starten" -
;        waehrend des Laufs zaehlt die Restzeit sichtbar herunter.
;        Ergebnisse GRUEN/ROT in der Liste; "Bericht kopieren" am Ende.
;        GRUNDSATZ: nichts wird gespeichert, nichts verlaesst den Rechner.

global pruefFenster := ""
global pruefListe := ""
global pruefAnweisung := ""
global pruefStartKnopf := ""
global pruefTest := ""
global pruefRest := 0
global pruefBasis := 0
global pruefHotkeyKam := ""
global pruefJa := ""
global pruefNein := ""
global pruefOffeneFrage := ""

PruefstandOeffnen() {
    global pruefFenster, pruefListe, pruefAnweisung, pruefJa, pruefNein
    global pruefStartKnopf, pruefTest
    if (pruefFenster != "") {
        try pruefFenster.Destroy()
        pruefFenster := ""
    }
    pruefTest := ""
    g := Gui("+AlwaysOnTop +Resize", TX["pruefTitel"])
    g.SetFont("s10", "Segoe UI")
    g.Add("Text", "w640", TX["pruefHinweis"])
    k1 := g.Add("Button", "xm w205", TX["pruefKnopf1"])
    k2 := g.Add("Button", "x+10 w205", TX["pruefKnopf2"])
    k3 := g.Add("Button", "x+10 w205", TX["pruefKnopf3"])
    k4 := g.Add("Button", "xm w205", TX["pruefKnopf4"])
    k5 := g.Add("Button", "x+10 w205", TX["pruefKnopf5"])
    k6 := g.Add("Button", "x+10 w205", TX["pruefKnopf6"])
    pruefAnweisung := g.Add("Text", "xm w640 h64 +Wrap", TX["pruefWarte"])
    pruefStartKnopf := g.Add("Button", "xm w310 Disabled", TX["pruefStartKnopf"])
    pruefJa := g.Add("Button", "x+10 w150 Disabled", TX["pruefJaKnopf"])
    pruefNein := g.Add("Button", "x+10 w150 Disabled", TX["pruefNeinKnopf"])
    pruefListe := g.Add("Edit", "xm w640 r10 ReadOnly")
    kKop := g.Add("Button", "xm w310", TX["pruefKopieren"])
    kZu := g.Add("Button", "x+20 w310", TX["bermcSchliessen"])

    k1.OnEvent("Click", (*) => PruefWaehlen("1a"))
    k2.OnEvent("Click", (*) => PruefWaehlen("1b"))
    k3.OnEvent("Click", (*) => PruefWaehlen("1c"))
    k4.OnEvent("Click", (*) => PruefWaehlen("2"))
    k5.OnEvent("Click", (*) => PruefWaehlen("3"))
    k6.OnEvent("Click", (*) => PruefWaehlen("4"))
    pruefStartKnopf.OnEvent("Click", (*) => PruefStart())
    pruefJa.OnEvent("Click", (*) => PruefAntwort(true))
    pruefNein.OnEvent("Click", (*) => PruefAntwort(false))
    kKop.OnEvent("Click", (*) => PruefBericht())
    kZu.OnEvent("Click", PruefZu)
    g.OnEvent("Close", (*) => PruefWeg())
    g.Show("w680")
    pruefFenster := g
    PruefZeile(TX["pruefKopfzeile"] " " FASSUNG)
    PruefZwischenablage()
}

PruefZu(*) {
    global pruefFenster
    try pruefFenster.Destroy()
    pruefFenster := ""
}

PruefWeg() {
    global pruefFenster
    pruefFenster := ""
}

PruefZeile(text) {
    global pruefListe
    if (pruefListe = "")
        return
    alt := pruefListe.Value
    pruefListe.Value := alt (alt = "" ? "" : "`n") text
}

; ---- Schritt 1: Pruefung waehlen - Anweisung in Ruhe lesen ------------
PruefWaehlen(t) {
    global pruefTest, pruefAnweisung, pruefStartKnopf
    pruefTest := t
    if (t = "1a")
        pruefAnweisung.Value := TX["pruefLies1a"]
    else if (t = "1b")
        pruefAnweisung.Value := TX["pruefLies1b"]
    else if (t = "1c")
        pruefAnweisung.Value := TX["pruefLies1c"]
    else if (t = "2")
        pruefAnweisung.Value := TX["pruefLies2"]
    else if (t = "3")
        pruefAnweisung.Value := TX["pruefLies3"]
    else if (t = "4")
        pruefAnweisung.Value := TX["pruefLies4"]
    pruefStartKnopf.Enabled := true
}

; ---- Schritt 2: Start - Countdown laeuft sichtbar ---------------------
PruefStart() {
    global pruefTest, pruefRest, pruefBasis, pruefHotkeyKam
    global pruefStartKnopf, gesehen
    if (pruefTest = "")
        return
    pruefStartKnopf.Enabled := false
    if (pruefTest = "1a" or pruefTest = "1b" or pruefTest = "1c") {
        pruefBasis := gesehen
        pruefRest := 10
    } else if (pruefTest = "2") {
        pruefHotkeyKam := ""
        try Hotkey("F8", PruefF8, "On")
        pruefRest := 10
    } else if (pruefTest = "3") {
        pruefRest := 5
    } else if (pruefTest = "4") {
        pruefRest := 8
    }
    PruefTickText()
    SetTimer(PruefTick, 1000)
}

PruefF8(*) {
    global pruefHotkeyKam
    pruefHotkeyKam := "F8"
}

PruefTick() {
    global pruefTest, pruefRest, pruefHotkeyKam
    pruefRest -= 1
    if (pruefTest = "2" and pruefHotkeyKam != "") {
        SetTimer(PruefTick, 0)
        PruefFertig()
        return
    }
    if (pruefRest <= 0) {
        SetTimer(PruefTick, 0)
        PruefFertig()
        return
    }
    PruefTickText()
}

PruefTickText() {
    global pruefAnweisung, pruefRest
    pruefAnweisung.Value := Format(TX["pruefLaeuft"], pruefRest)
}

PruefFertig() {
    global pruefTest, pruefAnweisung, pruefBasis, pruefHotkeyKam, gesehen
    t := pruefTest
    pruefTest := ""
    if (t = "1a" or t = "1b" or t = "1c") {
        delta := gesehen - pruefBasis
        name := (t = "1a") ? TX["pruefName1a"]
              : (t = "1b") ? TX["pruefName1b"] : TX["pruefName1c"]
        if (delta >= 8)
            PruefZeile("GRUEN  " Format(TX["pruefHoertJa"], name, delta))
        else
            PruefZeile("ROT    " Format(TX["pruefHoertNein"], name, delta))
        pruefAnweisung.Value := TX["pruefWarte"]
    } else if (t = "2") {
        try Hotkey("F8", PruefF8, "Off")
        if (pruefHotkeyKam != "")
            PruefZeile("GRUEN  " Format(TX["pruefHotkeyJa"], pruefHotkeyKam))
        else
            PruefZeile("ROT    " TX["pruefHotkeyNein"])
        pruefAnweisung.Value := TX["pruefWarte"]
    } else if (t = "3") {
        PruefEinfuegenJetzt()
    } else if (t = "4") {
        PruefLoeschenJetzt()
    }
}

; ---- P3: Einfuegen mit Formatierung ins zuletzt aktive Fenster --------
PruefEinfuegenJetzt() {
    ziel := WinExist("A")
    text := TX["pruefProbeText"]
    rtf := BermcRtfHuelle(BermcRtfText(TX["pruefProbeText1"])
         . "\b " BermcRtfText(TX["pruefProbeText2"]) "\b0 "
         . BermcRtfText(TX["pruefProbeText3"]))
    FuegeEin(text, rtf, ziel, 0)
    PruefFrage("einfuegen", TX["pruefEinfuegenFrage"])
}

; ---- P4: Loeschen - kommen Backspaces im Ziel an? ---------------------
PruefLoeschenJetzt() {
    ziel := WinExist("A")
    if (ziel != 0) {
        try WinActivate(ziel)
        Sleep 120
    }
    Send "{Backspace 5}"
    PruefFrage("loeschen", TX["pruefLoeschenFrage"])
}

; ---- P5: Zwischenablage schreiben und zuruecklesen (automatisch) ------
PruefZwischenablage() {
    alte := ClipboardAll()
    probe := "Textbausteine-Pruefstand " A_TickCount
    A_Clipboard := probe
    ok := ClipWait(1)
    gelesen := A_Clipboard
    A_Clipboard := alte
    if (ok and gelesen = probe)
        PruefZeile("GRUEN  " TX["pruefClipJa"])
    else
        PruefZeile("ROT    " TX["pruefClipNein"])
}

; ---- Ja/Nein-Fragen nach P3 und P4 ------------------------------------
PruefFrage(welche, frage) {
    global pruefAnweisung, pruefJa, pruefNein, pruefOffeneFrage
    pruefOffeneFrage := welche
    pruefAnweisung.Value := frage
    pruefJa.Enabled := true
    pruefNein.Enabled := true
}

PruefAntwort(ja) {
    global pruefAnweisung, pruefJa, pruefNein, pruefOffeneFrage
    if (pruefOffeneFrage = "einfuegen")
        PruefZeile((ja ? "GRUEN  " TX["pruefEinfuegenJa"]
                       : "ROT    " TX["pruefEinfuegenNein"]))
    else if (pruefOffeneFrage = "loeschen")
        PruefZeile((ja ? "GRUEN  " TX["pruefLoeschenJa"]
                       : "ROT    " TX["pruefLoeschenNein"]))
    pruefOffeneFrage := ""
    pruefJa.Enabled := false
    pruefNein.Enabled := false
    pruefAnweisung.Value := TX["pruefWarte"]
}

; ---- Bericht fuer Claude ----------------------------------------------
PruefBericht() {
    global pruefListe
    kopf := TX["pruefTitel"] " - "
          . (StandortName() != "" ? StandortName() : TX["zustandOhneStandort"])
          . " - " FormatTime(A_Now, "dd.MM.yyyy HH:mm:ss")
    A_Clipboard := kopf "`r`n" StrReplace(pruefListe.Value, "`n", "`r`n")
    Toast(TX["pruefKopiert"], false)
}
