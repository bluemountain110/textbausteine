// Datei: hintergrund.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Der Hintergrund-Arbeiter der Erweiterung. Er ist das Gegenstück
//        zu wolke.js + abgleich.js der App, nur viel kleiner: Er meldet
//        sich an der Datenablage an, holt jede Minute die fertigen
//        Bausteine und die Einstellungen, legt sie in den Speicher der
//        Erweiterung und schickt die Zählwerte (nur WIE OFT, nie WAS)
//        zurück. Der EINZIGE Schreibweg für Bausteine ist ;;neu: Er
//        legt ausschliesslich NEUE Entwürfe an, nie ändert er
//        Bestehendes — gepflegt wird nur in der App (Etappe 5).
//        Ausserdem meldet er beim Chrome den Seiten an,
//        auf denen die Kürzel wirken dürfen.
//        Die erste Zeile gibt diesem Arbeiter ein "window", damit die
//        unveränderten App-Dateien (konfiguration.js) hier laufen.
//        GRUNDSATZ: Hier gehen NIE Patientendaten durch.

"use strict";
self.window = self;
importScripts("welt.js", "konfiguration.js");

var K = TB.konfiguration[TB.ERW.welt] || {};
var ADRESSE = String(K.adresse || "").replace(/\/+$/, "");
var SCHLUESSEL = String(K.schluessel || "").trim();

// Die Dateien, die auf einer eingeschalteten Seite mitfahren — in
// dieser Reihenfolge, wie in index.html der App.
var SEITEN_DATEIEN = ["welt.js", "texte.js", "erweiterung-texte.js",
  "makros.js", "masken.js", "auszeichnung.js", "reichtext.js",
  "einblendung.js", "faecher.js", "seite.js", "seite-masken.js"];

// ---- Speicher-Helfer (chrome.storage.local) ---------------------------
function lade(name, vorgabe) {
  return chrome.storage.local.get(name).then(function (o) {
    return (o[name] === undefined || o[name] === null) ? vorgabe : o[name];
  });
}
function sichere(paar) { return chrome.storage.local.set(paar); }

// Der Name kommt seit Etappe 5 fest aus welt.js (Standort) — so weiss
// die Statistik immer, WO gezählt wurde (Praxis Neuromed bzw. Mac).
function geraet() {
  return Promise.resolve(TB.ERW.geraet || ("Erweiterung-" + TB.ERW.welt));
}

// ---- Netz-Helfer (nach dem Muster von wolke.js) ------------------------
function kopf(sitzung, weitere) {
  var h = { "apikey": SCHLUESSEL, "Content-Type": "application/json" };
  if (sitzung) h["Authorization"] = "Bearer " + sitzung.access_token;
  Object.keys(weitere || {}).forEach(function (k) { h[k] = weitere[k]; });
  return h;
}
function ruf(pfad, e) {
  e = e || {};
  var steuerung = new AbortController();
  var wecker = setTimeout(function () { steuerung.abort(); }, e.frist || 15000);
  return fetch(ADRESSE + pfad, {
    method: e.methode || "GET",
    headers: kopf(e.sitzung, e.kopf),
    body: e.koerper ? JSON.stringify(e.koerper) : undefined,
    signal: steuerung.signal
  }).then(function (antwort) {
    clearTimeout(wecker);
    var art = antwort.headers.get("content-type") || "";
    var weiter = art.indexOf("json") !== -1
      ? antwort.json().catch(function () { return null; })
      : antwort.text().catch(function () { return null; });
    return weiter.then(function (daten) {
      return { ok: antwort.ok, status: antwort.status, daten: daten };
    });
  }).catch(function () {
    clearTimeout(wecker);
    return { ok: false, status: 0, daten: null };
  });
}
function fehlerText(a) {
  if (a.status === 0) return "Keine Verbindung zur Datenablage.";
  if (a.status === 400) return "E-Mail oder Passwort stimmt nicht.";
  if (a.status === 401 || a.status === 403) return "Die Anmeldung ist abgelaufen — bitte im Symbol-Fenster neu anmelden.";
  if (a.status >= 500) return "Die Datenablage antwortet nicht (möglicherweise pausiert).";
  return "Die Datenablage meldet einen Fehler (" + a.status + ").";
}

// ---- Anmeldung ---------------------------------------------------------
function sitzungAus(a, mail) {
  return {
    access_token: a.daten.access_token,
    refresh_token: a.daten.refresh_token,
    ablauf: Date.now() + ((a.daten.expires_in || 3600) * 1000),
    benutzer: a.daten.user ? a.daten.user.id : null,
    mail: a.daten.user ? a.daten.user.email : String(mail || "").trim()
  };
}
function anmelden(mail, passwort, merken) {
  return ruf("/auth/v1/token?grant_type=password", {
    methode: "POST",
    koerper: { email: String(mail || "").trim(), password: String(passwort || "") }
  }).then(function (a) {
    if (!a.ok) return { ok: false, fehler: fehlerText(a) };
    var s = sitzungAus(a, mail);
    // "Anmeldung merken" (11.1): Zugangsdaten bleiben im Speicher der
    // Erweiterung auf DIESEM Geraet, damit sie sich nach Ablauf der
    // Sitzung selbst neu anmeldet. Ohne Haekchen wird Gemerktes entfernt.
    var vorab = (merken
      ? sichere({ anmeldung: { mail: String(mail || "").trim(), passwort: String(passwort || "") } })
      : chrome.storage.local.remove("anmeldung")
    ).then(function () { return chrome.storage.local.remove("abgemeldet"); });
    return vorab.then(function () {
      return sichere({ sitzung: s });
    }).then(function () {
      return holen().then(function () { return { ok: true, fehler: null }; });
    });
  });
}
// Selbst neu anmelden mit den gemerkten Zugangsdaten — der stille Weg,
// wenn die Sitzung fehlt oder abgelaufen ist. Ohne holen(), damit sich
// nichts im Kreis ruft; der Aufrufer holt danach selbst.
function selbstAnmelden() {
  return lade("abgemeldet", false).then(function (gewollt) {
    if (gewollt) return null; // von Hand abgemeldet — nicht dagegen anmelden
    return lade("anmeldung", null);
  }).then(function (d) {
    if (!d || !d.mail || !d.passwort) return null;
    return ruf("/auth/v1/token?grant_type=password", {
      methode: "POST", koerper: { email: d.mail, password: d.passwort }
    }).then(function (a) {
      if (!a.ok) return null;
      var s = sitzungAus(a, d.mail);
      return sichere({ sitzung: s }).then(function () { return s; });
    });
  });
}
// Abmelden beendet die Sitzung, VERGISST die gemerkte Anmeldung aber
// nicht (Wunsch 21.9.: nie mehr alles neu eintippen) — das Formular ist
// beim naechsten Mal vorbelegt, ein Klick genuegt. Die Marke
// "abgemeldet" verhindert, dass sich die Erweiterung gegen Deinen
// Willen sofort selbst wieder anmeldet.
function abmelden() {
  return chrome.storage.local.remove(["sitzung", "bausteine", "einstellungen", "stand"])
    .then(function () { return sichere({ abgemeldet: true }); })
    .then(zeichenSetzen);
}
function frischeSitzung() {
  return lade("sitzung", null).then(function (s) {
    if (!s) return selbstAnmelden();
    if (s.ablauf - Date.now() > 120000) return s;
    return ruf("/auth/v1/token?grant_type=refresh_token", {
      methode: "POST", koerper: { refresh_token: s.refresh_token }
    }).then(function (a) {
      if (!a.ok) {
        if (a.status === 400 || a.status === 401) {
          return chrome.storage.local.remove("sitzung").then(selbstAnmelden);
        }
        return null;
      }
      s.access_token = a.daten.access_token;
      s.refresh_token = a.daten.refresh_token || s.refresh_token;
      s.ablauf = Date.now() + ((a.daten.expires_in || 3600) * 1000);
      return sichere({ sitzung: s }).then(function () { return s; });
    });
  });
}

// ---- Holen: Bausteine und Einstellungen, danach Zählwerte schicken -----
var holtGerade = false;
function holen() {
  if (holtGerade) return Promise.resolve();
  holtGerade = true;
  return frischeSitzung().then(function (s) {
    if (!s) {
      return merkeStand({ fehler: "abgemeldet" });
    }
    return ruf("/rest/v1/bausteine?select=id,titel,kuerzel,kategorie,text,varianten," +
      "notiz,art,entwurf,ausgabeart&geloescht_am=is.null&entwurf=eq.false" +
      "&order=titel.asc", { sitzung: s })
      .then(function (a) {
        if (!a.ok) return merkeStand({ fehler: fehlerText(a) });
        var bausteine = Array.isArray(a.daten) ? a.daten : [];
        return ruf("/rest/v1/einstellungen?select=schluessel,wert", { sitzung: s })
          .then(function (a2) {
            var e = {};
            (Array.isArray(a2.daten) ? a2.daten : []).forEach(function (z) {
              e[z.schluessel] = z.wert;
            });
            return sichere({ bausteine: bausteine, einstellungen: e })
              .then(function () { return schickeZaehlwerte(s); })
              .then(function () {
                return merkeStand({ fehler: null, anzahl: bausteine.length,
                  zeit: new Date().toISOString() });
              });
          });
      });
  }).then(function () { holtGerade = false; },
          function () { holtGerade = false; });
}

// Zählwerte: je Baustein nur Anzahl und Zeitpunkt — nie Inhalte.
function schickeZaehlwerte(s) {
  return Promise.all([lade("statistik", null), lade("statistikOffen", false), geraet()])
    .then(function (w) {
      var st = w[0], offen = w[1], g = w[2];
      if (!offen || !st || !st.bausteine) return null;
      var zeilen = [];
      Object.keys(st.bausteine).forEach(function (id) {
        zeilen.push({ benutzer: s.benutzer, geraet: g, art: "baustein",
          schluessel: id, anzahl: st.bausteine[id].anzahl,
          zuletzt: st.bausteine[id].zuletzt });
      });
      if (!zeilen.length) return sichere({ statistikOffen: false });
      return ruf("/rest/v1/statistik?on_conflict=benutzer,geraet,art,schluessel", {
        methode: "POST", sitzung: s, koerper: zeilen,
        kopf: { "Prefer": "resolution=merge-duplicates,return=minimal" }
      }).then(function (a) {
        if (a.ok) return sichere({ statistikOffen: false });
        return null;
      });
    });
}

// ;;neu: einen NEUEN Entwurf in die Datenablage legen — der einzige
// Schreibweg der Erweiterung. Der Inhalt wurde auf der Seite gezeigt
// und von Hand bestätigt (Kontroll-Vorschau mit Warnsatz).
function entwurfSichern(html) {
  return frischeSitzung().then(function (s) {
    if (!s) return { ok: false, fehler: fehlerText({ status: 401 }) };
    var jetzt = new Date().toISOString();
    var zeile = {
      id: crypto.randomUUID(), benutzer: s.benutzer,
      titel: "", kuerzel: "", kategorie: "",
      text: html, notiz: "", art: "text", entwurf: true,
      ausgabeart: "fenster", erstellt_am: jetzt, aktualisiert_am: jetzt
    };
    return ruf("/rest/v1/bausteine?on_conflict=id", {
      methode: "POST", sitzung: s, koerper: [zeile],
      kopf: { "Prefer": "resolution=merge-duplicates,return=minimal" }
    }).then(function (a) {
      if (!a.ok) return { ok: false, fehler: fehlerText(a) };
      return { ok: true, fehler: null };
    });
  });
}

function merkeStand(neues) {
  return lade("stand", {}).then(function (st) {
    Object.keys(neues).forEach(function (k) { st[k] = neues[k]; });
    return sichere({ stand: st }).then(zeichenSetzen);
  });
}

// Das kleine Zeichen am Symbol: rotes ! wenn nicht angemeldet oder Fehler.
function zeichenSetzen() {
  return Promise.all([lade("sitzung", null), lade("stand", {})]).then(function (w) {
    var not = !w[0] || !!w[1].fehler;
    chrome.action.setBadgeBackgroundColor({ color: "#b3261e" });
    chrome.action.setBadgeText({ text: not ? "!" : "" });
  });
}

// ---- Seiten registrieren: nur dort wirken die Kürzel -------------------
function seitenAnmelden() {
  return lade("seiten", []).then(function (seiten) {
    return chrome.scripting.unregisterContentScripts({ ids: ["tb-seiten"] })
      .catch(function () { })
      .then(function () {
        if (!seiten.length) return null;
        return chrome.scripting.registerContentScripts([{
          id: "tb-seiten",
          matches: seiten,
          js: SEITEN_DATEIEN,
          css: ["einblendung.css"],
          allFrames: true,
          matchOriginAsFallback: true,
          runAt: "document_idle"
        }]).catch(function () { return null; });
      });
  });
}

// ---- Anlauf und Weckruf ------------------------------------------------
function anlauf() {
  chrome.alarms.create("holen", { periodInMinutes: 1 });
  seitenAnmelden();
  holen();
}
chrome.runtime.onInstalled.addListener(anlauf);
chrome.runtime.onStartup.addListener(anlauf);
chrome.alarms.onAlarm.addListener(function (a) {
  if (a.name === "holen") holen();
});

// ---- Nachrichten vom Symbol-Fenster und vom Übungsfeld -----------------
chrome.runtime.onMessage.addListener(function (n, absender, antworte) {
  if (n && n.art === "anmelden") {
    anmelden(n.mail, n.passwort, n.merken !== false).then(antworte);
    return true;
  }
  if (n && n.art === "abmelden") { abmelden().then(function () { antworte({ ok: true }); }); return true; }
  if (n && n.art === "holen") { holen().then(function () { antworte({ ok: true }); }); return true; }
  if (n && n.art === "seitenAnmelden") { seitenAnmelden().then(function () { antworte({ ok: true }); }); return true; }
  if (n && n.art === "entwurfSichern") {
    entwurfSichern(String(n.html || "")).then(antworte);
    return true;
  }
  if (n && n.art === "faecherLeeren") {
    chrome.storage.local.remove("faecher").then(function () { antworte({ ok: true }); });
    return true;
  }
  if (n && n.art === "status") {
    Promise.all([lade("sitzung", null), lade("stand", {}), lade("seiten", []), lade("bausteine", [])])
      .then(function (w) {
        antworte({
          welt: TB.ERW.welt, fassung: TB.ERW.fassung,
          angemeldet: !!w[0], mail: w[0] ? w[0].mail : null,
          stand: w[1], seiten: w[2], anzahl: (w[3] || []).length
        });
      });
    return true;
  }
  return false;
});

zeichenSetzen();
