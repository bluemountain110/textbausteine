; Datei: netz.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Das Gegenstueck zu wolke.js: die Verbindung zur Datenablage
;        ueber das eingebaute Windows-Netz (WinHTTP). Anmelden,
;        Sitzung frisch halten, jede Minute die fertigen Bausteine und
;        Einstellungen holen, Entwuerfe und Zaehlwerte schicken.
;        Im Ordner liegt nur die Sitzung (Zugangszeichen, NIE das
;        Passwort) und der zuletzt geholte Bausteinstand — beides sind
;        Bausteine und Schluessel, nie Patientendaten.

global sitzung := Map()
global bausteine := []
global karte := Map()
global einstellungen := Map()
global standSatz := ""
global letzterStand := ""   ; neuster Änderungszeitpunkt beim letzten Holen

SitzungDatei() {
    return DatenOrdner() "\sitzung-" WELT ".txt"
}
CacheDatei() {
    return DatenOrdner() "\bausteine-" WELT ".txt"
}
EinstellungenDatei() {
    return DatenOrdner() "\einstellungen-" WELT ".txt"
}

; ---- Ein Aufruf an die Datenablage -------------------------------------
; Liefert Map mit ok, status, text.
Ruf(pfad, methode, koerper, mitAnmeldung, kopfPrefer, wartezeit := 0) {
    aus := Map("ok", false, "status", 0, "text", "")
    try {
        http := ComObject("WinHttp.WinHttpRequest.5.1")
        http.Open(methode, ADRESSE pfad, false)
        ; Der Ruf hält das Skript so lange an — darum bekommt die
        ; kurze Vorab-Prüfung eine eigene, knappe Zeitgrenze (23.9.).
        if (wartezeit > 0)
            http.SetTimeouts(wartezeit, wartezeit, wartezeit, wartezeit)
        else
            http.SetTimeouts(8000, 8000, 8000, 15000)
        http.SetRequestHeader("apikey", SCHLUESSEL)
        http.SetRequestHeader("Content-Type", "application/json")
        if (mitAnmeldung and sitzung.Has("access"))
            http.SetRequestHeader("Authorization", "Bearer " sitzung["access"])
        if (kopfPrefer != "")
            http.SetRequestHeader("Prefer", kopfPrefer)
        if (koerper != "")
            http.Send(koerper)
        else
            http.Send()
        aus["status"] := http.Status
        aus["text"] := http.ResponseText
        aus["ok"] := (http.Status >= 200 and http.Status < 300)
    } catch {
        aus["status"] := 0
    }
    return aus
}

FehlerText(a) {
    if (a["status"] = 0)
        return TX["fehlerNetz"]
    if (a["status"] = 400)
        return TX["fehlerAnmeldung"]
    if (a["status"] = 401 or a["status"] = 403)
        return TX["fehlerAbgemeldet"]
    if (a["status"] >= 500)
        return TX["fehlerPause"]
    return TX["fehlerAllgemein"] " (" a["status"] ")"
}

; ---- Sitzung: laden, sichern, anmelden, frisch halten ------------------
SitzungLaden() {
    global sitzung
    if !FileExist(SitzungDatei())
        return
    try {
        roh := FileRead(SitzungDatei(), "UTF-8")
        w := JsonLies(roh)
        if (w is Map and w.Has("access"))
            sitzung := w
    }
}

SitzungSichern() {
    aus := "{" JsonZeichenkette("access") ":" JsonZeichenkette(sitzung.Has("access") ? sitzung["access"] : "")
    aus := aus "," JsonZeichenkette("refresh") ":" JsonZeichenkette(sitzung.Has("refresh") ? sitzung["refresh"] : "")
    aus := aus "," JsonZeichenkette("ablauf") ":" (sitzung.Has("ablauf") ? sitzung["ablauf"] : 0)
    aus := aus "," JsonZeichenkette("benutzer") ":" JsonZeichenkette(sitzung.Has("benutzer") ? sitzung["benutzer"] : "")
    aus := aus "," JsonZeichenkette("mail") ":" JsonZeichenkette(sitzung.Has("mail") ? sitzung["mail"] : "") "}"
    try FileDelete(SitzungDatei())
    FileAppend(aus, SitzungDatei(), "UTF-8")
}

Angemeldet() {
    return sitzung.Has("access") and sitzung["access"] != ""
}

Anmelden(mail, passwort) {
    global sitzung
    koerper := "{" JsonZeichenkette("email") ":" JsonZeichenkette(Trim(mail))
    koerper := koerper "," JsonZeichenkette("password") ":" JsonZeichenkette(passwort) "}"
    a := Ruf("/auth/v1/token?grant_type=password", "POST", koerper, false, "")
    if !a["ok"]
        return FehlerText(a)
    w := JsonLies(a["text"])
    sitzung := Map()
    sitzung["access"] := w["access_token"]
    sitzung["refresh"] := w["refresh_token"]
    sitzung["ablauf"] := ZeitJetztMs() + 3600000
    benutzer := ""
    mailWert := Trim(mail)
    if (w.Has("user") and w["user"] is Map) {
        benutzer := w["user"]["id"]
        if w["user"].Has("email")
            mailWert := w["user"]["email"]
    }
    sitzung["benutzer"] := benutzer
    sitzung["mail"] := mailWert
    SitzungSichern()
    return ""
}

; Liest die Sitzungsdatei frisch von der Platte, OHNE die laufende
; Sitzung anzufassen. Noetig seit 18.3: die Datei liegt im Netz-Home
; und wird von ALLEN Rechnern geteilt, auf denen das Skript laeuft.
; Erneuert ein anderer Rechner die Sitzung zuerst, steht hier der
; neuere Schluessel (Spiegel der App-Lehre L24).
SitzungAusDatei() {
    try {
        if FileExist(SitzungDatei()) {
            w := JsonLies(FileRead(SitzungDatei(), "UTF-8"))
            if (w is Map and w.Has("access") and w["access"] != "")
                return w
        }
    }
    return Map()
}

FrischHalten() {
    global sitzung
    if !Angemeldet()
        return AutoAnmeldenStill()
    if (sitzung["ablauf"] - ZeitJetztMs() > 120000)
        return true
    ; L24-Spiegel (18.3): VOR dem Erneuern frisch von der Platte
    ; lesen. Hat ein anderer Rechner die geteilte Sitzung inzwischen
    ; erneuert, wird sie uebernommen, statt mit dem verbrauchten
    ; Schluessel anzurufen (das gab 400 und warf das Skript heraus).
    frisch := SitzungAusDatei()
    if (frisch.Count and frisch.Has("refresh") and frisch["refresh"] != "" and sitzung.Has("refresh") and frisch["refresh"] != sitzung["refresh"]) {
        sitzung := frisch
        if (sitzung.Has("ablauf") and sitzung["ablauf"] - ZeitJetztMs() > 120000)
            return true
    }
    versucht := sitzung.Has("refresh") ? sitzung["refresh"] : ""
    koerper := "{" JsonZeichenkette("refresh_token") ":" JsonZeichenkette(versucht) "}"
    a := Ruf("/auth/v1/token?grant_type=refresh_token", "POST", koerper, false, "")
    if (!a["ok"] and (a["status"] = 400 or a["status"] = 401)) {
        ; Zweite Chance (L24): Vielleicht hat GENAU JETZT ein anderer
        ; Rechner erneuert. Datei nochmals lesen und, falls dort ein
        ; ANDERER Schluessel steht, einmal damit nachversuchen.
        frisch := SitzungAusDatei()
        if (frisch.Count and frisch.Has("refresh") and frisch["refresh"] != "" and frisch["refresh"] != versucht) {
            sitzung := frisch
            koerper := "{" JsonZeichenkette("refresh_token") ":" JsonZeichenkette(sitzung["refresh"]) "}"
            a := Ruf("/auth/v1/token?grant_type=refresh_token", "POST", koerper, false, "")
        }
    }
    if !a["ok"] {
        if (a["status"] = 400 or a["status"] = 401) {
            sitzung := Map()
            SitzungSichern()
            ; Seit 11.1: Mit gemerkter Anmeldung meldet sich das Skript
            ; still selbst neu an, statt auf das Anmeldefenster zu warten.
            return AutoAnmeldenStill()
        }
        return false
    }
    w := JsonLies(a["text"])
    sitzung["access"] := w["access_token"]
    if (w.Has("refresh_token") and w["refresh_token"] != "")
        sitzung["refresh"] := w["refresh_token"]
    sitzung["ablauf"] := ZeitJetztMs() + 3600000
    SitzungSichern()
    return true
}

; Abmelden beendet die Sitzung, VERGISST die gemerkte Anmeldung aber
; nicht (Wunsch 21.9.: nie mehr alles neu eintippen) — das Formular ist
; beim naechsten Mal vorbelegt, ein Klick genuegt. Die Abmelde-Marke
; verhindert, dass sich das Skript gegen Deinen Willen sofort selbst
; wieder anmeldet.
Abmelden() {
    global sitzung, bausteine, karte
    sitzung := Map()
    SitzungSichern()
    AbmeldeMarkeSetzen()
    try FileDelete(CacheDatei())
    try FileDelete(EinstellungenDatei())
    bausteine := []
    karte := Map()
}

; ---- Holen: Bausteine und Einstellungen --------------------------------
; Prüft in EINEM winzigen Ruf, ob sich seit dem letzten Holen etwas
; geändert hat: gefragt wird nur nach dem neusten Änderungszeitpunkt,
; nicht nach den Bausteinen selbst. Damit kann der Takt kurz sein,
; ohne dass das Skript zweimal je Minute die ganze Sammlung zieht
; (Näds Wunsch 23.9.: schneller Nachschub ohne Verzögerung beim
; Einsetzen). Eigene, kurze Zeitgrenze, damit ein zähes Netz das
; Skript nicht lange festhält — im Zweifel wird einfach geholt.
NeuesVorhanden() {
    global letzterStand
    pfad := "/rest/v1/bausteine?select=aktualisiert_am"
    pfad := pfad "&order=aktualisiert_am.desc&limit=1"
    a := Ruf(pfad, "GET", "", true, "", 3000)
    if !a["ok"]
        return true
    m := ""
    if RegExMatch(a["text"], '"aktualisiert_am"\s*:\s*"([^"]*)"', &tr)
        m := tr[1]
    if (m = "")
        return true
    if (m = letzterStand)
        return false
    letzterStand := m
    return true
}

Holen(leise) {
    global standSatz
    if !FrischHalten() {
        if !leise
            Toast(TX["fehlerAbgemeldet"], true)
        return false
    }
    pfad := "/rest/v1/bausteine?select=id,titel,kuerzel,kategorie,text,text_rtf,ausgabeart,varianten,aktualisiert_am"
    pfad := pfad "&geloescht_am=is.null&entwurf=eq.false&order=titel.asc"
    a := Ruf(pfad, "GET", "", true, "")
    if !a["ok"] {
        if !leise
            Toast(FehlerText(a), true)
        return false
    }
    try FileDelete(CacheDatei())
    FileAppend(a["text"], CacheDatei(), "UTF-8")
    BausteineUebernehmen(a["text"])
    e := Ruf("/rest/v1/einstellungen?select=schluessel,wert", "GET", "", true, "")
    if e["ok"] {
        try FileDelete(EinstellungenDatei())
        FileAppend(e["text"], EinstellungenDatei(), "UTF-8")
        EinstellungenUebernehmen(e["text"])
    }
    StatistikSchicken()
    standSatz := FormatTime(A_Now, "HH:mm:ss")
    return true
}

CacheLaden() {
    if FileExist(CacheDatei()) {
        try BausteineUebernehmen(FileRead(CacheDatei(), "UTF-8"))
    }
    if FileExist(EinstellungenDatei()) {
        try EinstellungenUebernehmen(FileRead(EinstellungenDatei(), "UTF-8"))
    }
}

BausteineUebernehmen(rohJson) {
    global bausteine, karte
    w := JsonLies(rohJson)
    if !(w is Array)
        return
    bausteine := w
    karte := Map()
    for b in bausteine {
        FassungAufloesen(b)
        k := StrLower(Trim(String(b.Has("kuerzel") ? b["kuerzel"] : "")))
        if (k != "")
            karte[k] := b
    }
}

EinstellungenUebernehmen(rohJson) {
    global einstellungen
    w := JsonLies(rohJson)
    if !(w is Array)
        return
    einstellungen := Map()
    for zeile in w {
        if (zeile is Map and zeile.Has("schluessel"))
            einstellungen[zeile["schluessel"]] := zeile["wert"]
    }
}

Konstanten() {
    if (einstellungen.Has("konstanten") and einstellungen["konstanten"] is Map)
        return einstellungen["konstanten"]
    return Map()
}

Datumsformat() {
    if (einstellungen.Has("datumsformat") and einstellungen["datumsformat"] != "")
        return String(einstellungen["datumsformat"])
    return "TT.MM.JJJJ"
}

; Die Buchstaben der Faecher-Kuerzel kommen aus den App-Einstellungen
; (Vorgabe c wie Kopieren und v wie Einfuegen) - Feinschliff 20.9.
FachStamm(welcher) {
    vorgabe := (welcher = "merken") ? "c" : "v"
    schluessel := (welcher = "merken") ? "fachStammMerken" : "fachStammEinsetzen"
    if (einstellungen.Has(schluessel) and einstellungen[schluessel] != "")
        return StrLower(String(einstellungen[schluessel]))
    return vorgabe
}

FachTasten() {
    if einstellungen.Has("fachTasten")
        return String(einstellungen["fachTasten"])
    ; Vorgabe seit 11.2: Strg+Umschalt — NICHT Strg+Alt, denn Strg+Alt
    ; ist auf Schweizer Tastaturen dasselbe wie AltGr und verschluckt
    ; sonst Zeichen wie @ (Befund Spitalrechner 21.9.).
    return "^+"
}

MarkenZeichen() {
    auf := "["
    zu := "]"
    if (einstellungen.Has("markeAuf") and einstellungen["markeAuf"] != "")
        auf := String(einstellungen["markeAuf"])
    if (einstellungen.Has("markeZu") and einstellungen["markeZu"] != "")
        zu := String(einstellungen["markeZu"])
    return Map("auf", auf, "zu", zu)
}

; ---- Entwurf hochladen (;;neu) — der EINZIGE Baustein-Schreibweg -------
; Es werden nur NEUE Entwuerfe angelegt, nie bestehende Zeilen geaendert.
EntwurfHochladen(textHtml) {
    if !FrischHalten()
        return TX["fehlerAbgemeldet"]
    jetzt := ZeitIso()
    koerper := "[{" JsonZeichenkette("id") ":" JsonZeichenkette(NeueKennung())
    koerper := koerper "," JsonZeichenkette("benutzer") ":" JsonZeichenkette(sitzung["benutzer"])
    koerper := koerper "," JsonZeichenkette("titel") ":" JsonZeichenkette("")
    koerper := koerper "," JsonZeichenkette("kuerzel") ":" JsonZeichenkette("")
    koerper := koerper "," JsonZeichenkette("kategorie") ":" JsonZeichenkette("")
    koerper := koerper "," JsonZeichenkette("text") ":" JsonZeichenkette(textHtml)
    koerper := koerper "," JsonZeichenkette("notiz") ":" JsonZeichenkette("")
    koerper := koerper "," JsonZeichenkette("art") ":" JsonZeichenkette("text")
    koerper := koerper "," JsonZeichenkette("entwurf") ":true"
    koerper := koerper "," JsonZeichenkette("ausgabeart") ":" JsonZeichenkette("fenster")
    koerper := koerper "," JsonZeichenkette("erstellt_am") ":" JsonZeichenkette(jetzt)
    koerper := koerper "," JsonZeichenkette("aktualisiert_am") ":" JsonZeichenkette(jetzt) "}]"
    a := Ruf("/rest/v1/bausteine?on_conflict=id", "POST", koerper, true, "resolution=merge-duplicates,return=minimal")
    if !a["ok"]
        return FehlerText(a)
    return ""
}

; ---- Kleine Zeit- und Kennungs-Helfer ----------------------------------
ZeitJetztMs() {
    return DateDiff(A_NowUTC, "19700101000000", "Seconds") * 1000
}

ZeitIso() {
    return FormatTime(A_NowUTC, "yyyy-MM-dd") "T" FormatTime(A_NowUTC, "HH:mm:ss") ".000Z"
}

NeueKennung() {
    hex := "0123456789abcdef"
    aus := ""
    loop 36 {
        i := A_Index
        if (i = 9 or i = 14 or i = 19 or i = 24)
            aus := aus "-"
        else if (i = 15)
            aus := aus "4"
        else if (i = 20)
            aus := aus SubStr("89ab", Random(1, 4), 1)
        else
            aus := aus SubStr(hex, Random(1, 16), 1)
    }
    return aus
}


; ---- Gemerkte Anmeldung (seit 11.1) --------------------------------------
; Mit dem Haekchen "Anmeldung merken" legt das Skript E-Mail und
; Passwort in einer Datei im Ordner ab — das Passwort dabei durch
; Windows verschluesselt (DPAPI): nur DIESES Windows-Benutzerkonto auf
; DIESEM Rechner kann es wieder lesen. Kopiert jemand die Datei auf
; einen anderen Rechner, ist sie wertlos. Damit kann sich das Skript
; nach Ablauf der Sitzung selbst neu anmelden.

AnmeldeDatei() {
    return DatenOrdner() "\anmeldung-" WELT ".txt"
}

AnmeldedatenSichern(mail, passwort) {
    geheim := SchuetzeText(Trim(mail) "`n" passwort)
    if (geheim = "")
        return
    try FileDelete(AnmeldeDatei())
    FileAppend(geheim, AnmeldeDatei(), "UTF-8")
}

AnmeldedatenLaden() {
    if !FileExist(AnmeldeDatei())
        return ""
    klar := ""
    try klar := EntschuetzeText(Trim(FileRead(AnmeldeDatei(), "UTF-8"), " `t`r`n"))
    if (klar = "" or !InStr(klar, "`n"))
        return ""
    teile := StrSplit(klar, "`n")
    daten := Map()
    daten["mail"] := Trim(teile[1], " `t`r")
    daten["passwort"] := teile[2]
    return daten
}

AnmeldedatenLoeschen() {
    try FileDelete(AnmeldeDatei())
}

; Still selbst anmelden — true, wenn es gelungen ist. Nach einem
; Abmelden von Hand bleibt es still, bis wieder von Hand angemeldet ist.
AutoAnmeldenStill() {
    if AbmeldeMarkeDa()
        return false
    daten := AnmeldedatenLaden()
    if !(daten is Map)
        return false
    return Anmelden(daten["mail"], daten["passwort"]) = ""
}

; ---- Abmelde-Marke -------------------------------------------------------
AbmeldeMarkeDatei() {
    return DatenOrdner() "\abgemeldet-" WELT ".txt"
}

AbmeldeMarkeSetzen() {
    try FileDelete(AbmeldeMarkeDatei())
    FileAppend("von Hand abgemeldet", AbmeldeMarkeDatei(), "UTF-8")
}

AbmeldeMarkeWeg() {
    try FileDelete(AbmeldeMarkeDatei())
}

AbmeldeMarkeDa() {
    return FileExist(AbmeldeMarkeDatei()) != ""
}

; ---- Windows-Verschluesselung (DPAPI) ------------------------------------
SchuetzeText(klar) {
    if (klar = "")
        return ""
    bytes := StrPut(klar, "UTF-16")
    puf := Buffer(bytes, 0)
    StrPut(klar, puf, "UTF-16")
    ein := Buffer(A_PtrSize * 2, 0)
    NumPut("uint", bytes, ein, 0)
    NumPut("ptr", puf.Ptr, ein, A_PtrSize)
    aus := Buffer(A_PtrSize * 2, 0)
    ok := DllCall("Crypt32\CryptProtectData", "ptr", ein, "ptr", 0, "ptr", 0, "ptr", 0, "ptr", 0, "uint", 0, "ptr", aus)
    if !ok
        return ""
    laenge := NumGet(aus, 0, "uint")
    zeiger := NumGet(aus, A_PtrSize, "ptr")
    b64 := BinNachB64(zeiger, laenge)
    DllCall("LocalFree", "ptr", zeiger)
    return b64
}

EntschuetzeText(b64) {
    if (b64 = "")
        return ""
    bin := B64NachBin(b64)
    if !IsObject(bin)
        return ""
    ein := Buffer(A_PtrSize * 2, 0)
    NumPut("uint", bin.Size, ein, 0)
    NumPut("ptr", bin.Ptr, ein, A_PtrSize)
    aus := Buffer(A_PtrSize * 2, 0)
    ok := DllCall("Crypt32\CryptUnprotectData", "ptr", ein, "ptr", 0, "ptr", 0, "ptr", 0, "ptr", 0, "uint", 0, "ptr", aus)
    if !ok
        return ""
    laenge := NumGet(aus, 0, "uint")
    zeiger := NumGet(aus, A_PtrSize, "ptr")
    klar := StrGet(zeiger, laenge // 2, "UTF-16")
    DllCall("LocalFree", "ptr", zeiger)
    return RTrim(klar, Chr(0))
}

BinNachB64(zeiger, groesse) {
    laenge := 0
    DllCall("Crypt32\CryptBinaryToStringW", "ptr", zeiger, "uint", groesse, "uint", 0x40000001, "ptr", 0, "uint*", &laenge)
    if (laenge = 0)
        return ""
    puf := Buffer(laenge * 2, 0)
    DllCall("Crypt32\CryptBinaryToStringW", "ptr", zeiger, "uint", groesse, "uint", 0x40000001, "ptr", puf, "uint*", &laenge)
    return StrGet(puf, "UTF-16")
}

B64NachBin(b64) {
    groesse := 0
    if !DllCall("Crypt32\CryptStringToBinaryW", "str", b64, "uint", 0, "uint", 1, "ptr", 0, "uint*", &groesse, "ptr", 0, "ptr", 0)
        return ""
    puf := Buffer(groesse, 0)
    if !DllCall("Crypt32\CryptStringToBinaryW", "str", b64, "uint", 0, "uint", 1, "ptr", puf, "uint*", &groesse, "ptr", 0, "ptr", 0)
        return ""
    return puf
}

; ---- Standort-Fassungen (Etappe 6) -------------------------------------
; Hat ein Baustein fuer den Standort dieses Rechners eine eigene Fassung
; (Feld varianten aus der App), ersetzen wir text und text_rtf GLEICH BEIM
; LADEN - ein einziger Ort, und alles danach (Kuerzel, Lueckenfenster,
; ;;?-Suche, Auswahlfenster) arbeitet automatisch mit der richtigen
; Fassung. Ohne eigene Fassung bleibt alles wie es ist. Nach einem
; Standortwechsel im Menue wird die Kopie neu gelesen (CacheLaden).
FassungAufloesen(b) {
    ort := StandortName()
    if (ort = "")
        return
    if !(b.Has("varianten") and b["varianten"] is Map)
        return
    v := b["varianten"]
    if !(v.Has(ort) and v[ort] is Map)
        return
    f := v[ort]
    t := String(f.Has("text") ? f["text"] : "")
    if (Trim(t) = "")
        return
    b["text"] := t
    b["text_rtf"] := String(f.Has("textRtf") ? f["textRtf"] : "")
}
