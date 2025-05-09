/*
    Link Tools: Configurable copy and visit operations for links in Firefox
    Copyright (C) 2025  Daniel Dawson <danielcdawson@gmail.com>

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
    let halves = _("customOps_description", "$1").split("$1");
    let p = $("descr-main");
    p.appendChild(document.createTextNode(halves[0]));
    let link = document.createElement("a");
    link.href = "https://addons.mozilla.org/addon/link-tools/";
    setTxt(link, _("customOps_description_linkText"));
    p.appendChild(link);
    p.appendChild(document.createTextNode(halves[1]));

    setTxt($("ops-import-btn"), _("import"));
    setTxt($("ops-export-btn"), _("export"));
    setTxt($("heading-link-types"), _("linkTypes"));
    setTxt($("descr-link-types"), _("linkTypes_description"));
    setTxt($("btn-rem"), _("remove"));
    setTxt($("btn-new"), _("new"));
    setTxt($("opgroup-name-lbl"), _("customops_name_lbl"));
    setTxt($("opgroup-pat-lbl"), _("customops_pat_lbl"));
    $("opgroup-pat").placeholder = _("regularExpressions");
    setTxt($("opgroup-thumb-lbl"), _("customops_thumb_lbl"));
    $("opgroup-thumb").placeholder = _("optional_replacedByMatches");
    setTxt($("heading-copyops"), _("heading_copyops"));
    setTxt($("descr-copyops"), _("descr_copyops"));
    setTxt($("copyops-column-label"), _("column_label"));
    setTxt($("copyops-column-subst"), _("column_subst"));
    setTxt($("copyops-column-decode"), _("column_decode"));
    setTxt($("copyops-addbtn"), _("add"));
    setTxt($("heading-visitops"), _("heading_visitops"));
    setTxt($("descr-visitops"), _("descr_visitops"));
    setTxt($("visitops-column-label"), _("column_label"));
    setTxt($("visitops-column-subst"), _("column_subst"));
    setTxt($("visitops-column-decode"), _("column_decode"));
    setTxt($("visitops-addbtn"), _("add"));
    setTxt($("ops-changebtn"), _("applyChanges"));
    setTxt($("ops-clonebtn"), _("addAsNewType"));
    setTxt($("heading-embedded-links"), _("embeddedLinks"));
    setTxt($("descr-embedded-links"), _("embeddedLinks_description"));
    setTxt($("heading-embedded-links-builtin"), _("builtin"));
    setTxt($("elinks-builtin-reg-label"), _("regular"));
    setTxt($("elinks-builtin-nodecode-label"), _("nodecode"));
    setTxt($("heading-embedded-links-custom"), _("custom"));
    setTxt($("elinks-custom-reg-label"), _("regular"));
    setTxt($("elinks-custom-nodecode-label"), _("nodecode"));
    $("elinks-custom-reg-pat").placeholder = _("regularExpressions");
    $("elinks-custom-nodecode-pat").placeholder = _("regularExpressions");
    setTxt($("heading-link-embeddings"), _("linkEmbeddings"));
    setTxt($("descr-link-embeddings"), _("linkEmbeddings_description"));
    setTxt($("heading-linkembs-builtin"), _("builtin"));
    setTxt($("heading-linkembs-builtinreg"), _("regular"));
    setTxt($("linkembs-builtinreg-column-copyLabel"), _("column_copyLabel"));
    setTxt($("linkembs-builtinreg-column-visitLabel"), _("column_visitLabel"));
    setTxt($("linkembs-builtinreg-column-template"), _("column_template"));
    setTxt($("heading-linkembs-builtinne"), _("noencode"));
    setTxt($("linkembs-builtinne-column-copyLabel"), _("column_copyLabel"));
    setTxt($("linkembs-builtinne-column-visitLabel"), _("column_visitLabel"));
    setTxt($("linkembs-builtinne-column-template"), _("column_template"));
    setTxt($("heading-linkembs-custom"), _("custom"));
    setTxt($("heading-linkembs-customreg"), _("regular"));
    setTxt($("linkembs-customreg-column-copyLabel"), _("column_copyLabel"));
    setTxt($("linkembs-customreg-column-visitLabel"), _("column_visitLabel"));
    setTxt($("linkembs-customreg-column-template"), _("column_template"));
    setTxt($("linkembs-customreg-addbtn"), _("add"));
    setTxt($("heading-linkembs-customne"), _("noencode"));
    setTxt($("linkembs-customne-column-copyLabel"), _("column_copyLabel"));
    setTxt($("linkembs-customne-column-visitLabel"), _("column_visitLabel"));
    setTxt($("linkembs-customne-column-template"), _("column_template"));
    setTxt($("linkembs-customne-addbtn"), _("add"));
    document.removeEventListener("DOMContentLoaded", _dclHandler, false);
  },
  false);

var builtinElinks, builtinElinksNodecode, customElinks, customElinksNodecode,
    builtinLinkEmbs, builtinLinkEmbsNoencode,
    customLinkEmbs, customLinkEmbsNoencode,
    builtinUrlops, customUrlops;

function initData () {
  $("elinks-builtin-reg-pat").value = builtinElinks.join("\n");
  $("elinks-builtin-nodecode-pat").value = builtinElinksNodecode.join("\n");
  $("elinks-custom-reg-pat").value = customElinks.join("\n");
  $("elinks-custom-nodecode-pat").value = customElinksNodecode.join("\n");

  function _fillLinkEmbs (aTbody, aAry, aPrefix) {
    while (aTbody.hasChildNodes())
      aTbody.removeChild(aTbody.lastChild);

    for (let i = 0; i < aAry.length; i++) {
      let row = document.createElement("tr");
      let cell = document.createElement("td");
      let inp = document.createElement("input");
      inp.type = "text";
      inp.spellcheck = false;
      inp.value = aAry[i][0];
      if (!aPrefix) inp.readOnly = true;
      cell.appendChild(inp);
      row.appendChild(cell);

      cell = document.createElement("td");
      inp = document.createElement("input");
      inp.type = "text";
      inp.spellcheck = false;
      inp.value = aAry[i][1];
      if (!aPrefix) inp.readOnly = true;
      cell.appendChild(inp);
      row.appendChild(cell);

      cell = document.createElement("td");
      cell.className = "wide-col";
      inp = document.createElement("input");
      inp.className = "wide-input";
      inp.type = "text";
      inp.spellcheck = false;
      inp.value = aAry[i][2];
      if (aPrefix)
        inp.placeholder = _("template_placeholder");
      else
        inp.readOnly = true;
      cell.appendChild(inp);
      row.appendChild(cell);

      if (aPrefix) {
        cell = document.createElement("td");
        let btn = document.createElement("button");
        btn.className = "opdel-btn";
        btn.value = `${aPrefix}-${aTbody.children.length}`;
        setTxt(btn, _("remove"));
        btn.addEventListener("click", removeLinkembRow, false);
        cell.appendChild(btn);
        row.appendChild(cell);
      }

      aTbody.appendChild(row);
    }
  }

  _fillLinkEmbs($("linkembs-builtinreg-tbody"), builtinLinkEmbs, null);
  _fillLinkEmbs($("linkembs-builtinne-tbody"), builtinLinkEmbsNoencode, null);
  _fillLinkEmbs($("linkembs-customreg-tbody"), customLinkEmbs, "r");
  _fillLinkEmbs($("linkembs-customne-tbody"), customLinkEmbsNoencode, "n");

  let group = $("builtin-group");
  group.label = _("builtinTypes");

  while (group.hasChildNodes())
    group.removeChild(group.lastChild);

  for (let i = 0; i < builtinUrlops.length; i++)
    group.appendChild(new Option(builtinUrlops[i].name, `bi-${i}`));

  group = $("custom-group");
  group.label = _("customTypes");

  while (group.hasChildNodes())
    group.removeChild(group.lastChild);

  for (let i = 0; i < customUrlops.length; i++)
    group.appendChild(new Option(customUrlops[i].name, `cu-${i}`));
}

$("ops-import-btn").addEventListener(
  "click", () => $("ops-import").click(), false);

$("ops-import").addEventListener(
  "input",
  () => {
    let fr = new FileReader();
    fr.onerror = () => alert(_("fileReadFailed"));

    fr.onload = () => {
      let o, customElinkPats = [], customElinkPats_nd = [],
          newCustomLinkEmbs = [], newCustomLinkEmbs_ne = [], outArray = [];

      try {
        o = JSON.parse(fr.result);
        let types;
        if (o.version == 1)
          types = o.customOps;
        else if (o.version == 2) {
          customElinkPats = o.embeddedLinks;
          customElinkPats_nd = o.embeddedLinks_nodecode;
          types = o.types;
        } else if (o.version == 3) {
          customElinkPats = o.embeddedLinks;
          customElinkPats_nd = o.embeddedLinks_nodecode;
          newCustomLinkEmbs = o.linkEmbeddings;
          newCustomLinkEmbs_ne = o.linkEmbeddings_noencode;
          types = o.types;
        } else
          throw new Error;

        for (let i = 0; i < types.length; i++) {
          let type = types[i];

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
      } catch {
        alert(_("invalidImport"));
      }

      let appendList = [];
      for (let pat of customElinkPats) {
        let idx = customElinks.indexOf(pat);
        if (idx == -1)
          appendList.push(pat);
      }
      customElinks.push(...appendList);

      appendList = [];
      for (let pat of customElinkPats_nd) {
        let idx = customElinksNodecode.indexOf(pat);
        if (idx == -1)
          appendList.push(pat);
      }
      customElinksNodecode.push(...appendList);

      customLinkEmbs.push(...newCustomLinkEmbs);
      customLinkEmbsNoencode.push(...newCustomLinkEmbs_ne);

      appendList = [];
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
    if (!(await getDownloadPermission())) return;

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
        [JSON.stringify({version: 3, embeddedLinks: customElinks,
                         embeddedLinks_nodecode: customElinksNodecode,
                         linkEmbeddings: customLinkEmbs,
                         linkEmbeddings_noencode: customLinkEmbsNoencode,
                         types: exportList})],
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

function enableAdd () {
  let ts = $("types-sel");
  if ((ts.selectedIndex >= 0 && ts.selectedOptions[0].value.startsWith("cu-"))
      || ts.selectedIndex < 0) {
    $("copyops-addbtn").disabled = false;
    $("visitops-addbtn").disabled = false;
  } else {
    $("copyops-addbtn").disabled = true;
    $("visitops-addbtn").disabled = true;
  }
}

function enableForm () {
  for (let id of ["opgroup-name", "opgroup-pat", "opgroup-thumb"])
    $(id).readOnly = false;
}

function enableChanges () {
  let ts = $("types-sel");
  if (ts.selectedOptions.length == 1
      && ts.selectedOptions[0].value.startsWith("cu-"))
    $("ops-changebtn").disabled = false;
  else
    $("ops-changebtn").disabled = true;
}

function enableClone () {
  let ts = $("types-sel");
  if ((ts.selectedOptions.length == 1
       && ts.selectedOptions[0].value.startsWith("cu-"))
      || ts.selectedIndex == -1)
    $("ops-clonebtn").disabled = false;
  else
    $("ops-clonebtn").disabled = true;
}

function disableRem () {
  $("btn-rem").disabled = true;
}

function disableAdd () {
  $("copyops-addbtn").disabled = true;
  $("visitops-addbtn").disabled = true;
}

function disableForm () {
  for (let id of ["opgroup-name", "opgroup-pat", "opgroup-thumb"])
    $(id).readOnly = true;
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
  enableAdd();
  enableForm();
  disableChanges();

  for (let id of ["opgroup-name", "opgroup-pat", "opgroup-thumb"])
    $(id).value = "";

  wipeTable($("copyops-tbody"));
  wipeTable($("visitops-tbody"));
}

function elinksChanged () {
  customElinks = $("elinks-custom-reg-pat").value.split("\n") || [];
  if (customElinks.length == 1 && customElinks[0] == "") customElinks = [];
  customElinksNodecode = $("elinks-custom-nodecode-pat").value.split("\n");
  if (customElinksNodecode.length == 1 && customElinksNodecode[0] == "")
    customElinksNodecode = [];
  setCustomOps();
}

$("elinks-custom-reg-pat").addEventListener("change", elinksChanged, false);
$("elinks-custom-nodecode-pat").addEventListener(
  "change", elinksChanged, false);

function linkembsChanged () {
  let ary = [];
  let tbody = $("linkembs-customreg-tbody");

  for (let row of tbody.childNodes) {
    let cLbl = row.childNodes[0].firstChild.value;
    let vLbl = row.childNodes[1].firstChild.value;
    let tmpl = row.childNodes[2].firstChild.value;
    ary.push([cLbl, vLbl, tmpl]);
  }

  customLinkEmbs = ary;
  ary = [];
  tbody = $("linkembs-customne-tbody");

  for (let row of tbody.childNodes) {
    let cLbl = row.childNodes[0].firstChild.value;
    let vLbl = row.childNodes[1].firstChild.value;
    let tmpl = row.childNodes[2].firstChild.value;
    ary.push([cLbl, vLbl, tmpl]);
  }

  customLinkEmbsNoencode = ary;
  setCustomOps();
}

$("linkembs-customreg-tbody").addEventListener(
  "input", linkembsChanged, false);
$("linkembs-customne-tbody").addEventListener(
  "input", linkembsChanged, false);

function removeLinkembRow (e) {
  let val = e.target.value;
  let prefix = val[0];
  let idx = Number(val.slice(2));
  let tbody = $(prefix == "r" ? "linkembs-customreg-tbody"
                : "linkembs-customne-tbody");
  tbody.removeChild(tbody.children[idx]);

  for (let i = 0; i < tbody.children.length; i++)
    tbody.children[i].children[3].firstChild.value = `${prefix}-${i}`;
  setCustomOps();
}

function addLinkembRow (aTbody, aPrefix) {
  let row = document.createElement("tr");
  let cell = document.createElement("td");
  let inp = document.createElement("input");
  inp.type = "text";
  inp.spellcheck = false;
  inp.placeholder = _("copyvisitlabel_placeholder");
  cell.appendChild(inp);
  row.appendChild(cell);

  cell = document.createElement("td");
  inp = document.createElement("input");
  inp.type = "text";
  inp.spellcheck = false;
  inp.placeholder = _("copyvisitlabel_placeholder");
  cell.appendChild(inp);
  row.appendChild(cell);

  cell = document.createElement("td");
  cell.className = "wide-col";
  inp = document.createElement("input");
  inp.className = "wide-input";
  inp.type = "text";
  inp.spellcheck = false;
  inp.placeholder = _("template_placeholder");
  cell.appendChild(inp);
  row.appendChild(cell);

  cell = document.createElement("td");
  let btn = document.createElement("button");
  btn.className = "opdel-btn";
  btn.value = `${aPrefix}-${aTbody.children.length}`;
  setTxt(btn, _("remove"));
  btn.addEventListener("click", removeLinkembRow, false);
  cell.appendChild(btn);
  row.appendChild(cell);

  aTbody.appendChild(row);
}

$("linkembs-customreg-addbtn").addEventListener(
  "click",
  () => { addLinkembRow($("linkembs-customreg-tbody"), "r"); },
  false);
$("linkembs-customne-addbtn").addEventListener(
  "click",
  () => { addLinkembRow($("linkembs-customne-tbody"), "n"); },
  false);

$("types-sel").addEventListener(
  "change",
  () => {
    let sel = $("types-sel").selectedOptions;

    if (sel.length == 1) {
      let val = sel[0].value;
      let isCustom = val.startsWith("cu-");
      let idx = Number(val.slice(3));
      let type = isCustom ? customUrlops[idx] : builtinUrlops[idx];

      enableForm();
      $("opgroup-name").value = type.name;
      $("opgroup-pat").value = type.patterns.join("\n");
      $("opgroup-thumb").value = "thumbnail" in type ? type.thumbnail : "";
      for (let id of ["opgroup-name", "opgroup-pat", "opgroup-thumb"])
        if (isCustom)
          $(id).addEventListener("input", enableChanges, false);
      if (!isCustom) disableForm();

      function _fillOpsList (aParent, aOps, aPrefix) {
        for (let op of aOps) {
          let row = document.createElement("tr");
          let cell = document.createElement("td");
          let inp = document.createElement("input");
          inp.type = "text";
          inp.spellcheck = false;
          inp.value = op.label;
          if (isCustom)
            inp.addEventListener("input", enableChanges, false);
          else
            inp.readOnly = true;
          cell.appendChild(inp);
          row.appendChild(cell);

          cell = document.createElement("td");
          cell.className = "wide-col";
          inp = document.createElement("input");
          inp.className = "wide-input";
          inp.type = "text";
          inp.spellcheck = false;
          inp.value = op.subst;
          if (isCustom) {
            inp.placeholder = _("replacedByMatches");
            inp.addEventListener("input", enableChanges, false);
          } else
            inp.readOnly = true;
          cell.appendChild(inp);
          row.appendChild(cell);

          cell = document.createElement("td");
          inp = document.createElement("input");
          inp.type = "checkbox";
          inp.checked = "decode" in op && op.decode;
          if (isCustom)
            inp.addEventListener("input", enableChanges, false);
          else
            inp.disabled = true;
          cell.appendChild(inp);
          row.appendChild(cell);

          if (isCustom) {
            cell = document.createElement("td");
            let btn = document.createElement("button");
            btn.className = "opdel-btn";
            btn.value = `${aPrefix}-${aParent.children.length}`;
            setTxt(btn, _("remove"));
            btn.addEventListener("click", removeRow, false);
            cell.appendChild(btn);
            row.appendChild(cell);
          }

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

      enableRem();
      enableAdd();
      disableChanges();
    } else
      wipeEditor();
    enableClone();
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
    enableForm();
    enableClone();
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
