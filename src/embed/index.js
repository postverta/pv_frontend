/*global FS*/
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { BrowserRouter, Route } from 'react-router-dom'
import './index.css';
import WorkspaceEmbedded from '../lib/workspace/WorkspaceEmbedded';
import qs from 'query-string';
import request from 'superagent';

function getAppUrl(name) {
  return process.env.REACT_APP_APP_HTTP_SCHEME + "://" + name +
         process.env.REACT_APP_APP_SUFFIX;
}

class WorkspaceLoader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      appId: null,
      appName: null,
      error: null,
    }
  }

  // methods used to send messages to parent
  sendLoadMessage(appName) {
    var msg = {
      type: "onLoad",
      url: getAppUrl(appName)
    };
    if (window.parent) {
      window.parent.postMessage(msg, "*");
    }
  }

  sendRunningStateChangeMessage(running) {
    var msg = {
      type: "onRunningStateChange",
      running: running
    };
    if (window.parent) {
      window.parent.postMessage(msg, "*");
    }
  }

  getApp(name, mode) {
    var urlBase = process.env.REACT_APP_API_HTTP_SCHEME + "://" +
                   process.env.REACT_APP_API_HOST;
    var nameResolveEp = urlBase + "/name/" + name;
    request.get(nameResolveEp).then((res) => {
      if (mode === "display") {
        // add the name to body, so that we can keep the API consistent
        res.body.name = name;
        return Promise.resolve(res);
      } else {
        var forkEp = urlBase + "/app/" + res.body.id + "/fork";
        return request.post(forkEp).send({env_vars:this.props.envVarMap});
      }
    }).then((res) => {
      this.setState({appId: res.body.id, appName: res.body.name});
      this.sendLoadMessage(res.body.name);
    }).catch((err) => {
      this.setState({appId: null, appName: null, error: err});
    });
  }

  componentWillMount() {
    this.getApp(this.props.appName, this.props.embedMode);
  }

  render() {
    if (this.state.error !== null) {
      // TODO: better error message
      return (<div>{"Cannot load app " + this.props.appName}</div>);
    } else if (this.state.appId === null) {
      // TODO: better loading animation
      return (<div>Loading...</div>);
    } else {
      if (this.props.redirect) {
        window.location.replace("/app/" + this.state.appName);
      } else {
        return (<div style={{height: "100vh", weight: "100%"}}>
                  <WorkspaceEmbedded appId={this.state.appId} embedMode={this.props.embedMode}
                                     onUpdateAppRunning={this.sendRunningStateChangeMessage.bind(this)}/>
                </div>);
      }
    }
  }
}

WorkspaceLoader.propTypes = {
  appName: PropTypes.string.isRequired,
  embedMode: PropTypes.string.isRequired,
  envVarMap: PropTypes.object.isRequired,
  redirect: PropTypes.bool.isRequired,
}

// This redirects the page to a cloned workspace
class WorkspaceCloneRedirecter extends Component {
  componentWillMount() {
    this.cloneApp(this.props.appName);
  }
}

class Root extends Component {
  render() {
    const workspaceLoader = (props) => {
      var envVarMap = {};
      var params = qs.parse(props.location.search);
      for (var key in params) {
        if (key.startsWith("config_")) {
          var k = key.substring("config_".length);
          var v = params[key];
          envVarMap[k] = v;
        }
      }
      return (
        <WorkspaceLoader appName={props.match.params.name} embedMode={params.mode}
                         envVarMap={envVarMap}
                         redirect={false} {...props}/> 
      );
    };

    const workspaceCloneRedirectLoader = (props) => {
      return (
        <WorkspaceLoader appName={props.match.params.name} embedMode={"clone"}
                         envVarMap={{}}
                         redirect={true} {...props}/>
      );
    };

    return (
      <BrowserRouter>
        <div>
          <Route path="/embed/app/:name" render={workspaceLoader}/>
          <Route path="/embed/clone_redirect/app/:name" render={workspaceCloneRedirectLoader}/>
        </div>
      </BrowserRouter>
    );
  }
}

// TODO: Move this to a better place...
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

ReactDOM.render((<Root/>), document.getElementById('root'));