// Datei: popup.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Das Verhalten des Symbol-Fensters. Es fragt den Hintergrund-
//        Arbeiter nach dem Stand, meldet an und ab, stösst das Holen
//        an und schaltet Seiten ein oder aus. Das Einschalten einer
//        Seite fragt Chrome um Erlaubnis — genau für diese eine
//        Adresse, nie pauschal für alles.

"use strict";

function $(id) { return document.getElementById(id); }
function frage(nachricht) { return chrome.runtime.sendMessage(nachricht); }

var aktuelleSeite = null; // Muster der gerade offenen Seite, z. B. https://xyz.ch/*

function seitenMuster(url) {
  try {
    var u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin + "/*";
  } catch (e) { return null; }
}

function zeit(iso) {
  if (!iso) return TB.TE.nieGeholt;
  var d = new Date(iso);
  function z(n) { return (n < 10 ? "0" : "") + n; }
  return z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
}

function zeichne(s) {
  $("welt").textContent = s.welt === "dev" ? TB.TE.weltDev : TB.TE.weltProd;
  $("welt").className = "welt" + (s.welt === "dev" ? " dev" : "");
  $("fassung").textContent = TB.TE.fassung + s.fassung;

  var fehler = s.stand && s.stand.fehler;
  if (fehler && fehler !== "abgemeldet") {
    $("fehler").textContent = fehler;
    $("fehler").classList.remove("verborgen");
  } else { $("fehler").classList.add("verborgen"); }

  if (!s.angemeldet) {
    $("anmeldung").classList.remove("verborgen");
    $("stand").classList.add("verborgen");
    return;
  }
  $("anmeldung").classList.add("verborgen");
  $("stand").classList.remove("verborgen");
  $("wer").textContent = TB.TE.angemeldetAls + (s.mail || "");
  $("anzahl").textContent = TB.TE.anzahlBausteine + s.anzahl;
  $("geholt").textContent = TB.TE.zuletztGeholt + zeit(s.stand && s.stand.zeit);

  var drin = aktuelleSeite && s.seiten.indexOf(aktuelleSeite) !== -1;
  $("seite").textContent = drin ? TB.TE.seiteEntfernen : TB.TE.seiteEinschalten;
  $("seite").disabled = !aktuelleSeite;

  $("seitenTitel").textContent = TB.TE.seitenTitel;
  var liste = $("seiten");
  liste.textContent = "";
  if (!s.seiten.length) {
    var leer = document.createElement("div");
    leer.className = "klein"; leer.textContent = TB.TE.keineSeiten;
    liste.appendChild(leer);
  }
  s.seiten.forEach(function (muster) {
    var zeile = document.createElement("div");
    zeile.className = "seite";
    var name = document.createElement("span");
    name.textContent = muster.replace(/\/\*$/, "");
    var weg = document.createElement("button");
    weg.textContent = "×";
    weg.addEventListener("click", function () { entferneSeite(muster); });
    zeile.appendChild(name); zeile.appendChild(weg);
    liste.appendChild(zeile);
  });
}

function aktualisiere() { frage({ art: "status" }).then(zeichne); }

function meldeAn() {
  var mail = $("mail").value.trim(), pw = $("passwort").value;
  if (!mail || !pw) {
    $("fehler").textContent = TB.TE.anmeldungFehlt;
    $("fehler").classList.remove("verborgen");
    return;
  }
  $("anmelden").disabled = true;
  frage({ art: "anmelden", mail: mail, passwort: pw }).then(function (a) {
    $("anmelden").disabled = false;
    if (a && !a.ok) {
      $("fehler").textContent = a.fehler;
      $("fehler").classList.remove("verborgen");
    }
    aktualisiere();
  });
}

function schalteSeite() {
  frage({ art: "status" }).then(function (s) {
    if (!aktuelleSeite) return;
    if (s.seiten.indexOf(aktuelleSeite) !== -1) { entferneSeite(aktuelleSeite); return; }
    chrome.permissions.request({ origins: [aktuelleSeite] }).then(function (ja) {
      if (!ja) {
        $("fehler").textContent = TB.TE.seiteAbgelehnt;
        $("fehler").classList.remove("verborgen");
        return;
      }
      var neu = s.seiten.concat([aktuelleSeite]);
      chrome.storage.local.set({ seiten: neu })
        .then(function () { return frage({ art: "seitenAnmelden" }); })
        .then(function () {
          $("fehler").textContent = TB.TE.seiteEingeschaltet;
          $("fehler").classList.remove("verborgen");
          aktualisiere();
        });
    });
  });
}

function entferneSeite(muster) {
  frage({ art: "status" }).then(function (s) {
    var neu = s.seiten.filter(function (m) { return m !== muster; });
    chrome.storage.local.set({ seiten: neu })
      .then(function () { return frage({ art: "seitenAnmelden" }); })
      .then(function () {
        chrome.permissions.remove({ origins: [muster] });
        aktualisiere();
      });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  $("anmelden").textContent = TB.TE.anmelden;
  $("abmelden").textContent = TB.TE.abmelden;
  $("holen").textContent = TB.TE.jetztHolen;
  $("uebungsfeld").textContent = TB.TE.uebungsfeldOeffnen;

  $("anmelden").addEventListener("click", meldeAn);
  $("passwort").addEventListener("keydown", function (e) {
    if (e.key === "Enter") meldeAn();
  });
  $("abmelden").addEventListener("click", function () {
    frage({ art: "abmelden" }).then(aktualisiere);
  });
  $("holen").addEventListener("click", function () {
    $("holen").textContent = TB.TE.holtGerade;
    frage({ art: "holen" }).then(function () {
      $("holen").textContent = TB.TE.jetztHolen;
      aktualisiere();
    });
  });
  $("uebungsfeld").addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("uebungsfeld.html") });
  });
  $("seite").addEventListener("click", schalteSeite);

  chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
    aktuelleSeite = tabs[0] ? seitenMuster(tabs[0].url) : null;
    aktualisiere();
  });
});
