function toggleElements(elements, displayValue) {
    for (var i = 0; i < elements.length; i++) {
        toggleElement(elements[i], displayValue);
    };
};

function toggleElement(element, displayValue) {
    if (element !== undefined) {
        element.style.setProperty("display", displayValue, "important");
    }
};

function is_extension_enabled(result) {
    return (result == undefined || result.enabled == undefined || result.enabled == true);
};
