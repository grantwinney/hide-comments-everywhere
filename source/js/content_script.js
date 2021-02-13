// Injects a style sheet that can be used to toggle a set of selectors on the current page.
const toggleElements = (() => {
    const style = document.createElement('style');
    document.head.append(style);
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

// Listens for messages from background script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function(message, _sender, _sendResponse) {
    chrome.storage.local.get('definitions', function(result) {
        let definitions = result.definitions;
        if (definitions === undefined || definitions.sites === undefined) {
            logError("Missing site patterns!");
            return;
        }

        // Sites like GitHub should never have comments hidden, hence a hard-coded whitelist
        if (definitions.excludedsites !== undefined) {
            for (let i = 0; i < definitions.excludedsites.length; i++) {
                if (isValidMatch(location.hostname, definitions.excludedsites[i])) {
                    return;
                }
            }
        }

        // Block comments for other sites
        let sites = definitions.sites;
        let siteMatchFound = false;
        switch(message.event) {
            case 'tab_updated':  // A tab was upated with a new URL, so redo hiding the comments
                chrome.storage.sync.get('excluded_urls', function(eu_result) {
                    let hideComments = (eu_result === undefined || eu_result.excluded_urls === undefined || !isUrlExcluded(location.href, eu_result.excluded_urls));
                    for (let site of Object.keys(sites)) {
                        if (site === location.hostname) {
                            toggleElements(sites[site], hideComments);
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
            case 'toggle':  // Toggling comments based on user action
                for (let site of Object.keys(sites)) {
                    if (site === location.hostname) {
                        toggleElements(sites[site], message.hideComments);
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
