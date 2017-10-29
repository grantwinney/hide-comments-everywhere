function loadOptions() {
    chrome.storage.local.get('one_click_option', function(result) {
        var oneClickEnabled = (result != undefined && result.one_click_option == true);
        document.getElementById('one_click_option').checked = oneClickEnabled;
    });
}

function setOneClickDisable() {
    var oneClickEnabled = document.getElementById('one_click_option').checked;
    chrome.storage.local.set({'one_click_option': oneClickEnabled});
    chrome.browserAction.setPopup({popup: oneClickEnabled ? "" : "../popup.html"});
}

function loadExcludedUrls() {
    chrome.storage.sync.get('excluded_urls', function(result) {
        if (result != undefined && result.excluded_urls != undefined) {
            document.getElementById('excluded_urls').value = result.excluded_urls;
        }
    });
}

function checkForNewDefinitions() {
    toggleWaitCursor(true);
    getDefinitionVersion(function(version) {
        chrome.storage.local.get('definition_version', function(result) {
            if (result == undefined || result.definition_version == undefined || result.definition_version < version) {
                toggleNewDefinitionMessage(true);
            }
            toggleWaitCursor(false);
        });
    });
}

function saveExcludedUrls() {
    toggleWaitCursor(true);
    var excludedUrls = document.getElementById('excluded_urls').value;
    if (validateExcludedUrls(excludedUrls.split(/\r?\n/))) {
        chrome.storage.sync.set({'excluded_urls': excludedUrls});
    } else {
        alert('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try saving again.')
    }
    toggleWaitCursor(false);
}

function showPane(paneToShow) {
    document.getElementById('options').style.setProperty('display', paneToShow === 'options' ? 'inline' : 'none');
    document.getElementById('options-menu-item').style.setProperty('text-decoration', paneToShow === 'options' ? 'underline' : 'none');
    document.getElementById('filters').style.setProperty('display', paneToShow === 'filters' ? 'inline' : 'none');
    document.getElementById('filters-menu-item').style.setProperty('text-decoration', paneToShow === 'filters' ? 'underline' : 'none');
    document.getElementById('support').style.setProperty('display', paneToShow === 'support' ? 'inline' : 'none');
    document.getElementById('support-menu-item').style.setProperty('text-decoration', paneToShow === 'support' ? 'underline' : 'none');
}

function showVersion() {
    var manifest = chrome.runtime.getManifest();
    var version = document.getElementById('version');
    version.innerHTML = '&copy; 2017, ver ' + manifest.version

    chrome.storage.local.get('definition_version', function(result) {
        if (result != undefined || result.definition_version != undefined) {
            version.innerHTML += ' (' + result.definition_version + ')';
        }
    });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch(message.event) {
        case 'open_options_request':
            showPane(message.pane_to_show);
            break;
    }
});

window.addEventListener('DOMContentLoaded', function load(event) {
    loadOptions();
    loadExcludedUrls();
    checkForNewDefinitions();
    showVersion();
    document.getElementById('one_click_option').addEventListener('click', function() { setOneClickDisable(); });
    document.getElementById('one_click_option_description').addEventListener('click', function() { document.getElementById('one_click_option').click(); });
    document.getElementById('update_definitions').addEventListener('click', function() { getAndStoreSiteDefinitions(); });
    document.getElementById('save').addEventListener('click', function() { saveExcludedUrls(); });
    document.getElementById('options-menu-item').addEventListener('click', function(e) { e.preventDefault(); showPane('options') });
    document.getElementById('filters-menu-item').addEventListener('click', function(e) { e.preventDefault(); showPane('filters') });
    document.getElementById('support-menu-item').addEventListener('click', function(e) { e.preventDefault(); showPane('support') });
});
