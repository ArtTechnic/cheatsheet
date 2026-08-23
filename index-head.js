if (window.location.hash.startsWith("#row-details-")) {
    window.cheatSheetReturnRowId = window.location.hash.slice(1);
    history.replaceState(history.state, "", `${window.location.pathname}${window.location.search}`);
}
