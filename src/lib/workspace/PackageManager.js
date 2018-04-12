import React, { Component } from 'react';
import ApiClient from './ApiClient';
import PropTypes from 'prop-types';
import { AnchorButton, Tooltip, Button, Intent, Popover, Position } from '@blueprintjs/core';
import request from 'superagent';
import './PackageManager.css'

class PackageEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      "removing": false
    }
  }

  onRemove() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - remove package", {
        package_name: this.props.name
      });
    }

    this.setState({"removing": true});
    this.props.apiClient.removePackage(this.props.name, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      if (this.props.onPackageChange !== undefined) {
        this.props.onPackageChange();
      }
      
      this.setState({"removing": false});
      this.props.onRemove();
    });
  }

  render() {
    var removeTooltip = "";
    if (this.props.package.api !== null) {
      removeTooltip = (<p className="pv-packagemanager-remove-tooltip">
                         {"The package cannot be removed because it is required by " +
                          this.props.package.api + " API.\n" +
                          "Disable the API will remove the package."}</p>)
    }
    return (
      <tr>
        <td>
          <a target="_blank"
             href={"https://www.npmjs.com/package/" + this.props.name}>{this.props.name}
          </a>
        </td>
        <td>{this.props.package.version}</td>
        {!this.props.viewerMode &&
          (<td>
            <Tooltip content={removeTooltip} isDisabled={this.props.package.api === null}
                     position={Position.BOTTOM}>
              <AnchorButton intent={Intent.DANGER}
                      loading={this.state.removing}
                      disabled={this.props.package.api !== null}
                      onClick={this.onRemove.bind(this)}>
                Remove
              </AnchorButton>
            </Tooltip>
          </td>)}
      </tr>
    );
  }
}

PackageEntry.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  name: PropTypes.string.isRequired,
  package: PropTypes.object.isRequired,
  viewerMode: PropTypes.bool.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired,
  onPackageChange: PropTypes.func
}

class NewPackageEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      "name": "",
      "version": "",
      "adding": false,
      "searchKey": "",
      "searchResults": []
    };

    this.searchTimer = null;
  }

  onAdd() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - add package", {
        package_name: this.state.name
      });
    }

    this.setState({"adding": true});
    this.props.apiClient.addPackage(this.state.name, this.state.version, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      if (this.props.onPackageChange !== undefined) {
        this.props.onPackageChange();
      }
      this.setState({
        "name": "",
        "version": "",
        "adding": false,
        "searchKey": "",
        "searchResults": []
      });
      this.props.onAdd();
    });
  }

  searchNpm() {
    this.searchTimer = null;
    var currentKey = this.state["searchKey"];
    var options = {
      text: currentKey.split(" ").join("+"),
      size: 6,
      quality: 0.1,
      popularity: 0.9,
      maintenance: 0
    }
    var url = "https://registry.npmjs.org/-/v1/search"
    request.get(url).query(options).end((err, res) => {
      if (err) {
        console.error("API failure:", err);
      } else if (currentKey === this.state["searchKey"]) {
        this.setState({searchResults: res.body.objects});
      }
    });
  }

  onSearchChange(value) {
    if (value === "") {
      this.setState({searchResults: []});
      if (this.searchTimer !== null) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
    } else {
      if (this.searchTimer !== null) {
        clearTimeout(this.searchTimer);
      }
      this.searchTimer = setTimeout(this.searchNpm.bind(this), 100);
    }

    this.setState({searchKey: value});
  }

  onClickPackage(evt, pkg) {
    this.setState({
      name: pkg["name"],
      version: pkg["version"]
    });
    evt.preventDefault();
    return false;
  }

  render() {
    var searchResults = this.state["searchResults"].map((result) => {
      return (
        <li key={result["package"]["name"]}>
          <a href="" className="pt-menu-item pt-popover-dismiss pv-packagemanager-add-item"
           onClick={(evt) => {this.onClickPackage(evt, result["package"])}}>
           <h6>{result["package"]["name"]}</h6>
           <span className="pv-packagemanager-add-description">{result["package"]["description"]}</span>
          </a>
        </li>
      );
    });

    var nameComponent = null;
    if (this.state.name !== "") {
      nameComponent = (
        <div>
          <a target="_blank"
             href={"https://www.npmjs.com/package/" + this.state.name}>{this.state.name}</a>
          <button className="pt-button pt-icon-cross pt-minimal"
                  disabled={this.state.adding}
                  style={{marginLeft: 5}}
                  onClick={() => {
                    this.setState({
                      name: "",
                      version: "",
                      searchKey: "",
                      searchResults: []
                    })}}/>
        </div>
      );
    } else {
      nameComponent = (
        <Popover position={Position.BOTTOM_LEFT}
                 isOpen={this.state.searchKey !== "" &&
                         this.state.searchResults.length > 0}
                 enforceFocus={false} autoFocus={false}
                 inheritDarkTheme={false}
                 popoverClassName="pt-minimal">
          <input className="pt-input" disabled={this.state.adding}
                 placeholder="New package name..."
                 onChange={(evt) => {this.onSearchChange(evt.target.value);}}
                 value={this.state.searchKey}/>
          <ul className="pt-menu pv-packagemanager-add-dropdown">
            {searchResults}
          </ul>
        </Popover>
      );
    }

    return (
      <tr>
        <td>
          {nameComponent}
        </td>
        <td>
          {this.state.version}
        </td>
        <td>
          {this.state.name !== "" &&
            <Button intent={Intent.PRIMARY}
                loading={this.state.adding}
                onClick={this.onAdd.bind(this)}>
              Add
            </Button>
          }
        </td>
      </tr>
    );
  }
}

NewPackageEntry.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  onAdd: PropTypes.func.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired,
  onPackageChange: PropTypes.func
}

class PackageManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      "packages": {}
    }
  }

  componentDidMount() {
    this.onLoadPackages();
  }

  onLoadPackages() {
    this.props.apiClient.getPackages((packages) => {
      this.setState({"packages": packages});
    });
  }

  render() {
    var packageRows = Object.entries(this.state.packages).map(([name, pkg]) => {
      return (
        <PackageEntry key={name}
         apiClient={this.props.apiClient} name={name} package={pkg}
         viewerMode={this.props.viewerMode}
         onRemove={this.onLoadPackages.bind(this)}
         onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}
         onPackageChange={this.props.onPackageChange}/>
      );
    });
    return (
      <div className="pv-packagemanager pt-dark">
        <table className="pt-table pt-striped">
          <colgroup>
            <col className="pv-packagemanager-col-name"/>
            <col className="pv-packagemanager-col-version"/>
            {!this.props.viewerMode &&
             (<col className="pv-packagemanager-col-action"/>)}
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Version</th>
              {!this.props.viewerMode &&
               (<th>Action</th>)}
            </tr>
          </thead>
          <tbody>
            {!this.props.viewerMode &&
              (<NewPackageEntry apiClient={this.props.apiClient}
                               onAdd={this.onLoadPackages.bind(this)}
                               onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}
                               onPackageChange={this.props.onPackageChange}/>)}
            {packageRows}
          </tbody>
        </table>
      </div>
    );
  }
}

PackageManager.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  viewerMode: PropTypes.bool.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired,
  onPackageChange: PropTypes.func
}

export default PackageManager;
