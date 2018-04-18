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

let savedTabId, savedOps;

function handle_click (e) {
  if (e.button == 2) return;

  let op = savedOps[e.target.value];
  let res = op.url.replace(op.matchedPattern, op.subst);
  if ("decode" in op && op.decode)
    res = decodeURIComponent(res).replace(/\+/g, " ");

  if (op.type == "copy") {
    let copyBox = document.createElement("input");
    copyBox.type = "text";
    copyBox.style.position = "absolute";
    copyBox.style.opacity = "0";
    document.body.appendChild(copyBox);
    copyBox.value = res;
    copyBox.select();
    document.execCommand("copy");
  } else if (op.type == "visit") {
    browser.runtime.sendMessage({
      msgType: "pa-visit",
      tabId: savedTabId,
      url: res,
      newTab: e.button == 1
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
    let item = document.createElement("data");
    item.classList.add("item");
    item.value = String(i);
    let txt = document.createTextNode(ops[i].label);
    item.appendChild(txt);
    item.addEventListener("mouseup", handle_click, false);
    pc.appendChild(item);
  }
});
