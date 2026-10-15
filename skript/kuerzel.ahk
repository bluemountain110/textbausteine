; Datei: kuerzel.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Das Herzstueck: liest die letzten Tastendruecke mit, erkennt
;        ;;kuerzel + Leertaste (NUR die Leertaste — Tab gehoert dem
;        Feldwechsel, Entscheid vom 18.9.), ;;? fuer die Suche, ;;neu
;        fuer den Entwurf, ;;z1 bis ;;z9 fuer die Faecher — und zeigt
;        ab dem ersten Buchstaben das Auswahl-Fenster neben der
;        Schreibmarke. Im Arbeitsspeicher liegt nur der Blick auf die
;        Zeichen vor der Schreibmarke; er verfaellt bei jedem Klick
;        und jeder Pfeiltaste. Neu in Etappe 5: In der Praxis haelt
;        sich das Skript aus Browserfenstern heraus (standort.ahk) und
;        meldet dort, dass die Erweiterung zustaendig ist; das Kuerzel
;        test zeigt das Zustand-Fenster fuer die Diagnose. Neu in
;        Etappe 8: Masken-Bausteine bekommen ihr eigenes Fenster und
;        werden als Schrittliste eingesetzt (unten im Masken-Teil).
;        GRUNDSATZ: nichts wird gespeichert, nichts protokolliert.

global puffer := ""
global horcher := ""
global gesehen := 0     ; Diagnose 28.9.: vom Horcher gesehene Zeichen
global horcherAufgesetzt := ""

; Der Horcher-Waechter (29.9.): Am Spital-Rechner wurde die
; Tastenueberwachung im laufenden Betrieb still abgehaengt (Zaehler
; stand, Skript lebte weiter) - vermutlich durch andere Programme mit
; eigener Tastenueberwachung (Dragon, KISIM). Darum setzt das Skript
; seinen Horcher jede Minute frisch auf - aber nur, wenn gerade kein
; Kuerzel halb getippt ist und nichts eingesetzt wird.
HorcherNeuAufsetzen() {
    global horcher, puffer, amEinsetzen, horcherAufgesetzt
    if (puffer != "" or amEinsetzen)
        return
    try horcher.Stop()
    HorcherStart()
    horcherAufgesetzt := FormatTime(A_Now, "HH:mm:ss")
}

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
    global puffer, gesehen
    gesehen += 1
    if (Ord(zeichen) < 32) {
        return
    }
    if (zeichen = " ") {
        Ausloeser()
        return
    }
    if (zeichen = "?" and SubStr(puffer, -2) = ";;") {
        puffer := ""
        if ImBrowserGesperrt() {
            Toast(TX["browserHinweis"], false)
            return
        }
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
    if ImBrowserGesperrt() {
        WahlZu()
        return
    }
    if RegExMatch(puffer, ";;([^\s;?]{1,64})$", &t) {
        ; Beginnt das Getippte mit dem Faecher-Buchstaben, zeigt das
        ; Fenster die neun Faecher samt Inhalt statt der Bausteine.
        wort := StrLower(t[1])
        ; Die Faecher erscheinen NUR bei Stamm plus Ziffer (;;v1 bis
        ; ;;v9, ;;c1 bis ;;c9). In jedem anderen Fall - auch beim
        ; blossen ;;v - zeigt das Fenster die Bausteine (20.9.).
        if (FaecherGemeint(wort, "einsetzen")) {
            WahlZeigen("faecher", wort, StrLen(t[0]), WinExist("A"))
            return
        }
        if (FaecherGemeint(wort, "merken")) {
            WahlZeigen("faecherMerken", wort, StrLen(t[0]), WinExist("A"))
            return
        }
        WahlZeigen("vorschau", t[1], StrLen(t[0]), WinExist("A"))
        return
    }
    WahlZu()
}

; NUR Stamm plus Ziffer zeigt die Faecher (;;v1 bis ;;v9). Alles
; andere, auch das blosse ;;v, zeigt die Bausteine (Entscheid 20.9.).
FaecherGemeint(wort, welcher) {
    stamm := FachStamm(welcher)
    if RegExMatch(wort, "^(.+)([1-9])$", &f) and f[1] = stamm
        return true
    return false
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
    global amEinsetzen
    ; Ab hier arbeitet das Einsetzen: Der Nachschubtakt hält sich
    ; solange heraus, damit ein Netz-Ruf nicht mitten ins Tippen
    ; fällt (23.9.).
    amEinsetzen := true
    try
        KuerzelArbeit(t, getippt, kuerzel, laenge, ziel)
    finally
        amEinsetzen := false
    return
}

KuerzelArbeit(t, getippt, kuerzel, laenge, ziel) {
    ; Das Diagnose-Kuerzel: zeigt das Zustand-Fenster. Ein ECHTER
    ; Baustein mit dem Kuerzel test hat Vorrang (Vorrangregel 20.9.) -
    ; darum das Kuerzel test nicht an Bausteine vergeben; der sichere
    ; Weg ist immer das Menue des gruenen Symbols.
    if (kuerzel = "test" and !karte.Has("test")) {
        Toast(TX["erkanntTest"], false)
        Send "{Backspace " laenge "}"
        ZustandFenster(ziel)
        return
    }
    ; Der Bericht Memory Clinic (Sammelrunde 27.9.): ;;bermc oeffnet
    ; das Einsortier-Fenster direkt am Arbeitsplatz - ohne Browser.
    ; Ein ECHTER Baustein mit dem Kuerzel bermc hat Vorrang.
    if (kuerzel = "pruef" and !karte.Has("pruef")) {
        Send "{Backspace " laenge "}"
        PruefstandOeffnen()
        return
    }
    if (kuerzel = "bermc" and !karte.Has("bermc")) {
        Toast(TX["erkanntBermc"], false)
        Send "{Backspace " laenge "}"
        BerichtMcOeffnen(ziel)
        return
    }
    ; Das EEG-Werk (Etappe 10): Kuerzel einer EEG-Vorlage (eeg,
    ; eegips, eigene) oeffnet das App-Fenster im Browser
    ; (URL-Weg, Nachbesserung). Ein ECHTER Baustein mit dem Kuerzel hat Vorrang.
    if (!karte.Has(kuerzel) and EegVorlageMitKuerzel(kuerzel) != "") {
        Send "{Backspace " laenge "}"
        EegOeffnen(ziel, kuerzel)
        return
    }    ; Das Status-Fenster (Etappe 11): das Kuerzel eines Status aus der
    ; Status-Pflege (;;statuscts, ;;statusc7, ...) oeffnet das App-Fenster
    ; im Browser mit genau diesem Status (URL-Weg). Ein ECHTER Baustein hat Vorrang.
    if (!karte.Has(kuerzel) and StatusTeilmengeMitKuerzel(kuerzel) != "") {
        Send "{Backspace " laenge "}"
        StatusOeffnen(ziel, kuerzel)
        return
    }
    ; Die Standort-Weiche: In der Praxis gehoeren Browserfenster der
    ; Erweiterung. Das Skript loescht hier NICHTS und fuegt NICHTS ein -
    ; es sagt nur, wer zustaendig ist (nichts scheitert still).
    if ImBrowserGesperrt() {
        Toast(TX["browserHinweis"], false)
        return
    }
    if (kuerzel = "neu") {
        Send "{Backspace " laenge "}"
        NeuStarten(0, ziel)
        return
    }
    ; ;;c1 bis ;;c9 merkt die Zwischenablage, ;;v1 bis ;;v9 setzt sie ein
    ; (Buchstaben aus den App-Einstellungen, Feinschliff 20.9.).
    ; Ein ECHTER Baustein mit diesem Kuerzel hat immer Vorrang (20.9.).
    stammM := FachStamm("merken")
    stammE := FachStamm("einsetzen")
    if (!karte.Has(kuerzel) and RegExMatch(kuerzel, "^(.+)([1-9])$", &f)) {
        if (f[1] = stammM) {
            Send "{Backspace " laenge "}"
            FachMerkenAusZwischenablage(Number(f[2]))
            return
        }
        if (f[1] = stammE) {
            FachEinsetzen(Number(f[2]), laenge, ziel)
            return
        }
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
    ; 18.2 (Etappe 13): Reiche Kisunla-Fenster sind die App selbst
    ; (Grundsatz L19). ;;kisew, ;;kisbest und ;;anon (18.10, Bericht
    ; anonymisieren) oeffnen nur das Fenster;
    ; jede MASKE der Kategorie "Diagnosen" (z. B. ;;dxad) laeuft als
    ; App-Fenster und kommt als Titel + Strg+Tab + Rest zurueck.
    kjk := StrLower(String(b.Has("kuerzel") ? b["kuerzel"] : ""))
    ; 18.17: "Nur anzeigen" (Nachschlage-Bausteine wie ;;txirr, Naeds
    ; Dauerregel 13.10.): nichts einsetzen - die App-Seite zeigt den
    ; Text in einem Fenster, Kopieren gibt es dort auf Knopfdruck.
    if (String(b.Has("ausgabeart") ? b["ausgabeart"] : "") = "anzeigen") {
        if (loeschen > 0)
            Send "{Backspace " loeschen "}"
        FensterNurOeffnen("anzeigen", kjk)
        return
    }
    if (kjk = "kisew" or kjk = "kisbest" or kjk = "anon") {
        if (loeschen > 0)
            Send "{Backspace " loeschen "}"
        FensterNurOeffnen(kjk)
        return
    }
    if (b.Has("kategorie") and String(b["kategorie"]) = "Diagnosen"
        and MaskeIst(HtmlNachText(b["text"]))) {
        if (loeschen > 0)
            Send "{Backspace " loeschen "}"
        FensterStart("baustein", kjk, ziel)
        return
    }
    ; Etappe 8: Eine Maske (Ankreuz, Wenn, Aus Kategorie) geht ihren
    ; eigenen Weg - Fenster, Kette der Unterbausteine, Schrittliste.
    if MaskeIst(HtmlNachText(b["text"])) {
        MaskeStarten(b, ziel, loeschen)
        return
    }
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

; ---- Etappe 8: Masken-Bausteine -----------------------------------------
; Der Weg: erst ALLE Fenster (die Maske selbst, dann die gewaehlten
; Unterbausteine der Reihe nach), erst danach wird in EINEM Zug
; eingesetzt - als Schrittliste aus Einfuege-Stuecken und
; KISIM-Spruengen (Strg+Tab). RTF wird dabei nur geschnitten, nie
; zusammengesetzt (Weg A); jeder Unterbaustein behaelt sein eigenes,
; vollstaendiges RTF und wird als EIGENES Einfuegen gesetzt.

MaskeStarten(b, ziel, loeschen) {
    analyse := MaskeAnalysieren(b["text"])
    if (analyse["fehler"].Length > 0) {
        Toast(analyse["fehler"][1], true)
        return
    }
    ; WICHTIG (Lehre aus dem KISIM-Absturz): Die ganze Kette laeuft ueber
    ; Funktionen auf oberster Ebene mit einem Zustands-Map ("st") und
    ; .Bind() - KEINE verschachtelten Funktionen. Verschachtelte Rueckrufe
    ; kann AutoHotkey nach dem Schliessen eines Fensters zu frueh
    ; freigeben (Critical Error: Invalid memory read/write).
    st := Map("b", b, "ziel", ziel, "loeschen", loeschen,
        "tiefe", 1, "eltern", "", "eintrag", "")
    MaskenGuiZeigen(b, analyse, MaskeStufeGewaehlt.Bind(st),
        MaskeStufeAbbruch.Bind(st))
}

; Das Masken-Fenster einer Stufe wurde mit OK geschlossen: die
; gewaehlten Unterbausteine in Berichts-Reihenfolge aufreihen.
MaskeStufeGewaehlt(st, zustand, reihen) {
    st["zustand"] := zustand
    warteliste := []
    for r in reihen {
        for x in r["gewaehlt"]
            warteliste.Push(Map("nummer", r["nummer"], "b", x, "paket", ""))
    }
    st["warteliste"] := warteliste
    st["lauf"] := 0
    MaskeStufeWeiter(st)
}

; Den naechsten Unterbaustein dieser Stufe aufloesen - oder, wenn alle
; durch sind, die Schrittliste bauen und die Stufe abschliessen.
MaskeStufeWeiter(st) {
    st["lauf"] := st["lauf"] + 1
    if (st["lauf"] > st["warteliste"].Length) {
        MaskeStufeFertig(st,
            MaskeSchritteBauen(st["b"], st["zustand"], st["warteliste"]))
        return
    }
    e := st["warteliste"][st["lauf"]]
    x := e["b"]
    ; Das ALLERLETZTE Fenster der ganzen Kette darf "Einfuegen" heissen.
    letzter := (st["tiefe"] = 1) and (st["lauf"] = st["warteliste"].Length)
    knopf := letzter ? TX["lueckenEinfuegen"] : TX["maskeWeiter"]
    if (st["tiefe"] < 5 and MaskeIst(HtmlNachText(x["text"]))) {
        analyse := MaskeAnalysieren(x["text"])
        if (analyse["fehler"].Length = 0) {
            st2 := Map("b", x, "ziel", 0, "loeschen", 0,
                "tiefe", st["tiefe"] + 1, "eltern", st, "eintrag", e)
            MaskenGuiZeigen(x, analyse, MaskeStufeGewaehlt.Bind(st2),
                MaskeStufeAbbruch.Bind(st2),
                (letzter and analyse["kategorienAnzahl"] = 0) ? knopf : "")
            return
        }
    }
    luecken := LueckenFinden(x["text"])
    if (luecken.Length > 0)
        MaskenUnterLuecken(x, luecken, MaskeUnterAntwort.Bind(st, e),
            MaskeStufeAbbruch.Bind(st), knopf)
    else
        MaskeUnterAntwort(st, e, Map())
}

; Antworten eines normalen Unterbausteins sind da: sein Schritt-Paket
; bauen und in der Warteliste ablegen.
MaskeUnterAntwort(st, e, antworten) {
    e["paket"] := MaskeSchritteEinfach(e["b"], antworten)
    MaskeStufeWeiter(st)
}

; Eine Stufe ist fertig: entweder gehoert sie zu einer Eltern-Stufe
; (Unterbaustein, der selbst eine Maske war) - dann Paket abliefern
; und dort weitermachen - oder es war die oberste: einsetzen.
MaskeStufeFertig(st, paket) {
    if IsObject(st["eltern"]) {
        st["eintrag"]["paket"] := paket
        MaskeStufeWeiter(st["eltern"])
        return
    }
    MaskeAusfuehren(st["b"], paket, st["ziel"], st["loeschen"])
}

; Abbruch irgendwo in der Kette: nichts einsetzen, nichts aufraeumen.
MaskeStufeAbbruch(st, *) {
}

; Ein normaler Unterbaustein wird EIN Einfuege-Schritt - mit seinem
; eigenen, vollstaendigen RTF (Formatierung bleibt erhalten).
MaskeSchritteEinfach(x, antworten) {
    text := TextAuswerten(HtmlNachText(x["text"]), antworten, "fenster")
    text := StrReplace(text, CURSOR_ZEICHEN, "")
    rtf := String(x.Has("text_rtf") ? x["text_rtf"] : "")
    rtfFertig := (rtf != "") ? RtfAuswerten(rtf, antworten, "fenster") : ""
    schritte := [Map("art", "einfuegen", "text", text, "rtf", rtfFertig,
        "id", String(x["id"]))]
    return Map("schritte", schritte, "warnen", rtf = "", "id", String(x["id"]))
}

; Die Maske selbst wird an ihren Kategorie- und Sprung-Marken in
; Stuecke geschnitten (Text und RTF gleich); zwischen die Stuecke
; kommen die Schritte der gewaehlten Unterbausteine und die Spruenge.
MaskeSchritteBauen(b, zustand, warteliste) {
    text := MaskeTextAnwenden(HtmlNachText(b["text"]), zustand, [], true)
    text := TextAuswerten(text, zustand["antworten"], "fenster")
    text := StrReplace(text, CURSOR_ZEICHEN, "")
    tTeile := MaskeTextSegmentieren(text)
    rtf := String(b.Has("text_rtf") ? b["text_rtf"] : "")
    rtfTeile := []
    rtfOk := false
    if (rtf != "") {
        r1 := MaskeRtfAnwenden(rtf, zustand)
        if r1["ok"] {
            r2 := RtfAuswerten(r1["rtf"], zustand["antworten"], "fenster")
            seg := MaskeRtfSegmentieren(r2)
            if (seg["ok"] and seg["teile"].Length = tTeile.Length) {
                rtfOk := true
                rtfTeile := seg["teile"]
            }
        }
    }
    ; Um jeden Sprung herum fallen die Absatz-Enden weg - sonst begaenne
    ; jedes KISIM-Feld mit einer Leerzeile.
    Loop tTeile.Length {
        if (tTeile[A_Index]["art"] != "sprung")
            continue
        i := A_Index
        if (i > 1 and tTeile[i - 1]["art"] = "text") {
            ; 17.7: nur den Absatz-Schluss wegnehmen - gewollte Leerzeilen
            ; (;;ber: Schreibzeile unter dem letzten Abschnitt) bleiben.
            tTeile[i - 1]["text"] := RegExReplace(tTeile[i - 1]["text"], "(\r\n|\n|\r)$", "")
            if rtfOk
                rtfTeile[i - 1]["rtf"] := MaskeRtfRand(rtfTeile[i - 1]["rtf"], false)
        }
        if (i < tTeile.Length and tTeile[i + 1]["art"] = "text") {
            tTeile[i + 1]["text"] := RegExReplace(tTeile[i + 1]["text"], "^[\r\n]+", "")
            if rtfOk
                rtfTeile[i + 1]["rtf"] := MaskeRtfRand(rtfTeile[i + 1]["rtf"], true)
        }
    }
    schritte := []
    warnen := !rtfOk
    Loop tTeile.Length {
        t := tTeile[A_Index]
        if (t["art"] = "text") {
            if (Trim(t["text"], " `t`r`n") != "")
                schritte.Push(Map("art", "einfuegen", "text", t["text"],
                    "rtf", rtfOk ? rtfTeile[A_Index]["rtf"] : ""))
        }
        else if (t["art"] = "sprung")
            schritte.Push(Map("art", "sprung", "n", t["n"]))
        else {
            erster := true
            for e in warteliste {
                if (e["nummer"] != t["nummer"] or !IsObject(e["paket"]))
                    continue
                ; Mehrere Bausteine im selben Abschnitt: je ein Absatz dazwischen.
                if !erster
                    schritte.Push(Map("art", "absatz"))
                erster := false
                for s in e["paket"]["schritte"]
                    schritte.Push(s)
                if e["paket"]["warnen"]
                    warnen := true
            }
        }
    }
    return Map("schritte", schritte, "warnen", warnen, "id", String(b["id"]))
}

; 17.8 (Naed, Spital): KISIM wirft leere Zeilen ganz am Anfang eines
; eingefuegten Textes weg (;;ber: die zwei Schreibzeilen vor der
; Systemanamnese fehlten). Darum zaehlt das Skript sie, nimmt sie aus
; Text und RTF heraus und tippt sie vorher als Eingabetaste.
MaskeVorspann(text, rtf) {
    n := 0
    r := String(rtf)
    kp := InStr(r, MASKE_RTF_KOPF)
    if kp {
        kopfEnde := kp + StrLen(MASKE_RTF_KOPF) - 1
        koerper := SubStr(r, kopfEnde + 1)
        if RegExMatch(koerper, "^(?:\\par\b ?)+", &m) {
            StrReplace(m[0], "\par", "\par", , &n)
            r := SubStr(r, 1, kopfEnde) SubStr(koerper, m.Len + 1)
        }
    }
    t := String(text)
    if (n > 0)
        t := RegExReplace(t, "^(?:\r\n|\n|\r){1," n "}", "")
    return Map("n", n, "text", t, "rtf", r)
}

; Schneidet leere Absaetze am Anfang (vorne = wahr) oder am Ende eines
; vollstaendigen RTF-Stuecks weg; Kopf und Schlussklammer bleiben.
MaskeRtfRand(rtf, vorne) {
    kp := InStr(rtf, MASKE_RTF_KOPF)
    if !kp
        return rtf
    kopfEnde := kp + StrLen(MASKE_RTF_KOPF) - 1
    kopf := SubStr(rtf, 1, kopfEnde)
    koerper := SubStr(rtf, kopfEnde + 1, StrLen(rtf) - kopfEnde - 1)
    if vorne
        koerper := RegExReplace(koerper, "^(?:\s*\\par\b ?)+", "")
    else
        koerper := RegExReplace(koerper, "(?:\\par\b ?\s*)$", "")
    return kopf koerper "}"
}

; Fuehrt die Schrittliste aus: zurueck ins Zielfenster, Kuerzel
; entfernen, dann Stueck fuer Stueck einfuegen und springen.
MaskeAusfuehren(b, paket, ziel, loeschen) {
    global amEinsetzen
    amEinsetzen := true
    try {
        if (ziel != 0) {
            try WinActivate(ziel)
            Sleep 100
        }
        if (loeschen > 0) {
            Send "{Backspace " loeschen "}"
            Sleep 50
        }
        PufferLeeren()
        for s in paket["schritte"] {
            if (s["art"] = "einfuegen") {
                v := MaskeVorspann(s["text"], s["rtf"])
                if (v["n"] > 0) {
                    Send "{Enter " v["n"] "}"
                    Sleep 60
                }
                FuegeEin(v["text"], v["rtf"], 0, 0)
                Sleep 90
                if s.Has("id")
                    Zaehle(s["id"])
            }
            else if (s["art"] = "absatz") {
                Send "{Enter}"
                Sleep 60
            }
            else if (s["art"] = "sprung") {
                Loop s["n"] {
                    Send "^{Tab}"
                    Sleep 80
                }
                Sleep 60
            }
        }
        Zaehle(paket["id"])
    }
    finally
        amEinsetzen := false
    titel := String(b.Has("titel") ? b["titel"] : "")
    if paket["warnen"]
        Toast(TX["maskeNurText"], true)
    else
        Toast(TX["eingefuegt"] (titel != "" ? titel : ";;" b["kuerzel"]), false)
}

; Esc schliesst das Auswahl-Fenster, wenn es offen ist — sonst laeuft
; Esc normal weiter ins Programm.
#HotIf WahlOffen()
Esc:: {
    PufferLeeren()
}
#HotIf
