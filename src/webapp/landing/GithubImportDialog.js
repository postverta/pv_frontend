import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import './GithubImportDialog.css';

class GithubImportDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      githubUser: "",
      githubRepo: "",
      githubUserError: false,
      githubRepoError: false,
      importError: false,
      busy: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen !== this.props.isOpen) {
      this.setState({
        githubUser: "",
        githubRepo: "",
        githubUserError: false,
        githubRepoError: false,
        importError: false,
        busy: false
      });
    }
  }

  onImport() {
    if (this.state.githubUser === "") {
      this.setState({githubUserError: true});
    }

    if (this.state.githubRepo === "") {
      this.setState({githubRepoError: true});
    }

    if (this.state.githubUser !== "" && this.state.githubRepo !== "") {
      this.setState({
        busy: true,
        importError: false,
        githubUserError: false,
        githubRepoError: false
      });
      this.props.apiClient.importGithubRepo(
        this.state.githubUser,
        this.state.githubRepo,
        "master",
        (app) => {
          // open the workspace view
          this.setState({busy: false});
          window.location = "/app/" + app["name"];
        },
        () => {
          this.setState({busy:false, importError: true});
        }
      );
    }
  }

  render() {
    return (
      <Dialog iconName="import" isOpen={this.props.isOpen} onClose={this.props.onClose}
        title="Import GitHub repository">
        <div className="pt-dialog-body pv-landing-githubimportdialog-body">
          <label className={this.state.busy ? "pt-label pt-disabled" : "pt-label"}>
            GitHub user name
            <input className={this.state.githubUserError ? "pt-input pt-intent-danger": "pt-input"}
             type="text" placeholder="e.g., postverta"
             value={this.state.githubUser} disabled={this.state.busy}
             onChange={evt => {this.setState({githubUser: evt.target.value});}}/>
          </label>
          <label className={this.state.busy ? "pt-label pt-disabled" : "pt-label"}>
            GitHub repository name
            <input className={this.state.githubRepoError ? "pt-input pt-intent-danger": "pt-input"}
             type="text" placeholder="e.g., expressjs-start"
             value={this.state.githubRepo} disabled={this.state.busy}
             onChange={evt => {this.setState({githubRepo: evt.target.value});}}/>
          </label>
        </div>
        <div className="pt-dialog-footer">
          {this.state.importError && (
            <p className="pv-landing-githubimportdialog-importerror">
              Cannot import repository. Please verify the user name and repository are spelled
              correctly and the repository contains a package.json file.
            </p>
          )}
          <div className="pt-dialog-footer-actions">
            <Button intent={Intent.SUCCESS} text="Import" loading={this.state.busy}
             onClick={this.onImport.bind(this)}/>
            <Button text="Cancel" onClick={this.props.onClose}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

GithubImportDialog.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  history: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default GithubImportDialog;
