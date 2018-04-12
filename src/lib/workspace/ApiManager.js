/*global CodeMirror*/
import React, { Component } from 'react';
import ApiClient from './ApiClient';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Button, AnchorButton, Intent, Switch, Dialog } from '@blueprintjs/core';
import './ApiManager.css'

class ApiBlock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      enabled: this.props.api.enabled,
      snippetOpened: false
    }

    this.cmEditor = null;
  }

  onEditorRef(element) {
    if (element !== null && this.cmEditor === null) {
      // initialize CodeMirror
      this.cmEditor = CodeMirror.fromTextArea(element, {
        lineNumbers: true,
        fixedGutter: true,
        mode: "javascript",
        readOnly: true
      });
    } else {
      this.cmEditor = null;
    }
  }

  onEnable(enabled) {
    this.setState({busy: true});
    if (enabled) {
      this.props.apiClient.enableApi(this.props.api.id, (app) => {
        this.props.onSourceTimestampUpdated(app.source_timestamp);
        this.setState({
          busy: false,
          enabled: enabled
        });
      });
    } else {
      this.props.apiClient.disableApi(this.props.api.id, (app) => {
        this.props.onSourceTimestampUpdated(app.source_timestamp);
        this.setState({
          busy: false,
          enabled: enabled
        });
      });
    }
  }

  toggleSnippet() {
    this.setState({snippetOpened: !this.state.snippetOpened});
  }

  render() {
    return (
      <div className="pt-card pv-apimanager-apiblock">
        <img className="pv-apimanager-apiblock-logo" src={this.props.api.logo_url}/>
        <div className="pv-apimanager-apiblock-nameblock">
          <h4 className="pv-apimanager-apiblock-name">{this.props.api.name}</h4>
          <Switch className="pv-apimanager-apiblock-switch pt-large" checked={this.state.enabled}
                  disabled={this.state.busy || this.props.viewerMode}
                  onChange={(evt) => {this.onEnable(evt.target.checked)}}/>
        </div>
        <div className="pv-apimanager-apiblock-button-container">
          <AnchorButton target="_blank" text="Portal" iconName="share" href={this.props.api.portal_url}/>
          <Button text="Code" iconName="code" onClick={this.toggleSnippet.bind(this)}/>
        </div>
        <Dialog className="pv-apimanager-apiblock-codedialog"
                iconName="code" isOpen={this.state.snippetOpened}
                onClose={this.toggleSnippet.bind(this)}
                title="Example Code">
          <div className="pt-dialog-body">
            <textarea ref={this.onEditorRef.bind(this)}>
              {this.props.api.snippet}
            </textarea>
          </div>
          <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
              <CopyToClipboard text={this.props.api.snippet}>
                <Button text="Copy to clipboard" iconName="clipboard"/>
              </CopyToClipboard>
              <Button text="Close" intent={Intent.PRIMARY} onClick={this.toggleSnippet.bind(this)}/>
            </div>
          </div>
        </Dialog>
      </div>
    )
  }
}

ApiBlock.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  api: PropTypes.object.isRequired,
  viewerMode: PropTypes.bool.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

class ApiManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apis: []
    };
  }

  componentDidMount() {
    this.onLoadApis();
  }

  onLoadApis() {
    this.props.apiClient.getApis((apis) => {
      this.setState({apis: apis});
    });
  }

  render() {
    var apis = this.state.apis.map((api) => {
      return (
        <ApiBlock key={api.id} apiClient={this.props.apiClient} api={api}
                  viewerMode={this.props.viewerMode}
                  onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>
      );
    });

    return (
      <div className="pv-apimanager pt-dark">
        {apis}
      </div>
    );
  }
}

ApiManager.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  viewerMode: PropTypes.bool.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

export default ApiManager;
