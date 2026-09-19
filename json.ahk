; Datei: json.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Ein kleiner, strenger JSON-Leser und -Schreiber. Die
;        Datenablage antwortet in JSON; AutoHotkey bringt keinen
;        eigenen Leser mit. Gelesen wird alles, was die Ablage
;        liefert: Objekte, Listen, Zeichenketten (mit Fluchtzeichen
;        und \uXXXX), Zahlen, true, false, null.
;        Die Logik ist 1:1 in der Pruefsuite (Node) gespiegelt und
;        dort mit echten Supabase-Antworten getestet.

JsonLies(text) {
    pos := 1
    wert := JsonWert(text, &pos)
    return wert
}

JsonLeer(text, &pos) {
    while (pos <= StrLen(text)) {
        z := SubStr(text, pos, 1)
        if (z != " " and z != "`t" and z != "`n" and z != "`r")
            break
        pos := pos + 1
    }
}

JsonWert(text, &pos) {
    JsonLeer(text, &pos)
    z := SubStr(text, pos, 1)
    if (z = "{")
        return JsonObjekt(text, &pos)
    if (z = "[")
        return JsonListe(text, &pos)
    if (z = Chr(34))
        return JsonText(text, &pos)
    if (SubStr(text, pos, 4) = "true") {
        pos := pos + 4
        return true
    }
    if (SubStr(text, pos, 5) = "false") {
        pos := pos + 5
        return false
    }
    if (SubStr(text, pos, 4) = "null") {
        pos := pos + 4
        return ""
    }
    return JsonZahl(text, &pos)
}

JsonObjekt(text, &pos) {
    aus := Map()
    pos := pos + 1
    JsonLeer(text, &pos)
    if (SubStr(text, pos, 1) = "}") {
        pos := pos + 1
        return aus
    }
    loop {
        JsonLeer(text, &pos)
        name := JsonText(text, &pos)
        JsonLeer(text, &pos)
        pos := pos + 1
        wert := JsonWert(text, &pos)
        aus[name] := wert
        JsonLeer(text, &pos)
        z := SubStr(text, pos, 1)
        pos := pos + 1
        if (z = "}")
            break
        if (z != ",")
            break
    }
    return aus
}

JsonListe(text, &pos) {
    aus := []
    pos := pos + 1
    JsonLeer(text, &pos)
    if (SubStr(text, pos, 1) = "]") {
        pos := pos + 1
        return aus
    }
    loop {
        wert := JsonWert(text, &pos)
        aus.Push(wert)
        JsonLeer(text, &pos)
        z := SubStr(text, pos, 1)
        pos := pos + 1
        if (z = "]")
            break
        if (z != ",")
            break
    }
    return aus
}

JsonText(text, &pos) {
    aus := ""
    pos := pos + 1
    while (pos <= StrLen(text)) {
        z := SubStr(text, pos, 1)
        if (z = Chr(34)) {
            pos := pos + 1
            break
        }
        if (z = "\") {
            f := SubStr(text, pos + 1, 1)
            if (f = "n")
                aus := aus "`n"
            else if (f = "r")
                aus := aus "`r"
            else if (f = "t")
                aus := aus "`t"
            else if (f = "b")
                aus := aus Chr(8)
            else if (f = "f")
                aus := aus Chr(12)
            else if (f = "u") {
                aus := aus Chr("0x" SubStr(text, pos + 2, 4))
                pos := pos + 4
            }
            else
                aus := aus f
            pos := pos + 2
            continue
        }
        aus := aus z
        pos := pos + 1
    }
    return aus
}

JsonZahl(text, &pos) {
    anfang := pos
    while (pos <= StrLen(text)) {
        z := SubStr(text, pos, 1)
        if InStr("0123456789+-.eE", z)
            pos := pos + 1
        else
            break
    }
    stueck := SubStr(text, anfang, pos - anfang)
    if (stueck = "")
        return ""
    return Number(stueck)
}

; ---- Schreiben: nur das Wenige, das das Skript braucht ------------------
JsonZeichenkette(s) {
    aus := StrReplace(String(s), "\", "\\")
    aus := StrReplace(aus, Chr(34), "\" Chr(34))
    aus := StrReplace(aus, "`r", "\r")
    aus := StrReplace(aus, "`n", "\n")
    aus := StrReplace(aus, "`t", "\t")
    return Chr(34) aus Chr(34)
}
