; Datei: fenster-url.ahk
; Projekt: Textbausteine - Teil: AutoHotkey-Skript (Spital/KISIM)
; Zweck: Der URL-Fenster-Weg (Etappe 11 Nachbesserung). ;;eeg und die
;        Status-Kuerzel oeffnen die ECHTE App-Seite im Browser
;        (?fenster=eeg bzw. ?fenster=status&kuerzel=...). Das Skript
;        macht nur noch drei Handgriffe: Fenster oeffnen, nach dem
;        Knopf "An KISIM uebergeben" die Felder einsetzen und mit
;        Strg+Tab durch die KISIM-Felder springen (2-4-2, von Naed
;        bestaetigt). Die Uebergabe kommt als gekennzeichnetes Paket
;        ("TBFENSTER1:" + JSON mit Kenncode) ueber die Zwischenablage;
;        danach wird die Zwischenablage geleert (Patientenschutz).
;        Die App-Adresse steht nirgends im Code: die App traegt sie
;        selbst als Einstellung "appAdresse" ein, das Skript liest sie.

global fzZiel := ""
global fzArt := ""
global fzNonce := ""
global fzBis := 0
global fzCtrl := ""

; ---- Nachschlagen in den Einstellungen ----------------------------------

EegVorlageMitKuerzel(kuerzel) {
    global einstellungen
    if (!einstellungen.Has("eegVorlagen"))
        return ""
    for v in einstellungen["eegVorlagen"] {
        if (v is Map and v.Has("kuerzel") and v["kuerzel"] = kuerzel)
            return v
    }
    return ""
}

StatusTeilmengeMitKuerzel(kuerzel) {
    global einstellungen
    if (!einstellungen.Has("statusTeilmengen"))
        return ""
    for t in einstellungen["statusTeilmengen"] {
        if (t is Map and t.Has("kuerzel") and t["kuerzel"] = kuerzel)
            return t
    }
    return ""
}

AppAdresse() {
    global einstellungen
    if (einstellungen.Has("appAdresse") and einstellungen["appAdresse"] != "")
        return einstellungen["appAdresse"]
    return ""
}

; ---- Oeffnen -------------------------------------------------------------

EegOeffnen(ziel, kuerzel) {
    ; 17.5: Jede EEG-Vorlage faehrt den Fenster-Weg; das Kuerzel
    ; reist mit, die App startet mit der passenden Vorlage.
    FensterStart("eeg", kuerzel, ziel)
}

StatusOeffnen(ziel, kuerzel) {
    FensterStart("status", kuerzel, ziel)
}

; 18.2: Fenster, die nichts zurueckgeben (Einwilligung drucken,
; MediService-Bestellung) - nur oeffnen, kein Warten auf ein Paket.
FensterNurOeffnen(artName) {
    adresse := AppAdresse()
    if (adresse = "") {
        Toast(TX["fensterKeineAdresse"], true)
        return
    }
    BrowserOeffne(adresse "?fenster=" artName)
}

FensterStart(art, kuerzel, ziel) {
    global fzZiel, fzArt, fzNonce, fzBis
    adresse := AppAdresse()
    if (adresse = "") {
        Toast(TX["fensterKeineAdresse"], true)
        return
    }
    fzZiel := ziel
    fzArt := art
    ; Das exakte Eingabefeld merken: kleine Einzeiler-Felder (z. B.
    ; KISIM "Status") verlieren beim Browser-Ausflug die Schreibmarke;
    ; vor dem Einfuegen holen wir sie exakt dorthin zurueck (5.10.).
    fzCtrl := ""
    try fzCtrl := ControlGetFocus(ziel)
    fzNonce := String(Random(100000, 999999))
    fzBis := A_TickCount + 15 * 60 * 1000
    url := adresse "?fenster=" art
    if (kuerzel != "")
        url .= "&kuerzel=" kuerzel
    url .= "&nonce=" fzNonce
    BrowserOeffne(url)
    SetTimer FensterPolle, 150
}

BrowserOeffne(url) {
    ; Bevorzugt ein randloses App-Fenster (Chrome, sonst Edge) in
    ; grosszuegiger Groesse, mittig - zur Not der Standardbrowser.
    breite := Min(1360, A_ScreenWidth - 80)
    hoehe := Min(1000, A_ScreenHeight - 80)
    x := Max(0, (A_ScreenWidth - breite) // 2)
    y := Max(0, (A_ScreenHeight - hoehe) // 2 - 10)
    lage := ' --window-size=' breite ',' hoehe ' --window-position=' x ',' y
    try {
        Run('chrome.exe --app="' url '"' lage)
        return
    }
    try {
        Run('msedge.exe --app="' url '"' lage)
        return
    }
    try Run(url)
}

; ---- Warten auf die Uebergabe -------------------------------------------

FensterPolle() {
    global fzNonce, fzBis
    static drin := false
    if (drin)
        return
    drin := true
    try {
        if (A_TickCount > fzBis) {
            SetTimer FensterPolle, 0
            Toast(TX["fensterAbgelaufen"], false)
            drin := false
            return
        }
        inhalt := ""
        try inhalt := A_Clipboard
        if (SubStr(inhalt, 1, 11) = "TBFENSTER1:") {
            w := ""
            try w := JsonLies(SubStr(inhalt, 12))
            if (w is Map and w.Has("nonce")
                and String(w["nonce"]) = fzNonce and w.Has("felder")) {
                SetTimer FensterPolle, 0
                FensterSchliesse()
                FensterVerarbeite(w)
            }
        }
    }
    drin := false
}

FensterSchliesse() {
    global fzNonce
    try WinClose("Textbausteine-Fenster " fzNonce)
}

FensterVerarbeite(w) {
    global fzZiel, fzArt, fzCtrl
    felder := w["felder"]
    try WinActivate(fzZiel)
    Sleep 120
    if (fzCtrl != "") {
        try ControlFocus(fzCtrl, fzZiel)
        Sleep 60
    }
    artP := w.Has("art") ? String(w["art"]) : fzArt
    if (artP = "status" or artP = "baustein") {
        FensterFeld(felder, "block")
        fertig := TX["fensterFertigStatus"]
    } else if (artP = "diagnose") {
        ; KISIM-Diagnoseliste: Titel in die erste Zeile, Strg+Tab
        ; in die zweite, dann der Rest (Naed 10.10.).
        FensterFeld(felder, "titel")
        FensterSpringe(1)
        FensterFeld(felder, "rest")
        fertig := TX["fensterFertigStatus"]
    } else {
        FensterFeld(felder, "indikation")
        FensterSpringe(2)
        FensterFeld(felder, "anamnese")
        FensterSpringe(4)
        FensterFeld(felder, "befund")
        FensterSpringe(2)
        FensterFeld(felder, "beurteilung")
        fertig := TX["fensterFertigEeg"]
    }
    ; Patientenschutz: das Uebergabe-Paket nicht liegen lassen.
    A_Clipboard := ""
    Toast(fertig, false)
}

FensterFeld(felder, name) {
    global fzZiel
    if (!felder.Has(name) or !(felder[name] is Map))
        return
    f := felder[name]
    text := f.Has("text") ? f["text"] : ""
    rtf := f.Has("rtf") ? f["rtf"] : ""
    FuegeEin(text, rtf, fzZiel, 0)
    Sleep 70
}

FensterSpringe(n) {
    Loop n {
        SendEvent "^{Tab}"
        Sleep 60
    }
}
