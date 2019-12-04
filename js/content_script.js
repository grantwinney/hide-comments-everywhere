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

function elementsToAlwaysShow() {
    // always show comments in code blocks
    // always show textarea comments, which are probably part of a contact form
    toggleElements(document.querySelectorAll('pre .comment, code .comment, textarea.comments'), false);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get('site_patterns', function(sp_result) {
        if (sp_result === undefined || sp_result.site_patterns === undefined) {
            console.error("Missing site patterns!");
            return;
        }

        // Sites like GitHub should never have comments hidden, hence a hard-coded whitelist
        let perm_whitelist = sp_result.site_patterns.ignore;
        if (perm_whitelist !== undefined) {
            for (let i = 0; i < perm_whitelist.length; i++) {
                let site_pattern = perm_whitelist[i];
                if (isValidMatch(location.href, site_pattern)) {
                    return;
                }
            }
        }

        // Block comments for other sites
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
                            elementsToAlwaysShow();
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
                        elementsToAlwaysShow();
                        break;
                    }
                }
                break;
        }
    });
});
