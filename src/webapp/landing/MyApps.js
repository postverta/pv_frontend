import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import Initicon from 'react-initicon';
import './MyApps.css'

class MyApps extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apps: []
    };
  }

  componentDidMount() {
    this.props.apiClient.getApps((data) => {
      this.setState({apps: data});
    });
  }

  onOpenApp(app) {
    if (window.analytics !== undefined) {
      window.analytics.track("landing - open my app", {
        app_id: app.id,
        app_name: app.name
      });
    }
  }

  renderApps() {
    var apps = this.state.apps.map((app) => {
      var iconDom = null;
      if (app.icon !== "") {
        iconDom = (<img src={app.icon}/>);
      } else {
        var text = app.name.replace("-", " ").toUpperCase();
        var seed = app.id.hashCode();
        iconDom = (<div><Initicon size={60} text={text} seed={seed}/></div>);
      }
      return (
        <a target="_blank" href={"/app/" + app.name}
           className="pv-landing-myapps-app pt-card pt-interactive" key={app.name}
           onClick={this.onOpenApp.bind(this, app)}>
          <span>
            {iconDom}
            {app["name"]}
          </span>
          <p>{app["description"]}</p>
        </a>
      );
    });

    var numBlocks = this.state.apps.length;
    var numFillers = (3 - (numBlocks % 3)) % 3;
    var fillers = Array.apply(null, {length:numFillers}).map((filler, index) => {
      return (
        <div className="pv-landing-myapps-app" key={"filler-" + index}>
        </div>
      );
    });

    return (
      <div className="pv-landing-myapps-apps">
        {apps}
        {fillers}
      </div>
    );
  }

  render() {
    if (this.state.apps.length === 0) {
      return null;
    }

    return (
      <div className="pv-landing-myapps">
        <div className="pv-landing-container">
          <p className="pv-landing-myapps-title">My apps</p>
          {this.renderApps()}
        </div>
      </div>
    )
  }
}

MyApps.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired
}

export default MyApps;
