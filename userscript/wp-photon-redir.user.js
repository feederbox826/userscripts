// ==UserScript==
// @name         wp-photon-redir
// @namespace    feederbox826
// @version      0.1
// @description  Redirect Wordpress photon links
// @author       feederbox826
// @match        https://i0.wp.com/*
// @match        https://i1.wp.com/*
// @match        https://i2.wp.com/*
// @match        https://i3.wp.com/*
// @run-at       document-start
// ==/UserScript==

location.href = location.href.replace(/i[0-3]\.wp\.com\/|\?ssl=1$/g, '')