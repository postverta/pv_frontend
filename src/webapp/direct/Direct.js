import request from 'superagent';
import React, { Component } from 'react';
import { Spinner } from '@blueprintjs/core';
import ApiClient from './ApiClient';
import './Direct.css';

class Direct extends Component {
  constructor(props) {
    super(props);

    this.githubUser = this.props.match.params.githubUser;
    this.githubRepo = this.props.match.params.githubRepo;

    this.apiClient = new ApiClient(this.props.accessToken);

    this.state = {
      error: false
    }
  }

  componentDidMount() {
    // verify the github repo is available
    var githubApiUrl = "https://api.github.com/repos/" + this.githubUser + "/" + this.githubRepo;
    request.get(githubApiUrl).end((err, res) => {
      if (err) {
        this.setState({error: true});
      } else {
        this.apiClient.newApp(this.githubUser, this.githubRepo, res.body.description, (app) => {
          this.props.history.replace("/app/" + app["id"]);
        });
      }
    });
  }

  render() {
    return (
      <div className="pv-direct">
        <div className="pv-direct-container">
          {this.state.error ? (<p className="pv-direct-error">Cannot find repository!</p>):
                              (<p>Getting ready for your app...</p>)}
          <Spinner/>
        </div>
      </div>
    );
  }
}

export default Direct;
