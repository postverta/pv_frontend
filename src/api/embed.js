window.PV = (function() {
  function Editor(elementId, options) {
    var ele = document.getElementById(elementId);
    if (ele === null) {
      return null;
    }

    options = Object.assign({}, DEFAULT_OPTIONS, options);

    // Sanity check of options
    if (options.name === undefined || typeof options.name !== 'string') {
      return null;
    }

    if (options.mode === undefined || (options.mode !== 'display' && options.mode != 'clone')) {
      return null;
    }

    if (options.config !== undefined && typeof options.config !== 'object') {
      return null;
    }

    var url = options.url + "/embed/app/" + options.name;
    var params = {
      mode: options.mode
    };
    if (options.config !== undefined) {
      for (var configKey in options.config) {
        params["config_" + configKey] = options.config[configKey];
      }
    }
    var query = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
    url = url + '?' + query;

    var iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("src", url);
    iframeElement.setAttribute("frameborder", '0');
    iframeElement.setAttribute("allowfullscreen", "");
    iframeElement.setAttribute("width", options.width);
    iframeElement.setAttribute("height", options.height);
    ele.parentElement.replaceChild(iframeElement, ele);

    this.iframe = iframeElement;
    this.options = options;
    this.appUrl = null;
    this.appIsRunning = null;
    this.onMessage = function(evt) {
      if (evt.source != this.iframe.contentWindow) {
        // Not our iframe. Ignore
        return;
      }
      if (evt.data.type === "onLoad") {
        this.onLoad(evt.data);
      } else if (evt.data.type === "onRunningStateChange") {
        this.onRunningStateChange(evt.data);
      }
    };

    this.onLoad = function(data) {
      this.appUrl = data.url;
      if (this.options.events && this.options.events.onLoad) {
        this.options.events.onLoad({
          target: this,
          data: data.url
        });
      }
    }

    this.onRunningStateChange = function(data) {
      this.appIsRunning = data.running;
      if (this.options.events && this.options.events.onRunningStateChange) {
        this.options.events.onRunningStateChange({
          target: this,
          data: data.running
        });
      }
    }

    window.addEventListener("message", this.onMessage.bind(this));
  }

  const DEFAULT_OPTIONS = {
    url: "https://postverta.com",
    mode: "display",
    width: 800,
    height: 600
  };

  var pv = {
    Editor: Editor
  };

  return pv;
}());