// Datei: wolke.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Verbindung zur Datenablage (Supabase). Hier steht ALLES,
//        was mit dem Netz zu tun hat: anmelden, abmelden, die Sitzung
//        frisch halten, Zeilen holen und Zeilen schreiben. Kein anderer
//        Teil der App spricht mit dem Netz.
//        Es wird keine fremde Programmbibliothek geladen — die App
//        spricht direkt mit der Datenablage, damit im Spital nichts
//        an einer gesperrten Fremdadresse scheitern kann.
//        GRUNDSATZ: Hierdurch gehen NIE Patientendaten. Nur Bausteine,
//        Einstellungen und Zählwerte.

"use strict";
window.TB = window.TB || {};

TB.wolke = (function () {

  var WELT = null;          // wird von start() gesetzt
  var ADRESSE = "", SCHLUESSEL = "";
  var sitzung = null;       // { access_token, refresh_token, ablauf, benutzer, mail }
  var SITZUNGSSCHLUESSEL = "";

  // ---- Start und Sitzungsablage --------------------------------------
  function start(welt) {
    WELT = welt;
    var k = (TB.konfiguration && TB.konfiguration[welt]) || {};
    ADRESSE = String(k.adresse || "").replace(/\/+$/, "");
    SCHLUESSEL = String(k.schluessel || "").trim();
    SITZUNGSSCHLUESSEL = "textbausteine." + welt + ".sitzung";
    ladeSitzung();
  }

  function lager() {
    try { localStorage.setItem("_t", "1"); localStorage.removeItem("_t");
          return localStorage; } catch (e) { return null; }
  }

  function ladeSitzung() {
    var l = lager(); if (!l) return;
    try {
      var roh = l.getItem(SITZUNGSSCHLUESSEL);
      sitzung = roh ? JSON.parse(roh) : null;
    } catch (e) { sitzung = null; }
  }
  function sichereSitzung() {
    var l = lager(); if (!l) return;
    if (sitzung) l.setItem(SITZUNGSSCHLUESSEL, JSON.stringify(sitzung));
    else l.removeItem(SITZUNGSSCHLUESSEL);
  }

  function eingerichtet() {
    return !!(TB.konfiguration && TB.konfiguration.istEingerichtet(WELT));
  }
  function angemeldet() { return !!(sitzung && sitzung.access_token); }
  function benutzerKennung() { return sitzung ? sitzung.benutzer : null; }
  function benutzerMail() { return sitzung ? sitzung.mail : null; }

  // ---- Kleine Helfer ---------------------------------------------------
  function kopf(mitAnmeldung, weitere) {
    var h = { "apikey": SCHLUESSEL, "Content-Type": "application/json" };
    if (mitAnmeldung && sitzung) h["Authorization"] = "Bearer " + sitzung.access_token;
    Object.keys(weitere || {}).forEach(function (k) { h[k] = weitere[k]; });
    return h;
  }

  // Jede Antwort wird zu einem verständlichen Satz — nie zu einer
  // Zahl, mit der Näd nichts anfangen kann.
  function fehlerText(status, koerper) {
    var m = "";
    try { m = (koerper && (koerper.msg || koerper.message || koerper.error_description ||
                           koerper.error || koerper.hint)) || ""; } catch (e) { m = ""; }
    if (status === 0) return TB.T.wolkeFehlerNetz;
    if (status === 400 && /Invalid login/i.test(m)) return TB.T.wolkeFehlerAnmeldung;
    if (status === 400 && /not allowed|disabled/i.test(m)) return TB.T.wolkeFehlerGesperrt;
    if (status === 401 || status === 403) return TB.T.wolkeFehlerAbgemeldet;
    if (status === 404) return TB.T.wolkeFehlerTabelle;
    if (status === 429) return TB.T.wolkeFehlerZuVielt;
    if (status >= 500) return TB.T.wolkeFehlerPause;
    return TB.T.wolkeFehlerAllgemein + (m ? " (" + m + ")" : " (" + status + ")");
  }

  // Eine einzige Stelle für alle Netzaufrufe. Liefert immer
  // { ok, status, daten, fehler } — nichts wirft, nichts scheitert still.
  function ruf(pfad, einstellungen) {
    var e = einstellungen || {};
    var steuerung = (typeof AbortController === "function") ? new AbortController() : null;
    var wecker = setTimeout(function () { if (steuerung) steuerung.abort(); }, e.frist || 15000);
    return fetch(ADRESSE + pfad, {
      method: e.methode || "GET",
      headers: kopf(e.mitAnmeldung !== false, e.kopf),
      body: e.koerper ? JSON.stringify(e.koerper) : undefined,
      signal: steuerung ? steuerung.signal : undefined
    }).then(function (antwort) {
      clearTimeout(wecker);
      var art = antwort.headers.get("content-type") || "";
      var weiter = art.indexOf("json") !== -1 ? antwort.json().catch(function () { return null; })
                                              : antwort.text().catch(function () { return null; });
      return weiter.then(function (daten) {
        if (antwort.ok) return { ok: true, status: antwort.status, daten: daten, fehler: null };
        return { ok: false, status: antwort.status, daten: daten,
                 fehler: fehlerText(antwort.status, daten) };
      });
    }).catch(function () {
      clearTimeout(wecker);
      return { ok: false, status: 0, daten: null, fehler: fehlerText(0, null) };
    });
  }

  // ---- Anmelden, abmelden, frisch halten -------------------------------
  function anmelden(mail, passwort) {
    return ruf("/auth/v1/token?grant_type=password", {
      methode: "POST", mitAnmeldung: false,
      koerper: { email: String(mail || "").trim(), password: String(passwort || "") }
    }).then(function (a) {
      if (!a.ok) return { ok: false, fehler: a.fehler };
      sitzung = {
        access_token: a.daten.access_token,
        refresh_token: a.daten.refresh_token,
        ablauf: Date.now() + ((a.daten.expires_in || 3600) * 1000),
        benutzer: a.daten.user ? a.daten.user.id : null,
        mail: a.daten.user ? a.daten.user.email : String(mail || "").trim()
      };
      sichereSitzung();
      return { ok: true, fehler: null };
    });
  }

  function abmelden() {
    var vorher = sitzung;
    sitzung = null; sichereSitzung();
    if (!vorher) return Promise.resolve({ ok: true });
    var alt = vorher.access_token;
    return fetch(ADRESSE + "/auth/v1/logout", {
      method: "POST",
      headers: { "apikey": SCHLUESSEL, "Authorization": "Bearer " + alt,
                 "Content-Type": "application/json" }
    }).then(function () { return { ok: true }; },
            function () { return { ok: true }; });
  }

  // Holt bei Bedarf ein frisches Zugangszeichen. Läuft still.
  function frischHalten() {
    if (!angemeldet()) return Promise.resolve({ ok: false, fehler: TB.T.wolkeFehlerAbgemeldet });
    if (sitzung.ablauf - Date.now() > 120000) return Promise.resolve({ ok: true });
    return ruf("/auth/v1/token?grant_type=refresh_token", {
      methode: "POST", mitAnmeldung: false,
      koerper: { refresh_token: sitzung.refresh_token }
    }).then(function (a) {
      if (!a.ok) {
        if (a.status === 400 || a.status === 401) { sitzung = null; sichereSitzung(); }
        return { ok: false, fehler: a.fehler };
      }
      sitzung.access_token = a.daten.access_token;
      sitzung.refresh_token = a.daten.refresh_token || sitzung.refresh_token;
      sitzung.ablauf = Date.now() + ((a.daten.expires_in || 3600) * 1000);
      sichereSitzung();
      return { ok: true };
    });
  }

  // ---- Zeilen holen und schreiben --------------------------------------
  // tabelle: "bausteine" | "einstellungen" | "statistik"
  function holen(tabelle, bedingung) {
    return frischHalten().then(function (f) {
      if (!f.ok) return { ok: false, fehler: f.fehler, zeilen: [] };
      var hatAuswahl = /(^|&)select=/.test(bedingung || "");
      var pfad = "/rest/v1/" + tabelle + (hatAuswahl ? "?" : "?select=*") +
                 (bedingung ? (hatAuswahl ? "" : "&") + bedingung : "");
      return ruf(pfad, { methode: "GET" }).then(function (a) {
        if (!a.ok) return { ok: false, fehler: a.fehler, zeilen: [] };
        return { ok: true, fehler: null, zeilen: Array.isArray(a.daten) ? a.daten : [] };
      });
    });
  }

  function schreiben(tabelle, zeilen, konfliktfelder) {
    if (!zeilen || !zeilen.length) return Promise.resolve({ ok: true, fehler: null, anzahl: 0 });
    return frischHalten().then(function (f) {
      if (!f.ok) return { ok: false, fehler: f.fehler, anzahl: 0 };
      var pfad = "/rest/v1/" + tabelle + "?on_conflict=" + (konfliktfelder || "id");
      return ruf(pfad, {
        methode: "POST", koerper: zeilen,
        kopf: { "Prefer": "resolution=merge-duplicates,return=minimal" }
      }).then(function (a) {
        if (!a.ok) return { ok: false, fehler: a.fehler, anzahl: 0 };
        return { ok: true, fehler: null, anzahl: zeilen.length };
      });
    });
  }

  // ---- Verbindung prüfen (eigener Knopf in den Einstellungen) ----------
  // Beantwortet drei Fragen getrennt: Kommt die Adresse überhaupt durch?
  // Sind die Tabellen da? Und ist die Zeilen-Sicherheit scharf?
  function verbindungPruefen() {
    var ergebnisse = [];
    function punkt(name, ok, detail) {
      ergebnisse.push({ name: name, ok: !!ok, detail: detail || "" }); }

    if (!eingerichtet()) {
      punkt(TB.T.pruefEingerichtet, false, TB.T.pruefEingerichtetNein);
      return Promise.resolve(ergebnisse);
    }
    punkt(TB.T.pruefEingerichtet, true, ADRESSE);

    // 1. Erreichbarkeit — ohne Anmeldung, nur der Türklopfer.
    return ruf("/auth/v1/settings", { methode: "GET", mitAnmeldung: false, frist: 12000 })
      .then(function (a) {
        punkt(TB.T.pruefErreichbar, a.ok || a.status > 0,
              a.status > 0 ? TB.T.pruefAntwort + a.status : (a.fehler || ""));
        // 2. Selbstregistrierung: steht sie noch offen?
        if (a.ok && a.daten && a.daten.disable_signup === false) {
          punkt(TB.T.pruefRegistrierung, false, TB.T.pruefRegistrierungOffen);
        } else if (a.ok) {
          punkt(TB.T.pruefRegistrierung, true, TB.T.pruefRegistrierungZu);
        }
        // 3. Zeilen-Sicherheit: abgemeldet lesen muss nichts liefern.
        return ruf("/rest/v1/bausteine?select=id&limit=1",
                   { methode: "GET", mitAnmeldung: false });
      })
      .then(function (a) {
        var leer = a.status === 401 || a.status === 403 ||
                   (a.ok && Array.isArray(a.daten) && a.daten.length === 0);
        punkt(TB.T.pruefSicherheit, leer,
              leer ? TB.T.pruefSicherheitGut : TB.T.pruefSicherheitSchlecht);
        if (!angemeldet()) {
          punkt(TB.T.pruefAngemeldet, false, TB.T.pruefAngemeldetNein);
          return ergebnisse;
        }
        punkt(TB.T.pruefAngemeldet, true, benutzerMail() || "");
        // 4. Die drei Tabellen einzeln antippen.
        var tabellen = ["bausteine", "einstellungen", "statistik"];
        return tabellen.reduce(function (kette, t) {
          return kette.then(function () {
            return holen(t, "limit=1").then(function (a2) {
              punkt(TB.T.pruefTabelle + t, a2.ok, a2.ok ? TB.T.pruefTabelleGut : a2.fehler);
            });
          });
        }, Promise.resolve()).then(function () {
          // 5. Kennt die Tabelle JEDE Spalte, die die App schreibt?
          // Am 16.9. hat eine fehlende Spalte den ganzen Abgleich
          // blockiert — das soll hier auffallen, nicht erst dort.
          var spalten = TB.abgleich.spaltenNamen().join(",");
          return holen("bausteine", "select=" + spalten + "&limit=1")
            .then(function (a3) {
              punkt(TB.T.pruefSpalten, a3.ok,
                a3.ok ? TB.T.pruefSpaltenGut : (TB.T.pruefSpaltenSchlecht + " " + a3.fehler));
              return ergebnisse;
            });
        });
      })
      .then(function () { return ergebnisse; });
  }

  function bericht(ergebnisse) {
    function z(n) { return (n < 10 ? "0" : "") + n; }
    var d = new Date();
    var zeilen = [
      "TEXTBAUSTEINE VERBINDUNG — " + TB.bericht.geraet() + " — Welt: " + WELT +
        " — Fassung " + TB.FASSUNG,
      "Zeitpunkt: " + d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) +
        " " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds()),
      "Adresse: " + (ADRESSE || "(nicht eingetragen)"),
      ""
    ];
    ergebnisse.forEach(function (e) {
      zeilen.push((e.ok ? "GRÜN  " : "ROT   ") + e.name + (e.detail ? "  [" + e.detail + "]" : ""));
    });
    var rot = ergebnisse.filter(function (e) { return !e.ok; }).length;
    zeilen.push("");
    zeilen.push("Ergebnis: " + (ergebnisse.length - rot) + " grün, " + rot + " rot.");
    return zeilen.join("\n");
  }

  return {
    start: start, eingerichtet: eingerichtet, angemeldet: angemeldet,
    benutzerKennung: benutzerKennung, benutzerMail: benutzerMail,
    anmelden: anmelden, abmelden: abmelden, frischHalten: frischHalten,
    holen: holen, schreiben: schreiben,
    verbindungPruefen: verbindungPruefen, bericht: bericht
  };
})();
