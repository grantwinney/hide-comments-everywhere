let invalidProtocols = ['chrome-extension', 'edge'];
const starter_selector = '#place_your_selectors_here';

// Write an error to the console, prepended with the addon name.
function logError(errorMessage) {
    console.error(`[${chrome.runtime.getManifest().name}]: ${errorMessage}`);
}

// Get the current site definitions.
function getUpdatedDefinitions(updatedAction = undefined, notUpdatedAction = undefined) {
    // TODO: Change these values back, here and in manifest file, before uploading to store
    let versionJson = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/upgrade/sites/version.json';
    let sitesJson = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/upgrade/sites/sites.json';

    axios.get(versionJson)
        .then(function (cloudVersionResult) {
            chrome.storage.local.get('definition_version', function (localVersionResult) {
                if (localVersionResult?.definition_version == undefined || !Number.isInteger(localVersionResult.definition_version) || localVersionResult.definition_version < cloudVersionResult.data.version) {
                    axios.get(sitesJson)
                        .then(function (cloudSitesResult) {
                            chrome.storage.local.set({ 'global_definitions': JSON.stringify(cloudSitesResult.data) });
                            chrome.storage.local.set({ 'definition_version': cloudVersionResult.data.version });
                            if (updatedAction) {
                                updatedAction(cloudVersionResult.data.version);
                            }
                        })
                        .catch(function (error) {
                            logError(JSON.stringify(error));
                        });
                } else {
                    if (notUpdatedAction) {
                        notUpdatedAction(localVersionResult.definition_version);
                    }
                }
            });
        });
}

function isCurrentUrlSupported(tabUrl) {
    return !invalidProtocols.some(p => tabUrl.protocol.startsWith(p))
}

// User chose to toggle comments on the current page, so adjust the addon icon/title,
//  the setting in storage, and send a message to the content script to show/hide.
function toggleCommentsOnCurrentUrl(tabId, tabUrl) {
    if (!isCurrentUrlSupported(tabUrl)) {
        return;
    }
    chrome.storage.sync.get('user_whitelist_flags', function (result) {
        try {
            // The value of the toggle setting is stored from the toggleCommentVisibility
            // method in the content script, after the comments are displayed/hidden, to
            // avoid a buggy situation described in more detail in there.
            chrome.tabs.sendMessage(tabId, { event: 'toggle_tab' });
            window.close();
        } catch (e) {
            logError(e);
        }
    });
}

// Check that all custom URLs are valid regex patterns
function validateCustomUrls(urls) {
    try {
        for (let i = 0; i < urls.length; i++) {
            new RegExp(urls[i]);
        }
        return true;
    }
    catch (e) {
        return false;
    }
}

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
        let urlPart = parts[0];
        let selectorPart = parts[1];
        if (selectorPart.trim() === '' || selectorPart.trim() === starter_selector) {
            continue;
        } else if (urlMatchesPattern(url, urlPart)) {
            return selectorPart;
        }
    }
    return undefined;
};

function performActionBasedOnCommentVisibility(url, action) {
    let isCommentsHidden = true;
    let overrideReason = '';

    chrome.storage.sync.get('user_whitelist_flags', function (uwf_result) {
        // Check if toggle button was previously clicked to allow comments
        let userWhitelistFlags = JSON.parse(uwf_result?.user_whitelist_flags ?? '{}');
        if (userWhitelistFlags[url.hostname] === 1) {
            isCommentsHidden = false;
            overrideReason = "user_whitelist_flag";
        }

        // Check user whitelist; show comments if match found
        chrome.storage.sync.get('user_whitelist', function (wh_result) {
            if (wh_result?.user_whitelist !== undefined && urlMatchesAnyWhitelistPattern(url.href, wh_result.user_whitelist)) {
                isCommentsHidden = false;
                overrideReason = 'user_whitelist';
            }

            // Load global site definitions
            chrome.storage.local.get('global_definitions', function (def_result) {
                let globalDefinitions = JSON.parse(def_result.global_definitions ?? '{}');

                // Check global whitelist for current site; show comments if match found
                if (globalDefinitions?.excluded_sites) {
                    for (let i = 0; i < globalDefinitions.excluded_sites.length; i++) {
                        if (urlMatchesPattern(url.hostname, globalDefinitions.excluded_sites[i])) {
                            isCommentsHidden = false;
                            overrideReason = 'global_whitelist';
                        }
                    }
                }

                // Check user blacklist; hide comments if match found (trumps all whitelists)
                chrome.storage.sync.get('user_blacklist', function (bl_result) {
                    let blacklistedElementsToHide = bl_result.user_blacklist !== undefined && getBlacklistedElementsToHide(url.href, bl_result.user_blacklist);
                    if (blacklistedElementsToHide) {
                        isCommentsHidden = true;
                        overrideReason = 'user_blacklist';
                    }

                    action(isCommentsHidden, overrideReason);
                });
            });
        });
    });
}
