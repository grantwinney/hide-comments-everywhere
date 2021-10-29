// Injects a style sheet that can be used to toggle a set of selectors on the current page.
const toggleElements = (() => {
    const style = document.createElement('style');
    document.documentElement.prepend(style);
    return (selectors, hide) => style.textContent = hide ? `${selectors} { display: none !important } pre .comment, code .comment, textarea.comments { display: inherit }` : '';
})();

// Determines whether a URL matches a given regex pattern.
function isValidMatch(url, pattern) {
    let re = new RegExp(pattern);
    return re.test(url);
}

// Test whether a URL is in the user's whitelist of excluded URLs
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

function hideCommentsAsPageLoads() {
    chrome.storage.local.get('definitions', function(result) {
        let definitions = result.definitions;
        if (definitions?.sites === undefined) {
            logError("Missing site patterns!");
            return;
        }

        // Sites like GitHub should never have comments hidden, hence a hard-coded whitelist
        if (definitions.exclusions !== undefined) {
            for (let i = 0; i < definitions.exclusions.length; i++) {
                if (isValidMatch(location.hostname, definitions.exclusions[i])) {
                    return;
                }
            }
        }

        // Block comments for other sites
        let siteMatchFound = false;
        chrome.storage.sync.get('excluded_urls', function(eu_result) {
            let hideComments = (eu_result?.excluded_urls === undefined || !isUrlExcluded(location.href, eu_result.excluded_urls));
            if (!hideComments) {
                chrome.runtime.sendMessage({event: "elements_modified", hideComments: false});
                return;
            }
            for (let site of Object.keys(definitions.sites)) {
                if (site === location.hostname) {
                    toggleElements(definitions.sites[site], true);
                    chrome.runtime.sendMessage({event: "elements_modified", hideComments: true});
                    siteMatchFound = true;
                    break;
                }
            }
            if (!siteMatchFound) {
                toggleElements(definitions.catchall, hideComments);
                chrome.runtime.sendMessage({event: "elements_modified", hideComments: hideComments});
            }
        });
    });
}

// Listens for messages from background script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function(message, _sender, _sendResponse) {
    chrome.storage.local.get('definitions', function(result) {
        let definitions = result.definitions;
        if (definitions?.sites === undefined) {
            logError("Missing site patterns!");
            return;
        }

        // Sites like GitHub should never have comments hidden, hence a hard-coded whitelist
        if (definitions.exclusions !== undefined) {
            for (let i = 0; i < definitions.exclusions.length; i++) {
                if (isValidMatch(location.hostname, definitions.exclusions[i])) {
                    return;
                }
            }
        }

        // Block comments for other sites
        let siteMatchFound = false;
        switch(message.event) {
            case 'tab_updated':
                chrome.storage.sync.get('excluded_urls', function(eu_result) {
                    let hideComments = (eu_result?.excluded_urls === undefined || !isUrlExcluded(location.href, eu_result.excluded_urls));
                    if (!hideComments) {
                        chrome.runtime.sendMessage({event: "elements_modified", hideComments: false});
                        return;
                    }
                    for (let site of Object.keys(definitions.sites)) {
                        if (site === location.hostname) {
                            toggleElements(definitions.sites[site], true);
                            chrome.runtime.sendMessage({event: "elements_modified", hideComments: true});
                            siteMatchFound = true;
                            break;
                        }
                    }
                    if (!siteMatchFound) {
                        toggleElements(definitions.catchall, hideComments);
                        chrome.runtime.sendMessage({event: "elements_modified", hideComments: hideComments});
                    }
                });
                break;
            case 'toggle':
                for (let site of Object.keys(definitions.sites)) {
                    if (site === location.hostname) {
                        toggleElements(definitions.sites[site], message.hideComments);
                        siteMatchFound = true;
                        break;
                    }
                }
                if (!siteMatchFound) {
                    toggleElements(definitions.catchall, message.hideComments);
                }
                break;
            default:
                logError(`content script: ${message.event}`);
        }
    });
});

hideCommentsAsPageLoads();
