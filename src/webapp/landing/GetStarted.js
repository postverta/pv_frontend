import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import { Button, Intent } from '@blueprintjs/core';
import './GetStarted.css';
import WebAppIcon from './icons/WebApp.svg';
import WebHookIcon from './icons/WebHook.svg';
import ScratchIcon from './icons/Scratch.svg';
import GithubIcon from './icons/Github.svg';
import ReactIcon from './icons/React.svg';
import AngularIcon from './icons/Angular.svg';
import VueIcon from './icons/Vue.svg';
import HtmlIcon from './icons/Html.svg';

class Block extends Component {
  render() {
    var classes = ["pv-landing-getstarted-block"];
    if (this.props.active) {
      classes.push("active");
    }
    return (
      <div className={classes.join(" ")} onClick={this.props.onClick}>
        <div className="icon">
          <object data={this.props.icon} type="image/svg+xml"></object>
        </div>
        <p className="name">
          {this.props.title}
        </p>
      </div>
    );
  }
}

Block.propTypes = {
  active: PropTypes.bool.isRequired,
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

class GetStarted extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTemplate: null,
      selectedFramework: "react",
      githubLink: "",
      appStarting: false
    };
  }

  onSelectTemplate(template) {
    this.setState({selectedTemplate: template});
  }

  onSelectFramework(framework) {
    this.setState({selectedFramework: framework});
  }

  onStartBuilding() {
    this.setState({appStarting: true, githubError: null});
    if (window.analytics !== undefined) {
      window.analytics.track("landing - create app", {
        template: this.state.selectedTemplate,
        frontend_framework: this.state.selectedTemplate === "webapp" ? this.state.selectedFramework : null
      });
    }

    if (this.state.selectedTemplate !== "github") {
      this.props.apiClient.newApp(this.state.selectedTemplate,
                                  this.state.selectedFramework, (app) => {
        this.setState({appStarting: false});
        window.location = "/app/" + app["name"];
      });
    } else {
      var re = /github\.com\/([^\/]+)\/([^\.]+)/;
      var found = this.state.githubLink.match(re);
      if (found === null) {
        this.setState({
          appStarting: false,
          githubError: "Invalid GitHub link."
        });
      } else {
        var githubUser = found[1];
        var githubRepo = found[2];
        this.props.apiClient.importGithubRepo(
          githubUser,
          githubRepo,
          "master",
          (app) => {
            // open the workspace view
            this.setState({appStarting: false});
            window.location = "/app/" + app["name"];
          },
          () => {
            this.setState({appStarting: false,
                           githubError: "Cannot import repository. " +
                           "Please verify the user name and repository are spelled " +
                           "correctly and the repository contains a package.json file."});
          }
        );
      }
    }
  }

  render() {
    return (
      <div id="getstarted" className="pv-landing-getstarted">
        <div className="pv-landing-container">
          {this.props.simple ? (
            <p className="pv-landing-getstarted-title">Start a new app</p>
          ): (
            <div>
              <p className="pv-landing-getstarted-title">Start building apps today</p>
              <p className="pv-landing-getstarted-subtitle">Sign-up is not required</p>
              <p className="pv-landing-getstarted-templates-title">
                Start by choosing a template:
              </p>
            </div>
          )}
          <div className="pv-landing-getstarted-templates">
            <Block active={this.state.selectedTemplate === "webapp"}
                   icon={WebAppIcon} title="Build a web app"
                   onClick={this.onSelectTemplate.bind(this, "webapp")}/>
            <Block active={this.state.selectedTemplate === "webhook"}
                   icon={WebHookIcon} title="Build webhooks & APIs"
                   onClick={this.onSelectTemplate.bind(this, "webhook")}/>
            <Block active={this.state.selectedTemplate === "scratch"}
                   icon={ScratchIcon} title="Build from scratch"
                   onClick={this.onSelectTemplate.bind(this, "scratch")}/>
            <Block active={this.state.selectedTemplate === "github"}
                   icon={GithubIcon} title="Import from GitHub"
                   onClick={this.onSelectTemplate.bind(this, "github")}/>
          </div>
          {this.state.selectedTemplate === "webapp" && (
            <div className="pv-landing-getstarted-frameworks-container">
              {!this.props.simple && (
                <p className="pv-landing-getstarted-frameworks-title">
                  Choose your preferred front-end framework:
                </p>
              )}
              <div className="pv-landing-getstarted-frameworks">
                <Block active={this.state.selectedFramework === "react"}
                       icon={ReactIcon} title="React"
                       onClick={this.onSelectFramework.bind(this, "react")}/>
                <Block active={this.state.selectedFramework === "angular"}
                       icon={AngularIcon} title="Angular"
                       onClick={this.onSelectFramework.bind(this, "angular")}/>
                <Block active={this.state.selectedFramework === "vue"}
                       icon={VueIcon} title="Vue"
                       onClick={this.onSelectFramework.bind(this, "vue")}/>
                <Block active={this.state.selectedFramework === "legacy"}
                       icon={HtmlIcon} title="Legacy"
                       onClick={this.onSelectFramework.bind(this, "legacy")}/>
              </div>
            </div>
          )}
          {this.state.selectedTemplate === "github" && (
            <div className="pv-landing-getstarted-github-container">
              <p className="pv-landing-getstarted-github-title">
                Enter Github Repo URL:
              </p>
              <input className="pv-landing-getstarted-github-input pt-input pt-large" type="text"
                     placeholder="https://github.com/postverta/expressjs-start.git"
                     value={this.state.githubLink} disabled={this.state.appStarting}
                     onChange={evt => {this.setState({githubLink: evt.target.value, githubError: null});}}/>
              {this.state.githubError !== null && (
                <p className="pv-landing-getstarted-github-input-error">{this.state.githubError}</p>
              )}
            </div>
          )}
          {((this.state.selectedTemplate === "webapp" && this.state.selectedFramework !== null) ||
            this.state.selectedTemplate === "webhook" ||
            this.state.selectedTemplate === "scratch" ||
            (this.state.selectedTemplate === "github" && this.state.githubLink !== "")) && (
              <Button intent={Intent.PRIMARY} className="pt-large pv-landing-getstarted-startbuildng"
                      loading={this.state.appStarting}
                      onClick={this.onStartBuilding.bind(this)}>
                {this.props.simple ? "Start" : "Start Building Now"}
              </Button>
            )}
        </div>
      </div>
    );
  }
}

GetStarted.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  simple: PropTypes.bool.isRequired
}

export default GetStarted;
