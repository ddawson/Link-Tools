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

let pc = document.getElementById("popup-content");
let row = document.createElement("div");
row.classList.add("row");
let cb = document.createElement("input");
cb.id = "linktools-opt_showThumbnails";
cb.type = "checkbox";

cb.addEventListener(
  "change",
  () => browser.runtime.sendMessage({
    msgType: "write-options",
    properties: { showThumbnails: cb.checked }
  }),
  false);

let port = browser.runtime.connect();

port.onMessage.addListener(msg => {
  switch (msg.msgType) {
  case "options-change":
    if (msg.changes.showThumbnails)
      cb.checked = msg.changes.showThumbnails.newValue;
    break;
  }
});

browser.runtime.sendMessage({ msgType: "get-options" }).then(opts => {
  if ("showThumbnails" in opts)
    cb.checked = opts.showThumbnails;
});

row.appendChild(cb);
let lbl = document.createElement("label");
lbl.htmlFor = cb.id;
let txt =
  document.createTextNode(browser.i18n.getMessage("showThumbnails"));
lbl.appendChild(txt);
row.appendChild(lbl);
pc.appendChild(row);

let oco = document.getElementById("open-customops");
txt = document.createTextNode(browser.i18n.getMessage("editCustomOps"));
oco.appendChild(txt);
oco.addEventListener(
  "click",
  () => {
    browser.runtime.sendMessage({ msgType: "open-customops" });
    window.close();
  },
  false);
