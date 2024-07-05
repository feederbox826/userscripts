# Userscripts

[db-noto-color](https://github.com/feederbox826/plugins/raw/main/userscript/db-noto-color.user.js)
- replace emojis with Noto Color Emoji for full support

[stashdb-diff](https://github.com/feederbox826/plugins/raw/main/userscript/stashdb-diff.user.js)
- adds text diff to stashdb detail change boxes

[stashdb-link-chip](https://github.com/feederbox826/plugins/raw/main/userscript/stashdb-link-chip.user.js)
- Creates info chips from generic `/edit/xyz`, `/studio/xyz`, `scene/xyz` links
- add fingerprint count to scenes/ studios/ performers pending deletion as `| x FPs / x Total`, with FPs being the number of unique fingerprints and Total being the total number of submissions
- adds chip to linked edits showing information at a glance in the format `Operation, Type • Vote Status, Current Votes, Your Vote • edit ID`
    - Operation: ✨ Create, 🛠️ Modify, 🗑️ Delete, 🔗 Merge
    - Type: 🏷️ Tag, 🎞️ Scene, 🎬 Studio, 🎭 Performer
    - Vote Status: ⏳ Pending, ✅ Accepted, ❌ Rejected, 🚫 Cancelled, ⚠️ Failed
    - Current votes: # of votes, positive or negative
    - Your Vote: 👍 Yes, 👎 No, 🤷 Abstain, ❓ None

Examples:  
`✨🎭 • ⏳1❓ • 1c1f9765`: New Performer - Pending with 1 upvote, I have not voted  
`✨🎞️ • ⏳1👍 • cab039d4`: New Scene - Pending with 1 upvote, I have upvoted  

[stashdb-relative-date](https://github.com/feederbox826/plugins/raw/main/userscript/stashdb-relative-date.user.js)
- adds relative dates to stashDB in Year, Month, (Week), Day

[twitter-media-unblur](https://github.com/feederbox826/plugins/raw/main/userscript/twitter-media-unblur.user.js)
- unblurs all twitter media posts as you scroll