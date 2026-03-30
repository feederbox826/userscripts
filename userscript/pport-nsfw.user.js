// ==UserScript==
// @name         pport-nsfw
// @author       feederbox826
// @namespace    feederbox.cc
// @version      0.0.1
// @description  pport un-censor
// @match        https://purpleport.com/portfolio/*
// @run-at       document-idle
// ==/UserScript==

const unCensor = i => i.src = i.dataset.src

// main image
document.querySelectorAll("div.nsfw img").forEach(unCensor)
// hook into all lazyloaders
document.querySelectorAll("img.nsfw").forEach(el => el.addEventListener("load", (e) => unCensor(e.target), { once: true }))