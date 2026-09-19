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
global WELT := "prod"

; Der Name, unter dem dieses Geraet in der Statistik erscheint.
global GERAET := "Spital-Skript"

global ADRESSEN := Map()
ADRESSEN["dev"] := "https://ybzgzdyjsdtszqechkup.supabase.co"
ADRESSEN["prod"] := "https://qotxsasbnoqokvzhimtw.supabase.co"

global SCHLUESSELN := Map()
SCHLUESSELN["dev"] := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemd6ZHlqc2R0c3pxZWNoa3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjA1NDEsImV4cCI6MjEwNTEzNjU0MX0.1swWFwk1OGROnXDhT47kp5E3rSqsmhwv0wx2Iei9ZSA"
SCHLUESSELN["prod"] := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHhzYXNibm9xb2t2emhpbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE5MjIsImV4cCI6MjEwNTEzNzkyMn0.UBwZMWYTBNS9pj0bL3TPDCAmI3Qsn87XM3yCuNxzyAs"

global ADRESSE := ADRESSEN[WELT]
global SCHLUESSEL := SCHLUESSELN[WELT]
