/*global CodeMirror*/
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ApiClient from './ApiClient';
import './Editor.css'

class Editor extends Component {
  constructor(props) {
    super(props);

    this.onChanges = this.onChanges.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.autoCompletionVisible = false;
    this.autoCompletionItems = [];
    this.autoCompletionTokenStartPos = null;
    this.autoCompletionList = [];
    this.completionDetailsDom = null;
    this.completionDetailsEntry = null;
  }

  onChanges(instance, changes) {
    if (this.props.onContentChange !== undefined) {
      this.props.onContentChange(this.cmEditor.getValue(), changes);
    }
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

  getFileModeInfo(fileName) {
    if (fileName === null) {
      return {
        mode: "text/plain",
        spec: "text/plain"
      };
    }

    var extension = this.getFileExtension(fileName);
    if (extension !== "") {
      var info = CodeMirror.findModeByExtension(extension);
      if (info) {
        return {
          mode: info.mode,
          spec: info.mime
        };
      } else {
        return {
          mode: "text/plain",
          spec: "text/plain"
        };
      }
    } else {
      return {
        mode: "text/plain",
        spec: "text/plain"
      };
    }
  }

  componentDidMount() {
    // initialize CodeMirror
    this.cmEditor = CodeMirror.fromTextArea(this.editorRef, {
      lineNumbers: true,
      styleActiveLine: true,
      fixedGutter: true,
      readOnly: this.props.viewerMode,
      theme: "postverta",
      extraKeys: { // Replace tab with spaces
        Tab: function(cm) {
          var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
          cm.replaceSelection(spaces);
        }
      }
    });

    var info = this.getFileModeInfo(this.props.filePath);
    this.cmEditor.setOption("mode", info.spec);
    CodeMirror.autoLoadMode(this.cmEditor, info.mode);
    this.cmEditor.setOption("value", this.props.data);
    this.cmEditor.clearHistory();
    this.cmEditor.on("changes", this.onChanges);

    if (!this.props.viewerMode) {
      this.cmEditor.on("keyup", this.onKeyUp);
      this.cmEditor.on("startCompletion", () => {
        this.autoCompletionVisible = true;
        this.hideCompletionDetails();
      });
      this.cmEditor.on("endCompletion", () => {
        this.autoCompletionVisible = false;
        this.hideCompletionDetails();
      });
      this.cmEditor.on("scroll", () => {
        // TODO: currently we cannot handle scrollign the details popup. Hide it for now.
        this.hideCompletionDetails();
      });

      this.updateDiagnostics();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filePath !== this.props.filePath) {
      // a different file. disable file change listener while we change the
      // editor content, because it is a real "change", and should not be
      // saved.
      this.cmEditor.off("changes", this.onChanges);
      var info = this.getFileModeInfo(this.props.filePath);
      this.cmEditor.setOption("mode", info.spec);
      CodeMirror.autoLoadMode(this.cmEditor, info.mode);
    }

    if (prevProps.data !== this.props.data) {
      if (this.props.data !== this.cmEditor.getValue()) {
        this.cmEditor.setValue(this.props.data);
      }
    }

    if (prevProps.filePath !== this.props.filePath) {
      // restore the file change listener, and clear history (so undo won't
      // bring back a completely different file).
      this.cmEditor.clearHistory();
      this.cmEditor.on("changes", this.onChanges);
    }

    if (prevProps.diagnostics !== this.props.diagnostics) {
      this.updateDiagnostics();
    }
  }

  render() {
    return (
      <div className="pv-editor">
        <div className="pv-editor-container">
          <textarea ref={(input) => {this.editorRef = input;}}/>
        </div>
      </div>
    );
  }

  // Auto-completion functions
  getCurrentToken() {
    // This is a wrapper of cmEditor's getTokenAt function. It takes care
    // of the special case of ".". When "." is the current token, we return
    // an empty token of type "property", so that we will trigger autocompletion.
    var token = this.cmEditor.getTokenAt(this.cmEditor.getCursor());
    if (token.string === ".") {
      token.string = "";
      token.type = "property";
      token.start = token.start + 1;
      token.end = token.start;
    }

    return token;
  }

  onKeyUp(instance, evt) {
    // Now we adopt a heuristic to decide when to show auto-completion:
    // 1) if at the end of the current token
    // 2) hitting a character or a digit or a "."
    var token = this.getCurrentToken();
    var atTokenEnd = (this.cmEditor.getCursor().ch === token.end);
    if (atTokenEnd && (evt.code.startsWith("Key") || evt.code.startsWith("Digit") || evt.code === "Period")) {
      this.cmEditor.showHint({
        hint: this.hint.bind(this),
        completeSingle: false,
        closeOnUnfocus: false
      });
    }
  }

  hint(cm, option) {
    // If we have the token cached, return the data synchronosly.
    var token = this.getCurrentToken();
    var position = this.cmEditor.getCursor();
    if (this.autoCompletionTokenStartPos !== null &&
      token.start === this.autoCompletionTokenStartPos.ch &&
      position.line === this.autoCompletionTokenStartPos.line) {
      var list = this.filterCompletion(token.string);
      var hints = [];
      for (var i = 0; i < list.length; i ++) {
        hints.push({
          text: list[i].complete.label,
          render: this.renderCompletionItem.bind(this),
          item: list[i]
        });
      }
      var data = {
        list: hints,
        from: {line: position.line, ch: token.start},
        to: {line: position.line, ch: token.end}
      };
      CodeMirror.on(data, "select", this.onCompletionSelected.bind(this));
      return data;
    } else {
      this.autoCompletionItems = [];
      this.autoCompletionTokenStartPos = null;
      if (token.type === "string" || token.type === "comment" || token.type === "number" || token.type === null) {
        return null;
      }

      if (this.props.requestAutocompletion === null) {
        return null;
      } else {
        return new Promise((resolve) => {
          var tokenStartPos = {line: position.line, ch: token.start};
          this.props.requestAutocompletion(tokenStartPos, (items) => {
            this.autoCompletionTokenStartPos = tokenStartPos;
            this.autoCompletionItems = items;
            var list = this.filterCompletion(token.string);
            var hints = [];
            for (var i = 0; i < list.length; i ++) {
              hints.push({
                text: list[i].complete.label,
                render: this.renderCompletionItem.bind(this),
                item: list[i]
              });
            }
            var data = {
              list: hints,
              from: {line: position.line, ch: token.start},
              to: {line: position.line, ch: token.end}
            };
            CodeMirror.on(data, "select", this.onCompletionSelected.bind(this));
            resolve(data);
          }, () => {
            resolve(null);
          });
        });
      }
    }
  }

  renderCompletionItem(element, self, data) {
    var itemType;
    switch (data.item.complete.kind) {
      case 1: // Text
        itemType = "text";
        break;
      case 2: // Method
        itemType = "method";
        break;
      case 3: // Function
        itemType = "function";
        break;
      case 4: // Constructor
        itemType = "constructor";
        break;
      case 5: // Field
        itemType = "field";
        break;
      case 6: // Variable
        itemType = "variable";
        break;
      case 7: // Class
        itemType = "class";
        break;
      case 8: // Interface
        itemType = "interface";
        break;
      case 9: // Module
        itemType = "module";
        break;
      case 10: // Property
        itemType = "property";
        break;
      case 11: // Unit
        itemType = "unit";
        break;
      case 12: // Value
        itemType = "value";
        break;
      case 13: // Enum
        itemType = "enum";
        break;
      case 14: // Keyword
        itemType = "keyword";
        break;
      case 15: // Snippet
        itemType = "snippet";
        break;
      case 16: // Color
        itemType = "color";
        break;
      case 17: // File
        itemType = "file";
        break;
      case 18: // Reference
        itemType = "reference";
        break;
      default:
        itemType = "file";
        break;
    }

    var iconSpan = document.createElement("span");
    iconSpan.className = "icon " + itemType;
    var textSpan = document.createElement("span");
    for (var i = 0; i < data.item.segments.length; i ++) {
      var s = data.item.segments[i];
      var text = data.text.substr(s.start, s.len);
      if (s.match) {
        var b = document.createElement("b");
        b.appendChild(document.createTextNode(text));
        textSpan.appendChild(b);
      } else {
        textSpan.appendChild(document.createTextNode(text));
      }
    }

    element.appendChild(iconSpan);
    element.appendChild(textSpan);
  }

  onCompletionSelected(data, ele) {
    if (data.item.complete.data === undefined) {
      // No more "data" to resolve. Try to display with the current data.
      if (this.autoCompletionVisible) {
        this.showCompletionDetails(data.item.complete);
      }
    } else {
      if (this.props.requestResolve !== undefined) {
        this.props.requestResolve(data.item.complete, (newComplete) => {
          // store the results back to the cache, so next time we don't need
          // re-do the network request
          if (newComplete.data === undefined) {
            delete data.item.complete["data"];
            data.item.complete.detail = newComplete.detail;
            data.item.complete.documentation = newComplete.documentation;
          }
          if (this.autoCompletionVisible) {
            this.showCompletionDetails(data.item.complete);
          }
        }, () => {});
      }
    }
  }

  showCompletionDetails(complete) {
    var hintsDomColl = document.getElementsByClassName("CodeMirror-hints");
    if (hintsDomColl.length === 0) {
      // Don't show the details if the completion window is invisible.
      return;
    }

    if (complete === this.completionDetailsEntry) {
      // Still trying to show the same entry. No need to update.
      return;
    }

    var hintsDom = hintsDomColl[0];
    if (this.completionDetailsDom !== null) {
      // Delete the old element
      document.body.removeChild(this.completionDetailsDom);
      this.completionDetailsDom = null;
      this.completionDetailsEntry = null;
    }

    if (complete.detail === undefined && complete.documentation === undefined) {
      // No detail information to show. Quit
      return;
    }
    var hintsBox = hintsDom.getBoundingClientRect();

    this.completionDetailsEntry = complete;
    this.completionDetailsDom = document.createElement("div");
    this.completionDetailsDom.className = "CodeMirror-hints-details";
    if (complete.detail !== undefined) {
      var detailDom = document.createElement("p");
      detailDom.className = "detail";
      detailDom.appendChild(document.createTextNode(complete.detail));
      this.completionDetailsDom.appendChild(detailDom);
    }
    if (complete.documentation !== undefined) {
      var docDom = document.createElement("p");
      docDom.className = "documentation";
      docDom.appendChild(document.createTextNode(complete.documentation));
      this.completionDetailsDom.appendChild(docDom);
    }
    this.completionDetailsDom.style.top = hintsBox.top + "px";
    this.completionDetailsDom.style.left = hintsBox.right + "px";
    document.body.appendChild(this.completionDetailsDom);

    // Check if we are out of the right side of the window. If so, show the details box
    // on the left side of the hints box.
    var detailsBox = this.completionDetailsDom.getBoundingClientRect();
    var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
    if (detailsBox.right > winW) {
      var detailsBoxWidth = detailsBox.right - detailsBox.left;
      this.completionDetailsDom.style.left = (hintsBox.left - detailsBoxWidth) + "px";
    }

    // Check if we are out of the bottom side of the window. If so, align the details box
    // along the bottom edge of the hints box.
    var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
    if (detailsBox.bottom > winH) {
      this.completionDetailsDom.style.top = (hintsBox.bottom - detailsBox.height) + "px";
    }
  }

  hideCompletionDetails() {
    if (this.completionDetailsDom !== null) {
      document.body.removeChild(this.completionDetailsDom);
      this.completionDetailsDom = null;
      this.completionDetailsEntry = null;
    }
  }

  filterCompletion(tokenString) {
    var matchList = [];
    var tokenLowerCase = tokenString.toLowerCase();
    for (var i = 0; i < this.autoCompletionItems.length; i ++) {
      var item = this.autoCompletionItems[i];
      var labelLowerCase = item.label.toLowerCase();
      var matchItem = {
        complete: item,
        sortOrder: item.sortText,
        segments: []
      };
      var pos = labelLowerCase.indexOf(tokenLowerCase);
      if (pos === 0) {
        matchItem.matchOrder = 0;
        matchItem.segments.push({
          start: 0,
          len: tokenLowerCase.length,
          match:true
        });
        if (labelLowerCase.length > tokenLowerCase.length) {
          matchItem.segments.push({
            start: tokenLowerCase.length,
            len: labelLowerCase.length - tokenLowerCase.length,
            match: false
          });
        }
      } else if (pos !== -1) {
        matchItem.matchOrder = 1;
        matchItem.segments.push({
          start: 0,
          len: pos,
          match: false
        });
        matchItem.segments.push({
          start: pos,
          len: tokenLowerCase.length,
          match: true
        });
        if (labelLowerCase.length > pos + tokenLowerCase.length) {
          matchItem.segments.push({
            start: pos + tokenLowerCase.length,
            len: labelLowerCase.length - pos - tokenLowerCase.length,
            match: false
          });
        }
      } else {
        // turn the tokenString into a regex, for the most liberal match
        var chars = tokenLowerCase.split('');
        var escapedChars = [];
        for (var j = 0; j < chars.length; j ++) {
          escapedChars.push("(" + chars[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ")");
        }
        var r = new RegExp(escapedChars.join('(.*)'));
        var m = labelLowerCase.match(r);
        if (m === null) {
          continue;
        }

        if (m.index !== 0) {
          matchItem.segments.push({
            start: 0,
            len: m.index,
            match: false
          });
        }

        var start = m.index;
        var length = 0;
        var currentStart = start;
        for (var j = 1; j < m.length; j ++) {
          length ++;
          if (j !== m.length - 1) {
            j ++;
            if (m[j].length !== 0) {
              matchItem.segments.push({start: start, len: length, match: true});
              matchItem.segments.push({start: start + length, len: m[j].length, match: false});
              start = start + length + m[j].length;
              length = 0;
            }
          }
        }
        if (length !== 0) {
          matchItem.segments.push({start: start, len: length, match: true});
          if (labelLowerCase.length > start + length) {
            matchItem.segments.push({start: start + length, len: labelLowerCase.length - start - length, match: false});
          }
        }

        matchItem.matchOrder = 2;
      }

      matchList.push(matchItem);
    }

    // First sort by sortOrder, then matchOrder, then alphabetically (lowercase takes priority)
    var sortFunc = (a, b) => {
      if (a.sortOrder < b.sortOrder) {
        return -1;
      } else if (a.sortOrder > b.sortOrder) {
        return 1;
      } else {
        if (a.matchOrder < b.matchOrder) {
          return -1;
        } else if (a.matchOrder > b.matchOrder) {
          return 1;
        } else {
          if (a.complete.label.toLowerCase() < b.complete.label.toLowerCase()) {
            return -1;
          } else if (a.complete.label.toLowerCase() > b.complete.label.toLowerCase()) {
            return 1;
          } else {
            if (a.complete.label < b.complete.label) {
              return 1;
            } else if (a.complete.label > b.complete.label) {
              return -1;
            } else {
              return 0;
            }
          }
        }
      }
    };

    return matchList.sort(sortFunc);
  }

  // Diagnostics methods
  updateDiagnostics() {
    // First remove all old marks
    var marks = this.cmEditor.getAllMarks();
    for (var i = 0; i < marks.length; i ++) {
      marks[i].clear();
    }

    if (this.props.diagnostics === undefined) {
      return;
    }

    for (var i = 0; i < this.props.diagnostics.length; i ++) {
      var diag = this.props.diagnostics[i];
      var className;
      if (diag.severity === 1) {
        // Error
        className = "CodeMirror-diagnostics-error";
      } else if (diag.severity === 2) {
        // Warning
        className = "CodeMirror-diagnostics-warning";
      } else {
        // Ignore "Information" and "Hint" for now
        continue;
      }

      var start = {
        line: diag.range.start.line,
        ch: diag.range.start.character
      };
      var end = {
        line: diag.range.end.line,
        ch: diag.range.end.character
      };
      this.cmEditor.markText(start, end, {
        className: className
      });
    }
  }
}

Editor.propTypes = {
  apiClient: PropTypes.instanceOf(ApiClient).isRequired,
  data: PropTypes.string.isRequired,
  filePath: PropTypes.string.isRequired,
  viewerMode: PropTypes.bool.isRequired,
  diagnostics: PropTypes.array,
  onContentChange: PropTypes.func,
  requestAutocompletion: PropTypes.func,
  requestResolve: PropTypes.func
}

export default Editor;
