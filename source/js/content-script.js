// Avoiding duplicate code, since content scripts don't play nicely with ES modules
// https://stackoverflow.com/a/53033388

// getURL() converts a relative path within an app/extension install directory to a fully-qualified URL.
// https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getURL

// The import() syntax, commonly called dynamic import, is a function-like expression that allows
// loading an ECMAScript module asynchronously and dynamically into a potentially non-module environment.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import

(async () => {
  const src = chrome.runtime.getURL('js/content-main.js');
  const contentScript = await import(src);
  contentScript.main();
})();
