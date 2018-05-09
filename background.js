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

const _ = name => browser.i18n.getMessage(name);

let elinkPats = [], elinkPats_nd = [], builtinUrlops = [], customUrlops = [];

function makeRE (spec) {
  let patternRE = [];
  
  for (let p of spec.patterns)
    patternRE.push(new RegExp(p));
  spec.patternRE = patternRE;
}

function procTypes (o, list) {
  for (let spec of o) {
    makeRE(spec);

    const msgPat = /^__MSG_(.*?)__$/;

    let match = spec.name.match(msgPat);
    if (match) spec.name = _(match[1]);

    if ("copyOperations" in spec)
      for (let op of spec.copyOperations) {
        let match = op.label.match(msgPat);
        if (match) op.label = _(match[1]);
      }

    if ("visitOperations" in spec)
      for (let op of spec.visitOperations) {
        let match = op.label.match(msgPat);
        if (match) op.label = _(match[1]);
      }

    list.push(spec);
  }
}

function procUrlops (o) {
  for (let patStr of o.embeddedLinkPatterns)
    elinkPats.push(new RegExp(patStr));

  for (let patStr of o.embeddedLinkPatterns_nodecode)
    elinkPats_nd.push(new RegExp(patStr));

  procTypes(o.types, builtinUrlops);
}

fetch("urlops.json").then(resp => resp.json()).then(o => procUrlops(o));

browser.storage.local.get("customOps").then(o => {
  if ("customOps" in o) procTypes(o.customOps, customUrlops);
});

browser.contextMenus.create({
  title: _("extensionName"),
  id: "linktools-menu",
  contexts: ["link"],
  enabled: false,
});

function checkPatterns (aUrl, aFindAllMatches) {
  let union = builtinUrlops.concat(customUrlops);
  let urls = [aUrl];

  for (let p of elinkPats) {
    let match = aUrl.match(p);
    if (match)
      urls.push(decodeURIComponent(match[1]));
  }

  for (let p of elinkPats_nd) {
    let match = aUrl.match(p);
    if (match)
      urls.push(match[1]);
  }

  let ops = [];

  for (let i = 0; i < union.length; i++) {
    let spec = union[i];

    for (let p of spec.patternRE) {
      let matched = false;

      for (let url of urls) {
        if (url.match(p)) {
          matched = true;

	  if ("copyOperations" in spec)
            for (let op of spec.copyOperations)
              ops.push({
                type: "copy",
                url,
                newTab: false,
                matchedPattern: p,
                label: op.label,
                subst: op.subst,
                decode: "decode" in op && op.decode
              });

          if ("visitOperations" in spec) {
            for (let op of spec.visitOperations)
              ops.push({
                type: "visit",
                url,
                newTab: false,
                matchedPattern: p,
                label: op.label,
                subst: op.subst,
                decode: "decode" in op && op.decode
              });

            for (let op of spec.visitOperations)
              ops.push({
                type: "visit",
                url,
                newTab: true,
                matchedPattern: p,
                label: op.label + browser.i18n.getMessage("newTab"),
                subst: op.subst,
                decode: "decode" in op && op.decode
              });
          }
        }
      }

      if (matched) break;
    }

    if (!aFindAllMatches) break;
  }

  return ops;
}

function getThumbnailUrl (aUrl) {
  let union = builtinUrlops.concat(customUrlops);

  for (let i = 0; i < union.length; i++) {
    let spec = union[i];
    if (!("thumbnail" in spec)) continue;

    for (let p of spec.patternRE) {
      if (aUrl.match(p)) return aUrl.replace(p, spec.thumbnail);
    }
  }

  return null;
}

let menuMap;

browser.contextMenus.onShown.addListener((info, tab) => {
  let ops = checkPatterns(new URL(info.linkUrl, info.pageUrl).href, true);
  if (!ops) return;
  browser.contextMenus.update("linktools-menu", { enabled: true });
  menuMap = {};

  for (let i = 0; i < ops.length; i++) {
    let op = ops[i];
    let id = `linktools-ctx${i}`;

    browser.contextMenus.create({
      title: op.label,
      id,
      parentId: "linktools-menu"
    });
    menuMap[id] = {
      type: op.type,
      url: op.url,
      newTab: op.newTab,
      pattern: op.matchedPattern,
      subst: op.subst,
      decode: op.decode
    };
  }

  browser.contextMenus.refresh();
});

browser.contextMenus.onHidden.addListener(() => {
  for (let id in menuMap)
    browser.contextMenus.remove(id);
  browser.contextMenus.update("linktools-menu", {enabled: false});
});

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

browser.contextMenus.onClicked.addListener((info, tab) => {
  let id = info.menuItemId;

  if (id in menuMap) {
    let mi = menuMap[id];
    let res = mi.decode ?
        replaceURL_decode(mi.url, mi.pattern, mi.subst) :
        mi.url.replace(mi.pattern, mi.subst);

    if (mi.type == "visit" && mi.newTab) {
      browser.tabs.query({currentWindow: true, active: true}).then(([tab]) => {
        browser.tabs.create({
          active: false, url: res, openerTabId: tab.id, index: tab.index + 1});
      });
    } else
      browser.tabs.sendMessage(
        tab.id, {msgType: mi.type, url: res, newTab: mi.newTab});
  } else
    console.error(
      `Got context menu click for ${id}, which is not registered.`);
});

let customOps_port = null;

browser.runtime.onMessage.addListener(msg => {
  switch (msg.msgType) {
  case "get-options":
    return new Promise(async resolve => {
      resolve(await browser.storage.local.get());
    });
    break;

  case "write-options":
    let { properties } = msg;
    properties.version = 1;
    browser.storage.local.set(properties);
    break;

  case "open-customops":
    if (customOps_port)
      browser.tabs.update(customOps_port.sender.tab.id, { active: true });
    else
      browser.tabs.create({ active: true, url: "pages/customops.html" });
    break;

  case "get-urlops":
    return new Promise(resolve => resolve([builtinUrlops, customUrlops]));
    break;

  case "set-customops":
    let { customOps } = msg;
    browser.storage.local.set({ version: 1, customOps });
    for (let o of customOps) makeRE(o);
    customUrlops = customOps;
    break;

  case "get-ops":
    return new Promise(async resolve => {
      let tab =
          (await browser.tabs.query({currentWindow: true, active: true}))[0];
      resolve([tab.id, checkPatterns(tab.url, true)]);
    });
    break;

  case "pa-visit":
    if (msg.newTab) {
      browser.tabs.get(msg.tabId).then(tab => {
        browser.tabs.create(
          { active: false, url: msg.url, openerTabId: msg.tabId,
            index: tab.index + 1 });
      });
    } else
      browser.tabs.sendMessage(msg.tabId, {msgType: "visit", url: msg.url});
    break;

  case "get-thumbnail-url":
    return new Promise(resolve => { resolve(getThumbnailUrl(msg.url)); });
    break;
  }
});

let msgPorts = [];

browser.runtime.onConnect.addListener(port => {
  if (port.name == "customops") customOps_port = port;
  msgPorts.unshift(port);

  port.onDisconnect.addListener(() => {
    if (port.name == "customops") customOps_port = null;
    let i = msgPorts.indexOf(port);
    msgPorts.splice(i, 1);
  });
});

browser.storage.onChanged.addListener(changes => {
  for (let port of msgPorts)
    port.postMessage({ msgType: "options-change", changes });
});
