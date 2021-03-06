import React, {Component} from 'react';

import ReactTextEdit from 'dist';

import README from 'README.md';

import 'assets/sass/SpecifiedSizeEditor.scss';

export default class SpecifiedSizeEditor extends Component {

    constructor(props) {

        super(props);

        this.state = {
            data1: README,
            data2: README
        };

        this.changeHandle = this::this.changeHandle;

    }

    changeHandle(index, data) {
        this.setState({
            [`data${index}`]: data
        });
    }

    render() {

        const {data1, data2} = this.state;

        return (
            <div className="specified-size-editor-wrapper">

                <div className="example">
                    <h1>Specified Size (500 × 200)</h1>
                    <ReactTextEdit className="specified-size-editor"
                                 data={data1}
                                 width={500}
                                 height={200}
                                 onChange={(data) => {
                                     this.changeHandle(1, data);
                                 }}/>
                </div>

                <div className="example">
                    <h1>Specified Size (800 × 400)</h1>
                    <ReactTextEdit className="specified-size-editor"
                                 data={data2}
                                 width={800}
                                 height={400}
                                 onChange={(data) => {
                                     this.changeHandle(2, data);
                                 }}/>
                </div>

            </div>
        );
    }
}