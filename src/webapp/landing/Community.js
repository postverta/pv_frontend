import React, { Component } from 'react';
import { AnchorButton } from '@blueprintjs/core';
import CommunityIcon from './icons/Community.svg';
import './Community.css';

class Community extends Component {
  render() {
    return (
      <div className="pv-landing-community">
        <div className="pv-landing-container pt-dark">
          <object data={CommunityIcon} type="image/svg+xml"></object>
          <p className="pv-landing-community-title">Postverta team and community chat</p>
          <p className="pv-landing-community-subtitle">Stop by our public Slack channel to
             ask questions and get answers</p>
          <AnchorButton className="pv-landing-community-visit pt-large pt-outline" target="_blank"
                        href="https://postverta-slackin.postverta.com/">
            Visit Channel
          </AnchorButton>
        </div>
      </div>
    );
  }
}

export default Community;
