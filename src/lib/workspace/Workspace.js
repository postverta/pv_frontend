import onVisibilityChange from 'visibility-change-ponyfill';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FileList from './FileList';
import MainViewer from './MainViewer';
import LogViewer from './LogViewer';
import MenuBar from './MenuBar';
import ApiClient from './ApiClient';
//import MockApiClient from './MockApiClient';
import './Workspace.css'

class Workspace extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logViewerVisibility: false,
      fileSelected: null,
      isMarkdown: false,
      logGeneration: 0,
      sourceTimestamp: 0,
    }

    this.leftBarDom = null;
    this.leftBarDragStartX = null;
    this.leftBarDragStartWidth = null;
    this.leftBarDragStarted = false;

    this.logDom = null;
    this.logDragStartY = null;
    this.logDragStartHeight = null;
    this.logDragStarted = false;
    this.logPrevHeight = null;
    this.logHeight = 300; // default value

    // Manage the keep-alive timer
    this.aliveTimer = null;

    this.visibilityChangeCallback = (() => {
      if (document.hidden) {
        this.stopAliveTimer();
      } else {
        // issue a quick keep alive call to detect whether the connection is
        // down already
        this.props.apiClient.keepAlive();
        this.startAliveTimer();
      }
    }).bind(this);
  }

  componentDidMount() {
    this.props.apiClient.getAppState((app) => {
      this.onSourceTimestampUpdated(app.source_timestamp);

      if (window.analytics !== undefined) {
        window.analytics.track("app - load app", {
          app_id: app.id,
          app_name: app.name,
          viewer_mode: this.props.viewerMode
        });
      }
    });

    onVisibilityChange(this.visibilityChangeCallback);
    this.startAliveTimer();
  }

  componentDidUpdate(prevProps) {
    // TODO?
  }

  componentWillUnmount() {
    this.stopAliveTimer();
    onVisibilityChange.remove(this.visibilityChangeCallback);
  }

  startAliveTimer() {
    this.aliveTimer = setInterval(() => {
      this.props.apiClient.keepAlive();
    }, 10000);
  }

  stopAliveTimer() {
    if (this.aliveTimer !== null) {
      clearInterval(this.aliveTimer);
      this.aliveTimer = null;
    }
  }

  onSourceTimestampUpdated(timestamp) {
    this.setState({sourceTimestamp: timestamp});
  }

  onLogUpdated() {
    this.setState({logGeneration: this.state["logGeneration"] + 1});
  }

  toggleLogViewVisibility() {
    if (window.analytics !== undefined) {
      if (this.state.logViewerVisibility) {
        window.analytics.track("app - close console");
      } else {
        window.analytics.track("app - open console");
      }
    }

    this.setState({logViewerVisibility: !this.state["logViewerVisibility"]});
  }

  onMouseMove(evt) {
    var delta;
    if (this.leftBarDragStarted) {
      delta = evt.screenX - this.leftBarDragStartX;
      var newWidth = this.leftBarDragStartWidth + delta;
      this.leftBarDom.style.width = newWidth + "px";
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (this.logDragStarted) {
      delta = evt.screenY - this.logDragStartY;
      var newHeight = this.logDragStartHeight - delta;
      this.logDom.style.height = newHeight + "px";
      // need to keep the height in order to recover it after log viewer visibility change
      this.logHeight = newHeight;
      evt.preventDefault();
      evt.stopPropagation();
    }
  }

  onDragLeftBarStart(evt) {
    this.leftBarDragStartX = evt.screenX;
    this.leftBarDragStartWidth = this.leftBarDom.offsetWidth;
    this.leftBarDragStarted = true;
    evt.stopPropagation();
  }

  onDragLeftBarEnd(evt) {
    this.leftBarDragStartX = null;
    this.leftBarDragStartWidth = null;
    this.leftBarDragStarted = false;
    evt.stopPropagation();
  }

  onDragLogStart(evt) {
    this.logDragStartY = evt.screenY;
    this.logDragStartHeight = this.logDom.offsetHeight;
    this.logDragStarted = true;
    evt.stopPropagation();
  }

  onDragLogEnd(evt) {
    this.logDragStartY = null;
    this.logDragStartHeight = null;
    this.logDragStarted = false;
    evt.stopPropagation();
  }

  render() {
    return (
      <div className="pv-workspace" onMouseMove={this.onMouseMove.bind(this)}>
        <MenuBar apiClient={this.props.apiClient}
         onToggleLog={this.toggleLogViewVisibility.bind(this)}
         onUpdateAppName={this.props.onUpdateAppName}
         onUpdateAppDescription={this.props.onUpdateAppDescription}
         onUpdateAppRunning={this.props.onUpdateAppRunning}
         logOpened={this.state["logViewerVisibility"]}
         logGeneration={this.state["logGeneration"]}
         sourceTimestamp={this.state["sourceTimestamp"]}
         lock={this.props.lock} accessToken={this.props.accessToken}
         user={this.props.user} history={this.props.history}
         viewerMode={this.props.viewerMode} embedded={this.props.embedded}
        />
        <div className="pv-body">
          <div className="pv-leftbar pt-dark" ref={(dom) => {this.leftBarDom = dom;}}>
            <FileList apiClient={this.props.apiClient}
             viewerMode={this.props.viewerMode} embedded={this.props.embedded} user={this.props.user}
             onSelection={(selected) => {this.setState({fileSelected:selected})}}
             onSourceTimestampUpdated={this.onSourceTimestampUpdated.bind(this)}/>
          </div>
          <div className="pv-leftbar-resizer" draggable="false"
           onMouseDown={this.onDragLeftBarStart.bind(this)}
           onMouseUp={this.onDragLeftBarEnd.bind(this)}></div>
          <div className="pv-main pt-dark">
            {!this.props.accessToken && !this.props.viewerMode && !this.props.embedded &&
             (<div className="pt-callout pt-intent-warning pt-icon-info-sign pv-main-callout">
              Please <a href=""
                 onClick={(evt) => {this.props.lock.signIn(); evt.preventDefault();}}>
                 sign in
              </a> to keep track of your work. You can resume working on
                 your app at any time from any place!</div>)}
            <div className="pv-main-viewer">
              <MainViewer apiClient={this.props.apiClient}
              user={this.props.user}
              filePath={this.state["fileSelected"]}
              viewerMode={this.props.viewerMode}
              onSourceTimestampUpdated={this.onSourceTimestampUpdated.bind(this)}/>
            </div>
          </div>
        </div>
        {!this.props.viewerMode &&
          (<div className="pv-log-container">
            <div className="pv-log-resizer" style={{display: this.state["logViewerVisibility"] ? "block" : "none"}}
             onMouseDown={this.onDragLogStart.bind(this)}
             onMouseUp={this.onDragLogEnd.bind(this)}></div>
            <div className="pv-log pt-dark" ref={(dom) => {this.logDom = dom;}}
             style={{display: this.state["logViewerVisibility"] ? "block" : "none", height: this.logHeight + "px"}}>
              <LogViewer apiClient={this.props.apiClient}
               onLogUpdated={this.onLogUpdated.bind(this)}
               onClose={this.toggleLogViewVisibility.bind(this)}/>
            </div>
          </div>)}
      </div>
    );
  }
}

Workspace.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  lock: PropTypes.object,
  accessToken: PropTypes.string,
  user: PropTypes.object,
  history: PropTypes.object,
  viewerMode: PropTypes.bool.isRequired,
  embedded: PropTypes.bool.isRequired,
  onUpdateAppName: PropTypes.func,
  onUpdateAppDescription: PropTypes.func,
  onUpdateAppRunning: PropTypes.func,
}

export default Workspace;
