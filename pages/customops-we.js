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

const _ = (id, ...parms) => browser.i18n.getMessage(id, ...parms);

let port = browser.runtime.connect({ name: "customops" });

document.documentElement.lang = _("@@ui_locale");

browser.runtime.sendMessage({ msgType: "get-urlops" }).
  then(([elinks_builtin, elinks_builtin_nodecode,
         elinks_custom, elinks_custom_nodecode,
         linkembs_builtin, linkembs_builtin_ne,
         linkembs_custom, linkembs_custom_ne,
         builtin, custom]) => {
    builtinElinks = elinks_builtin;
    builtinElinksNodecode = elinks_builtin_nodecode;
    customElinks = elinks_custom;
    customElinksNodecode = elinks_custom_nodecode;
    builtinLinkEmbs = linkembs_builtin;
    builtinLinkEmbsNoencode = linkembs_builtin_ne;
    customLinkEmbs = linkembs_custom;
    customLinkEmbsNoencode = linkembs_custom_ne;

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
    embeddedLinkPatterns: customElinks,
    embeddedLinkPatterns_nodecode: customElinksNodecode,
    linkEmbeddings: customLinkEmbs,
    linkEmbeddings_noencode: customLinkEmbsNoencode,
    types: customUrlops
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
  } catch {
    alert(_("exportFailed"));
    return false;
  }
  return true;
}

function dropDownloadPermission () {
  browser.permissions.remove({permissions: ["downloads"]});
}
