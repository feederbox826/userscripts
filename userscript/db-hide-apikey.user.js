// ==UserScript==
// @name         db-hide-apikey
// @namespace    feederbox826
// @version      0.1
// @description  Hide API keys on stash-box instances
// @author       feederbox826
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @match        https://javstash.org/*
// @match        https://pmvstash.org/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
  input[disabled][value^='eyJ'] {
    color: transparent;
    filter: blur(6px);
    &:hover {
      filter: none;
      color: initial;
    }
  }
`);