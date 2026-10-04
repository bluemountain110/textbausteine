# Textbausteine — Einbau und Test: SKRIPT (Fassung 17.0)
**Etappe 11 „Sammelrunde" · 3.10.2026 · Ort: SPITAL-PC (Windows, KISIM)**

**Voraussetzung (WICHTIG):** Das App-Dokument ist durch und grün — die
Migration hat die Kürzel in die Datenablage geschrieben. Ohne sie kennt
das Skript keine ;;status-Kürzel.

**KEIN GitHub-Commit nötig** — das Skript lebt nur im Ordner am Spital-PC.

---

## A) Einbau

1. **Spital-PC, Explorer:** Das laufende Skript beenden (Symbol unten
   rechts → Beenden).
2. **Spital-PC, Explorer:** Das Zip `Textbausteine-Skript-KOMPLETT-2026-10-03.zip`
   entpacken. *Ergebnis: ein Ordner `BausteineKuerzel` (20 Dateien, inkl. AutoHotkey64.exe).*
3. **Spital-PC, Explorer:** Deinen bestehenden Ordner `BausteineKuerzel`
   **komplett** durch den neuen ersetzen (Komplett-Ordner-Regel).
4. **Spital-PC, Explorer:** Das Skript wie gewohnt starten
   (Bausteine.ahk bzw. Deine Verknüpfung).
   *Ergebnis: Symbol unten rechts; im Menü steht Fassung „17.0 - 03.10.2026".*
5. **Spital-PC:** Eine Minute warten (Abgleich holt die neuen Daten).

## B) Tests (alle am Spital-PC, in KISIM)

1. **ZUERST: die Sprungfolge von Hand prüfen** (sie ist die Grundlage von
   „Alles einfügen"). KISIM: eine EEG-Befundvorlage öffnen, mit der Maus
   ins Feld **Indikation/Fragestellung** klicken. Dann NUR die Tastatur:
   a) **2× Strg+Tab** drücken. *Ergebnis: Die Schreibmarke steht im Feld „Relevante Anamnese".*
   b) **4× Strg+Tab** drücken. *Ergebnis: Die Schreibmarke steht im ZWEITEN Befund-Kästchen (dem grossen, in das der Befund gehört).*
   c) **2× Strg+Tab** drücken. *Ergebnis: Die Schreibmarke steht im Feld „Beurteilung".*
   **Falls eine Zahl nicht stimmt:** merken und melden — im EEG-Fenster
   stehen die drei Zahlen als änderbare Felder (Sicherheitsventil), Du
   kannst sie dort sofort anpassen und trotzdem weitertesten.
2. **;;eeg öffnet den Schnell-Befund:** Schreibmarke ins Feld
   Indikation/Fragestellung, `;;eeg` tippen, Leertaste.
   *Ergebnis: Das Fenster „EEG-Schnell-Befund — Normal" öffnet, drei Reiter: Indikation & Anamnese / Befund / Beurteilung.*
3. **Normales EEG in Sekunden:** Reiter Befund: beim Grundrhythmus die
   Frequenz prüfen/tippen (z. B. 9). Reiter Beurteilung ansehen.
   *Ergebnis: „Normaler Grundrhythmus." steht automatisch da; Frequenz 7 ergäbe „Leichte Allgemeinveränderung.", unter 6 „Mittelschwere …".*
4. **Herd-Zeile:** Reiter Befund, bei „Herd 1" irgendeine Auswahl
   verstellen (z. B. Seite „links").
   *Ergebnis: Das Häkchen der Zeile springt von selbst an; Vorschau zeigt den Befundsatz UND in der Beurteilung den passenden Herd-Satz.*
5. **Satz überschreiben:** Reiter Beurteilung, beim Herd-Satz den Stift
   drücken, Text ändern, OK.
   *Ergebnis: Dein Text steht fett-grau in der Liste und wortgleich in der Vorschau.*
6. **Medikament:** Reiter Indikation & Anamnese: Lamotrigin wählen,
   Dosis „200" tippen. *Ergebnis: Vorschau-Anamnese endet mit „… Lamotrigin 200 mg."*
7. **Alles einfügen:** Schreibmarke in KISIM ins Feld
   Indikation/Fragestellung setzen (wichtig!), im Fenster „Alles
   einfügen" drücken und zuschauen.
   *Ergebnis: Indikation → Anamnese → zweites Befund-Kästchen → Beurteilung füllen sich der Reihe nach; am Ende steht die Schreibmarke hinter der Beurteilung. Formatierung (unterstrichene Titel) ist da.*
8. **;;statuscts:** In einem KISIM-Textfeld `;;statuscts` tippen, Leertaste.
   *Ergebnis: Das Status-Fenster „Status — CTS" öffnet: Reiter je Kategorie, Deine Punkte angekreuzt, Deine Standardtexte als Befund.*
9. **Überschreiben wird fett:** Einen Befund per Stift ändern (z. B. eine
   Zahl), OK, dann „Einfügen".
   *Ergebnis: Der Status steht als EIN Block an der Schreibmarke; Kategorien unterstrichen; NUR der veränderte Wortbereich (mitsamt Messwort) ist fett in Dunkelgrau — Deine unveränderten Standardtexte sind normal.*
10. **Muskeln:** `;;statusc7` tippen, Leertaste, bei der Einzelkraft den
    Knopf „Muskeln x/y" drücken, einen Muskel abwählen, „Fertig".
    *Ergebnis: Der Befundtext der Zeile baut sich neu aus den gewählten Muskeln; ☆ markiert die Zusatz-Kandidaten dieses Status.*
11. **Erklärzeile:** `;;statusstroke` öffnen.
    *Ergebnis: Unter dem mRS steht die graue Stufen-Erklärzeile — und sie fehlt im eingefügten Text.*

**Rückmeldung gesammelt** nach allen Tests (Test-Ablauf-Regel); nur ein
Fehler, der Folgendes blockiert, sofort.

## Testet sich im Alltag
- Diktat über die eingefügten Felder; weitere Status im echten Lauf.
