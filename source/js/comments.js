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
            let blacklistedElementsToHide = bl_result.user_blacklist !== undefined && getBlacklistedElementsToHide(location.href, bl_result.user_blacklist);
            if (blacklistedElementsToHide) {
                elementsToHide = blacklistedElementsToHide;
            }

            // Finally, inject the styles into the page
            let style = document.createElement('style');
            style.title = "hide_comments_everywhere";
            style.textContent = elementsToHide ? `${elementsToHide} { display: none !important; visibility: hidden !important } ${globalDefinitions.excluded_selectors} { display: unset; visibility: unset }` : '';

            var header = document.querySelector('head');
            if (header) {
                header.appendChild(style);
            } else {
                document.documentElement.prepend(style);
            }

            adjustCommentsVisibility();
        });
    });
};

function adjustCommentsVisibility() {
    performActionBasedOnCommentVisibility(location, function (isCommentsHidden, overrideReason) {
        // Enable or disable the injected style sheet as appropriate.
        let stylesheet = findStylesheet();
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
    let stylesheet = findStylesheet();
    if (stylesheet) {
        stylesheet.disabled = !stylesheet.disabled;

        // Adjust the toolbar icon to show the correct image and title.
        performActionBasedOnCommentVisibility(location, function (_isCommentsHidden, overrideReason) {
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

// Listens for messages from background script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function (message, sender, _sendResponse) {
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
