var isHiding = true;

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    isHiding = message.enabled;
    toggleElements(document.getElementsByTagName('ytd-comments'), (isHiding ? "none" : "initial"));
});

document.arrive("ytd-comments", {onceOnly: true}, function() {
    toggleElements(document.getElementsByTagName('ytd-comments'), (isHiding ? "none" : "initial"));
});
