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
    chrome.storage.local.get('global_definitions', function (def_result) {
        let globalDefinitions = JSON.parse(def_result.global_definitions ?? '{}');

        if (!globalDefinitions?.sites) {
            logError("Missing site patterns.");
            return;
        }
         
        if (globalDefinitions.sites) {
            // Check global site definitions for current site
            for (let site of Object.keys(globalDefinitions.sites)) {
                if (site === location.hostname) {
                    elementsToHide = globalDefinitions.sites[site];
                    break;
                }
            }
            // If current site not found, apply the global catchall definition
            if (!elementsToHide) {
                elementsToHide = globalDefinitions.catchall_selectors;
            }
        }

        // Check user blacklist (takes precedence over user whitelist)
        chrome.storage.sync.get('user_blacklist', function (bl_result) {
            let blacklistedElementsToHide = bl_result.user_blacklist !== undefined && getBlacklistedElementsToHide(location.hostname, bl_result.user_blacklist);
            if (blacklistedElementsToHide) {
                elementsToHide = blacklistedElementsToHide;
            }

            // Inject the styles into the page
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
        let stylesheet = findStylesheet();
        if (stylesheet) {
            stylesheet.disabled = !isCommentsHidden;
        }
        chrome.runtime.sendMessage({ event: isCommentsHidden ? 'comments_hidden' : 'comments_shown' });
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
