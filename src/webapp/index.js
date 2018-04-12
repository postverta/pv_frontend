/*global Auth0Lock*/
/*global FS*/
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom'
import './index.css';
import Landing from './landing/Landing';
import WorkspaceContainer from '../lib/workspace/WorkspaceContainer';
import Direct from './direct/Direct';
import registerServiceWorker from './registerServiceWorker';
import LogoImg from './Logo.png';

class Callback extends Component {
  constructor(props) {
    super(props);

    this.props.lock.on("authenticated", (authResult) => {
      this.props.lock.getUserInfo(authResult.accessToken, (error, profile) => {
        if (error) {
          console.log("Auth0 getUserInfo error");
          return;
        }

        localStorage.setItem("accessToken", authResult.idToken);
        localStorage.setItem("profile", JSON.stringify(profile));

        // redirect to the previous URL
        window.location.replace(authResult.state);
      });
    });
  }

  render() {
    return (<div>Loading...</div>);
  }
}

class Signout extends Component {
  componentWillMount() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("profile");

    // We add a small delay to the redirection so that we can
    // have a chance to record the page in GA (i.e., until the
    // root component's componentDidMount fires).
    setTimeout(() => {
      window.location.replace("/");
    }, 50);
  }

  render() {
    return (<div/>);
  }
}

class Root extends Component {
  constructor(props) {
    super(props);

    var lock = new Auth0Lock(
      process.env.REACT_APP_AUTH0_CLIENTID,
      process.env.REACT_APP_AUTH0_DOMAIN,
      {
        auth: {
          responseType: "token id_token",
          redirectUrl: process.env.REACT_APP_AUTH0_REDIRECT_URI
        },
        theme: {
          logo: LogoImg
        },
        languageDictionary: {
          title: ""
        }
      }
    );

    // Convenient functions for signIn and signOut calls
    lock.signIn = (function() {
      this.show({
        auth: {
          params: {
            state: window.location.pathname
          }
        }
      });
    }).bind(lock);

    lock.signOut = (function() {
      if (window.analytics !== undefined) {
        window.analytics.track("onboarding - sign out");
      }
      
      this.logout({
        returnTo: process.env.REACT_APP_AUTH0_SIGNOUT_URI
      });
    }).bind(lock);

    lock.reSignIn = (function() {
      this.show({
        flashMessage: {
          type: 'error',
          text: 'Your session has expired. Please sign in again.'
        },
        auth: {
          params: {
            state: window.location.pathname
          }
        }
      })
    }).bind(lock);

    // Register event listeners for sign-in events
    lock.on("federated login", (evt) => {
      if (window.analytics !== undefined) {
        window.analytics.track("onboarding - sign in", {
          account_type: evt.name
        });
      }
    });

    this.state = {
      accessToken: localStorage.getItem("accessToken"),
      user: JSON.parse(localStorage.getItem("profile")),
      lock: lock
    };
  }

  componentDidMount() {
    if (this.state["accessToken"] !== null && process.env.NODE_ENV === "production") {
      // Identify the user for FullStory
      FS.identify(this.state["user"]["sub"], {
        displayName: this.state["user"]["name"],
        email: this.state["user"]["email"]
      });

      // Identify the user for Intercom
      window.Intercom('boot', {
       app_id: 'fhl93ic9',
       email: this.state.user["email"],
       user_id: this.state.user["sub"]
      });
    } else if (process.env.NODE_ENV === "production") {
      window.Intercom('boot', {
       app_id: 'fhl93ic9',
      });
    }

    if (this.state["accessToken"] !== null && window.analytics !== undefined) {
      // Identify the user for segment
      window.analytics.identify(this.state.user["sub"], this.state.user);
    }

    // Record the page view after the page is fully loaded
    if (window.analytics !== undefined) {
      window.analytics.page();
    }
  }

  render() {
    const workspaceContainer = (props) => {
      return (
        <WorkspaceContainer accessToken={this.state["accessToken"]} user={this.state["user"]}
         lock={this.state.lock} appName={props.match.params.name} {...props}/>
      );
    };

    const landing = (props) => {
      return (
        <Landing accessToken={this.state["accessToken"]} user={this.state["user"]}
         lock={this.state.lock} {...props}/>
      );
    };

    /*
    const direct = (props) => {
      return (
        <Direct accessToken={this.state["accessToken"]} user={this.state["user"]} {...props}/>
      );
    };
    */

    const callback = (props) => {
      return (
        <Callback lock={this.state.lock} {...props}/>
      );
    };

    const signout = (props) => {
      return (
        <Signout {...props}/>
      );
    };

    return (
      <BrowserRouter>
        <div>
          <Route path="/app/:name" render={workspaceContainer}/>
          <Route exact path="/:path" render={landing}/>
          <Route exact path="/" render={landing}/>
          <Route exact path="/callback" render={callback}/>
          <Route exact path="/signout" render={signout}/>
        </div>
      </BrowserRouter>
    );
  }
}

// Helper functions, init code, etc.
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

// Early initialization code
if (process.env.NODE_ENV !== "production") {
  window.analytics.load("mbx2zCOKvoJgATFL1ttp5C7HB7jieXXR");
} else {
  window.analytics.load("vnTnjHY9oiiAwYYvaHPm4ibgRLV1Pjgu");
}

ReactDOM.render((<Root/>), document.getElementById('root'));
//registerServiceWorker();