import React, {Component} from 'react';

import ReactEditor from 'src/ReactEditor';

import MacDownHelpText from 'assets/files/MacDownHelp.txt';

export default class FullScreenEditor extends Component {

    constructor(props) {

        super(props);

        this.state = {
            data: ''
        };

        this.changeHandle = this::this.changeHandle;

    }

    changeHandle(data) {
        this.setState({
            data
        });
    }

    render() {
        return (
            <ReactEditor className="full-screen-editor"
                         data={this.state.data}
                         isFullScreen={true}
                         onChange={this.changeHandle}/>
        );
    }
}