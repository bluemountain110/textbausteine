; Datei: statistik.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Zaehlt je Baustein NUR wie oft und wann zuletzt eingefuegt
;        wurde — nie, was im Baustein steht, und nie, was in KISIM
;        steht. Die Zaehlwerte gehen an die Datenablage und erscheinen
;        in der App-Statistik unter dem Geraetenamen aus der
;        Konfiguration (Vorgabe: Spital-Skript).

global zaehlung := Map()
global zaehlungOffen := false

StatistikDatei() {
    return A_ScriptDir "\statistik-" WELT ".txt"
}

StatistikLaden() {
    global zaehlung
    if !FileExist(StatistikDatei())
        return
    try {
        roh := FileRead(StatistikDatei(), "UTF-8")
        for zeile in StrSplit(roh, "`n", "`r") {
            teile := StrSplit(zeile, "`t")
            if (teile.Length >= 3)
                zaehlung[teile[1]] := Map("anzahl", Number(teile[2]), "zuletzt", teile[3])
        }
    }
}

StatistikSichern() {
    aus := ""
    for id, e in zaehlung
        aus := aus id "`t" e["anzahl"] "`t" e["zuletzt"] "`n"
    try FileDelete(StatistikDatei())
    FileAppend(aus, StatistikDatei(), "UTF-8")
}

StatistikAnzahl(id) {
    global zaehlung
    if zaehlung.Has(String(id))
        return zaehlung[String(id)]["anzahl"]
    return 0
}

Zaehle(id) {
    global zaehlung, zaehlungOffen
    e := zaehlung.Has(id) ? zaehlung[id] : Map("anzahl", 0, "zuletzt", "")
    e["anzahl"] := e["anzahl"] + 1
    e["zuletzt"] := ZeitIso()
    zaehlung[id] := e
    zaehlungOffen := true
    StatistikSichern()
}

StatistikSchicken() {
    global zaehlung, zaehlungOffen
    if !zaehlungOffen
        return
    if !Angemeldet()
        return
    zeilen := ""
    for id, e in zaehlung {
        stueck := "{" JsonZeichenkette("benutzer") ":" JsonZeichenkette(sitzung["benutzer"])
        stueck := stueck "," JsonZeichenkette("geraet") ":" JsonZeichenkette(GERAET)
        stueck := stueck "," JsonZeichenkette("art") ":" JsonZeichenkette("baustein")
        stueck := stueck "," JsonZeichenkette("schluessel") ":" JsonZeichenkette(id)
        stueck := stueck "," JsonZeichenkette("anzahl") ":" e["anzahl"]
        stueck := stueck "," JsonZeichenkette("zuletzt") ":" JsonZeichenkette(e["zuletzt"]) "}"
        if (zeilen != "")
            zeilen := zeilen ","
        zeilen := zeilen stueck
    }
    if (zeilen = "")
        return
    a := Ruf("/rest/v1/statistik?on_conflict=benutzer,geraet,art,schluessel", "POST", "[" zeilen "]", true, "resolution=merge-duplicates,return=minimal")
    if a["ok"]
        zaehlungOffen := false
}
