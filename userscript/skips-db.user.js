// ==UserScript==
// @name         skips-db indicator
// @namespace    feederbox.cc
// @author       feederbox826
// @version      1.0.0
// @description  Add skips-db status to studios on StashDB
// @match        https://stashdb.org/*
// @connect      skips.feederbox.cc
// @run-at       document-idle
// @require      https://feederbox.cc/uscript/requires/gql-intercept.js
// @require      https://feederbox.cc/uscript/requires/wfke.js
// @require      https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const statusTest = async (id) =>
  new Promise((resolve, reject) => {
    GM?.xmlhttpRequest ?? GM_xmlhttpRequest({
      method: "HEAD",
      url: `https://skips.feederbox.cc/api/time/${id}`,
      onload: (response) => {
        if (response.status === 204) resolve(true);
        else if (response.status === 404) resolve(false);
        else reject(new Error(`Failed to check status for ${id}: ${response.statusText}`));
      },
      onerror: (error) => reject(error)
    })
  })

const localSkipsStore = idbKeyval.createStore("skips-db", "studios")

const checkStudio = async (id) => {
  const cached = await idbKeyval.get(id, localSkipsStore);
  if (cached !== undefined) return cached;
  const status = await statusTest(id);
  await idbKeyval.set(id, status, localSkipsStore);
  return status;
}

async function startPage() {
  console.log("starting page")
  const addBox = (parent, id) => {
    const box = document.createElement("a");
    box.className = "fbox-skips-db"
    box.textContent = '⏭️';
    box.href = `https://skips.feederbox.cc/api/time/${id}/submissions`;
    parent.appendChild(box);
  }

  const checkAttrStatus = async (elem) => {
    if (!elem) return
    const id = elem.getAttribute("href").replace("/studios/","");
    const status = await checkStudio(id);
    if (status) addBox(elem, id);
  }

  let markStudioPage = async () => {
    console.log("marking studio page")
    const studioIndicator = document.querySelector("h3 span")
    const studioId = document.location.pathname.replace("/studios/","");
    const status = await checkStudio(studioId);
    if (status) addBox(studioIndicator, studioId)
    // check parent
    await checkAttrStatus(document.querySelector(".studio-title span a"))
    // check sub-studios
    const childElems = document.querySelectorAll(".sub-studio-list a")
    for (const elem of childElems) await checkAttrStatus(elem)
  }

  fbox826.gqlListener.addEventListener("response", async (e) => {
    if (!e.detail.data?.findStudio) return;
    wfke(".studio-title", markStudioPage)
  });
}
startPage()