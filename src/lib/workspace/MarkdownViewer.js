import React, { Component } from 'react';
import Markdown from 'react-remarkable';
import { Button, Intent } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import Editor from './Editor';
import './MarkdownViewer.css'

class MarkdownViewer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.filePath !== nextProps.filePath) {
      this.setState({
        editMode: false
      });
    }
  }

  render() {
    return (
      <div className="pv-markdownviewer pt-dark">
        {!this.props.viewerMode &&
        (<div className="pv-markdownviewer-menubar">
          {this.state.editMode ?
           (<Button iconName="eye-open" intent={Intent.PRIMARY}
                    onClick={() => {this.setState({editMode: false})}}>
             View
            </Button>) :
           (<Button iconName="edit" intent={Intent.WARNING}
                    onClick={() => {this.setState({editMode: true})}}>
             Edit
            </Button>)}
          </div>
        )}
        {this.state.editMode ?
         (<Editor apiClient={this.props.apiClient}
                  filePath={this.props.filePath} data={this.props.data}
                  viewerMode={this.props.viewerMode}
                  onContentChange={this.props.onContentChange}
                  requestAutocompletion={this.props.requestAutocompletion}
                  requestResolve={this.props.requestResolve}
                  diagnostics={this.props.diagnostics}/>) :
         (<div className="pv-markdownviewer-markdown">
           <Markdown source={this.props.data} options={{html: true}}/>
         </div>)}
      </div>
    );
  }
}

MarkdownViewer.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  filePath: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired,
  diagnostics: PropTypes.array,
  viewerMode: PropTypes.bool.isRequired,
  onContentChange: PropTypes.func,
  requestAutocompletion: PropTypes.func,
  requestResolve: PropTypes.func
}

export default MarkdownViewer;
