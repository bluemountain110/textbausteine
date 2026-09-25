// Datei: welt.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung (Bausteine – Kürzel)
// Zweck: Die EINZIGE Datei, in der sich die DEV- und die PROD-Fassung
//        der Erweiterung unterscheiden (neben Name und Symbolfarbe im
//        manifest). Sie legt fest, mit welcher Datenwelt aus
//        konfiguration.js gesprochen wird, und unter welchem Namen
//        dieses Geraet in der Statistik erscheint. DEV gehoert nur auf
//        den Mac, PROD nur in die Praxis (Praxis Neuromed).

"use strict";
window.TB = window.TB || {};
TB.ERW = { welt: "prod", istDev: false,
           geraet: "Praxis Neuromed - Erweiterung",
           fassung: "14.3 · 25.09.2026" };
