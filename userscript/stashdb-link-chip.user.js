// ==UserScript==
// @name         stashdb-link-chip
// @namespace    feederbox826
// @version      0.1.1
// @description  add chips to links in edit queue
// @author       feederbox826
// @match        https://fansdb.cc/*
// @match        https://stashdb.org/*
// @run-at       document-idle
// @grant        GM_addStyle
// @require      https://raw.githubusercontent.com/feederbox826/userscripts/main/requires/title-obs.js
// ==/UserScript==

GM_addStyle(`
  .EditComment a.link-chip {
      border-radius: 3px;
      background: #444;
      padding: 2px;
  }
`);

let myID = null;

async function gqlClient(query, id) {
  return await fetch("https://stashdb.org/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { id } }),
  })
    .then((res) => res.json())
    .then((data) => Object.values(data.data)[0]);
}

const targetType = {
  TAG: "🏷️",
  SCENE: "🎞️",
  STUDIO: "🎬",
  PERFORMER: "🎭",
};
const operationType = {
  CREATE: "✨",
  MODIFY: "🛠️",
  DELETE: "🗑️",
  MERGE: "🔗",
};
const statusType = {
  PENDING: "⏳",
  ACCEPTED: "✅",
  IMMEDIATE_ACCEPT: "✅",
  REJECTED: "❌",
  IMMEDIATE_REJECTED: "❌",
  CANCELLED: "🚫",
  FAILED: "⚠️",
};

const voteType = {
  ACCEPT: "👍",
  REJECT: "👎",
  ABSTAIN: "🤷",
  NONE: "❓",
};

const whoami = () =>
  gqlClient(`query { me { id } }`, "").then((data) => (myID = data.id));

async function lookupEdit(editID) {
  // fetch edit
  const query = `query ($id: ID!) {
  findEdit(id: $id) { target_type operation vote_count status
  votes { user { id } vote
}}}`;
  const edit = await gqlClient(query, editID);
  // parse edit
  const target = targetType[edit.target_type];
  const operation = operationType[edit.operation];
  const vote = edit.vote_count;
  const status = statusType[edit.status];
  const myVote = vote == 0 ? false : edit.votes.find((v) => v.user.id == myID);
  const myVoteType = myVote ? voteType[myVote.vote] : voteType.NONE;
  const voteString =
    edit.status !== "PENDING" ? status : ` ${status}${vote}${myVoteType}`;
  // return chip data
  return `${operation}${target} • ${voteString} • ${editID.split("-")[0]} `;
}

async function lookupScene(sceneID) {
  // fetch scene
  const query = `query ($id: ID!) {
      findScene(id: $id) {
      date title
      studio { name }
      fingerprints { submissions }
  }}`;
  const data = await gqlClient(query, sceneID);
  const fingerprintCount = data.fingerprints.length;
  const totalFingerprints = data.fingerprints.reduce(
    (acc, cur) => acc + cur.submissions,
    0,
  );
  return `${data.title} (${data.date}) • ${data.studio.name} | ${fingerprintCount} FPs / ${totalFingerprints} Total `;
}

async function lookupSceneDelete(sceneID) {
  // fetch scene
  const query = `query ($id: ID!) {
      findScene(id: $id) {
      fingerprints { submissions }
  }}`;
  const data = await gqlClient(query, sceneID);
  const fingerprintCount = data.fingerprints.length;
  const totalFingerprints = data.fingerprints.reduce(
    (acc, cur) => acc + cur.submissions,
    0,
  );
  return `${fingerprintCount} FPs / ${totalFingerprints} Total `;
}

async function lookupStudioDelete(studioID) {
  // fetch studio
  const query = `query ($id: ID!) {
  queryScenes(input: { studios: { value: [$id], modifier: INCLUDES } }) {
      count
  }}`;
  const studio = await gqlClient(query, studioID);
  return `${studio.count} scenes`;
}

async function lookupPerformerDelete(performerID) {
  const query = `query ($id: ID!) { findPerformer(id: $id) { scene_count }}`;
  const performer = await gqlClient(query, performerID);
  return `${performer.scene_count} scenes`;
}

const prependOrReplace = (chip, link) => {
  if (link.classList.contains("link-chip")) return;
  link.classList.add("link-chip");
  const oldText = link.textContent;
  // if just link, replace
  if (oldText == link.href) return (link.textContent = chip);
  // otherwise prepend chip
  link.textContent = `${oldText} (${chip})`;
};

const appendChip = (chip, link) => {
  if (link.classList.contains("link-chip")) return;
  link.classList.add("link-chip");
  link.textContent += ` | ${chip}`;
};

function searchLink(elem) {
  // iterate through deletion targets
  const delTargets = elem.querySelectorAll(".col>.bg-danger");
  for (const target of delTargets) {
    const targetLink = target.querySelector("a:not(.link-chip)");
    if (!targetLink || targetLink.classList.contains("link-chip")) continue;
    // check for scene links
    if (targetLink.href.includes("/scenes/")) {
      lookupSceneDelete(targetLink.href.split("/").pop()).then((chip) =>
        appendChip(chip, targetLink),
      );
    } else if (targetLink.href.includes("/studios/")) {
      lookupStudioDelete(targetLink.href.split("/").pop()).then((chip) =>
        appendChip(chip, targetLink),
      );
    } else if (targetLink.href.includes("/performers/")) {
      lookupPerformerDelete(targetLink.href.split("/").pop()).then((chip) =>
        appendChip(chip, targetLink),
      );
    }
  }
  // iterate through comments
  const commentLinks = elem.querySelectorAll(".EditComment a:not(.link-chip)");
  for (const link of commentLinks) {
    if (link.classList.contains("link-chip")) continue;
    // check for guideline links
    if (link.href.includes("guidelines.stashdb.org")) {
      prependOrReplace("📚", link);
      // check for edit links
    } else if (link.href.includes("/edits/") && !link.href.includes("#")) {
      lookupEdit(link.href.split("/").pop()).then((chip) =>
        prependOrReplace(chip, link),
      );
      // check for scene links
    } else if (link.href.includes("/scenes/")) {
      lookupScene(link.href.split("/").pop().split("#")[0]).then((chip) =>
        prependOrReplace(chip, link),
      );
    }
  }
}
const wfkeChips = () => wfke(".EditCard", addChips);
function addChips() {
  for (const elem of document.querySelectorAll(".EditCard")) {
    searchLink(elem);
  }
}

changeObs.addEventListener("titleChange", () => wfkeChips());
changeObs.addEventListener("pagination", () => wfkeChips());

wfkeChips();
whoami();
