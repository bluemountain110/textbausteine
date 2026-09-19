; Datei: kuerzel.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Das Herzstueck: liest die letzten Tastendruecke mit, erkennt
;        ;;kuerzel + Leertaste (NUR die Leertaste — Tab gehoert dem
;        Feldwechsel, Entscheid vom 18.9.), ;;? fuer die Suche, ;;neu
;        fuer den Entwurf, ;;z1 bis ;;z9 fuer die Faecher — und zeigt
;        ab dem ersten Buchstaben das Auswahl-Fenster neben der
;        Schreibmarke. Im Arbeitsspeicher liegt nur der Blick auf die
;        Zeichen vor der Schreibmarke; er verfaellt bei jedem Klick
;        und jeder Pfeiltaste. GRUNDSATZ: nichts wird gespeichert,
;        nichts protokolliert.

global puffer := ""
global horcher := ""

HorcherStart() {
    global horcher
    horcher := InputHook("V")
    horcher.KeyOpt("{Backspace}{Enter}{Tab}{Esc}{Left}{Right}{Up}{Down}{Home}{End}{PgUp}{PgDn}{Delete}", "N")
    horcher.OnChar := BeiZeichen
    horcher.OnKeyDown := BeiTaste
    horcher.Start()
}

PufferLeeren() {
    global puffer
    puffer := ""
    WahlZu()
}

BeiTaste(ih, vk, sc) {
    global puffer
    if (vk = 8) {
        if (StrLen(puffer) > 0)
            puffer := SubStr(puffer, 1, StrLen(puffer) - 1)
        VorschauNachziehen()
        return
    }
    PufferLeeren()
}

; Ein Mausklick macht den Puffer ungueltig — ausser der Klick trifft
; eines unserer eigenen Fenster.
~LButton:: {
    maus := 0
    MouseGetPos(, , &maus)
    if EigenesFenster(maus)
        return
    PufferLeeren()
}
~RButton:: {
    PufferLeeren()
}

EigenesFenster(hwnd) {
    global wahlFenster, faecherKasten, toastFenster
    if (wahlFenster != "" and hwnd = wahlFenster.Hwnd)
        return true
    if (faecherKasten != "" and hwnd = faecherKasten.Hwnd)
        return true
    if (toastFenster != "" and hwnd = toastFenster.Hwnd)
        return true
    return false
}

BeiZeichen(ih, zeichen) {
    global puffer
    if (Ord(zeichen) < 32) {
        return
    }
    if (zeichen = " ") {
        Ausloeser()
        return
    }
    if (zeichen = "?" and SubStr(puffer, -2) = ";;") {
        puffer := ""
        ziel := WinExist("A")
        ; ;;? bleibt stehen, bis ein Treffer eingefuegt wird (19.9.).
        WahlZeigen("suche", "", 3, ziel)
        return
    }
    puffer := puffer zeichen
    if (StrLen(puffer) > 100)
        puffer := SubStr(puffer, -100)
    VorschauNachziehen()
}

; Ab ;; und mindestens einem Zeichen erscheint das Auswahl-Fenster
; neben der Schreibmarke — es zeigt nur, es stiehlt keinen Fokus.
VorschauNachziehen() {
    global puffer
    if RegExMatch(puffer, ";;([^\s;?]{1,64})$", &t) {
        WahlZeigen("vorschau", t[1], StrLen(t[0]), WinExist("A"))
        return
    }
    WahlZu()
}

Ausloeser() {
    global puffer
    if !RegExMatch(puffer, ";;([^\s;?]{1,64})$", &t) {
        PufferLeeren()
        return
    }
    getippt := t[0]
    kuerzel := StrLower(t[1])
    laenge := StrLen(getippt) + 1
    ziel := WinExist("A")
    PufferLeeren()
    if (kuerzel = "neu") {
        Send "{Backspace " laenge "}"
        NeuStarten(0, ziel)
        return
    }
    if RegExMatch(kuerzel, "^z([1-9])$", &f) {
        FachEinsetzen(Number(f[1]), laenge, ziel)
        return
    }
    if !karte.Has(kuerzel) {
        if (bausteine.Length = 0)
            Toast(TX["keineBausteine"], true)
        else
            Toast(TX["unbekannt"] " " ";;" kuerzel, false)
        return
    }
    b := karte[kuerzel]
    BausteinStarten(b, ziel, laenge)
}

; ---- Vom erkannten Baustein zum eingefuegten Text -----------------------
; loeschen: Anzahl getippter Zeichen, die erst unmittelbar vor dem
; Einfuegen entfernt werden (0 = nichts loeschen).
BausteinStarten(b, ziel, loeschen) {
    art := String(b.Has("ausgabeart") ? b["ausgabeart"] : "fenster")
    luecken := LueckenFinden(b["text"])
    if (art != "marken" and luecken.Length > 0) {
        LueckenFenster(b, ziel, loeschen)
        return
    }
    BausteinEinsetzen(b, Map(), ziel, loeschen)
}

BausteinEinsetzen(b, antworten, ziel, loeschen) {
    modus := (String(b.Has("ausgabeart") ? b["ausgabeart"] : "") = "marken") ? "marken" : "fenster"
    textRoh := HtmlNachText(b["text"])
    text := TextAuswerten(textRoh, antworten, modus)
    cursorZurueck := 0
    p := InStr(text, CURSOR_ZEICHEN)
    if p {
        cursorZurueck := StrLen(text) - p - StrLen(CURSOR_ZEICHEN) + 1
        text := StrReplace(text, CURSOR_ZEICHEN, "")
    }
    rtf := String(b.Has("text_rtf") ? b["text_rtf"] : "")
    ; Erst jetzt: zurueck ins Zielfenster und das Kuerzel entfernen.
    if (ziel != 0) {
        try WinActivate(ziel)
        Sleep 150
    }
    if (loeschen > 0) {
        Send "{Backspace " loeschen "}"
        Sleep 60
    }
    PufferLeeren()
    if (rtf = "") {
        Toast(TX["rtfFehlt"], true)
        FuegeEin(text, "", 0, cursorZurueck)
    }
    else {
        rtfFertig := RtfAuswerten(rtf, antworten, modus)
        FuegeEin(text, rtfFertig, 0, cursorZurueck)
    }
    Zaehle(String(b["id"]))
    titel := String(b.Has("titel") ? b["titel"] : "")
    Toast(TX["eingefuegt"] (titel != "" ? titel : ";;" b["kuerzel"]), false)
}

; ---- ;;neu: die aktuelle Zwischenablage als Entwurf ---------------------
; Bedienung: Text markieren, Strg+C, dann irgendwo ;;neu und Leertaste —
; oder der Knopf im Zwischenspeicher-Fenster.
NeuStarten(unbenutzt, ziel) {
    text := A_Clipboard
    rtf := LiesRtfAusZwischenablage()
    if (Trim(text) = "" and rtf = "") {
        Toast(TX["entwurfLeer"], true)
        return
    }
    EntwurfFenster(text, rtf)
}

; Esc schliesst das Auswahl-Fenster, wenn es offen ist — sonst laeuft
; Esc normal weiter ins Programm.
#HotIf WahlOffen()
Esc:: {
    PufferLeeren()
}
#HotIf
