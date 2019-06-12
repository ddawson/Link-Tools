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

const _ = name => browser.i18n.getMessage(name);

fetch("urlops.json").then(resp => resp.json()).then(o => procUrlops(o));

browser.storage.local.get().then(o => {
  if ("embeddedLinkPatterns" in o)
    procElinks(o.embeddedLinkPatterns, elinkCustomPats);
  if ("embeddedLinkPatterns_nodecode" in o)
    procElinks(o.embeddedLinkPatterns_nodecode, elinkCustomPats_nd);
  if ("linkEmbeddings" in o)
    procLinkEmbs(o.linkEmbeddings, customLinkEmbs);
  if ("linkEmbeddings_noencode" in o) {
    procLinkEmbs(o.linkEmbeddings_noencode, customLinkEmbs_ne);
  if ("customOps" in o) procTypes(o.customOps, customUrlops);
  if ("types" in o) procTypes(o.types, customUrlops);
});

browser.contextMenus.create({
  title: _("extensionName"),
  id: "linktools-menu",
  contexts: ["link"],
  enabled: false,
});

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

browser.contextMenus.onClicked.addListener((info, tab) => {
  let id = info.menuItemId;

  if (id in menuMap) {
    let mi = menuMap[id];
    let res = mi.decode ?
        replaceURL_decode(mi.url, mi.pattern, mi.subst) :
        mi.url.replace(mi.pattern, mi.subst);

    if (mi.type == "visit") {
      if (mi.newTab) {
        browser.tabs.query({currentWindow: true, active: true})
          .then(([tab]) => {
            browser.tabs.create({
              active: false, url: res, openerTabId: tab.id,
              index: tab.index + 1});
          });
      } else
        browser.tabs.sendMessage(
          tab.id, {msgType: "visit", url: res, newTab: false});
    } else
      navigator.clipboard.writeText(res);
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
    properties.version = 3;
    browser.storage.local.set(properties);
    break;

  case "open-customops":
    if (customOps_port)
      browser.tabs.update(customOps_port.sender.tab.id, { active: true });
    else
      browser.tabs.create({ active: true, url: "pages/customops.html" });
    break;

  case "get-urlops":
    return new Promise(resolve => resolve(
      [elinkPats.map(v => v.source), elinkPats_nd.map(v => v.source),
       elinkCustomPats.map(v => v.source),
       elinkCustomPats_nd.map(v => v.source),
       linkEmbs, linkEmbs_ne, customLinkEmbs, customLinkEmbs_ne,
       builtinUrlops, customUrlops]));
    break;

  case "set-customops":
    let { embeddedLinkPatterns, embeddedLinkPatterns_nodecode,
          linkEmbeddings, linkEmbeddings_noencode, types } = msg;
    browser.storage.local.set({
      version: 3,
      embeddedLinkPatterns,
      embeddedLinkPatterns_nodecode,
      linkEmbeddings,
      linkEmbeddings_noencode,
      types
    });
    browser.storage.local.remove("customOps");
    for (let o of types) makeRE(o);
    elinkCustomPats = embeddedLinkPatterns.map(v => new RegExp(v));
    elinkCustomPats_nd = embeddedLinkPatterns_nodecode.map(v => new RegExp(v));
    customLinkEmbs = linkEmbeddings;
    customLinkEmbs_ne = linkEmbeddings_noencode;
    customUrlops = types;
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
