# Textbausteine — Einbau und Test: ERWEITERUNG (Fassung 17.0)
**Etappe 11 „Sammelrunde" · 3.10.2026 · Orte: PRAXIS-PC (Chrome/Axenita) und Dein MAC (GitHub)**

**Voraussetzung:** Das App-Dokument ist durch und grün (die Kürzel sind
in der Datenablage).

Das Zip enthält ZWEI byteweise identische Ordner:
`BausteineErweiterung` (für den Praxis-PC) und `erweiterung` (für Dein
GitHub-Repo — die Erweiterung liegt dort als Quelle mit).

---

## A) Einbau am PRAXIS-PC

1. **Praxis-PC, Explorer:** Das Zip entpacken; den bestehenden Ordner
   `BausteineErweiterung` **komplett** durch den neuen ersetzen
   (33 Dateien).
2. **Praxis-PC, Chrome:** `chrome://extensions` öffnen → bei der
   Bausteine-Erweiterung den **Aktualisieren-Pfeil** drücken (↻).
   *Ergebnis: Die Karte zeigt Version 17.0.*
3. **Praxis-PC, Chrome:** Das Erweiterungs-Symbol anklicken.
   *Ergebnis: Im Popup steht „17.0 · 03.10.2026".*
4. **Praxis-PC, Chrome:** **JEDE offene Axenita-Seite mit F5 neu laden**
   — die alte Lehre: ohne Neuladen liest die Seite noch die alte Fassung.

## B) Einbau am MAC (GitHub)

5. **Mac, Finder + Chrome (github.com, Webseite):** Im Repo den Ordner
   `erweiterung` komplett durch den neuen ersetzen und hochladen.
   **GitHub-Commit nötig — Commit-Text:**
   `Erweiterung 17.0 — EEG-Schnell-Befund und Status-Fenster für Axenita, Status-Logik als App-Kopien 🧩`

## C) Tests (am Praxis-PC, in Chrome)

1. **Übungsfeld zuerst** (gefahrlos): Erweiterungs-Popup → Übungsfeld
   öffnen. `;;statuscts` tippen, Leertaste.
   *Ergebnis: Das Status-Fenster legt sich über die Seite: Deine Punkte angekreuzt, Deine Standardtexte als Befund, Kategorien als Zwischentitel.*
2. **Übungsfeld:** Einen Befund per Stift überschreiben (eine Zahl
   ändern), dann „Einfügen".
   *Ergebnis: Der Status steht als EIN Block im Feld; NUR der veränderte Wortbereich fett in Dunkelgrau, Kategorien unterstrichen.*
3. **Übungsfeld:** `;;eeg` tippen, Leertaste.
   *Ergebnis: Der Schnell-Befund öffnet mit den Abschnitten Indikation / Relevante Anamnese / Befund (Dreiknopf Ableitung + Vigilanz, Artefakte, Herd-/Transienten-/Entladungs-Zeilen) / Kern-Beurteilung / Beurteilung.*
4. **Übungsfeld:** Beim Grundrhythmus Frequenz 7 eintragen.
   *Ergebnis: In der Kern-Beurteilung erscheint „Leichte Allgemeinveränderung." — der Stift daneben überschreibt den Satz.*
5. **Übungsfeld:** „Einfügen" drücken.
   *Ergebnis: EIN Block „Befund / Beurteilung" (unterstrichen, Leerzeile dazwischen) steht im Feld; „Indikation kopieren" und „Anamnese kopieren" legen die beiden Texte einzeln in die Zwischenablage.*
6. **Axenita, echter Lauf:** In einem Verlaufs-/Befundfeld
   `;;statuscts` und danach einmal `;;statusmemory` ausprobieren.
   *Ergebnis: wie im Übungsfeld — Fenster an der gemerkten Stelle, Einfügen an der Schreibmarke; Esc bringt das Kürzel zurück.*
7. **Vorrang echter Bausteine:** Ein normales Baustein-Kürzel (z. B.
   Dein ;;vk) tippen.
   *Ergebnis: funktioniert unverändert wie bisher.*

**Rückmeldung gesammelt** nach allen Runden aller drei Orte — dann kommt
die Sammel-Nachbesserung, danach Quartett und Übergabe (ENMG).

## Testet sich im Alltag
- Dragon-Diktat in die eingefügten Status; MRI-Funktionen (unangetastet mitgeliefert).
