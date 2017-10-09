function handleSelectors(selector, isHidden) {
    if (selector != undefined) {
        toggleElements(document.querySelectorAll(selector), isHidden);
    }
}

function handleDelaySelectors(selector, onceOnly, isHidden) {
    if (selector != undefined) {
        document.unbindArrive(selector);
        document.arrive(selector, {onceOnly: onceOnly !== false}, function() {
            toggleElements(document.querySelectorAll(selector), isHidden);
        });
    }
}

function isUrlExcluded(url, excludedUrls) {
    var excludedUrlPatterns = excludedUrls.split(/\r?\n/);
    for (var i = 0; i < excludedUrlPatterns.length; i++) {
        if (excludedUrlPatterns[i] === '') {
            continue;
        }
        if (isValidMatch(url, excludedUrlPatterns[i])) {
            return true;
        }
    }
    return false;
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get('site_patterns', function(sp_result) {
        if (sp_result == undefined || sp_result.site_patterns == undefined) {
            console.error("Missing Site Patterns!");
            return;
        }
        var sites = sp_result.site_patterns.sites;

        if (message.event === 'pageload') {
            chrome.storage.sync.get('excluded_urls', function(eu_result) {
                var hideComments = (eu_result === undefined || eu_result.excluded_urls === undefined || !isUrlExcluded(location.href, eu_result.excluded_urls));
                for (var i = 0; i < sites.length; i++) {
                    var site = sites[i];
                    if (isValidMatch(location.href, site.pattern)) {
                        handleSelectors(site.immediate, hideComments);
                        handleDelaySelectors(site.delay, site.onceOnly, hideComments);
                        chrome.runtime.sendMessage({event: "scriptdone", hideComments: hideComments});
                        break;
                    }
                }
            });
        } else if (message.event === 'toggle') {
            for (var i = 0; i < sites.length; i++) {
                var site = sites[i];
                if (isValidMatch(location.href, site.pattern)) {
                    handleSelectors(site.immediate, message.hideComments);
                    handleDelaySelectors(site.delay, site.onceOnly, message.hideComments);
                    break;
                }
            }
        }

    });
});
