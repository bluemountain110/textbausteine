; Datei: zwischenablage.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Der Zwischenablage-Waechter (Etappe 9): Kopiert die App einen
;        Status oder Baustein, steckt das fertige KISIM-RTF unsichtbar
;        als <!--TBRTF:...--> im HTML der Zwischenablage (bewiesen am
;        14.9.2026). Dieser Waechter erkennt die Marke, legt das RTF
;        als echtes Rich-Text-Format daneben und meldet sich kurz -
;        danach genuegt in KISIM ein normales Strg+V. KEIN zweites
;        Kuerzel, kein Handgriff (Naeds Entscheid vom 26.9.).
;        Er wird nur taetig, wenn die Marke da ist und noch kein
;        echtes RTF beiliegt; eigene Umbauten loesen ihn nicht
;        erneut aus (Stillhalte-Schalter).

global zwischenablageStill := false
OnClipboardChange(ZwischenablageGewandelt)

ZwischenablageGewandelt(art) {
    global zwischenablageStill
    if (art != 1)
        return
    if (zwischenablageStill)
        return
    static CF_RTF := DllCall("RegisterClipboardFormat", "Str", "Rich Text Format", "UInt")
    if DllCall("IsClipboardFormatAvailable", "UInt", CF_RTF)
        return
    html := LiesHtmlAusZwischenablage()
    if (html = "")
        return
    stelle := InStr(html, "<!--TBRTF:")
    if (stelle = 0)
        return
    ende := InStr(html, "-->", , stelle)
    if (ende = 0)
        return
    rtf := SubStr(html, stelle + 10, ende - stelle - 10)
    if (SubStr(rtf, 1, 5) != "{\rtf")
        return
    text := A_Clipboard
    zwischenablageStill := true
    SetzeZwischenablage(text, rtf)
    SetTimer(ZwischenablageFrei, -400)
    Toast(TX["kisimBereit"], false)
}

ZwischenablageFrei() {
    global zwischenablageStill
    zwischenablageStill := false
}

; HTML-Fassung der Zwischenablage lesen (Windows legt sie als UTF-8 ab).
LiesHtmlAusZwischenablage() {
    static CF_HTML := DllCall("RegisterClipboardFormat", "Str", "HTML Format", "UInt")
    if !DllCall("IsClipboardFormatAvailable", "UInt", CF_HTML)
        return ""
    if !OeffneZwischenablage()
        return ""
    html := ""
    h := DllCall("GetClipboardData", "UInt", CF_HTML, "Ptr")
    if h {
        p := DllCall("GlobalLock", "Ptr", h, "Ptr")
        if p {
            html := StrGet(p, "UTF-8")
            DllCall("GlobalUnlock", "Ptr", h)
        }
    }
    DllCall("CloseClipboard")
    return html
}
