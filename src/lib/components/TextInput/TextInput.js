import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Command from '../../utils/Command';
import Calculation from '../../utils/Calculation';
import Valid from '../../utils/Valid';

import './TextInput.css';

export default class TextInput extends Component {

    constructor(props) {

        super(props);

        this.state = {
            isComposition: false
        };

        this.focus = this::this.focus;
        this.getTextAreaValue = this::this.getTextAreaValue;
        this.doChange = this::this.doChange;
        this.doSelectAll = this::this.doSelectAll;
        this.doSelectText = this::this.doSelectText;
        this.blurHandle = this::this.blurHandle;
        this.changeHandle = this::this.changeHandle;
        this.directionKeyHandle = this::this.directionKeyHandle;
        this.keyDownHandle = this::this.keyDownHandle;
        this.compositionHandle = this::this.compositionHandle;

    }

    /**
     * focus the textarea async
     * @param props
     */
    focus(props = this.props) {

        if (!props.isEditorFocused) {
            return;
        }

        const textInput = this.refs.textInput;

        setTimeout(() => {
            textInput.focus();
            textInput.setSelectionRange(0, textInput.value.length);
        }, 0);

    }

    getTextAreaValue(props = this.props) {
        return Calculation.getSelectionValue(props);
    }

    /**
     * update editor text data and pop
     * @param result
     */
    doChange(result) {

        if (!result) {
            return;
        }

        const {newDataArray, newPosition} = result;

        this.props.onChange(newDataArray, null, newPosition, newPosition);
        this.focus();

    }

    doSelectAll() {

        const {editorDataArray, cursorPosition, onChange} = this.props,
            {newStartPosition, newStopPosition} = Command.doSelectAll(this.props);

        onChange(editorDataArray, newStartPosition, newStopPosition, cursorPosition);

        this.focus();

    }

    doSelectText(colOffset, rowOffset) {

        const {editorDataArray, selectStartPosition, selectStopPosition, onChange} = this.props;

        const newPosition = Calculation.directionChange(rowOffset, colOffset, this.props);

        if (!newPosition) {
            return;
        }

        onChange(editorDataArray, selectStartPosition || selectStopPosition, newPosition, newPosition);
        this.focus();

    }

    blurHandle() {
        this.props.lostFocusHandle();
    }

    /**
     * textarea change event handle
     * @param e
     */
    changeHandle(e, isCompositionEnd) {

        const value = e.target.value;

        if (this.state.isComposition) {
            this.props.onCompositionUpdate(value);
            return;
        }

        if (value === '') {
            if (!isCompositionEnd) {
                this.doChange(Command.doCut(this.props)); // cut
            }
        } else {
            this.doChange(Command.doInput(value, this.props)); // input or paste
        }

    }

    /**
     * direction key (up, down, left, right) click handle
     * @param colOffset
     * @param rowOffset
     */
    directionKeyHandle(colOffset, rowOffset) {

        const {editorDataArray} = this.props;

        const newPosition = Calculation.directionChange(rowOffset, colOffset, this.props);

        if (!newPosition) {
            return;
        }

        this.doChange({
            newDataArray: editorDataArray,
            newPosition
        });

    }

    /**
     * textarea keydown event handle
     * @param e
     */
    keyDownHandle(e) {

        // console.log(e.keyCode);

        if (this.state.isComposition) {
            return;
        }

        switch (e.keyCode) {

            // back space
            case 8: {
                e.preventDefault();
                this.doChange(Command.doDelete(this.props));
                break;
            }

            // tab
            case 9: {
                e.preventDefault();
                this.doChange(Command.doInput('    ', this.props)); // input 4 space
                break;
            }

            // direction
            case 37: { // left
                if (e.shiftKey) {
                    this.doSelectText(-1, 0);
                } else {
                    this.directionKeyHandle(-1, 0);
                }
                break;
            }
            case 38: { // up
                if (e.shiftKey) {
                    this.doSelectText(0, -1);
                } else {
                    this.directionKeyHandle(0, -1);
                }
                break;
            }
            case 39: { // right
                if (e.shiftKey) {
                    this.doSelectText(1, 0);
                } else {
                    this.directionKeyHandle(1, 0);
                }
                break;
            }
            case 40: { // down
                if (e.shiftKey) {
                    this.doSelectText(0, 1);
                } else {
                    this.directionKeyHandle(0, 1);
                }
                break;
            }

            // a
            case 65: {
                if ((Valid.isMac() && e.metaKey) || (Valid.isWindows() && e.ctrlKey)) {
                    e.preventDefault();
                    this.doSelectAll(); // select all
                }
                break;
            }

            // z
            case 90: {
                if ((Valid.isMac() && e.metaKey) || (Valid.isWindows() && e.ctrlKey)) {
                    e.preventDefault();
                    this.props.goHistory(e.shiftKey ? 1 : -1); // undo or redo
                }
                break;
            }

        }

    }

    /**
     * textarea composition event handle
     * @param e
     */
    compositionHandle(e) {

        e.persist();

        switch (e.type) {
            case 'compositionstart': {

                this.setState({
                    isComposition: true
                });

                break;

            }
            case 'compositionend': {

                this.setState({
                    isComposition: false
                }, () => {

                    // chrome cannot trigger change event when composition end
                    // so trigger change event manually here
                    Valid.isChrome() && this.changeHandle(e, true);

                    this.props.onCompositionUpdate('');

                });

                break;

            }
        }

    }

    componentDidMount() {

        // initial text input value
        this.refs.textInput.value = this.getTextAreaValue();

        // focus at the begin
        this.focus();

    }

    componentWillReceiveProps(nextProps) {

        setTimeout(() => {

            if (!this.state.isComposition) {
                this.refs.textInput.value = this.getTextAreaValue(nextProps);
            }

            this.focus(nextProps);

        }, 0);

    }

    componentDidUpdate(prevProps) {
        this.focus(prevProps);
    }

    render() {

        const {editorOptions, cursorPosition, compositionText} = this.props,
            {isComposition} = this.state,
            style = {
                height: editorOptions.lineHeight,
                lineHeight: `${editorOptions.lineHeight * 1.1}px`,
                transform: `translate3d(${cursorPosition.left}px, ${cursorPosition.top}px, 0)`
            };

        return (
            <div className="react-editor-text-input-wrapper">

                {
                    isComposition ?
                        <div ref="textDisplay"
                             className="react-editor-text-display"
                             style={style}>
                            {compositionText}
                        </div>
                        :
                        null
                }

                <textarea ref="textInput"
                          className="react-editor-text-input"
                          style={style}
                          onBlur={this.blurHandle}
                          onChange={this.changeHandle}
                          onKeyDown={this.keyDownHandle}
                          onCompositionStart={this.compositionHandle}
                          onCompositionUpdate={this.compositionHandle}
                          onCompositionEnd={this.compositionHandle}></textarea>

            </div>
        );

    }
};

TextInput.propTypes = {

    editorEl: PropTypes.object,
    editorOptions: PropTypes.object,
    isEditorFocused: PropTypes.bool,
    editorDataArray: PropTypes.array,
    cursorPosition: PropTypes.object,
    selectStartPosition: PropTypes.object,
    selectStopPosition: PropTypes.object,

    compositionText: PropTypes.string,

    onChange: PropTypes.func,
    onCompositionUpdate: PropTypes.func

};

TextInput.defaultProps = {

    editorEl: null,
    editorOptions: null,
    editorDataArray: [],
    cursorPosition: null,
    selectStartPosition: null,
    selectStopPosition: null,

    compositionText: ''

};