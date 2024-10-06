// ==UserScript==
// @name         LifeSelector unblur
// @namespace    feederbox826
// @version      0.3
// @description  Unblur LifeSelector website
// @author       feederbox826
// @match        https://lifeselector.com/game/DisplayPlayer/*
// @icon         https://lifeselector.com/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
  .html-player.locked #background.player {
    filter: none !important;
  }
  div.sensitive-content-warning {
    display: none !important;
  }
`)