function displayMessage(message) {
    let alert = document.getElementById('alert');
    alert.innerHTML = message;
    alert.style.setProperty('display', 'block');
    window.setTimeout(function () { alert.style.setProperty('display', 'none'); }, 5000);
}

function addToWhitelist(tabId) {
    let selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        let urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('customUrlDesc').value;
        }
        if (urlToInclude === '') {
            displayMessage("Enter a valid URL")
            return;
        }
        chrome.storage.sync.get('excluded_urls', function (result) {
            let excludedUrls = result != undefined && result.excluded_urls != undefined ? result.excluded_urls : '';
            try {
                let url = new URL(urlToInclude);
                let regexUrl = '^' + (url.origin + url.pathname).replace(/\./g, '\\.');
                let updatedUrls = excludedUrls + (excludedUrls[excludedUrls.length - 1] === '\n' ? '' : '\r\n') + regexUrl + '\r\n';
                if (validateCustomUrls([regexUrl])) {
                    chrome.storage.sync.set({ 'excluded_urls': updatedUrls });
                    chrome.tabs.sendMessage(tabId, { event: 'tab_updated' });
                    window.close();
                } else {
                    displayMessage('The URL you specified is invalid. Double-check it and try saving again.')
                }
            } catch (e) {
                if (e instanceof TypeError) {
                    displayMessage('The URL you specified is invalid. Double-check it and try saving again.');
                } else {
                    displayMessage('An error occurred: ' + e.message);
                }
            }

        });
    }
}

function addToBlacklist(tabId) {
    // TODO: Make sure all 3 of these functions still work
}

function requestAddToBlacklist() {
    let selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        let urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('customUrlDesc').value;
        }
        if (urlToInclude === '') {
            displayMessage("Enter a valid URL")
            return;
        }
        let title = "Here's a new site I'd like you to consider blocking";
        let body = encodeURIComponent(title + ":\n\n" + urlToInclude + '\n\n(please include any other relevant details)');
        let url = `https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=${title}&body=${body}`;
        window.open(url, '_blank')
    }
}

function displayUrlOptions(url) {
    let currentUrlFormatChoices = document.getElementById('currentUrlFormatChoices');
 
    // Populate dropdown with suggestions
    let hostnameParts = url.hostname.split('.');
    let urlOptions = [];
    if (hostnameParts[0] === 'www') {
        urlOptions.push(`${url.protocol}//${url.hostname}`);
    } else {
        for (let i = hostnameParts.length - 2; i >= 0; i--) {
            urlOptions.push(`${url.protocol}//${hostnameParts.slice(i, hostnameParts.length).join('.')}`);
        }
    }
    for (let url of urlOptions) {
        currentUrlFormatChoices.add(new Option(url, url));
    }
  
    // Prepopulate custom url field with hostname value
    let customUrlDesc = document.getElementById('customUrlDesc');
    customUrlDesc.value = `${url.protocol}//${url.hostname}`;

    // Select the corresponding radio button if one of the url fields has focus
    let currentUrlOpt = document.getElementById('currentUrlOpt');
    for (let eventName of ['click', 'focus', 'keydown']) {
        currentUrlFormatChoices.addEventListener(eventName, function () { currentUrlOpt.checked = true; });
    }
    let customUrlOpt = document.getElementById('customUrlOpt');
    for (let eventName of ['click', 'focus', 'keydown']) {
        customUrlDesc.addEventListener(eventName, function () { customUrlOpt.checked = true; });
    }
}

window.addEventListener('DOMContentLoaded', function load(_event) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        let tabId = tabs[0].id;

        // Buttons in caption bar
        document.getElementById('toggle_hide').addEventListener('click', function () {
            toggleComments(tabId);
        });
        document.getElementById('options').addEventListener('click', function () {
            chrome.runtime.openOptionsPage();
        });
        document.getElementById('share').addEventListener('click', function () {
            let shareBox = document.getElementById('share_box');
            shareBox.style.visibility = shareBox.style.visibility === 'hidden' ? 'visible' : 'hidden';
        });
        document.getElementById('report').addEventListener('click', function () {
            let reportLink = 'https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=I%27d%20like%20to%20report%20a%20problem%20or%20request%20help&body=I%27m%20experiencing%20the%20following%20issue:%20(include%20as%20many%20details%20as%20possible)';
            window.open(reportLink, '_blank');
        });

        // Buttons for sharing addon
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

        // Display available url formats to select from
        displayUrlOptions(new URL(tabs[0].url));

        document.getElementById('add_to_whitelist').addEventListener('click', function () { addToWhitelist(tabId); });
        document.getElementById('add_to_blacklist').addEventListener('click', function () { addToBlacklist(tabId); });
        document.getElementById('request_add_to_blacklist').addEventListener('click', requestAddToBlacklist);
    });
});
