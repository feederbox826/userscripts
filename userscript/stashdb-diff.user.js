// ==UserScript==
// @name         stashdb-diff
// @namespace    feederbox826
// @version      0.2.0
// @description  add character-by-character diff for stashdb
// @author       feederbox826
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsdiff/2.0.2/diff.js
// @require      https://raw.githubusercontent.com/feederbox826/userscripts/main/requires/title-obs.js
// ==/UserScript==

GM_addStyle(`
diff-del {
    --bs-bg-opacity: 1;
	background-color: rgba(var(--bs-danger-rgb),var(--bs-bg-opacity));
}
diff-ins {
    --bs-bg-opacity: 1;
    background-color: rgba(var(--bs-success-rgb),var(--bs-bg-opacity));
}`)

function toggleDiff() {
    const diffElems = ["#diff-aRow", "#diff-bRow", "#diff-result"]
    for (const selector of diffElems) {
        const target = document.querySelector(selector)
        target.style.display = (target.style.display == "none") ? "block" : "none"
    }
}
function addToggle(searchElem = document) {
    // check for existing toggle
    const toggle = document.createElement("button");
    toggle.type = "button"
    toggle.classList = "btn btn-secondary"
    toggle.textContent = "toggle diff"
    toggle.id = "diff-toggle"
    toggle.onclick = toggleDiff
    const aRow = searchElem.querySelector(".EditDiff.bg-danger")
    if (!aRow) return
    if (searchElem.querySelector("#diff-toggle")) return console.log("toggle already exists")
    const allHeaders = aRow.parentNode.parentNode.parentNode.childNodes
    for (const header of allHeaders) {
        const target = header.childNodes[0]
        if (target.innerText.includes("Details")) {
            target.classList += " d-flex flex-column"
            target.appendChild(toggle)
            genDiff(target.parentNode)
            return
        }
    }
}
function genDiff(parent) {
    const aRow = parent.querySelector(".EditDiff.bg-danger")
    aRow.parentNode.id = "diff-aRow"
    const bRow = parent.querySelector(".EditDiff.bg-success")
    bRow.parentNode.id = "diff-bRow"
	var diffResult = JsDiff.diffWords(aRow.textContent, bRow.textContent);
	var fragment = document.createDocumentFragment();
	for (var i=0; i < diffResult.length; i++) {
		if (diffResult[i].added && diffResult[i + 1] && diffResult[i + 1].removed) {
			var swap = diffResult[i];
			diffResult[i] = diffResult[i + 1];
			diffResult[i + 1] = swap;
		}
		var node;
		if (diffResult[i].removed) {
			node = document.createElement('diff-del');
			node.appendChild(document.createTextNode(diffResult[i].value));
		} else if (diffResult[i].added) {
			node = document.createElement('diff-ins');
			node.appendChild(document.createTextNode(diffResult[i].value));
		} else {
			node = document.createTextNode(diffResult[i].value);
		}
		fragment.appendChild(node);
	}
    const result = document.createElement('div');
    result.classList = "EditDiff bg-secondary"
    result.textContent = '';
    result.appendChild(fragment);
    const rowCon = document.createElement('div');
    rowCon.id = "diff-result"
    rowCon.classList = "col"
    rowCon.style.display = "none"
    rowCon.appendChild(result)
    parent.appendChild(rowCon)
}
function batchAddToggle() {
    for (const elem of document.querySelectorAll(".EditCard")) {
        addToggle(elem)
    }
}
function sceneEditWatch() {
    // listen for confirm button
    const confirmBtn = document.querySelector('.SceneForm button[data-rr-ui-event-key="confirm"]')
    confirmBtn.addEventListener("click", () => {
        setTimeout(() => {
            addToggle(document.querySelector(".tab-content"))
        }, 500)
    })
}

changeObs.addEventListener("titleChange", () => {
    wfke(".EditDiff", batchAddToggle)
    addToggle()
})

// on SceneForm, listen for Confirm button click
changeObs.addEventListener("titleChange", () => {
    wfke(".SceneForm", sceneEditWatch)
})