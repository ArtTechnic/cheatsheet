const matrixCanvas = document.querySelector("#matrix-background");
const matrixContext = matrixCanvas.getContext("2d");
const matrixEdgeFade = document.createElement("div");

matrixEdgeFade.id = "matrix-edge-fade";
matrixEdgeFade.setAttribute("aria-hidden", "true");
document.body.appendChild(matrixEdgeFade);

const matrixCharacters = "0123456789ABCDEF";
const matrixPixelSize = 4;
const matrixSubCellSize = 46;
const matrixCellSize = 32;
const matrixMobileFontSize = 28;
const matrixStreamSpeed = 0.48;
const matrixRotationAngle = 5 * (Math.PI / 180);
const matrixTrailLength = 16;
const matrixTrailShades = 8;
const matrixBaseShade = 1;
const matrixStateStorageKey = "cheatsheet-matrix-state";
let matrixStreams = [];
let matrixBaseGrid = [];
let matrixBaseBrightness = [];
let matrixPreviousTime = 0;
let matrixColumnCount = 0;
let matrixRowCount = 0;
let matrixGridOffsetX = 0;
let matrixGridOffsetY = 0;
let matrixGridOriginColumn = 0;
let matrixGridOriginRow = 0;
let matrixCanvasWidth = 0;
let matrixCanvasHeight = 0;

const createMatrixValue = () => {
    return matrixCharacters[Math.floor(Math.random() * matrixCharacters.length)];
};

const applyMatrixTransform = () => {
    const scale = 1 / matrixPixelSize;
    const rotation = -matrixRotationAngle;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const centreX = matrixCanvasWidth / 2;
    const centreY = matrixCanvasHeight / 2;

    matrixContext.setTransform(
        cosine * scale,
        sine * scale,
        -sine * scale,
        cosine * scale,
        (centreX - cosine * centreX + sine * centreY) * scale,
        (centreY - sine * centreX - cosine * centreY) * scale
    );
};

const clearMatrixCanvas = () => {
    matrixContext.setTransform(1, 0, 0, 1, 0, 0);
    matrixContext.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    applyMatrixTransform();
};

const resizeMatrix = () => {
    const rotation = matrixRotationAngle;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);

    matrixCanvasWidth = Math.ceil(
        (window.innerWidth * cosine + window.innerHeight * sine) / matrixPixelSize
    ) * matrixPixelSize;
    matrixCanvasHeight = Math.ceil(
        (window.innerWidth * sine + window.innerHeight * cosine) / matrixPixelSize
    ) * matrixPixelSize;

    matrixCanvas.width = matrixCanvasWidth / matrixPixelSize;
    matrixCanvas.height = matrixCanvasHeight / matrixPixelSize;
    matrixCanvas.style.width = `${matrixCanvasWidth}px`;
    matrixCanvas.style.height = `${matrixCanvasHeight}px`;
    matrixContext.imageSmoothingEnabled = false;
    clearMatrixCanvas();
    matrixGridOffsetX = 0;
    matrixGridOffsetY = 0;
    matrixGridOriginColumn = 0;
    matrixGridOriginRow = 0;

    const columnCount = Math.ceil(matrixCanvasWidth / matrixCellSize);
    const rowCount = Math.ceil(matrixCanvasHeight / matrixCellSize);
    matrixColumnCount = columnCount;
    matrixRowCount = rowCount;
    matrixBaseGrid = Array.from({ length: rowCount }, () => {
        return Array.from({ length: columnCount }, createMatrixValue);
    });
    matrixBaseBrightness = Array.from({ length: rowCount }, () => {
        return Array.from({ length: columnCount }, () => matrixBaseShade);
    });
    const verticalStreams = Array.from({ length: Math.ceil(columnCount / 2) }, (_, streamIndex) => ({
        axis: "vertical",
        direction: streamIndex % 2 === 0 ? 1 : -1,
        fixedPosition: streamIndex * 2,
        limit: rowCount,
        position: Math.random() * (rowCount + 40) - 20,
        speed: matrixStreamSpeed,
        value: createMatrixValue(),
        trail: []
    }));
    const horizontalStreams = Array.from({ length: Math.ceil(rowCount / 2) }, (_, streamIndex) => ({
        axis: "horizontal",
        direction: streamIndex % 2 === 0 ? 1 : -1,
        fixedPosition: streamIndex * 2,
        limit: columnCount,
        position: Math.random() * (columnCount + 40) - 20,
        speed: matrixStreamSpeed,
        value: createMatrixValue(),
        trail: []
    }));

    matrixStreams = [...verticalStreams, ...horizontalStreams];
};

const saveMatrixState = () => {
    const state = {
        version: 3,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        columnCount: matrixColumnCount,
        rowCount: matrixRowCount,
        baseGrid: matrixBaseGrid,
        baseBrightness: matrixBaseBrightness,
        streams: matrixStreams,
        gridOffsetX: matrixGridOffsetX,
        gridOffsetY: matrixGridOffsetY,
        gridOriginColumn: matrixGridOriginColumn,
        gridOriginRow: matrixGridOriginRow
    };

    try {
        sessionStorage.setItem(matrixStateStorageKey, JSON.stringify(state));
    } catch {
        // The background still works normally if browser storage is unavailable.
    }
};

const restoreMatrixState = () => {
    try {
        const state = JSON.parse(sessionStorage.getItem(matrixStateStorageKey));
        const matchesViewport = state?.viewportWidth === window.innerWidth
            && state?.viewportHeight === window.innerHeight;
        const matchesGrid = state?.columnCount === matrixColumnCount
            && state?.rowCount === matrixRowCount;

        if (state?.version !== 3 || !matchesViewport || !matchesGrid) {
            return;
        }

        matrixBaseGrid = state.baseGrid;
        matrixBaseBrightness = state.baseBrightness;
        matrixStreams = state.streams;
        matrixGridOffsetX = state.gridOffsetX;
        matrixGridOffsetY = state.gridOffsetY;
        matrixGridOriginColumn = state.gridOriginColumn;
        matrixGridOriginRow = state.gridOriginRow;
    } catch {
        // Ignore incomplete state and use the freshly generated background.
    }
};

const drawMatrix = (time) => {
    if (time - matrixPreviousTime >= 40) {
        clearMatrixCanvas();

        matrixGridOffsetX -= matrixPixelSize;
        matrixGridOffsetY -= matrixPixelSize * Math.tan(matrixRotationAngle);

        if (matrixGridOffsetX <= -matrixCellSize) {
            matrixGridOffsetX += matrixCellSize;
            matrixGridOriginColumn = (matrixGridOriginColumn - 1 + matrixColumnCount) % matrixColumnCount;
        }

        if (matrixGridOffsetY <= -matrixCellSize) {
            matrixGridOffsetY += matrixCellSize;
            matrixGridOriginRow = (matrixGridOriginRow - 1 + matrixRowCount) % matrixRowCount;
        }

        const matrixFontSize = window.innerWidth <= 600
            ? matrixMobileFontSize
            : matrixSubCellSize - 2;

        matrixContext.font = `bold ${matrixFontSize}px monospace`;
        matrixContext.textBaseline = "top";
        const trailCells = new Map();

        matrixStreams.forEach((stream) => {
            const gridPosition = Math.floor(stream.position);

            if (stream.lastGridPosition !== gridPosition) {
                stream.value = createMatrixValue();
                stream.lastGridPosition = gridPosition;
                stream.trail.unshift({
                    position: gridPosition,
                    value: stream.value
                });
                stream.trail.length = Math.min(stream.trail.length, matrixTrailLength);

                const baseRow = stream.axis === "vertical"
                    ? gridPosition
                    : stream.fixedPosition;
                const baseColumn = stream.axis === "vertical"
                    ? stream.fixedPosition
                    : gridPosition;
                const wrappedBaseRow = ((baseRow % matrixRowCount) + matrixRowCount) % matrixRowCount;
                const wrappedBaseColumn = ((baseColumn % matrixColumnCount) + matrixColumnCount) % matrixColumnCount;

                matrixBaseGrid[wrappedBaseRow][wrappedBaseColumn] = stream.value;
            }

            stream.trail.forEach((trailCell, trailIndex) => {
                const unshiftedColumn = stream.axis === "vertical"
                    ? stream.fixedPosition
                    : trailCell.position;
                const unshiftedRow = stream.axis === "vertical"
                    ? trailCell.position
                    : stream.fixedPosition;
                const wrappedColumn = ((unshiftedColumn + matrixGridOriginColumn) % matrixColumnCount + matrixColumnCount) % matrixColumnCount;
                const wrappedRow = ((unshiftedRow + matrixGridOriginRow) % matrixRowCount + matrixRowCount) % matrixRowCount;
                let x = wrappedColumn * matrixCellSize + matrixGridOffsetX;
                let y = wrappedRow * matrixCellSize + matrixGridOffsetY;

                if (x >= matrixColumnCount * matrixCellSize) {
                    x -= matrixColumnCount * matrixCellSize;
                }

                if (x < 0) {
                    x += matrixColumnCount * matrixCellSize;
                }

                if (y >= matrixRowCount * matrixCellSize) {
                    y -= matrixRowCount * matrixCellSize;
                }

                if (y < 0) {
                    y += matrixRowCount * matrixCellSize;
                }

                const cellKey = `${x}:${y}`;
                const shade = matrixTrailShades - Math.floor(trailIndex / 2);
                const brightness = trailIndex === 0 ? matrixTrailShades + 1 : shade;
                const existingCell = trailCells.get(cellKey);

                if (!existingCell || brightness > existingCell.brightness) {
                    trailCells.set(cellKey, {
                        brightness,
                        isHead: trailIndex === 0,
                        shade,
                        value: trailCell.value,
                        x,
                        y
                    });
                }
            });

            const passedEnd = stream.direction > 0 && stream.position > stream.limit + 20;
            const passedStart = stream.direction < 0 && stream.position < -20;

            if ((passedEnd || passedStart) && Math.random() > 0.975) {
                stream.position = stream.direction > 0
                    ? -Math.floor(Math.random() * 20)
                    : stream.limit + Math.floor(Math.random() * 20);
                stream.speed = matrixStreamSpeed;
            } else {
                stream.position += stream.speed * stream.direction;
            }
        });

        for (let changeIndex = 0; changeIndex < 10; changeIndex += 1) {
            const gridRow = Math.floor(Math.random() * matrixRowCount);
            const gridColumn = Math.floor(Math.random() * matrixColumnCount);
            const wrappedColumn = (gridColumn + matrixGridOriginColumn) % matrixColumnCount;
            const wrappedRow = (gridRow + matrixGridOriginRow) % matrixRowCount;
            let x = wrappedColumn * matrixCellSize + matrixGridOffsetX;
            let y = wrappedRow * matrixCellSize + matrixGridOffsetY;

            if (x < 0) {
                x += matrixColumnCount * matrixCellSize;
            }

            if (y < 0) {
                y += matrixRowCount * matrixCellSize;
            }

            if (!trailCells.has(`${x}:${y}`)) {
                matrixBaseGrid[gridRow][gridColumn] = createMatrixValue();
                matrixBaseBrightness[gridRow][gridColumn] = matrixTrailShades;
            }
        }

        matrixBaseGrid.forEach((row, gridRow) => {
            row.forEach((value, gridColumn) => {
                const wrappedColumn = (gridColumn + matrixGridOriginColumn) % matrixColumnCount;
                const wrappedRow = (gridRow + matrixGridOriginRow) % matrixRowCount;
                let x = wrappedColumn * matrixCellSize + matrixGridOffsetX;
                let y = wrappedRow * matrixCellSize + matrixGridOffsetY;

                if (x < 0) {
                    x += matrixColumnCount * matrixCellSize;
                }

                if (y < 0) {
                    y += matrixRowCount * matrixCellSize;
                }

                if (!trailCells.has(`${x}:${y}`)) {
                    const shade = matrixBaseBrightness[gridRow][gridColumn];
                    matrixContext.fillStyle = `rgba(0, 255, 96, ${shade / matrixTrailShades})`;
                    matrixContext.fillText(value, x, y);
                }

                matrixBaseBrightness[gridRow][gridColumn] = Math.max(
                    matrixBaseShade,
                    matrixBaseBrightness[gridRow][gridColumn] - 1
                );
            });
        });

        trailCells.forEach((cell) => {
            matrixContext.fillStyle = cell.isHead
                ? "rgba(255, 255, 255, 1)"
                : `rgba(0, 255, 96, ${cell.shade / matrixTrailShades})`;
            matrixContext.fillText(cell.value, cell.x, cell.y);
        });

        matrixPreviousTime = time;
    }

    requestAnimationFrame(drawMatrix);
};

resizeMatrix();
window.addEventListener("resize", resizeMatrix);
restoreMatrixState();
window.addEventListener("pagehide", saveMatrixState);
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        restoreMatrixState();
    }
});
matrixPreviousTime = performance.now() - 40;
drawMatrix(performance.now());
