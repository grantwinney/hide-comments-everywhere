function makeRadioButton(name, value, text) {
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = value;

    var label = document.createElement("label");
    label.appendChild(radio);
    label.appendChild(document.createTextNode(text));
    return label;
}

function makeRadioButtonWithCustomInput(name, value, text) {
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = value;

    var input = document.createElement("input");
    input.type = "text";
    input.id = 'custom_url_input';
    input.size = "50";

    input.addEventListener('click', function() { radio.checked = true; });
    input.addEventListener('keydown', function(event) { if (event.key !== 'Tab') radio.checked = true; });

    var label = document.createElement("label");
    label.appendChild(radio);
    label.appendChild(document.createTextNode(text));
    label.appendChild(input);
    return label;
}

function showEnabledIcon(tabId) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: tabId });
    chrome.browserAction.setTitle({ title: '', tabId: tabId });
};

function showDisabledIcon(tabId) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: tabId });
    chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: tabId });
};

function addToExclusion(tabId) {
    toggleWaitCursor(true);
    var selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        var urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('custom_url_input').value;
        }
        if (urlToInclude == '') {
            toggleWaitCursor(false);
            return;
        }
        chrome.storage.sync.get('excluded_urls', function(result) {
            var excludedUrls = result != undefined && result.excluded_urls != undefined ? result.excluded_urls : '';
            try {
                var url = new URL(urlToInclude);
                var regexUrl = '^' + (url.origin + url.pathname).replace(/\./g, '\\.');
                var updatedUrls = excludedUrls + (excludedUrls[excludedUrls.length - 1] === '\n' ? '' : '\r\n') + regexUrl + '\r\n';
                if (validateExcludedUrls([regexUrl])) {
                    chrome.storage.sync.set({'excluded_urls': updatedUrls});
                    chrome.tabs.sendMessage(tabId, { event: 'pageload' });
                    window.close();
                } else {
                    displayMessage('The URL you specified is invalid. Double-check it and try saving again.')
                }
            } catch(e) {
                if (e instanceof TypeError) {
                    displayMessage('The URL you specified is invalid. Double-check it and try saving again.');
                } else {
                    displayMessage('An error occurred: ' + e.message);
                }
            } finally {
                toggleWaitCursor(false);
            }

        });
    }
    toggleWaitCursor(false);
}

function displayMessage(message) {
    var alert = document.getElementById('alert');
    alert.innerHTML = message;
    alert.style.setProperty('display', 'block');
    window.setTimeout(function() {alert.style.setProperty('display', 'none');}, 5000);
}

function submitUrlForInclusion() {
    var selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        var urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('custom_url_input').value;
        }
        if (urlToInclude !== '') {
            var title = "Here's a new site I'd like you to consider blocking";
            var body = encodeURIComponent(title + ":\n\n" + urlToInclude + '\n\n(please include any other relevant details)');
            var url = `https://github.com/grantwinney/hide-comments-in-chrome-sites/issues/new?title=${title}&body=${body}`;
            window.open(url, '_blank')
        }
    }
}

window.addEventListener('load', function load(event) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var url = new URL(tabs[0].url);
        var origin = url.origin;
        var path = url.origin + url.pathname;

        var urls = document.getElementById('urls');
        urls.appendChild(makeRadioButton('url', origin + '/.*', origin));
        urls.appendChild(document.createElement('br'));
        urls.appendChild(makeRadioButton('url', path, path));
        urls.appendChild(document.createElement('br'));
        urls.appendChild(makeRadioButtonWithCustomInput('url', 'custom', 'Custom: (include http/https) '));

        var tabId = tabs[0].id;
        document.getElementById('toggle_hide').addEventListener('click', function() {
            chrome.browserAction.getTitle({tabId: tabId}, function(title) {
                if (title.endsWith('(disabled)')) {
                    showEnabledIcon(tabId);
                    chrome.tabs.sendMessage(tabId, { event: 'toggle', hideComments: true });
                } else {
                    showDisabledIcon(tabId);
                    chrome.tabs.sendMessage(tabId, { event: 'toggle', hideComments: false });
                }
            });
            window.close();
        });

        document.getElementById('add_to_exclusion').addEventListener('click', function() { addToExclusion(tabId); });

        document.getElementById('submit_for_inclusion').addEventListener('click', submitUrlForInclusion);

        document.getElementById('edit_exclusion_urls').addEventListener('click', function() {
            chrome.runtime.openOptionsPage();
        });
    });
});
