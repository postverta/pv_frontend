import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import './LogViewer.css';
var ta = require('time-ago')();

class LogViewer extends Component {
  constructor(props) {
    super(props);

    this.maxLogLength = 500;

    this.state = {
      logLines: [],
      currentTime: new Date(),
      online: false
    };

    this.logWs = null;

    this.logTimestampRenewTimer = null;

    // always clip to the bottom for log
    this.logViewDOM = null;
    this.clipToBottom = true;

    // for incoming log batch processing. this cannot be put in
    // state because we don't want it to trigger rendering.
    this.newLogLines = [];
    this.logBatchProcessingTimer = null;
    this.pingTimer = null;
    this.pingExpTimer = null;
  }

  startTimestampRenewTimer() {
    this.logTimestampRenewTimer = setInterval(() => {
      this.setState({currentTime: new Date()});
    }, 10000);
  }

  stopTimestampRenewTimer() {
    if (this.logTimestampRenewTimer !== null) {
      clearInterval(this.logTimestampRenewTimer);
      this.logTimestampRenewTimer = null;
    }
  }

  kickPingTimer() {
    if (this.pingTimer !== null) {
      clearTimeout(this.pingTimer);
    }

    this.pingTimer = setTimeout(() => {
      // The API doesn't allow us to send the ping control message.
      // Send a regular text message instead.
      this.logWs.send("_ping");
      if (this.pingExpTimer !== null) {
        clearTimeout(this.pingExpTimer);
      }

      this.pingExpTimer = setTimeout(() => {
        // Takes too long for the pong to come back. Close the conection.
        this.pingExpTimer = null;
        this.logWs.close();
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

  handleNewLog(newLogData) {
    var newLines = newLogData.split("\n");
    for (var i = 0; i < newLines.length; i ++) {
      var line = newLines[i];
      if (line.length === 0) {
        continue;
      }

      var parts = line.split(",");
      if (parts.length < 3) {
        continue;
      }

      var entry = {
        ts: parseFloat(parts[0]),
        cmd: parts[1],
        line: parts.slice(2).join(",")
      };

      this.newLogLines.push(entry);
    }

    if (this.logBatchProcessingTimer !== null) {
      clearTimeout(this.logBatchProcessingTimer);
      this.logBatchProcessingTimer = null;
    }
    this.logBatchProcessingTimer = setTimeout(this.updateLogs.bind(this), 100);
  }

  updateLogs() {
    clearTimeout(this.logBatchProcessingTimer);
    this.logBatchProcessingTimer = null;

    var logLines = this.state["logLines"].concat(this.newLogLines);
    if (logLines.length > this.maxLogLength) {
      logLines = logLines.slice(logLines.length - this.maxLogLength);
    }

    this.newLogLines = [];
    this.setState({
      logLines: logLines,
    });

    this.props.onLogUpdated();
  }

  componentDidMount() {
    this.logWs = this.props.apiClient.createLogStreamWs();
    this.logWs.addEventListener("message", (msg) => {
      if (msg.data === "_pong") {
        // Special heartbeat message, cancel expiration timer
        if (this.pingExpTimer !== null) {
          clearTimeout(this.pingExpTimer);
          this.pingExpTimer = null;
        }

        // Kick the next ping timer
        this.kickPingTimer();
      } else {
        this.handleNewLog(msg.data);
      }
    });
    this.logWs.addEventListener("open", (evt) => {
      // clean up all old logs
      this.setState({logLines: [],
                     online: true});

      // kick off ping timer
      this.kickPingTimer();
    });
    this.logWs.addEventListener("close", (evt) => {
      this.setState({online: false});
      this.cancelPingTimer();
    });
    this.startTimestampRenewTimer();
  }

  componentWillUnmount() {
    this.logWs.close(1000, '', {keepClosed: true});
    this.logWs = null;
    this.stopTimestampRenewTimer();
    this.cancelPingTimer();
    if (this.logBatchProcessingTimer !== null) {
      clearTimeout(this.logBatchProcessingTimer);
      this.logBatchProcessingTimer = null;
    }
  }

  clearLog() {
    if (window.analytics !== undefined) {
      window.analytics.track("app - clear console");
    }

    this.setState({logLines: []});
  }

  onScroll(divRef) {
    var dom = this.logViewDOM;
    if (dom.scrollHeight - dom.scrollTop <= dom.offsetHeight) {
      this.clipToBottom = true;
    } else {
      this.clipToBottom = false;
    }
  }

  scrollToBottom(divRef) {
    this.logViewDOM = divRef;
    if (this.clipToBottom) {
      divRef.scrollTop = divRef.scrollHeight;
    }
  }

  render() {
    const lines = this.state["logLines"].map((entry, index) => {
      var className = "";
      if (entry.cmd === "npm install") {
        className = "pv-logviewer-logentry-dependency";
      } else {
        className = "pv-logviewer-logentry-runtime";
      }
      return (
        <li key={index}>
          <div className="pv-logviewer-logentry">
            <span className={className}>{entry.line}</span>
            <span className="pv-logviewer-logentry-supp">{ta.ago(Math.round(entry.ts * 1000))}</span>
          </div>
        </li>
      );
    });

    return (
      <div className="pv-logviewer">
        <div className="pv-logviewer-header pt-navbar">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">Console</div>
            <button className="pt-button pt-intent-danger pt-icon-trash" onClick={this.clearLog.bind(this)}>Clear</button>
          </div>
          <div className="pt-navbar-group pt-align-right">
            <button className="pt-button pt-minimal pt-icon-cross" onClick={this.props.onClose}></button>
          </div>
        </div>
        <div className="pv-logviewer-body" style={this.state.online ? {}:{backgroundColor: "#CED9E0"}}
             onScroll={this.onScroll.bind(this)}
             ref={(input) => {if (input !== null) this.scrollToBottom(input);}}>
          <ul>{lines}</ul>
        </div>
      </div>
    )
  }
}

LogViewer.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  onClose: PropTypes.func.isRequired,
  onLogUpdated: PropTypes.func.isRequired
};

export default LogViewer;
