const returnRowId = new URLSearchParams(window.location.search).get("return");

if (returnRowId?.startsWith("row-details-")) {
    window.cheatSheetReturnRowId = returnRowId;
    document.documentElement.classList.add("return-position-pending");
    history.scrollRestoration = "manual";
    history.replaceState(history.state, "", window.location.pathname);
}

document.addEventListener("DOMContentLoaded", async () => {
if (window.cheatSheetReturnRowId) {
    const returnRow = document.getElementById(window.cheatSheetReturnRowId);

    if (returnRow) {
        const returnSpacer = document.createElement("div");

        returnSpacer.setAttribute("aria-hidden", "true");
        returnSpacer.style.height = "50vh";
        document.querySelector(".main-panel").appendChild(returnSpacer);
        returnRow.classList.add("return-target");

        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        const centreReturnRow = () => {
            const rowTop = returnRow.getBoundingClientRect().top + window.scrollY;
            const centredTop = rowTop - ((window.innerHeight - returnRow.offsetHeight) / 2);

            window.scrollTo(0, Math.max(0, centredTop));
        };

        await new Promise((resolve) => requestAnimationFrame(resolve));
        centreReturnRow();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        centreReturnRow();
    }

    document.documentElement.classList.remove("return-position-pending");
}

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

const updateRowHighlight = () => {
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
