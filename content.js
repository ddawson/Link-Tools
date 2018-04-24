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

const bidi_dir = browser.i18n.getMessage("@@bidi_dir");
const POPUP_DELAY = 700;

browser.runtime.onMessage.addListener(({msgType, url}) => {
  if (msgType == "copy") {
    let copyBox = document.createElement("input");
    copyBox.type = "text";
    copyBox.style.display = "block";
    copyBox.style.position = "absolute";
    copyBox.style.top = "-1000px";
    copyBox.style.left = "-1000px";
    copyBox.style.opacity = "0";
    copyBox.value = url;
    document.body.appendChild(copyBox);
    copyBox.select();
    document.execCommand("copy");
    document.body.removeChild(copyBox);
  }
  else if (msgType == "visit") {
    location = url;
  }
});

let timer = null;
let thumb = null;

function show_thumbnail ({ target: el }) {
  if ("href" in el) {
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

    function addMouseover () {
      document.body.addEventListener("mouseover", show_thumbnail, false);
      document.body.addEventListener("mouseout", hide_thumbnail, false);
    }

    try {
      addMouseover();
    } catch (e) {
      document.addEventListener("DOMContentLoaded", addMouseover, false);
    }
  } else if (newValue == false && showThumbnails == true) {
    showThumbnails = false;

    try {
      document.body.removeEventListener("mouseover", show_thumbnail, false);
      document.body.removeEventListener("mouseout", hide_thumbnail, false);
    } catch (e) {}
  }
}

(function init () {
  function _retry () {
    // Probably injected on existing tab; message manager not ready yet?
    setTimeout(init, 200);
  }

  let port;

  if (!(port = browser.runtime.connect())) {
    _retry();
    return;
  }

  port.onMessage.addListener(msg => {
    switch (msg.msgType) {
    case "options-change":
      if ("showThumbnails" in msg.changes) {
        let newValue = msg.changes.showThumbnails.newValue;
        setThumbnailsState(newValue);
      }
      break;
    }
  });

  browser.runtime.sendMessage({ msgType: "get-options" }).then(opts => {
    if ("showThumbnails" in opts)
      setThumbnailsState(opts.showThumbnails);
  }).catch(() => {
    _retry();
  });
})();
