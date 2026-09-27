// Datei: tardoc-daten.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Tardoc-Kriterien als reine DATEN, getrennt von der Logik.
//        Wird der Tarif revidiert, wird nur diese Datei ersetzt —
//        keine Zeile Logik ändert sich. Stand: TARDOC 1.4c
//        (Quelle: OAAT-Tarifbrowser / kodia.ch, 26.09.2026).
//        Je Gruppe: Name und Mindestzahl der dokumentierten Merkmale
//        (bei den Muskelstatus-Gruppen 4/5 zählen Einzelmuskeln).
//        A verlangt mindestens 4 erfüllte Gruppen, sonst B.

"use strict";
window.TB = window.TB || {};

TB.tardocDaten = {
  fassung: "TARDOC 1.4c",
  arten: {
    neuro: {
      name: "Neurostatus",
      positionA: "MP.00.0040", positionB: "MP.00.0020",
      minGruppenA: 4,
      gruppen: {
        1: { name: "Allgemeiner Status", min: 4 },
        2: { name: "Motorik Arme", min: 2 },
        3: { name: "Motorik Beine", min: 2 },
        4: { name: "Muskelstatus Arme", min: 4, einheit: "Muskeln" },
        5: { name: "Muskelstatus Beine", min: 4, einheit: "Muskeln" },
        6: { name: "Rumpf (Motorik/Sensorik)", min: 2 },
        7: { name: "Sensorik Arme", min: 2 },
        8: { name: "Sensorik Beine", min: 2 },
        9: { name: "Koordination", min: 4 },
        10: { name: "Funktionelle Koordination/Bewegungsstörungen", min: 2 },
        11: { name: "Lagereaktionen (Kinder)", min: 2 },
        12: { name: "Primitivreflexe", min: 2 },
        13: { name: "Dysmorphiezeichen", min: 2 },
        14: { name: "Neurokutane Untersuchung", min: 1 },
        15: { name: "Orthostase-Belastungstest", min: 1 }
      }
    },
    hirn: {
      name: "Hirnnervenstatus",
      positionA: "MP.00.0060", positionB: "MP.00.0050",
      minGruppenA: 4,
      gruppen: {
        1: { name: "Allgemeiner Status", min: 3 },
        2: { name: "Sprachprüfung", min: 1 },
        3: { name: "Motorik Kopf-Hals", min: 3 },
        4: { name: "Sensorik Kopf-Hals", min: 3 },
        5: { name: "Neurologische Augenuntersuchung", min: 3 },
        6: { name: "Funktionelle Augenuntersuchung", min: 3 },
        7: { name: "Ohr und vestibulär", min: 3 },
        8: { name: "Mit Frenzelbrille", min: 3 },
        9: { name: "Primitivreflexe Gesicht", min: 2 },
        10: { name: "Neurogenetik (faziale Dysmorphie)", min: 2 }
      }
    }
  }
};
