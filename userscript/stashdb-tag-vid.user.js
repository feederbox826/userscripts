// ==UserScript==
// @name        stashdb-tag-vid
// @namespace   feederbox.cc
// @author      feederbox826
// @version     1.0
// @description Adds tag videos to stashdb
// @match       https://stashdb.org/*
// @grant       GM_addStyle
// @require     https://feederbox.cc/uscript/requires/wfke.js
// ==/UserScript==

GM_addStyle(`
  video.tag-video {
      float: left;
      width: 150px;
      height: 150px;
      margin: 10px;
  }
  video.tag-video.video-popout {
      position: absolute;
      top: 0;
      left: 0;
      width: 750px;
      height: 750px;
      z-index: 9999;
  }
`);
  
const isTag = () => location.href.includes("/tags/");
const getTagName = () => document.querySelector(".NarrowPage h3>em")?.innerText?.replace(/ /g, "_")
const delay = ms => new Promise(res => setTimeout(res, ms))

// wait for visible key elements
function wfke(selector, callback) {
  let el = document.querySelector(selector);
  if (el) return callback(el);
  setTimeout(wfke, 100, selector, callback);
}

async function playVideo(evt) {
  const video = evt.target
  const checkHover = () => (!video.matches(':hover')) ? stopVideo(evt) : true
  await delay(100)
  if (!checkHover()) return
  video.muted = false
  video.currentTime = 0
  video.classList.add("video-popout")
  video.play()
    .then(() => setInterval(checkHover, 100))
    .catch(err => {})
}

const stopVideo = (evt) => {
  evt.target.muted = true
  evt.target.classList.remove("video-popout")
}

function parseAddVidTag(target) {
  // get tag name
  const tagName = getTagName()
  if (!tagName) return
  // construct video path
  const vidPath = `https://tags.feederbox.cc/by-name/${tagName}`
  addVidTag(vidPath, target, tagName)
}

const testVid = (src) =>
  fetch(src, { method: 'HEAD' })
    .then(res => res.ok).catch(err => false)

async function addVidTag(src, target, tagName) {
  // check if path resolves
  const testResult = await testVid(src)
  if (!testResult) return;
  if (target.querySelector("video")) return;
  const video = document.createElement("video");
  const propName = ["autoplay", "muted", "loop", "playsinline", "disableRemotePlayback"]
  propName.forEach(prop => video[prop] = true)
  video.classList.add("tag-video")
  video.volume = 0.5
  video.src = src
  video.poster = src
  video.dataset.tagname = tagName
  video.addEventListener('mouseover', playVideo)
  video.addEventListener('mouseout', stopVideo)
  target.prepend(video)
}

function runPage() {
  // if video, remove popout
  const video = document.querySelector("video.tag-video")
  // check if matches current tag name
  if (video && (!isTag || video.dataset.tagname !== getTagName())) video.remove()
  if (!isTag()) return;
  wfke("div.NarrowPage", parseAddVidTag)
}
// navigation observer
new MutationObserver(() => runPage()).observe(document.querySelector("title"), {
  childList: true,
});
document.addEventListener("visibilitychange", () => {
  const allVideos = document.querySelectorAll(".tag-video")
  if (document.hidden) {
    allVideos.forEach(video => video.muted = true)
    // setTimeout to auto-stop videos after 2s of hidden
    setTimeout(() => {
      if (document.hidden) allVideos.forEach(video => video.pause())
    }, 200)
  } else {
    allVideos.forEach(video => {
      const startInt = Math.floor(Math.random() * 200 * allVideos.length)
      setTimeout(() => video.play(), startInt)
    })
  }
})
runPage();