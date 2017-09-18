chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    toggleElements(document.getElementsByClassName('commentable_item'), (message.enabled ? "none" : "initial"));
});
