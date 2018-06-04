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

var elinkPats = [], elinkPats_nd = [],
    elinkCustomPats = [], elinkCustomPats_nd = [],
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

function procUrlops (o) {
  procElinks(o.embeddedLinkPatterns, elinkPats);
  procElinks(o.embeddedLinkPatterns_nodecode, elinkPats_nd);
  procTypes(o.types, builtinUrlops);
}

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

  for (let p of elinkCustomPats) {
    let match = aUrl.match(p);
    if (match)
      urls.push(decodeURIComponent(match[1]));
  }

  for (let p of elinkCustomPats_nd) {
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
