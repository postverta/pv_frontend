import React, { Component } from 'react';
import Workspace from './Workspace';
import ApiClient from './ApiClient';
import PropTypes from 'prop-types';

// This is to embed workspace in another react page. It takes an app ID and the embed mode
// ("clone" or "display"), and decide how to render the workspace.
class WorkspaceEmbedded extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiClient: null,
    };
  }

  componentWillMount() {
    var apiClient = new ApiClient(this.props.appId,
                                  null, null);
    this.setState({
      apiClient: apiClient,
    });
  }

  componentWillReceiveProps(nextProps) {
    var apiClient = new ApiClient(nextProps.appId, null, null);

    this.setState({
      apiClient: apiClient,
    });
  }

  render() {
    if (this.state.apiClient === null) {
      return (<div></div>); // This really shouldn't happen, but just to be safe
    } else {
      return (<Workspace apiClient={this.state.apiClient}
                        lock={null}
                        accessToken={null}
                        user={null}
                        history={null}
                        viewerMode={this.props.embedMode === "display"}
                        embedded={true}
                        onUpdateAppName={null}
                        onUpdateAppDescription={null}
                        onUpdateAppRunning={this.props.onUpdateAppRunning}/>);
    }
  }
}

WorkspaceEmbedded.propTypes = {
  appId: PropTypes.string.isRequired,
  embedMode: PropTypes.string.isRequired,
  onUpdateAppRunning: PropTypes.func.isRequired,
}

export default WorkspaceEmbedded;
