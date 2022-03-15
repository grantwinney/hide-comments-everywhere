let invalidProtocols = ['chrome-extension', 'edge'];

// Write an error to the console, prepended with the addon name.
function logError(errorMessage) {
    console.error(`[${chrome.runtime.getManifest().name}]: ${errorMessage}`);
}

// Get the current site definitions.
function getUpdatedDefinitions(updatedAction = undefined, notUpdatedAction = undefined) {
    let versionJson = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/upgrade/sites/version.json';
    let sitesJson = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/upgrade/sites/sites.json';

    axios.get(versionJson)
        .then(function (cloudVersionResult) {
            chrome.storage.local.get('definition_version', function (localVersionResult) {
                if (localVersionResult?.definition_version == undefined || !Number.isInteger(localVersionResult.definition_version) || localVersionResult.definition_version < cloudVersionResult.data.version) {
                    axios.get(sitesJson)
                        .then(function (cloudSitesResult) {
                            chrome.storage.local.set({ 'definitions': JSON.stringify(cloudSitesResult.data) });
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
    chrome.storage.sync.get('user_whitelist', function (result) {
        let userWhitelist = JSON.parse(result?.user_whitelist ?? '{}');
        try {
            if (userWhitelist[tabUrl.hostname] === 1) {
                delete userWhitelist[tabUrl.hostname];
            } else {
                userWhitelist[tabUrl.hostname] = 1;
            }
            chrome.storage.sync.set({ 'user_whitelist': JSON.stringify(userWhitelist) }, function () {
                chrome.tabs.sendMessage(tabId, { event: 'update_tab' });
                window.close();
            });
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
