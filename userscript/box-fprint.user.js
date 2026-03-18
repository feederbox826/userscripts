// ==UserScript==
// @name         box-fprint
// @author       feederbox826
// @namespace    feederbox.cc
// @version      0.1.0
// @description  fingerprint customization for stash-box
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// @grant        GM_addStyle
// @require      https://feederbox.cc/uscript/requires/title-obs.js
// @require      https://feederbox.cc/uscript/requires/hamming.js
// ==/UserScript==

// add css for fingerprint hashes
// add hiding for fingerprint types
// add types for hamming distance
GM_addStyle(`
tr.fprint-PHASH {
  display: var(--display-PHASH);
  & > td:first-of-type::before { content: '🖼️'; }
}
tr.fprint-OSHASH {
  display: var(--display-OSHASH);
  & > td:first-of-type::before { content: '🪪'; }
}
tr.fprint-MD5 {
  display: var(--display-MD5);
  & > td:first-of-type::before { content: '🔑'; }
}

.fprint-selector { font-size: 1rem; }

td.fprint-hamming-match { background-color: var(--bs-success); }
td.fprint-hamming-warn { background-color: var(--bs-warning); }
td.fprint-hamming-danger { background-color: var(--bs-danger); }

td.duration-exact { background-color: var(--bs-primary); }
td.duration-match { background-color: var(--bs-success); }
td.duration-warn { background-color: var(--bs-warning); }
td.duration-danger { background-color: var(--bs-danger); }
`)

const hammingThresholds = (distance) => {
  if (distance <= 4) return " fprint-hamming-match"
  else if (distance <= 8) return " fprint-hamming-warn"
  else return " fprint-hamming-danger"
}

const durationThresholds = (diff) => {
  if (diff == 0) return " duration-exact"
  else if (diff <= 5) return " duration-match"
  else if (diff <= 10) return " duration-warn"
  else return " duration-danger"
}

const updateHashDisplay = (type, bool, set=true) => {
  if (set) localStorage.setItem(`display-${type}`, bool)
  document.documentElement.style.setProperty(`--display-${type}`, bool ? "table-row" : "none")
}

const createNoteNode = (text) => {
  const noteNode = document.createElement("span")
  noteNode.classList = "ms-2"
  noteNode.textContent = `(${text})`
  return noteNode
}

const addHashSelector = () => {
  if (document.querySelector(".fprint-selector")) return
  const parent = document.querySelector(".scene-fingerprints h4")
  const selectorParent = document.createElement("div")
  selectorParent.classList = "d-flex gap-2 fprint-selector"
  for (const type of ["PHASH", "OSHASH", "MD5"]) {
    const selector = document.createElement("input")
    selector.type = "checkbox"
    selector.id = `fprint-${type}-selector`
    const checked = localStorage.getItem(`display-${type}`) == "true" ?? true
    updateHashDisplay(type, checked, false)
    selector.checked = checked
    selector.onchange = () => updateHashDisplay(type, selector.checked)
    const label = document.createElement("label")
    label.htmlFor = `fprint-${type}-selector`
    label.textContent = type
    selectorParent.appendChild(selector)
    selectorParent.appendChild(label)
  }
  parent.appendChild(selectorParent)
}

// iterate through table rows and classify
const tableIter = () => {
  addHashSelector()
  // check for hamming-ref
  if (document.querySelector(".fprint-hamming-ref")) return
  const fprintTable = document.querySelector(".scene-fingerprints table tbody")
  const rows = fprintTable.querySelectorAll("tr")
  // grab reference hash
  let refHash = null
  let refDur = null
  for (const row of rows) {
    // check that classlist does not contain
    const type = row.querySelector("td:nth-child(1)").textContent
    const hashElem = row.querySelector("td:nth-child(2)")
    const hash = hashElem.textContent
    if (type == "PHASH") {
      row.classList += " fprint-PHASH"
      if (!refHash) {
        refHash = hash
        hashElem.classList += " fprint-hamming-ref"
        hashElem.appendChild(createNoteNode("🎯"))
      } else {
        // calculate distance from refHash
        const distance = getHamming(refHash, hash)
        hashElem.classList += hammingThresholds(distance)
        hashElem.appendChild(createNoteNode(distance))
      }
    } else {
      row.classList += ` fprint-${type}`
    }
    // add duration diff
    const durElem = row.querySelector("td:nth-child(3)")
    const durSeconds = parseInt(durElem.querySelector("span").title.replace("s",""))
    if (!refDur) {
      refDur = durSeconds
    } else {
      const durDiff = Math.abs(durSeconds - refDur)
      const diff = durDiff == 0 ? "=" : `±${durDiff}s`
      durElem.appendChild(createNoteNode(diff))
      durElem.classList += durationThresholds(durDiff)
    }
  }
}

const runPage = () => {
  // check for fprint-selector
  if (document.querySelector(".fprint-selector")) return
  wfke(".scene-fingerprints", tableIter);
}

changeObs.addEventListener("titleChange", runPage);
runPage()
