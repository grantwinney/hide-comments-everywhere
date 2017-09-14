chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    toggleElements(document.getElementsByClassName('commentarea'), (message.enabled ? "none" : "initial"));
});
