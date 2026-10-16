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
global wahlModus := ""
global wahlZiel := 0
global wahlCtrl := ""
global faecherKasten := ""
global faecherBeschriftungen := Map()

; ---- Kleine Meldung unten (nimmt nie den Fokus) ------------------------
; 18.16: wahlweise laengere Anzeige (dauer in Millisekunden); die
; Hoehe richtet sich nach dem Text, der Unterrand bleibt wo er war.
Toast(text, warn, dauer := 4000) {
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
    g.Show("NoActivate Hide w550")
    hoehe := 40
    try g.GetPos(, , , &hoehe)
    g.Show("NoActivate w550 x" ((breite - 550) // 2) " y" (A_ScreenHeight - 70 - hoehe))
    toastFenster := g
    SetTimer(ToastWeg, -dauer)
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
    ; Die E-Mail ist vorbelegt (letzte Sitzung oder gemerkte Anmeldung),
    ; und der @-Knopf fuegt das Zeichen ein — fuer Tastaturen, auf denen
    ; das @ gerade nicht erreichbar ist (Befund Spitalrechner 21.9.).
    gemerkt := AnmeldedatenLaden()
    vorbelegt := sitzung.Has("mail") ? sitzung["mail"] : ""
    if (vorbelegt = "" and gemerkt is Map)
        vorbelegt := gemerkt["mail"]
    fMail := g.Add("Edit", "w318", vorbelegt)
    atKnopf := g.Add("Button", "x+8 yp w34 h27", "@")
    atKnopf.OnEvent("Click", AtEinfuegen)
    g.Add("Text", "xm y+6", TX["passwort"])
    fPass := g.Add("Edit", "w360 Password", (gemerkt is Map) ? gemerkt["passwort"] : "")
    merk := g.Add("Checkbox", "y+8 w360 Checked", TX["anmeldungMerken"])
    status := g.Add("Text", "y+8 w360 cRed", "")
    knopf := g.Add("Button", "y+8 w360 h34 Default", TX["anmelden"])
    knopf.OnEvent("Click", Los)
    g.OnEvent("Escape", (*) => g.Destroy())
    g.OnEvent("Close", (*) => g.Destroy())
    g.Show()
    fMail.Focus()
    ; Haengt das @ ANS ENDE an — Windows markiert beim Fokussieren den
    ; ganzen Feldinhalt, ein blosses Tippen ersetzte ihn (Befund 21.9.).
    AtEinfuegen(*) {
        fMail.Value := fMail.Value "@"
        fMail.Focus()
        stelle := StrLen(fMail.Value)
        SendMessage(0xB1, stelle, stelle, fMail)
    }
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
        if merk.Value
            AnmeldedatenSichern(fMail.Value, fPass.Value)
        else
            AnmeldedatenLoeschen()
        AbmeldeMarkeWeg()
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
    global wahlFenster, wahlListe, wahlSuche, wahlHinweis, wahlTippLaenge, wahlZiel, wahlModus
    wahlTippLaenge := tippLaenge
    wahlZiel := ziel
    wahlCtrl := ""
    if (ziel != 0)
        try wahlCtrl := ControlGetFocus(ziel)
    wahlModus := modus
    if (wahlFenster = "") {
        g := Gui("+AlwaysOnTop -Caption +ToolWindow +Border +E0x08000000")
        g.SetFont("s10", "Segoe UI")
        wahlSuche := g.Add("Edit", "x10 y10 w520")
        wahlSuche.OnEvent("Change", (*) => WahlFuellen(""))
        wahlListe := g.Add("ListBox", "x10 y+8 w520 r14")
        wahlListe.OnEvent("DoubleClick", (*) => WahlNehmen())
        wahlListe.OnEvent("Change", (*) => WahlKlick())
        wahlHinweis := g.Add("Text", "x10 y+6 w520 c5a7075", TX["wahlHinweis"])
        wahlFenster := g
    }
    wahlSuche.Enabled := (modus != "faecher" and modus != "faecherMerken")
    WahlFuellen(praefix)
    ; Position (Regel seit 11.1): Das Fenster erscheint bei der
    ; Schreibmarke, aber IMMER so, dass die Zeile, in der getippt wird,
    ; lesbar bleibt — also unterhalb der Marke, und nur wenn dort kein
    ; Platz ist, oberhalb. Kennt Windows die Marke nicht (z. B. in der
    ; Adresszeile von Edge und Chrome), erscheint es mit festem Abstand
    ; unterhalb des oberen Fensterrands, unter der Adresszeile.
    breite := 546
    hoehe := 360
    x := 0
    y := 0
    zeilenHoehe := 26
    CoordMode("Caret", "Screen")
    if CaretGetPos(&x, &y) {
        x := x + 8
        y := y + zeilenHoehe + 4
        if (y + hoehe > A_ScreenHeight - 10 and y - zeilenHoehe - hoehe - 12 > 0)
            y := y - zeilenHoehe - 4 - hoehe - 8
    }
    else if (ziel != 0) {
        fx := 0
        fy := 0
        try WinGetPos(&fx, &fy, , , "ahk_id " ziel)
        x := fx + 90
        y := fy + 150
    }
    else {
        MouseGetPos(&x, &y)
        x := x + 24
        y := y + zeilenHoehe
    }
    if (x + breite > A_ScreenWidth)
        x := A_ScreenWidth - breite - 10
    if (x < 0)
        x := 0
    if (y + hoehe > A_ScreenHeight)
        y := A_ScreenHeight - hoehe - 10
    if (y < 0)
        y := 0
    if (modus = "suche") {
        wahlFenster.Show("x" x " y" y " w" breite)
        wahlSuche.Focus()
    }
    else
        wahlFenster.Show("NoActivate x" x " y" y " w" breite)
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
    global wahlListe, wahlSuche, wahlTreffer, wahlModus, einstellungen
    faecherZeilen := []
    faecherTreffer := []
    if (wahlModus = "faecher" or wahlModus = "faecherMerken") {
        FaecherSammeln(&faecherTreffer, &faecherZeilen)
    }
    suchwort := StrLower(Trim(wahlSuche.Value))
    passend := []
    ; Der Bericht Memory Clinic steht als ganz normaler Eintrag in der
    ; Liste (Naed 28.9.), obwohl er kein Baustein ist - die Auswahl
    ; oeffnet sein Fenster (siehe WahlNehmen).
    bermcEintrag := Map("id", "funktion-bermc",
        "titel", TX["bermcListenTitel"], "kuerzel", "bermc",
        "kategorie", "Berichte", "text", "", "funktion", "bermc")
    alleKandidaten := [bermcEintrag]
    for b in bausteine
        alleKandidaten.Push(b)
    ; Status- und EEG-Fenster stehen als Eintraege mit in der Liste
    ; (17.2, Naed: "ich kann die Kuerzel nicht auswendig") - die
    ; Auswahl oeffnet das App-Fenster im Browser (siehe WahlNehmen).
    if (einstellungen.Has("statusTeilmengen")) {
        for tm in einstellungen["statusTeilmengen"] {
            if (tm is Map and tm.Has("kuerzel") and tm["kuerzel"] != "")
                alleKandidaten.Push(Map("id", "werk-status-" tm["kuerzel"],
                    "titel", TX["werkStatus"] " - " String(tm.Has("name") ? tm["name"] : ""),
                    "kuerzel", tm["kuerzel"], "kategorie", TX["werkKategorie"],
                    "text", "", "werk", "status"))
        }
    }
    if (einstellungen.Has("eegVorlagen")) {
        for vo in einstellungen["eegVorlagen"] {
            if (vo is Map and vo.Has("kuerzel") and vo["kuerzel"] != "")
                alleKandidaten.Push(Map("id", "werk-eeg-" vo["kuerzel"],
                    "titel", TX["werkEeg"] " - " String(vo.Has("name") ? vo["name"] : ""),
                    "kuerzel", vo["kuerzel"], "kategorie", TX["werkKategorie"],
                    "text", "", "werk", "eeg"))
        }
    }
    ; 18.20 (Naed 16.10., "ganz wichtig": jede Funktion ist ein Baustein
    ; und erscheint in der Liste) - ;;enmg als Eintrag; ein ECHTER
    ; Baustein mit diesem Kuerzel hat Vorrang.
    if !karte.Has("enmg")
        alleKandidaten.Push(Map("id", "werk-enmg", "titel", TX["werkEnmg"],
            "kuerzel", "enmg", "kategorie", TX["werkKategorie"],
            "text", "", "werk", "enmg"))
    for b in alleKandidaten {
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
    wahlTreffer := faecherTreffer
    zeilen := faecherZeilen
    if (haeufig.Length > 0) {
        wahlTreffer.Push("")
        zeilen.Push("--------  " TX["haeufigste"] "  --------")
    }
    for b in haeufig {
        wahlTreffer.Push(b)
        zeilen.Push(WahlZeile(b))
    }
    if (uebrige.Length > 0) {
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

; Die neun Faecher mit ihrem Inhalt - beim Tippen von ;;v oder ;;c.
; Sie stehen zuoberst; passende Bausteine folgen darunter.
FaecherSammeln(&treffer, &zeilen) {
    global wahlModus, faecher
    merken := (wahlModus = "faecherMerken")
    stamm := merken ? FachStamm("merken") : FachStamm("einsetzen")
    treffer.Push("")
    zeilen.Push("--------  " (merken ? TX["faecherMerkenKopf"] : TX["faecherKopf"]) "  --------")
    loop 9 {
        n := A_Index
        inhalt := faecher.Has(n) ? faecher[n]["wort"] : ""
        if (inhalt = "")
            inhalt := TX["leerFach"]
        treffer.Push(merken ? ("M" n) : ("F" n))
        zeilen.Push(";;" stamm n "   " inhalt)
    }
}

WahlZeile(b) {
    titel := String(b.Has("titel") ? b["titel"] : "")
    k := String(b.Has("kuerzel") ? b["kuerzel"] : "")
    if (k != "")
        return titel "  " ";;" k
    return titel
}

WahlFokusZurueck() {
    ; Schreibmarke exakt ins gemerkte Eingabefeld zurueck (5.10.,
    ; Einzeiler-Felder wie KISIM "Status" verlieren sie sonst).
    global wahlZiel, wahlCtrl
    if (wahlCtrl = "" or wahlZiel = 0)
        return
    try ControlFocus(wahlCtrl, wahlZiel)
    Sleep 50
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
    if (b is Map and b.Has("werk")) {
        WahlZu()
        if (wahlZiel != 0) {
            try WinActivate(wahlZiel)
        WahlFokusZurueck()
            Sleep 60
        }
        if (wahlTippLaenge > 0)
            Send "{Backspace " wahlTippLaenge "}"
        PufferLeeren()
        if (b["werk"] = "eeg")
            EegOeffnen(wahlZiel, b["kuerzel"])
        else if (b["werk"] = "enmg")
            FensterStart("enmg", "", wahlZiel)
        else
            StatusOeffnen(wahlZiel, b["kuerzel"])
        return
    }
    if (b is Map and b.Has("funktion")) {
        WahlZu()
        if (wahlZiel != 0) {
            try WinActivate(wahlZiel)
        WahlFokusZurueck()
            Sleep 60
        }
        if (wahlTippLaenge > 0)
            Send "{Backspace " wahlTippLaenge "}"
        PufferLeeren()
        BerichtMcOeffnen(wahlZiel)
        return
    }
    if (b is String and b != "") {
        WahlZu()
        nummer := Number(SubStr(b, 2))
        if (SubStr(b, 1, 1) = "F") {
            FachEinsetzen(nummer, wahlTippLaenge, wahlZiel)
        }
        else {
            if (wahlZiel != 0) {
                try WinActivate(wahlZiel)
        WahlFokusZurueck()
                Sleep 60
            }
            if (wahlTippLaenge > 0)
                Send "{Backspace " wahlTippLaenge "}"
            FachMerkenAusZwischenablage(nummer)
        }
        PufferLeeren()
        return
    }
    if !(b is Map)
        return
    WahlZu()
    if (wahlZiel != 0) {
        try WinActivate(wahlZiel)
        WahlFokusZurueck()
        Sleep 80
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

; ---- Zustand-Fenster (Diagnose: Kuerzel test oder Menue) ----------------
; Zeigt auf einen Blick, welches Glied der Kette steht: Fassung, Welt,
; Standort, Anmeldung, letzter Abgleich, Bausteinzahl und ob das eben
; aktive Fenster als Browser gilt. "Bericht kopieren" legt alles als
; Text in die Zwischenablage (mit Ursprung, Datum und Uhrzeit mit
; Sekunden), damit es sich unveraendert weiterschicken laesst.
ZustandFenster(ziel) {
    programm := ""
    if (ziel != 0) {
        try programm := WinGetProcessName("ahk_id " ziel)
    }
    istBrowser := false
    for p in BROWSER_PROZESSE {
        if (StrLower(p) = StrLower(programm))
            istBrowser := true
    }
    zeilen := TX["zustandFassung"] FASSUNG "`n"
    zeilen := zeilen TX["zustandWelt"] WELT "`n"
    zeilen := zeilen TX["zustandStandort"] (StandortName() != "" ? StandortName() : TX["zustandOhneStandort"]) "`n"
    zeilen := zeilen (Angemeldet() ? TX["zustandAngemeldet"] sitzung["mail"] : TX["zustandNichtAngemeldet"]) "`n"
    zeilen := zeilen TX["zustandBausteine"] bausteine.Length "`n"
    ; 17.7: juengste Aenderung im Bestand - zeigt sofort, ob eine neue
    ; Fassung (z. B. ;;ber vom Mac) schon angekommen ist.
    neuste := "", neusteK := ""
    for b in bausteine {
        z := (b is Map and b.Has("aktualisiert_am")) ? String(b["aktualisiert_am"]) : ""
        if (z != "" and StrCompare(z, neuste) > 0) {
            neuste := z
            neusteK := b.Has("kuerzel") ? String(b["kuerzel"]) : ""
        }
    }
    if (neuste != "")
        zeilen := zeilen TX["zustandNeuste"] SubStr(neuste, 9, 2) "." SubStr(neuste, 6, 2) "." SubStr(neuste, 1, 4) " " SubStr(neuste, 12, 5) " UTC (;;" neusteK ")`n"
    zeilen := zeilen TX["zustandGeholt"] (standSatz != "" ? standSatz : TX["zustandNieGeholt"]) "`n"
    if (programm != "")
        zeilen := zeilen TX["zustandFenster"] programm (istBrowser ? TX["zustandBrowserJa"] : TX["zustandBrowserNein"]) "`n"
    zeilen := zeilen (BrowserRegelAktiv() ? TX["zustandRegelAn"] : TX["zustandRegelAus"])
    zeilen := zeilen "`n" TX["zustandGesehen"] gesehen
    zeilen := zeilen "`n" TX["zustandWaechter"] horcherAufgesetzt " (prueft sich jede Minute selbst)"
    zeilen := zeilen "`n" TX["zustandTastenwege"]
    zeilen := zeilen "`n" TX["zustandUpdate"] UpdZustandText()
    zeilen := zeilen "`n" TX["zustandOrdner"] A_ScriptDir
    g := Gui("+AlwaysOnTop", TX["zustandTitel"])
    g.SetFont("s10", "Segoe UI")
    feld := g.Add("Edit", "w460 r12 ReadOnly")
    feld.Value := zeilen
    kn := g.Add("Button", "y+10 w220 h32", TX["berichtKopieren"])
    kn.OnEvent("Click", Kopieren)
    zu := g.Add("Button", "x+20 w220 h32 Default", TX["schliessen"])
    zu.OnEvent("Click", (*) => g.Destroy())
    g.OnEvent("Escape", (*) => g.Destroy())
    g.OnEvent("Close", (*) => g.Destroy())
    g.Show()
    Kopieren(*) {
        kopf := TX["zustandKopf"] " - " (StandortName() != "" ? StandortName() : TX["zustandOhneStandort"])
        kopf := kopf " - " FormatTime(A_Now, "dd.MM.yyyy HH:mm:ss")
        A_Clipboard := kopf "`r`n" StrReplace(zeilen, "`n", "`r`n")
        Toast(TX["berichtKopiert"], false)
    }
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

; Legt die aktuelle Zwischenablage in ein Fach (;;c1 bis ;;c9).
FachMerkenAusZwischenablage(n) {
    global faecher
    if (Trim(A_Clipboard) = "" and !DllCall("IsClipboardFormatAvailable", "UInt", 13)) {
        Toast(TX["fachNichtsKopiert"], true)
        return
    }
    inhalt := ClipboardAll()
    wort := SubStr(StrReplace(StrReplace(A_Clipboard, "`r", " "), "`n", " "), 1, 40)
    faecher[n] := Map("inhalt", inhalt, "wort", wort)
    if (faecherBeschriftungen.Has(n))
        try faecherBeschriftungen[n].Value := (wort != "" ? wort : "(ohne Text)")
    Toast(TX["fachGemerkt"] n, false)
}

; Dieselbe Sache ueber die Tastenkombination: hier wird zuerst selbst
; kopiert, damit keine Markierung verlorengeht.
FachMerkenTaste(n, *) {
    alte := ClipboardAll()
    A_Clipboard := ""
    Send "^c"
    if !ClipWait(0.6) {
        A_Clipboard := alte
        Toast(TX["fachNichtsMarkiert"], true)
        return
    }
    FachMerkenAusZwischenablage(n)
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
        Sleep 60
    }
    if (tippLaenge > 0)
        Send "{Backspace " tippLaenge "}"
    alte := ClipboardAll()
    A_Clipboard := faecher[n]["inhalt"]
    Sleep 80
    warten := EinfuegePause()
    Send "^v"
    Sleep (warten > 180 ? warten : 180)
    A_Clipboard := alte
    Toast(TX["fachEingesetzt"] n, false)
}

; ---- RTF-Fang (Etappe 6, nur Testwelt im Menue) ------------------------
; Sichert das RTF aus der Zwischenablage als Datei im Skript-Ordner -
; das Rohmaterial fuer die Tabellen-Etappe: In KISIM die Vorlage
; kopieren, dann diesen Menuepunkt druecken, Datei an Claude schicken.
RtfFangSichern() {
    rtf := LiesRtfAusZwischenablage()
    if (rtf = "") {
        Toast(TX["rtfFangLeer"], true)
        return
    }
    name := "RTF-Fang-" FormatTime(A_Now, "yyyy-MM-dd-HHmmss") ".rtf"
    pfad := A_ScriptDir "\\" name
    try FileDelete(pfad)
    FileAppend(rtf, pfad, "CP0")
    Toast(TX["rtfFangFertig"] name, false)
}
