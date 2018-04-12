import React, { Component } from 'react';
import { AnchorButton, Button, Intent, Popover, Menu,
         MenuItem, Position, Dialog } from '@blueprintjs/core';
import FileSaver from 'file-saver';
import CopyToClipboard from 'react-copy-to-clipboard';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import Initicon from 'react-initicon';
import LogoImg from './Logo.png';
import './MenuBar.css';

function getAppUrl(name) {
  return process.env.REACT_APP_APP_HTTP_SCHEME + "://" + name +
         process.env.REACT_APP_APP_SUFFIX;
}

class AppIcon extends Component {
  onImageChange(evt) {
    evt.preventDefault();
    if (evt.target.files.length === 0) {
      return;
    }

    var reader = new FileReader();
    var file = evt.target.files[0];
    reader.onloadend = () => {
      this.props.onUpdateAppIcon(reader.result, file);
    }

    reader.readAsDataURL(file);
  }

  render() {
    var iconDom = null;
    if (this.props.appIcon === "") {
      var text = this.props.appName.replace("-", " ").toUpperCase();
      var seed = this.props.appId.hashCode();
      iconDom = (<div><Initicon size={64} text={text} seed={seed}/></div>);
    } else {
      iconDom = (<img src={this.props.appIcon}/>);
    }

    return (
      <div className="pv-menubar-name-dropdown-icon">
        {iconDom}
        <label htmlFor="file-input">
        </label>
        <input id="file-input" type="file" accept="image/png, image/jpeg, image/x-icon, image/svg+xml"
               onChange={(evt)=>this.onImageChange(evt)}/>
      </div>
    );
  }
}

AppIcon.propTypes = {
  appId: PropTypes.string.isRequired,
  appName: PropTypes.string.isRequired,
  appIcon: PropTypes.string.isRequired,
  onUpdateAppIcon: PropTypes.func.isRequired
}

class AppSettingButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      newName: this.props.appName,
      nameError: false,
      nameErrorContent: "",
      newDescription: this.props.appDescription,
      newIcon: this.props.appIcon,
      newIconFile: null,
      deleteDialogIsOpen: false,
      deleting: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.appId !== this.props.appId) {
      // This is a new app, reset all state
      this.setState({
        newName: nextProps.appName,
        nameError: false,
        nameErrorContent: "",
        newDescription: nextProps.appDescription,
        deleteDialogIsOpen: false,
        deleting: false
      });
      return;
    }

    // Something has changed about the app's name. The logic is as follows:
    // - If there is an app name conflict, which means we are not just updating
    // the component to a new app name. Don't update newName, and update the error
    // state accordingly.
    // - If there is no app name conflict, the new appName property is the
    // groun truth. Update the local newName state accordingly, and disable error.
    if (nextProps.appNameConflict) {
      if (nextProps.appName !== this.state.newName) {
        this.setState({
          nameError: true,
          nameErrorContent: "The name has been used"
        });
      }

      // Also don't update the other fields, as we failed in updating the server state
      return;
    }

    this.setState({
      newName: nextProps.appName,
      nameError: false,
      nameErrorContent: "",
      newDescription: nextProps.appDescription,
      newIcon: nextProps.appIcon,
      newIconFile: null
    });
  }

  onUpdateApp() {
    var newName = null;
    if (this.props.appName !== this.state.newName) {
      // Check whether the name follows RFC1123
      if (!this.state.newName.match(/^[a-zA-Z0-9]$|^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$/)) {
        this.setState({
          nameError: true,
          nameErrorContent: "Invalid name"
        });

        return;
      } else {
        newName = this.state.newName;
      }
    }

    var newDescription = null;
    if (this.props.appDescription !== this.state.newDescription) {
      if (this.state.newDescription === "") {
        // Description cannot be empty. Revert back to the previous value
        this.setState({newDescription: this.props.appDescription});
      } else {
        newDescription = this.state.newDescription;
      }
    }

    if (newName === null && newDescription === null && this.state.newIconFile === null) {
      return;
    }

    this.props.onUpdateApp(newName, newDescription, this.state.newIconFile);
  }

  onToggleDeleteDialog() {
    this.setState({
      deleteDialogIsOpen: !this.state.deleteDialogIsOpen
    });
  }

  onDelete() {
    this.setState({deleting: true});
    this.props.onDeleteApp();
  }

  render() {
    return (
      <Popover position={Position.BOTTOM_LEFT} inheritDarkTheme={false}>
        <Button style={this.props.style} className="pt-minimal pv-menubar-name"
         rightIconName="caret-down">{this.props.appName}</Button>
        <div className="pv-menubar-name-dropdown">
          <div className="pv-menubar-name-dropdown-firstrow">
            <AppIcon appId={this.props.appId} appName={this.props.appName} appIcon={this.state.newIcon}
                     onUpdateAppIcon={(icon, file) => this.setState({newIcon: icon, newIconFile: file})}/>
            <div className="pv-menubar-name-dropdown-nameblock">
              <p className="pv-menubar-name-dropdown-label">
                Name:
              </p>
              <input className={this.state.nameError ? "pt-input pt-fill pt-intent-danger": "pt-input pt-fill"}
                    value={this.state.newName} type="text"
                    disabled={this.props.viewerMode}
                    onChange={evt => {this.setState({newName: evt.target.value, nameError: false})}}/>
              {this.state.nameError && (
                <span className="pv-menubar-name-dropdown-nameerror">{this.state.nameErrorContent}</span>
              )}
            </div>
          </div>

          <p className="pv-menubar-name-dropdown-label">
            Description:
          </p>
          <input className="pt-input pt-fill"
                 value={this.state.newDescription} type="text"
                 disabled={this.props.viewerMode}
                 onChange={evt => {this.setState({newDescription: evt.target.value})}}/>

          <p className="pv-menubar-name-dropdown-label">
            App URL:
          </p>

          <div className="pt-input-group">
            <input className="pt-input"
                   value={getAppUrl(this.props.appName)} type="text"
                   disabled={true}/>
            <CopyToClipboard text={getAppUrl(this.props.appName)}>
               <button className="pt-button pt-minimal pt-intent-primary">
                 COPY URL
               </button>
            </CopyToClipboard>
          </div>

          {!this.props.viewerMode && (
            <div style={{marginTop: 20}}>
              {(this.props.appName !== this.state.newName ||
                this.props.appDescription !== this.state.newDescription ||
                this.state.newIconFile !== null) && (
                <Button intent={Intent.WARNING} style={{marginRight:15}}
                 onClick={this.onUpdateApp.bind(this)}>Update</Button>
              )}
              <Button intent={Intent.DANGER}
               onClick={this.onToggleDeleteDialog.bind(this)}>Delete</Button>
              <Dialog isOpen={this.state.deleteDialogIsOpen}
                onClose={this.onToggleDeleteDialog.bind(this)}
                title="Confirmation">
                <div className="pt-dialog-body">
                  Do you really want to delete this app? This operation is
                  IRREVERSIBLE.
                </div>
                <div className="pt-dialog-footer">
                  <div className="pt-dialog-footer-actions">
                    <Button intent={Intent.DANGER} text="Delete"
                     iconName="trash"
                     loading={this.state.deleting}
                     onClick={this.onDelete.bind(this)}/>
                    <Button text="Cancel" onClick={this.onToggleDeleteDialog.bind(this)}/>
                  </div>
                </div>
              </Dialog>
            </div>
          )}
        </div>
      </Popover>
    );
  }
}

AppSettingButton.propTypes = {
  appId: PropTypes.string.isRequired,
  appName: PropTypes.string.isRequired,
  appNameConflict: PropTypes.bool.isRequired,
  appDescription: PropTypes.string.isRequired,
  appIcon: PropTypes.string.isRequired,
  viewerMode: PropTypes.bool.isRequired,
  onUpdateApp: PropTypes.func.isRequired,
  onDeleteApp: PropTypes.func.isRequired
}

class AppStateButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      appState: null
    };

    this.appStateWs = null;
    this.pingTimer = null;
    this.pingExpTimer = null;
  }

  kickPingTimer() {
    if (this.pingTimer !== null) {
      clearTimeout(this.pingTimer);
    }

    this.pingTimer = setTimeout(() => {
      // The API doesn't allow us to send the ping control message.
      // Send a regular text message instead.
      this.appStateWs.send("_ping");
      if (this.pingExpTimer !== null) {
        clearTimeout(this.pingExpTimer);
      }

      this.pingExpTimer = setTimeout(() => {
        // Takes too long for the pong to come back. Close the conection.
        this.pingExpTimer = null;
        this.appStateWs.close();
      }, 5000);
    }, 5000);
  }

  cancelPingTimer() {
    if (this.pingTimer !== null) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pingExpTimer !== null) {
      clearTimeout(this.pingExpTimer);
      this.pingExpTimer = null;
    }
  }

  handleNewState(state) {
    this.setState({appState: state});
    if (state === "RUNNING") {
      this.props.onAppStateChange(true);
    } else {
      this.props.onAppStateChange(false);
    }
  }

  componentDidMount() {
    this.appStateWs = this.props.apiClient.createAppStateWs();
    this.appStateWs.addEventListener("message", (msg) => {
      if (msg.data === "_pong") {
        // Special heartbeat message, cancel expiration timer
        if (this.pingExpTimer !== null) {
          clearTimeout(this.pingExpTimer);
          this.pingExpTimer = null;
        }

        // Kick the next ping timer
        this.kickPingTimer();
      } else {
        this.handleNewState(msg.data);
      }
    });
    this.appStateWs.addEventListener("open", (evt) => {
      // enable the app
      this.props.apiClient.enableApp(() => {});

      // kick off ping timer
      this.kickPingTimer();
    });
  }

  componentWillUnmount() {
    if (this.appStateWs !== null) {
      this.appStateWs.close(1000, '', {keepClosed: true});
      this.appStateWs = null;
      this.cancelPingTimer();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.appId === this.props.appId) {
      return;
    }

    // reset state
    this.setState({appState: null});
    if (this.appStateWs !== null) {
      this.appStateWs.close(1000, '', {keepClosed: true});
      this.cancelPingTimer();
    }

    this.appStateWs = nextProps.apiClient.createAppStateWs();
    this.appStateWs.addEventListener("message", (msg) => {
      if (msg.data === "_pong") {
        // Special heartbeat message, cancel expiration timer
        if (this.pingExpTimer !== null) {
          clearTimeout(this.pingExpTimer);
          this.pingExpTimer = null;
        }

        // Kick the next ping timer
        this.kickPingTimer();
      } else {
        this.handleNewState(msg.data);
      }
    });
    this.appStateWs.addEventListener("open", (evt) => {
      // enable the app
      this.props.apiClient.enableApp(() => {});
      // kick off ping timer
      this.kickPingTimer();
    });
  }

  render() {
    if (this.state.appState === null) {
      return null;
    }

    var appStateText = "";
    var appStateIntent = null;
    var appIcon = null;
    if (this.state.appState === "NOT_RUNNING") {
      appStateText = "Starting...";
      appIcon = "selection";
      appStateIntent = Intent.WARNING;
    } else if (this.state.appState === "STARTING") {
      appStateText = "Starting...";
      appIcon = "selection";
      appStateIntent = Intent.WARNING;
    } else if (this.state.appState === "RUNNING") {
      appStateText = "Running";
      appIcon = "application";
      appStateIntent = Intent.SUCCESS;
    } else if (this.state.appState === "FINISHED") {
      appStateText = "Exited";
      appStateIntent = Intent.DANGER;
      appIcon = "error";
    }

    return (
      <Button className="pv-menubar-appstate pt-minimal" style={this.props.style}
       iconName={appIcon} intent={appStateIntent}>
        {appStateText}
      </Button>
    );
  }
}

AppStateButton.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  appId: PropTypes.string.isRequired,
  appName: PropTypes.string.isRequired,
  onAppStateChange: PropTypes.func.isRequired
}

class AppPreviewButton extends Component {
  render() {
    var disabled = !this.props.viewerMode && !this.props.appRunning;
    var className = null;
    if (disabled) {
      className = "pt-outline";
    }

    return (
      <AnchorButton className={className}
       style={this.props.style} iconName="link"
       intent={Intent.PRIMARY} target="_blank"
       href={getAppUrl(this.props.appName)}
       onClick={this.props.onPreviewApp}
       disabled={disabled}>
       Open App
      </AnchorButton>
    );
  }
}

AppPreviewButton.propTypes = {
  appName: PropTypes.string.isRequired,
  appRunning: PropTypes.bool,
  viewerMode: PropTypes.bool.isRequired,
  onPreviewApp: PropTypes.func.isRequired
}

class MenuBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      app: null,
      appNameConflict: false,
      appRunning: false,
      currentLogGeneration: 0,
      cloning: false
    };
  }

  componentDidMount() {
    this.props.apiClient.getAppState((app) => {
      this.setState({app: app});

      // tell parent about the initiall name and description
      if (this.props.onUpdateAppName !== null) {
        this.props.onUpdateAppName(app.name);
      }

      if (this.props.onUpdateAppDescription !== null) {
        this.props.onUpdateAppDescription(app.description);
      }
    });
  }

  onRestart() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - restart app", {
        app_id: this.state.app.id,
        app_name: this.state.app.name
      });
    }

    this.props.apiClient.restartApp((app) => {
      this.setState({app: app});
    });
  }

  onClone() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - clone app", {
        app_id: this.state.app.id,
        app_name: this.state.app.name
      });
    }

    this.setState({cloning: true});
    this.props.apiClient.forkApp({}, (app) => {
      this.setState({cloning: false});
      window.location = "/app/" + app.name;
    });
  }

  onExport() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - export app", {
        app_id: this.state.app.id,
        app_name: this.state.app.name
      });
    }

    this.props.apiClient.exportFiles((data) => {
      var blob = new Blob([data], {type: "application/zip"});
      FileSaver.saveAs(blob, this.state.app.name + ".zip");
    });
  }

  onDelete() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - delete app", {
        app_id: this.state.app.id,
        app_name: this.state.app.name
      });
    }

    this.props.apiClient.deleteApp(() => {
      window.location.replace("/");
    });
  }

  onUpdate(newName, newDescription, newIcon) {
    this.props.apiClient.updateApp(newName, newDescription, newIcon, (app) => {
      this.setState({app: app, appNameConflict: false});
    }, () => {
      this.setState({appNameConflict: true});
    });

    // Tell parent about the updates
    if (newName !== null && this.props.onUpdateAppName !== null) {
      this.props.onUpdateAppName(newName);
    }

    if (newDescription !== null && this.props.onUpdateAppDescription !== null) {
      this.props.onUpdateAppDescription(newDescription);
    }

    if (window.analytics !== undefined && newName !== null) {
      window.analytics.track("app - update name", {
        app_id: this.state.app.id,
        app_name_old: this.state.app.name,
        app_name_new: newName
      });
    }

    if (window.analytics !== undefined && newDescription !== null) {
      window.analytics.track("app - update description", {
        app_id: this.state.app.id,
        app_name: this.state.app.name,
        app_description_old: this.state.app.description,
        app_description_new: newDescription
      });
    }
  }

  onPreview() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - view app", {
        app_id: this.state.app.id,
        app_name: this.state.app.name
      });
    }
  }

  onToggleLog() {
    // disable the indicator
    this.setState({currentLogGeneration: this.props.logGeneration});
    this.props.onToggleLog();
  }

  onAppStateChange(running) {
    this.setState({appRunning: running});
    if (this.props.onUpdateAppRunning) {
      this.props.onUpdateAppRunning(running);
    }
  }

  render() {
    var userControl = null;

    if (!this.props.embedded) {
      if (this.props.accessToken) {
        userControl = (
          <Popover position={Position.BOTTOM_RIGHT} inheritDarkTheme={false}>
            <Button className="pt-minimal pv-landing-navbar-avatar">
              <img src={this.props.user.picture}/>
            </Button>
            <Menu>
              <MenuItem text="Sign Out" onClick={this.props.lock.signOut}/>
            </Menu>
          </Popover>
        );
      } else {
        userControl = (
          <Button className="pt-minimal"
            onClick={this.props.lock.signIn}>Sign In</Button>
        );
      }
    }

    if (!this.state.app) {
      // App is not loaded, just show an empty nav bar with an icon and user control
      return (
        <div className="pt-dark">
          <nav className="pt-navbar pv-menubar">
            <div className="pt-navbar-group pt-align-left">
              <a href="/">
                <img className="pv-menubar-logo" src={LogoImg}/>
              </a>
            </div>
            {!this.props.embedded &&
              (<div className="pt-navbar-group pt-align-right">
                {userControl}
              </div>)}
          </nav>
        </div>
      );
    }

    var needRestart = (this.props.sourceTimestamp > this.state.app.running_timestamp);
    var newLogAvailable = false;
    if (!this.props.logOpened && this.props.logGeneration > this.state.currentLogGeneration) {
      newLogAvailable = true;
    }

    if (this.props.embedded) {
      if (this.props.viewerMode) {
        return (
          <div className="pt-dark">
            <nav className="pt-navbar pv-menubar">
              <div className="pt-navbar-group pt-align-left">
                <a href="/" target="_blank">
                  <img className="pv-menubar-logo" src={LogoImg}/>
                </a>
                <AnchorButton style={{marginLeft: 45}} iconName="duplicate"
                      intent={Intent.PRIMARY} target="_blank"
                      href={"/embed/clone_redirect/app/" + this.state.app.name}>
                  Clone and Edit
                </AnchorButton>
              </div>
            </nav>
          </div>
        );
      } else {
        return (
          <div className="pt-dark">
            <nav className="pt-navbar pv-menubar">
              <div className="pt-navbar-group pt-align-left">
                <a href="/" target="_blank">
                  <img className="pv-menubar-logo" src={LogoImg}/>
                </a>

                <AnchorButton style={{marginLeft: 45}}
                  iconName="share" intent={Intent.PRIMARY} target="_blank"
                  href={"/app/" + this.state.app.name}>
                  Open App in Postverta
                </AnchorButton>

                <AppStateButton style={{marginLeft: 15}}
                  apiClient={this.props.apiClient}
                  appId={this.state.app.id}
                  appName={this.state.app.name}
                  onAppStateChange={this.onAppStateChange.bind(this)}
                />

                <Button className={needRestart ? "" : "pt-outline"}
                          style={{marginLeft: 15}} iconName="refresh"
                          intent={needRestart ? Intent.WARNING : null}
                          onClick={this.onRestart.bind(this)}>
                  Restart
                </Button>

                <Button className={newLogAvailable ? "" : "pt-outline"}
                          style={{marginLeft: 15}} iconName="search-template"
                          intent={newLogAvailable ? Intent.PRIMARY : null}
                          active={this.props.logOpened}
                          onClick={this.onToggleLog.bind(this)}>
                  Console
                </Button>
              </div>
            </nav>
          </div>
        );
      }
    }

    // For full editor (non-embedded) view
    return (
      <div className="pt-dark">
        <nav className="pt-navbar pv-menubar">
          <div className="pt-navbar-group pt-align-left">
            <a href="/">
              <img className="pv-menubar-logo" src={LogoImg}/>
            </a>

            <AppSettingButton style={{marginLeft: 40}}
              appId={this.state.app.id}
              appName={this.state.app.name}
              appNameConflict={this.state.appNameConflict}
              appDescription={this.state.app.description}
              appIcon={this.state.app.icon}
              onUpdateApp={this.onUpdate.bind(this)}
              onDeleteApp={this.onDelete.bind(this)}
              viewerMode={this.props.viewerMode}/>

            {!this.props.viewerMode &&
              (<AppStateButton style={{marginLeft: 15}}
                apiClient={this.props.apiClient}
                appId={this.state.app.id}
                appName={this.state.app.name}
                onAppStateChange={this.onAppStateChange.bind(this)}
                />)}

            <AppPreviewButton style={{marginLeft: 15}} appName={this.state.app.name}
              appRunning={this.state.appRunning} viewerMode={this.props.viewerMode}
              onPreviewApp={this.onPreview.bind(this)}/>

            {!this.props.viewerMode &&
              (<Button className={needRestart ? "" : "pt-outline"}
                      style={{marginLeft: 15}} iconName="refresh"
                      intent={needRestart ? Intent.WARNING : null}
                      onClick={this.onRestart.bind(this)}>
                Restart
              </Button>)}


            <Button className="pt-outline" style={{marginLeft: 15}} iconName="duplicate"
                    onClick={this.onClone.bind(this)} loading={this.state.cloning}>
              Clone
            </Button>

            {!this.props.viewerMode &&
              (<Button className="pt-outline" style={{marginLeft: 15}} iconName="download"
                      onClick={this.onExport.bind(this)}>
                Export
              </Button>)}

            {!this.props.viewerMode &&
              (<Button className={newLogAvailable ? "" : "pt-outline"}
                      style={{marginLeft: 15}} iconName="search-template"
                      intent={newLogAvailable ? Intent.PRIMARY : null}
                      active={this.props.logOpened}
                      onClick={this.onToggleLog.bind(this)}>
                Console
              </Button>)}
          </div>

          {!this.props.embedded &&
            (<div className="pt-navbar-group pt-align-right">
              {userControl}
            </div>)}
        </nav>
      </div>
    );
  }
}

MenuBar.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  logOpened: PropTypes.bool.isRequired,
  viewerMode: PropTypes.bool.isRequired,
  embedded: PropTypes.bool.isRequired,
  logGeneration: PropTypes.number.isRequired,
  sourceTimestamp: PropTypes.number.isRequired,
  onToggleLog: PropTypes.func.isRequired,
  onUpdateAppName: PropTypes.func,
  onUpdateAppDescription: PropTypes.func,
  onUpdateAppRunning: PropTypes.func,
}

export default MenuBar;
