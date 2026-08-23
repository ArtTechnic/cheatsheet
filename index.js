const returnRowId = window.location.hash.startsWith("#row-details-")
    ? decodeURIComponent(window.location.hash.slice(1))
    : "";

if (returnRowId) {
    document.documentElement.classList.add("return-pending");
}

document.addEventListener("DOMContentLoaded", () => {
const initialReturnRow = returnRowId ? document.getElementById(returnRowId) : null;

if (initialReturnRow) {
    initialReturnRow.scrollIntoView({ block: "center", inline: "nearest" });
    document.documentElement.classList.add("return-positioned");
}

document.activeElement?.blur();
document.documentElement.classList.remove("return-pending");

window.addEventListener("pageshow", () => {
    document.activeElement?.blur();
});

const searchForm = document.querySelector("#header-search");
const searchInput = searchForm.querySelector("input");
const searchError = document.querySelector("#search-error");
const searchSuggestions = document.querySelector("#search-suggestions");
const searchSuggestionList = document.querySelector("#search-suggestion-list");
const searchRows = [...document.querySelectorAll(".cheat-sheet tbody tr")];
let searchErrorTimer;
let highlightedRow;
let pointerX = -1;
let pointerY = -1;
let rowHighlightFrame;
let rowPointerHighlightEnabled = !document.querySelector("tr:target");

const updateRowHighlight = () => {
    if (!rowPointerHighlightEnabled) {
        highlightedRow?.classList.remove("is-pointer-hovered");
        highlightedRow = undefined;
        rowHighlightFrame = undefined;
        return;
    }

    const rowUnderPointer = document.elementFromPoint(pointerX, pointerY)?.closest("tr.clickable-row");

    if (rowUnderPointer !== highlightedRow) {
        highlightedRow?.classList.remove("is-pointer-hovered");
        rowUnderPointer?.classList.add("is-pointer-hovered");
        highlightedRow = rowUnderPointer;
    }

    rowHighlightFrame = undefined;
};

const requestRowHighlightUpdate = () => {
    if (rowHighlightFrame === undefined) {
        rowHighlightFrame = requestAnimationFrame(updateRowHighlight);
    }
};

document.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    requestRowHighlightUpdate();
});

document.addEventListener("scroll", requestRowHighlightUpdate, true);

document.addEventListener("pointerleave", () => {
    pointerX = -1;
    pointerY = -1;
    requestRowHighlightUpdate();
});

if (!rowPointerHighlightEnabled) {
    document.querySelector(".main-panel").addEventListener("animationend", () => {
        rowPointerHighlightEnabled = true;
        requestRowHighlightUpdate();
    }, { once: true });
}

searchRows.forEach((row) => {
    row.addEventListener("click", () => {
        window.location.assign(row.dataset.href);
    });
});

const hideSearchSuggestions = () => {
    searchSuggestions.hidden = true;
    searchSuggestionList.scrollTop = 0;
    searchSuggestionList.replaceChildren();
};

const hideSearchError = () => {
    clearTimeout(searchErrorTimer);
    searchError.hidden = true;
};

const openSearchResult = () => {
    hideSearchSuggestions();
    const searchText = searchInput.value.trim().toLowerCase();
    const matchingRow = searchRows.find((row) => {
        return row.cells[0].textContent.trim().toLowerCase() === searchText;
    });
    const destination = matchingRow?.dataset.href;

    if (destination) {
        hideSearchError();
        window.location.assign(destination);
    } else {
        clearTimeout(searchErrorTimer);
        searchInput.value = "";
        searchError.hidden = false;
        searchErrorTimer = setTimeout(hideSearchError, 3000);
    }
};

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    openSearchResult();
});

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        openSearchResult();
    }
});

searchInput.addEventListener("input", () => {
    hideSearchError();
    const searchText = searchInput.value.trim().toLowerCase();
    const matchingRows = searchText === "" ? [] : searchRows.filter((row) => {
        return row.cells[0].textContent.trim().toLowerCase().startsWith(searchText);
    });

    hideSearchSuggestions();

    if (matchingRows.length > 1) {
        matchingRows.forEach((row) => {
            const destination = row.dataset.href;
            const suggestion = document.createElement("button");

            suggestion.type = "button";
            suggestion.textContent = row.cells[0].textContent.trim();
            suggestion.setAttribute("role", "option");
            suggestion.addEventListener("click", () => {
                window.location.assign(destination);
            });
            searchSuggestionList.append(suggestion);
        });

        searchSuggestionList.scrollTop = 0;
        searchSuggestions.hidden = false;
    }
});

document.addEventListener("click", (event) => {
    if (event.target !== searchInput && !searchSuggestions.hidden) {
        hideSearchSuggestions();
        searchInput.blur();
    }
});
});
