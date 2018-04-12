import ApiClient from './ApiClient';

class LangManager {
  constructor(apiClient) {
    this.rootPath = "/langserver";
    this.appPath = "/langserver/app";
    this.apiClient = apiClient;
    this.ws = null;
    this.pingTimer = null;
    this.pingExpTimer = null;

    this.initialized = false;
    this.jsonRpcId = 0;
    this.jsonRpcCallbacks = {};
    this.jsonRpcCancelledCallbacks = {};

    this.ongoingCompletionReqId = null;
    this.ongoingResolveReqId = null;
    this.currentFile = null;
    this.currentData = null;
    this.fileVersion = {};
    this.onDiagnosticsCallback = null;
  }

  // Internal methods
  toUri(filePath) {
    return "file://" + this.appPath + "/" + filePath;
  }

  kickPingTimer() {
    if (this.pingTimer !== null) {
      clearTimeout(this.pingTimer);
    }

    this.pingTimer = setTimeout(() => {
      // The API doesn't allow us to send the ping control message.
      // Send a regular text message instead.
      this.ws.send("_ping");
      if (this.pingExpTimer !== null) {
        clearTimeout(this.pingExpTimer);
      }

      this.pingExpTimer = setTimeout(() => {
        // Takes too long for the pong to come back. Close the conection.
        this.pingExpTimer = null;
        console.log("close the connection");
        this.ws.close();
      }, 5000);
    }, 5000);
  }

  cancelPingTimer() {
    if (this.pingTimer !== null) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pingExpTimer !== null) {
      clearTimeout(this.pingExpTimer);
      this.pingExpTimer = null;
    }
  }

  jsonRpcCall(method, params, callback, cancelledCallback) {
    var reqId = this.jsonRpcId;
    var req = {
      jsonrpc: "2.0",
      id: reqId,
      method: method,
      params: params
    };

    this.jsonRpcCallbacks[this.jsonRpcId] = callback;
    if (cancelledCallback !== undefined) {
      this.jsonRpcCancelledCallbacks[this.jsonRpcId] = cancelledCallback;
    }
    this.jsonRpcId ++;

    this.ws.send(JSON.stringify(req));
    return reqId;
  }

  jsonRpcNotify(method, params) {
    var req = {
      jsonrpc: "2.0",
      method: method,
      params: params
    };

    this.ws.send(JSON.stringify(req));
  }

  onWsOpen() {
    this.lspInitialize((resp) => {
      this.initialized = true;
      if (this.currentFile !== null && this.currentData !== null) {
        this.lspDidOpen(this.currentFile, this.currentData);
      }
    });
  }

  onWsMessage(msg) {
    var resp = JSON.parse(msg);
    if (resp.id !== undefined) {
      var cb = this.jsonRpcCallbacks[resp.id];
      if (cb === undefined) {
        // This is possible, as we may have cancelled
        // the request. Ignore it.
      } else {
        delete this.jsonRpcCallbacks[resp.id];
        cb(resp);
      }
    } else if (resp.method === "textDocument/publishDiagnostics") {
      if (this.currentFile === null || this.toUri(this.currentFile) !== resp.params.uri) {
        // the target file is already closed, ignore the message
        return;
      }

      if (this.onDiagnosticsCallback !== null) {
        this.onDiagnosticsCallback(resp.params.diagnostics);
      }
    } // Ignore other messages
  }

  // Wrappers for LSP RPC calls
  lspInitialize(callback) {
    var initParams = {
      processId: null,
      rootPath: this.rootPath,
      rootUri: "file://" + this.rootPath,
      capabilities: {
        textDocument: {
          synchronization: {
            didSave: true
          },
          completion: {
            completionItem: {
              snippetSupport: true
            }
          }
        }
      }
    };

    this.jsonRpcCall("initialize", initParams, callback);
  }

  lspDidOpen(fileName, fileContent, version) {
    var didOpenParams = {
      textDocument: {
        uri: this.toUri(fileName),
        languageId: "javascript",
        version: 1,
        text: fileContent
      }
    };
    
    this.jsonRpcNotify("textDocument/didOpen", didOpenParams);
  }

  lspDidChange(fileName, changes, version) {
    var didChangeParams = {
      textDocument: {
        uri: this.toUri(fileName),
        version: version,
      },
      contentChanges: changes
    };

    this.jsonRpcNotify("textDocument/didChange", didChangeParams);
  }

  lspDidSave(fileName, version) {
    var didSaveParams = {
      textDocument: {
        uri: this.toUri(fileName),
        version: version,
      }
    };

    this.jsonRpcNotify("textDocument/didSave", didSaveParams);
  }

  lspDidClose(fileName) {
    var didCloseParams = {
      textDocument: {
        uri: this.toUri(fileName)
      }
    };

    this.jsonRpcNotify("textDocument/didClose", didCloseParams);
  }

  lspCompletion(fileName, position, callback, cancelledCallback) {
    var completionParams = {
      textDocument: {
        uri: this.toUri(fileName)
      },
      position: position
    };

    return this.jsonRpcCall("textDocument/completion", completionParams, callback, cancelledCallback);
  }

  lspResolve(item, callback, cancelledCallback) {
    return this.jsonRpcCall("completionItem/resolve", item, callback, cancelledCallback);
  }

  lspCancelRequest(reqId) {
    this.jsonRpcNotify("$/cancelRequest", {id: reqId});
  }

  cancelRequest(reqId) {
    this.lspCancelRequest(reqId);
    delete this.jsonRpcCallbacks[reqId];
    if (this.jsonRpcCancelledCallbacks[reqId] !== undefined) {
      this.jsonRpcCancelledCallbacks[reqId]();
      delete this.jsonRpcCancelledCallbacks[reqId];
    }
  }

  // APIs
  init(onDiagnosticsCallback) {
    if (onDiagnosticsCallback !== undefined) {
      this.onDiagnosticsCallback = onDiagnosticsCallback;
    }

    this.ws = this.apiClient.createLangServerWs();
    this.ws.addEventListener("message", (msg) => {
      if (msg.data === "_pong") {
        // Special heartbeat message, cancel expiration timer
        if (this.pingExpTimer !== null) {
          clearTimeout(this.pingExpTimer);
          this.pingExpTimer = null;
        }

        // Kick the next ping timer
        this.kickPingTimer();
      } else {
        this.onWsMessage(msg.data);
      }
    });
    this.ws.addEventListener("open", (evt) => {
      this.onWsOpen();

      // kick off ping timer
      this.kickPingTimer();
    });
    this.ws.addEventListener("close", (evt) => {
      this.initialized = false;
      this.cancelPingTimer();
    });
  }

  close() {
    this.onDiagnosticsCallback = null;

    if (this.ws !== null) {
      this.ws.close(1000, '', {keepClosed: true});
      this.ws = null;
      this.initialized = false;
      this.cancelPingTimer();
    }
  }

  restart() {
    // we simply close the current connection, which will automatically reconnect
    if (this.ws !== null) {
      this.ws.close();
    }
  }

  fileOpened(fileName, data) {
    if (this.currentFile !== null && this.initialized) {
      // Opening a new file effectively means closing the old one.
      this.lspDidClose(this.currentFile);
      this.currentFile = null;
      this.currentData = null;
    }

    this.currentFile = fileName;
    this.currentData = data;
    if (this.fileVersion[fileName] === undefined) {
      this.fileVersion[fileName] = 0;
    }

    if (this.initialized) {
      this.lspDidOpen(fileName, data, this.fileVersion[fileName]);
    }
  }

  fileChanged(data, changes) {
    this.fileVersion[this.currentFile] ++;
    this.currentData = data;
    if (this.initialized) {
      // Need to translate CodeMirror changes to LSP changes
      var lspChanges = [];
      for (var i = 0; i < changes.length; i ++) {
        var change = changes[i];
        var lspChange = {
          range: {
            start: {
              line: change.from.line,
              character: change.from.ch
            },
            end: {
              line: change.to.line,
              character: change.to.ch
            }
          },
          text: change.text.length === 1 ? change.text[0] : change.text.join("\n")
        }

        lspChanges.push(lspChange);
      }

      //this.lspDidChange(this.currentFile, lspChanges, this.fileVersion[this.currentFile]);
      this.lspDidChange(this.currentFile, [{text: data}], this.fileVersion[this.currentFile]);
    }
  }

  fileSaved() {
    if (this.initialized) {
      this.lspDidSave(this.currentFile, this.fileVersion[this.currentFile]);
    }
  }

  requestCompletion(position, callback, cancelledCallback) {
    if (!this.initialized || this.currentFile === null) {
      return;
    }

    if (this.ongoingCompletionReqId !== null) {
      // We don't want to have more than one completion request in the pipeline. Cancel it.
      this.cancelRequest(this.ongoingCompletionReqId);
    }

    // Translate CodeMirror's cursor to LSP format
    var lspPosition = {
      line: position.line,
      character: position.ch
    };

    this.ongoingCompletionReqId = this.lspCompletion(this.currentFile, lspPosition, (resp) => {
      this.ongoingCompletionReqId = null;
      callback(resp.result.items);
    }, () => {
      this.ongoingCompletionReqId = null;
      cancelledCallback();
    });
  }

  requestResolve(item, callback, cancelledCallback) {
    if (!this.initialized || this.currentFile === null) {
      return;
    }

    if (this.ongoingResolveReqId !== null) {
      this.cancelRequest(this.ongoingResolveReqId);
    }

    this.ongoingResolveReqId = this.lspResolve(item, (resp) => {
      this.ongoingResolveReqId = null;
      callback(resp.result);
    }, () => {
      this.ongoingResolveReqId = null;
      cancelledCallback();
    });
  }
}

export default LangManager;