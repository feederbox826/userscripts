// ==UserScript==
// @name        stashdb-userstats
// @namespace   feederbox.cc
// @author      feederbox826
// @version     0.2.1
// @description Adds user stats to stashdb
// @match       https://stashdb.org/*
// @match       https://fansdb.cc/*
// @match       https://javstash.org/*
// @grant       GM_addStyle
// @require     https://feederbox.cc/uscript/requires/wfke.js
// @require     https://cdn.jsdelivr.net/npm/idb@8/build/umd.js
// ==/UserScript==

const editThreshold = (edit_ratio, total_edits) =>
  edit_ratio >= 0.99 && total_edits > 3500 ? "❇️"
  : edit_ratio > 0.9 ? "🟩"
  : edit_ratio > 0.8 ? "🟨"
  : edit_ratio > 0.5 ? "🟧"
  : edit_ratio = 0 ? "❓"
  : "🟥"

const roundThreshold = (number) => {
  if (number == 0) return "0";
  else if (number < 10) return "<10";
  const thresholds = [25000, 20000, 15000, 10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 500, 100, 50, 10];
  for (const threshold of thresholds) {
    if (number >= threshold && threshold >= 1000) return `${threshold * 0.001 }k`;
    else if (number >= threshold) return `${threshold}`;
  }
}

// clear cache if version mismatch
const CACHEVERSION = 2;
const DEBUG_SKIP_CACHE = false;

GM_addStyle(`
  .user-card {
    padding-left: 1ch;
    white-space: pre;
  }
`);

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const callGQL = async (query, variables = {}) =>
  fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  })
    .then((res) => res.json())
    .then((res) => res.data)

class User {
  constructor(user, edit, opStats, typeStats) {
    this.id = user.id;
    this.last_update = new Date();
    this.edit_accept =
      user.edit_count.accepted + user.edit_count.immediate_accepted;
    this.edit_reject =
      user.edit_count.rejected +
      user.edit_count.immediate_rejected;
    this.edit_pending = user.edit_count.pending;
    this.edit_cancel = user.edit_count.canceled
    // date of first closed edit
    this.edit_first = edit.edits.length
      ? new Date(edit.edits?.[0]?.closed)
      : false;
    this.vote_abstain = user.vote_count.abstain;
    this.vote_accept =
      user.vote_count.accept + user.vote_count.immediate_accept;
    this.vote_reject =
      user.vote_count.reject + user.vote_count.immediate_reject;
    // total votes
    this.vote_total = this.vote_abstain + this.vote_accept + this.vote_reject;
    // total edits
    this.total_edits = this.edit_accept + this.edit_reject + this.edit_pending  + this.edit_cancel;
    // accepted / (accepted + rejected)
    this.edit_ratio = this.edit_accept / this.total_edits;
    // <1mo since first edit closed, or no edits closed
    this.user_new = this.edit_first
      ? Date.now() - this.edit_first < MONTH
      : true;
    this.operation_stats = {
      create: opStats[0],
      modify: opStats[1],
      destroy: opStats[2],
      merge: opStats[3],
    }
    this.operation_percentage = {
      create: editPercentage(opStats[0], this.total_edits),
      modify: editPercentage(opStats[1], this.total_edits),
      destroy: editPercentage(opStats[2], this.total_edits),
      merge: editPercentage(opStats[3], this.total_edits),
    }
    this.type_stats = {
      scene: typeStats[0],
      studio: typeStats[1],
      performer: typeStats[2],
      tag: typeStats[3],
    }
    this.type_percentage = {
      scene: editPercentage(typeStats[0], this.total_edits),
      studio: editPercentage(typeStats[1], this.total_edits),
      performer: editPercentage(typeStats[2], this.total_edits),
      tag: editPercentage(typeStats[3], this.total_edits),
    }
  }
}
let paginationObserved = false;

const openDB = () =>
  idb.openDB("stashdb-userstats", 2, {
    upgrade(db, oldver, newver) {
     if (oldver < 1) {
        db.createObjectStore("users", { keyPath: "username" });
        db.createObjectStore("config");
      } else if (newver = 2) {
        db.createObjectStore("config");
      }
    },
  });

const getUser = async (username) => {
  const db = await openDB();
  const dbUser = await db.get("users", username);
  if (dbUser && !DEBUG_SKIP_CACHE) {
    if (Date.now() - dbUser.last_update < (DAY * 1.5)) return dbUser;
  }
  console.log("not cached");
  // if not in db, or not stable, fetch from server
  const user = await fetchUser(username);
  const firstEdit = await fetchFirstEdit(user.findUser.id);
  const userOpStats = await fetchAllOpStats(user.findUser.id);
  const userTypeStats = await fetchAllTypeStats(user.findUser.id);
  const liveUser = new User(user.findUser, firstEdit.queryEdits, userOpStats, userTypeStats);
  await cacheUser(username, liveUser);
  return liveUser;
};

const fetchUser = (username) => {
  const query = `query ($username: String) {
    findUser(username: $username) {
    id
    edit_count {
        accepted immediate_accepted
        rejected immediate_rejected
        canceled
        pending
    } vote_count {
        abstain
        accept immediate_accept
        reject immediate_reject
    }}}`
  const variables = { username }
  return callGQL(query, variables)
}

const fetchFirstEdit = (user_id) => {
  const query = `query ($user_id: ID) {
    queryEdits(
    input: {
      user_id: $user_id
      status: ACCEPTED page: 1 per_page: 1
      sort: CLOSED_AT direction: ASC
    }) {
      edits { closed }}}`
  const variables = { user_id }
  return callGQL(query, variables)
}

const fetchTypeStat = (user_id, type) => {
  const query = `query ($user_id: ID, $type: TargetTypeEnum) {
    queryEdits(
    input: {
        user_id: $user_id
        target_type: $type
    }) { count }}`
  const variables = { user_id, type }
  return callGQL(query, variables)
}

const fetchOpStat = (user_id, operation) => {
  const query = `query ($user_id: ID, $operation: OperationEnum) {
    queryEdits(
    input: {
        user_id: $user_id
        operation: $operation
    }) { count }}`
  const variables = { user_id, operation }
  return callGQL(query, variables)
}

const fetchAllOpStats = (user_id) => {
  const operations = ["CREATE", "MODIFY", "DESTROY", "MERGE"];
  return Promise.all(
    operations.map((operation) => fetchOpStat(user_id, operation).then((res) => res.queryEdits.count)),
  );
};

const fetchAllTypeStats = (user_id) => {
  const types = ["SCENE", "STUDIO", "PERFORMER", "TAG"];
  return Promise.all(
    types.map((type) => fetchTypeStat(user_id, type).then((res) => res.queryEdits.count)),
  );
};

const editPercentage = (num, total) => `${Math.floor(num/total*100)}%`

const cacheUser = async (username, data) => {
  const db = await openDB();
  await db.put("users", { username, ...data });
};

const generateUserCard = (user) => {
  const card = document.createElement("span");
  card.classList.add("user-card");
  // check if multiple pending edits
  if (user.edit_pending > 10) {
    const pendingElem = document.createElement("span");
    pendingElem.textContent = "⌛";
    pendingElem.title = `${user.edit_pending} pending edits`;
    card.append(pendingElem);
  }
  if (user.user_new) {
    // only show saplings for new users
    card.textContent = "🌱";
    return card;
  }
  // show user stats
  const voteElem = document.createElement("span");
  voteElem.textContent = "🗳️"
  voteElem.title = `${user.vote_accept} 👍\n${user.vote_reject} 👎\n${user.vote_abstain} 🤷`;
  const editElem = document.createElement("span");
  editElem.textContent = `${editThreshold(user.edit_ratio, user.total_edits)}${roundThreshold(user.edit_accept)}`;
  editElem.title = `${Math.floor(user.edit_ratio * 100)}%\n${user.edit_accept} ✅\n${user.edit_reject} ❌\n${user.edit_cancel} 🗑️`;
  const opElem = document.createElement("span");
  opElem.textContent = "🔨";
  opElem.title = `${user.operation_stats.create} ✨\n${user.operation_stats.modify} 🛠️\n${user.operation_stats.destroy} 🗑️\n${user.operation_stats.merge} 🔗`;
  const targetElem = document.createElement("span");
  targetElem.textContent = "🎯"
  targetElem.title = `${user.type_stats.scene} 🎞️\n${user.type_stats.studio} 🎬\n${user.type_stats.performer} 🎭\n${user.type_stats.tag} 🏷️`;
  card.append(voteElem, editElem, opElem, targetElem);
  const originalHTML = card.innerHTML;
  // add click to toggle
  card.addEventListener("click", (evt) => {
    evt.preventDefault()
    const expanded = card.dataset.expanded === "1";
    if (!expanded) {
      card.dataset.expanded = "1";
      const summary =
        card.previousElementSibling?.title ||
        card.parentElement?.title ||
        "";
      card.textContent = summary;
    } else {
      card.dataset.expanded = "0";
      card.innerHTML = originalHTML;
    }
  });
  return card;
};

const generateUserSummary = (user) =>
`
edits:
  accepted: ${user.edit_accept}
  rejected: ${user.edit_reject}
  pending: ${user.edit_pending}
  cancelled: ${user.edit_cancel}
  first edit: ${user.edit_first ? user.edit_first.toDateString() : "none"}
votes:
  total: ${user.vote_total}
  accept: ${user.vote_accept}
  reject: ${user.vote_reject}
  abstain: ${user.vote_abstain}
operations:
  create: ${user.operation_stats.create} (${editPercentage(user.operation_stats.create, user.total_edits)})
  modify: ${user.operation_stats.modify} (${editPercentage(user.operation_stats.modify, user.total_edits)})
  destroy: ${user.operation_stats.destroy} (${editPercentage(user.operation_stats.destroy, user.total_edits)})
  merge: ${user.operation_stats.merge} (${editPercentage(user.operation_stats.merge, user.total_edits)})
types:
  scene: ${user.type_stats.scene} (${editPercentage(user.type_stats.scene, user.total_edits)})
  studio: ${user.type_stats.studio} (${editPercentage(user.type_stats.studio, user.total_edits)})
  performer: ${user.type_stats.performer} (${editPercentage(user.type_stats.performer, user.total_edits)})
  tag: ${user.type_stats.tag} (${editPercentage(user.type_stats.tag, user.total_edits)})
`;

async function setupPage() {
  // find all .EditCard
  const users = Array.from(
    document.querySelectorAll('.EditCard a[href^="/users"'),
  );
  // prefetch usernames
  const usernames = new Set(
    users.map((userElem) => userElem.textContent)
  );
  for (const username of usernames) await getUser(username);
  // get fetched usernames
  users.forEach((userElem) => {
    // check if already has usercard
    if (userElem.nextElementSibling?.classList?.contains("user-card")) return;
    const username = userElem.href.split("/").pop();
    getUser(username).then((userData) => {
      if (userElem.nextElementSibling?.classList?.contains("user-card")) return;
      const userCard = generateUserCard(userData);
      userElem.insertAdjacentElement("afterend", userCard);
      userElem.title = generateUserSummary(userData);
    });
  });
}

async function checkCacheVersion() {
  // get current cache version
  const db = await openDB();
  const cacheVersion = await db.get("config", "cacheversion");
  if (cacheVersion !== CACHEVERSION) {
    // clear cache
    await db.clear("users");
    await db.put("config", CACHEVERSION, "cacheversion");
  }
}
checkCacheVersion()

async function runPage() {
  wfke(".EditCard", () => setupPage());
  wfke("ul.pagination", observePagination);
}
// pagination observer
function observePagination() {
  if (paginationObserved) return;
  // pagination observer
  new MutationObserver(() => runPage()).observe(
    document.querySelector("ul.pagination"),
    { attributes: true, subtree: true },
  );
  paginationObserved = true;
}
// navigation observer
new MutationObserver(() => runPage()).observe(document.querySelector("title"), {
  childList: true,
});
runPage();
