// Determines whether a URL matches a given regex pattern.
function urlMatchesPattern(url, pattern) {
    let re = new RegExp(pattern);
    return re.test(url);
}

// Test whether a given URL matches any entries in the whitelist.
function urlMatchesAnyWhitelistPattern(url, patterns) {
    let patternsArray = patterns.split(/\r?\n/);
    for (let i = 0; i < patternsArray.length; i++) {
        if (patternsArray[i] === '') {
            continue;
        }
        if (urlMatchesPattern(url, patternsArray[i])) {
            return true;
        }
    }
    return false;
};


// Test whether a given URL matches any entries in the blacklist, and return the elements to hide, if any.
function getBlacklistedElementsToHide(url, patterns) {
    let patternsArray = patterns.split(/\r?\n/);
    for (let i = 0; i < patternsArray.length; i++) {
        if (patternsArray[i] === '') {
            continue;
        }
        let parts = patternsArray[i].split(";");
        if (urlMatchesPattern(url, parts[0])) {
            return parts[1];
        }
    }
    return undefined;
};

function hideCommentsAsPageLoads(updateIconOnly = false) {
    let elementsToHide = '';
    let isCommentsHidden = false;

    // Load addon site definitions
    chrome.storage.local.get('definitions', function(def_result) {
        let definitions = def_result.definitions;
        if (!definitions?.sites) {
            logError("Missing site patterns.");
            return;
        }

        // Check addon site definitions; hide comments if match found
        for (let site of Object.keys(definitions.sites)) {
            if (site === location.hostname) {
                elementsToHide = definitions.sites[site];
                isCommentsHidden = true;
                break;
            }
        }

        // If nothing else, apply the generic "catchall" styles
        if (!elementsToHide) {
            elementsToHide = definitions.catchall;
            isCommentsHidden = true;
        }

        // Check user whitelist; show comments if match found
        chrome.storage.sync.get('excluded_urls', function(wh_result) {
            if (wh_result?.excluded_urls !== undefined && urlMatchesAnyWhitelistPattern(location.href, wh_result.excluded_urls)) {
                isCommentsHidden = false;
            }

            // Check user blacklist; hide comments if match found
            chrome.storage.sync.get('blacklist_urls', function(bl_result) {
                let blacklistedElementsToHide = getBlacklistedElementsToHide(location.hostname, bl_result.blacklist_urls);
                if (blacklistedElementsToHide) {
                    elementsToHide = blacklistedElementsToHide;
                    isCommentsHidden = true;
                }

                // Check hard-coded whitelist; show comments if match found
                if (definitions.exclusions) {
                    for (let i = 0; i < definitions.exclusions.length; i++) {
                        if (urlMatchesPattern(location.hostname, definitions.exclusions[i])) {
                            isCommentsHidden = false;
                            return;
                        }
                    }
                }

                if (!updateIconOnly) {
                    // Injects a style sheet that can be used to show or hide a set of elements (defined by CSS selectors) on the page.
                    let style = document.createElement('style');
                    style.title = "hide_comments_everywhere";
                    document.documentElement.prepend(style);
                    style.textContent = `${elementsToHide} { display: none !important } pre .comment, code .comment, textarea.comments { display: inherit }`;
                    style.disabled = !isCommentsHidden;
                }
                chrome.runtime.sendMessage({event: isCommentsHidden ? 'comments_hidden' : 'comments_shown' });
            });
        });
    });
}

// Listens for messages from background script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function(message, _sender, _sendResponse) {
    switch(message.event) {
        case 'tab_updated':
            hideCommentsAsPageLoads(true);
            break;
        case 'toggle':
            // document.styleSheets.item(0).disabled = !document.styleSheets.item(0).disabled;
            for (let i=0; i < document.styleSheets.length; i++) {
                if (document.styleSheets.item(i).title === 'hide_comments_everywhere') {
                    document.styleSheets.item(i).disabled = !document.styleSheets.item(i).disabled;
                    chrome.runtime.sendMessage({event: document.styleSheets.item(i).disabled ? 'comments_shown' : 'comments_hidden' });
                    break;
                }
            }
            break;
        default:
            logError(`content script: ${message.event}`);
    }
});

hideCommentsAsPageLoads();
