; Datei: makros.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Die Platzhalter am Einfuege-Ort. Das fertige RTF kommt aus der
;        App (Spalte text_rtf) — hier wird NUR eingesetzt: Datum, Zeit,
;        Konstanten, die Antworten aus dem Luecken-Fenster, Marken fuer
;        das Diktat. Es gibt keinen zweiten RTF-Erzeuger (Lehre K2);
;        dieses Stueck ersetzt Zeichenketten nach den RTF-Regeln, mehr
;        nicht. Die Fluchtzeichen-Logik ist in der Pruefsuite (Node)
;        gespiegelt und getestet.

; ---- HTML zu reinem Text (fuer Vorschau und Text-Fassung) --------------
HtmlNachText(html) {
    t := String(html)
    t := RegExReplace(t, "s)<!--.*?-->", "")
    t := RegExReplace(t, "i)<br\s*/?>", "`n")
    t := RegExReplace(t, "i)</(p|div|li)>", "`n")
    t := RegExReplace(t, "s)<[^>]*>", "")
    t := StrReplace(t, "&nbsp;", " ")
    t := StrReplace(t, "&lt;", "<")
    t := StrReplace(t, "&gt;", ">")
    t := StrReplace(t, "&quot;", Chr(34))
    t := StrReplace(t, "&#39;", "'")
    t := StrReplace(t, "&amp;", "&")
    t := RegExReplace(t, "`n{3,}", "`n`n")
    return Trim(t, " `t`r`n")
}

; ---- Welche Luecken fragt der Baustein ab? -----------------------------
; Liefert eine Liste von Maps: art (feld/auswahl), beschriftung,
; vorgabe, optionen. Gleiche Beschriftung nur einmal.
LueckenFinden(html) {
    text := HtmlNachText(html)
    luecken := []
    gesehen := Map()
    pos := 1
    while RegExMatch(text, "\{\{([^{}]+)\}\}", &t, pos) {
        pos := t.Pos + t.Len
        inhalt := t[1]
        doppelpunkt := InStr(inhalt, ":")
        if !doppelpunkt
            continue
        name := Trim(SubStr(inhalt, 1, doppelpunkt - 1))
        rest := SubStr(inhalt, doppelpunkt + 1)
        if (name = "Feld") {
            gleich := InStr(rest, "=")
            beschriftung := Trim(gleich ? SubStr(rest, 1, gleich - 1) : rest)
            vorgabe := gleich ? SubStr(rest, gleich + 1) : ""
            if (beschriftung = "" or gesehen.Has(beschriftung))
                continue
            gesehen[beschriftung] := true
            luecken.Push(Map("art", "feld", "beschriftung", beschriftung, "vorgabe", vorgabe))
        }
        else if (name = "Auswahl") {
            dp2 := InStr(rest, ":")
            beschriftung := Trim(dp2 ? SubStr(rest, 1, dp2 - 1) : rest)
            optionenRoh := dp2 ? SubStr(rest, dp2 + 1) : ""
            optionen := []
            for o in StrSplit(optionenRoh, ["|", "/"]) {
                o := Trim(o)
                if (o != "")
                    optionen.Push(o)
            }
            if (beschriftung = "" or optionen.Length < 2 or gesehen.Has(beschriftung))
                continue
            luecke := Map("art", "auswahl", "beschriftung", beschriftung)
            luecke["optionen"] := optionen
            gesehen[beschriftung] := true
            luecken.Push(luecke)
        }
    }
    return luecken
}

; ---- Datum und Zeit -----------------------------------------------------
DatumText(format, versatzTage) {
    stempel := A_Now
    if (versatzTage != 0)
        stempel := DateAdd(stempel, versatzTage, "Days")
    aus := StrReplace(format, "JJJJ", FormatTime(stempel, "yyyy"))
    aus := StrReplace(aus, "JJ", FormatTime(stempel, "yy"))
    aus := StrReplace(aus, "MM", FormatTime(stempel, "MM"))
    aus := StrReplace(aus, "TT", FormatTime(stempel, "dd"))
    return aus
}

; ---- RTF-Fluchtzeichen (identisch zur Regel in auszeichnung.js) --------
RtfEntschaerfe(text) {
    aus := ""
    loop parse String(text) {
        z := A_LoopField
        c := Ord(z)
        if (z = "\" or z = "{" or z = "}") {
            aus := aus "\" z
            continue
        }
        if (c = 160) {
            aus := aus "\~"
            continue
        }
        if (c = 45 or c < 32 or c > 126) {
            n := c
            if (n > 32767)
                n := n - 65536
            aus := aus "\u" n "?"
            continue
        }
        aus := aus z
    }
    return aus
}

; Macht aus dem RTF-Inneren eines Platzhalters wieder Klartext.
RtfNachText(stueck) {
    aus := ""
    pos := 1
    laenge := StrLen(stueck)
    while (pos <= laenge) {
        z := SubStr(stueck, pos, 1)
        if (z = "\") {
            f := SubStr(stueck, pos + 1, 1)
            if (f = "u") {
                if RegExMatch(stueck, "\G\\u(-?\d+)\?", &t, pos) {
                    n := Number(t[1])
                    if (n < 0)
                        n := n + 65536
                    aus := aus Chr(n)
                    pos := pos + t.Len
                    continue
                }
            }
            if (f = "~") {
                aus := aus Chr(160)
                pos := pos + 2
                continue
            }
            if (f = "\" or f = "{" or f = "}") {
                aus := aus f
                pos := pos + 2
                continue
            }
            pos := pos + 1
            continue
        }
        aus := aus z
        pos := pos + 1
    }
    return aus
}

; ---- Einen Platzhalter-Inhalt auswerten --------------------------------
; modus: "fenster" (Antworten einsetzen) oder "marken" (Luecken als
; Marken stehen lassen). Liefert Map mit wert und istCursor.
PlatzhalterWert(inhalt, antworten, modus) {
    aus := Map("wert", "", "istCursor", false, "unbekannt", false)
    name := inhalt
    rest := ""
    doppelpunkt := InStr(inhalt, ":")
    if doppelpunkt {
        name := Trim(SubStr(inhalt, 1, doppelpunkt - 1))
        rest := SubStr(inhalt, doppelpunkt + 1)
    }
    else
        name := Trim(inhalt)
    marken := MarkenZeichen()
    if RegExMatch(name, "^Datum([+-]\d+)?$", &t) {
        versatz := (t[1] != "") ? Number(t[1]) : 0
        aus["wert"] := DatumText(Datumsformat(), versatz)
        return aus
    }
    if (name = "Zeit") {
        aus["wert"] := FormatTime(A_Now, "HH:mm")
        return aus
    }
    if (name = "Cursor") {
        aus["istCursor"] := true
        return aus
    }
    if (name = "Feld") {
        gleich := InStr(rest, "=")
        beschriftung := Trim(gleich ? SubStr(rest, 1, gleich - 1) : rest)
        vorgabe := gleich ? SubStr(rest, gleich + 1) : ""
        if (modus = "marken") {
            aus["wert"] := marken["auf"] beschriftung marken["zu"]
            return aus
        }
        aus["wert"] := antworten.Has(beschriftung) ? antworten[beschriftung] : vorgabe
        return aus
    }
    if (name = "Auswahl") {
        dp2 := InStr(rest, ":")
        beschriftung := Trim(dp2 ? SubStr(rest, 1, dp2 - 1) : rest)
        if (modus = "marken") {
            aus["wert"] := marken["auf"] beschriftung marken["zu"]
            return aus
        }
        aus["wert"] := antworten.Has(beschriftung) ? antworten[beschriftung] : ""
        return aus
    }
    k := Konstanten()
    if k.Has(name) {
        aus["wert"] := String(k[name])
        return aus
    }
    aus["unbekannt"] := true
    return aus
}

; ---- Auswertung im RTF ---------------------------------------------------
; Liefert Map mit rtf und cursorMarke (Sentinel-Zeichen im Text danach).
RtfAuswerten(rtf, antworten, modus) {
    aus := ""
    pos := 1
    while RegExMatch(rtf, "s)\\\{\\\{(.*?)\\\}\\\}", &t, pos) {
        aus := aus SubStr(rtf, pos, t.Pos - pos)
        pos := t.Pos + t.Len
        inhalt := RtfNachText(t[1])
        w := PlatzhalterWert(inhalt, antworten, modus)
        if w["unbekannt"]
            aus := aus t[0]
        else if !w["istCursor"]
            aus := aus RtfEntschaerfe(w["wert"])
    }
    aus := aus SubStr(rtf, pos)
    return aus
}

; ---- Dieselbe Auswertung im reinen Text ---------------------------------
; Der Sentinel fuer den Cursor kommt in Befunden nie vor (wie seite.js).
global CURSOR_ZEICHEN := Chr(0x2038)

TextAuswerten(text, antworten, modus) {
    aus := ""
    pos := 1
    while RegExMatch(text, "s)\{\{([^{}]+)\}\}", &t, pos) {
        aus := aus SubStr(text, pos, t.Pos - pos)
        pos := t.Pos + t.Len
        w := PlatzhalterWert(t[1], antworten, modus)
        if w["unbekannt"]
            aus := aus t[0]
        else if w["istCursor"]
            aus := aus CURSOR_ZEICHEN
        else
            aus := aus w["wert"]
    }
    aus := aus SubStr(text, pos)
    return aus
}
