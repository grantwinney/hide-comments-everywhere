chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    toggleElements(document.getElementsByClassName('inline-reply-tweetbox'), (message.enabled ? "none" : "initial"));
    toggleElements(document.getElementsByClassName('replies-to'), (message.enabled ? "none" : "initial"));
});
