// Datei: ansicht-enmg-pflege.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die ENMG-Normwert-Pflege: je Nerv eine Tabelle mit den
//        Grenzwerten über die Alters-Stützstellen 20–80 (bzw. festen
//        Werten für F-Wellen und Radialis). Jede Zelle ist direkt
//        änderbar und synct sofort auf alle Geräte. Dazu der Name der
//        Normwert-Quelle (erscheint unter jeder ENMG-Tabelle) und der
//        Rückweg auf die mitgelieferte Grundausstattung. Patientendaten
//        kommen hier nie vor.

"use strict";
window.TB = window.TB || {};

TB.ansichtEnmgPflege = (function () {
  var T = function () { return TB.enmgTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };

  function oeffne() {
    zeichne(document.getElementById("inhalt"));
  }

  function speichereZelle(nervId, zeileId, index, eingabe) {
    var text = String(eingabe.value || "").trim().replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(text)) {
      melde(T().wertUngueltig.replace("%s", eingabe.value), true);
      oeffne(); return;
    }
    var wert = parseFloat(text);
    var n = JSON.parse(JSON.stringify(TB.enmg.normwerte()));
    for (var i = 0; i < n.nerven.length; i++) {
      if (n.nerven[i].id !== nervId) continue;
      var zeile = TB.enmg.zeileVonNerv(n.nerven[i], zeileId);
      if (!zeile) return;
      if (index === null) zeile.fest = wert;
      else zeile.werte[index] = wert;
      TB.enmg.speichereNormwerte(n);
      melde(T().gespeichert);
      return;
    }
  }

  function eingabe(wert, fertig) {
    var f = el("input", "enmg-pflege-feld");
    f.type = "text"; f.value = (wert === undefined || wert === null)
      ? "" : String(wert);
    f.addEventListener("change", function () { fertig(f); });
    return f;
  }

  function zeichneNerv(wurzel, nerv, alter) {
    wurzel.appendChild(el("h3", "", nerv.name));
    var tabelle = el("table", "enmg-tabelle enmg-pflege-tabelle");
    var kopf = el("tr");
    kopf.appendChild(el("th", "", ""));
    kopf.appendChild(el("th", "", ""));
    alter.forEach(function (a) { kopf.appendChild(el("th", "", String(a))); });
    tabelle.appendChild(kopf);
    nerv.zeilen.forEach(function (zeile) {
      var tr = el("tr");
      var name = el("td", "enmg-segment", zeile.name);
      name.title = zeile.einheit + " · " + (zeile.richtung === "max"
        ? T().richtungMax : T().richtungMin);
      tr.appendChild(name);
      tr.appendChild(el("td", "enmg-pflege-einheit",
        zeile.einheit + (zeile.richtung === "max" ? " ≤" : " ≥")));
      if (typeof zeile.fest === "number") {
        var td = el("td", "enmg-wert");
        td.colSpan = alter.length;
        td.appendChild(el("span", "enmg-pflege-fest", T().festWort + ": "));
        td.appendChild(eingabe(zeile.fest, function (f) {
          speichereZelle(nerv.id, zeile.id, null, f); }));
        tr.appendChild(td);
      } else {
        zeile.werte.forEach(function (w, i) {
          var tdw = el("td", "enmg-wert");
          tdw.appendChild(eingabe(w, function (f) {
            speichereZelle(nerv.id, zeile.id, i, f); }));
          tr.appendChild(tdw);
        });
      }
      tabelle.appendChild(tr);
    });
    wurzel.appendChild(tabelle);
  }

  function zeichne(wurzel) {
    wurzel.textContent = "";
    wurzel.appendChild(el("h2", "", T().pflegeTitel));
    wurzel.appendChild(el("p", "hinweis", T().pflegeHinweis));

    var leiste = el("div", "werkzeugleiste");
    var zurueck = el("button", "haupt", T().zurueckZumWerk);
    zurueck.addEventListener("click", function () {
      TB.oberflaeche.zeichne(); });
    leiste.appendChild(zurueck);
    var grund = el("button", "leise", T().grundKnopf);
    grund.addEventListener("click", function () {
      var stand = (TB.normwerteGrundlage && TB.normwerteGrundlage.stand) || "";
      if (!confirm(T().grundWarnung.replace("%s", stand))) return;
      TB.enmg.grundausstattung();
      melde(T().grundFertig);
      oeffne();
    });
    leiste.appendChild(grund);
    wurzel.appendChild(leiste);

    var quelleZeile = el("div", "enmg-pflege-quelle");
    quelleZeile.appendChild(el("label", "", T().quelleFeld));
    var q = el("input", "enmg-pflege-quelle-feld");
    q.type = "text"; q.value = TB.enmg.quelle();
    q.addEventListener("change", function () {
      TB.enmg.setzeQuelle(q.value.trim());
      melde(T().gespeichert);
    });
    quelleZeile.appendChild(q);
    wurzel.appendChild(quelleZeile);

    var n = TB.enmg.normwerte();
    (n.nerven || []).forEach(function (nerv) {
      zeichneNerv(wurzel, nerv, n.alter || []);
    });
  }

  return { oeffne: oeffne, zeichne: zeichne };
})();
