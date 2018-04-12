import request from 'superagent';

export default class ApiClient {
  constructor(accessToken) {
    this.urlBase = process.env.REACT_APP_API_HTTP_SCHEME + "://" +
                   process.env.REACT_APP_API_HOST;
    this.accessToken = accessToken;
  }

  newApp(githubuser, githubrepo, description, cb) {
    var url = this.urlBase + "/apps";
    var input = {
      githubuser: githubuser,
      githubrepo: githubrepo,
      description: description
    };
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send(input).end((err, res) => {
      if (err) {
        console.error("API failure:", err);
      } else {
        cb(res.body);
      }
    });
  }
};
