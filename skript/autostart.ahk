; Datei: autostart.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: "Mit Windows starten" (18.10, Naed 13.10.: "im Spital ist das
;        Programm am Morgen wieder ausgestellt"). Bei JEDEM Start legt
;        das Skript seine Verknuepfung im persoenlichen Autostart-Ordner
;        an bzw. richtet sie auf DIESEN Ordner aus und raeumt alte
;        Bausteine-Verknuepfungen weg (z. B. auf einen frueheren
;        Ordnernamen - die vermutete Ursache). Abschaltbar im Menue des
;        Symbols; der Entscheid liegt im Ordner Textbausteine-Daten und
;        gilt so fuer alle Spital-Rechner.
;        GRUNDSATZ: keine Patientendaten - hier geht es nur um Dateipfade.

AutostartLink() {
    return A_Startup "\Textbausteine.lnk"
}

AutostartAusMarke() {
    return DatenOrdner() "\autostart-aus-" WELT ".txt"
}

AutostartAn() {
    return !FileExist(AutostartAusMarke())
}

AutostartPflegen() {
    ; Nur die echte Welt startet mit Windows - ein Testlauf (dev) darf
    ; die Verknuepfung nicht auf seinen Ordner umbiegen.
    if (WELT != "prod" or !AutostartAn())
        return
    ziel := A_ScriptDir "\AutoHotkey64.exe"
    args := '"' A_ScriptDir '\Bausteine.ahk"'
    ; Alte Verknuepfungen auf das Skript (anderer Name/Ordner) wegraeumen
    try {
        loop files A_Startup "\*.lnk" {
            if (A_LoopFileFullPath = AutostartLink())
                continue
            t := "", a := ""
            try FileGetShortcut(A_LoopFileFullPath, &t, , &a)
            if (InStr(t, "Start-Bausteine.cmd") or InStr(t, "Bausteine.ahk")
                or InStr(a, "Bausteine.ahk"))
                try FileDelete(A_LoopFileFullPath)
        }
    }
    stimmt := false
    if FileExist(AutostartLink()) {
        t := "", a := ""
        try {
            FileGetShortcut(AutostartLink(), &t, , &a)
            stimmt := (t = ziel and a = args)
        }
        if !stimmt
            try FileDelete(AutostartLink())
    }
    if !stimmt
        try FileCreateShortcut(ziel, AutostartLink(), A_ScriptDir, args, TX["autostartBeschreibung"])
}

AutostartMenueNachziehen() {
    if AutostartAn()
        A_TrayMenu.Check(TX["menueAutostart"])
    else
        A_TrayMenu.Uncheck(TX["menueAutostart"])
}

AutostartKlick(*) {
    if AutostartAn() {
        try FileAppend("aus", AutostartAusMarke())
        try FileDelete(AutostartLink())
        Toast(TX["autostartAus"], false)
    } else {
        try FileDelete(AutostartAusMarke())
        AutostartPflegen()
        Toast(TX["autostartAn"], false)
    }
    AutostartMenueNachziehen()
}
