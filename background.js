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

var elinkPats = [], elinkPats_nd = [],
    elinkCustomPats = [], elinkCustomPats_nd = [],
    linkEmbs = [], linkEmbs_ne = [],
    customLinkEmbs = [], customLinkEmbs_ne = [],
    builtinUrlops = [], customUrlops = [];

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

function procElinks (o, list) {
  for (let patStr of o)
    list.push(new RegExp(patStr));
}

function procLinkEmbs (o, list) {
  const msgPat = /^__MSG_(.*?)__$/;

  for (let t of o) {
    let match = t[0].match(msgPat);
    if (match) t[0] = _(match[1]);
    match = t[1].match(msgPat);
    if (match) t[1] = _(match[1]);
    list.push(t);
  }
}

function procUrlops (o) {
  procElinks(o.embeddedLinkPatterns, elinkPats);
  procElinks(o.embeddedLinkPatterns_nodecode, elinkPats_nd);
  procLinkEmbs(o.linkEmbeddings, linkEmbs);
  procLinkEmbs(o.linkEmbeddings_noencode, linkEmbs_ne);
  procTypes(o.types, builtinUrlops);
}

function checkPatterns (aUrl, aFindAllMatches) {
  let elinkPatsUnion = elinkPats.concat(elinkCustomPats);
  let elinkPatsUnion_nd = elinkPats_nd.concat(elinkCustomPats_nd);
  let linkEmbsUnion = linkEmbs.concat(customLinkEmbs);
  let linkEmbsUnion_ne = linkEmbs_ne.concat(customLinkEmbs_ne);
  let urlopsUnion = builtinUrlops.concat(customUrlops);
  let ops = [], group;
  let urls = [aUrl];

  group = {label: `[ ${_("embeddedLinksGroup")} ]`, ops: []};
  function addEmbedCopyOp (aUrl) {
    group.ops.push({
      type: "copy",
      url: aUrl,
      newTab: false,
      matchedPattern: "",
      label: _("copyEmbeddedLink").replace("$1", aUrl.substr(0, 25)) + "…",
      subst: "",
      decode: false
    });
  }

  let matched = false;
  for (let i = 0; i < urls.length; i++) {
    for (let p of elinkPatsUnion) {
      let match = urls[i].match(p);
      if (match) {
        matched = true;
        let decoded = decodeURIComponent(match[1]);
        addEmbedCopyOp(decoded);
        urls.push(decoded);
      }
    }

    for (let p of elinkPatsUnion_nd) {
      let match = urls[i].match(p);
      if (match) {
        matched = true;
        addEmbedCopyOp(match[1]);
        urls.push(match[1]);
      }
    }
  }
  if (matched) ops.push(group);

  group = {label: `[ ${_("embeddingsGroup")} ]`, ops: []};
  ops.push(group);
  for (let t of linkEmbsUnion) {
    for (let url of urls) {
      group.ops.push({
        type: "copy",
        url: t[2].replace("$1", encodeURIComponent(url)),
        newTab: false,
        matchedPattern: "",
        label: t[0].replace("$1", url.substr(0, 25)) + "…",
        subst: "",
        decode: false
      });
      group.ops.push({
        type: "visit",
        url: t[2].replace("$1", encodeURIComponent(url)),
        newTab: false,
        matchedPattern: "",
        label: t[1].replace("$1", url.substr(0, 25)) + "…",
        subst: "",
        decode: false
      });
      group.ops.push({
        type: "visit",
        url: t[2].replace("$1", encodeURIComponent(url)),
        newTab: true,
        matchedPattern: "",
        label: t[1].replace("$1", url.substr(0, 25)) + "…" + _("newTab"),
        subst: "",
        decode: false
      });
    }
  }

  for (let t of linkEmbsUnion_ne) {
    for (let url of urls) {
      group.ops.push({
        type: "copy",
        url: t[2].replace("$1", url),
        newTab: false,
        matchedPattern: "",
        label: t[0].replace("$1", url.substr(0, 25)) + "…",
        subst: "",
        decode: false
      });
      group.ops.push({
        type: "visit",
        url: t[2].replace("$1", url),
        newTab: false,
        matchedPattern: "",
        label: t[1].replace("$1", url.substr(0, 25)) + "…",
        subst: "",
        decode: false
      });
      group.ops.push({
        type: "visit",
        url: t[2].replace("$1", url),
        newTab: true,
        matchedPattern: "",
        label: t[1].replace("$1", url.substr(0, 25)) + "…" + _("newTab"),
        subst: "",
        decode: false
      });
    }
  }

  for (let i = 0; i < urlopsUnion.length; i++) {
    let spec = urlopsUnion[i];
    group = {label: `[ ${spec.name} ]`, ops: []};

    for (let p of spec.patternRE) {
      let matched = false;

      for (let url of urls) {
        if (url.match(p)) {
          matched = true;

	  if ("copyOperations" in spec)
            for (let op of spec.copyOperations)
              group.ops.push({
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
              group.ops.push({
                type: "visit",
                url,
                newTab: false,
                matchedPattern: p,
                label: op.label,
                subst: op.subst,
                decode: "decode" in op && op.decode
              });

            for (let op of spec.visitOperations)
              group.ops.push({
                type: "visit",
                url,
                newTab: true,
                matchedPattern: p,
                label: op.label + _("newTab"),
                subst: op.subst,
                decode: "decode" in op && op.decode
              });
          }
        }
      }

      if (matched) {
        ops.push(group);
        break;
      }
    }

    if (!aFindAllMatches) break;
  }

  return ops;
}

function getThumbnailUrl (aUrl) {
  let urlopsUnion = builtinUrlops.concat(customUrlops);

  for (let i = 0; i < urlopsUnion.length; i++) {
    let spec = urlopsUnion[i];
    if (!("thumbnail" in spec)) continue;

    for (let p of spec.patternRE) {
      if (aUrl.match(p)) return aUrl.replace(p, spec.thumbnail);
    }
  }

  return null;
}

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
