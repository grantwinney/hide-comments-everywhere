export const INVALID_PROTOCOLS = ['brave', 'chrome', 'chrome-extension', 'edge', 'moz-extension', 'about'];
export const STARTER_SELECTOR = '#place_your_selectors_here';
const DEFINITION_CACHE_EXPIRATION = 86400;  // seconds
const SITES_JSON = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/sites.json';

/**
 * Get the personal blacklist entry for the given URL, if any.
 * 
 * @param {string} url - The entire URL (i.e. location.href) to look for in the user's blacklist entries.
 * @param {string} patterns - The personal blacklist entries, if any.
 * @returns {string | undefined} - The selector for the URL, or undefined if none found.
 */
export function getBlacklistedElementsToHide(url, patterns) {
    let patternsArray = patterns.split(/\r?\n/);
    for (let i = 0; i < patternsArray.length; i++) {
        if (patternsArray[i] === '') {
            continue;
        }
        let parts = patternsArray[i].split(";");
        let urlPart = parts[0];
        let selectorPart = parts[1];
        if (!selectorPart || selectorPart.trim() === '' || selectorPart.trim() === STARTER_SELECTOR) {
            continue;
        } else if (urlMatchesPattern(url, urlPart)) {
            return selectorPart;
        }
    }
    return undefined;
};

/**
 * Check if updated definitions are available, and cache them in local storage
 * 
 * @param {boolean} forceUpdate - If true, then check for new updates even if it's not time to yet
 * @param {function()} updatedAction - Additional code to execute after a successful update
 * @param {function()} notUpdatedAction - Additional code to execute after 
 */
export async function getUpdatedDefinitions(forceUpdate, updatedAction = undefined, notUpdatedAction = undefined) {
    const lastCheckResult = await chrome.storage.local.get('definition_version_last_check');

    if (!Number.isInteger(lastCheckResult?.definition_version_last_check)
        || getCurrentSeconds() - lastCheckResult.definition_version_last_check > DEFINITION_CACHE_EXPIRATION
        || forceUpdate) {

        const eTagData = await chrome.storage.local.get('etag');
        const eTag = eTagData.etag;
        const response = await fetch(SITES_JSON, {
            headers: eTag  ? { 'If-None-Match': eTag  } : {}
        });

        if (response.status === 304) {
            await chrome.storage.local.set({ 'definition_version_last_check': getCurrentSeconds() });
            if (notUpdatedAction) {
                notUpdatedAction();
            }
        } else if (response.status === 200) {
            await chrome.storage.local.set({ 'definition_version_last_check': getCurrentSeconds() });
            let newEtag = response.headers.get("ETag");
            if (newEtag) {
                await chrome.storage.local.set({ 'etag': newEtag });
                let data = await response.json();
                await chrome.storage.local.set({ 'global_definitions': JSON.stringify(data) });
                if (updatedAction) {
                    updatedAction();
                }
            }
        } else {
            log(`Unable to retrieve the latest definitions: (${response.status}) ${response.statusText}`, true);
        }
    }
}

/**
 * Check if the addon can run for a given URL based on its protocol.
 * 
 * @param {URL} tabUrl - The URL for which to check the protocol.
 * @returns {boolean} - True if the current URL is supported; otherwise false.
 */
export function isCurrentUrlSupported(tabUrl) {
    return !INVALID_PROTOCOLS.some(p => tabUrl.protocol.startsWith(p))
}

/**
 * Write a message to the console, prepended with the addon name.
 * 
 * @param {string} message - The message to write to the console.
 * @param {boolean} isError - If true, write to console as an error; otherwise, write as informational.
 */
export function log(message, isError = false) {
    if (isError) {
        console.error(`[${chrome.runtime.getManifest().name}]: ${message}`);
    } else {
        console.info(`[${chrome.runtime.getManifest().name}]: ${message}`);
    }
}

/**
 * Determine if comments are hidden and why, then run code that acts on the result.
 * 
 * @param {Location} url - The URL.
 * @param {function(boolean, string)} action - Extra code to execute.
 */
export function getCommentVisibilityReason(url, action) {
    let isCommentsHidden = true;
    let overrideReason = '';

    chrome.storage.sync.get('user_whitelist_flags', function (uwf_result) {

        // Check if toggle button was previously clicked to allow comments
        let userWhitelistFlags = JSON.parse(uwf_result?.user_whitelist_flags ?? '{}');
        if (userWhitelistFlags[url.hostname] === 1) {
            isCommentsHidden = false;
            overrideReason = 'user_whitelist_flag';
        }

        // Check user whitelist; show comments if match found
        chrome.storage.sync.get('user_whitelist', function (wh_result) {
            let urls = wh_result.user_whitelist.split(/\r?\n/);
            if (wh_result?.user_whitelist !== undefined && urlMatchesAnyPattern(url.href, urls)) {
                isCommentsHidden = false;
                overrideReason = 'user_whitelist';
            }

            // Load global site definitions
            chrome.storage.local.get('global_definitions', function (def_result) {
                let globalDefinitions = JSON.parse(def_result.global_definitions ?? '{}');

                // Check global whitelist for current site; show comments if match found
                if (globalDefinitions?.excluded_sites) {
                    for (let i = 0; i < globalDefinitions.excluded_sites.length; i++) {
                        if (url.hostname === globalDefinitions.excluded_sites[i]) {
                            isCommentsHidden = false;
                            overrideReason = 'global_whitelist';
                            break;
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

/**
 * User chose to toggle comments on the current page, so adjust the addon icon/title,
 * the setting in storage, and send a message to the content script to show/hide.
 * 
 * @param {number} tabId - The tab id to toggle comments on.
 * @param {URL} tabUrl - The URL on the current tab.
 */
export function toggleCommentsOnCurrentUrl(tabId, tabUrl) {
    if (!isCurrentUrlSupported(tabUrl)) {
        return;
    }
    // The value of the toggle setting is stored from the toggleCommentVisibility
    // method in the content script, after the comments are displayed/hidden, to
    // avoid a buggy situation described in more detail in there.
    chrome.tabs.sendMessage(tabId, { event: 'toggle_tab' });
    window.close();
}

/**
 * Check that all custom URLs are valid regex patterns.
 * 
 * @param {string[]} urls - List of URLs to validate.
 * @returns True if all regex patterns are valid; otherwise false.
 */
export function validateCustomUrls(urls) {
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

/**
 * Get whole seconds since epoch.
 * 
 * @returns Seconds since epoch.
 */
function getCurrentSeconds() {
    return new Date().getTime() / 1000 | 0;
}

/**
 * Test whether a URL matches a given regex pattern.
 * 
 * @param {string} url - The entire URL. (i.e. location.href)
 * @param {string} pattern - Regex pattern
 * @returns True if URL matches the pattern; otherwise false
 */
function urlMatchesPattern(url, pattern) {
    let re = new RegExp(pattern);
    return re.test(url);
}

/**
 * Test whether a URL matches any regex pattern in a list.
 * 
 * @param {string} url - The entire URL. (i.e. location.href)
 * @param {string[]} patterns - The regex patterns
 * @returns True if URL matches any pattern; otherwise false
 */
function urlMatchesAnyPattern(url, patterns) {
    for (let i = 0; i < patterns.length; i++) {
        if (patterns[i] === '') {
            continue;
        }
        if (urlMatchesPattern(url, patterns[i])) {
            return true;
        }
    }
    return false;
};
