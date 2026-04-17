// Avoiding duplicate code, since content scripts don't play nicely with ES modules
// https://stackoverflow.com/a/53033388

(async () => {
  const src = chrome.runtime.getURL('js/content-main.js');
  const contentScript = await import(src);
  contentScript.main();
})();
