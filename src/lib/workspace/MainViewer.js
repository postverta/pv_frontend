import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import Editor from './Editor';
import ImageViewer from './ImageViewer';
import MarkdownViewer from './MarkdownViewer';
import PackageManager from './PackageManager';
import ConfigManager from './ConfigManager';
import ApiManager from './ApiManager';
import LangManager from './LangManager';
import './MainViewer.css';

class MainViewer extends Component {
  constructor(props) {
    super(props);

    // store another copy of "filePath" to make it in-sync with data
    this.state = {
      filePath: null,
      data: null,
      diagnostics: []
    };

    this.saveTimer = null;
    this.langManager = new LangManager(this.props.apiClient);
  }
  
  getFileExtension(fileName) {
    var segments = fileName.split("/");
    var name = segments[segments.length - 1];
    var parts = name.split(".");
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    } else {
      return "";
    }
  }

  saveFile(filePath, fileContent, cb) {
    if (window.analytics !== undefined) {
      window.analytics.track("app - modify file", {
        file_name: filePath,
        file_type: this.getFileExtension(filePath)
      });
    }

    this.props.apiClient.saveFile(filePath, fileContent, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      if (this.isLangServerEnabled(filePath)) {
        this.langManager.fileSaved();
      }

      if (cb !== undefined) {
        cb(app);
      }
    });
  }

  onSaveTimerFired() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.saveFile(this.props.filePath, this.state.data);
  }

  onContentChange(newData, changes) {
    this.setState({data: newData});
    if (this.isLangServerEnabled(this.state.filePath)) {
      this.langManager.fileChanged(newData, changes);
    }

    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(this.onSaveTimerFired.bind(this), 1000);
  }

  onPackageChange() {
    // TODO: this is more of a hack today. We cannot let the server know
    // the package.json update, so we simply restart the LSP session.
    this.langManager.restart();
  }

  requestAutocompletion(position, callback, cancelledCallback) {
    if (this.isLangServerEnabled(this.state.filePath)) {
      this.langManager.requestCompletion(position, callback, cancelledCallback);
    } else {
      // Auto-completion not supported for the file type
      callback([]);
    }
  }

  requestResolve(item, callback, cancelledCallback) {
    if (this.isLangServerEnabled(this.state.filePath)) {
      this.langManager.requestResolve(item, callback, cancelledCallback);
    } else {
      // Resolution not supported for the file type
      callback(item);
    }
  }

  loadFile(filePath) {
    if (filePath === null) {
      this.setState({filePath: null, data: null});
      return;
    }

    if (this.isSpecial(filePath)) {
      this.setState({filePath: filePath, data: null});
      return;
    }

    this.props.apiClient.getFile(filePath, (data) => {
      if (this.isText(filePath)) {
        var text = "";
        if (data !== null) {
          var intArray = new Uint8Array(data);
          text = new TextDecoder("utf-8").decode(intArray);
        }
        data = text;
      }

      this.setState({filePath: filePath, data: data, diagnostics: []});
      if (this.isLangServerEnabled(filePath)) {
        this.langManager.fileOpened(filePath, data);
      }
    });
  }

  componentDidMount() {
    this.langManager.init((diagnostics) => {this.setState({diagnostics: diagnostics})});;
    this.loadFile(this.props.filePath);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filePath !== this.props.filePath) {
      if (this.saveTimer !== null) {
        // has pending changes for the last document. save it now.
        // delay the loading of the new data until the old data has
        // been saved. this is to avoid losing data when network is
        // down.
        // TODO: disable the editor when this is in progress. 
        this.saveFile(prevProps.filePath, this.state.data, (app) => {
          this.loadFile(this.props.filePath);
        });
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      } else {
        this.loadFile(this.props.filePath);
      }
    }
  }

  componentWillUnmount() {
    this.langManager.close();
  }

  isMarkdown(filePath) {
    return filePath.toLowerCase().endsWith(".md");
  }

  isImage(filePath) {
    var canonicalName = filePath.toLowerCase();
    return canonicalName.endsWith(".png") ||
           canonicalName.endsWith(".ico") ||
           canonicalName.endsWith(".jpeg") ||
           canonicalName.endsWith(".jpg") ||
           canonicalName.endsWith(".bmp") ||
           canonicalName.endsWith(".svg");
  }

  isText(filePath) {
    if (filePath === null) {
      return false;
    }
    return !this.isImage(filePath);
  }

  isSpecial(filePath) {
    return filePath.startsWith("special.");
  }

  isLangServerEnabled(filePath) {
    return filePath.endsWith(".js") ||
          filePath.endsWith(".ts") ||
          filePath.endsWith(".jsx");
  }

  render() {
    if (this.state["filePath"] === null) {
      return (
        <div></div>
      );
    } else if (this.isSpecial(this.state["filePath"])) {
      if (this.state["filePath"] === "special.Package") {
        return (
          <PackageManager apiClient={this.props.apiClient}
                          viewerMode={this.props.viewerMode}
                          onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}
                          onPackageChange={this.onPackageChange.bind(this)}/>
        );
      } else if (this.state["filePath"] === "special.Config") {
        if (this.props.viewerMode) {
          return (<div></div>);
        } else {
          return (
            <ConfigManager apiClient={this.props.apiClient}
                           onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>
          );
        }
      } else if (this.state["filePath"] === "special.API") {
        return (
          <ApiManager apiClient={this.props.apiClient}
                      viewerMode={this.props.viewerMode}
                      onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>
        );
      } else {
        return (<div></div>);
      }
    } else if (this.isMarkdown(this.state["filePath"])) {
      return (
        <MarkdownViewer apiClient={this.props.apiClient}
                        filePath={this.state["filePath"]} data={this.state["data"]}
                        viewerMode={this.props.viewerMode}
                        onContentChange={this.onContentChange.bind(this)}
                        requestAutocompletion={this.requestAutocompletion.bind(this)}
                        requestResolve={this.requestResolve.bind(this)}
                        diagnostics={this.state.diagnostics}/>
      );
    } else if (this.isImage(this.state["filePath"])) {
      return (
        <ImageViewer filePath={this.state["filePath"]} data={this.state["data"]}/>
      );
    } else {
      return (
        <div className="pv-mainviewer-editor-container">
          <Editor apiClient={this.props.apiClient}
           filePath={this.state["filePath"]} data={this.state["data"]}
           viewerMode={this.props.viewerMode}
           onContentChange={this.onContentChange.bind(this)}
           requestAutocompletion={this.requestAutocompletion.bind(this)}
           requestResolve={this.requestResolve.bind(this)}
           diagnostics={this.state.diagnostics}/>
        </div>
      );
    }
  }
}

MainViewer.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  filePath: PropTypes.string,
  user: PropTypes.object,
  viewerMode: PropTypes.bool.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

export default MainViewer;
