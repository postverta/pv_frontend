import React, { Component } from 'react';
import './Intro.css';
import DemoVideo from './videos/demo.mp4';
import EditorIcon from './icons/Editor.svg';
import FullstackIcon from './icons/Fullstack.svg';
import ExportIcon from './icons/Export.svg';
import HostingIcon from './icons/Hosting.svg';
import NpmIcon from './icons/Npm.svg';
import CloneIcon from './icons/Clone.svg';

class Intro extends Component {
  render() {
    return (
      <div className="pv-landing-intro">
        <div className="pv-landing-container">
          <video className="pv-landing-demo-video" autoPlay loop>
            <source src={DemoVideo} type="video/mp4"/>
          </video>
          <p className="pv-landing-intro-title">Welcome to the new form of Node.js prototyping</p>
          <div className="pv-landing-intro-features">
            <div className="pv-landing-intro-feature pt-card">
              <div className="title-container">
                <div className="icon">
                  <object data={EditorIcon} type="image/svg+xml"></object>
                </div>
                <span className="title">Online code editor</span>
              </div>
              <p className="content">Start working with just one click, and resume your work anytime from anywhere.</p>
            </div>
            <div className="pv-landing-intro-feature pt-card">
              <div className="title-container">
                <div className="icon">
                  <object data={FullstackIcon} type="image/svg+xml"></object>
                </div>
                <span className="title">Full-stack environment</span>
              </div>
              <p className="content">Not just for frontend. Use the platform to build your next
               full-stack web app, helpful bot, webhook, IoT service, and many more.</p>
            </div>
            <div className="pv-landing-intro-feature pt-card">
              <div className="title-container">
                <div className="icon">
                  <object data={HostingIcon} type="image/svg+xml"></object>
                </div>
                <span className="title">Automatic hosting</span>
              </div>
              <p className="content">Each app is automatically hosted in our containerized
              infrastructure, so you can easily use or share the app you have just built!</p>
            </div>
            <div className="pv-landing-intro-feature pt-card">
              <div className="title-container">
                <div className="icon">
                  <object data={NpmIcon} type="image/svg+xml"></object>
                </div>
                <span className="title">NPM supported</span>
              </div>
              <p className="content">Install/uninstall NPM packages with ease.
              Enhance your app with millions of NPM packages.</p>
            </div>
            <div className="pv-landing-intro-feature pt-card">
              <div className="title-container">
                <div className="icon">
                  <object data={CloneIcon} type="image/svg+xml"></object>
                </div>
                <span className="title">Clone to reuse and redeploy</span>
              </div>
              <p className="content">Find an app or a bot you like? Clone it with just one click
              to build upon it or to redeploy it with your own configurations.</p>
            </div>
            <div className="pv-landing-intro-feature pt-card">
              <div className="title-container">
                <div className="icon">
                  <object data={ExportIcon} type="image/svg+xml"></object>
                </div>
                <span className="title">No lock-in</span>
              </div>
              <p className="content">All your source code can be exported and deployed in your
              own infrastructure.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Intro;
