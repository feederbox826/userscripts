// ==UserScript==
// @name        stashdb-userstats
// @namespace   feederbox.cc
// @author      feederbox826
// @version     0.0.2
// @description Adds user stats to stashdb
// @match       https://stashdb.org/*
// @match       https://fansdb.cc/*
// @match       https://javstash.org/*
// @grant       GM_addStyle
// @require     https://feederbox.cc/uscript/requires/wfke.js
// @require     https://cdn.jsdelivr.net/npm/idb@8/build/umd.js
// ==/UserScript==

const editThreshold = (edit_ratio) =>
  edit_ratio > 0.9 ? "🟩"
  : edit_ratio > 0.7 ? "🟨"
  : edit_ratio = 0 ? "❓"
  : "🟥"

const roundThreshold = (number) =>
  number == 0 ? "0"
  : number >= 5000 ? "5000+"
  : number >= 1000 ? "1000+"
  : number >= 500 ? "500+"
  : number >= 100 ? "100+"
  : number >= 50 ? "50+"
  : number >= 10 ? "10+"
  : "<10"

GM_addStyle(`
  .user-card:before {
    content: "("
  }
  .user-card:after {
    content: ")"
  }
  .user-card {
    padding-left: 1ch;
  }
`);

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

class User {
  constructor(user, edit) {
    this.id = user.id;
    this.last_update = new Date();
    this.edit_accept =
      user.edit_count.accepted + user.edit_count.immediate_accepted;
    this.edit_reject =
      user.edit_count.rejected +
      user.edit_count.immediate_rejected +
      user.edit_count.canceled;
    this.edit_pending = user.edit_count.pending;
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
    // accepted / (accepted + rejected)
    this.edit_ratio = this.edit_accept / (this.edit_accept + this.edit_reject);
    // <1mo since first edit closed, or no edits closed
    this.user_new = this.edit_first
      ? Date.now() - this.edit_first < MONTH
      : true;
  }
}
let paginationObserved = false;


const openDB = () =>
  idb.openDB("stashdb-userstats", 1, {
    upgrade(db) {
      db.createObjectStore("users", { keyPath: "username" });
    },
  });

const getUser = async (username) => {
  const db = await openDB();
  const dbUser = await db.get("users", username);
  if (dbUser) {
    if (Date.now() - dbUser.last_update < DAY) return dbUser;
  }
  console.log("not cached");
  // if not in db, or not stable, fetch from server
  const user = await fetchUser(username);
  const edits = await fetchEdit(user.data.findUser.id);
  const liveUser = new User(user.data.findUser, edits.data.queryEdits);
  await cacheUser(username, liveUser);
  return liveUser;
};

const fetchUser = (username) =>
  fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($username: String) {
        findUser(username: $username) {
        id
        edit_count {
            accepted immediate_accepted
            rejected immediate_rejected canceled
            pending
        } vote_count {
            abstain
            accept immediate_accept
            reject immediate_reject
        }}}`,
      variables: { username },
    }),
  }).then((res) => res.json());

const fetchEdit = (user_id) =>
  fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($user_id: ID) {
        queryEdits(
        input: {
          user_id: $user_id
          status: ACCEPTED page: 1 per_page: 1
          sort: CLOSED_AT direction: ASC
        }) { edits { closed }}}`,
      variables: { user_id },
    }),
  }).then((res) => res.json());

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
  editElem.textContent = `${editThreshold(user.edit_ratio)}${roundThreshold(user.edit_accept)}`;
  editElem.title = `${Math.floor(user.edit_ratio * 100)}%\n${user.edit_accept} ✅\n${user.edit_reject} ❌`;
  card.append(voteElem, editElem);
  return card;
};

const generateUserSummary = (user) =>
`
edits:
  accepted: ${user.edit_accept}
  rejected: ${user.edit_reject}
  pending: ${user.edit_pending}
  first edit: ${user.edit_first ? user.edit_first.toDateString() : "none"}
votes:
  total: ${user.vote_total}
  accept: ${user.vote_accept}
  reject: ${user.vote_reject}
  abstain: ${user.vote_abstain}
`;

async function setupPage() {
  // find all .EditCard
  const users = Array.from(
    document.querySelectorAll('.EditCard a[href^="/users"'),
  );
  // prefetch usernames
  const usernames = new Set(
    users.map((userElem) => userElem.href.split("/").pop()),
  );
  for (const username of usernames) await getUser(username);
  // get fetched usernames
  users.forEach((userElem) => {
    // check if already has usercard
    if (userElem.querySelector(".user-card")) return;
    const username = userElem.href.split("/").pop();
    getUser(username).then((userData) => {
      if (userElem.querySelector(".user-card")) return;
      const userCard = generateUserCard(userData);
      userElem.append(userCard);
      userElem.title = generateUserSummary(userData);
    });
  });
}

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
