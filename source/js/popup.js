let invalidProtocols = ['chrome-extension', 'edge'];

function isCurrentUrlSupported(tabUrl) {
    return !invalidProtocols.some(p => tabUrl.protocol.startsWith(p))
}

function displayCorrectButtonsBasedOnUserWhitelist(tabUrl) {
    chrome.storage.sync.get('user_whitelist', function (result) {
        let userWhitelist = JSON.parse(result?.user_whitelist ?? '{}');
        try {
            if (userWhitelist[tabUrl.hostname] === 1) {
                let toggleHideIcon = document.getElementById('toggle_hide_icon');
                toggleHideIcon.classList.replace('fa-comment-slash', 'fa-comment');
                toggleHideIcon.title = 'Comments currently allowed for this site. Hide?';
            }
        } catch (e) {
            logError(e);
        }
    });
}

function addCurrentUrlToInputBox(tabUrl) {
    document.getElementById('currentHostname').value =
        isCurrentUrlSupported(tabUrl) ? tabUrl.hostname : 'This URL is not supported.'
}

function allowCommentsOnCurrentUrl(tabId, tabUrl) {
    if (!isCurrentUrlSupported(tabUrl)) {
        return;
    }

    chrome.storage.sync.get('user_whitelist', function (result) {
        let userWhitelist = JSON.parse(result?.user_whitelist ?? '{}');
        try {
            userWhitelist[tabUrl.hostname] = 1;
            chrome.storage.sync.set({ 'user_whitelist': JSON.stringify(userWhitelist) });
            chrome.tabs.sendMessage(tabId, { event: 'tab_updated' });
            window.close();
        } catch (e) {
            logError(e);
        }
    });
}

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
            chrome.storage.sync.set({ 'user_whitelist': JSON.stringify(userWhitelist) });
            chrome.tabs.sendMessage(tabId, { event: 'tab_updated' });
            window.close();
        } catch (e) {
            logError(e);
        }
    });
}

function blockCommentsOnCurrentUrl(tabId, tabUrl) {
    chrome.storage.sync.get('user_blacklist', function (result) {
        let userBlacklist = JSON.parse(result?.user_blacklist ?? '{}');
        try {
            if (!userBlacklist[tabUrl.hostname]) {
                userBlacklist[tabUrl.hostname] = '';  // Configuration happens on Options page
                chrome.storage.sync.set({ 'user_blacklist': JSON.stringify(userBlacklist) });
            }
            chrome.runtime.openOptionsPage();  // TODO: How to jump to blacklist section, preferably to this key?
        } catch (e) {
            logError(e);
        }
    });
}

function requestAdditionToBlacklist(tabUrl) {
    if (invalidProtocols.some(p => tabUrl.protocol.startsWith(p))) {
        return;
    }

    let title = "Here's a new site I'd like you to consider blocking";
    let body = encodeURIComponent(title + ":\n\n" + tabUrl.hostname + '\n\n(please include any other relevant details)');
    let url = `https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=${title}&body=${body}`;
    window.open(url, '_blank')
}

function wireUpNavBarButtons(tabId, tabUrl) {
    document.getElementById('toggle_hide').addEventListener('click', function () {
        toggleCommentsOnCurrentUrl(tabId, tabUrl);
    });

    document.getElementById('options').addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });
    document.getElementById('share').addEventListener('click', function () {
        let shareBox = document.getElementById('share_box');
        shareBox.style.visibility = shareBox.style.visibility === 'hidden' ? 'visible' : 'hidden';
    });
    document.getElementById('report').addEventListener('click', function () {
        let reportLink = `https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=I%27d%20like%20to%20report%20a%20problem%20or%20request%20help&body=I%27m%20experiencing%20the%20following%20issue%20on%20${tabUrl.hostname}:%20(include%20as%20many%20details%20as%20possible)`;
        window.open(reportLink, '_blank');
    });
}

function wireUpAddBlockButtons(tabId, tabUrl) {
    document.getElementById('add_to_blacklist').addEventListener('click', function () { blockCommentsOnCurrentUrl(tabId, tabUrl); });
    document.getElementById('request_add_to_blacklist').addEventListener('click', function () { requestAdditionToGlobalBlacklist(tabUrl); });
}

function wireUpShareButtons() {
    document.getElementById('share_twitter').addEventListener('click', function () {
        let twitterLink = `http://twitter.com/share?text=${document.getElementById('share_box_comment').value}`;
        window.open(twitterLink, '_blank');
    });
    document.getElementById('share_facebook').addEventListener('click', function () {
        let facebookLink = 'https://www.facebook.com/sharer/sharer.php?u=https://grantwinney.com/hide-comments-everywhere/';
        window.open(facebookLink, '_blank');
    });
    document.getElementById('share_reddit').addEventListener('click', function () {
        let redditLink = 'http://www.reddit.com/submit?url=https://grantwinney.com/hide-comments-everywhere&title=Lower%20your%20blood%20pressure.%20Hide%20comments%20everywhere.';
        window.open(redditLink, '_blank');
    });
    document.getElementById('share_email').addEventListener('click', function () {
        let emailLink = `mailto:?subject=Lower%20your%20blood%20pressure%20with%20Hide%20Comments%20Everywhere&body=${document.getElementById('share_box_comment').value}`;
        window.open(emailLink, '_blank');
    });
    document.getElementById('share_clipboard_copy').addEventListener('click', function () {
        navigator.clipboard.writeText(document.getElementById('share_box_comment').value);
    });
}

window.addEventListener('DOMContentLoaded', function load(_event) {
    /* ONE TIME UPDATE STUFF */

    // TODO: Convert the current whitelist to a dictionary - 'excluded_urls' -> 'user_whitelist'
    // let regexUrl = '^' + currentUrl.hostname.replace(/\./g, '\\.');
    // let updatedUrls = userWhitelist + (userWhitelist[userWhitelist.length - 1] === '\n' ? '' : '\r\n') + regexUrl + '\r\n';

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        let tabId = tabs[0].id;
        let tabUrl = new URL(tabs[0].url);

        addCurrentUrlToInputBox(tabUrl);

        wireUpNavBarButtons(tabId, tabUrl);
        wireUpAddBlockButtons(tabId, tabUrl);
        wireUpShareButtons();

        displayCorrectButtonsBasedOnUserWhitelist(tabUrl);

        if (!isCurrentUrlSupported(tabUrl)) {
            //TODO: disable addblock buttons and one nav button
        }
    });
});
