; Datei: fenster-bericht-mc.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey v2)
; Zweck: Der Bericht Memory Clinic direkt in KISIM (Sammelrunde 27.9.):
;        ;;bermc oeffnet dieses Fenster. Naed fuegt den kopierten
;        neuropsychologischen Vorbericht ein, das Skript zerschneidet
;        ihn an den bekannten Zwischentiteln (Krankheitsanamnese wird
;        Persoenliche Anamnese), liest IQCODE, IADL (samt
;        Unterstuetzungsbedarf) und CDR heraus und baut daraus die
;        Inhalte fuer die KISIM-Felder Anamnese und Untersuchungen -
;        formatiert (Ueberschriften unterstrichen), eingefuegt an der
;        Schreibmarke des zuletzt aktiven KISIM-Fensters. Das Fenster
;        bleibt offen: erst ins Anamnese-Feld klicken und "Anamnese
;        hier einfuegen", dann ins Untersuchungen-Feld klicken und
;        den zweiten Knopf druecken.
;        GRUNDSATZ: nichts wird gespeichert, nichts verlaesst den
;        Rechner - der Text lebt nur in diesem Fenster.

global bermcFenster := ""
global bermcZiel := 0

BermcZuGemacht() {
    global bermcFenster
    bermcFenster := ""
}

BerichtMcOeffnen(ziel) {
    global bermcFenster, bermcZiel
    if (bermcFenster != "") {
        try bermcFenster.Destroy()
        bermcFenster := ""
    }
    bermcZiel := ziel
    g := Gui("+AlwaysOnTop +Resize", TX["bermcTitel"])
    g.SetFont("s10", "Segoe UI")
    g.Add("Text", "w640", TX["bermcHinweis"])
    quelle := g.Add("Edit", "w640 r12 Multi VScroll")
    g.Add("Text", "xm", TX["bermcAnrede"])
    anrede := g.Add("DropDownList", "x+8 yp-4 w220 Choose1",
        [TX["bermcAuto"], TX["bermcWeiblich"], TX["bermcMaennlich"]])
    g.Add("Text", "xm", TX["bermcErschienen"])
    erschienen := g.Add("DropDownList", "x+8 yp-4 w220 Choose1",
        [TX["bermcAuto"], TX["bermcBegleitung"], TX["bermcAllein"]])
    begleit := g.Add("Edit", "x+8 yp w220")
    begleit.Value := ""
    g.Add("Text", "xm", TX["bermcKompetenz"])
    kompetenz := g.Add("DropDownList", "x+8 yp-4 w360 Choose1",
        [TX["bermcKompetenz1"], TX["bermcKompetenz2"], TX["bermcKompetenz3"]])
    g.Add("Text", "xm", TX["bermcDatumFeld"])
    datumF := g.Add("Edit", "x+8 yp-4 w120")
    datumF.Value := FormatTime(A_Now, "dd.MM.yyyy")
    g.Add("Text", "xm w640", TX["bermcZusatzFeld"])
    zusatzQ := g.Add("Edit", "xm w640 r5 Multi VScroll")
    kZusatz := g.Add("Button", "xm w220", TX["bermcZusatzKnopf"])
    kLeeren := g.Add("Button", "x+16 w160", TX["bermcZusatzLeeren"])
    zusatzListe := g.Add("ListBox", "xm w640 r3")
    zusaetze := []
    kAnamnese := g.Add("Button", "xm w300", TX["bermcAnamneseKnopf"])
    kUntersuch := g.Add("Button", "x+16 w300", TX["bermcUntersuchKnopf"])
    kAlles := g.Add("Button", "xm w616", TX["bermcAllesKnopf"])
    hinweis := g.Add("Text", "xm w640", "")
    kZu := g.Add("Button", "xm w120", TX["bermcSchliessen"])

    einsetzen(welcher) {
        text := quelle.Value
        if (Trim(text) == "") {
            hinweis.Value := TX["bermcLeer"]
            return
        }
        z := BermcZerlege(text)
        wAnrede := (anrede.Value = 2) ? "w"
                 : (anrede.Value = 3) ? "m" : z["geschlecht"]
        wErsch := (erschienen.Value = 2) ? "begleitung"
                : (erschienen.Value = 3) ? "allein"
                : (z["begleitung"] != "" ? "begleitung" : "allein")
        wBegleit := Trim(begleit.Value) != "" ? Trim(begleit.Value)
                                              : z["begleitung"]
        if (welcher = "anamnese")
            paar := BermcBauAnamnese(z, wAnrede, wErsch, wBegleit,
                                     kompetenz.Value)
        else
            paar := BermcBauUntersuchungen(z, zusaetze)
        if (z["fehlend"] != "" and welcher = "anamnese")
            hinweis.Value := Format(TX["bermcFehlt"], z["fehlend"])
        else
            hinweis.Value := TX["bermcEingefuegt"]
        FuegeEin(paar[1], paar[2], bermcZiel, 0)
    }
    kAnamnese.OnEvent("Click", (*) => einsetzen("anamnese"))
    kUntersuch.OnEvent("Click", (*) => einsetzen("untersuchungen"))
    einlesen(*) {
        roh := zusatzQ.Value
        if (Trim(roh) == "") {
            hinweis.Value := TX["bermcLeer"]
            return
        }
        ; Seit 15.17 (1.10.): eine LISTE - auch ein ganzer KISIM-
        ; Untersuchungsblock mit mehreren Befunden auf einmal.
        liste := BermcParseZusatz(roh)
        if (liste.Length = 0) {
            hinweis.Value := TX["bermcZusatzUnbekannt"]
            return
        }
        for zu in liste {
            zusaetze.Push(zu)
            zusatzListe.Add([zu["name"] (zu.Has("datum") and zu["datum"] != "" ? " - " zu["datum"] : "")])
        }
        zusatzQ.Value := ""
        hinweis.Value := ""
    }
    kZusatz.OnEvent("Click", einlesen)
    leeren(*) {
        zusaetze.Length := 0
        zusatzListe.Delete()
    }
    kLeeren.OnEvent("Click", leeren)
    ; Naeds Feldfolge im KISIM-Bericht (29.9.): Dank am Cursor, dann
    ; 6x Strg+Tab -> Anamnese, +2 -> Status (bleibt leer), +5 ->
    ; Untersuchungen. Beurteilung und Prozedere folgen spaeter mit
    ; Naeds Vorlagen.
    springe(n) {
        WinActivate("ahk_id " bermcZiel)
        Sleep 150
        loop n {
            SendEvent "^{Tab}"
            Sleep 150
        }
        Sleep 300
    }
    alles(*) {
        text := quelle.Value
        z := BermcZerlege(text)
        wAnrede := (anrede.Value = 2) ? "w"
                 : (anrede.Value = 3) ? "m" : z["geschlecht"]
        wErsch := (erschienen.Value = 2) ? "begleitung"
                : (erschienen.Value = 3) ? "allein"
                : (z["begleitung"] != "" ? "begleitung" : "allein")
        wBegleit := Trim(begleit.Value) != "" ? Trim(begleit.Value)
                                              : z["begleitung"]
        d := Trim(datumF.Value) != "" ? Trim(datumF.Value)
            : FormatTime(A_Now, "dd.MM.yyyy")
        if (wAnrede = "m")
            dank := "Besten Dank für die Zuweisung des oben genannten Patienten, den ich am " d " in der Memory Sprechstunde untersucht habe."
        else
            dank := "Besten Dank für die Zuweisung der oben genannten Patientin, die ich am " d " in der Memory Sprechstunde untersucht habe."
        anam := BermcBauAnamnese(z, wAnrede, wErsch, wBegleit, kompetenz.Value)
        unt := BermcBauUntersuchungen(z, zusaetze)
        hinweis.Value := TX["bermcSpringe"]
        ; Der Dank-Satz ERSETZT den Inhalt des ersten Feldes (30.9.:
        ; sonst stand er doppelt) - erst alles markieren, dann einsetzen.
        WinActivate("ahk_id " bermcZiel)
        Sleep 150
        Send "^a"
        Sleep 120
        FuegeEin(dank, BermcRtfHuelle(BermcRtfText(dank) "\par "), bermcZiel, 0)
        springe(6)
        FuegeEin(anam[1], anam[2], bermcZiel, 0)
        springe(2)
        springe(5)
        FuegeEin(unt[1], unt[2], bermcZiel, 0)
        hinweis.Value := TX["bermcAllesFertig"]
    }
    kAlles.OnEvent("Click", alles)
    schliessen(*) {
        global bermcFenster
        try g.Destroy()
        bermcFenster := ""
    }
    kZu.OnEvent("Click", schliessen)
    g.OnEvent("Close", (*) => BermcZuGemacht())
    g.Show("w680")
    bermcFenster := g
}

; ---- Zerlegen an den bekannten Zwischentiteln (Spiegel der App) --------

; ---- Zusatzbefunde einlesen (Spiegel von parseZusatz der App) ----------
BermcOrtAus(t) {
    if RegExMatch(t, "Universitätsspital|USZ")
        return "Universitätsspital Zürich"
    if RegExMatch(t, "Limmattal|Schlieren|LA Radiologie|044 736")
        return "Spital Limmattal"
    return ""
}

BermcZielAus(name) {
    n := StrUpper(name)
    if RegExMatch(n, "PET.?MR")
        return ""
    ; Nur ein MR des KOPFES belegt die MRI-Zeile (1.10.: ein MR LWS
    ; haette sie sonst besetzt); andere MR bekommen eine eigene Zeile.
    if RegExMatch(n, "\bMR[IT]?\b|MAGNETRESONANZ") and RegExMatch(n, "SCH[ÄA]DEL|NEUROKRAN|HIRN|KOPF|HYPOPHYS|CEREBR|KRANI")
        return "mri"
    if InStr(n, "AMYLOID")
        return "amyloid"
    if InStr(n, "FDG")
        return "fdg"
    if RegExMatch(n, "\bEEG\b")
        return "eeg"
    if RegExMatch(n, "LUMBAL|LIQUOR")
        return "lp"
    return ""
}

; Alle Befunde eines eingefuegten Textes als Liste (Spiegel von
; parseZusatzAlle der App, 1.10.).
BermcParseZusatz(text) {
    t := StrReplace(StrReplace(text, "`r`n", "`n"), "`r", "`n")
    einzeln := BermcParseEinzeln(t)
    if IsObject(einzeln)
        return [einzeln]
    blockListe := BermcParseBlock(t)
    if (blockListe.Length > 0)
        return blockListe
    rest := BermcParseRest(t)
    return IsObject(rest) ? [rest] : []
}

BermcSignaturMuster() {
    return "i)^\s*(Dr\.?\s*med\b|Prof\.?\s|PD\s+Dr|Leitende[rn]?\s|Ober(arzt|ärztin)\b|Fach(arzt|ärztin)\b|Assistenz(arzt|ärztin)\b|Dieser Befund|Freundliche|Mit freundlichen|Visum\b|vis\s+\d)|elektronisch visiert"
}

; Befundtext (1.10., Naeds Entscheid): Unterschrift beendet den Text,
; Striche fallen weg und der Text laeuft zusammen, ECHTE Aufzaehlungs-
; punkte bleiben eine Aufzaehlung, Etiketten wie "Beurteilung" fallen weg.
BermcBefundText(zeilen) {
    marke := "^\s*[\x{2022}\x{25CF}\x{25AA}\x{25E6}\x{00B7}\x{2219}\x{2299}\x{F0B7}\x{F0A7}\x{2023}\x{2043}]\s*"
    strich := "^\s*[-\x{2013}\x{2014}]\s*"
    etikett := "i)^\s*((Befund\s*/\s*)?Beurteilung|Befund)\s*:?\s*$"
    start := 1
    for i, z in zeilen {
        if RegExMatch(z, "i)^\s*(Befund\s*/\s*)?Beurteilung\s*:?\s*$") {
            start := i + 1
            break
        }
    }
    fliess := ""
    punkte := []
    imPunkt := false
    i := start
    while (i <= zeilen.Length) {
        z := RTrim(zeilen[i], " `t`r")
        i += 1
        if RegExMatch(z, BermcSignaturMuster()) or RegExMatch(z, "^\s*_{4,}")
            break
        if RegExMatch(z, etikett)
            continue
        if (Trim(z) = "") {
            imPunkt := false
            continue
        }
        if RegExMatch(z, marke) {
            punkte.Push(Trim(RegExReplace(z, marke, "", , 1)))
            imPunkt := true
            continue
        }
        if RegExMatch(z, strich) {
            r := Trim(RegExReplace(z, strich, "", , 1))
            if (r != "")
                fliess .= (fliess = "" ? "" : " ") r
            imPunkt := false
            continue
        }
        if (imPunkt and punkte.Length > 0) {
            punkte[punkte.Length] := punkte[punkte.Length] " " Trim(z)
            continue
        }
        fliess .= (fliess = "" ? "" : " ") Trim(z)
    }
    fliess := Trim(RegExReplace(fliess, "\s{2,}", " "))
    return Map("text", fliess, "punkte", punkte)
}

; KISIM-Untersuchungsblock (1.10.): mehrere Befunde, je mit Kopfzeile
; "[Zusatzuntersuchung] Name [Neurologie] vom TT.MM.JJJJ".
BermcParseBlock(t) {
    eintraege := []
    akt := ""
    for zl in StrSplit(t, "`n") {
        if RegExMatch(zl, "^\s*(Zusatzuntersuchung\s+)?(.{2,80}?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})\s*$", &m) {
            akt := Map("name", Trim(m[2]), "datum", m[3], "zeilen", [])
            eintraege.Push(akt)
            continue
        }
        if IsObject(akt)
            akt["zeilen"].Push(zl)
    }
    aus := []
    if (eintraege.Length = 0)
        return aus
    hatSignatur := false
    for zl in StrSplit(t, "`n")
        if RegExMatch(zl, BermcSignaturMuster())
            hatSignatur := true
    ort := BermcOrtAus(t)
    if (ort = "" and !hatSignatur)
        ort := "Spital Limmattal"
    for e in eintraege {
        b := BermcBefundText(e["zeilen"])
        if (b["text"] = "" and b["punkte"].Length = 0)
            continue
        name := Trim(RegExReplace(e["name"], "i)\s+Neurologie$", ""))
        aus.Push(Map("ziel", BermcZielAus(name), "name", name, "datum", e["datum"],
            "ort", ort, "beurteilung", b["text"], "punkte", b["punkte"]))
    }
    return aus
}

; Sonderformate mit fester Gestalt: Viollier, Punktat, Radiology Report,
; PACS-Export "Study:".
BermcParseEinzeln(t) {
    ; Viollier-Demenzmarker (29.9.): Werte fuer die LP-Zeile.
    if RegExMatch(t, "i)Amyloid.?beta\s*1.42") {
        w := Map()
        if RegExMatch(t, "i)Amyloid.?beta\s*1.42\D{0,20}?([\d]+)", &m)
            w["ab42"] := m[1]
        if RegExMatch(t, "i)Amyloid.?beta\s*1.40\D{0,20}?([\d]+)", &m)
            w["ab40"] := m[1]
        if RegExMatch(t, "i)42/40\s*Quotient\D{0,20}?(0[.,][\d]+)", &m)
            w["quotient"] := StrReplace(m[1], ",", ".")
        if RegExMatch(t, "i)(?<!Phospho.)Tau.Protein\D{0,20}?([\d]+(?:[.,][\d]+)?)", &m)
            w["tau"] := StrReplace(m[1], ",", ".")
        if RegExMatch(t, "i)Phospho.Tau.Protein\D{0,20}?([\d]+(?:[.,][\d]+)?)", &m)
            w["ptau"] := StrReplace(m[1], ",", ".")
        datum := ""
        if RegExMatch(t, "i)Entnahmedatum([^`n]*)", &m) {
            zl := m[1]
            p2 := 1
            while (p2 := RegExMatch(zl, "(\d{2}\.\d{2}\.\d{4})", &dm, p2)) {
                datum := dm[1]
                p2 += 10
            }
        }
        if (w.Count = 0)
            return ""
        return Map("ziel", "lp", "name", "Lumbalpunktion mit Demenzmarkern",
            "datum", datum, "ort", "Viollier", "werte", w)
    }
    ; Hausinternes LP-Punktat (Klebetext): Zellzahl + Totalprotein.
    if RegExMatch(t, "i)PUNKTATE/LIQUOR|Zellzahl\s*\(WBC\)") {
        w := Map()
        if RegExMatch(t, "i)Zellzahl\s*\(WBC\)\s*<\s*5\s*([\d]+(?:[.,][\d]+)?)", &m)
            w["zellzahl"] := StrReplace(m[1], ",", ".")
        if RegExMatch(t, "i)Totalprotein\s*Liquor\s*150\s*-\s*450\s*([\d]+(?:[.,][\d]+)?)", &m)
            w["protein"] := StrReplace(m[1], ",", ".")
        if (w.Count = 0)
            return ""
        return Map("ziel", "lp", "name", "Lumbalpunktion mit Demenzmarkern",
            "ort", "Spital Limmattal", "werte", w)
    }
    if RegExMatch(t, "`n_{4,}[ \t]*`nUntersuchung[ \t]*:?[ \t]*`n") or RegExMatch(t, "m)^Study:")
        return BermcParseRest(t)
    return ""
}

; Allgemeiner Weg: "Beurteilung" suchen, Name und Datum aus dem Kopf.
BermcParseRest(t) {
    ; s) = der Punkt faengt auch Zeilenwechsel (mehrzeilige Beurteilung).
    if !RegExMatch(t, "s)`nBeurteilung[ \t]*:?[ \t]*`n(.*)$", &beu)
        return ""
    bt := BermcBefundText(StrSplit(beu[1], "`n"))
    inhalt := bt["text"]
    if (inhalt = "" and bt["punkte"].Length = 0)
        return ""
    name := ""
    datum := ""
    ; "Radiology Report" (30.9.): nur der Block "Untersuchung" nach einer
    ; ____-Linie nennt die Untersuchung (Klinische Befunde enthalten
    ; fremde Daten wie "CT Schaedel vom ...").
    if RegExMatch(t, "`n_{4,}[ \t]*`nUntersuchung[ \t]*:?[ \t]*`n\s*(.+?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})", &m) {
        name := Trim(m[1])
        datum := m[2]
    }
    else if RegExMatch(t, "Zusatzuntersuchung\s+(.+?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})", &m) {
        name := Trim(m[1])
        datum := m[2]
    }
    else if RegExMatch(t, "m)^Study:\s*`n?\s*(.+)$", &m) {
        name := Trim(m[1])
        if RegExMatch(t, "Content Date/Time:\s*(\d{4})-(\d{2})-(\d{2})", &c)
            datum := c[3] "." c[2] "." c[1]
    }
    else if RegExMatch(t, "m)^(.{3,60}?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})", &m) {
        name := Trim(m[1])
        datum := m[2]
    }
    if (name = "")
        return ""
    return Map("ziel", BermcZielAus(name), "name", name, "datum", datum,
        "ort", BermcOrtAus(t), "beurteilung", inhalt, "punkte", bt["punkte"])
}

BermcIstKopf(zeile) {
    z := Trim(zeile)
    z := RegExReplace(z, ":\s*$", "")
    z := StrLower(z)
    ; Score-Absaetze (IQCODE, IADL, BADL, CDR) schliessen den laufenden
    ; Abschnitt IMMER, auch als lange Zeile - sonst rutschten sie in die
    ; Fremdanamnese (Befund Spital 30.9.).
    for k in ["iqcode", "die iadl", "iadl-skala", "die badl", "badl", "kognitive und funktionelle leistung"]
        if (z != "" and InStr(z, k) = 1)
            return z
    if (z == "" or StrLen(z) > 100)
        return ""
    genau := ["konsultationsgrund", "anamnese", "aktuell", "sozialanamnese",
        "geburts- und entwicklungsanamnese", "familienanamnese",
        "krankheitsanamnese", "persönliche anamnese", "systemanamnese",
        "befunde und beobachtungen", "verhalten", "affekt", "beurteilung",
        "schlussatz", "schlusssatz"]
    for k in genau
        if (z == k)
            return z
    anfang := ["fremdanamnese", "ergänzende information", "iqcode",
        "die iadl", "iadl-skala", "die badl", "badl",
        "kognitive und funktionelle leistung", "schul-",
        "aktuelle medikation", "aktuelle medikamente",
        "testpsychologische", "empfehlungen"]
    for k in anfang
        if (InStr(z, k) = 1)
            return z
    return ""
}

BermcZielVon(kopf) {
    if (kopf == "aktuell")
        return "aktuell"
    if (InStr(kopf, "fremdanamnese") = 1)
        return "fremd"
    if (kopf == "sozialanamnese")
        return "sozial"
    if (InStr(kopf, "schul-") = 1)
        return "schule"
    if (kopf == "familienanamnese")
        return "familie"
    if (kopf == "krankheitsanamnese" or kopf == "persönliche anamnese")
        return "persoenlich"
    if (kopf == "systemanamnese")
        return "system"
    if (InStr(kopf, "aktuelle medik") = 1)
        return "medis"
    return ""
}

BermcZerlege(text) {
    text := StrReplace(text, "`r`n", "`n")
    text := StrReplace(text, "`r", "`n")
    abschnitte := Map("sozial", "", "schule", "", "familie", "",
                      "persoenlich", "", "system", "", "medis", "",
                      "aktuell", "", "fremd", "")
    offen := ""
    sammel := ""
    fremdKopf := ""
    schliesse() {
        if (offen != "" and abschnitte[offen] == "")
            abschnitte[offen] := Trim(sammel, " `n")
        offen := ""
        sammel := ""
    }
    for zeile in StrSplit(text, "`n") {
        kopf := BermcIstKopf(zeile)
        if (kopf != "") {
            schliesse()
            offen := BermcZielVon(kopf)
            if (offen = "fremd" and fremdKopf = "")
                fremdKopf := Trim(zeile)
            continue
        }
        if (offen != "")
            sammel .= (sammel == "" ? "" : "`n") zeile
    }
    schliesse()
    z := Map()
    z["abschnitte"] := abschnitte
    z["fremdKopf"] := fremdKopf
    ; Datum des neuropsychologischen Berichts (29.9.): nur im KOPF
    ; suchen (erste 8 Zeilen), damit alte Daten im Anamnesetext
    ; ("Untersuchung vom 05.05.2025") nicht greifen.
    ; Datum der Neuropsychologie (1.10.): nur ein plausibel junges Datum
    ; aus dem Kopf - ein Geburtsdatum kann es nie sein.
    z["neuroDatum"] := BermcNeuroDatum(text)
    z["iqcode"] := ""
    if RegExMatch(text, "i)IQCODE-?Score\s+beträgt\s+([\d]+[.,][\d]+)", &t)
        z["iqcode"] := StrReplace(t[1], ",", ".")
    else if RegExMatch(text, "i)IQCODE[^\d]{0,60}([\d]+[.,][\d]+)", &t)
        z["iqcode"] := StrReplace(t[1], ",", ".")
    z["iadl"] := ""
    if RegExMatch(text, "i)Scorewert\s+von\s+([\d]+\s*/\s*8)", &t)
        z["iadl"] := RegExReplace(t[1], "\s+", "")
    else if RegExMatch(text, "([\d])\s*/\s*8\b", &t)
        z["iadl"] := t[1] "/8"
    z["cdr"] := ""
    if RegExMatch(text, "i)CDR[^\d]{0,20}([0-3](?:[.,]5)?)", &t)
        z["cdr"] := StrReplace(t[1], ",", ".")
    z["unterstuetzung"] := ""
    if RegExMatch(text, "Unterstützungsbedarf:\s*(.*?)(?=\n\s*\n|$)", &t) {
        stuetz := RegExReplace(t[1], "\s+", " ")
        z["unterstuetzung"] := Trim(stuetz)
    }
    weiblich := 0, maennlich := 0
    p := 1
    while (p := RegExMatch(text, "Patientin", , p))
        weiblich += 1, p += 8
    p := 1
    while (p := RegExMatch(text, "\bPatient(?!in)", , p))
        maennlich += 1, p += 7
    z["geschlecht"] := (weiblich >= maennlich) ? "w" : "m"
    z["begleitung"] := ""
    if RegExMatch(text, "in Begleitung\s+([^.\n]{3,60})", &t)
        z["begleitung"] := Trim(t[1])
    fehlend := ""
    paare := [["sozial", "Sozialanamnese"],
              ["schule", "Schul-, Bildungs- und Berufsanamnese"],
              ["familie", "Familienanamnese"],
              ["persoenlich", "Persönliche Anamnese"],
              ["system", "Systemanamnese"],
              ["medis", "Aktuelle Medikamente/Therapien"]]
    for paar in paare
        if (abschnitte[paar[1]] == "")
            fehlend .= (fehlend == "" ? "" : ", ") paar[2]
    z["fehlend"] := fehlend
    return z
}

; ---- Aus den Teilen Text und RTF fuer die KISIM-Felder bauen -----------
BermcBauAnamnese(z, geschlecht, erschienen, begleitText, kompetenz) {
    pat := (geschlecht = "m") ? "Der Patient" : "Die Patientin"
    if (erschienen = "allein")
        satz1 := pat " erschien pünktlich und alleine zur Sprechstunde."
    else
        satz1 := pat " erschien pünktlich und in Begleitung "
               . (begleitText != "" ? begleitText : "xx")
               . " zur Sprechstunde."
    if (kompetenz = 3)
        satz2 := "Die Anamnesekompetenz ist leider nicht gegeben, sodass die Anamnese überwiegend mit den Angehörigen durchgeführt wurde."
    else if (kompetenz = 2)
        satz2 := "Die Anamnesekompetenz ist nur partiell gegeben, sodass relevante Aspekte mit den Angehörigen erfolgt sind."
    else
        satz2 := "Die Anamnesekompetenz ist vollumfänglich gegeben."
    satz3 := "Die ausführliche Anamnese ist dem neuropsychologischen Vorbericht zu entnehmen. Relevante Anamneseergänzungen wurden heute keine gemacht."
    zusatz := "(übernommen aus neuropsychologischem Vorbericht)"
    ; Seit 15.15 (Naed 29.9.): Leerzeile zwischen den Abschnitten,
    ; "Aktuell" wird zu "Anamnese vom [Berichtsdatum]", die
    ; Fremdanamnese kommt mit (Klammer ohne die Mitarbeiterin) mit,
    ; fehlende Abschnitte werden ganz weggelassen.
    text := satz1 " " satz2 "`n`n" satz3 "`n"
    rtf := BermcRtfText(satz1 " " satz2) "\par\par "
         . BermcRtfText(satz3) "\par "
    block(titel, inhalt) {
        text .= "`n" titel " " zusatz "`n" inhalt "`n"
        rtf .= "\par \ul " BermcRtfText(titel) "\ulnone  \i "
             . BermcRtfText(zusatz) "\i0 \par "
             . BermcRtfText(inhalt) "\par "
    }
    if (z["abschnitte"]["aktuell"] != "") {
        nd := z["neuroDatum"] != "" ? z["neuroDatum"] : "«xx.xx.2026»"
        block("Anamnese vom " nd, z["abschnitte"]["aktuell"])
    }
    if (z["abschnitte"]["fremd"] != "") {
        innen := ""
        if RegExMatch(z["fremdKopf"], "\(([^)]*)\)", &kl)
            innen := Trim(kl[1])
        innen := RegExReplace(innen,
            "i)Gespräch\s+von\s+(?:Frau|Herrn?)\s+\S+\s+(?:\S+\s+)?mit",
            "Gespräch mit")
        block("Fremdanamnese" (innen != "" ? " (" innen ")" : ""),
            z["abschnitte"]["fremd"])
    }
    paare := [["Sozialanamnese", "sozial"],
              ["Schul-, Bildungs- und Berufsanamnese", "schule"],
              ["Familienanamnese", "familie"],
              ["Persönliche Anamnese", "persoenlich"],
              ["Systemanamnese", "system"],
              ["Aktuelle Medikamente/Therapien", "medis"]]
    for paar in paare {
        inhalt := z["abschnitte"][paar[2]]
        if (inhalt == "")
            continue
        ; Medikamente (30.9.): KISIM-Tabelle als Fliesstext
        ; "Name Staerke x-x-x", wie in der App (Spiegel von medisFormat).
        if (paar[2] = "medis") {
            fm := BermcMedisFormat(inhalt)
            if (fm != "")
                inhalt := fm
        }
        block(paar[1], inhalt)
    }
    return [text, BermcRtfHuelle(rtf)]
}

; ---- Medikamente aus der KISIM-Tabelle (Spiegel von medisFormat) -------
BermcMedName(roh, topisch) {
    formen := "Tabl|Filmtabl|Tbl|Kaps|Drag|Supp|Lipolotio|Lotion|Creme|Salbe|Gel|Spray|Gtt|Tropfen|Sirup|Lös|Btl|Sachet|Inj|Amp|Ret\w*|Depot\w*|Brausetabl|Pulver|Kautabl|Lutschtabl"
    if RegExMatch(roh, "^(.+?)\s+(?:" formen ")\b\s*(.*)$", &m) {
        name := m[1]
        rest := m[2]
    } else {
        if RegExMatch(roh, "^([^a-zäöü]*[A-ZÄÖÜ0-9])(?=[a-zäöü])", &m2)
            name := m2[1]
        else
            name := StrSplit(Trim(roh), " ")[1]
        rest := SubStr(roh, StrLen(name) + 1)
    }
    hersteller := ["Mepha", "Sandoz", "Galepharm", "Spirig", "Axapharm",
        "Helvepharm", "Zentiva", "Streuli", "Viatris", "Teva", "Actavis",
        "Nobel", "eco"]
    worte := StrSplit(RegExReplace(Trim(name), "\s+", " "), " ")
    aus := ""
    for i, w in worte {
        if (i > 1) {
            if (StrLen(w) = 1)
                continue
            weg := false
            for h in hersteller
                if (w == h)
                    weg := true
            if weg
                continue
        }
        neuW := ""
        for j, t in StrSplit(w, "-") {
            if (StrLen(t) > 1 and t == StrUpper(t))
                t := SubStr(t, 1, 1) StrLower(SubStr(t, 2))
            neuW .= (j > 1 ? "-" : "") t
        }
        aus .= (aus = "" ? "" : " ") neuW
    }
    staerke := ""
    if (!topisch and RegExMatch(rest, "([\d]+(?:[.,][\d]+)?(?:/[\d]+(?:[.,][\d]+)?)*)\s*(mg|mcg|µg|g|ml|IE|E|%)?", &st) and st[1] != "") {
        einheit := (st[2] != "") ? st[2] : "mg"
        stZiff := RegExReplace(RegExReplace(st[1], "[.,]", ""), "^0+", "")
        nameZiff := ""
        p := 1
        while (p := RegExMatch(aus, "[\d/]+", &nz, p)) {
            nameZiff .= nz[0]
            p += StrLen(nz[0])
        }
        if (stZiff != "" and InStr(nameZiff, stZiff))
            staerke := einheit
        else
            staerke := StrReplace(st[1], ",", ".") " " einheit
    }
    return aus (staerke != "" ? " " staerke : "")
}

BermcMedZahl(x) {
    x := Trim(x)
    if (x = "")
        return 0
    if (x = "½")
        return 0.5
    if (x = "1½")
        return 1.5
    x := StrReplace(StrReplace(x, ",", "."), "½", ".5")
    if RegExMatch(x, "^(\d+(?:\.\d+)?|\.\d+)", &n)
        return n[1] + 0
    return 0
}

BermcMedDosis(f, bem) {
    w := []
    loop 4
        w.Push(BermcMedZahl(f.Length >= A_Index + 2 ? f[A_Index + 2] : ""))
    if (w[1] or w[2] or w[3] or w[4]) {
        anzahl := w[4] ? 4 : 3
        s := ""
        loop anzahl
            s .= (A_Index > 1 ? "-" : "") w[A_Index]
        return s
    }
    da := ""
    for tag in ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
        if InStr(bem, tag, true)
            da .= (da = "" ? "" : "/") tag
    if (da != "") {
        menge := ""
        if RegExMatch(bem, ":\s*([\d½.,]+)\s*Stk", &mg)
            menge := " je " StrReplace(mg[1], "½", "0.5")
        return da menge
    }
    return ""
}

BermcMedisFormat(inhalt) {
    if (inhalt = "")
        return ""
    meds := []
    letzte := 0
    for zeile in StrSplit(inhalt, "`n") {
        if InStr(zeile, "Medikamentenname", true)
            continue
        if RegExMatch(zeile, "^\s*\*\s*Aus medizinischen")
            continue
        if InStr(zeile, "`t") {
            f := StrSplit(zeile, "`t")
            if (f.Length >= 8 and Trim(f[1]) != "") {
                letzte := Map("f", f, "bem", f.Length >= 9 ? Trim(f[9]) : "")
                meds.Push(letzte)
                continue
            }
        }
        if (IsObject(letzte) and Trim(zeile) != "")
            letzte["bem"] := letzte["bem"] " " Trim(zeile)
    }
    if (meds.Length = 0)
        return ""
    aus := ""
    for med in meds {
        f := med["f"]
        bem := med["bem"]
        pausiert := RegExMatch(bem, "i)pausiert")
        dosis := BermcMedDosis(f, RegExReplace(bem, "i)pausiert\.?", "", , 1))
        topisch := RegExMatch(f.Length >= 8 ? f[8] : "", "i)topisch|lokal|kutan")
        eintrag := BermcMedName(Trim(f[1]), topisch)
            . (dosis != "" ? " " dosis : "") (pausiert ? " (pausiert)" : "")
        aus .= (aus = "" ? "" : ", ") eintrag
    }
    return aus
}

BermcNeuroDatum(text) {
    jahr := A_Year + 0
    best := ""
    bestRang := 9
    n := 0
    for zeile in StrSplit(text, "`n") {
        n += 1
        if (n > 8)
            break
        if RegExMatch(zeile, "i)geb")
            continue
        rang := RegExMatch(zeile, "i)untersuch") ? 0 : (RegExMatch(zeile, "i)bericht|datum") ? 1 : 2)
        p := 1
        while (p := RegExMatch(zeile, "(\d{2})\.(\d{2})\.(\d{4})", &dm, p)) {
            j := dm[3] + 0
            if (j >= jahr - 5 and j <= jahr + 1 and rang < bestRang) {
                best := dm[0]
                bestRang := rang
            }
            p += 10
        }
    }
    return best
}

BermcBelegt(a) {
    if (a.Has("beurteilung") and a["beurteilung"] != "")
        return true
    if (a.Has("datum") and a["datum"] != "")
        return true
    return a.Has("punkte") and a["punkte"].Length > 0
}

BermcLpZeile(w) {
    ; Die LP-Zeile aus den (teils noch fehlenden) Werten bauen; alles,
    ; was fehlt, bleibt als «...»-Markierung gelb. A/T/N bleibt IMMER
    ; gelb - das ist aerztliche Wertung (Naed 29.9.).
    zz := w.Has("zellzahl") ? w["zellzahl"] : "«x»"
    tp := w.Has("protein") ? w["protein"] : "«x»"
    a42 := w.Has("ab42") ? w["ab42"] : "«xx»"
    a40 := w.Has("ab40") ? w["ab40"] : "«xx»"
    q := w.Has("quotient") ? w["quotient"] : "«xx»"
    tau := w.Has("tau") ? w["tau"] : "«xx»"
    ptau := w.Has("ptau") ? w["ptau"] : "«xx»"
    return "Liquor klar, Zellzahl " zz " /µl (Norm < 5 /µl), Totalprotein "
        . tp " mg/l (Norm 150-450 mg/l), Amyloid-beta 1-42: " a42
        . " ng/l (> 599), Amyloid-beta 1-40: " a40
        . " ng/l, Amyloid-42/40-Quotient: " q " (> 0.062), Tau-Protein: "
        . tau " ng/l (< 404), Phospho-Tau-Protein: " ptau
        . " ng/l (< 56.5) — A «x», T «x», N «x»."
}

BermcBauUntersuchungen(z, zusaetze := "") {
    if (zusaetze = "")
        zusaetze := []
    iq := z["iqcode"] != "" ? z["iqcode"] : "«x»"
    ia := z["iadl"] != "" ? z["iadl"] : "«x/8»"
    cd := z["cdr"] != "" ? z["cdr"] : "«x»"
    stuetz := z["unterstuetzung"] != ""
        ? " Unterstützungsbedarf: " z["unterstuetzung"] : ""
    nd := z["neuroDatum"] != "" ? z["neuroDatum"] : "«xx.xx.2026»"
    ; Abschnitts-Geruest (30.9.): nur das Demenzlabor steht IMMER da;
    ; alle anderen - auch die Lumbalpunktion - NUR, wenn ein
    ; eingelesener Befund sie fuellt.
    geruest := [
        Map("id", "mri", "titel", "MRI Schädel", "ort", "Spital Limmattal", "eigen", true),
        Map("id", "labor", "titel", "Demenzlabor", "ort", "Spital Limmattal und Viollier", "pflicht", true,
            "inhalt", "Unauffällig (Hämatologie, Elektrolyte, Nieren- und Leberwerte, Glukose, HbA1c, Lipide, INR, CRP, TSH, Vitamin B12, Folsäure, BSR, Treponema pallidum)."),
        Map("id", "eeg", "titel", "Standard-EEG", "ort", "Spital Limmattal"),
        Map("id", "lp", "titel", "Lumbalpunktion mit Demenzmarkern", "ort", "Viollier", "werte", Map()),
        Map("id", "apo", "titel", "Apolipoprotein-Bestimmung", "ort", "Viollier"),
        Map("id", "fdg", "titel", "FDG-PET", "ort", "Universitätsspital Zürich"),
        Map("id", "amyloid", "titel", "Amyloid-PET", "ort", "Universitätsspital Zürich")]
    for zu in zusaetze {
        ; Ist eine Zeile schon gefuellt (zweites EEG, zweites Kopf-MR),
        ; bekommt der weitere Befund eine eigene Zeile; jedes Kopf-MR
        ; traegt die Eigendurchsicht (Naed 1.10.).
        ziel := ""
        for a in geruest
            if (a["id"] = zu["ziel"] and (a["id"] = "lp" or !BermcBelegt(a))) {
                ziel := a
                break
            }
        if (ziel = "") {
            neu := Map("id", "eigen", "titel", (zu["ziel"] = "eeg") ? "Standard-EEG" : zu["name"],
                "ort", zu.Has("ort") ? zu["ort"] : "",
                "datum", zu.Has("datum") ? zu["datum"] : "",
                "beurteilung", zu.Has("beurteilung") ? zu["beurteilung"] : "",
                "punkte", zu.Has("punkte") ? zu["punkte"] : [])
            if (zu["ziel"] = "mri")
                neu["eigen"] := true
            geruest.Push(neu)
            continue
        }
        if (zu.Has("punkte") and zu["punkte"].Length > 0)
            ziel["punkte"] := zu["punkte"]
        if (ziel["id"] = "mri" and zu.Has("name") and zu["name"] != "")
            ziel["titel"] := zu["name"]
        if (zu.Has("datum") and zu["datum"] != "")
            ziel["datum"] := zu["datum"]
        if (zu.Has("ort") and zu["ort"] != "" and ziel["id"] != "lp")
            ziel["ort"] := zu["ort"]
        if (zu.Has("beurteilung") and zu["beurteilung"] != "")
            ziel["beurteilung"] := zu["beurteilung"]
        if (zu.Has("werte") and ziel.Has("werte"))
            for k, v in zu["werte"]
                ziel["werte"][k] := v
    }
    ; Chronologisch (datiert vor undatiert, sonst Geruest-Reihenfolge)
    sortiert := []
    for a in geruest {
        d := a.Has("datum") ? a["datum"] : ""
        schl := RegExMatch(d, "^(\d{2})\.(\d{2})\.(\d{4})$", &dm)
            ? dm[3] dm[2] dm[1] : "99999999"
        i := 1
        while (i <= sortiert.Length and sortiert[i][1] <= schl)
            i += 1
        sortiert.InsertAt(i, [schl, a])
    }
    text := ""
    rtf := ""
    ; Titelzeile nach Naeds Regel (30.9.): unterstrichen bis und mit der
    ; Klammer nach dem Ort, Doppelpunkt, Beurteilung auf DERSELBEN Zeile.
    kopf(titel, datum, ort, inhalt) {
        d := datum != "" ? datum : "«xx.xx.2026»"
        o := ort != "" ? ort : "«xx»"
        text .= titel " vom " StrReplace(StrReplace(d, Chr(171)), Chr(187))
            . " (" StrReplace(StrReplace(o, Chr(171)), Chr(187)) "): "
            . StrReplace(StrReplace(inhalt, Chr(171)), Chr(187)) "`n"
        rtf .= "\ul " BermcRtfText(titel " vom " d " (" o ")") "\ulnone : "
            . BermcRtfText(inhalt) "\par "
    }
    text .= "Demenz-Scores vom " StrReplace(StrReplace(nd, Chr(171)), Chr(187)) " (Spital Limmattal):`n"
    rtf .= "\ul " BermcRtfText("Demenz-Scores vom " nd " (Spital Limmattal)") "\ulnone :\par "
    punkte := [
        "IQCODE (Fragebogen zur geistigen Leistungsfähigkeit für ältere Personen): " iq " (Cut-off ≤ 3.19).",
        "IADL-Skala (instrumental activities of daily living) nach Lawton und Brody: " ia " Punkte." stuetz,
        "ADL-Skala (activities of daily living, Barthel-Index): nicht eingeschränkt.",
        "CDR-Skala (kognitive und funktionelle Leistung, formal): " cd "."]
    for pz in punkte {
        text .= Chr(0x2022) " " StrReplace(StrReplace(pz, Chr(171)), Chr(187)) "`n"
        rtf .= "\pard{\*\pn\pnlvlblt\pnf0\pnindent283{\pntxtb\'95}}"
            . "\fi-283\li283 " BermcRtfText(pz) "\par\pard "
    }
    for paar in sortiert {
        a := paar[2]
        dat := a.Has("datum") ? a["datum"] : ""
        beu := a.Has("beurteilung") ? a["beurteilung"] : ""
        hatWerte := a.Has("werte") and a["werte"].Count > 0
        hatPunkte := a.Has("punkte") and a["punkte"].Length > 0
        if (!a.Has("pflicht") and beu = "" and dat = "" and !hatWerte and !hatPunkte)
            continue
        text .= "`n"
        rtf .= "\par "
        if (hatPunkte) {
            ; Echte Aufzaehlung (1.10.): Kopf + allfaelliger Text, dann die
            ; Punkte als Liste, die Eigendurchsicht danach.
            kopf(a["titel"], dat, a.Has("ort") ? a["ort"] : "", beu)
            for pz in a["punkte"] {
                text .= Chr(0x2022) " " pz "`n"
                rtf .= "\pard{\*\pn\pnlvlblt\pnf0\pnindent283{\pntxtb\'95}}"
                    . "\fi-283\li283 " BermcRtfText(pz) "\par\pard "
            }
            if a.Has("eigen") {
                text .= "(in der Eigendurchsicht: xx.)`n"
                rtf .= BermcRtfText("(in der Eigendurchsicht: «xx».)") "\par "
            }
            continue
        }
        if (a["id"] = "lp" and beu = "")
            inhalt := BermcLpZeile(a["werte"])
        else if (beu != "")
            inhalt := beu
        else if (a.Has("inhalt"))
            inhalt := a["inhalt"]
        else
            inhalt := "«xx.»"
        if (a.Has("eigen"))
            inhalt .= " (in der Eigendurchsicht: «xx».)"
        kopf(a["titel"], dat, a.Has("ort") ? a["ort"] : "", inhalt)
    }
    return [text, BermcRtfHuelle(rtf)]
}

; ---- Kleiner RTF-Bau (Spiegel des App-Kopfs aus auszeichnung.js) -------
BermcRtfText(t) {
    aus := ""
    Loop Parse t {
        c := A_LoopField
        o := Ord(c)
        if (o = 171)
            aus .= "{\highlight1 "
        else if (o = 187)
            aus .= "}"
        else if (c == "\")
            aus .= "\\"
        else if (c == "{")
            aus .= "\{"
        else if (c == "}")
            aus .= "\}"
        else if (o = 10)
            aus .= "\par "
        else if (o = 13)
            continue
        else if (o > 127)
            aus .= "\u" o "?"
        else
            aus .= c
    }
    return aus
}

BermcRtfHuelle(koerper) {
    ; Farbtabelle: Farbe 1 = Gelb #ffd54d fuer "hier hat das Skript
    ; nichts eingefuegt" (Naed 28.9.).
    kopf := "{\rtf1\ansi\ansicpg1252\deff0\deflang2055"
          . "{\fonttbl{\f0\fnil Arial;}}"
          . "{\colortbl;\red255\green213\blue77;}"
          . "\viewkind4\uc1 \pard\f0\fs20 "
    koerper := RegExReplace(koerper, "\\par $", "")
    return kopf koerper "}"
}
