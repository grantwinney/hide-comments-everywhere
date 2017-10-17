function toggleElements(elements, isHidden) {
    for (var i = 0; i < elements.length; i++) {
        toggleElement(elements[i], isHidden);
    };
};

function toggleElement(element, isHidden) {
    if (element != undefined) {
        if (isHidden) {
            element.style.setProperty('display', 'none', 'important');
        } else {
            element.style.setProperty('display', '', '');
        }
    }
};

function isValidMatch(url, pattern) {
    var re = new RegExp(pattern);
    return re.test(url);
}

function getDefinitionVersion(action) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'https://raw.githubusercontent.com/grantwinney/hide-comments-in-chrome-sites/master/version.json', true);
    xobj.responseType = 'json';
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            action(xobj.response.version);
        }
    };
    xobj.send();
}

function toggleNewDefinitionMessage(show) {
    var message = document.getElementById('new_definition_message');
    if (message != null) {
        message.style.setProperty('display', show ? 'block' : 'none');
    }
}

function toggleWaitCursor(show) {
    var elements = document.querySelectorAll('body, a, input, textarea');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.setProperty('cursor', show ? 'progress' : 'auto');
    };
    if (!show) {
        var buttons = document.getElementsByTagName('input');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].style.setProperty('cursor', 'hand');
        };
    }
}

function getAndStoreSiteDefinitions(currentVersion = undefined) {
    toggleWaitCursor(true);
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    var devModeCheckbox = document.getElementById('dev_mode')
    if (devModeCheckbox != null && devModeCheckbox.checked) {
        xobj.open('GET', 'https://raw.githubusercontent.com/grantwinney/hide-comments-in-chrome-sites/master/sites-dev.json', true);
    } else {
        xobj.open('GET', 'https://raw.githubusercontent.com/grantwinney/hide-comments-in-chrome-sites/master/sites.json', true);
    }
    xobj.responseType = 'json';
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            chrome.storage.local.set({'site_patterns': xobj.response});
            toggleNewDefinitionMessage(false);
            if (currentVersion != undefined) {
                chrome.storage.local.set({'definition_version': currentVersion});
                toggleWaitCursor(false);
            } else {
                getDefinitionVersion(function(version) {
                    chrome.storage.local.set({'definition_version': version});
                    toggleWaitCursor(false);
                });
            }
        } else {
            toggleWaitCursor(false);
        }
    };
    xobj.send();
}

function validateExcludedUrls(urls) {
    try {
        for (var i = 0; i < urls.length; i++) {
            new RegExp(urls[i]);
        }
        return true;
    }
    catch(e) {
        return false;
    }
}

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

function showEnabledIcon(tabId, callback) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: tabId }, function() {
        chrome.browserAction.setTitle({ title: '', tabId: tabId });
        if (callback !== undefined) {
            callback();
        }
    });
}

function showDisabledIcon(tabId, callback) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: tabId }, function() {
        chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: tabId });
        if (callback !== undefined) {
            callback();
        }
    });
}
