// ==UserScript==
// @name         stashdb-rm
// @namespace    feederbox.cc
// @author       feederbox826
// @version      2.0.0
// @description  Remove scenes from loaded studios on stashdb.org
// @match        https://stashdb.org/*
// @connect      localhost:9999
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @require      https://feederbox.cc/uscript/requires/gql-intercept.js
// @require      https://feederbox.cc/uscript/requires/title-obs.js
// ==/UserScript==

return false
// broken on serverside
// broken by https://github.com/stashapp/stash-box/pull/961

/*
// config setup
// set up ignoreStudios
const allIgnoreStudios = []
const manIgnoreStudios = GM_getValue("ignoreStudios", [])
// fetch from remote
const ignoreLists = [
  // "https://feederbox.cc/uscript/static/stashdb-rm/gay-studios.json", // gay studios
  // "https://feederbox.cc/uscript/static/stashdb-rm/trans-studios.json", // trans studios
]
let ignoreListsCache = GM_getValue("ignoreListsCache", [])
let ignoreListsCacheDate = GM_getValue("ignoreListsCacheDate", 0)
// if no cache or cache is older than 10 days
try {
  allIgnoreStudios.push(...manIgnoreStudios)
  if ((ignoreLists.length && ignoreListsCache.length == 0)
    || Date.now() - ignoreListsCacheDate > 864000000) {
    for (const list of ignoreLists) {
      const listContent = await fetch(list)
        .then(res => res.json())
      allIgnoreStudios.push(...listContent)
    }
    GM_setValue("ignoreListsCache", ignoreListsCache)
    GM_setValue("ignoreListsCacheDate", Date.now())
  } else {
    console.log("Using cached ignoreLists")
    allIgnoreStudios.push(...ignoreListsCache)
  }
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
  if (!data.data.queryScenes) return data
  let scenes = data.data.queryScenes.scenes
    .filter(scene => !allIgnoreStudios.includes(scene.studio.id))
  // return filtered data
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
    if (manIgnoreStudios.includes(studioid)) card.remove() //remove if match
  });
}

const runPage = () => {
  wfke(".SceneCard.card", markScenes)
  addIgnoreButton()
}

// add hide button to /studio page
function hideStudio(e) {
  const id = location.pathname.split("/").pop();
  manIgnoreStudios.push(id);
  GM_setValue("ignoreStudios", manIgnoreStudios);
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
  if (allIgnoreStudios.includes(id)) {
    hideButton.textContent = "Ignored";
    hideButton.disabled = true;
  }
}

// navigation observer
changeObs.addEventListener("titleChange", runPage)
runPage()
*/