function findStylesheet() {
    for (let i = 0; i < document.styleSheets.length; i++) {
        let stylesheet = document.styleSheets.item(i);
        if (stylesheet.title === 'hide_comments_everywhere') {
            return stylesheet;
        }
    }
    return undefined;
}

// Figure out which selectors apply to the current site and insert them into the page, without
// worrying about whether or not they'll be disabled later (either by the user via toggling
// or a whitelist, or by the global whitelist).
function insertStylesIntoPage() {
    if (findStylesheet()) {
        return;
    }

    let elementsToHide = '';

    // Load global site definitions
    chrome.storage.local.get('global_definitions', function (def_result) {
        let globalDefinitions = JSON.parse(def_result.global_definitions ?? '{}');

        if (!globalDefinitions?.sites) {
            logError("Missing site patterns.");
            return;
        }

        if (globalDefinitions.sites) {
            // Apply site-specific selectors if any exist
            for (let site of Object.keys(globalDefinitions.sites)) {
                if (site === location.hostname) {
                    elementsToHide = globalDefinitions.sites[site];
                    break;
                }
            }
            // If site not found, apply the global catchall selectors
            if (!elementsToHide) {
                elementsToHide = globalDefinitions.catchall_selectors;
            }
        }

        // Apply selectors from user blacklist if any (trumps site definitions)
        chrome.storage.sync.get('user_blacklist', function (bl_result) {
            let blacklistedElementsToHide = bl_result.user_blacklist !== undefined && getBlacklistedElementsToHide(location.hostname, bl_result.user_blacklist);
            if (blacklistedElementsToHide) {
                elementsToHide = blacklistedElementsToHide;
            }

            // Finally, inject the styles into the page
            let style = document.createElement('style');
            style.title = "hide_comments_everywhere";
            document.documentElement.prepend(style);
            style.textContent = elementsToHide ? `${elementsToHide} { display: none; visibility: hidden } ${globalDefinitions.excluded_selectors} { display: unset; visibility: unset }` : '';

            adjustCommentsVisibility();
        });
    });
};

function adjustCommentsVisibility() {
    performActionBasedOnCommentVisibility(location, function (isCommentsHidden, _overrideReason) {
        // Enable or disable the injected style sheet as appropriate.
        let stylesheet = findStylesheet();
        if (stylesheet) {
            stylesheet.disabled = !isCommentsHidden;
        }
        // Adjust the toolbar icon to show the correct image.
        chrome.runtime.sendMessage({ event: isCommentsHidden ? 'comments_hidden' : 'comments_shown' });
    });
}

function toggleCommentVisibility() {
    let stylesheet = findStylesheet();
    if (stylesheet) {
        stylesheet.disabled = !stylesheet.disabled;
        chrome.storage.sync.get('user_whitelist_flags', function (result) {
            let userWhitelistFlags = JSON.parse(result?.user_whitelist_flags ?? '{}');
            if (stylesheet.disabled) {
                userWhitelistFlags[location.hostname] = 1;
            } else {
                delete userWhitelistFlags[location.hostname];
            }
            // Save the user's preference for the current site in here, instead of when they click it in the popup,
            // to avoid the case where the toggle flag was set to hide comments but the whitelists caused comments to be shown,
            // and when the user attempts to toggle comments for the current site, the flag is set to 1 (in the popup) but this code hides the comments (causing a mismatch).
            chrome.storage.sync.set({ 'user_whitelist_flags': JSON.stringify(userWhitelistFlags) }, function () {
                chrome.runtime.sendMessage({ event: userWhitelistFlags[location.hostname] === 1 ? 'comments_shown' : 'comments_hidden' });
            });
        });
    }
}

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
            logError(`content script: ${message.event}`);
    }
});

insertStylesIntoPage();
