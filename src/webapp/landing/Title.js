import React, { Component } from 'react';
import { AnchorButton, Intent } from "@blueprintjs/core";
import './Title.css';

class Title extends Component {
  render() {
    return (
      <div className="pv-landing-title">
        <div className="pv-landing-container">
          <p className="pv-landing-title-main">Build working apps in minutes</p>
          <p className="pv-landing-title-secondary">Postverta is an infrastructure-free development
          platform that lets you focus on writing great code without the hassle of setup</p>
          <AnchorButton intent={Intent.PRIMARY} className="pt-large pv-landing-try-button"
           href="#getstarted">
            Start Building
          </AnchorButton>
        </div>
      </div>
    );
  }
}

export default Title;
