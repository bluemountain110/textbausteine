; Datei: fenster.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Alle Fenster des Skripts. Die Bedienregeln stammen aus der
;        bewiesenen Bruecke und aus Lehre E8: Fenster, die nur zeigen
;        und Knoepfe haben (Auswahl, Faecher, Meldung), nehmen den
;        Fokus NIE weg (NoActivate); Fenster, in die man tippt
;        (Anmeldung, Luecken, Entwurf, Suche), duerfen ihn nehmen und
;        geben ihn beim Einfuegen an das Zielfenster zurueck.
;        GRUNDSATZ: Eingaben aus den Luecken werden nirgends behalten.

global toastFenster := ""
global wahlFenster := ""
global wahlListe := ""
global wahlSuche := ""
global wahlHinweis := ""
global wahlTreffer := []
global wahlTippLaenge := 0
global wahlZiel := 0
global faecherKasten := ""
global faecherBeschriftungen := Map()

; ---- Kleine Meldung unten (nimmt nie den Fokus) ------------------------
Toast(text, warn) {
    global toastFenster
    if (toastFenster != "") {
        try toastFenster.Destroy()
        toastFenster := ""
    }
    g := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x08000000")
    g.BackColor := warn ? "b3261e" : "14595f"
    g.SetFont("s10 cWhite", "Segoe UI")
    g.Add("Text", "x14 y10 w520", text)
    breite := A_ScreenWidth
    g.Show("NoActivate w550 x" ((breite - 550) // 2) " y" (A_ScreenHeight - 110))
    toastFenster := g
    SetTimer(ToastWeg, -4000)
}

ToastWeg() {
    global toastFenster
    if (toastFenster != "") {
        try toastFenster.Destroy()
        toastFenster := ""
    }
}

; ---- Anmeldung ----------------------------------------------------------
AnmeldeFenster() {
    g := Gui("+AlwaysOnTop", TX["anmeldeTitel"])
    g.SetFont("s10", "Segoe UI")
    g.Add("Text", "w360", TX["anmeldeText"])
    g.Add("Text", "y+10", TX["mail"])
    fMail := g.Add("Edit", "w360", sitzung.Has("mail") ? sitzung["mail"] : "")
    g.Add("Text", "y+6", TX["passwort"])
    fPass := g.Add("Edit", "w360 Password")
    status := g.Add("Text", "y+8 w360 cRed", "")
    knopf := g.Add("Button", "y+8 w360 h34 Default", TX["anmelden"])
    knopf.OnEvent("Click", Los)
    g.OnEvent("Escape", (*) => g.Destroy())
    g.OnEvent("Close", (*) => g.Destroy())
    g.Show()
    fMail.Focus()
    Los(*) {
        if (Trim(fMail.Value) = "" or fPass.Value = "") {
            status.Value := TX["anmeldungFehlt"]
            return
        }
        status.Value := TX["anmeldenLaeuft"]
        fehler := Anmelden(fMail.Value, fPass.Value)
        if (fehler != "") {
            status.Value := fehler
            return
        }
        g.Destroy()
        Holen(false)
        Toast(TX["bereit"] bausteine.Length, false)
    }
}

; ---- Luecken-Fenster -----------------------------------------------------
; b: der Baustein. ziel: Fenster, in das eingefuegt wird.
; loeschen: so viele Zeichen (das getippte Kuerzel samt Leerschlag)
; werden ERST beim Einfuegen entfernt - bis dahin bleibt das Kuerzel
; sichtbar stehen, damit man weiss, wo man ist (Wunsch 19.9.).
LueckenFenster(b, ziel, loeschen) {
    luecken := LueckenFinden(b["text"])
    g := Gui("+AlwaysOnTop", TX["lueckenTitel"])
    g.SetFont("s10", "Segoe UI")
    titel := String(b.Has("titel") ? b["titel"] : "")
    g.Add("Text", "w420", titel != "" ? titel : ";;" b["kuerzel"])
    felder := []
    for l in luecken {
        g.Add("Text", "y+8", l["beschriftung"])
        if (l["art"] = "auswahl") {
            feld := g.Add("DropDownList", "w420 Choose1", l["optionen"])
        }
        else {
            feld := g.Add("Edit", "w420", l["vorgabe"])
        }
        felder.Push(Map("beschriftung", l["beschriftung"], "feld", feld))
        feld.OnEvent("Change", (*) => VorschauNeu())
    }
    g.Add("Text", "y+10", TX["vorschau"])
    vorschau := g.Add("Edit", "w420 r5 ReadOnly")
    zeile := g.Add("Button", "y+10 w200 h32", TX["abbrechen"])
    zeile.OnEvent("Click", (*) => Abbruch())
    ok := g.Add("Button", "x+20 w200 h32 Default", TX["lueckenEinfuegen"])
    ok.OnEvent("Click", (*) => Fertig())
    g.OnEvent("Escape", (*) => Abbruch())
    g.OnEvent("Close", (*) => Abbruch())
    Antworten() {
        a := Map()
        for e in felder {
            ; Ein Klappmenue liefert mit .Value die NUMMER der Wahl -
            ; gebraucht wird der Text (Befund 19.9.: "Seite 2" statt "rechts").
            if (e["feld"].Type = "DDL")
                a[e["beschriftung"]] := e["feld"].Text
            else
                a[e["beschriftung"]] := e["feld"].Value
        }
        return a
    }
    VorschauNeu() {
        t := TextAuswerten(HtmlNachText(b["text"]), Antworten(), "fenster")
        t := StrReplace(t, CURSOR_ZEICHEN, "")
        vorschau.Value := SubStr(t, 1, 600)
    }
    Fertig() {
        a := Antworten()
        g.Destroy()
        BausteinEinsetzen(b, a, ziel, loeschen)
    }
    Abbruch() {
        g.Destroy()
        if (ziel != 0)
            try WinActivate(ziel)
        Toast(TX["abgebrochen"], false)
    }
    VorschauNeu()
    g.Show()
    if (felder.Length > 0)
        felder[1]["feld"].Focus()
}

; ---- Auswahl-Fenster: Vorschau beim Tippen UND Suche (;;?) --------------
; modus "vorschau": erscheint neben der Schreibmarke, nimmt den Fokus
; nicht. modus "suche": erscheint mit Fokus im Suchfeld.
WahlZeigen(modus, praefix, tippLaenge, ziel) {
    global wahlFenster, wahlListe, wahlSuche, wahlHinweis, wahlTippLaenge, wahlZiel
    wahlTippLaenge := tippLaenge
    wahlZiel := ziel
    if (wahlFenster = "") {
        g := Gui("+AlwaysOnTop -Caption +ToolWindow +Border +E0x08000000")
        g.SetFont("s10", "Segoe UI")
        wahlSuche := g.Add("Edit", "x8 y8 w330")
        wahlSuche.OnEvent("Change", (*) => WahlFuellen(""))
        wahlListe := g.Add("ListBox", "x8 y+6 w330 r12")
        wahlListe.OnEvent("DoubleClick", (*) => WahlNehmen())
        wahlListe.OnEvent("Change", (*) => WahlKlick())
        wahlHinweis := g.Add("Text", "x8 y+4 w330 c5a7075", TX["wahlHinweis"])
        wahlFenster := g
    }
    WahlFuellen(praefix)
    x := 0
    y := 0
    CoordMode("Caret", "Screen")
    if CaretGetPos(&x, &y) {
        x := x + 24
        y := y + 24
    }
    else {
        MouseGetPos(&x, &y)
        x := x + 24
        y := y + 24
    }
    if (x + 360 > A_ScreenWidth)
        x := A_ScreenWidth - 360
    if (y + 320 > A_ScreenHeight)
        y := y - 360
    if (modus = "suche") {
        wahlFenster.Show("x" x " y" y " w346")
        wahlSuche.Focus()
    }
    else
        wahlFenster.Show("NoActivate x" x " y" y " w346")
}

WahlZu() {
    global wahlFenster
    if (wahlFenster != "")
        try wahlFenster.Hide()
}

WahlOffen() {
    global wahlFenster
    if (wahlFenster = "")
        return false
    try return WinExist("ahk_id " wahlFenster.Hwnd) and DllCall("IsWindowVisible", "Ptr", wahlFenster.Hwnd)
    return false
}

; praefix "" heisst: nur nach dem Suchfeld filtern.
WahlFuellen(praefix) {
    global wahlListe, wahlSuche, wahlTreffer
    suchwort := StrLower(Trim(wahlSuche.Value))
    passend := []
    for b in bausteine {
        kuerzel := StrLower(String(b.Has("kuerzel") ? b["kuerzel"] : ""))
        titel := String(b.Has("titel") ? b["titel"] : "")
        if (praefix != "") {
            trifftK := (kuerzel != "" and SubStr(kuerzel, 1, StrLen(praefix)) = StrLower(praefix))
            trifftT := (SubStr(StrLower(titel), 1, StrLen(praefix)) = StrLower(praefix))
            if (!trifftK and !trifftT)
                continue
        }
        if (suchwort != "") {
            heuhaufen := StrLower(titel " " kuerzel " " String(b.Has("kategorie") ? b["kategorie"] : "") " " HtmlNachText(b["text"]))
            if !InStr(heuhaufen, suchwort)
                continue
        }
        passend.Push(b)
    }
    haeufig := []
    uebrige := []
    for b in passend {
        if (StatistikAnzahl(b["id"]) > 0)
            haeufig.Push(b)
        else
            uebrige.Push(b)
    }
    SortiereNachAnzahl(haeufig)
    SortiereNachTitel(uebrige)
    while (haeufig.Length > 5) {
        uebrige.Push(haeufig.Pop())
        SortiereNachTitel(uebrige)
    }
    wahlTreffer := []
    zeilen := []
    for b in haeufig {
        wahlTreffer.Push(b)
        zeilen.Push(WahlZeile(b))
    }
    if (haeufig.Length > 0 and uebrige.Length > 0) {
        wahlTreffer.Push("")
        zeilen.Push("--------  " TX["alleWeiteren"] "  --------")
    }
    for b in uebrige {
        wahlTreffer.Push(b)
        zeilen.Push(WahlZeile(b))
    }
    wahlListe.Delete()
    if (zeilen.Length = 0)
        wahlListe.Add([TX["keineTreffer"]])
    else
        wahlListe.Add(zeilen)
}

WahlZeile(b) {
    titel := String(b.Has("titel") ? b["titel"] : "")
    k := String(b.Has("kuerzel") ? b["kuerzel"] : "")
    if (k != "")
        return titel "  " ";;" k
    return titel
}

WahlKlick() {
    ; Ein Einfachklick waehlt und fuegt gleich ein — der kuerzeste Weg.
    SetTimer(WahlNehmen, -1)
}

WahlNehmen() {
    global wahlTreffer, wahlTippLaenge, wahlZiel
    i := wahlListe.Value
    if (i < 1 or i > wahlTreffer.Length)
        return
    b := wahlTreffer[i]
    if !(b is Map)
        return
    WahlZu()
    if (wahlZiel != 0) {
        try WinActivate(wahlZiel)
        Sleep 150
    }
    PufferLeeren()
    BausteinStarten(b, wahlZiel, wahlTippLaenge)
}

SortiereNachTitel(liste) {
    n := liste.Length
    loop n {
        i := A_Index
        j := i
        while (j > 1) {
            a := StrLower(String(liste[j - 1].Has("titel") ? liste[j - 1]["titel"] : ""))
            b := StrLower(String(liste[j].Has("titel") ? liste[j]["titel"] : ""))
            if (StrCompare(a, b) <= 0)
                break
            t := liste[j - 1]
            liste[j - 1] := liste[j]
            liste[j] := t
            j := j - 1
        }
    }
}

SortiereNachAnzahl(liste) {
    n := liste.Length
    loop n {
        i := A_Index
        j := i
        while (j > 1) {
            if (StatistikAnzahl(liste[j - 1]["id"]) >= StatistikAnzahl(liste[j]["id"]))
                break
            t := liste[j - 1]
            liste[j - 1] := liste[j]
            liste[j] := t
            j := j - 1
        }
    }
}

; ---- Entwurf-Bestaetigung (;;neu) ---------------------------------------
EntwurfFenster(text, rtf) {
    g := Gui("+AlwaysOnTop", TX["entwurfTitel"])
    g.SetFont("s10", "Segoe UI")
    g.Add("Text", "w440 cRed", TX["entwurfText"])
    zeige := g.Add("Edit", "w440 r8 ReadOnly")
    zeige.Value := SubStr(text, 1, 800)
    ab := g.Add("Button", "y+10 w210 h32", TX["abbrechen"])
    ab.OnEvent("Click", (*) => g.Destroy())
    ok := g.Add("Button", "x+20 w210 h32 Default", TX["entwurfSichern"])
    ok.OnEvent("Click", Sichern)
    g.OnEvent("Escape", (*) => g.Destroy())
    g.Show()
    Sichern(*) {
        html := StrReplace(text, "&", "&amp;")
        html := StrReplace(html, "<", "&lt;")
        html := StrReplace(html, "`r`n", "`n")
        html := StrReplace(html, "`n", "<br>")
        if (rtf != "")
            html := "<!--TBRTFROH:" Base64(rtf) "-->" html
        fehler := EntwurfHochladen(html)
        g.Destroy()
        if (fehler != "")
            Toast(TX["entwurfFehler"] fehler, true)
        else
            Toast(TX["entwurfGesichert"], false)
    }
}

Base64(text) {
    laenge := StrLen(text)
    roh := Buffer(laenge, 0)
    StrPut(text, roh, laenge, "CP0")
    groesse := 0
    DllCall("Crypt32\CryptBinaryToStringW", "Ptr", roh, "UInt", laenge, "UInt", 0x40000001, "Ptr", 0, "UIntP", &groesse)
    aus := Buffer(groesse * 2, 0)
    DllCall("Crypt32\CryptBinaryToStringW", "Ptr", roh, "UInt", laenge, "UInt", 0x40000001, "Ptr", aus, "UIntP", &groesse)
    return StrGet(aus)
}

; ---- Zwischenspeicher-Fenster (neun Faecher) ----------------------------
global faecher := Map()

FaecherFenster() {
    global faecherKasten, faecherBeschriftungen
    if (faecherKasten != "") {
        try faecherKasten.Show("NoActivate")
        return
    }
    g := Gui("+AlwaysOnTop +ToolWindow +E0x08000000", TX["faecherTitel"])
    g.SetFont("s10", "Segoe UI")
    loop 9 {
        n := A_Index
        g.Add("Text", "x10 y" (12 + (n - 1) * 34) " w20", n)
        beschriftung := g.Add("Text", "x34 y" (12 + (n - 1) * 34) " w190", TX["leerFach"])
        faecherBeschriftungen[n] := beschriftung
        merk := g.Add("Button", "x230 y" (8 + (n - 1) * 34) " w80 h26", TX["merken"])
        merk.OnEvent("Click", FachMerken.Bind(n))
        setz := g.Add("Button", "x316 y" (8 + (n - 1) * 34) " w86 h26", TX["einsetzen"])
        setz.OnEvent("Click", FachKnopf.Bind(n))
    }
    g.Add("Button", "x10 y" (12 + 9 * 34) " w392 h30", TX["entwurfSichern"]).OnEvent("Click", (*) => NeuStarten(0, 0))
    g.Add("Text", "x10 y+6 w392 c5a7075", TX["faecherHinweis"])
    g.OnEvent("Close", (*) => g.Hide())
    g.Show("NoActivate w412")
    faecherKasten := g
}

FachMerken(n, *) {
    global faecher
    inhalt := ClipboardAll()
    wort := SubStr(StrReplace(A_Clipboard, "`n", " "), 1, 26)
    fach := Map("inhalt", inhalt, "wort", wort)
    faecher[n] := fach
    faecherBeschriftungen[n].Value := wort != "" ? wort : "(ohne Text)"
    Toast(TX["fachGemerkt"] n, false)
}

FachKnopf(n, *) {
    FachEinsetzen(n, 0, WinExist("A"))
}

FachEinsetzen(n, tippLaenge, ziel) {
    global faecher
    if !faecher.Has(n) {
        Toast(TX["fachLeer"], true)
        return
    }
    if (ziel != 0) {
        try WinActivate(ziel)
        Sleep 120
    }
    if (tippLaenge > 0)
        Send "{Backspace " tippLaenge "}"
    alte := ClipboardAll()
    A_Clipboard := faecher[n]["inhalt"]
    Sleep 150
    Send "^v"
    Sleep 350
    A_Clipboard := alte
    Toast(TX["fachEingesetzt"] n, false)
}
