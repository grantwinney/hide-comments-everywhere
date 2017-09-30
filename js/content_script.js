function handleSelectors(selector, isHiding) {
    if (selector != undefined) {
        toggleElements(document.querySelectorAll(selector), isHiding);
    }
}

function handleDelaySelectors(selector, onceOnly, isHiding) {
    if (selector != undefined) {
        document.arrive(selector, {onceOnly: true}, function() {
            toggleElements(document.querySelectorAll(selector), isHiding);
        });
    }
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get('site_patterns', function(result) {
        if (result == undefined || result.site_patterns == undefined) {
            console.error("Missing Site Patterns!");
            return;
        }
        var sites = result.site_patterns.sites;
        for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            if (isValidMatch(message.url, site.pattern)) {
                handleSelectors(site.immediate, message.enabled);
                handleDelaySelectors(site.delay, site.onceOnly, message.enabled);
                break;
            }
        }
    });
});
