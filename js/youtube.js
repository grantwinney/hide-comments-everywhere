// function addStyleString(str) {
//     var node = document.createElement('style');
//     node.innerHTML = str;
//     document.body.appendChild(node);
// };

function toggleElements(elements, displayValue) {
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.setProperty("display", displayValue, "important");
    };
};

function is_extension_enabled(result) {
    return (result == undefined || result.enabled == undefined || result.enabled == true);
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // $('head').append('<style type="text/css">ytd-comments { display: ' + (message.enabled ? 'none' : 'initial') + ' !important }</style>');
    toggleElements(document.getElementsByTagName('ytd-comments'), (message.enabled ? "none" : "initial"));
    // addStyleString('ytd-comments { display: none !important }');
});

document.arrive(".ytd-comments", function() {
    chrome.storage.local.get('enabled', function(result) {
        toggleElements(document.getElementsByTagName('ytd-comments'), (is_extension_enabled(result) ? "none" : "initial"));
    });
    $(document).unbindArrive(".ytd-comments");
});
