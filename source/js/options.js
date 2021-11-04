// SETTINGS

function loadSettings() {
    chrome.storage.local.get('one_click_option', function (result) {
        document.getElementById('one_click_option').checked = (result?.one_click_option === true);
    });
}

function setOneClick() {
    let oneClickEnabled = document.getElementById('one_click_option').checked;
    chrome.storage.local.set({ 'one_click_option': oneClickEnabled });
    chrome.browserAction.setPopup({ popup: oneClickEnabled ? '' : '../popup.html' });
}

// FILTERS

function loadWhitelist() {
    chrome.storage.sync.get('excluded_urls', function (result) {
        if (result?.excluded_urls != undefined) {
            document.getElementById('excluded_urls').value = result.excluded_urls;
        }
    });
}

function loadBlacklist() {
    chrome.storage.sync.get('blacklist_urls', function (result) {
        if (result?.blacklist_urls != undefined) {
            document.getElementById('blacklist_urls').value = result.blacklist_urls;
        }
    });
}

function saveUrlList(urlTextAreaId, savedItem) {
    let urls = document.getElementById(urlTextAreaId).value;
    if (validateCustomUrls(urls.split(/\r?\n/))) {
        let urlJson = {};
        urlJson[urlTextAreaId] = urls;
        chrome.storage.sync.set(urlJson, function () {
            if (chrome.runtime.lastError) {
                toastr.error(chrome.runtime.lastError.message, `${savedItem} Save Failed`);
            } else {
                toastr.success(`Your changes to the ${savedItem.toLowerCase()} have been saved.`, `${savedItem} Changes Saved`);
            }
        });
    } else {
        toastr.warning('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try saving again.', `${savedItem} Save Failed`);
    }
}

function saveWhitelist() {
    saveUrlList('excluded_urls', 'Whitelist');
}

function saveBlacklist() {
    saveUrlList('blacklist_urls', 'Blacklist');
}

function submitBlacklist() {
    let blacklistUrls = document.getElementById('blacklist_urls').value;
    navigator.clipboard.writeText(blacklistUrls)
        .then(function() {
            window.open("https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=Blacklisted sites to consider adding&body=Here's my list of blacklisted sites to consider blocking by default.%0A%0A```%0A(THEY'RE ON YOUR CLIPBOARD. Just paste them here and replace this line.)%0A```%0A", '_blank');
            toastr.success("Another tab should open to GitHub, where you can paste the blacklist as a new issue.", "Submit Blacklist");
        })
        .catch(error => function() {
            window.open("https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=Blacklisted sites to consider adding&body=Here's my list of blacklisted sites to consider blocking by default.%0A%0A```%0A(Copy them from the Options page, and paste them here replacing this line.)%0A```%0A", '_blank');
            toastr.warning("Copying the blacklist to your clipboard failed, so you'll have to copy and paste them into the GitHub issue manually.", "Submit Blacklist", {timeOut: 120000});
            logError(error.message)
        });
}

// FOOTER

function showVersion() {
    let manifest = chrome.runtime.getManifest();
    let version = document.getElementById('version');
    version.innerHTML = `&copy; 2018 - ${(new Date()).getFullYear()}, ver ${manifest.version}`

    chrome.storage.local.get('definition_version', function (result) {
        if (result?.definition_version) {
            version.innerHTML += ` (${result.definition_version})`;
        }
    });
}

window.addEventListener('DOMContentLoaded', function load(_event) {
    // Settings
    loadSettings();
    document.getElementById('one_click_option').addEventListener('click', function () { setOneClick(); });

    // Filters
    loadWhitelist();
    loadBlacklist();
    $("#save-whitelist").click(function () { saveWhitelist(); });
    $("#save-blacklist").click(function () { saveBlacklist(); });
    $("#submit-blacklist").click(function () { submitBlacklist(); });
    $("#filters-help-hint-1").click(function () { $("#filters-help-1").slideToggle(500); });
    $("#filters-help-hint-2").click(function () { $("#filters-help-2").slideToggle(500); });

    // Updates
    getUpdatedDefinitions((version) => {
        toastr.info(`Updated site definitions (#${version}) were found and have been applied.`, "Updated Sites Available", {timeOut: 10000});
    });
    $("#update-definitions").click(function () { getUpdatedDefinitions(
            (version) => { toastr.info(`Updated site definitions (#${version}) were found and have been applied.`, "Updated Sites Available"); },
            (version) => { toastr.info(`The latest site definitions (#${version}) are already applied.`, "No Updates Available"); }
        ); });

    showVersion();
});
