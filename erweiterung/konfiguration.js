// Datei: konfiguration.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die einzige Datei mit den Zugangsdaten der beiden Datenwelten.
//        Hier trägst Du ein, was Dir das Supabase-Fenster unter
//        Settings -> API Keys anzeigt: die Adresse (Project URL) und den
//        öffentlichen Schlüssel (anon public). Sonst ändert sich in der
//        ganzen App nichts, wenn ein Projekt umzieht.
//        WICHTIG: Der öffentliche Schlüssel DARF hier stehen — er öffnet
//        ohne Anmeldung nichts. Der zweite, geheime Schlüssel
//        ("service_role") gehört NIE in diese Datei.
//        GRUNDSATZ: In dieser App werden nie Patientendaten gespeichert.
//        Ausgefüllt am 16.9.2026 mit Näds beiden Projekten
//        (textbausteine-dev und textbausteine, Region Zürich).

"use strict";
window.TB = window.TB || {};

TB.konfiguration = {

  // ---- Testwelt (Aufruf mit ?welt=dev, roter Rahmen) ----------------
  dev: {
    adresse: "https://ybzgzdyjsdtszqechkup.supabase.co",
    schluessel: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemd6ZHlqc2R0c3pxZWNoa3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjA1NDEsImV4cCI6MjEwNTEzNjU0MX0.1swWFwk1OGROnXDhT47kp5E3rSqsmhwv0wx2Iei9ZSA"
  },

  // ---- Normale Welt (Deine echten Bausteine) ------------------------
  prod: {
    adresse: "https://qotxsasbnoqokvzhimtw.supabase.co",
    schluessel: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHhzYXNibm9xb2t2emhpbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE5MjIsImV4cCI6MjEwNTEzNzkyMn0.UBwZMWYTBNS9pj0bL3TPDCAmI3Qsn87XM3yCuNxzyAs"
  }
};

// Prüft, ob für eine Welt überhaupt schon etwas eingetragen wurde.
TB.konfiguration.istEingerichtet = function (welt) {
  var k = TB.konfiguration[welt];
  return !!(k && /^https:\/\/.+\.supabase\.co\/?$/.test(String(k.adresse).trim()) &&
            String(k.schluessel).trim().length > 40);
};
