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

const _ = (id, ...parms) => browser.i18n.getMessage(id, ...parms);

let port = browser.runtime.connect({ name: "customops" });

document.documentElement.lang = _("@@ui_locale");

browser.runtime.sendMessage({ msgType: "get-urlops" }).
  then(([builtin, custom]) => {
    for (let type of builtin)
      if ("patternRE" in type) delete type.patternRE;
    builtinUrlops = builtin;
    for (let type of custom)
      if ("patternRE" in type) delete type.patternRE;
    customUrlops = custom;
    initData();
  });

function setCustomOps () {
  return browser.runtime.sendMessage({
    msgType: "set-customops",
    customOps: customUrlops
  });
}

function setCustomOps_thenReload () {
  setCustomOps().then(() => history.go(0));
}

async function getDownloadPermission () {
  let res = await browser.permissions.request({permissions: ["downloads"]});
  if (!res) {
    alert(_("downloadsPermissionFailed"));
    return false;
  }
  return true;
}

async function doDownload (aUrl) {
  try {
    await browser.downloads.download(
      { url: aUrl, filename: "linktools-custom.json",
        conflictAction: "overwrite" });
  } catch (e) {
    alert(_("exportFailed"));
    return false;
  }
  return true;
}

function dropDownloadPermission () {
  browser.permissions.remove({permissions: ["downloads"]});
}
