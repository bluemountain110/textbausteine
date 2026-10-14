; Datei: fenster-masken.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey v2)
; Zweck: Das Masken-Fenster der Etappe 8 - Spiegel des Fensters in
;        App und Erweiterung: Kaestchen (mit ueberschreibbaren
;        Ankreuz-Texten), Auswahlen, Felder und die Bausteinwahl je
;        {{Aus Kategorie:...}}, alles in der Reihenfolge des Textes,
;        mit Vorschau. Was gerade nicht gilt, wird grau (nicht
;        versteckt). Danach oeffnen sich die gewaehlten Bausteine der
;        Reihe nach; am Ende setzt kuerzel.ahk alles ein.
;        Eigene Datei, weil fenster.ahk schon an der 600-Zeilen-
;        Grenze steht. GRUNDSATZ: keine Patientendaten.

; Alle Bausteine einer Kategorie (ausser dem Bericht selbst).
MaskeBausteineFuer(kategorie, ausserId) {
    global bausteine
    aus := []
    for x in bausteine {
        if (String(x["id"]) == String(ausserId))
            continue
        kat := x.Has("kategorie") ? Trim(String(x["kategorie"])) : ""
        if (kat == Trim(String(kategorie)))
            aus.Push(x)
    }
    return aus
}

; Das Masken-Fenster. beiFertig(zustand, reihen) - reihen: je
; Kategorie-Fundstelle Map("nummer", n, "gewaehlt", [Bausteine] in
; Anklick-Reihenfolge). beiAbbruch().
; okText: Beschriftung des OK-Knopfs; leer = selbst bestimmen.
MaskenGuiZeigen(b, analyse, beiFertig, beiAbbruch, okText := "") {
    g := Gui("+AlwaysOnTop", TX["lueckenTitel"])
    g.SetFont("s10", "Segoe UI")
    titel := String(b.Has("titel") ? b["titel"] : "")
    g.Add("Text", "w560", titel != "" ? titel : ";;" b["kuerzel"])
    zeilen := []
    kaestchenCtrl := Map()
    textCtrl := Map()
    antwortCtrl := Map()
    katWahl := []
    for z in analyse["zeilen"] {
        ctrls := []
        typ := z["typ"]
        if (typ == "ankreuz") {
            k := ""
            for kx in analyse["kaestchen"] {
                if (kx["name"] == z["name"])
                    k := kx
            }
            box := g.Add("Checkbox", "y+8", z["name"])
            box.Value := (IsObject(k) and k["an"]) ? 1 : 0
            kaestchenCtrl[z["name"]] := box
            ctrls.Push(box)
            if (IsObject(k) and k["hatText"]) {
                hoehe := (InStr(k["text"], "`n") ? "r3" : "r2")
                ed := g.Add("Edit", "w560 " hoehe, k["text"])
                textCtrl[z["name"]] := ed
                ctrls.Push(ed)
            }
        }
        else if (typ == "auswahl") {
            ctrls.Push(g.Add("Text", "y+8", z["name"]))
            feld := g.Add("DropDownList", "w560 Choose1", z["optionen"])
            antwortCtrl[z["name"]] := feld
            ctrls.Push(feld)
        }
        else if (typ == "feld") {
            ctrls.Push(g.Add("Text", "y+8", z["name"]))
            feld := g.Add("Edit", "w560", z["vorgabe"])
            antwortCtrl[z["name"]] := feld
            ctrls.Push(feld)
        }
        else if (typ == "kategorie") {
            ctrls.Push(g.Add("Text", "y+8",
                StrReplace(TX["maskeKategorie"], "%s", z["kategorie"])))
            passende := MaskeBausteineFuer(z["kategorie"], b["id"])
            wahl := Map("nummer", z["nummer"], "gewaehlt", [], "zeile", z)
            katWahl.Push(wahl)
            if (passende.Length = 0)
                ctrls.Push(g.Add("Text", "y+2 w560", TX["maskeKategorieLeer"]))
            else {
                for x in passende {
                    xt := String(x.Has("titel") ? x["titel"] : "")
                    bx := g.Add("Checkbox", "y+2",
                        xt != "" ? xt : ";;" String(x["kuerzel"]))
                    bx.OnEvent("Click", MaskeKatKlick.Bind(wahl, x, bx))
                    ctrls.Push(bx)
                }
            }
        }
        zeilen.Push(Map("bedingungen", z["sichtbarWenn"], "ctrls", ctrls))
    }
    g.Add("Text", "y+10", TX["vorschau"])
    vorschau := g.Add("Edit", "w560 r6 ReadOnly")
    ab := g.Add("Button", "y+10 w200 h32", TX["abbrechen"])
    if (okText = "")
        okText := (analyse["kategorienAnzahl"] > 0) ? TX["maskeWeiter"] : TX["lueckenEinfuegen"]
    ok := g.Add("Button", "x+20 w200 h32 Default", okText)
    ZustandJetzt() {
        kaestchen := Map()
        for name, c in kaestchenCtrl
            kaestchen[name] := c.Value ? true : false
        antworten := Map()
        for name, c in antwortCtrl
            antworten[name] := (c.Type = "DDL") ? c.Text : c.Value
        texte := Map()
        for name, c in textCtrl
            texte[name] := c.Value
        return Map("kaestchen", kaestchen, "antworten", antworten, "texte", texte)
    }
    GrauNach(zustand) {
        for z in zeilen {
            sichtbar := true
            for bed in z["bedingungen"] {
                if !MaskeBedingungGilt(bed, zustand)
                    sichtbar := false
            }
            for c in z["ctrls"]
                c.Enabled := sichtbar
        }
        for name, ed in textCtrl {
            if (kaestchenCtrl.Has(name) and !kaestchenCtrl[name].Value)
                ed.Enabled := false
        }
    }
    VorschauNeu(*) {
        zustand := ZustandJetzt()
        GrauNach(zustand)
        katVorschau := []
        for w in katWahl {
            t := ""
            for x in w["gewaehlt"]
                t := t (t != "" ? "`n" : "") Chr(0xAB) String(x.Has("titel") ? x["titel"] : x["kuerzel"]) Chr(0xBB)
            katVorschau.Push(t)
        }
        t := MaskeTextAnwenden(HtmlNachText(b["text"]), zustand, katVorschau, false)
        t := TextAuswerten(t, zustand["antworten"], "fenster")
        t := StrReplace(t, CURSOR_ZEICHEN, "")
        vorschau.Value := SubStr(t, 1, 900)
    }
    for z in zeilen {
        for c in z["ctrls"] {
            if (c.Type = "Checkbox")
                c.OnEvent("Click", VorschauNeu)
            else if (c.Type = "Edit" or c.Type = "DDL")
                c.OnEvent("Change", VorschauNeu)
        }
    }
    Fertig(*) {
        zustand := ZustandJetzt()
        reihen := []
        for w in katWahl {
            sichtbar := true
            for bed in w["zeile"]["sichtbarWenn"] {
                if !MaskeBedingungGilt(bed, zustand)
                    sichtbar := false
            }
            reihen.Push(Map("nummer", w["nummer"],
                "gewaehlt", sichtbar ? w["gewaehlt"].Clone() : []))
        }
        g.Destroy()
        ; Erst NACH dem Fenster-Ereignis weitermachen (SetTimer):
        ; sonst kann AutoHotkey den laufenden Rueckruf freigeben,
        ; waehrend er noch arbeitet - das war der KISIM-Absturz.
        SetTimer(beiFertig.Bind(zustand, reihen), -25)
    }
    Abbruch(*) {
        g.Destroy()
        SetTimer(beiAbbruch, -25)
    }
    ab.OnEvent("Click", Abbruch)
    ok.OnEvent("Click", Fertig)
    g.OnEvent("Escape", Abbruch)
    g.OnEvent("Close", Abbruch)
    VorschauNeu()
    g.Show()
}

; Klick auf einen Baustein in einer Kategorie-Liste: merkt die
; Anklick-Reihenfolge (so werden sie spaeter eingefuegt, F2).
MaskeKatKlick(wahl, xx, box2, *) {
    i := 0
    for j, e in wahl["gewaehlt"] {
        if (String(e["id"]) == String(xx["id"]))
            i := j
    }
    if (box2.Value and i = 0)
        wahl["gewaehlt"].Push(xx)
    else if (!box2.Value and i > 0)
        wahl["gewaehlt"].RemoveAt(i)
}

; Ein kleines Luecken-Fenster fuer UNTERbausteine: wie LueckenFenster,
; aber statt einzusetzen gibt es die Antworten zurueck.
MaskenUnterLuecken(b, luecken, beiFertig, beiAbbruch, okText := "") {
    g := Gui("+AlwaysOnTop", TX["lueckenTitel"])
    g.SetFont("s10", "Segoe UI")
    titel := String(b.Has("titel") ? b["titel"] : "")
    g.Add("Text", "w420", titel != "" ? titel : ";;" b["kuerzel"])
    felder := []
    for l in luecken {
        g.Add("Text", "y+8", l["beschriftung"])
        if (l["art"] = "auswahl")
            feld := g.Add("DropDownList", "w420 Choose1", l["optionen"])
        else
            feld := g.Add("Edit", "w420", l["vorgabe"])
        felder.Push(Map("beschriftung", l["beschriftung"], "feld", feld))
    }
    ab := g.Add("Button", "y+12 w200 h32", TX["abbrechen"])
    ok := g.Add("Button", "x+20 w200 h32 Default", (okText != "") ? okText : TX["maskeWeiter"])
    Fertig(*) {
        a := Map()
        for e in felder
            a[e["beschriftung"]] := (e["feld"].Type = "DDL") ? e["feld"].Text : e["feld"].Value
        g.Destroy()
        SetTimer(beiFertig.Bind(a), -25)
    }
    Abbruch(*) {
        g.Destroy()
        SetTimer(beiAbbruch, -25)
    }
    ab.OnEvent("Click", Abbruch)
    ok.OnEvent("Click", Fertig)
    g.OnEvent("Escape", Abbruch)
    g.OnEvent("Close", Abbruch)
    g.Show()
    if (felder.Length > 0)
        felder[1]["feld"].Focus()
}
