// Write an error to the console, prepended with the addon name.
function logError(errorMessage) {
    console.log(`${chrome.runtime.getManifest().name}: ${errorMessage}`);
}

// Addon is enabled for a particular url
function showEnabledIcon(tabId, callback) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: tabId }, function() {
        chrome.browserAction.setTitle({ title: '', tabId: tabId });
        if (callback !== undefined) {
            callback();
        }
    });
}

// Addon is disabled for a particular url
function showDisabledIcon(tabId, callback) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: tabId }, function() {
        chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: tabId });
        if (callback !== undefined) {
            callback();
        }
    });
}

// Get the current version number for the site definitions.
function getDefinitionVersion(action) {
    axios.get('https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/version.json')
         .then(function(result) {
            action(result.data.version);
         });
}

// Get the current site definitions.
function getDefinitions(currentVersion = undefined) {
    axios.get('https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/sites.json')
         .then(function(result) {
            chrome.storage.local.set({'definitions': result.data});
            if (currentVersion != undefined) {
                chrome.storage.local.set({'definition_version': currentVersion});
            } else {
                getDefinitionVersion(function(version) {
                    chrome.storage.local.set({'definition_version': version});
                });
            }
         });
}

// Show a "progress" cursor while busy
function toggleWaitCursor(show) {
    let elements = document.querySelectorAll('body, a, input, textarea');
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.setProperty('cursor', show ? 'progress' : 'auto');
    };
    if (!show) {
        let buttons = document.getElementsByTagName('input');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.setProperty('cursor', 'hand');
        };
    }
}

// User chose to toggle comments (temporary), so adjust the addon icon/title and send a message
//  to the content script to toggle whether or not comments are hidden on the page.
function toggleComments(tabId, postAction = undefined) {
    chrome.browserAction.getTitle({tabId: tabId}, function(title) {
        if (title.endsWith('(disabled)')) {
            showEnabledIcon(tabId, postAction);
            chrome.tabs.sendMessage(tabId, { event: 'toggle', hideComments: true });
        } else {
            showDisabledIcon(tabId, postAction);
            chrome.tabs.sendMessage(tabId, { event: 'toggle', hideComments: false });
        }
    });
}

// Validates that the user's custom URL whitelist are valid to use as regex patterns
function validateExcludedUrls(urls) {
    try {
        for (let i = 0; i < urls.length; i++) {
            new RegExp(urls[i]);
        }
        return true;
    }
    catch(e) {
        return false;
    }
}

