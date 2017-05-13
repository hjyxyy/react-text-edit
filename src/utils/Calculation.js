import CharSize from './CharSize';
import Valid from './Valid';

function calculateTextDisplayIndex({editorDataArray, scrollTop, editorOptions, editorHeight}) {

    const len = editorDataArray.length;

    let start = Math.floor(scrollTop / editorOptions.lineHeight),
        stop = start + Math.ceil(editorHeight / editorOptions.lineHeight);

    start -= editorOptions.lineCache;
    stop += editorOptions.lineCache;

    return {
        start: Valid.range(start, 0, len),
        stop: Valid.range(stop, 0, len)
    };

}

function calculateCursorPosition(x, y, {editorEl, editorDataArray, editorOptions}) {

    if (isNaN(x) || isNaN(y)) {
        return;
    }

    const offsetTop = Valid.range(y - 10, 0),
        row = Math.round(offsetTop / editorOptions.lineHeight),
        top = row * editorOptions.lineHeight,
        offsetLeft = Valid.range(x - editorOptions.horizontalPadding + 3, 0),
        {left, col} = CharSize.calculateCursorPosition(editorDataArray[row], offsetLeft, editorEl);

    return {
        left: left + editorOptions.horizontalPadding,
        top,
        row,
        col
    };

}

function calculateCursorSelectionPosition(props) {

    const {
        editorEl, editorDataArray, editorOptions, contentWidth, isDoubleClick, isTripleClick,
        selectStartX, selectStartY, selectStopX, selectStopY
    } = props;

    let selectStartPosition, selectStopPosition, cursorPosition;

    if (isTripleClick) {

        cursorPosition = calculateCursorPosition(selectStopX, selectStopY, props);

        selectStartPosition = Object.assign({}, cursorPosition);
        selectStartPosition.left = editorOptions.horizontalPadding;
        selectStartPosition.col = 0;

        selectStopPosition = Object.assign({}, cursorPosition);
        selectStopPosition.left = contentWidth + editorOptions.horizontalPadding * 2 + editorOptions.scrollBarWidth;
        selectStopPosition.col = editorDataArray[cursorPosition.row].length;

    } else if (isDoubleClick) {

        cursorPosition = calculateCursorPosition(selectStopX, selectStopY, props);

        const string = editorDataArray[cursorPosition.row];
        let tempCol, tempchar, tempChars;

        selectStartPosition = Object.assign({}, cursorPosition);
        tempCol = cursorPosition.col;
        tempChars = [];
        do {

            tempchar = string.at(tempCol - 1);

            if (!editorOptions.discontinuousChars.includes(tempchar)) {
                tempChars.push(tempchar);
            } else {
                break;
            }

            tempCol--;

        } while (tempCol > 0);
        if (tempChars.length > 0) {
            selectStartPosition.left -= CharSize.calculateStringWidth(tempChars.join(''), editorEl);
            selectStartPosition.col -= tempChars.length;
        }

        selectStopPosition = Object.assign({}, cursorPosition);
        tempCol = cursorPosition.col;
        tempChars = [];
        do {

            tempchar = string.at(tempCol);

            if (!editorOptions.discontinuousChars.includes(tempchar)) {
                tempChars.push(tempchar);
            } else {
                break;
            }

            tempCol++;

        } while (tempCol < string.length);
        if (tempChars.length > 0) {
            selectStopPosition.left += CharSize.calculateStringWidth(tempChars.join(''), editorEl);
            selectStopPosition.col += tempChars.length;
        }


    } else {
        selectStartPosition = calculateCursorPosition(selectStartX, selectStartY, props);
        selectStopPosition = calculateCursorPosition(selectStopX, selectStopY, props);
        cursorPosition = Object.assign({}, selectStopPosition);
    }

    return {selectStartPosition, selectStopPosition, cursorPosition};

}

function sortPosition(start, stop) {

    if (!start || !stop || isNaN(start.row) || isNaN(start.col) || isNaN(stop.row) || isNaN(stop.col)) {
        return [start, stop];
    }

    if (start.row < stop.row) {
        return [start, stop];
    } else if (start.row > stop.row) {
        return [stop, start];
    } else {
        if (start.col > stop.col) {
            return [stop, start];
        } else {
            return [start, stop];
        }
    }

}

function hasSelection(start, stop) {
    if (start && stop && (start.row !== stop.row || start.col !== stop.col)) {
        return true;
    }
    return false;
}

function getSelectionValue(dataArray, start, stop) {

    if (!dataArray || !start || !stop || !hasSelection(start, stop)) {
        return '';
    }

    [start, stop] = sortPosition(start, stop);

    if (start.row === stop.row) { // in one line
        return dataArray[start.row].slice(start.col, stop.col);
    } else {

        let result = [];

        result.push(dataArray[start.row].slice(start.col));
        for (let i = start.row + 1; i < stop.row; i++) {
            result.push(dataArray[i]);
        }
        result.push(dataArray[stop.row].slice(0, stop.col));

        return result;

    }

}

function deleteLine(dataArray, pos, lineHeight, editorEl) {

    if (!dataArray || !pos || !(pos.row in dataArray) || !lineHeight) {
        return;
    }

    let newDataArray = dataArray.slice(),
        newPosition = Object.assign({}, pos);

    newPosition.left = CharSize.calculateStringWidth(dataArray[pos.row - 1], editorEl);
    newPosition.top -= lineHeight;

    newDataArray[pos.row - 1] = newDataArray[pos.row - 1] + newDataArray[pos.row];
    newDataArray.splice(pos.row, 1);

    return {newDataArray, newPosition};

}

function deleteChar(dataArray, pos, editorEl) {

    if (!dataArray || !pos || !(pos.row in dataArray)) {
        return;
    }

    let newDataArray = dataArray.slice(),
        newPosition = Object.assign({}, pos);

    newDataArray[pos.row] = newDataArray[pos.row].slice(0, pos.col - 1) + newDataArray[pos.row].slice(pos.col);
    newPosition.left -= CharSize.calculateStringWidth(dataArray[pos.row].slice(pos.col - 1, pos.col), editorEl);

    return {newDataArray, newPosition};

}

function deleteSelection(dataArray, start, stop) {

    if (!dataArray || !start || !stop || !(start.row in dataArray) || !(stop.row in dataArray)) {
        return;
    }

    let newDataArray = dataArray.slice();
    [start, stop] = sortPosition(start, stop);

    newDataArray[start.row] = dataArray[start.row].slice(0, start.col) + dataArray[stop.row].slice(stop.col);

    if (start.row !== stop.row) { // not in one line
        newDataArray.splice(start.row + 1, stop.row - start.row);
    }

    return {
        newDataArray,
        newPosition: sortPosition(start, stop)[0]
    };

}

function insertValue(dataArray, pos, value, lineHeight, editorEl) {

    if (!dataArray || !pos || !(pos.row in dataArray) || !value) {
        return;
    }

    let newDataArray = dataArray.slice(),
        newPosition = Object.assign({}, pos),
        temp = dataArray[pos.row].split('');

    temp.splice(pos.col, 0, value);
    newDataArray[pos.row] = temp.join('');

    const valueArray = value.split('\n');
    if (valueArray.length > 1) {
        newPosition.top += (valueArray.length - 1) * lineHeight;
        newPosition.left = CharSize.calculateStringWidth(valueArray[valueArray.length - 1], editorEl);
    } else {
        newPosition.left += CharSize.calculateStringWidth(value, editorEl);
    }

    return {
        newDataArray: newDataArray.join('\n').split('\n'),
        newPosition
    };

}

export default {
    calculateTextDisplayIndex,
    calculateCursorPosition,
    calculateCursorSelectionPosition,
    sortPosition,
    hasSelection,
    getSelectionValue,
    deleteLine,
    deleteChar,
    deleteSelection,
    insertValue
};