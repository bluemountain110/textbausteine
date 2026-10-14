; Datei: makros-masken.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey v2)
; Zweck: Die Masken-Sprache der Etappe 8 auf Text und RTF - der
;        SPIEGEL von masken.js (App und Erweiterung). Dieselben Regeln,
;        dieselbe Reihenfolge: Kaestchen ({{Ankreuz:...}}), Abschnitte
;        ({{Wenn:...}}/{{WennNicht:...}}/{{Ende}}), Bausteinwahl je
;        Abschnitt ({{Aus Kategorie:...}}) und KISIM-Spruenge
;        ({{Sprung:2}} = 2x Strg+Tab). Das RTF wird nie zusammen-
;        gesetzt, nur GESCHNITTEN - und vor jedem Schnitt prueft der
;        Klammer-Waechter, dass keine RTF-Gruppe zerrissen wird
;        (Weg A). Scheitert er, faellt das Skript sichtbar auf reinen
;        Text zurueck - nichts scheitert still.
;        Eigene Datei, damit makros.ahk unter der 600-Zeilen-Grenze
;        bleibt. GRUNDSATZ: hier fliesst Bausteintext, nie Patientendaten.

; Der feste Anfang jedes von der App erzeugten RTF-Koerpers - an
; diesem woertlichen Stueck wird der Kopf vom Inhalt getrennt.
global MASKE_RTF_KOPF := "\viewkind4\uc1 \pard\f0\fs20 "

; ---- Einen Platzhalter-Inhalt deuten ------------------------------------
; Liefert eine Map oder "" (kein Masken-Platzhalter; Feld, Auswahl,
; Datum usw. gehoeren makros.ahk). Namen sind wie in der App
; GROSS-klein-genau (== statt =, AHK-Falle K9).
MaskeToken(inhalt) {
    roh := String(inhalt)
    doppelpunkt := InStr(roh, ":")
    name := Trim(doppelpunkt ? SubStr(roh, 1, doppelpunkt - 1) : roh)
    rest := doppelpunkt ? SubStr(roh, doppelpunkt + 1) : ""
    if (name == "Ende")
        return Map("typ", "ende")
    if (name == "Ankreuz") {
        gleich := InStr(rest, "=")
        kopf := Trim(gleich ? SubStr(rest, 1, gleich - 1) : rest)
        text := gleich ? SubStr(rest, gleich + 1) : ""
        hatText := gleich ? true : false
        an := true
        if RegExMatch(kopf, "i)/(aus|an)\s*$", &sw) {
            an := (StrLower(sw[1]) != "aus")
            kopf := Trim(SubStr(kopf, 1, sw.Pos - 1))
        }
        if (kopf = "")
            return Map("typ", "fehler")
        return Map("typ", "ankreuz", "name", kopf, "text", text,
            "hatText", hatText, "an", an)
    }
    if (name == "Wenn" or name == "WennNicht") {
        gleich := InStr(rest, "=")
        n2 := Trim(gleich ? SubStr(rest, 1, gleich - 1) : rest)
        wert := gleich ? Trim(SubStr(rest, gleich + 1)) : ""
        if (n2 = "")
            return Map("typ", "fehler")
        return Map("typ", (name == "Wenn") ? "wenn" : "wennnicht",
            "name", n2, "wert", wert, "hatWert", gleich ? true : false)
    }
    if (name == "Aus Kategorie") {
        k := Trim(rest)
        if (k = "")
            return Map("typ", "fehler")
        return Map("typ", "kategorie", "kategorie", k)
    }
    if (name == "Sprung") {
        z := Trim(rest)
        if (!RegExMatch(z, "^\d+$") or Number(z) < 1 or Number(z) > 20)
            return Map("typ", "fehler")
        return Map("typ", "sprung", "n", Number(z))
    }
    return ""
}

; Ist dieser Text (HTML oder reiner Text) eine Maske?
MaskeIst(text) {
    return RegExMatch(String(text),
        "i)\{\{\s*(Ankreuz|Wenn|WennNicht|Aus Kategorie)\s*:") ? true : false
}

; ---- Analyse: Was fragt das Fenster ab? ---------------------------------
; Arbeitet auf dem reinen Text des Bausteins. Liefert Map mit
; zeilen (in Lesereihenfolge, je mit sichtbarWenn fuers Ausgrauen),
; kaestchen, kategorienAnzahl und fehler.
MaskeAnalysieren(html) {
    text := HtmlNachText(html)
    zeilen := []
    kaestchen := []
    kaestchenVon := Map()
    auswahlNamen := Map()
    gesehen := Map()
    stapel := []
    fehler := []
    katNr := 0
    KaestchenAnlegen(name, an, implizit) {
        if !kaestchenVon.Has(name) {
            k := Map("name", name, "an", an, "text", "", "hatText", false,
                "implizit", implizit)
            kaestchenVon[name] := k
            kaestchen.Push(k)
            zeilen.Push(Map("typ", "ankreuz", "name", name,
                "sichtbarWenn", stapel.Clone()))
        }
        else if (!implizit and kaestchenVon[name]["implizit"]) {
            kaestchenVon[name]["an"] := an
            kaestchenVon[name]["implizit"] := false
        }
        return kaestchenVon[name]
    }
    ; 18.2 (K1-Fehler 10.10.): Auswahl-Namen VORAB einsammeln - ein
    ; {{Wenn:Name=Wert}} darf auch VOR seiner Auswahl im Text stehen
    ; (die App prueft im zweiten Durchlauf, dieser Spiegel jetzt auch).
    posV := 1
    while RegExMatch(text, "\{\{([^{}]+)\}\}", &tV, posV) {
        posV := tV.Pos + tV.Len
        inhaltV := tV[1]
        dpV := InStr(inhaltV, ":")
        if (dpV and Trim(SubStr(inhaltV, 1, dpV - 1)) = "Auswahl") {
            restV := SubStr(inhaltV, dpV + 1)
            dp2V := InStr(restV, ":")
            beschV := Trim(dp2V ? SubStr(restV, 1, dp2V - 1) : restV)
            if (beschV != "")
                auswahlNamen[beschV] := true
        }
    }
    pos := 1
    while RegExMatch(text, "\{\{([^{}]+)\}\}", &t, pos) {
        pos := t.Pos + t.Len
        tok := MaskeToken(t[1])
        if !IsObject(tok) {
            inhalt := t[1]
            dp := InStr(inhalt, ":")
            nm := Trim(dp ? SubStr(inhalt, 1, dp - 1) : inhalt)
            rest := dp ? SubStr(inhalt, dp + 1) : ""
            if (nm = "Feld") {
                gleich := InStr(rest, "=")
                besch := Trim(gleich ? SubStr(rest, 1, gleich - 1) : rest)
                vorgabe := gleich ? SubStr(rest, gleich + 1) : ""
                if (besch != "" and !gesehen.Has(besch)) {
                    gesehen[besch] := true
                    zeilen.Push(Map("typ", "feld", "name", besch,
                        "vorgabe", vorgabe, "sichtbarWenn", stapel.Clone()))
                }
            }
            else if (nm = "Auswahl") {
                dp2 := InStr(rest, ":")
                besch := Trim(dp2 ? SubStr(rest, 1, dp2 - 1) : rest)
                optionen := []
                optRoh := dp2 ? SubStr(rest, dp2 + 1) : ""
                optRoh := RegExReplace(optRoh, "i)\s*:\s*stumm\s*$", "")
                for o in StrSplit(optRoh, ["|", "/"]) {
                    o := Trim(o)
                    if (o != "")
                        optionen.Push(o)
                }
                if (besch != "") {
                    auswahlNamen[besch] := true
                    if !gesehen.Has(besch) {
                        gesehen[besch] := true
                        z := Map("typ", "auswahl", "name", besch,
                            "sichtbarWenn", stapel.Clone())
                        z["optionen"] := optionen
                        zeilen.Push(z)
                    }
                }
            }
            continue
        }
        typ := tok["typ"]
        if (typ == "fehler") {
            fehler.Push(TX["maskeUnsauber"])
            continue
        }
        if (typ == "ankreuz") {
            k := KaestchenAnlegen(tok["name"], tok["an"], false)
            if (tok["hatText"] and !k["hatText"]) {
                k["text"] := tok["text"]
                k["hatText"] := true
            }
            continue
        }
        if (typ == "wenn" or typ == "wennnicht") {
            if !tok["hatWert"]
                KaestchenAnlegen(tok["name"], true, true)
            else if !auswahlNamen.Has(tok["name"])
                fehler.Push(TX["maskeUnsauber"])
            stapel.Push(Map("name", tok["name"], "wert", tok["wert"],
                "hatWert", tok["hatWert"], "negiert", typ == "wennnicht"))
            continue
        }
        if (typ == "ende") {
            if (stapel.Length = 0)
                fehler.Push(TX["maskeUnsauber"])
            else
                stapel.Pop()
            continue
        }
        if (typ == "kategorie") {
            zeilen.Push(Map("typ", "kategorie", "kategorie", tok["kategorie"],
                "nummer", katNr, "sichtbarWenn", stapel.Clone()))
            katNr := katNr + 1
            continue
        }
    }
    if (stapel.Length > 0)
        fehler.Push(TX["maskeUnsauber"])
    return Map("zeilen", zeilen, "kaestchen", kaestchen,
        "kategorienAnzahl", katNr, "fehler", fehler)
}

; Gilt eine Bedingung? zustand: Map mit "kaestchen" und "antworten".
MaskeBedingungGilt(bed, zustand) {
    if bed["hatWert"] {
        a := zustand.Has("antworten") ? zustand["antworten"] : Map()
        wahr := a.Has(bed["name"]) and (String(a[bed["name"]]) == bed["wert"])
    }
    else {
        k := zustand.Has("kaestchen") ? zustand["kaestchen"] : Map()
        wahr := k.Has(bed["name"]) ? (k[bed["name"]] ? true : false) : true
    }
    return bed["negiert"] ? !wahr : wahr
}

; ---- Anwenden auf reinem Text -------------------------------------------
; Spiegel von masken.js textAnwenden. markenBehalten = true laesst
; {{Aus Kategorie:...}} und {{Sprung:...}} stehen (fuer die spaetere
; Zerlegung des Berichts in Einfuege-Schritte).
MaskeTextAnwenden(text, zustand, kategorieTexte, markenBehalten) {
    t := String(text)
    aus := ""
    pos := 1
    fallTiefe := 0
    katNr := 0
    while RegExMatch(t, "\{\{([^{}]+)\}\}", &m, pos) {
        tok := MaskeToken(m[1])
        if (fallTiefe > 0) {
            pos := m.Pos + m.Len
            if IsObject(tok) {
                typ := tok["typ"]
                if (typ == "wenn" or typ == "wennnicht")
                    fallTiefe := fallTiefe + 1
                else if (typ == "ende")
                    fallTiefe := fallTiefe - 1
                else if (typ == "kategorie")
                    katNr := katNr + 1
            }
            continue
        }
        aus := aus SubStr(t, pos, m.Pos - pos)
        pos := m.Pos + m.Len
        if !IsObject(tok) {
            aus := aus m[0]
            continue
        }
        typ := tok["typ"]
        if (typ == "wenn" or typ == "wennnicht") {
            bed := Map("name", tok["name"], "wert", tok["wert"],
                "hatWert", tok["hatWert"], "negiert", typ == "wennnicht")
            if !MaskeBedingungGilt(bed, zustand)
                fallTiefe := 1
            continue
        }
        if (typ == "ende")
            continue
        if (typ == "ankreuz") {
            k := zustand.Has("kaestchen") ? zustand["kaestchen"] : Map()
            an := k.Has(tok["name"]) ? (k[tok["name"]] ? true : false) : tok["an"]
            if (an and tok["hatText"]) {
                tx := zustand.Has("texte") ? zustand["texte"] : Map()
                aus := aus (tx.Has(tok["name"]) ? tx[tok["name"]] : tok["text"])
            }
            continue
        }
        if (typ == "kategorie") {
            if markenBehalten
                aus := aus m[0]
            else {
                if (kategorieTexte.Length >= katNr + 1)
                    aus := aus kategorieTexte[katNr + 1]
                katNr := katNr + 1
            }
            continue
        }
        if (typ == "sprung") {
            aus := aus (markenBehalten ? m[0] : "`n")
            continue
        }
    }
    aus := aus SubStr(t, pos)
    return MaskeTextHeilen(aus)
}

; Heilung: keine Spuren, wo etwas wegfiel (Spiegel von heileText).
MaskeTextHeilen(t) {
    t := StrReplace(String(t), "`r`n", "`n")
    t := RegExReplace(t, "[ `t]{2,}", " ")
    t := RegExReplace(t, " ([.,;:!?])", "$1")
    ; Zwei Saetze aus zwei Stuecken kleben aneinander ("Dauer.Die"):
    ; nach Satzende vor Grossbuchstabe ein Leerzeichen (Spiegel der App).
    t := RegExReplace(t, "([a-zäöüéèà]{2,}[.!?])([A-ZÄÖÜ])", "$1 $2")
    t := RegExReplace(t, "[ `t]+\n", "`n")
    t := RegExReplace(t, "\n{3,}", "`n`n")
    return t
}

; ---- Anwenden im RTF (nur schneiden, nie zusammensetzen) ----------------
; Entfernt abgewaehlte Abschnitte und die Wenn-Marken, fuellt die
; Ankreuz-Luecken. {{Aus Kategorie:...}} und {{Sprung:...}} bleiben
; als Marken stehen. Der Klammer-Waechter prueft JEDEN Schnitt.
MaskeRtfAnwenden(rtf, zustand) {
    r := String(rtf)
    aus := ""
    pos := 1
    fallTiefe := 0
    offenPos := 0
    heil := false
    while RegExMatch(r, "s)\\\{\\\{(.*?)\\\}\\\}", &m, pos) {
        tok := MaskeToken(RtfNachText(m[1]))
        if (fallTiefe > 0) {
            pos := m.Pos + m.Len
            if IsObject(tok) {
                typ := tok["typ"]
                if (typ == "wenn" or typ == "wennnicht")
                    fallTiefe := fallTiefe + 1
                else if (typ == "ende") {
                    fallTiefe := fallTiefe - 1
                    if (fallTiefe = 0) {
                        stueck := SubStr(r, offenPos, m.Pos + m.Len - offenPos)
                        if (MaskeKlammerBilanz(stueck) != 0)
                            return Map("ok", false, "rtf", "")
                        ; Heilung (Nachrunde 25.09.): Stand der Abschnitt
                        ; allein in seinen Absaetzen, bleibt sonst seine
                        ; Absatzmarke stehen - je abgewaehltem Kapitel
                        ; eine Leerzeile zu viel. Die Marke mitnehmen,
                        ; wenn der Abschnitt am Absatzanfang begann.
                        amAnfang := RegExMatch(aus, "s)\\pard?(\\[a-z]+-?\d*)* ?$") ? true : false
                        if ((amAnfang or aus = "") and SubStr(r, pos, 4) == "\par"
                            and !RegExMatch(SubStr(r, pos + 4, 1), "[a-z]")) {
                            pos := pos + 4
                            if (SubStr(r, pos, 1) == " ")
                                pos := pos + 1
                        }
                    }
                }
            }
            continue
        }
        aus := aus SubStr(r, pos, m.Pos - pos)
        pos := m.Pos + m.Len
        if !IsObject(tok) {
            aus := aus m[0]
            continue
        }
        typ := tok["typ"]
        if (typ == "wenn" or typ == "wennnicht") {
            bed := Map("name", tok["name"], "wert", tok["wert"],
                "hatWert", tok["hatWert"], "negiert", typ == "wennnicht")
            if !MaskeBedingungGilt(bed, zustand) {
                fallTiefe := 1
                offenPos := m.Pos
            }
            continue
        }
        if (typ == "ende")
            continue
        if (typ == "ankreuz") {
            k := zustand.Has("kaestchen") ? zustand["kaestchen"] : Map()
            an := k.Has(tok["name"]) ? (k[tok["name"]] ? true : false) : tok["an"]
            if (an and tok["hatText"]) {
                tx := zustand.Has("texte") ? zustand["texte"] : Map()
                aus := aus RtfEntschaerfe(tx.Has(tok["name"]) ? tx[tok["name"]] : tok["text"])
            }
            continue
        }
        if (typ == "kategorie" or typ == "sprung") {
            aus := aus m[0]
            continue
        }
    }
    if (fallTiefe > 0)
        return Map("ok", false, "rtf", "")
    aus := aus SubStr(r, pos)
    ; Abstands-Heilung auch im RTF (Spiegel der App): zwei Saetze aus
    ; zwei Stuecken kleben sonst aneinander ("Dauer.Die"). Nur im
    ; Koerper hinter dem festen Kopf, nie in den Steuerwoertern.
    kp := InStr(aus, MASKE_RTF_KOPF)
    if kp {
        kEnde := kp + StrLen(MASKE_RTF_KOPF) - 1
        kopf := SubStr(aus, 1, kEnde)
        rest := SubStr(aus, kEnde + 1)
        rest := RegExReplace(rest, "([a-zäöüéèà]{2,}[.!?])([A-ZÄÖÜ])", "$1 $2")
        aus := kopf rest
    }
    return Map("ok", true, "rtf", aus)
}

; Zaehlt { und } (ohne die mit \ geschuetzten) in einem RTF-Stueck.
MaskeKlammerBilanz(stueck) {
    s := String(stueck)
    bilanz := 0
    i := 1
    laenge := StrLen(s)
    while (i <= laenge) {
        z := SubStr(s, i, 1)
        if (z == "\") {
            i := i + 2
            continue
        }
        if (z == "{")
            bilanz := bilanz + 1
        else if (z == "}")
            bilanz := bilanz - 1
        i := i + 1
    }
    return bilanz
}

; In einem fertig aufgeloesten RTF verbliebene Kategorie-/Sprung-
; Marken aufloesen (fuer Unterbausteine, die als GANZES eingefuegt
; werden): Kategorie faellt weg, Sprung wird ein Absatz.
MaskeRtfMarkenAufloesen(rtf) {
    r := String(rtf)
    aus := ""
    pos := 1
    while RegExMatch(r, "s)\\\{\\\{(.*?)\\\}\\\}", &m, pos) {
        tok := MaskeToken(RtfNachText(m[1]))
        aus := aus SubStr(r, pos, m.Pos - pos)
        pos := m.Pos + m.Len
        if (IsObject(tok) and tok["typ"] == "sprung")
            aus := aus "\par "
        else if (IsObject(tok) and tok["typ"] == "kategorie")
            aus := aus ""
        else
            aus := aus m[0]
    }
    aus := aus SubStr(r, pos)
    return aus
}

; ---- Zerlegung in Einfuege-Schritte -------------------------------------
; Der fertig angewandte Text/das RTF wird an den Kategorie- und
; Sprung-Marken in Stuecke geschnitten. Jedes RTF-Stueck bekommt den
; Kopf und die Schlussklammer wieder - so ist jedes Stueck ein
; vollstaendiges, eigenstaendiges RTF (Weg A).
MaskeTextSegmentieren(text) {
    t := String(text)
    teile := []
    pos := 1
    lauf := 1
    katNr := 0
    while RegExMatch(t, "\{\{([^{}]+)\}\}", &m, pos) {
        pos := m.Pos + m.Len
        tok := MaskeToken(m[1])
        if (!IsObject(tok) or (tok["typ"] != "kategorie" and tok["typ"] != "sprung"))
            continue
        teile.Push(Map("art", "text", "text", SubStr(t, lauf, m.Pos - lauf)))
        lauf := m.Pos + m.Len
        if (tok["typ"] == "kategorie")
            teile.Push(Map("art", "kategorie", "nummer", katNr)), katNr := katNr + 1
        else
            teile.Push(Map("art", "sprung", "n", tok["n"]))
    }
    teile.Push(Map("art", "text", "text", SubStr(t, lauf)))
    return teile
}

MaskeRtfSegmentieren(rtf) {
    r := String(rtf)
    kopfPos := InStr(r, MASKE_RTF_KOPF)
    if !kopfPos
        return Map("ok", false, "teile", [])
    kopf := SubStr(r, 1, kopfPos + StrLen(MASKE_RTF_KOPF) - 1)
    koerper := SubStr(r, kopfPos + StrLen(MASKE_RTF_KOPF))
    koerper := RTrim(koerper, " `t`r`n")
    if (SubStr(koerper, -1) != "}")
        return Map("ok", false, "teile", [])
    koerper := SubStr(koerper, 1, StrLen(koerper) - 1)
    teile := []
    pos := 1
    lauf := 1
    katNr := 0
    while RegExMatch(koerper, "s)\\\{\\\{(.*?)\\\}\\\}", &m, pos) {
        pos := m.Pos + m.Len
        tok := MaskeToken(RtfNachText(m[1]))
        if (!IsObject(tok) or (tok["typ"] != "kategorie" and tok["typ"] != "sprung"))
            continue
        stueck := SubStr(koerper, lauf, m.Pos - lauf)
        if (MaskeKlammerBilanz(stueck) != 0)
            return Map("ok", false, "teile", [])
        teile.Push(Map("art", "rtf", "rtf", kopf stueck "}"))
        lauf := m.Pos + m.Len
        if (tok["typ"] == "kategorie")
            teile.Push(Map("art", "kategorie", "nummer", katNr)), katNr := katNr + 1
        else
            teile.Push(Map("art", "sprung", "n", tok["n"]))
    }
    stueck := SubStr(koerper, lauf)
    if (MaskeKlammerBilanz(stueck) != 0)
        return Map("ok", false, "teile", [])
    teile.Push(Map("art", "rtf", "rtf", kopf stueck "}"))
    return Map("ok", true, "teile", teile)
}
