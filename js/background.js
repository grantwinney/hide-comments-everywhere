function show_enabled_icon() {
    chrome.browserAction.setIcon({ path: "images/hide-comments-32.png" });
    chrome.browserAction.setTitle({ title: "" });
};

function show_disabled_icon() {
    chrome.browserAction.setIcon({ path: "images/hide-comments-bw-32.png" });
    chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + " (disabled)" });
};

function is_extension_enabled(result) {
    return (result == undefined || result.enabled == undefined || result.enabled == true);
};

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.local.get('enabled', function(result) {
        if (is_extension_enabled(result)) {
            chrome.storage.local.set({'enabled': false}, show_disabled_icon);
            chrome.tabs.sendMessage(tab.id, { enabled: false });
        } else {
            chrome.storage.local.set({'enabled': true}, show_enabled_icon);
            chrome.tabs.sendMessage(tab.id, { enabled: true });
        }
    });
});

setTimeout(function() {
    chrome.storage.local.get('enabled', function(result) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var isEnabled = is_extension_enabled(result);
            if (isEnabled) {
                show_enabled_icon();
            } else {
                show_disabled_icon();
            }
            chrome.tabs.sendMessage(tabs[0].id, { enabled: isEnabled });
        });
    });
}, 5000);


// window.addEventListener('load', function load(event) {
//     chrome.storage.local.get('enabled', function(result) {
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//             var isEnabled = is_extension_enabled(result);
//             if (isEnabled) {
//                 show_enabled_icon();
//             } else {
//                 show_disabled_icon();
//             }
//             chrome.tabs.sendMessage(tabs[0].id, { enabled: isEnabled });
//         });
//     });
// });
