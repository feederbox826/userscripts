// ==UserScript==
// @name         redgifs autosettings
// @namespace    feederbox826
// @version      0.1.2
// @description  Auto Unmute / Play / HD redgifs
// @author       feederbox826
// @match        https://*.redgifs.com/*
// @icon         https://v3.redgifs.com/favicon-32x32.png
// @require      https://raw.githubusercontent.com/feederbox826/userscripts/main/requires/wfke.js
// ==/UserScript==

const clickButton = el => el.click()
const propClick = el => {
  const reactProp = Object.keys(el).find((key) => key.startsWith("__reactProps"))
  console.log(el[reactProp])
  el[reactProp].onClick()
}

const iframeHD = (el) => el.childElementCount == 2 ? propClick(el.parentElement) : null

if (window.top !== window.self || window.location.href.includes("ifr")) {
  // neutralize click popup
  wfke(".videoLink[href]", el => el.href = "")
  wfke(".soundOff", propClick)
  wfke("svg.gifQuality", iframeHD)
  wfke("video", el => el.paused ? el.play() : null)
}
else {
  console.log("native")
  wfke(".QualityButton.sd", clickButton)
  wfke('.SoundButton[aria-label="Sound Off"', clickButton)
}