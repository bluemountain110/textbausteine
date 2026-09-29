// Datei: tardoc-daten.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Tardoc-Kriterien als reine DATEN, getrennt von der Logik.
//        Wird der Tarif revidiert, wird nur diese Datei ersetzt —
//        keine Zeile Logik ändert sich. Stand: TARDOC 1.4c
//        (Quelle: LKAAT-Browser browser.tartools.ch — massgeblich lt. Näd 28.9.;
//        Grenzen dort am 28.9.2026 gegengeprüft: 0020 B "bis zu 3"/23 Min,
//        0040 A "4+"/46 Min, 0060 A 35 Min).
//        Je Gruppe: Name und Mindestzahl der dokumentierten Merkmale
//        (bei den Muskelstatus-Gruppen 4/5 zählen Einzelmuskeln).
//        A verlangt mindestens 4 erfüllte Gruppen, sonst B.
//        Neu 27.9. (Näds Wunsch): je Gruppe die MERKMALE als von
//        Claude gestraffte, eng am Original gehaltene Zusammenfassung
//        plus die Original-Links (LKAAT) — für das Nachlese-Fenster.

"use strict";
window.TB = window.TB || {};

TB.tardocDaten = {
  fassung: "TARDOC 1.4c",
  arten: {
    neuro: {
      name: "Neurostatus",
      positionA: "MP.00.0040", positionB: "MP.00.0020",
      titelA: "Neurologische Exploration A", titelB: "Neurologische Exploration B",
      dauerA: 46, dauerB: 23,
      linkA: "https://browser.tartools.ch/de/lkaat/data/K/MP.00.0040",
      linkB: "https://browser.tartools.ch/de/lkaat/data/K/MP.00.0020",
      minGruppenA: 4,
      gruppen: {
        1: { name: "Allgemeiner Status", min: 4, merkmale: "Allgemeinzustand, Vigilanz, Kooperationsfähigkeit, Hand-/Fussdominanz, Grösse, Gewicht, Blutdruck, Puls, Gefässpulsatilität (A. carotis/temporalis), Gefässauskultation" },
        2: { name: "Motorik Arme", min: 2, merkmale: "Trophik, Tonus, allgemeine Rohkraft, Bewegungsmuster, allgemeine Gangprüfung, Reflexprüfung (mind. ein Eigen-, Fremd- oder pathologischer Reflex), Hüpfen, Rennen, Fersen-/Spitzengang, Stuhl-/Stufensteigen, Aufstehen vom Boden, Trendelenburgzeichen" },
        3: { name: "Motorik Beine", min: 2, merkmale: "wie Gruppe 2, für die weiteren 1–2 Extremitäten" },
        4: { name: "Muskelstatus Arme", min: 4, einheit: "Muskeln", merkmale: "mind. 4 einzeln geprüfte Muskeln (M5–M0) oder eine Muskelausdauerbelastung (z. B. Haltetest, Schubkarrentest, repetitive Kniebeugen, orthostatischer Tremor-Belastungstest, Treppensteigen)" },
        5: { name: "Muskelstatus Beine", min: 4, einheit: "Muskeln", merkmale: "wie Gruppe 4, für die weiteren 1–2 Extremitäten" },
        6: { name: "Rumpf (Motorik/Sensorik)", min: 2, merkmale: "Trophik, Tonus, Rohkraft, Bewegungsmuster oder Reflexprüfung des Rumpfes; Bauch-/Rückenmuskulatur (M5–M0), Rumpf-Ausdauerbelastung — oder 2 sensible Merkmale am Rumpf (Berührung, Vibration, Temperatur, Schmerz)" },
        7: { name: "Sensorik Arme", min: 2, merkmale: "Berührung, Vibration, Temperatur, Schmerz, Lagesinn, taktiler Neglekt" },
        8: { name: "Sensorik Beine", min: 2, merkmale: "wie Gruppe 7, für die weiteren 1–2 Extremitäten" },
        9: { name: "Koordination", min: 4, merkmale: "FNV, KHV, Diadochokinese, Taxie, Metrie, Finger-/Fuss-Tapping, Pro-/Supination, Zeige-/Haltepositionen, Rebound, Romberg, Unterberger, (Blind-)Strichgang, Bárány(-Vorhalte), Einbeinstand/-hüpfen, posturale Reflexe (Stehen/Sitzen), Ballfangen, Hampelmann, Synkinesien, Gangataxieprüfung" },
        10: { name: "Funktionelle Koordination/Bewegungsstörungen", min: 2, merkmale: "Schriftprobe, Spirale bds., alternierende Sequenzen, Luriaschlaufen, Perlen aufziehen, Essen/Trinken/Glashalten, Turmbauen — oder Dokumentation unwillkürlicher Bewegungen (Tics, Chorea, Athetose, Myoklonien u. a.)" },
        11: { name: "Lagereaktionen (Kinder)", min: 2, merkmale: "Aufzieh-, Derotations-, Fallschirmreaktion, vertikale/horizontale Stellreaktionen u. a." },
        12: { name: "Primitivreflexe", min: 2, merkmale: "ATNR, STNR, Saug-, Greif- (Hand/Fuss), Galant-, Landau-, Moro-, Palmomental-Reflex, Grasping, Gordon, Oppenheim, Strümpell u. a." },
        13: { name: "Dysmorphiezeichen", min: 2, merkmale: "4-Fingerfurche, Klinodaktylie, Dubois-Zeichen, Hexadaktylie, Mamillenabstand/-morphologie, Extremitätenproportionen u. a." },
        14: { name: "Neurokutane Untersuchung", min: 1, merkmale: "spezifische Hautbefunde bei Phakomatosen (z. B. Café-au-lait-Flecken, White Spots)" },
        15: { name: "Orthostase-Belastungstest", min: 1, merkmale: "Blutdruck-, Puls- oder Tremorverhalten in verschiedenen Lagen (Liegen, Sitzen, Stehen, Belastung)" }
      }
    },
    hirn: {
      name: "Hirnnervenstatus",
      positionA: "MP.00.0060", positionB: "MP.00.0050",
      titelA: "Exploration der Hirnnerven A", titelB: "Exploration der Hirnnerven B",
      dauerA: 35, dauerB: 0,
      linkA: "https://browser.tartools.ch/de/lkaat/data/K/MP.00.0060",
      linkB: "https://browser.tartools.ch/de/lkaat/data/K/MP.00.0050",
      minGruppenA: 4,
      gruppen: {
        1: { name: "Allgemeiner Status", min: 3, merkmale: "Allgemeinzustand, Vigilanz, Kooperationsfähigkeit, Hand-/Fussdominanz, Grösse, Gewicht, Blutdruck, Puls, Gefässpulsatilität, Gefässauskultation" },
        2: { name: "Sprachprüfung", min: 1, merkmale: "Sprachproduktion, Sprachverständnis, Nachsprechen, Phonation, Artikulation, Sprachfluenz, Grammatik" },
        3: { name: "Motorik Kopf-Hals", min: 3, merkmale: "Trophik/Tonus/Rohkraft/Beweglichkeit Kopf-Hals, Meningismus, Reflexe, Zunge (Trophik/Tonus/Kraft/Koordination), Gaumensegel, Würgereflex, Schlucken, Paresegradierung motorischer Hirnnerven (M5–M0), Faszikulationen, Belastungstests (z. B. Simpson-Test)" },
        4: { name: "Sensorik Kopf-Hals", min: 3, merkmale: "Berührung, Vibration, Temperatur, Schmerz, Cornealreflex, Druckschmerz der Nervenaustrittspunkte, enorale Sensibilität, Speichelfluss, Geruchs- und Geschmacksprüfung" },
        5: { name: "Neurologische Augenuntersuchung", min: 3, merkmale: "Pupillomotorik (Licht/Konvergenz), Swinging-Flashlight, horizontale/vertikale Motilität, Cover-Test, Folgebewegungen, Puppenaugenphänomen, brechende Medien" },
        6: { name: "Funktionelle Augenuntersuchung", min: 3, merkmale: "Visus nah/fern, Fingerperimetrie, Farbsehen, 3-D-/Stereosehen, Fundoskopie, langsame/rasche Sakkaden, optokinetischer Nystagmus, VOR-Suppression" },
        7: { name: "Ohr und vestibulär", min: 3, merkmale: "Ohrinspektion, Otoskopie, Hörprüfung, Rinne, Weber, Sensibilität Ohr/Gehörgang, Kopfschüttel-/Kopfimpuls-Test, Lagerungen (Seitlage, Re-/Inklination), vestibulookulärer Reflex, Nystagmus-/optokinetische Prüfung" },
        8: { name: "Mit Frenzelbrille", min: 3, merkmale: "mit Frenzelbrille: Motilität, Folgebewegungen, Sakkaden, Kopfschütteltest, Lagerungen, Nystagmusprüfung" },
        9: { name: "Primitivreflexe Gesicht", min: 2, merkmale: "Such-, Schluck-Saug-, Schnauz-, Palmomental-, Glabellareflex u. a." },
        10: { name: "Neurogenetik (faziale Dysmorphie)", min: 2, merkmale: "faziale Dysmorphiezeichen: Synophrys, Epikanthus, Augenstellung, Ohrmorphologie/-lage, Nasolabialfalte, Kiefer-/Gaumenmorphologie u. a." }
      }
    }
  }
};
