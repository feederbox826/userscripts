// ==UserScript==
// @name         stashdb-img-res
// @namespace    feederbox826
// @version      0.1.0
// @description  adds image resolution to stashdb images
// @author       feederbox826
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// @grant        GM_addStyle
// @require      https://raw.githubusercontent.com/feederbox826/userscripts/main/requires/title-obs.js
// ==/UserScript==

GM_addStyle(`
  .img-res {
    position: absolute;
    right: 0;
    top: 0;
    background-color: grey;
    opacity: 0.7;
    font-size: 1rem;
  }
  `)
  
  function tryAddRes(img) {
    if (!img.complete) {
      img.onload = (evt) => addRes(evt.target)
    } else {
      addRes(img)
    }
  }
  
  function addRes(img) {
    if (img.dataset.resolution) return
    const resolution = `${img.naturalWidth} x ${img.naturalHeight}`
    img.dataset.resolution = resolution
    const resBox = document.createElement("span")
    resBox.classList = "img-res"
    resBox.textContent = resolution
    img.after(resBox)
    console.log("added", resBox)
  }
  
  function addAllRes() {
    document.querySelectorAll("img").forEach(img => tryAddRes(img))
  }
  
  // mutation observer for new images
  new MutationObserver(() => {
        addAllRes()
      }).observe(
          document,
          { childList: true, subtree: true },
      );