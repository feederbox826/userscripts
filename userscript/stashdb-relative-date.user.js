// ==UserScript==
// @name         stashdb-relative-date
// @namespace    feederbox826
// @version      0.1
// @description  adds relative dates to stashdb
// @author       feederbox826
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// ==/UserScript==

let paginationObserved = false;

// wait for visible key elements
function wfke(selector, callback) {
  var el = document.querySelector(selector);
  if (el) return callback(el);
  setTimeout(wfke, 100, selector, callback);
}
function addRelativeDate(elem) {
  const text = elem.textContent;
  if (text.includes("ago")) return;
  const diff = new Date() - new Date(text);
  let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  diffDays -= diffYears * 365;
  const diffMonths = Math.floor(diffDays / 30);
  diffDays -= diffMonths * 30;
  const diffWeeks = Math.floor(diffDays / 7);
  // if less than 1mo, show weeks
  if (diffMonths < 1) diffDays -= diffWeeks * 7;
  // floor diffDays
  diffDays = Math.floor(diffDays);
  // construct final string
  let relativeDate = "";
  if (diffYears) relativeDate += `${diffYears}y `;
  if (diffMonths) relativeDate += `${diffMonths}m `;
  if (diffWeeks && !diffMonths) relativeDate += `${diffWeeks}w `;
  if (diffDays && !diffYears) relativeDate += `${diffDays}d `;
  elem.textContent += ` (${relativeDate} ago)`;
}

const performerDate = (card) => addDate(selectors.performerInfo);
const sceneListDate = (card) => addDate(selectors.sceneList);

function scenePageDate(card) {
  const elem = card.querySelector(selectors.sceneCard);
  addRelativeDate(elem.childNodes[2]);
}
const addDate = (selector) =>
  document.querySelectorAll(selector).forEach((elem) => addRelativeDate(elem));

const selectors = {
  performerInfo: "table tr:nth-child(2)>td:nth-child(2)",
  sceneList: ".SceneCard>.card-footer>.text-muted>strong",
  sceneCard: ".scene-info.card>.card-header>h6",
};

function observePagination() {
  if (paginationObserved) return;
  // pagination observer
  new MutationObserver(() => runPage()).observe(
    document.querySelector("ul.pagination"),
    { attributes: true, subtree: true },
  );
  paginationObserved = true;
}
function runPage() {
  // add relative date to performer page
  wfke(".PerformerInfo", performerDate);
  // add relative date to all scenes
  wfke(".SceneCard", sceneListDate);
  wfke(".scene-info.card", scenePageDate);
  wfke("ul.pagination", observePagination);
}

// change observer
new MutationObserver(() => runPage()).observe(document.querySelector("title"), {
  childList: true,
});
runPage();
