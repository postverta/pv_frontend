import request from 'superagent';

export default class ApiClient {
  constructor(accessToken, authErrorCallback) {
    this.urlBase = process.env.REACT_APP_API_HTTP_SCHEME + "://" +
                   process.env.REACT_APP_API_HOST;
    this.accessToken = accessToken;
    this.starterAppId = {
      "webapp": {
        "react": "4c0bfdfe-cf00-4da3-aad6-63d76989d0d3", // react-template
        "angular": "b74208e7-5fe1-4686-a681-f72eb45e92df", // angular-template
        "vue": "51c78d1d-5218-4fd2-95ee-6482a9e44458", // vue-template
        "legacy": "f0871ca9-2b22-4c2e-b58b-e8136422ae54" // legacy-template
      },
      "webhook": "bb020b7b-df6f-43d4-a9a9-9ed7a4352508", // webhook-template
      "scratch": "3cc34807-648d-4048-9737-e618455f9844" // scratch-template
    }
    this.authErrorCallback = authErrorCallback;
  }

  importGithubRepo(githubuser, githubrepo, branch, cb, errcb) {
    var url = this.urlBase + "/apps/import";
    var input = {
      githubuser: githubuser,
      githubrepo: githubrepo,
      branch: branch
    };
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send(input).end((err, res) => {
      if (err) {
        if (err.status === 400) {
          errcb();
        } else if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    });
  }

  newApp(template, framework, cb) {
    var appId = "";
    if (template === "webapp") {
      appId = this.starterAppId[template][framework];
    } else {
      appId = this.starterAppId[template];
    }
    var url = this.urlBase + "/app/" + appId + "/fork";
    var req = request.post(url).send({env_vars: {}});
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.end((err, res) => {
      if (err) {
        if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    });
  }

  getApps(cb) {
    var url = this.urlBase + "/apps";
    var req = request.get(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.end((err, res) => {
      if (err) {
        if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    });
  }

  getGalleryApps(limit, cb) {
    var url = this.urlBase + "/gallery/apps?limit=" + limit;
    var req = request.get(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.end((err, res) => {
      if (err) {
        if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    });
  }

  getUser(id, cb) {
    var url = this.urlBase + "/user/" + id;
    var req = request.get(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.end((err, res) => {
      if (err) {
        if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    });
  }
};
