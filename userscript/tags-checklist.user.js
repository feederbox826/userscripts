// ==UserScript==
// @name         fbox-tags checklist
// @namespace    feederbox.cc
// @author       feederbox826
// @version      1.1.0
// @description  Add status boxes to tag names on stashdb
// @match        https://stashdb.org/*
// @connect      tags.feederbox.cc
// @run-at       document-idle
// @require      https://feederbox.cc/uscript/requires/gql-intercept.js
// @require      https://feederbox.cc/uscript/requires/wfke.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const jsonFetch = async (url) =>
  new Promise((resolve, reject) => {
    GM?.xmlhttpRequest ?? GM_xmlhttpRequest({
      method: "GET",
      url: url,
      responseType: "json",
      onload: (response) => {
        if (response.status !== 200) reject(new Error(`Failed to fetch ${url}: ${response.statusText}`));
        resolve(response.response);
      },
      onerror: (error) => reject(error)
    })
  })

async function startPage() {
  console.log("checklist")
  const BASEURL = "https://tags.feederbox.cc"
  const inventory = await jsonFetch(`${BASEURL}/tags-export.json`)

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
    const allTags = document.querySelectorAll(".card-body ul>li>a")
    allTags.forEach(tag => markTag(tag))
  }

  fbox826.gqlListener.addEventListener("response", async (e) => {
    if (!e.detail.data?.queryTags) return;
    wfke(".card-body ul>li", markTags)
  });

  wfke(".card-body ul>li", markTags)
}
startPage()