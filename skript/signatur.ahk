; Datei: signatur.ahk
; Projekt: Textbausteine - Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Die Unterschrift des Selbst-Updates (18.27, Naeds
;        Sicherheitswunsch 22.10.): fassung.txt traegt als letzte Zeile
;        signatur=<hex> - eine HMAC-SHA256-Pruefsumme ueber alles davor,
;        gerechnet mit einem GEHEIMEN Schluessel, der nur lokal liegt
;        (Textbausteine-Daten\update-schluessel.txt, 64 Hex-Zeichen)
;        und NIE auf GitHub. Wer nur das GitHub-Konto kontrolliert,
;        kann damit kein Update unterschieben: ohne Schluessel keine
;        gueltige Unterschrift, und das Skript verweigert das
;        Einspielen sichtbar. Fehlt die Schluesseldatei (Schutz noch
;        nicht eingerichtet), laeuft das Update wie bisher - die
;        Menuezeile sagt es. Rechnet mit Windows-Bordmitteln (bcrypt).

SigSchluesselDatei() {
    return DatenOrdner() "\update-schluessel.txt"
}

; Der Schluessel als Hex-Text - oder leer, wenn keiner eingerichtet ist.
SigSchluessel() {
    try {
        if !FileExist(SigSchluesselDatei())
            return ""
        s := Trim(FileRead(SigSchluesselDatei(), "UTF-8"), " `t`r`n" Chr(0xFEFF))
        if RegExMatch(s, "i)^[0-9a-f]{64}$")
            return s
    }
    return ""
}

; Hex-Text -> Bytes in einem Buffer.
SigHexZuBuf(hex) {
    n := StrLen(hex) // 2
    b := Buffer(n, 0)
    loop n
        NumPut("UChar", Integer("0x" SubStr(hex, A_Index * 2 - 1, 2)), b, A_Index - 1)
    return b
}

; HMAC-SHA256 ueber die UTF-8-Bytes von text, als GROSSE Hex-Zeichen.
; Leer bei jedem Fehler - der Aufrufer behandelt leer wie "falsch".
SigHmacHex(schluesselHex, text) {
    schl := SigHexZuBuf(schluesselHex)
    daten := Buffer(StrPut(text, "UTF-8"), 0)
    dn := StrPut(text, daten, "UTF-8") - 1   ; ohne Schlusszeichen
    alg := 0
    ; 0x8 = BCRYPT_ALG_HANDLE_HMAC_FLAG
    if DllCall("bcrypt\BCryptOpenAlgorithmProvider", "Ptr*", &alg,
        "WStr", "SHA256", "Ptr", 0, "UInt", 0x8, "UInt")
        return ""
    hex := ""
    hash := 0
    if !DllCall("bcrypt\BCryptCreateHash", "Ptr", alg, "Ptr*", &hash,
        "Ptr", 0, "UInt", 0, "Ptr", schl, "UInt", schl.Size, "UInt", 0, "UInt") {
        if !DllCall("bcrypt\BCryptHashData", "Ptr", hash, "Ptr", daten,
            "UInt", dn, "UInt", 0, "UInt") {
            aus := Buffer(32, 0)
            if !DllCall("bcrypt\BCryptFinishHash", "Ptr", hash, "Ptr", aus,
                "UInt", 32, "UInt", 0, "UInt") {
                loop 32
                    hex .= Format("{:02X}", NumGet(aus, A_Index - 1, "UChar"))
            }
        }
        DllCall("bcrypt\BCryptDestroyHash", "Ptr", hash)
    }
    DllCall("bcrypt\BCryptCloseAlgorithmProvider", "Ptr", alg, "UInt", 0)
    return hex
}

; Prueft die Unterschrift des fassung.txt-Textes.
; Ergebnis: "ok" | "kein-schluessel" | "fehlt" | "falsch".
SigPruefeText(text) {
    schluessel := SigSchluessel()
    if (schluessel = "")
        return "kein-schluessel"
    pos := InStr(text, "signatur=", true, -1)
    if !pos
        return "fehlt"
    zeile := SubStr(text, pos)
    if !RegExMatch(zeile, "i)^signatur=([0-9a-f]{64})", &m)
        return "fehlt"
    soll := StrUpper(m[1])
    ist := SigHmacHex(schluessel, SubStr(text, 1, pos - 1))
    return (ist != "" and ist = soll) ? "ok" : "falsch"
}
