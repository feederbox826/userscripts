// ==UserScript==
// @name         stashdb-rm
// @namespace    feederbox
// @version      1.0.0
// @description  Remove scenes from loaded studios on stashdb.org
// @match        https://stashdb.org/*
// @connect      localhost:9999
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_unsafeWindow
// @run-at       document-idle
// @author       feederbox826
// @require      https://raw.githubusercontent.com/feederbox826/plugins/main/requires/gql-intercept.js
// @updateURL    https://github.com/feederbox826/userscripts/raw/main/userscript/stashdb-rm.user.js
// @downloadURL  https://github.com/feederbox826/userscripts/raw/main/userscript/stashdb-rm.user.js
// ==/UserScript==

// config setup
// set up ignoreStudios
const ignoreStudios = GM_getValue("ignoreStudios", [])
// fetch from remote
const ignoreLists = [
  //"", // gay studios
  //"", // trans studios
]
const ignoreListsCache = GM_getValue("ignoreListsCache", [])
const ignoreListsCacheDate = GM_getValue("ignoreListsCacheDate", 0)
// if no cache or cache is older than 10 days
try {
  if ((ignoreLists.length && ignoreListsCache.length == 0)
    || Date.now() - ignoreListsCacheDate > 864000000)
    for (const list of ignoreLists) ignoreStudios.push(...list)
} catch(e) {
  console.error(e)
}

// helpers
// wait for visible key elements
function wfke(selector, callback) {
  let el = document.querySelector(selector);
  if (el) return callback();
  setTimeout(wfke, 100, selector, callback);
}
// response interceptor
const rmInterceptor = (data) => {
  console.log('intercepted')
  if (!data.data.queryScenes) return data
  console.log("oldlen", data.data.queryScenes.scenes.length)
  let scenes = data.data.queryScenes.scenes
    .filter(scene => !ignoreStudios.includes(scene.studio.id))
  // return filtered data
  console.log("newlen", scenes.length)
  return ({ data: {
    queryScenes: {
      ...data.data.queryScenes,
      scenes: scenes
    },
    "__typename": "QueryScenesResultType"
  }})
}
unsafeWindow.fbox826.interceptors.push(rmInterceptor)

// manual CSS blur intercept
function markScenes() {
  document.querySelectorAll(".SceneCard.card").forEach(card => {
    // get studio id
    const studioid = card.querySelector("a.SceneCard-studio-name").href.split("/")[2]
    if (ignoreStudios.includes(studioid)) card.remove() //remove if match
  });
}

const runPage = () => {
  wfke(".SceneCard.card", markScenes)
  addIgnoreButton()
}

// add hide button to /studio page
function hideStudio(e) {
  const id = location.pathname.split("/").pop();
  ignoreStudios.push(id);
  GM_setValue("ignoreStudios", ignoreStudios);
  e.target.textContent = "Ignored";
  e.target.disabled = true;
}

function addIgnoreButton() {
  const isStudio = location.href.includes("/studios/")
  if (!isStudio) return
  // add ignore button
  const parent = document.querySelector("div:has(>.ms-2)");
  if (!parent) return;
  const hideButton = document.createElement("button")
  hideButton.className = "btn btn-outline-danger ms-2"
  hideButton.id = "hidebutton"
  hideButton.onclick = hideStudio
  hideButton.textContent = "Hide Studio"
  if (document.querySelector("#hidebutton")) return;
  parent.prepend(hideButton)
  // check if already hidden
  const id = location.pathname.split("/").pop();
  if (ignoreStudios.includes(id)) {
    hideButton.textContent = "Ignored";
    hideButton.disabled = true;
  }
}

// navigation observer
new MutationObserver(() => runPage()).observe(document.querySelector("title"), {
  childList: true,
})
runPage()