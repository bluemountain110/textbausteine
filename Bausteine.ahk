; Datei: Bausteine.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Die Hauptdatei — sie laedt die Teile in fester Reihenfolge,
;        startet den Tasten-Horcher, holt jede Minute die Bausteine
;        und stellt das Symbol unten rechts mit seinem Menue. Beenden
;        heisst: Symbol -> Beenden, oder den Ordner loeschen — das
;        Skript installiert nichts und aendert nichts am System.
;        GRUNDSATZ: keine Patientendaten in Speicher, Ablage oder Netz.

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

#Include texte.ahk
#Include konfiguration.ahk
#Include json.ahk
#Include netz.ahk
#Include makros.ahk
#Include einfuegen.ahk
#Include statistik.ahk
#Include fenster.ahk
#Include kuerzel.ahk

; ---- Symbol-Menue unten rechts ------------------------------------------
A_TrayMenu.Delete()
A_TrayMenu.Add(TX["menueFaecher"], (*) => FaecherFenster())
A_TrayMenu.Add(TX["menueHolen"], MenueHolen)
A_TrayMenu.Add(TX["menueAnmelden"], (*) => AnmeldeFenster())
A_TrayMenu.Add(TX["menueAbmelden"], MenueAbmelden)
A_TrayMenu.Add()
A_TrayMenu.Add(TX["menueBeenden"], (*) => ExitApp())
A_TrayMenu.Default := TX["menueFaecher"]
A_IconTip := TX["appName"] " (" WELT ")"

MenueHolen(*) {
    if Holen(false)
        Toast(TX["geholt"] bausteine.Length, false)
}

MenueAbmelden(*) {
    Abmelden()
    Toast(TX["abgemeldet"], false)
}

; ---- Anlauf --------------------------------------------------------------
SitzungLaden()
StatistikLaden()
CacheLaden()
HorcherStart()
if !Angemeldet() {
    AnmeldeFenster()
}
else {
    if Holen(true)
        Toast(TX["bereit"] bausteine.Length, false)
    else if (bausteine.Length > 0)
        Toast(TX["offlineCache"], false)
    else
        Toast(TX["keineBausteine"], true)
}
SetTimer(MinutenTakt, 60000)

MinutenTakt() {
    if Angemeldet()
        Holen(true)
}
