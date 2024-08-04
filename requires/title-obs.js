const changeObs = new EventTarget();
let paginationObserved = false;

function wfke(selector, callback) {
    var el = document.querySelector(selector);
    if (el) return callback(el);
    setTimeout(wfke, 100, selector, callback);
}

const titleObs = new MutationObserver(() => {
    changeObs.dispatchEvent(new Event("titleChange"))
    paginationObserved = false;
    wfke("ul.pagination", observePagination);
}).observe(document.querySelector("title"), { childList: true });

function observePagination() {
    if (paginationObserved) return;
    // pagination observer
    new MutationObserver(() => {
        changeObs.dispatchEvent(new Event("pagination"))
    }).observe(
        document.querySelector("ul.pagination"),
        { attributes: true, subtree: true },
    );
    paginationObserved = true;
}
wfke("ul.pagination", observePagination);
window.changeObs = changeObs;
window.wfke = wfke;