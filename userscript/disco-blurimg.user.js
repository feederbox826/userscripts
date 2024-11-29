// ==UserScript==
// @name         discourse blur image
// @namespace    feederbox826
// @version      0.1
// @description  Blur images on discourse
// @author       feederbox826
// @match        https://discourse.stashapp.cc/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
  .lightbox-wrapper img {
    filter: blur(10px);
  }
  .lightbox-wrapper img:hover {
    filter: none;
  }
`);