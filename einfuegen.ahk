; Datei: einfuegen.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Der Einfuege-Weg, uebernommen aus der am 14.9.2026 in KISIM
;        bewiesenen RTF-Bruecke: Text und RTF gleichzeitig in die
;        Zwischenablage legen, Strg+V senden, danach die alte
;        Zwischenablage wiederherstellen. Neu dazu: das Lesen des
;        RTF aus der Zwischenablage (fuer ;;neu) und die
;        Cursor-Stellung nach dem Einfuegen.

OeffneZwischenablage() {
    versuch := 0
    while (versuch < 12) {
        if DllCall("OpenClipboard", "Ptr", A_ScriptHwnd)
            return true
        Sleep 40
        versuch := versuch + 1
    }
    return false
}

SetzeZwischenablage(text, rtf) {
    static CF_UNICODETEXT := 13
    static CF_RTF := DllCall("RegisterClipboardFormat", "Str", "Rich Text Format", "UInt")
    if !OeffneZwischenablage()
        return false
    DllCall("EmptyClipboard")
    groesse := (StrLen(text) + 1) * 2
    h := DllCall("GlobalAlloc", "UInt", 0x42, "Ptr", groesse, "Ptr")
    p := DllCall("GlobalLock", "Ptr", h, "Ptr")
    StrPut(text, p, StrLen(text) + 1, "UTF-16")
    DllCall("GlobalUnlock", "Ptr", h)
    DllCall("SetClipboardData", "UInt", CF_UNICODETEXT, "Ptr", h)
    if (rtf != "") {
        groesse := StrLen(rtf) + 1
        h := DllCall("GlobalAlloc", "UInt", 0x42, "Ptr", groesse, "Ptr")
        p := DllCall("GlobalLock", "Ptr", h, "Ptr")
        StrPut(rtf, p, StrLen(rtf) + 1, "CP0")
        DllCall("GlobalUnlock", "Ptr", h)
        DllCall("SetClipboardData", "UInt", CF_RTF, "Ptr", h)
    }
    DllCall("CloseClipboard")
    return true
}

LiesRtfAusZwischenablage() {
    static CF_RTF := DllCall("RegisterClipboardFormat", "Str", "Rich Text Format", "UInt")
    if !DllCall("IsClipboardFormatAvailable", "UInt", CF_RTF)
        return ""
    if !OeffneZwischenablage()
        return ""
    rtf := ""
    h := DllCall("GetClipboardData", "UInt", CF_RTF, "Ptr")
    if h {
        p := DllCall("GlobalLock", "Ptr", h, "Ptr")
        if p {
            rtf := StrGet(p, "CP0")
            DllCall("GlobalUnlock", "Ptr", h)
        }
    }
    DllCall("CloseClipboard")
    return rtf
}

; ---- Der ganze Einfuege-Ablauf ------------------------------------------
; ziel: Fenster-Kennung, die vorher aktiv war (0 = nicht wechseln).
; cursorZurueck: wie viele Zeichen nach dem Einfuegen nach links.
FuegeEin(text, rtf, ziel, cursorZurueck) {
    alte := ClipboardAll()
    if !SetzeZwischenablage(text, rtf) {
        A_Clipboard := alte
        return false
    }
    if (ziel != 0) {
        try WinActivate(ziel)
        Sleep 150
    }
    Sleep 120
    Send "^v"
    Sleep 350
    if (cursorZurueck > 0)
        Send "{Left " cursorZurueck "}"
    A_Clipboard := alte
    return true
}
