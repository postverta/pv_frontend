import React, { Component } from 'react';
import ApiClient from './ApiClient';
import PropTypes from 'prop-types';
import { Button, Intent } from '@blueprintjs/core';
import './ConfigManager.css'

class NewEnvVarEntry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      busy: false,
      key: "",
      value: ""
    };
  }

  onAdd() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - add config", {
        config_key: this.state.key
      });
    }

    this.setState({busy: true});
    this.props.apiClient.addOrUpdateEnvVar(this.state.key, this.state.value, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.setState({
        key: "",
        value: "",
        busy: false
      });
      this.props.onChange();
    });
  }

  render() {
    return (
      <tr>
        <td>
          <input className="pt-input" disabled={this.state.busy}
                 placeholder="New variable name..."
                 onChange={(evt) => {this.setState({key: evt.target.value})}}
                 value={this.state.key}/>
        </td>
        <td>
          <input className="pt-input" disabled={this.state.busy}
                 placeholder="New variable value..."
                 onChange={(evt) => {this.setState({value: evt.target.value})}}
                 value={this.state.value}/>
        </td>
        <td>
          {this.state.key !== "" &&
            <Button intent={Intent.PRIMARY}
                    loading={this.state.busy}
                    onClick={this.onAdd.bind(this)}>
              Add
            </Button>
          }
        </td>
      </tr>
    );
  }
}

NewEnvVarEntry.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  onChange: PropTypes.func.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

class EnvVarEntry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      busy: false,
      value: this.props.entry.value
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.entry.value !== this.props.entry.value) {
      this.setState({
        value: this.props.entry.value
      });
    }
  }

  onUpdate() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - update config", {
        config_key: this.props.entry.key
      });
    }

    this.setState({busy: true});
    this.props.apiClient.addOrUpdateEnvVar(this.props.entry.key, this.state.value, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.setState({busy: false});
      this.props.onChange();
    });
  }

  onDelete() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - remove config", {
        config_key: this.props.entry.key
      });
    }

    this.setState({busy: true});
    this.props.apiClient.deleteEnvVar(this.props.entry.key, (app) => {
      this.props.onSourceTimestampUpdated(app.source_timestamp);
      this.setState({busy: false});
      this.props.onChange();
    });
  }

  render() {
    return (
      <tr>
        <td>
          {this.props.entry.key}
        </td>
        <td>
          <input className="pt-input" disabled={this.state.busy}
                 placeholder="Value of the variable..."
                 onChange={(evt) => {this.setState({value: evt.target.value})}}
                 value={this.state.value}/>
        </td>
        <td>
          <div className="pv-configmanager-envvarentry-button-container">
          {this.state.value !== this.props.entry.value &&
            <Button intent={Intent.WARNING}
                    loading={this.state.busy}
                    onClick={this.onUpdate.bind(this)}>
              Update
            </Button>
          }
          {this.props.deletable &&
            <Button intent={Intent.DANGER}
                    loading={this.state.busy}
                    onClick={this.onDelete.bind(this)}>
              Remove
            </Button>
          }
          </div>
        </td>
      </tr>
    );
  }
}

EnvVarEntry.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  entry: PropTypes.object.isRequired,
  deletable: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

class EnvVarGroup extends Component {
  render() {
    var entries = null;
    if (this.props.group !== undefined) {
      entries = this.props.group.map((entry) => {
        if (this.props.isSystem) {
          return (
            <tr key={entry.key}>
              <td>{entry.key}</td>
              <td>{entry.value}</td>
              <td></td>
            </tr>
          );
        } else {
          return (<EnvVarEntry key={entry.key}
                               apiClient={this.props.apiClient}
                               entry={entry}
                               deletable={this.props.isDefault}
                               onChange={this.props.onChange}
                               onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>);
        }
      });
    }
    var newEntry = null;
    if (this.props.isDefault) {
      newEntry = (<NewEnvVarEntry apiClient={this.props.apiClient}
                                  onChange={this.props.onChange}
                                  onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>);
    }

    var title;
    if (this.props.isSystem) {
      title = "System environmental variables";
    } else if (this.props.isDefault) {
      title = "User environmental Variables";
    } else {
      var upper = this.props.groupName.charAt(0).toUpperCase() + this.props.groupName.slice(1);
      title = upper + " API Configurations";
    }

    return (
      <div className="pv-configmanager-envvargroup">
        <h2>{title}</h2>
        <table className="pt-table pt-striped">
          <colgroup>
            <col className="pv-configmanager-col-name"/>
            <col className="pv-configmanager-col-value"/>
            <col className="pv-configmanager-col-action"/>
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              {this.props.isSystem ? (<th></th>) : (<th>Action</th>)}
            </tr>
          </thead>
          <tbody>
            {newEntry}
            {entries}
          </tbody>
        </table>
      </div>
    );
  }
}

EnvVarGroup.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  group: PropTypes.array.isRequired,
  groupName: PropTypes.string,
  isDefault: PropTypes.bool.isRequired,
  isSystem: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

class ConfigManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      envVarGroups: {
        _default: [],
        _system: []
      }
    };
  }

  componentDidMount() {
    this.onLoadEnvVars();
  }

  onLoadEnvVars() {
    this.props.apiClient.getEnvVars((results) => {
      this.setState({envVarGroups: results});
    });
  }

  render() {
    var systemGroup = <EnvVarGroup apiClient={this.props.apiClient}
                        group={this.state.envVarGroups["_system"]}
                        onChange={this.onLoadEnvVars.bind(this)}
                        isSystem={true}
                        isDefault={false}
                        onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>
    var defaultGroup = <EnvVarGroup apiClient={this.props.apiClient}
                         group={this.state.envVarGroups["_default"]}
                         onChange={this.onLoadEnvVars.bind(this)}
                         isSystem={false}
                         isDefault={true}
                         onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>
    var groups = Object.keys(this.state.envVarGroups).map((groupName) => {
      if (groupName === "_default" || groupName === "_system") {
        return null;
      }
      var group = this.state.envVarGroups[groupName];
      return (<EnvVarGroup key={groupName} apiClient={this.props.apiClient}
                           group={group} groupName={groupName}
                           onChange={this.onLoadEnvVars.bind(this)}
                           isSystem={false}
                           isDefault={false}
                           onSourceTimestampUpdated={this.props.onSourceTimestampUpdated}/>);
    });

    return (
      <div className="pv-configmanager pt-dark">
        {systemGroup}
        {defaultGroup}
        {groups}
      </div>
    );
  }
}

ConfigManager.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  onSourceTimestampUpdated: PropTypes.func.isRequired
}

export default ConfigManager;
