import request from 'superagent';
import ReconnectingWebSocket from 'reconnecting-websocket';

export default class ApiClient {
  constructor(appId, accessToken, authErrorCallback) {
    this.urlBase = process.env.REACT_APP_API_HTTP_SCHEME + "://" +
                   process.env.REACT_APP_API_HOST;
    this.wsBase = process.env.REACT_APP_API_WS_SCHEME + "://" +
                  process.env.REACT_APP_API_HOST;
    this.appId = appId;
    this.accessToken = accessToken;
    this.authErrorCallback = authErrorCallback;
  }

  // APIs
  getAppState(cb) {
    var url = this.urlBase + "/app/" + this.appId;
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

  updateAppName(newName, cb, conflictCb) {
    var url = this.urlBase + "/app/" + this.appId + "/name";
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send({new_name: newName}).end((err, res) => {
      if (err) {
        if (err.status === 409) {
          conflictCb();
        } if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    });
  }

  updateAppDescription(newDescription, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/description";
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send({new_description: newDescription}).end((err, res) => {
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

  updateAppIcon(file, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/icon";
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.set("Content-Type", "application/octet-stream").send(file).end((err, res) => {
      if (err) {
        if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        cb(res.body);
      }
    })
  }

  updateApp(newName, newDescription, newIcon, cb, conflictCb) {
    // For simplicity to handle name conflicts, we perform the three
    // requests sequentially.
    var namePromise;
    if (newName !== null) {
      var url = this.urlBase + "/app/" + this.appId + "/name";
      var req = request.post(url);
      if (this.accessToken !== null) {
        req = req.set("Authorization", "Bearer " + this.accessToken);
      }
      namePromise = req.send({new_name: newName});
    } else {
      namePromise = Promise.resolve(true);
    }

    var descriptionPromise;
    if (newDescription !== null) {
      var url = this.urlBase + "/app/" + this.appId + "/description";
      var req = request.post(url);
      if (this.accessToken !== null) {
        req = req.set("Authorization", "Bearer " + this.accessToken);
      }
      descriptionPromise = req.send({new_description: newDescription});
    } else {
      descriptionPromise = Promise.resolve(true);
    }

    var iconPromise
    if (newIcon !== null) {
      var url = this.urlBase + "/app/" + this.appId + "/icon";
      var req = request.post(url);
      if (this.accessToken !== null) {
        req = req.set("Authorization", "Bearer " + this.accessToken);
      }
      iconPromise = req.set("Content-Type", "application/octet-stream").send(newIcon);
    } else {
      iconPromise = Promise.resolve(true);
    }

    namePromise.then((res) => {
      if (newDescription !== null) {
        return descriptionPromise;
      } else {
        return Promise.resolve(res);
      }
    }).then((res) => {
      if (newIcon !== null) {
        return iconPromise;
      } else {
        return Promise.resolve(res);
      }
    }).then((res) => {
      cb(res.body);
    }).catch((err) => {
      if (err.status === 409) {
        conflictCb();
      } if (err.status === 401) {
        this.authErrorCallback();
      } else {
        console.error("API failure:", err);
      }
    });
  }

  enableApp(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/enable";
    var req = request.post(url);
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

  restartApp(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/update";
    var req = request.post(url);
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

  adoptApp(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/adopt";
    var req = request.post(url);
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

  deleteApp(cb) {
    var url = this.urlBase + "/app/" + this.appId;
    var req = request.delete(url);
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
        cb();
      }
    });
  }

  getAppAccess(accessCb, noAccessCb) {
    var url = this.urlBase + "/app/" + this.appId + "/access";
    var req = request.get(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.end((err, res) => {
      if (err) {
        if (err.status === 403) {
          noAccessCb();
        } else if (err.status === 401) {
          this.authErrorCallback();
        } else {
          console.error("API failure:", err);
        }
      } else {
        accessCb(res.body);
      }
    });
  }

  forkApp(envVarMap, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/fork";
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send({env_vars: envVarMap}).end((err, res) => {
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

  getFile(filePath, cb) {
    var encodedFilePath = escape(btoa(filePath));
    var url = this.urlBase + "/app/" + this.appId + "/file/" + encodedFilePath;
    var req = request.get(url).responseType("arraybuffer");
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

  saveFile(filePath, content, cb) {
    var encodedFilePath = escape(btoa(filePath));
    var url = this.urlBase + "/app/" + this.appId + "/file/" + encodedFilePath;
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send(content).end((err, res) => {
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

  moveFile(fromFile, toFile, cb) {
    var encodedFromFile = escape(btoa(fromFile));
    var url = this.urlBase + "/app/" + this.appId + "/file/" + encodedFromFile + "/move";
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }

    var input = {to: toFile};
    req.send(input).end((err, res) => {
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

  copyFile(fromFile, toFile, cb) {
    var encodedFromFile = escape(btoa(fromFile));
    var url = this.urlBase + "/app/" + this.appId + "/file/" + encodedFromFile + "/copy";
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }

    var input = {to: toFile};
    req.send(input).end((err, res) => {
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

  deleteFile(filePath, cb) {
    var encodedFilePath = escape(btoa(filePath));
    var url = this.urlBase + "/app/" + this.appId + "/file/" + encodedFilePath;
    var req = request.delete(url);
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

  getFiles(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/files";
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

  exportFiles(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/export";
    var req = request.get(url).responseType("arraybuffer");
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

  getPackages(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/packages";
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

  addPackage(name, version, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/package/" + name + "@" + version;
    var req = request.post(url);
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

  removePackage(name, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/package/" + name;
    var req = request.delete(url);
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

  getEnvVars(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/env_vars";
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

  addOrUpdateEnvVar(key, value, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/env_var/" + key;
    var req = request.post(url);
    if (this.accessToken !== null) {
      req = req.set("Authorization", "Bearer " + this.accessToken);
    }
    req.send(value).end((err, res) => {
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

  deleteEnvVar(key, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/env_var/" + key;
    var req = request.delete(url);
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

  getApis(cb) {
    var url = this.urlBase + "/app/" + this.appId + "/apis";
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

  enableApi(id, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/api/" + id;
    var req = request.post(url);
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

  disableApi(id, cb) {
    var url = this.urlBase + "/app/" + this.appId + "/api/" + id;
    var req = request.delete(url);
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

  keepAlive() {
    var url = this.urlBase + "/app/" + this.appId + "/alive";
    var req = request.post(url);
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
        // nothing to do
      }
    });
  }

  createAppStateWs(cb) {
    var url = this.wsBase + "/app/" + this.appId + "/state/ws";
    return new ReconnectingWebSocket(url, [], {
      maxReconnectingDelay: 5000
    });
  }

  createLogStreamWs() {
    var url = this.wsBase + "/app/" + this.appId + "/log/ws";
    return new ReconnectingWebSocket(url, [], {
      maxReconnectingDelay: 5000
    });
  }

  createLangServerWs() {
    var url = this.wsBase + "/app/" + this.appId + "/langserver/ws";
    return new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: 5000
    });
  }
}
