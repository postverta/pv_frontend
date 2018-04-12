import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popover, Menu, MenuItem, Position } from '@blueprintjs/core';
import Title from './Title';
import Intro from './Intro';
import GetStarted from './GetStarted';
import Gallery from './Gallery';
import Community from './Community';
import Tos from './Tos';
import Footer from './Footer';
import MyApps from './MyApps';
import ApiClient from './ApiClient';
import PostvertaImg from './Postverta.png';
import './Landing.css';

class Landing extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiClient: new ApiClient(this.props.accessToken,
                               this.props.lock.reSignIn.bind(this.props.lock))
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      apiClient: new ApiClient(this.props.accessToken,
                               this.props.lock.reSignIn.bind(this.props.lock))
    });
  }

  componentDidMount() {
    if (this.props.accessToken) {
      document.title = "My workspace - Postverta";
    }
  }

  render() {
    var userControl = null;
    if (this.props.accessToken) {
      userControl = (
        <Popover position={Position.BOTTOM_RIGHT} inheritDarkTheme={false}>
          <button className="pt-button pt-minimal pv-landing-navbar-avatar">
            <img src={this.props.user.picture}/>
          </button>
          <Menu>
            <MenuItem text="Sign Out" onClick={this.props.lock.signOut}/>
          </Menu>
        </Popover>
      );
    } else {
      userControl = (
        <button className="pv-landing-navbar-signin pt-button pt-large pt-outline"
          onClick={this.props.lock.signIn}>Sign In</button>
      );
    }

    var content = null;
    if (this.props.match.params.path === "tos") {
      content = (<Tos/>);
    } else if (this.props.match.params.path === undefined) {
      if (this.props.accessToken !== null) {
        content = (
          <div>
            <GetStarted apiClient={this.state.apiClient} simple={true}/>
            <MyApps apiClient={this.state.apiClient}/>
            <Gallery apiClient={this.state.apiClient} simple={true}/>
            <Community/>
          </div>
        );
      } else {
        content = (
          <div>
            <Title apiClient={this.state.apiClient}/>
            <Intro/>
            <GetStarted apiClient={this.state.apiClient} simple={false}/>
            <Gallery apiClient={this.state.apiClient} simple={false}/>
            <Community/>
          </div>
        );
      }
    } else {
      // TODO: 404 page
    }

    return (
      <div className="pv-landing">
        <div className="pt-dark">
          <nav className="pv-landing-navbar pt-navbar">
            <div className="pv-landing-container">
              <div className="pt-navbar-group pt-align-left">
                <a href="/">
                  <img className="pv-landing-navbar-postverta" src={PostvertaImg}/>
                </a>
              </div>
              <div className="pt-navbar-group pt-align-right">
                {userControl}
              </div>
            </div>
          </nav>
        </div>
        {content}
        <Footer/>
      </div>
    );
  }
}

Landing.propTypes = {
  lock: PropTypes.object.isRequired,
  user: PropTypes.object,
  accessToken: PropTypes.string,
  match: PropTypes.object
}

export default Landing;
