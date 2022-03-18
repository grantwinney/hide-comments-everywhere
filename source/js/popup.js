function disableFieldsForUnsupportedUrl() {
    let addToWhitelistButton = document.getElementById('add_to_whitelist');
    let addToBlacklistButton = document.getElementById('add_to_blacklist');
    let requestAddToBlacklistButton = document.getElementById('request_add_to_blacklist');

    addToWhitelistButton.classList.add('disabled_button');
    addToWhitelistButton.disabled = true;
    addToBlacklistButton.classList.add('disabled_button');
    addToBlacklistButton.disabled = true;
    requestAddToBlacklistButton.classList.add('disabled_button');
    requestAddToBlacklistButton.disabled = true;

    let toggleHideButton = document.getElementById('toggle_hide');
    toggleHideButton.classList.add('disabled_button');
    toggleHideButton.disabled = true;
    toggleHideButton.title = "This URL is not supported.";

    let currentHostname = document.getElementById('currentHostname');
    currentHostname.style.color = '#999';
    currentHostname.style.fontStyle = 'italic';
    currentHostname.value = 'This URL is not supported.';
}

function displayCorrectToggleIconForCurrentSite(tabUrl) {
    performActionBasedOnCommentVisibility(tabUrl, function (isCommentsHidden, overrideReason) {
        chrome.storage.sync.get('remember_toggle', function (rememberToggleResult) {
            let toggleHideIcon = document.getElementById('toggle_hide_icon');
            let updatedTitle = '';
            // If the user's toggle setting is overridden by something, either their own white or black list,
            // or the global whitelist, then give them an indication as to why it is, and warn them that if
            // they try to override anything by clicking toggle that it's only temporary (because the next
            // time they reload the page and all this logic runs (again), their toggle setting will be overridden (again)).
            if (overrideReason) {
                toggleHideIcon.classList.replace('fa-comment-slash', 'fa-comment-dots');
                if (overrideReason === 'user_whitelist') {
                    updatedTitle = 'Comments always allowed, per your custom whitelist.';
                } else if (overrideReason === 'user_blacklist') {
                    updatedTitle = 'Comments always blocked, per your custom blacklist.';
                } else if (overrideReason === 'global_whitelist') {
                    updatedTitle = 'Comments always allowed, per the global whitelist.';
                }
                if (rememberToggleResult?.remember_toggle === true) {
                    updatedTitle += ' Toggle is temporary.';
                }
            } else if (!isCommentsHidden) {
                // By default, the 'comments hidden' image and title are displayed, so if comments
                // are actually being displayed, adjust the image and title as needed.
                toggleHideIcon.classList.replace('fa-comment-slash', 'fa-comment');
                updatedTitle = 'Comments currently allowed for this site. Hide?';
            }
            document.getElementById('toggle_hide').title = updatedTitle;
        });
    });
}

function addUrlToUserWhitelist(tabId, tabUrl) {
    chrome.storage.sync.get('user_whitelist', function (result) {
        let userWhitelist = result?.user_whitelist;
        let regexUrl = tabUrl.hostname.replace(/\./g, '\\.');
        if (userWhitelist) {
            userWhitelist += `\r\n${regexUrl}`;
        } else {
            userWhitelist += regexUrl;
        }
        chrome.storage.sync.set({ 'user_whitelist': userWhitelist }, function () {
            chrome.tabs.sendMessage(tabId, { event: 'update_tab' }, function () {
                chrome.runtime.openOptionsPage();
            });
        });
    });
}

function addUrlToUserBlacklist(tabUrl) {
    chrome.storage.sync.get('user_blacklist', function (result) {
        let userBlacklist = result?.user_blacklist;
        let regexUrl = tabUrl.hostname.replace(/\./g, '\\.');
        if (userBlacklist) {
            userBlacklist += `\r\n${regexUrl}`;
        } else {
            userBlacklist += regexUrl;
        }
        userBlacklist += `; ${STARTER_SELECTOR}`;
        chrome.storage.sync.set({ 'user_blacklist': userBlacklist }, function () {
            chrome.runtime.openOptionsPage();
        });
    });
}

function requestAdditionToGlobalBlacklist(tabUrl) {
    if (!isCurrentUrlSupported(tabUrl)) {
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
    document.getElementById('add_to_whitelist').addEventListener('click', function () { addUrlToUserWhitelist(tabId, tabUrl); });
    document.getElementById('add_to_blacklist').addEventListener('click', function () { addUrlToUserBlacklist(tabUrl); });
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
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        let tabId = tabs[0].id;
        let tabUrl = new URL(tabs[0].url);

        displayCorrectToggleIconForCurrentSite(tabUrl);

        if (isCurrentUrlSupported(tabUrl)) {
            document.getElementById('currentHostname').value = tabUrl.hostname;
        } else {
            disableFieldsForUnsupportedUrl();
        }

        wireUpNavBarButtons(tabId, tabUrl);
        wireUpAddBlockButtons(tabId, tabUrl);
        wireUpShareButtons();
    });
});
