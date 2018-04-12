import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import Initicon from 'react-initicon';
import './Gallery.css';

class GalleryApp extends Component {
  onOpen() {
    if (window.analytics !== undefined) {
      window.analytics.track("landing - open gallery app", {
        app_id: this.props.app.id,
        app_name: this.props.app.name
      });
    }
  }

  render() {
    var iconDom = null;
    if (this.props.app.icon !== "") {
      iconDom = (<img src={this.props.app.icon}/>);
    } else {
      var text = this.props.app.name.replace("-", " ").toUpperCase();
      var seed = this.props.app.id.hashCode();
      iconDom = (<div><Initicon size={60} text={text} seed={seed}/></div>);
    }
    return (
      <a target="_blank" href={"/app/" + this.props.app["name"]}
         className="pv-landing-gallery-app pt-card pt-interactive"
         onClick={this.onOpen.bind(this)}>
        <span>
          {iconDom}
          {this.props.app.name}
        </span>
        <p>{this.props.app.description}</p>
      </a>
    );
  }
}

GalleryApp.propTypes = {
  app: PropTypes.object.isRequired,
  apiClient: PropTypes.instanceOf(ApiClient).isRequired
}

class Gallery extends Component {
  constructor(props) {
    super(props);

    this.state = {
      numApps: 9,
      apps: [],
    }
  }

  componentDidMount() {
    this.props.apiClient.getGalleryApps(this.state.numApps, (apps) => {
      this.setState({apps: apps});
    });
  }

  onLoadMore() {
    var newNumApps = this.state.numApps + 3;
    this.setState({numApps: newNumApps});
    this.props.apiClient.getGalleryApps(newNumApps, (apps) => {
      this.setState({apps: apps});
    });
  }

  render() {
    var apps = this.state.apps.map((app) => {
      return (
        <GalleryApp app={app} apiClient={this.props.apiClient}
         key={app.id}/>
      );
    });

    var numFillers = (3 - (this.state.apps.length % 3)) % 3;
    var fillers = Array.apply(null, {length:numFillers}).map((filler, index) => {
      return (
        <div className="pv-landing-gallery-app" key={"filler-" + index}>
        </div>
      );
    });

    return (
      <div className="pv-landing-gallery">
        <div className="pv-landing-container">
          <p className="pv-landing-gallery-title">Community gallery</p>
          {!this.props.simple && (
            <p className="pv-landing-gallery-subtitle">Check out what others are building, get inspired,
            and build upon them!</p>
          )}
          <div className="pv-landing-gallery-container">
            {apps}
            {fillers}
          </div>
          {this.state.numApps === this.state.apps.length && (
            <Button className="pv-landing-gallery-loadmore pt-large pt-outline"
                    intent={Intent.PRIMARY}
                    onClick={this.onLoadMore.bind(this)}>
              Load More
            </Button>
          )}
        </div>
      </div>
    );
  }
}

Gallery.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  simple: PropTypes.bool.isRequired
}

export default Gallery;
