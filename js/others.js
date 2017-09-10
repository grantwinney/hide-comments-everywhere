function toggleFacebook(isEnabled) {
    toggleElements(document.getElementsByTagName('fb:comments-count'), isEnabled);
    toggleElements(document.getElementsByClassName('fb-comments'), isEnabled);
}

function toggleDisqus(isEnabled) {
    toggleElement(document.getElementById('disqus_thread'), isEnabled);
}

function toggleAutomattic(isEnabled) {
    toggleElements(document.getElementsByClassName('o2-display-comments-toggle'), isEnabled);
    toggleElements(document.getElementsByClassName('o2-post-comments'), isEnabled);
    toggleElements(document.getElementsByClassName('o2-post-comment-controls'), isEnabled);
}

function toggleLivefyre(isEnabled) {
    toggleElements(document.getElementsByClassName('commentlist'), isEnabled);
}

function toggleWordPressAndOthers(isEnabled) {
    toggleElement(document.getElementById('comments'), isEnabled);
    toggleElement(document.getElementById('respond'), isEnabled);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    var isEnabled = (message.enabled ? "none" : "initial");
    toggleFacebook(isEnabled);
    toggleDisqus(isEnabled);
    toggleAutomattic(isEnabled);
    toggleLivefyre(isEnabled);
    toggleWordPressAndOthers(isEnabled);
});

document.arrive("#disqus_thread > iframe", {onceOnly: true}, function() {
    chrome.storage.local.get('enabled', function(result) {
        toggleElement(document.getElementById('disqus_thread'), (is_extension_enabled(result) ? "none" : "initial"));
    });
});
