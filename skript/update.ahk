; Datei: update.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (Ordner Bausteine-Skript)
; Zweck: Das Selbst-Update (18.16, Naeds Entscheid 14.10.). Das Skript
;        holt neue Fassungen selbst von GitHub (Ordner skript der App,
;        veroeffentlicht ueber GitHub Pages) - beim Start und ueber den
;        Menuepunkt "Jetzt aktualisieren". Ablauf: das Verzeichnis
;        fassung.txt lesen -> ist dort eine neuere Fassung, ALLE Dateien
;        in den Zwischenordner update-neu laden -> Groesse und
;        Pruefsumme jeder Datei pruefen -> die neue Fassung probehalber
;        laden lassen (/Validate) -> erst DANN die laufende Fassung nach
;        vorherige-fassung sichern, ersetzen und neu starten. Geht
;        unterwegs etwas schief, laeuft die alte Fassung unveraendert
;        weiter. "Zurueck zur letzten Fassung" tauscht die beiden.
;        Ausserdem (Selbstheilung): Laeuft beim Start noch ein Skript aus
;        einem ANDEREN Ordner (z. B. dem alten Spital_BausteineKuerzel),
;        wird es beendet - zwei Skripte wuerden jedes Kuerzel doppelt
;        einsetzen. AutoHotkey64.exe selbst wird nie ersetzt.
;        GRUNDSATZ: Hier wird nur Programmcode geholt - nie Bausteine,
;        nie Patientendaten. Es wird nichts hochgeladen.

global updZustand := ""          ; Inhalt der Menue-Zeile "Update-Pruefung: ..."
global updMenueText := ""        ; dort aktuell angezeigter Text
global updLaeuft := false
global updAltMeldung := ""       ; beendete alte Fassung (Meldung nach dem Start)

UpdOrdnerNeu() {
    return A_ScriptDir "\update-neu"
}
UpdOrdnerAlt() {
    return A_ScriptDir "\vorherige-fassung"
}
UpdOrdnerTausch() {
    return A_ScriptDir "\update-tausch"
}
UpdAuslassenDatei() {
    return A_ScriptDir "\update-auslassen.txt"
}
UpdSperreDatei() {
    return A_ScriptDir "\update-sperre.txt"
}
UpdErfolgDatei() {
    return A_ScriptDir "\update-erfolg.txt"
}

; ---- Kleine Helfer --------------------------------------------------------
; "18.16 - 14.10.2026" -> "18.16"; "18.16.1 - Probe" -> "18.16.1"
UpdNummer(text) {
    text := Trim(String(text), " `t`r`n" Chr(0xFEFF))
    if RegExMatch(text, "^(\d+(?:\.\d+)*)", &m)
        return m[1]
    return ""
}

; Vergleicht Fassungsnummern Teil fuer Teil als Zahlen: 18.10 ist neuer
; als 18.9, 18.16.1 neuer als 18.16. Ergebnis 1 / 0 / -1.
UpdVergleich(a, b) {
    ta := StrSplit(a, ".")
    tb := StrSplit(b, ".")
    loop Max(ta.Length, tb.Length) {
        x := (A_Index <= ta.Length and IsInteger(ta[A_Index])) ? Integer(ta[A_Index]) : 0
        y := (A_Index <= tb.Length and IsInteger(tb[A_Index])) ? Integer(tb[A_Index]) : 0
        if (x > y)
            return 1
        if (x < y)
            return -1
    }
    return 0
}

UpdKurz(text) {
    text := Trim(StrReplace(StrReplace(String(text), "`r", " "), "`n", " "))
    while InStr(text, "  ")
        text := StrReplace(text, "  ", " ")
    return (StrLen(text) > 220) ? SubStr(text, 1, 220) "..." : text
}

UpdCrc(buf, n) {
    if (n <= 0)
        return "00000000"
    return Format("{:08X}", DllCall("ntdll\RtlComputeCrc32", "UInt", 0, "Ptr", buf.Ptr, "UInt", n, "UInt"))
}

UpdDateiCrc(pfad) {
    try {
        b := FileRead(pfad, "RAW")
        return Map("n", b.Size, "crc", UpdCrc(b, b.Size))
    }
    return Map("n", -1, "crc", "")
}

UpdOrdnerLeeren(ordner) {
    if DirExist(ordner)
        DirDelete(ordner, true)
    DirCreate(ordner)
}

; Die Programmdateien eines Ordners (ohne AutoHotkey64.exe und ohne die
; Merkdateien des Updates).
UpdProgrammDateien(ordner) {
    liste := []
    loop files ordner "\*.ahk"
        liste.Push(A_LoopFileName)
    loop files ordner "\*.cmd"
        liste.Push(A_LoopFileName)
    if FileExist(ordner "\fassung.txt")
        liste.Push("fassung.txt")
    return liste
}

; Fassung, die in einem Ordner liegt (aus seiner konfiguration.ahk).
UpdFassungIn(ordner) {
    try {
        k := FileRead(ordner "\konfiguration.ahk", "UTF-8")
        if RegExMatch(k, 'FASSUNG := "([^"]*)"', &m)
            return UpdNummer(m[1])
    }
    return ""
}

UpdAuslassen() {
    try {
        if FileExist(UpdAuslassenDatei())
            return UpdNummer(FileRead(UpdAuslassenDatei(), "UTF-8"))
    }
    return ""
}

UpdTextSchreiben(pfad, text) {
    try FileDelete(pfad)
    FileAppend(text, pfad, "UTF-8-RAW")
}

; ---- Menue-Zeile und Zustand -----------------------------------------------
; Beim Aufbau des Menues einmal ohne Zeit gerufen: legt die Zeile an
; (an der Stelle, an der das Menue gerade aufgebaut wird).
UpdZustandSetzen(text, mitZeit := true) {
    global updZustand, updMenueText
    updZustand := mitZeit ? text " (" FormatTime(A_Now, "dd.MM. HH:mm") ")" : text
    ; Im Menue gekuerzt (die volle Meldung steht in "Zustand und Fassung");
    ; ein & wuerde im Menue zum Tastenkuerzel.
    kurz := (StrLen(updZustand) > 110) ? SubStr(updZustand, 1, 110) "..." : updZustand
    neu := TX["updZeile"] StrReplace(kurz, "&", "+")
    if (neu = updMenueText)
        return
    try {
        if (updMenueText != "")
            A_TrayMenu.Rename(updMenueText, neu)
        else
            A_TrayMenu.Add(neu, (*) => 0)
        A_TrayMenu.Disable(neu)
        updMenueText := neu
    }
}

UpdZustandText() {
    global updZustand
    return (updZustand != "") ? updZustand : TX["updNochNicht"]
}

; Beschriftung des Zurueck-Eintrags: nennt die Fassung, zu der es geht.
UpdZurueckBeschriftung() {
    alt := UpdFassungIn(UpdOrdnerAlt())
    if (alt = "" or !FileExist(UpdOrdnerAlt() "\Bausteine.ahk"))
        return TX["menueZurueckKeine"]
    return TX["menueZurueck"] " (" alt ")"
}

; Uebersetzt die haeufigsten Windows-Netzcodes in Alltagssprache; der
; Code selbst bleibt dabei (fuer die Fehlersuche).
UpdNetzGrund(meldung) {
    m := UpdKurz(meldung)
    codes := Map("80072EE7", TX["updNetzName"], "80072EFD", TX["updNetzVerbindung"]
        , "80072EE2", TX["updNetzZeit"], "80072F7D", TX["updNetzSicher"]
        , "80072F8F", TX["updNetzSicher"], "80072F0D", TX["updNetzSicher"]
        , "80072F06", TX["updNetzSicher"], "80072EFE", TX["updNetzVerbindung"])
    for code, text in codes {
        if InStr(m, code)
            return " - " text " - " m
    }
    return " - " m
}

; ---- Eine Datei von GitHub holen (binaer, ohne Zwischenspeicher) ----------
; Liefert Map(buf, n) oder "" (dann steht der Grund in fehler).
UpdHolen(datei, &fehler) {
    fehler := ""
    url := UPDATE_ADRESSE datei "?t=" A_Now A_TickCount
    status := 0
    try {
        http := ComObject("WinHttp.WinHttpRequest.5.1")
        http.Open("GET", url, false)
        http.SetTimeouts(5000, 5000, 8000, 20000)
        http.SetRequestHeader("Cache-Control", "no-cache")
        http.SetRequestHeader("Pragma", "no-cache")
        http.Send()
        status := http.Status
    } catch as e {
        fehler := TX["updKeinNetz"] UpdNetzGrund(e.Message)
        return ""
    }
    if (status != 200) {
        fehler := (status = 404) ? TX["updFehltAufGithub"] datei : TX["updCode"] status " (" datei ")"
        return ""
    }
    n := 0
    buf := Buffer(1, 0)
    try {
        body := http.ResponseBody
        n := body.MaxIndex() + 1
        if (n > 0) {
            buf := Buffer(n, 0)
            p := 0
            DllCall("oleaut32\SafeArrayAccessData", "Ptr", ComObjValue(body), "Ptr*", &p)
            DllCall("RtlMoveMemory", "Ptr", buf.Ptr, "Ptr", p, "Ptr", n)
            DllCall("oleaut32\SafeArrayUnaccessData", "Ptr", ComObjValue(body))
        }
    } catch as e {
        fehler := TX["updUnvollstaendig"] datei " (" UpdKurz(e.Message) ")"
        return ""
    }
    return Map("buf", buf, "n", n)
}

; ---- Das Verzeichnis fassung.txt lesen ------------------------------------
; Aufbau (eine Angabe je Zeile, # = Kommentar):
;   fassung=18.16
;   datei=Bausteine.ahk|7400|1A2B3C4D   (Name | Bytes | CRC32)
; Nur einfache Dateinamen mit .ahk oder .cmd sind erlaubt - nie Pfade.
UpdVerzeichnisLesen(text) {
    v := Map("fassung", "", "dateien", [])
    for zeile in StrSplit(text, "`n", "`r") {
        zeile := Trim(zeile, " `t" Chr(0xFEFF))
        if (zeile = "" or SubStr(zeile, 1, 1) = "#")
            continue
        p := InStr(zeile, "=")
        if !p
            continue
        k := StrLower(Trim(SubStr(zeile, 1, p - 1)))
        w := Trim(SubStr(zeile, p + 1))
        if (k = "fassung")
            v["fassung"] := w
        else if (k = "datei") {
            t := StrSplit(w, "|")
            if (t.Length != 3)
                return ""
            if !RegExMatch(t[1], "i)^[a-z0-9][a-z0-9._-]*\.(ahk|cmd)$")
                return ""
            if !(IsInteger(t[2]) and RegExMatch(t[3], "i)^[0-9a-f]{8}$"))
                return ""
            v["dateien"].Push(Map("name", t[1], "groesse", Integer(t[2]), "crc", StrUpper(t[3])))
        }
    }
    if (UpdNummer(v["fassung"]) = "" or v["dateien"].Length = 0)
        return ""
    for pflicht in ["Bausteine.ahk", "konfiguration.ahk", "update.ahk"] {
        da := false
        for d in v["dateien"] {
            if (StrLower(d["name"]) = StrLower(pflicht))
                da := true
        }
        if !da
            return ""
    }
    return v
}

; Stimmen die Dateien im Ordner schon mit dem Verzeichnis ueberein? (Spital:
; alle Rechner teilen den Ordner - ein anderer Rechner kann die neue
; Fassung schon eingespielt haben. Dann genuegt ein Neustart.)
UpdLokalSchon(v) {
    for d in v["dateien"] {
        c := UpdDateiCrc(A_ScriptDir "\" d["name"])
        if (c["n"] != d["groesse"] or c["crc"] != d["crc"])
            return false
    }
    return true
}

UpdGesperrt() {
    try {
        if FileExist(UpdSperreDatei()) {
            zeit := Trim(FileRead(UpdSperreDatei(), "UTF-8"))
            if (IsInteger(zeit) and StrLen(zeit) = 14 and DateDiff(A_Now, zeit, "Seconds") < 180)
                return true
        }
    }
    return false
}

; ---- Pruefen (Start und Menue) ----------------------------------------------
UpdPruefenStill() {
    UpdPruefen(false)
}

; 18.17 (Naeds Entscheid 15.10.): Zusaetzlich alle 2 Stunden still
; nachsehen. Eingespielt wird nur, wenn seit 10 Minuten weder Tastatur
; noch Maus benutzt wurden - sonst in 10 Minuten erneut versuchen.
; So kommt eine Abend-Lieferung auch ohne Neustart an.
UpdTakt() {
    if (A_TimeIdlePhysical < 600000) {
        SetTimer(UpdTakt, -600000)
        return
    }
    UpdPruefenStill()
}

UpdPruefenMenue(*) {
    UpdPruefen(true)
}

UpdPruefen(manuell) {
    global updLaeuft
    if updLaeuft
        return
    if (!manuell and BeschaeftigtJetzt()) {
        SetTimer(UpdPruefenStill, -30000)
        return
    }
    updLaeuft := true
    neustart := false
    try {
        neustart := UpdPruefenKern(manuell)
    } catch as e {
        UpdZustandSetzen(TX["updFehlerKurz"] UpdKurz(e.Message))
        if manuell
            Toast(Format(TX["updAbbruch"], UpdNummer(FASSUNG)) UpdKurz(e.Message), true, 10000)
    }
    updLaeuft := false
    if neustart {
        Sleep(600)
        Reload()
    }
}

; Liefert true, wenn danach neu gestartet werden soll.
UpdPruefenKern(manuell) {
    jetzt := UpdNummer(FASSUNG)
    UpdZustandSetzen(TX["updLaeuftText"])
    if manuell
        Toast(TX["updPrueft"], false)
    fehler := ""
    roh := UpdHolen("fassung.txt", &fehler)
    if (roh = "") {
        UpdZustandSetzen(TX["updFehlerKurz"] fehler)
        if manuell
            Toast(Format(TX["updAbbruch"], jetzt) fehler, true, 10000)
        return false
    }
    text := (roh["n"] > 0) ? StrGet(roh["buf"], roh["n"], "UTF-8") : ""
    v := UpdVerzeichnisLesen(text)
    if (v = "") {
        UpdZustandSetzen(TX["updFehlerKurz"] TX["updVerzeichnisKaputt"])
        if manuell
            Toast(Format(TX["updAbbruch"], jetzt) TX["updVerzeichnisKaputt"], true, 10000)
        return false
    }
    ; 18.27: Die Unterschrift (signatur.ahk). Ist der Schluessel
    ; eingerichtet, wird NICHTS eingespielt, dessen Unterschrift fehlt
    ; oder falsch ist - sichtbar gemeldet, nie still.
    sig := SigPruefeText(text)
    if (sig = "fehlt" or sig = "falsch") {
        UpdZustandSetzen(TX["updFehlerKurz"] TX["updSigAbgelehnt"])
        Toast(TX["updSigAbgelehnt"], true, 12000)
        return false
    }
    schutz := (sig = "kein-schluessel") ? TX["updSchutzFehlt"] : ""
    neu := UpdNummer(v["fassung"])
    if (UpdVergleich(neu, jetzt) <= 0) {
        UpdZustandSetzen(TX["updOk"] TX["updAufGithub"] neu schutz)
        if manuell
            Toast(TX["updAktuell"] jetzt, false)
        return false
    }
    if !manuell {
        ausl := UpdAuslassen()
        if (ausl != "" and UpdVergleich(neu, ausl) <= 0) {
            UpdZustandSetzen(TX["updOk"] TX["updAufGithub"] neu TX["updAusgelassen"] schutz)
            return false
        }
    }
    if UpdLokalSchon(v) {
        ; Die Dateien sind schon da (anderer Rechner) - nur neu starten.
        try FileDelete(UpdAuslassenDatei())
        UpdTextSchreiben(UpdErfolgDatei(), jetzt "|" neu "|vor")
        return true
    }
    if UpdGesperrt() {
        UpdZustandSetzen(TX["updFehlerKurz"] TX["updSperre"])
        if manuell
            Toast(Format(TX["updAbbruch"], jetzt) TX["updSperre"], true, 10000)
        return false
    }
    UpdTextSchreiben(UpdSperreDatei(), A_Now)
    ok := false
    try {
        ok := UpdEinspielen(v, roh, jetzt, neu, manuell)
    } catch as e {
        UpdZustandSetzen(TX["updFehlerKurz"] UpdKurz(e.Message))
        Toast(Format(TX["updAbbruch"], jetzt) UpdKurz(e.Message), true, 12000)
        ok := false
    }
    try FileDelete(UpdSperreDatei())
    return ok
}

; Laedt, prueft, sichert und ersetzt. true = erfolgreich ersetzt.
UpdEinspielen(v, roh, jetzt, neu, manuell) {
    Toast(Format(TX["updLaedt"], neu), false, 15000)
    ordner := UpdOrdnerNeu()
    UpdOrdnerLeeren(ordner)
    for d in v["dateien"] {
        fehler := ""
        r := UpdHolen(d["name"], &fehler)
        if (r = "")
            return UpdAbbrechen(fehler, jetzt, manuell)
        if (r["n"] != d["groesse"] or UpdCrc(r["buf"], r["n"]) != d["crc"])
            return UpdAbbrechen(TX["updUnvollstaendig"] d["name"] " (" r["n"] " statt " d["groesse"] " Bytes)", jetzt, manuell)
        f := FileOpen(ordner "\" d["name"], "w", "UTF-8-RAW")
        f.RawWrite(r["buf"], r["n"])
        f.Close()
        ; Nach dem Schreiben nochmals von der Platte nachmessen.
        c := UpdDateiCrc(ordner "\" d["name"])
        if (c["n"] != d["groesse"] or c["crc"] != d["crc"])
            return UpdAbbrechen(TX["updUnvollstaendig"] d["name"] " (Platte)", jetzt, manuell)
    }
    ; Das Verzeichnis selbst reist als Notiz mit (fassung.txt im Ordner).
    f := FileOpen(ordner "\fassung.txt", "w", "UTF-8-RAW")
    f.RawWrite(roh["buf"], roh["n"])
    f.Close()
    ; Passt die Fassung im Inhalt zum Verzeichnis?
    if (UpdFassungIn(ordner) != neu)
        return UpdAbbrechen(TX["updPasstNicht"], jetzt, manuell)
    ; Probe: Laedt die neue Fassung ueberhaupt? (startet sie NICHT)
    meldung := UpdProbeLaden(ordner)
    if (meldung != "") {
        try DirDelete(ordner, true)
        UpdZustandSetzen(TX["updFehlerKurz"] Format(TX["updDefektKurz"], neu))
        Toast(Format(TX["updDefekt"], neu, jetzt) meldung, true, 20000)
        return false
    }
    ; Sichern: die laufende Fassung nach vorherige-fassung
    alt := UpdOrdnerAlt()
    UpdOrdnerLeeren(alt)
    for datei in UpdProgrammDateien(A_ScriptDir)
        FileCopy(A_ScriptDir "\" datei, alt "\" datei, true)
    ; Ersetzen - bei einem Fehler die Sicherung zurueckspielen
    try {
        loop files ordner "\*.*"
            FileCopy(A_LoopFileFullPath, A_ScriptDir "\" A_LoopFileName, true)
    } catch as e {
        loop files alt "\*.*"
            try FileCopy(A_LoopFileFullPath, A_ScriptDir "\" A_LoopFileName, true)
        return UpdAbbrechen(TX["updErsetzenFehler"] UpdKurz(e.Message), jetzt, true)
    }
    try DirDelete(ordner, true)
    try FileDelete(UpdAuslassenDatei())
    UpdTextSchreiben(UpdErfolgDatei(), jetzt "|" neu "|vor")
    return true
}

UpdAbbrechen(grund, jetzt, laut) {
    try DirDelete(UpdOrdnerNeu(), true)
    UpdZustandSetzen(TX["updFehlerKurz"] grund)
    if laut
        Toast(Format(TX["updAbbruch"], jetzt) grund, true, 12000)
    return false
}

; Laesst AutoHotkey die neue Fassung nur PRUEFEN (/Validate): Tippfehler,
; fehlende Dateien, Namenskollisionen fallen hier auf, bevor etwas
; ersetzt wird. Leer = in Ordnung, sonst die Fehlermeldung.
UpdProbeLaden(ordner) {
    protokoll := A_Temp "\bausteine-update-probe.txt"
    try FileDelete(protokoll)
    befehl := A_ComSpec ' /c ""' A_AhkPath '" /ErrorStdOut=UTF-8 /Validate "' ordner '\Bausteine.ahk" > "' protokoll '" 2>&1"'
    rc := -1
    try rc := RunWait(befehl, A_Temp, "Hide")
    if (rc = 0)
        return ""
    text := ""
    try text := FileRead(protokoll, "UTF-8")
    return "Code " rc ": " UpdKurz(text)
}

; ---- Zurueck zur letzten Fassung (Menue) ------------------------------------
; Tauscht laufende und vorherige Fassung. Die Fassung, von der man
; zurueckgeht, holt der Start danach NICHT mehr von selbst (sonst waere
; man nach dem naechsten Start wieder dort); "Jetzt aktualisieren" holt
; sie jederzeit, und eine noch neuere Fassung kommt wieder von selbst.
UpdZurueckMenue(*) {
    alt := UpdOrdnerAlt()
    altNr := UpdFassungIn(alt)
    if (altNr = "" or !FileExist(alt "\Bausteine.ahk")) {
        MsgBox(TX["updKeineAlte"], TX["updTitel"], 262208)
        return
    }
    jetzt := UpdNummer(FASSUNG)
    if (MsgBox(Format(TX["updZurueckFrage"], altNr, jetzt), TX["updTitel"], 262209) != "OK")
        return
    try {
        tausch := UpdOrdnerTausch()
        UpdOrdnerLeeren(tausch)
        for datei in UpdProgrammDateien(A_ScriptDir)
            FileCopy(A_ScriptDir "\" datei, tausch "\" datei, true)
        loop files alt "\*.*"
            FileCopy(A_LoopFileFullPath, A_ScriptDir "\" A_LoopFileName, true)
        UpdOrdnerLeeren(alt)
        loop files tausch "\*.*"
            FileCopy(A_LoopFileFullPath, alt "\" A_LoopFileName, true)
        DirDelete(tausch, true)
    } catch as e {
        MsgBox(TX["updZurueckFehler"] UpdKurz(e.Message), TX["updTitel"], 262192)
        return
    }
    if (UpdVergleich(jetzt, altNr) > 0)
        UpdTextSchreiben(UpdAuslassenDatei(), jetzt)
    else
        try FileDelete(UpdAuslassenDatei())
    UpdTextSchreiben(UpdErfolgDatei(), jetzt "|" altNr "|zurueck")
    Reload()
}

; ---- Nach dem Neustart: melden, was passiert ist ----------------------------
UpdNachStartMelden() {
    global updAltMeldung
    text := ""
    if FileExist(UpdErfolgDatei()) {
        try {
            t := StrSplit(Trim(FileRead(UpdErfolgDatei(), "UTF-8")), "|")
            if (t.Length >= 3 and t[3] = "zurueck")
                text := Format(TX["updZurueckGemacht"], t[2], t[1])
            else if (t.Length >= 2)
                text := Format(TX["updEingespielt"], t[2], t[1])
            if (text != "")
                UpdZustandSetzen(TX["updOk"] TX["updJetzt"] UpdNummer(FASSUNG))
        }
        try FileDelete(UpdErfolgDatei())
    }
    if (updAltMeldung != "")
        text := (text != "") ? text "`n" updAltMeldung : updAltMeldung
    if (text != "")
        Toast(text, false, 12000)
}

; ---- Selbstheilung: Bausteine-Skripte aus ANDEREN Ordnern beenden -----------
AndereBausteineBeenden() {
    global updAltMeldung
    vorher := A_DetectHiddenWindows
    DetectHiddenWindows(true)
    meinPid := DllCall("GetCurrentProcessId", "UInt")
    ordner := []
    try {
        for hwnd in WinGetList("ahk_class AutoHotkey") {
            titel := "", pid := 0
            try titel := WinGetTitle("ahk_id " hwnd)
            try pid := WinGetPID("ahk_id " hwnd)
            if (pid = 0 or pid = meinPid)
                continue
            if !RegExMatch(titel, "i)^(.+)\\Bausteine\.ahk - AutoHotkey", &m)
                continue
            if (StrLower(m[1] "\Bausteine.ahk") = StrLower(A_ScriptFullPath))
                continue
            try PostMessage(0x0111, 65405, 0, , "ahk_id " hwnd)
            if ProcessWaitClose(pid, 3)
                try ProcessClose(pid)
            ordner.Push(m[1])
        }
    }
    DetectHiddenWindows(vorher)
    if (ordner.Length > 0)
        updAltMeldung := Format(TX["updAltBeendet"], ordner[1])
}
