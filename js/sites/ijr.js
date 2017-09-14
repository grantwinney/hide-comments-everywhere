chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    toggleElements(document.getElementsByClassName('opt360-discuss-cta-top-comments'), (message.enabled ? "none" : "initial"));
});
