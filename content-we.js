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

browser.runtime.onMessage.addListener(handleMessage);

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
