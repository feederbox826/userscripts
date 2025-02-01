// ==UserScript==
// @name         stashdb-relative-date
// @namespace    feederbox.cc
// @author       feederbox826
// @version      0.2.0
// @description  adds relative dates to stashdb
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// @require      https://feederbox.cc/uscript/requires/title-obs.js
// ==/UserScript==

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

const sceneListDate = () => addDate(selectors.sceneList);

function scenePageDate(card) {
  const elem = card.querySelector(selectors.sceneCard);
  addRelativeDate(elem.lastChild);
}
const addDate = (selector) =>
  document.querySelectorAll(selector).forEach((elem) => addRelativeDate(elem));

const selectors = {
  sceneList: ".SceneCard>.card-footer>.text-muted>strong",
  sceneCard: ".scene-info.card>.card-header>h6",
};

function runPage() {
  // add relative date to all scenes
  wfke(".SceneCard", sceneListDate);
  wfke(".scene-info.card", scenePageDate);
}

// change observer
changeObs.addEventListener("titleChange", runPage);
changeObs.addEventListener("pagination", runPage);
runPage();
