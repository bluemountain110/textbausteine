; Datei: konfiguration.ahk
; Projekt: Textbausteine — Teil: Windows-Skript (AutoHotkey-Ordner)
; Zweck: Das Gegenstueck zu konfiguration.js der App: die Adresse und
;        der oeffentliche Schluessel der Datenablage, plus die Wahl der
;        Welt. Der oeffentliche Schluessel DARF hier stehen — er
;        oeffnet ohne Anmeldung nichts. Der geheime Schluessel
;        (service_role) gehoert NIE in diese Datei.
;        GRUNDSATZ: In diesem Skript werden nie Patientendaten
;        gespeichert oder verschickt.

; Welt: "prod" ist die normale Welt mit Deinen echten Bausteinen.
; Fuer einen Test gegen die Testwelt hier "dev" eintragen und das
; Skript neu starten.
global FASSUNG := "18.17 - 15.10.2026"
; Wie oft das Skript selbst nach Nachschub schaut. Kurz gewählt,
; weil die Vorab-Prüfung winzig ist und die ganze Sammlung nur bei
; einer echten Änderung geholt wird (Näds Entscheid 23.9.).
global TAKT_MS := 30000
; 18.16: Hier holt das Skript seine neuen Fassungen (Selbst-Update). Es
; ist der Ordner skript der App auf GitHub, veroeffentlicht ueber
; GitHub Pages - derselbe Weg, auf dem die App in den Browser kommt.
global UPDATE_ADRESSE := "https://bluemountain110.github.io/textbausteine/skript/"
global amEinsetzen := false   ; wahr, solange ein Kuerzel eingesetzt wird
global WELT := "prod"

; Der Name, unter dem dieses Geraet in der Statistik erscheint, wenn
; noch kein Standort gewaehlt ist (Rueckfall — normal gilt der
; Standortname aus standort.ahk).
global GERAET := "Spital-Skript"

; Programme, die als Browser gelten (fuer die Standort-Weiche: in der
; Praxis gehoeren Browserfenster der Chrome-Erweiterung).
global BROWSER_PROZESSE := ["chrome.exe", "msedge.exe", "firefox.exe"]

; Programme, die den Inhalt der Zwischenablage langsam abholen (18.14,
; Word in der Praxis): nach Strg+V so lange warten, bevor die alte
; Zwischenablage zurueckkommt. Haengt in Word doch noch der alte Inhalt
; an, diese Zahl erhoehen (z. B. 1000).
global LANGSAME_PROGRAMME := ["WINWORD.EXE", "OUTLOOK.EXE", "olk.exe", "EXCEL.EXE", "POWERPNT.EXE"]
global LANGSAM_PAUSE_MS := 700

; Seit 15.14 merkt sich das Skript Anmeldung, Standort, Statistik und
; den letzten Bausteinstand NICHT mehr im Skript-Ordner (der bei jeder
; Lieferung komplett ersetzt wird), sondern eine Ebene hoeher im
; Ordner Textbausteine-Daten — der ueberlebt jede Lieferung und liegt
; auf dem Netz-Home fuer alle Spital-Rechner (Naed 29.9.).
DatenOrdner() {
    ordner := A_ScriptDir "\..\Textbausteine-Daten"
    ; 18.16 Sicherheitsnetz: Wurde das Zip eine Ebene zu tief entpackt
    ; (Ordner im Ordner), gilt der Merkordner eine Ebene weiter oben -
    ; so gehen Anmeldung und Standort nicht verloren.
    if (!DirExist(ordner) and DirExist(A_ScriptDir "\..\..\Textbausteine-Daten"))
        ordner := A_ScriptDir "\..\..\Textbausteine-Daten"
    if !DirExist(ordner)
        try DirCreate(ordner)
    return ordner
}

global ADRESSEN := Map()
ADRESSEN["dev"] := "https://ybzgzdyjsdtszqechkup.supabase.co"
ADRESSEN["prod"] := "https://qotxsasbnoqokvzhimtw.supabase.co"

global SCHLUESSELN := Map()
SCHLUESSELN["dev"] := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemd6ZHlqc2R0c3pxZWNoa3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjA1NDEsImV4cCI6MjEwNTEzNjU0MX0.1swWFwk1OGROnXDhT47kp5E3rSqsmhwv0wx2Iei9ZSA"
SCHLUESSELN["prod"] := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHhzYXNibm9xb2t2emhpbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE5MjIsImV4cCI6MjEwNTEzNzkyMn0.UBwZMWYTBNS9pj0bL3TPDCAmI3Qsn87XM3yCuNxzyAs"

global ADRESSE := ADRESSEN[WELT]
global SCHLUESSEL := SCHLUESSELN[WELT]
