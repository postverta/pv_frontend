import React, { Component } from 'react';
import './Footer.css';

class Footer extends Component {
  render() {
    return (
      <div className="pv-landing-footer">
        <div className="pv-landing-container">
          <span className="pv-landing-footer-left">
            <a style={{marginRight: 20}} href="https://twitter.com/gopostverta">
              Follow us @gopostverta
            </a>
            <a style={{marginRight: 20}} href="/tos">
              Terms
            </a>
            <a href="//www.iubenda.com/privacy-policy/8236662"
             className="iubenda-white iubenda-embed"
             title="Privacy policy">
              Privacy policy
            </a>
          </span>
          <span className="pv-landing-footer-copyright">Copyright @ 2017 Postverta Inc.</span>
        </div>
      </div>
    );
  }
}

export default Footer;
