import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workspace from './Workspace';
import ApiClient from './ApiClient';

// This is a wrapper of the actual workspace to check access to the
// app and choose the right mode.
class WorkspaceAccessWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiClient: null,
      viewerMode: null
    };
  }

  loadApp(apiClient) {
    apiClient.getAppAccess((result) => {
      if (result.mode === "viewer") {
        this.setState({
          viewerMode: true
        });
      } else {
        if (result.mode === "adopter") {
          // adopt the application
          apiClient.adoptApp(() => {});
        }
        this.setState({
          viewerMode: false
        });
      }
    }, () => {
      // TOOD: better error handling
      window.location.replace("/");
    });
  }

  componentWillMount() {
    var apiClient = new ApiClient(this.props.appId,
                                  this.props.accessToken,
                                  this.props.lock.reSignIn.bind(this.props.lock));
    this.setState({
      apiClient: apiClient,
      viewerMode: null
    });
    this.loadApp(apiClient);
  }

  componentWillReceiveProps(nextProps) {
    var apiClient = new ApiClient(nextProps.appId,
                                  nextProps.accessToken,
                                  this.props.lock.reSignIn.bind(this.props.lock));
    this.setState({
      apiClient: apiClient,
      viewerMode: null
    });
    this.loadApp(apiClient);
  }

  render() {
    if (this.state.viewerMode === null || this.state.apiClient === null) {
      return (<div></div>);
    } else {
      return (<Workspace apiClient={this.state.apiClient}
                         lock={this.props.lock}
                         accessToken={this.props.accessToken}
                         user={this.props.user}
                         history={this.props.history}
                         viewerMode={this.state.viewerMode}
                         embedded={false}
                         onUpdateAppName={this.props.onUpdateAppName}
                         onUpdateAppDescription={this.props.onUpdateAppDescription}/>);
    }
  }
}

WorkspaceAccessWrapper.propTypes = {
  lock: PropTypes.object.isRequired,
  user: PropTypes.object,
  history: PropTypes.object.isRequired,
  accessToken: PropTypes.string,
  appId: PropTypes.string.isRequired,
  onUpdateAppName: PropTypes.func
}

export default WorkspaceAccessWrapper;
