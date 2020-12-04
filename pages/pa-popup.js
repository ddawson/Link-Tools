/*
    Link Tools: Configurable copy and visit operations for links in Firefox
    Copyright (C) 2019  Daniel Dawson <danielcdawson@gmail.com>

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

let savedTabId, savedOps;

function replaceURL_decode (aUrl, aPattern, aSubst) {
  let match = aUrl.match(aPattern);
  let sstr = aSubst, re = /^(?:[^$]|\$[^$1-9]|\${2})*\$(?=[1-9])/,
      list = [];

  while (sstr) {
    let m = sstr.match(re);
    if (m) {
      let s = m[0], l = s.length, n = Number(sstr[l]);
      list.push(s.slice(0, l-1),
                n < match.length ?
                decodeURIComponent(match[n]).replace(/\+/g, " ") : "$" + n);
      sstr = sstr.slice(l+1);
    } else {
      list.push(sstr);
      sstr = "";
    }
  }

  let newSubst = list.join("");
  return aUrl.replace(aPattern, newSubst);
}

function handle_click (e) {
  if (e.button == 2) return;

  let [gn, idx] = e.target.value.split(",");
  gn = Number(gn);
  idx = Number(idx);
  let op = savedOps[gn].ops[idx];
  let res = "decode" in op && op.decode ?
      replaceURL_decode(op.url, op.matchedPattern, op.subst) :
      op.url.replace(op.matchedPattern, op.subst);

  if (op.type == "copy")
    navigator.clipboard.writeText(res);
  else if (op.type == "visit") {
    browser.runtime.sendMessage({
      msgType: "pa-visit",
      tabId: savedTabId,
      url: res,
      newTab: op.newTab || e.button == 1
    });
  }
  window.close();
}

browser.runtime.sendMessage({msgType: "get-ops"}).then(([tabId, ops]) => {
  savedTabId = tabId;
  savedOps = ops;
  let pc = document.getElementById("popup-content");

  if (ops.length == 0) {
    let item = document.createElement("div");
    item.classList.add("item", "disabled");
    let txt = document.createTextNode(browser.i18n.getMessage("noOpsAvail"));
    item.appendChild(txt);
    pc.appendChild(item);
    return;
  }

  for (let i = 0; i < ops.length; i++) {
    let group = ops[i];
    let item = document.createElement("data");
    item.classList.add("grouphead");
    let txt = document.createTextNode(group.label);
    item.appendChild(txt);
    pc.appendChild(item);

    for (let j = 0; j < group.ops.length; j++) {
      item = document.createElement("data");
      item.classList.add("item");
      item.value = `${i},${j}`;
      txt = document.createTextNode(group.ops[j].label);
      item.appendChild(txt);
      item.addEventListener("mouseup", handle_click, false);
      pc.appendChild(item);
    }
  }
});
