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

function findStylesheet() {
    for (let i = 0; i < document.styleSheets.length; i++) {
        let stylesheet = document.styleSheets.item(i);
        if (stylesheet.title === 'hide_comments_everywhere') {
            return stylesheet;
        }
    }
    return undefined;
}

// Insert applicable styles into page. Decide whether to disable them later.
function insertStylesIntoPage() {
    if (findStylesheet()) {
        return;
    }

    let elementsToHide = '';

    // Load global site definitions
    chrome.storage.local.get('definitions', function (def_result) {
        let definitions = JSON.parse(def_result.definitions ?? '{}');

        if (definitions?.sites) {
            // Check global site definitions for current site
            for (let site of Object.keys(definitions.sites)) {
                if (site === location.hostname) {
                    elementsToHide = definitions.sites[site];
                    break;
                }
            }
            // If current site not found, apply the global catchall definition
            if (!elementsToHide) {
                elementsToHide = definitions.catchall_selectors;
            }
        } else {
            logError("Missing site patterns.");
            return;
        }

        // Check user blacklist (takes precedence over user whitelist)
        chrome.storage.sync.get('blacklist_urls', function (bl_result) {
            let blacklistedElementsToHide = bl_result.blacklist_urls !== undefined && getBlacklistedElementsToHide(location.hostname, bl_result.blacklist_urls);
            if (blacklistedElementsToHide) {
                elementsToHide = blacklistedElementsToHide;
            }

            // Inject the styles into the page
            let style = document.createElement('style');
            style.title = "hide_comments_everywhere";
            document.documentElement.prepend(style);
            style.textContent = elementsToHide ? `${elementsToHide} { display: none; visibility: hidden } ${definitions.excluded_selectors} { display: unset; visibility: unset }` : '';

            adjustCommentsVisibility();
        });
    });
};


function adjustCommentsVisibility() {
    let isCommentsHidden = true;

    chrome.storage.sync.get('user_whitelist', function (uw_result) {
        // Check if 'hide comments' button was clicked for site
        let userWhitelist = JSON.parse(uw_result?.user_whitelist ?? '{}');
        if (userWhitelist[location.hostname] === 1) {
            isCommentsHidden = false;
        }

        // Check user whitelist; show comments if match found
        chrome.storage.sync.get('whitelist_urls', function (wh_result) {
            if (wh_result?.user_whitelist !== undefined && urlMatchesAnyWhitelistPattern(location.href, wh_result.whitelist_urls)) {
                isCommentsHidden = false;
            }

            // Check user blacklist; hide comments if match found (takes precedence over user whitelist)
            chrome.storage.sync.get('blacklist_urls', function (bl_result) {
                let blacklistedElementsToHide = bl_result.blacklist_urls !== undefined && getBlacklistedElementsToHide(location.href, bl_result.blacklist_urls);
                if (blacklistedElementsToHide) {
                    isCommentsHidden = true;
                }

                // Load global site definitions
                chrome.storage.local.get('definitions', function (def_result) {
                    let definitions = JSON.parse(def_result.definitions ?? '{}');

                    // Check global whitelist for current site
                    if (definitions?.excluded_sites) {
                        for (let i = 0; i < definitions.excluded_sites.length; i++) {
                            if (urlMatchesPattern(location.hostname, definitions.excluded_sites[i])) {
                                isCommentsHidden = false;
                            }
                        }
                    }

                    let stylesheet = findStylesheet();
                    if (stylesheet) {
                        stylesheet.disabled = !isCommentsHidden;
                    }
                    chrome.runtime.sendMessage({ event: isCommentsHidden ? 'comments_hidden' : 'comments_shown' });
                });
            });
        });
    });
}

// Listens for messages from background script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function (message, _sender, _sendResponse) {
    switch (message.event) {
        case 'update_tab':
            adjustCommentsVisibility();
            break;
        default:
            logError(`content script: ${message.event}`);
    }
});

insertStylesIntoPage();
