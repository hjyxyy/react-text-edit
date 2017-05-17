import React, {Component} from 'react';
import PropTypes from 'prop-types';

import TextInput from '../TextInput';
import ActiveLine from '../ActiveLine';
import TextSelection from '../TextSelection';
import TextContainer from '../TextContainer';
import EditorCursor from '../EditorCursor';

import Calculation from '../../utils/Calculation';

import './TextScroller.scss';

export default class TextScroller extends Component {

    constructor(props) {

        super(props);

        this.state = {
            compositionText: ''
        };

        this.compositionUpdateHandle = this::this.compositionUpdateHandle;

    }

    compositionUpdateHandle(compositionText) {
        this.setState({
            compositionText
        });
    }

    render() {

        const {isEditorFocused, editorDataArray, editorOptions, contentWidth, scrollTop, scrollLeft} = this.props,
            {compositionText} = this.state,
            {horizontalPadding, scrollBarWidth, lineHeight, showLineNumber, gutterWidth} = editorOptions,
            scrollerStyle = {
                width: contentWidth + horizontalPadding * 2 + scrollBarWidth + (showLineNumber ? gutterWidth : 0),
                height: editorDataArray.length * lineHeight,
                padding: `0 ${horizontalPadding + scrollBarWidth}px 0 ${horizontalPadding + (showLineNumber ? gutterWidth : 0)}px`,
                transform: `translate3d(${-scrollLeft}px, ${-scrollTop}px, 0)`
            },
            displayIndex = Calculation.textDisplayIndex(this.props),
            {selectStartPosition, selectStopPosition, cursorPosition} = Calculation.cursorSelectionPosition(this.props);

        console.log(contentWidth);

        return (
            <div className="react-editor-text-scroller"
                 style={scrollerStyle}>

                <TextInput {...this.props}
                           cursorPosition={cursorPosition}
                           selectStartPosition={selectStartPosition}
                           selectStopPosition={selectStopPosition}
                           onCompositionUpdate={this.compositionUpdateHandle}/>

                <ActiveLine {...this.props}
                            cursorPosition={cursorPosition}
                            selectStartPosition={selectStartPosition}
                            selectStopPosition={selectStopPosition}/>

                {
                    selectStartPosition && selectStopPosition ?
                        <TextSelection {...this.props}
                                       cursorPosition={cursorPosition}
                                       selectStartPosition={selectStartPosition}
                                       selectStopPosition={selectStopPosition}/>
                        :
                        null
                }

                <TextContainer {...this.props}
                               displayIndex={displayIndex}/>

                {
                    isEditorFocused ?
                        <EditorCursor {...this.props}
                                      compositionText={compositionText}
                                      cursorPosition={cursorPosition}/>
                        :
                        null
                }

            </div>
        );

    }
};

TextScroller.propTypes = {
    isEditorFocused: PropTypes.bool,
    editorDataArray: PropTypes.array,
    editorHeight: PropTypes.number,
    editorOptions: PropTypes.object,
    contentWidth: PropTypes.number,
    scrollTop: PropTypes.number,
    scrollLeft: PropTypes.number,
    selectStartX: PropTypes.number,
    selectStartY: PropTypes.number,
    selectStopX: PropTypes.number,
    selectStopY: PropTypes.number
};

TextScroller.defaultProps = {
    editorDataArray: [],
    editorHeight: 200,
    editorOptions: null,
    contentWidth: 0,
    scrollTop: 0,
    scrollLeft: 0,
    selectStartX: undefined,
    selectStartY: undefined,
    selectStopX: undefined,
    selectStopY: undefined
};