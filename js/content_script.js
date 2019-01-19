function handleSelectors(selector, isHidden) {
    if (selector != undefined) {
        toggleElements(document.querySelectorAll(selector), isHidden);
    }
}

function handleDelaySelectors(selector, onceOnly, isHidden) {
    if (selector != undefined) {
        document.unbindArrive(selector);
        if (isHidden) {
            document.arrive(selector, {onceOnly: onceOnly !== false}, function() {
                console.info("Hide Comments Everywhere detected arrival of: " + selector)
                toggleElements(document.querySelectorAll(selector), isHidden);
            });
        }
        toggleElements(document.querySelectorAll(selector), isHidden);
    }
}

function isUrlExcluded(url, excludedUrls) {
    let excludedUrlPatterns = excludedUrls.split(/\r?\n/);
    for (let i = 0; i < excludedUrlPatterns.length; i++) {
        if (excludedUrlPatterns[i] === '') {
            continue;
        }
        if (isValidMatch(url, excludedUrlPatterns[i])) {
            return true;
        }
    }
    return false;
};

function showCommentsInCodeBlocks() {
    toggleElement(document.querySelectorAll('pre .comment, code .comment'), false);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get('site_patterns', function(sp_result) {
        if (sp_result == undefined || sp_result.site_patterns == undefined) {
            console.error("Missing Site Patterns!");
            return;
        }
        let sites = sp_result.site_patterns.sites;
        switch(message.event) {
            case 'pageload':
                chrome.storage.sync.get('excluded_urls', function(eu_result) {
                    let hideComments = (eu_result === undefined || eu_result.excluded_urls === undefined || !isUrlExcluded(location.href, eu_result.excluded_urls));
                    for (let i = 0; i < sites.length; i++) {
                        let site = sites[i];
                        if (isValidMatch(location.href, site.pattern)) {
                            handleSelectors(site.immediate, hideComments);
                            handleDelaySelectors(site.delay, site.onceOnly, hideComments);
                            showCommentsInCodeBlocks();
                            chrome.runtime.sendMessage({event: "scriptdone", hideComments: hideComments});
                            break;
                        }
                    }
                });
                break;
            case 'toggle':
                for (let i = 0; i < sites.length; i++) {
                    let site = sites[i];
                    if (isValidMatch(location.href, site.pattern)) {
                        handleSelectors(site.immediate, message.hideComments);
                        handleDelaySelectors(site.delay, site.onceOnly, message.hideComments);
                        showCommentsInCodeBlocks();
                        break;
                    }
                }
                break;
        }
    });
});
