/*
    Link Tools: Configurable copy and visit operations for links in Firefox
    Copyright (C) 2018  Daniel Dawson <danielcdawson@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";

const $ = id => document.getElementById(id);
const setTxt = (el, str) => el.textContent = str;

document.addEventListener(
  "DOMContentLoaded",
  function _dclHandler () {
    const title = _("customOpsTitle");
    document.title = title;
    setTxt($("heading-main"), title);
    setTxt($("descr-main"), _("customOps_description"));
    let halves = _("customOps_askForContribs", "$1").split("$1");
    let p = $("ask-for-contribs");
    p.appendChild(document.createTextNode(halves[0]));
    let link = document.createElement("a");
    link.href = "https://addons.mozilla.org/addon/link-tools/";
    setTxt(link, _("customOps_askForContribs_linkText"));
    p.appendChild(link);
    p.appendChild(document.createTextNode(halves[1]));

    //setTxt($("heading-embedded-links"), _("embeddedLinks"));
    //setTxt($("descr-embedded-links"), _("embeddedLinks_description"));
    //$("embedded-links-pat").placeholder = _("regularExpressions");
    //setTxt($("heading-link-types"), _("linkTypes"));
    //setTxt($("descr-link-types"), _("linkTypes_description"));
    setTxt($("ops-import-btn"), _("import"));
    setTxt($("ops-export-btn"), _("export"));
    setTxt($("btn-rem"), _("remove"));
    setTxt($("btn-new"), _("new"));
    setTxt($("opgroup-name-lbl"), _("customops-name-lbl"));
    setTxt($("opgroup-pat-lbl"), _("customops-pat-lbl"));
    $("opgroup-pat").placeholder = _("regularExpressions");
    setTxt($("opgroup-thumb-lbl"), _("customops-thumb-lbl"));
    $("opgroup-thumb").placeholder = _("optional-replacedByMatches");
    setTxt($("heading-copyops"), _("heading-copyops"));
    setTxt($("descr-copyops"), _("descr-copyops"));
    setTxt($("copyops-column-label"), _("column-label"));
    setTxt($("copyops-column-subst"), _("column-subst"));
    setTxt($("copyops-column-decode"), _("column-decode"));
    setTxt($("copyops-addbtn"), _("add"));
    setTxt($("heading-visitops"), _("heading-visitops"));
    setTxt($("descr-visitops"), _("descr-visitops"));
    setTxt($("visitops-column-label"), _("column-label"));
    setTxt($("visitops-column-subst"), _("column-subst"));
    setTxt($("visitops-column-decode"), _("column-decode"));
    setTxt($("visitops-addbtn"), _("add"));
    setTxt($("ops-changebtn"), _("applyChanges"));
    setTxt($("ops-clonebtn"), _("addAsNewType"));
    document.removeEventListener("DOMContentLoaded", _dclHandler, false);
  },
  false);

var builtinElinks, customElinks, builtinUrlops, customUrlops;

function initData () {
  let elinksPat = $("embedded-links-pat");
  
  let builtinGroup = $("builtin-group");
  builtinGroup.label = _("builtinTypes");

  while (builtinGroup.hasChildNodes())
    builtinGroup.removeChild(builtinGroup.lastChild);

  for (let i = 0; i < builtinUrlops.length; i++)
    builtinGroup.appendChild(new Option(builtinUrlops[i].name, `bi-${i}`));

  let customGroup = $("custom-group");
  customGroup.label = _("customTypes");

  while (customGroup.hasChildNodes())
    customGroup.removeChild(customGroup.lastChild);

  for (let i = 0; i < customUrlops.length; i++)
    customGroup.appendChild(new Option(customUrlops[i].name, `cu-${i}`));
}

$("ops-import-btn").addEventListener(
  "click", () => $("ops-import").click(), false);

$("ops-import").addEventListener(
  "input",
  () => {
    let fr = new FileReader();
    fr.onerror = () => alert(_("fileReadFailed"));

    fr.onload = () => {
      let o, outArray = [];

      try {
        o = JSON.parse(fr.result);
        if (o.version != 1)
          throw new Error;

        for (let i = 0; i < o.customOps.length; i++) {
          let type = o.customOps[i];

          if (typeof type.name != "string" || typeof type.thumbnail != "string")
            throw new Error;

          let { name, thumbnail } = type;

          for (let j = 0; j < type.patterns.length; j++) {
            let p = type.patterns[j];
            if (typeof p != "string")
              throw new Error;
          }
          let { patterns } = type;
          let outType = { name, patterns, thumbnail };

          let outOps = [];
          for (let j = 0; j < type.copyOperations.length; j++) {
            let { label, subst } = type.copyOperations[j];
            outOps.push({ label, subst });
          }
          outType.copyOperations = outOps;

          outOps = [];
          for (let j = 0; j < type.visitOperations.length; j++) {
            let { label, subst } = type.visitOperations[j];
            outOps.push({ label, subst });
          }
          outType.visitOperations = outOps;

          outArray.push(outType);
        }
      } catch (e) {
        alert(_("invalidImport"));
      }

      let appendList = [];
      for (let type of outArray) {
        let idx = customUrlops.findIndex(ct => ct.name == type.name);
        if (idx == -1)
          appendList.push(type);
        else
          customUrlops[idx] = type;
      }
      customUrlops.push(...appendList);
      setCustomOps_thenReload();
    };

    fr.readAsText($("ops-import").files[0]);
  },
  false);

$("ops-export-btn").addEventListener(
  "click",
  async () => {
    if (!getDownloadPermission()) return;

    let sel = $("types-sel").selectedOptions;
    let exportList;

    if (sel.length == 0)
      exportList = customUrlops;
    else {
      exportList = [];
      for (let i = 0; i < sel.length; i++) {
        let val = sel[i].value, idx = Number(val.slice(3));
        exportList.push(
          (val.startsWith("bi-") ? builtinUrlops : customUrlops)[idx]);
      }
    }

    let url = URL.createObjectURL(
      new Blob(
        [JSON.stringify({version: 1, customOps: exportList})],
        {type: "application/json"}));

    doDownload(url);
    dropDownloadPermission();
  },
  false);

function enableRem () {
  let ts = $("types-sel");
  if (ts.selectedIndex >= 0 && ts.selectedOptions[0].value.startsWith("cu-"))
    $("btn-rem").disabled = false;
  else
    $("btn-rem").disabled = true;
}

function enableChanges () {
  let ts = $("types-sel");
  if (ts.selectedOptions.length == 1
      && ts.selectedOptions[0].value.startsWith("cu-"))
    $("ops-changebtn").disabled = false;
  else
    $("ops-changebtn").disabled = true;
}

function disableRem () {
  $("btn-rem").disabled = true;
}

function disableChanges () {
  $("ops-changebtn").disabled = true;
}

function wipeTable (aTbody) {
  while (aTbody.hasChildNodes())
    aTbody.removeChild(aTbody.lastChild);
}

function wipeEditor () {
  enableRem();
  disableChanges();

  for (let id of ["opgroup-name", "opgroup-pat", "opgroup-thumb"])
    $(id).value = "";

  wipeTable($("copyops-tbody"));
  wipeTable($("visitops-tbody"));
}

$("types-sel").addEventListener(
  "change",
  () => {
    let sel = $("types-sel").selectedOptions;

    if (sel.length == 1) {
      let val = sel[0].value;
      let isCustom = val.startsWith("cu-");
      let idx = Number(val.slice(3));
      let type = isCustom ? customUrlops[idx] : builtinUrlops[idx];
      enableRem();
      disableChanges();

      $("opgroup-name").value = type.name;
      $("opgroup-name").addEventListener("input", enableChanges, false);
      $("opgroup-pat").value = type.patterns.join("\n");
      $("opgroup-pat").addEventListener("input", enableChanges, false);
      $("opgroup-thumb").value = "thumbnail" in type ? type.thumbnail : "";
      $("opgroup-thumb").addEventListener("input", enableChanges, false);

      function _fillOpsList (aParent, aOps, aPrefix) {
        for (let op of aOps) {
          let row = document.createElement("tr");
          let cell = document.createElement("td");
          let inp = document.createElement("input");
          inp.type = "text";
          inp.spellcheck = false;
          inp.value = op.label;
          inp.addEventListener("input", enableChanges, false);
          cell.appendChild(inp);
          row.appendChild(cell);

          cell = document.createElement("td");
          cell.className = "wide-col";
          inp = document.createElement("input");
          inp.className = "wide-input";
          inp.type = "text";
          inp.spellcheck = false;
          inp.value = op.subst;
          inp.placeholder = _("replacedByMatches");
          inp.addEventListener("input", enableChanges, false);
          cell.appendChild(inp);
          row.appendChild(cell);

          cell = document.createElement("td");
          inp = document.createElement("input");
          inp.type = "checkbox";
          inp.checked = "decode" in op && op.decode;
          inp.addEventListener("input", enableChanges, false);
          cell.appendChild(inp);
          row.appendChild(cell);

          cell = document.createElement("td");
          let btn = document.createElement("button");
          btn.className = "opdel-btn";
          btn.value = `${aPrefix}-${aParent.children.length}`;
          setTxt(btn, _("remove"));
          btn.addEventListener("click", removeRow, false);
          cell.appendChild(btn);
          row.appendChild(cell);

          aParent.appendChild(row);
        }
      }

      let tbody = $("copyops-tbody");
      wipeTable(tbody);

      if ("copyOperations" in type)
        _fillOpsList(tbody, type.copyOperations, "c");

      tbody = $("visitops-tbody");
      wipeTable(tbody);

      if ("visitOperations" in type)
        _fillOpsList(tbody, type.visitOperations, "v");

      if (isCustom)
        enableRem();
      else
        disableRem();
      disableChanges();
    } else
      wipeEditor();
  },
  false);

$("btn-rem").addEventListener(
  "click",
  () => {
    let ts = $("types-sel");
    let sel = Array.from(ts.selectedOptions);

    if (sel.length == 0) {
      console.error("Remove button clicked with no option selected");
      return;
    }

    if (!sel[0].value.startsWith("cu-")) {
      console.error("Remove button clicked while non-custom option selected");
      return;
    }

    let cg = $("custom-group");
    for (let i = 0; i < sel.length; i++) {
      let opt = sel[i], idx = Number(opt.value.slice(3)) - i;
      customUrlops.splice(idx, 1);
      cg.removeChild(opt);
    }

    setCustomOps();

    if (cg.hasChildNodes()) {
      let start = cg.firstChild.index;
      for (let i = start, j = 0; j < customUrlops.length; i++, j++)
        ts.options[i].value = `cu-${j}`;
    }

    ts.selectedIndex = -1;
    wipeEditor();      
  },
  false);

$("btn-new").addEventListener(
  "click",
  () => {
    $("types-sel").selectedIndex = -1;
    wipeEditor();
    $("opgroup-name").focus();
  },
  false);

function removeRow (e) {
  let val = e.target.value;
  let prefix = val[0];
  let idx = Number(val.slice(2));
  let tbody = $(prefix == "c" ? "copyops-tbody" : "visitops-tbody");
  tbody.removeChild(tbody.children[idx]);

  for (let i = 0; i < tbody.children.length; i++)
    tbody.children[i].children[3].firstChild.value = `${prefix}-${i}`;
  enableChanges();
}

function addRow (aTbody, aPrefix) {
  let row = document.createElement("tr");
  let cell = document.createElement("td");
  let inp = document.createElement("input");
  inp.type = "text";
  inp.spellcheck = false;
  inp.addEventListener("input", enableChanges, false);
  cell.appendChild(inp);
  row.appendChild(cell);

  cell = document.createElement("td");
  cell.className = "wide-col";
  let inp2 = document.createElement("input");
  inp2.className = "wide-input";
  inp2.type = "text";
  inp2.placeholder = _("replacedByMatches");
  inp2.spellcheck = false;
  inp2.addEventListener("input", enableChanges, false);
  cell.appendChild(inp2);
  row.appendChild(cell);

  cell = document.createElement("td");
  inp2 = document.createElement("input");
  inp2.type = "checkbox";
  inp2.addEventListener("input", enableChanges, false);
  cell.appendChild(inp2);
  row.appendChild(cell);

  cell = document.createElement("td");
  let btn = document.createElement("button");
  btn.className = "opdel-btn";
  btn.value = `${aPrefix}-${aTbody.children.length}`;
  setTxt(btn, _("remove"));
  btn.addEventListener("click", removeRow, false);
  cell.appendChild(btn);
  row.appendChild(cell);
  aTbody.appendChild(row);
  inp.focus();
}

$("copyops-addbtn").addEventListener(
  "click", () => { addRow($("copyops-tbody"), "c"); }, false);
$("visitops-addbtn").addEventListener(
  "click", () => { addRow($("visitops-tbody"), "v"); }, false);

function makeType () {
  if ($("opgroup-name").value == "") {
    alert(_("mustHaveName"));
    $("opgroup-name").focus();
    return;
  }

  if ($("opgroup-pat").value == "") {
    alert(_("mustHavePat"));
    $("opgroup-pat").focus();
    return;
  }

  if ($("copyops-tbody").children.length == 0
      && $("visitops-tbody").children.length == 0) {
    alert(_("mustHaveOps"));
    return;
  }

  function _gatherOps (aTbody) {
    let ops = [];
    for (let row of aTbody.children) {
      let op = {
        label: row.children[0].firstChild.value,
        subst: row.children[1].firstChild.value
      };

      if (row.children[2].firstChild.checked) op.decode = true;
      ops.push(op);
    }

    return ops;
  }
    
  let type = {
    name: $("opgroup-name").value,
    patterns: $("opgroup-pat").value.split("\n")
  };

  let thumb = $("opgroup-thumb").value;
  if (thumb) type.thumbnail = thumb;
  let ops = _gatherOps($("copyops-tbody"));
  if (ops.length > 0) type.copyOperations = ops;
  ops = _gatherOps($("visitops-tbody"));
  if (ops.length > 0) type.visitOperations = ops;
  return type;
}

$("ops-changebtn").addEventListener(
  "click",
  () => {
    let type = makeType();
    let sel = $("types-sel").selectedOptions;

    if (sel.length != 1) {
      console.error(
        "Apply changes button clicked with other than 1 option selected");
      return;
    }

    let opt = sel[0], val = opt.value;

    if (!val.startsWith("cu-")) {
      console.error(
        "Apply changes button clicked while non-custom option selected");
      return;
    }

    let idx = Number(val.slice(3));
    opt.firstChild.textContent = type.name;
    customUrlops[idx] = type;
    setCustomOps();
    disableChanges();
  },
  false);

$("ops-clonebtn").addEventListener(
  "click",
  () => {
    let type = makeType();
    let opt = new Option(type.name, `cu-${customUrlops.length}`);
    $("custom-group").appendChild(opt);
    let ts = $("types-sel");
    ts.selectedIndex = opt.index;
    customUrlops.push(type);
    ts.dispatchEvent(new Event("change"));
    setCustomOps();
    disableChanges();
  },
  false);
