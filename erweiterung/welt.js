// Datei: welt.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung (Bausteine – Kürzel)
// Zweck: Die EINZIGE Datei, in der sich die DEV- und die PROD-Fassung
//        der Erweiterung unterscheiden (neben Name und Symbolfarbe im
//        manifest). Sie legt fest, mit welcher Datenwelt aus
//        konfiguration.js gesprochen wird. DEV gehoert nur auf den Mac,
//        PROD nur in die Praxis.

"use strict";
window.TB = window.TB || {};
TB.ERW = { welt: "prod", istDev: false,
           fassung: "Etappe 3 · b · 18.09.2026" };
