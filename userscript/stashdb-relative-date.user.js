// ==UserScript==
// @name         stashdb-relative-date
// @namespace    feederbox.cc
// @author       feederbox826
// @version      0.2.2
// @description  adds relative dates to stashdb
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// @require      https://feederbox.cc/uscript/requires/title-obs.js
// ==/UserScript==

const validationRegex = /^\d{4}(-\d{2}(-\d{2})?)?/g

function addPerformerYear(elem) {
  // check for <small>
  if (elem.querySelector("small")) return;
  const text = elem.textContent;
  // we only care about years
  const diff = new Date() - new Date(text);
  const diffYears = Math.floor(diff / (1000 * 60 * 60 * 24) / 365);
  // add <small> element to match stashDB
  const smallElem = document.createElement("small")
  smallElem.classList = "text-muted ms-2"
  smallElem.textContent = `${diffYears} years old`
  elem.appendChild(smallElem)
}

function addRelativeDate(elem) {
  const text = elem.textContent;
  if (text.includes("ago")) return;
  else if (!validationRegex.test(text)) return
  // validate date
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
const performerPage = () => addPerformerYear(document.querySelector(selectors.performerPage));

function scenePageDate(card) {
  const elem = card.querySelector(selectors.sceneCard);
  addRelativeDate(elem.lastChild);
}
const addDate = (selector) =>
  document.querySelectorAll(selector).forEach((elem) => addRelativeDate(elem));

const selectors = {
  sceneList: ".SceneCard>.card-footer>.text-muted>strong",
  sceneCard: ".scene-info.card>.card-header>h6",
  performerPage: ".PerformerInfo table>tbody>tr:nth-child(2)>td:nth-child(2)"
};

function runPage() {
  // add relative date to all scenes
  wfke(".SceneCard", sceneListDate);
  wfke(".scene-info.card", scenePageDate);
  wfke(".PerformerInfo", performerPage);
}

// change observer
changeObs.addEventListener("titleChange", runPage);
changeObs.addEventListener("pagination", runPage);
runPage();
