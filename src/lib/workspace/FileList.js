import React, { Component } from 'react';
import ApiClient from './ApiClient';
import PropTypes from 'prop-types';
import { Popover, Dialog, Position, Menu, MenuItem, Intent } from '@blueprintjs/core';
import './FileList.css'

class FileList extends Component {
  constructor(props) {
    super(props);

    var specialFiles = ["Package"];
    if (!this.props.viewerMode && !this.props.embedded) {
      specialFiles.push("Config");
    }
    if (this.props.user !== null && this.props.user.app_metadata &&
        this.props.user.app_metadata.beta === true) {
      specialFiles.push("API");
    }

    this.state = {
      selected: null,
      loaded: false,
      newFileName: "",
      existingFileDialogOpened: false,
      existingFileCase: "",
      moveFileFrom: "",
      moveFileTo: "",
      moveFileDialogOpened: false,
      copyFileFrom: "",
      copyFileTo: "",
      copyFileDialogOpened: false,
      deleteFileName: "",
      deleteFileDialogOpened: false,
      files: [],
      specialFiles: specialFiles
    };
  }

  getFileExtension(fileName) {
    var segments = fileName.split("/");
    var name = segments[segments.length - 1];
    var parts = name.split(".");
    if (parts.length <= 1) {
      return "";
    } else {
      return parts[parts.length - 1];
    }
  }

  loadFileList() {
    this.props.apiClient.getFiles((data) => {
      data.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
      this.setState({files: data, loaded: true});

      if (data.length > 0 &&
          (this.state["selected"] === null ||
           data.indexOf(this.state["selected"]) === -1)) {
        var readmeIndex = -1;
        for (var i = 0; i < data.length; i ++) {
          if (data[i].toLowerCase() === "readme.md") {
            readmeIndex = i;
            break;
          }
        }

        if (readmeIndex !== -1) {
          this.setState({selected: data[readmeIndex]});
          this.props.onSelection(data[readmeIndex]);
        } else {
          this.setState({selected: data[0]});
          this.props.onSelection(data[0]);
        }
      }
    })
  }

  createFile(fileName) {
    if (window.analytics !== undefined) {
      window.analytics.track("app - new file", {
        file_name: fileName,
        file_type: this.getFileExtension(fileName)
      });
    }

    this.props.apiClient.saveFile(fileName, "", (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.loadFileList();
      this.setState({selected: fileName});
      this.props.onSelection(fileName);
    });
  }

  moveFile(fileFrom, fileTo) {
    if (window.analytics !== undefined) {
      window.analytics.track("app - move file", {
        file_name_from: fileFrom,
        file_name_to: fileTo,
        file_type_from: this.getFileExtension(fileFrom),
        file_type_to: this.getFileExtension(fileTo)
      });
    }

    this.props.apiClient.moveFile(fileFrom, fileTo, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.loadFileList();
      this.setState({selected: fileTo});
      this.props.onSelection(fileTo);
    });
  }

  copyFile(fileFrom, fileTo) {
    if (window.analytics !== undefined) {
      window.analytics.track("app - copy file", {
        file_name_from: fileFrom,
        file_name_to: fileTo,
        file_type_from: this.getFileExtension(fileFrom),
        file_type_to: this.getFileExtension(fileTo)
      });
    }

    this.props.apiClient.copyFile(fileFrom, fileTo, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.loadFileList();
      this.setState({selected: fileTo});
      this.props.onSelection(fileTo);
    });
  }

  deleteFile(fileName) {
    if (window.analytics !== undefined) {
      window.analytics.track("app - delete file", {
        file_name: fileName,
        file_type: this.getFileExtension(fileName)
      });
    }

    this.props.apiClient.deleteFile(fileName, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.loadFileList();
    });
  }

  onItemClick(fileName) {
    if (this.state["fileName"] !== fileName) {
      this.setState({selected: fileName});
      this.props.onSelection(fileName);

      if (window.analytics !== undefined) {
        if (fileName === "special.Package") {
          window.analytics.track("app - open packages");
        } else if (fileName === "special.Config") {
          window.analytics.track("app - open config");
        } else {
          window.analytics.track("app - open file", {
            file_name: fileName,
            file_type: this.getFileExtension(fileName)
          });
        }
      }
    }
  }

  componentDidMount() {
    this.loadFileList();
  }

  getSpecialFileIcon(fileName) {
    if (fileName === "Package") {
      return "pt-icon-box";
    } else if (fileName === "Config") {
      return "pt-icon-properties";
    } else if (fileName === "API") {
      return "pt-icon-cloud";
    }
  }

  getFileIcon(fileName) {
    var extension = this.getFileExtension(fileName);
    if (extension === "md") {
      return "pt-icon-manual";
    } else if (extension === "ico" || extension === "jpeg" ||
    extension === "jpg" || extension === "svg" ||
    extension === "png" || extension === "gif") {
      return "pt-icon-media";
    } else if (extension === "gz" || extension === "tar" ||
    extension === "zip" || extension === "7z") {
      return "pt-icon-compressed";
    } else {
      return "pt-icon-document";
    }
  }

  onCreateFile() {
    var fileName = this.state["newFileName"];
    if (fileName === "") {
      // no effect
    } else {
      if (this.state["files"].indexOf(fileName) !== -1) {
        this.setState({existingFileDialogOpened: true, existingFileCase: "create"});
      } else {
        this.setState({newFileName: ""});
        this.createFile(fileName);
      }
    }
  }

  onOverwriteFile() {
    if (this.state["existingFileCase"] === "create") {
      this.setState({newFileName: ""});
      this.createFile(this.state["newFileName"]);
    } else if (this.state["existingFileCase"] === "move") {
      this.setState({moveFileFrom: "", moveFileTo: ""});
      this.moveFile(this.state["moveFileFrom"], this.state["moveFileTo"]);
    } else if (this.state["existingFileCase"] === "copy") {
      this.setState({copyFileFrom: "", copyFileTo: ""});
      this.copyFile(this.state["copyFileFrom"], this.state["copyFileTo"]);
    }
    this.setState({"existingFileDialogOpened": false});
  }

  onMoveFile(fileName) {
    this.setState({
      moveFileFrom: fileName,
      moveFileTo: fileName,
      moveFileDialogOpened: true
    });
  }

  onMoveFileTo() {
    var fileFrom = this.state["moveFileFrom"];
    var fileTo = this.state["moveFileTo"];
    if (this.state["files"].indexOf(fileTo) !== -1) {
      this.setState({existingFileDialogOpened: true, existingFileCase: "move"});
    } else {
      this.setState({moveFileFrom: "", moveFileTo: ""});
      this.moveFile(fileFrom, fileTo);
    }
    this.setState({moveFileDialogOpened: false});
  }

  onCopyFile(fileName) {
    this.setState({
      copyFileFrom: fileName,
      copyFileTo: fileName,
      copyFileDialogOpened: true
    });
  }

  onCopyFileTo() {
    var fileFrom = this.state["copyFileFrom"];
    var fileTo = this.state["copyFileTo"];
    if (this.state["files"].indexOf(fileTo) !== -1) {
      this.setState({existingFileDialogOpened: true, existingFileCase: "copy"});
    } else {
      this.setState({copyFileFrom: "", copyFileTo: ""});
      this.copyFile(fileFrom, fileTo);
    }
    this.setState({copyFileDialogOpened: false});
  }

  onDeleteFile(fileName) {
    this.setState({
      deleteFileName: fileName,
      deleteFileDialogOpened: true
    });
  }

  onDeleteFileConfirmed() {
    this.deleteFile(this.state["deleteFileName"]);
    this.setState({
      deleteFileName: "",
      deleteFileDialogOpened: false
    });
  }

  render() {
    if (!this.state.loaded) {
      return (
        <ul className="pt-menu pv-filelist"></ul>
      );
    }

    var specialItems = this.state["specialFiles"].map((fileName) => {
      var specialFileName = "special." + fileName;
      var classes = [
        "pt-menu-item",
        "pt-icon-standard",
        "pv-filelist-fileitem",
        this.getSpecialFileIcon(fileName)
      ];
      if (this.state["selected"] === specialFileName) {
        classes.push("pt-active");
      }
      return (
        <li key={specialFileName}>
          <a className={classes.join(" ")} onClick={this.onItemClick.bind(this, specialFileName)}>
            <em>{fileName}</em>
          </a>
        </li>
      )
    });

    var items = this.state["files"].map((fileName) => {
      var classes = [
        "pt-menu-item",
        "pt-icon-standard",
        "pv-filelist-fileitem",
        this.getFileIcon(fileName)
      ];
      if (this.state["selected"] === fileName) {
        classes.push("pt-active");
      }
      return (
        <li key={fileName}>
          <a className={classes.join(" ")} onClick={this.onItemClick.bind(this, fileName)}>
            {fileName}
            {!this.props.viewerMode &&
              (<span className="pt-menu-item-label pv-filelist-fileitem-dropdown">
                <Popover position={Position.RIGHT} inheritDarkTheme={false}>
                  <span className="pt-icon-caret-down pt-icon-standard"></span>
                  <Menu className="pv-filelist-fileitem-menu">
                    <MenuItem text="Move" onClick={this.onMoveFile.bind(this, fileName)}/>
                    <MenuItem text="Copy" onClick={this.onCopyFile.bind(this, fileName)}/>
                    <MenuItem text="Delete" intent={Intent.DANGER} onClick={this.onDeleteFile.bind(this, fileName)}/>
                  </Menu>
                </Popover>
              </span>)}
          </a>
        </li>
      );
    });

    return (
      <ul className="pt-menu pv-filelist">
        <Dialog title={"Move file " + this.state["moveFileFrom"] + " to"} isOpen={this.state["moveFileDialogOpened"]}>
          <div className="pt-dialog-body">
            <input style={{width:"100%"}} className="pt-input" value={this.state["moveFileTo"]} type="text" dir="auto"
            onChange={evt => {this.setState({moveFileTo: evt.target.value});}}/>
          </div>
          <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
              <button className="pt-button pt-intent-warning"
               onClick={this.onMoveFileTo.bind(this)}>Move</button>
              <button className="pt-button"
               onClick={() => {this.setState({"moveFileDialogOpened": false})}}>Cancel</button>
            </div>
          </div>
        </Dialog>

        <Dialog title={"Copy file " + this.state["copyFileFrom"] + " to"} isOpen={this.state["copyFileDialogOpened"]}>
          <div className="pt-dialog-body">
            <input style={{width:"100%"}} className="pt-input" value={this.state["copyFileTo"]} type="text" dir="auto"
            onChange={evt => {this.setState({copyFileTo: evt.target.value});}}/>
          </div>
          <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
              <button className="pt-button pt-intent-warning"
               onClick={this.onCopyFileTo.bind(this)}>Copy</button>
              <button className="pt-button"
               onClick={() => {this.setState({"copyFileDialogOpened": false})}}>Cancel</button>
            </div>
          </div>
        </Dialog>

        <Dialog title="Warning" isOpen={this.state["deleteFileDialogOpened"]}>
          <div className="pt-dialog-body">
            {"Do you really want to delete " + this.state["deleteFileName"] + "?"}
          </div>
          <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
              <button className="pt-button pt-intent-danger"
               onClick={this.onDeleteFileConfirmed.bind(this)}>Delete</button>
              <button className="pt-button"
               onClick={() => {this.setState({"deleteFileDialogOpened": false})}}>Cancel</button>
            </div>
          </div>
        </Dialog>

        <li className="pt-menu-header">
          {!this.props.viewerMode &&
            (<Popover position={Position.BOTTOM_LEFT} inheritDarkTheme={false}>
              <button className="pt-button pt-intent-primary">New File</button>
              <div className="pv-filelist-popup">
                <p className="pv-filelist-popup-title">File path and name:</p>
                <form onSubmit={evt => {this.onCreateFile(); evt.preventDefault();}}>
                  <input className="pt-input" value={this.state["newFileName"]}
                  type="text" placeholder="src/helloworld.js" dir="auto"
                  onChange={evt => {this.setState({newFileName: evt.target.value});}}/>
                  <button type="submit"
                   className="pt-button pt-intent-primary pv-filelist-create-button pt-popover-dismiss">
                   Create</button>
                </form>
              </div>
            </Popover>)}
          <Dialog title="File already exists" isOpen={this.state["existingFileDialogOpened"]}>
            <div className="pt-dialog-body">Do you want to overwrite the file?</div>
            <div className="pt-dialog-footer">
              <div className="pt-dialog-footer-actions">
                <button className="pt-button pt-intent-danger"
                  onClick={this.onOverwriteFile.bind(this)}>Overwrite</button>
                <button className="pt-button"
                  onClick={() => {this.setState({"existingFileDialogOpened": false})}}>Cancel</button>
              </div>
            </div>
          </Dialog>
        </li>

        {specialItems}
        {items}

      </ul>);
  }
}

FileList.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  viewerMode: PropTypes.bool.isRequired,
  embedded: PropTypes.bool.isRequired,
  user: PropTypes.object,
  onSelection: PropTypes.func.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

export default FileList;
