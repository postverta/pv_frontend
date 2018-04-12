import React, { Component } from 'react';
import request from 'superagent';
import PropTypes from 'prop-types';
import WorkspaceAccessWrapper from './WorkspaceAccessWrapper';

// This takes an app name and converts it to app ID and load the WorkspaceAccessWrapper.
// It is also responsible for updating the browser URL. The component must be the
// root component that is a direct child of react router's Route.
class WorkspaceContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      appId: null,
      appName: this.props.appName,
      appDescription: null
    };
  }

  getAppId(name) {
    var urlBase = process.env.REACT_APP_API_HTTP_SCHEME + "://" +
                   process.env.REACT_APP_API_HOST;
    var url = urlBase + "/name/" + name;
    var req = request.get(url);
    req.end((err, res) => {
      if (err) {
        console.error("API failure:", err);
      } else {
        this.setState({appId: res.body.id});
      }
    });
  }

  componentWillMount() {
    this.getAppId(this.props.appName);
  }

  componentDidMount() {
    // This is to make sure we have some sane title to start with.
    // Useful for GA to record the page title.
    this.updateDocumentTitle(this.state.appName, this.state.appDescription);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // HACK: we use this function to update browser state (title/URL). We cannot
    // do it at the render function, because we don't want to re-render the
    // component if only the title/URL needs to be updated.
    this.updateDocumentTitle(nextState.appName, nextState.appDescription);

    // Only allow the first rendering
    return (nextState.appId !== null && this.state.appId === null);
  }

  updateDocumentTitle(name, description) {
    var title = name;
    if (description !== null && description.length > 0) {
      title += ": ";
      title += description;
    }
    title += " - Postverta";
    document.title = title;
  }

  onUpdateAppName(newName) {
    this.props.history.replace("/app/" + newName);
    this.setState({appName: newName});
  }

  onUpdateAppDescription(newDescription) {
    this.setState({appDescription: newDescription});
  }

  render() {
    if (this.state.appId === null) {
      return (<div></div>);
    } else {
      return (<div style={{height: "100vh", weight: "100%"}}>
                <WorkspaceAccessWrapper lock={this.props.lock}
                                        accessToken={this.props.accessToken}
                                        user={this.props.user}
                                        history={this.props.history}
                                        appId={this.state.appId}
                                        onUpdateAppName={this.onUpdateAppName.bind(this)}
                                        onUpdateAppDescription={this.onUpdateAppDescription.bind(this)}
                                        onUpdateAppRunning={null}/>
              </div>);
    }
  }
}

WorkspaceContainer.propTypes = {
  lock: PropTypes.object.isRequired,
  user: PropTypes.object,
  history: PropTypes.object.isRequired,
  accessToken: PropTypes.string,
  appName: PropTypes.string.isRequired
}

export default WorkspaceContainer;
