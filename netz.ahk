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

SitzungDatei() {
    return A_ScriptDir "\sitzung-" WELT ".txt"
}
CacheDatei() {
    return A_ScriptDir "\bausteine-" WELT ".txt"
}
EinstellungenDatei() {
    return A_ScriptDir "\einstellungen-" WELT ".txt"
}

; ---- Ein Aufruf an die Datenablage -------------------------------------
; Liefert Map mit ok, status, text.
Ruf(pfad, methode, koerper, mitAnmeldung, kopfPrefer) {
    aus := Map("ok", false, "status", 0, "text", "")
    try {
        http := ComObject("WinHttp.WinHttpRequest.5.1")
        http.Open(methode, ADRESSE pfad, false)
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

FrischHalten() {
    global sitzung
    if !Angemeldet()
        return false
    if (sitzung["ablauf"] - ZeitJetztMs() > 120000)
        return true
    koerper := "{" JsonZeichenkette("refresh_token") ":" JsonZeichenkette(sitzung["refresh"]) "}"
    a := Ruf("/auth/v1/token?grant_type=refresh_token", "POST", koerper, false, "")
    if !a["ok"] {
        if (a["status"] = 400 or a["status"] = 401) {
            sitzung := Map()
            SitzungSichern()
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

Abmelden() {
    global sitzung, bausteine, karte
    sitzung := Map()
    SitzungSichern()
    try FileDelete(CacheDatei())
    try FileDelete(EinstellungenDatei())
    bausteine := []
    karte := Map()
}

; ---- Holen: Bausteine und Einstellungen --------------------------------
Holen(leise) {
    global standSatz
    if !FrischHalten() {
        if !leise
            Toast(TX["fehlerAbgemeldet"], true)
        return false
    }
    pfad := "/rest/v1/bausteine?select=id,titel,kuerzel,kategorie,text,text_rtf,ausgabeart"
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
