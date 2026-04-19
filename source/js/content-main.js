//***********
// This file runs in the context of the current tab/page. Certain actions, like clicking the addon icon
// in the toolbar to toggle comments, may use chrome.tabs.sendMessage() to call into here
// so it can show/hide commments on the current page.
//  */

import * as utils from './shared-utils.js';


// Insert applicable selectors into the current page, without worrying about whether they'll
// ultimately be disabled later (by either manual toggling or personal/global whitelist).
function insertStylesIntoPage() {
    // Don't inject the styles twice
    if (document.getElementById('hide_comments_everywhere')) {
        return;
    }

    // Load global site definitions
    chrome.storage.local.get('global_definitions', function (def_result) {
        let allDefinitions = JSON.parse(def_result.global_definitions ?? '{}');

        if (!allDefinitions?.sites) {
            utils.log("Site patterns missing. Retrieving now.");
            utils.getUpdatedDefinitions(true,
                (_) => {
                    chrome.storage.local.get('global_definitions', function (def_result) {
                        let allDefinitions = JSON.parse(def_result.global_definitions ?? '{}');
                        if (allDefinitions?.sites) {
                            insertStylesIntoPageContinue(allDefinitions);
                        } else {
                            utils.log("Site patterns missing. Retrieval failed. (1)", true);
                            return;
                        }
                    });
                },
                (_) => { utils.log("Site patterns missing. Retrieval failed. (2)", true); }
            );
            return;
        }
        
        insertStylesIntoPageContinue(allDefinitions);
    });
};

// Given that the site definitions have already been retrieved, continue the work of inserting
// them into the current page.
function insertStylesIntoPageContinue(allDefinitions) {
    let elementsToHide = '';
    
    if (allDefinitions.sites) {
        // Apply site-specific selectors if any exist, matching on either entire hostname (including subdomain) or just the domain
        for (let site of Object.keys(allDefinitions.sites)) {
            if (site === location.hostname || site === location.hostname.split('.').slice(-2).join('.')) {
                elementsToHide = allDefinitions.sites[site];
                break;
            }
        }
        // If site not found, apply the global catch-all selectors
        if (!elementsToHide) {
            elementsToHide = allDefinitions.catchall_selectors;
        }
    }

    // Apply selectors from user blacklist if any (trumps site definitions)
    chrome.storage.sync.get('user_blacklist', function (bl_result) {
        let blacklistedElementsToHide = bl_result.user_blacklist !== undefined && utils.getBlacklistedElementsToHide(location.href, bl_result.user_blacklist);
        if (blacklistedElementsToHide) {
            elementsToHide = blacklistedElementsToHide;
        }

        // Finally, inject the styles into the page
        let style = document.createElement('style');
        style.id = "hide_comments_everywhere";
        style.textContent = elementsToHide ? `${elementsToHide} { display: none !important; visibility: hidden !important } ${allDefinitions.excluded_selectors} { display: unset !important; visibility: unset !important }` : '';

        var header = document.querySelector('head');
        if (header) {
            header.appendChild(style);
        } else {
            document.documentElement.prepend(style);
        }

        adjustCommentsVisibility();
    });
}

function adjustCommentsVisibility() {
    utils.getCommentVisibilityReason(location, function (isCommentsHidden, overrideReason) {
        // Enable or disable the injected style sheet as appropriate.
        let stylesheet = document.getElementById('hide_comments_everywhere');
        if (stylesheet) {
            stylesheet.disabled = !isCommentsHidden;
        }
        // Adjust the toolbar icon to show the correct image and title.
        chrome.runtime.sendMessage({
            event: isCommentsHidden ? 'comments_hidden' : 'comments_shown',
            overrideReason: overrideReason
        });
    });
}

function toggleCommentVisibility() {
    let stylesheet = document.getElementById('hide_comments_everywhere');
    if (stylesheet) {
        stylesheet.disabled = !stylesheet.disabled;

        // Adjust the toolbar icon to show the correct image and title.
        utils.getCommentVisibilityReason(location, function (_isCommentsHidden, overrideReason) {
            chrome.runtime.sendMessage({
                event: stylesheet.disabled ? 'comments_shown' : 'comments_hidden',
                overrideReason: overrideReason
            });
        });

        // Save the toggle setting for the current site in here, instead of when it's clicked in the popup,
        // since there's more context here as to what's going on in the page, and last-minute adjustments can be made.
        chrome.storage.sync.get('user_whitelist_flags', function (whiteListResult) {
            chrome.storage.sync.get('remember_toggle', function (result) {
                let userWhitelistFlags = JSON.parse(whiteListResult?.user_whitelist_flags ?? '{}');
                if (stylesheet.disabled && result?.remember_toggle === true) {
                    userWhitelistFlags[location.hostname] = 1;
                } else {
                    delete userWhitelistFlags[location.hostname];
                }
                chrome.storage.sync.set({ 'user_whitelist_flags': JSON.stringify(userWhitelistFlags) });
            });
        });
    }
}

export function main() {
    // Listens for messages from background script.
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
    chrome.runtime.onMessage.addListener(function (message, _sender, _sendResponse) {
        switch (message.event) {
            case 'update_tab':
                adjustCommentsVisibility();
                break;
            case 'toggle_tab':
                toggleCommentVisibility()
                break;
            default:
                utils.log(`content script received unexpected event: ${message.event}`, true);
        }
    });

    // Insert CSS selectors into the current page; specific to the URL when available, otherwise generic catch-all ones.
    insertStylesIntoPage();
}
