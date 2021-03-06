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

const POPUP_DELAY = 700;

function handleMessage ({msgType, url, newTab}) {
  switch (msgType) {
  case "visit":
    location = url;
    break
  }
}

let timer = null;
let thumb = null;

function show_thumbnail ({ target: el }) {
  // Move up tree to look for element that is a link.
  for (; el && !("href" in el); el = el.parentElement);

  if (el) {
    timer = window.setTimeout(
      async () => {
        let thumbnailUrl = await browser.runtime.sendMessage(
          { msgType: "get-thumbnail-url", url: el.href });
        if (!thumbnailUrl) return;
        thumb = document.createElement("img");
        thumb.style.position = "absolute";
        let { left: scrX, top: scrY } =
          document.documentElement.getBoundingClientRect();
        scrX = -scrX;
        scrY = -scrY;
        let docWid =
          parseFloat(window.getComputedStyle(document.documentElement).width);
        let { left, right, bottom } = el.getBoundingClientRect();
        if (bidi_dir == "ltr")
          thumb.style.left = `${String(left + scrX)}px`;
        else
          thumb.style.right = `${String(docWid - right - scrX)}px`;
        thumb.style.top = `${String(scrY + bottom + 10)}px`;
        thumb.style.zIndex = 1000000;
        thumb.style.backgroundColor = "white";
        thumb.src = thumbnailUrl;
        document.body.appendChild(thumb);
      }, POPUP_DELAY);
  }
}

function hide_thumbnail (e) {
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (thumb) {
    document.body.removeChild(thumb);
    thumb = null;
  }
}

let showThumbnails = false;

function setThumbnailsState (newValue) {
  if (newValue == true && showThumbnails == false) {
    showThumbnails = true;

    function _addMouseover () {
      document.body.addEventListener("mouseover", show_thumbnail, false);
      document.body.addEventListener("mouseout", hide_thumbnail, false);
    }

    try {
      _addMouseover();
    } catch {
      document.addEventListener("DOMContentLoaded", _addMouseover, false);
    }
  } else if (newValue == false && showThumbnails == true) {
    showThumbnails = false;

    try {
      document.body.removeEventListener("mouseover", show_thumbnail, false);
      document.body.removeEventListener("mouseout", hide_thumbnail, false);
    } catch {}
  }
}
