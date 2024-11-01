// ==UserScript==
// @name         fbox-tags checklist
// @namespace    feederbox.cc
// @author       feederbox826
// @version      1.0.0
// @description  Add status boxes to tag names on stashdb
// @match        https://stashdb.org/*
// @connect      tags.feederbox.cc
// @run-at       document-idle
// @require      https://feederbox.cc/uscript/requires/gql-intercept.js
// @grant        unsafeWindow
// ==/UserScript==

function wfke(selector, callback) {
  var el = document.querySelector(selector);
  if (el) return callback(el);
  setTimeout(wfke, 100, selector, callback);
}

const BASEURL = "https://tags.feederbox.cc"

async function startPage() {
  console.log("checklist")
  const inventory = await fetch(`${BASEURL}/tags-export.json`)
    .then(r => r.json())

  const addBox = (parent, txt, href) => {
    const box = document.createElement("a");
    box.className = "fbox-tag-box"
    box.textContent = txt;
    box.href = href;
    parent.prepend(box);
  }

  let markTag = (tag) => {
    if (tag.parentElement.querySelector(".fbox-tag-box")) return
    const name = tag.textContent;
    const status = inventory?.[name];
    if (!status) return
    if (status.img) addBox(tag, "🖼️", `${BASEURL}/media/original/${status.img}`)
    if (status.vid) addBox(tag, "🎞️", `${BASEURL}/media/original/${status.vid}`)
    if (status.alt) addBox(tag, "📂", `${BASEURL}/media/original/alt/`)
  }

  function markTags() {
    console.log("marking");
    const allTags = document.querySelectorAll(".card ul>li>a")
    allTags.forEach(tag => markTag(tag))
  }

  fbox826.gqlListener.addEventListener("response", async (e) => {
    if (!e.detail.data?.queryTags) return;
    wfke(".card ul>li", markTags)
  });

  wfke(".card ul>li", markTags)
}
startPage()