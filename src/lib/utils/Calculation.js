import CharSize from './CharSize';
import Valid from './Valid';

function horizontalDisplayWidth(props) {
    const {editorWidth, editorOptions, gutterWidth} = props,
        {scrollBarWidth, horizontalPadding, showLineNumber} = editorOptions;
    return editorWidth - scrollBarWidth - horizontalPadding * 2 - (showLineNumber ? gutterWidth : 0);
}

function fullScrollLeft(props) {
    return props.contentWidth - horizontalDisplayWidth(props);
}

function scrollLeftPerCent(scrollLeft, props) {
    const {contentWidth} = props,
        displayWidth = horizontalDisplayWidth(props),
        fullWidth = fullScrollLeft(props);
    return contentWidth > displayWidth ? scrollLeft / fullWidth : 1;
}

function fullScrollTop(props) {
    const {editorDataArray, editorOptions} = props;
    return (editorDataArray.length - 1) * editorOptions.lineHeight;
}

function scrollTopPerCent(scrollTop, props) {
    const {contentHeight, editorOptions} = props,
        fullHeight = fullScrollTop(props);
    return contentHeight > editorOptions.lineHeight ? scrollTop / fullHeight : 1;
}

function textDisplayIndex({editorDataArray, scrollTop, editorOptions, editorHeight}) {

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

function cursorPosition(x, y, {editorEl, editorDataArray, editorOptions}) {

    if (isNaN(x) || isNaN(y)) {
        return;
    }

    const len = editorDataArray.length,
        offsetTop = Valid.range(y, 0),
        row = Math.round((offsetTop / editorOptions.lineHeight) - .5);

    if (row >= len) { // mouse down blow text content

        const string = editorDataArray[len - 1];

        return {
            left: CharSize.calculateStringWidth(string, editorEl),
            top: (len - 1) * editorOptions.lineHeight,
            row: len - 1,
            col: string.length
        };

    } else { // mouse down in text content

        const top = row * editorOptions.lineHeight,
            {left, col} = CharSize.calculateCursorPosition(editorDataArray[row], x, editorEl);

        return {
            left,
            top,
            row,
            col
        };

    }

}

function cursorSelectionPosition(selectStartX, selectStartY, selectStopX, selectStopY, props) {

    const {
            editorEl, editorDataArray, editorOptions, contentWidth, isDoubleClick, isTripleClick, gutterWidth
        } = props,
        {horizontalPadding, scrollBarWidth, lineHeight, discontinuousChars, showLineNumber} = editorOptions,
        finalGutterWidth = showLineNumber ? gutterWidth : 0,
        finalSelectStartX = selectStartX ? selectStartX - horizontalPadding - finalGutterWidth : selectStartX,
        finalSelectStopX = selectStopX ? selectStopX - horizontalPadding - finalGutterWidth : selectStopX;

    let selectStartPosition, selectStopPosition, position;

    if (isTripleClick) {

        position = cursorPosition(finalSelectStopX, selectStopY, props);

        selectStopPosition = Object.assign({}, position);
        selectStopPosition.left = 0;
        selectStopPosition.col = 0;

        selectStartPosition = Object.assign({}, position);
        if (selectStartPosition.row === editorDataArray.length - 1) { // last line
            selectStartPosition.left = contentWidth + horizontalPadding + scrollBarWidth;
            selectStartPosition.col = editorDataArray[position.row].length;
        } else {
            selectStartPosition.left = 0;
            selectStartPosition.col = 0;
            selectStartPosition.top += lineHeight;
            selectStartPosition.row += 1;
        }

    } else if (isDoubleClick) {

        position = cursorPosition(finalSelectStopX, selectStopY, props);

        const string = editorDataArray[position.row];

        if (string.length > 0) {

            let tempCol, tempchar, tempStartChars = [], tempStopChars = [];

            // calculate start position
            selectStartPosition = Object.assign({}, position);
            tempCol = position.col;
            if (tempCol > 0) {
                do {

                    tempchar = string.at(tempCol - 1);

                    if (!discontinuousChars.includes(tempchar)) {
                        tempStartChars.push(tempchar);
                    } else {
                        break;
                    }

                    tempCol--;

                } while (tempCol > 0);
                if (tempStartChars.length > 0) {
                    selectStartPosition.left -= CharSize.calculateStringWidth(tempStartChars.join(''), editorEl);
                    selectStartPosition.col -= tempStartChars.length;
                }
            }

            // calculate stop position
            selectStopPosition = Object.assign({}, position);
            tempCol = position.col;
            if (tempCol < string.length) {
                do {

                    tempchar = string.at(tempCol);

                    if (!discontinuousChars.includes(tempchar)) {
                        tempStopChars.push(tempchar);
                    } else {
                        break;
                    }

                    tempCol++;

                } while (tempCol < string.length);
                if (tempStopChars.length > 0) {
                    selectStopPosition.left += CharSize.calculateStringWidth(tempStopChars.join(''), editorEl);
                    selectStopPosition.col += tempStopChars.length;
                }
            }

            if (tempStartChars.length === 0 && tempStopChars.length === 0) {

                tempCol = position.col;
                tempchar = undefined;

                if (tempCol < string.length) {

                    tempchar = string.at(tempCol);

                    if (discontinuousChars.includes(tempchar)) {
                        selectStopPosition.left += CharSize.calculateCharWidth(tempchar, editorEl);
                        selectStopPosition.col += 1;
                    }

                }

                if (tempchar === undefined && tempCol > 0) {

                    tempchar = string.at(tempCol - 1);

                    if (discontinuousChars.includes(tempchar)) {
                        selectStartPosition.left -= CharSize.calculateCharWidth(tempchar, editorEl);
                        selectStartPosition.col -= 1;
                    }

                }

            }

            position = Object.assign({}, selectStopPosition);

        } else {
            selectStartPosition = Object.assign({}, position);
            selectStopPosition = Object.assign({}, position);
        }

    } else {

        selectStartPosition = cursorPosition(finalSelectStartX, selectStartY, props);
        selectStopPosition = cursorPosition(finalSelectStopX, selectStopY, props);
        position = Object.assign({}, selectStopPosition);

    }

    return {selectStartPosition, selectStopPosition, cursorPosition: position};

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

function getSelectionValue({editorDataArray, selectStartPosition, selectStopPosition}) {

    if (!editorDataArray || !selectStopPosition) {
        return '';
    }

    let [start, stop] = sortPosition(selectStartPosition, selectStopPosition);

    if (hasSelection(start, stop)) {

        if (start.row === stop.row) { // in one line
            return editorDataArray[start.row].slice(start.col, stop.col);
        } else {

            let result = [];

            result.push(editorDataArray[start.row].slice(start.col));
            for (let i = start.row + 1; i < stop.row; i++) {
                result.push(editorDataArray[i]);
            }
            result.push(editorDataArray[stop.row].slice(0, stop.col));

            return result.join('\n');

        }

    } else {
        return editorDataArray[stop.row] + '\n';
    }

    return '';

}

function deleteLine(dataArray, pos, lineHeight, editorEl) {

    if (!dataArray || !pos || !(pos.row in dataArray) || !lineHeight) {
        return;
    }

    let newDataArray = dataArray.slice(),
        newPosition = Object.assign({}, pos),
        lastLine = dataArray[pos.row - 1];

    newPosition.left = CharSize.calculateStringWidth(lastLine, editorEl);
    newPosition.top -= lineHeight;
    newPosition.row -= 1;
    newPosition.col = lastLine.length;

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

    newDataArray[pos.row] = dataArray[pos.row].slice(0, pos.col - 1) + dataArray[pos.row].slice(pos.col);
    newPosition.left -= CharSize.calculateStringWidth(dataArray[pos.row].at(pos.col - 1), editorEl);
    newPosition.col -= 1;

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
        newPosition: start
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

    const valueArray = value.split('\n'),
        len = valueArray.length,
        lastLine = valueArray[valueArray.length - 1];

    if (len > 1) {
        newPosition.top += (valueArray.length - 1) * lineHeight;
        newPosition.left = CharSize.calculateStringWidth(lastLine, editorEl);
        newPosition.col = lastLine.length;
    } else {
        newPosition.left += CharSize.calculateStringWidth(value, editorEl);
        newPosition.col += value.length;
    }
    newPosition.row += len - 1;

    return {
        newDataArray: newDataArray.join('\n').split('\n'),
        newPosition
    };

}

function directionChange(rowOffset, colOffset, props) {

    if (isNaN(rowOffset) || isNaN(colOffset)) {
        return;
    }

    const {editorEl, editorDataArray, editorOptions, cursorPosition} = props,
        {lineHeight} = editorOptions,
        lastLineIndex = editorDataArray.length - 1,
        lastLine = editorDataArray[lastLineIndex],
        lastLineLength = lastLine.length;

    let {left, top, row, col} = cursorPosition;

    if ((row === 0 && col === 0 && (rowOffset < 0 || colOffset < 0))
        || (row === lastLineIndex && col === lastLineLength && (rowOffset > 0 || colOffset > 0))) {
        return;
    }

    if (rowOffset !== 0) {

        row += rowOffset;

        if (row < 0) {

            row = 0;
            left = 0;
            col = 0;

        } else if (row > lastLineIndex) {

            row = lastLineIndex;

            const line = editorDataArray[row];

            left = CharSize.calculateStringWidth(line, editorEl);
            col = line.length;

        } else {
            top = Valid.range(top + lineHeight * rowOffset, 0, lastLineIndex * lineHeight);
            left = CharSize.calculateStringWidth(editorDataArray[row].slice(0, col), editorEl);
        }

    }

    if (colOffset !== 0) {

        col += colOffset;
        const currentLine = editorDataArray[row],
            currentLineLength = currentLine.length;

        if (col < 0) {

            let offset = col, line;
            while (offset < 0) {

                if (row === 0) {
                    return {
                        left: 0,
                        top: 0,
                        row: 0,
                        col: 0
                    };
                }

                row--;
                top -= lineHeight;
                offset++;
                line = editorDataArray[row];

                if (-offset > line.length) {
                    offset += line.length;
                } else {
                    return {
                        left: CharSize.calculateStringWidth(line.slice(0, col), editorEl),
                        top,
                        row,
                        col: offset + line.length
                    };
                }

            }

        } else if (col > currentLineLength) {

            let offset = col - currentLineLength, line;
            while (offset > 0) {

                if (row === lastLineIndex) {
                    return {
                        left: CharSize.calculateStringWidth(lastLine, editorEl),
                        top: lastLineIndex * lineHeight,
                        row: lastLineIndex,
                        col: lastLineLength
                    };
                }

                row++;
                top += lineHeight;
                offset--;
                line = editorDataArray[row];

                if (offset > line.length) {
                    offset -= line.length;
                } else {
                    return {
                        left: CharSize.calculateStringWidth(line.slice(0, col), editorEl),
                        top,
                        row,
                        col: offset
                    };
                }

            }

        } else {
            left = CharSize.calculateStringWidth(currentLine.slice(0, col), editorEl);
        }

    }

    return {left, top, row, col};

}

function scrollOnChange(props) {

    const {editorEl, editorDataArray, editorHeight, editorOptions, cursorPosition} = props,
        {left, top, row, col} = cursorPosition,
        {lineHeight} = editorOptions;
    let {scrollLeft, scrollTop} = props;

    // top
    if (top - scrollTop < lineHeight) {
        scrollTop = Valid.range(top - lineHeight, 0, fullScrollTop(props));
    }

    // bottom
    if (editorHeight - (top - scrollTop + lineHeight) < lineHeight) {
        scrollTop = lineHeight * 2 - editorHeight + top;
    }

    // left
    if (left < scrollLeft) {
        const line = editorDataArray[row],
            start = Valid.range(col - 4, 0),
            string = line.slice(start, col),
            width = CharSize.calculateStringWidth(string, editorEl);
        scrollLeft = left - width;
    }

    // right
    const fullWidth = horizontalDisplayWidth(props);
    if (left > fullWidth + scrollLeft) {
        const line = editorDataArray[row],
            stop = Valid.range(col + 4, 0, line.length),
            string = line.slice(col, stop),
            width = CharSize.calculateStringWidth(string, editorEl);
        scrollLeft = left + width - fullWidth;
    }

    return {
        scrollLeft,
        scrollTop
    };

}

export default {
    horizontalDisplayWidth,
    fullScrollLeft,
    scrollLeftPerCent,
    fullScrollTop,
    scrollTopPerCent,
    textDisplayIndex,
    cursorPosition,
    cursorSelectionPosition,
    sortPosition,
    hasSelection,
    getSelectionValue,
    deleteLine,
    deleteChar,
    deleteSelection,
    insertValue,
    directionChange,
    scrollOnChange
};