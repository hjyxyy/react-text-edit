import React, {Component} from 'react';
import PropTypes from 'prop-types';

import CharSize from '../../utils/CharSize';

import './EditorCursor.scss';

export default class EditorCursor extends Component {

    constructor(props) {

        super(props);

        this.calculateCursorPosition = this::this.calculateCursorPosition;

    }

    calculateCursorPosition() {

        const {editorEl, compositionText, cursorPosition} = this.props;
        let left, top;

        if (cursorPosition) {
            ({left, top} = cursorPosition);
        } else {
            left = 0;
            top = 0;
        }

        if (compositionText) {
            left += CharSize.calculateStringWidth(compositionText, editorEl);
        }

        return {left, top};

    }

    render() {

        const {horizontalPadding, showLineNumber, gutterWidth} = this.props.editorOptions,
            {left, top} = this.calculateCursorPosition(),
            wrapperStyle = {
                left: horizontalPadding + (showLineNumber ? gutterWidth : 0)
            },
            cursorStyle = {
                transform: `translate3d(${left}px, ${top}px, 0)`
            };

        return (
            <div className="react-editor-cursor-wrapper"
                 style={wrapperStyle}>

                <div className="react-editor-cursor"
                     style={cursorStyle}></div>

            </div>
        );

    }
};

EditorCursor.propTypes = {

    editorEl: PropTypes.object,
    editorDataArray: PropTypes.array,
    editorOptions: PropTypes.object,
    scrollLeft: PropTypes.number,
    scrollTop: PropTypes.number,
    mouseDownPosition: PropTypes.object,

    compositionText: PropTypes.string,
    cursorPosition: PropTypes.object

};

EditorCursor.defaultProps = {

    editorEl: null,
    editorDataArray: [],
    editorOptions: null,
    scrollLeft: 0,
    scrollTop: 0,
    mouseDownPosition: null,

    compositionText: '',
    cursorPosition: null

};