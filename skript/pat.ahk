; Datei: pat.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Die Patienten-Kette (18.26, Erweiterungs-Abloesung - vorher in
;        der Chrome-Erweiterung): Naed markiert in Axenita die
;        Patienteninformation, kopiert sie (Strg+C) und tippt das
;        pat-Kuerzel. Daraus wird EINE Zeile fuer die
;        Excel-Patientenliste - Name, Geburtsdatum, Strasse, PLZ Ort,
;        mit Komma getrennt - und sie landet in der Zwischenablage;
;        ein Hinweis zeigt sie, in Excel setzt Strg+V ein. Ins offene
;        Feld wird NICHTS geschrieben. Die Logik ist der Spiegel von
;        pat-kette.js der App. GRUNDSATZ: Nichts wird gespeichert oder
;        ins Netz geschickt - die Angaben wandern nur von
;        Zwischenablage zu Zwischenablage.

PatKette() {
    e := PatZerlege(A_Clipboard)
    if (e["name"] = "" and e["geb"] = "") {
        Toast(TX["patNichtErkannt"], true)
        return
    }
    k := PatZeile(e)
    A_Clipboard := k
    Toast(StrReplace(TX["patFertig"], "%s", k), false)
}

; Aus der Axenita-Kopie herausholen: Name (die Zeile mit dem Geschlecht
; dahinter), Geburtsdatum (die Datumszeile, auch mit Altersklammer) und
; die zwei Zeilen unter "Adresse" - die Kantonsklammer und das Land
; fallen weg. Spiegel von TB.patRein.zerlege (pat-kette.js).
PatZerlege(text) {
    e := Map("name", "", "geb", "", "strasse", "", "ort", "")
    zeilen := StrSplit(String(text), "`n", "`r")
    adresseAb := 0
    for i, roh in zeilen {
        z := Trim(roh, " `t")
        if (e["name"] = "" and RegExMatch(z, "i)^(.+?)\s*,\s*(Weiblich|M\x{00e4}nnlich|Divers)\b", &m))
            e["name"] := Trim(m[1])
        if (e["geb"] = "" and RegExMatch(z, "^([0-3]?\d\.[01]?\d\.\d{4})(\s*\(\d+\s*J\.?\))?$", &g))
            e["geb"] := g[1]
        if (adresseAb = 0 and RegExMatch(z, "i)^Adresse$"))
            adresseAb := i
    }
    if (adresseAb > 0) {
        teile := []
        i := adresseAb + 1
        while (i <= zeilen.Length and teile.Length < 2) {
            z := Trim(zeilen[i], " `t")
            i := i + 1
            if (z = "")
                continue
            if RegExMatch(z, "i)^(Schweiz|Suisse|Svizzera|Liechtenstein|Deutschland|\x{00d6}sterreich|Frankreich|Italien)$")
                break
            teile.Push(z)
        }
        if (teile.Length >= 1)
            e["strasse"] := teile[1]
        if (teile.Length >= 2)
            e["ort"] := RegExReplace(teile[2], "\s*\([A-Z]{2}\)\s*$", "")
    }
    return e
}

; Die fertige Zeile: was erkannt wurde, mit Komma gereiht - fehlt etwas
; (z. B. keine Adresse hinterlegt), bleibt die Kette kuerzer.
PatZeile(e) {
    k := ""
    for w in [e["name"], e["geb"], e["strasse"], e["ort"]] {
        w := Trim(String(w))
        if (w = "")
            continue
        k := (k = "") ? w : (k ", " w)
    }
    return k
}
