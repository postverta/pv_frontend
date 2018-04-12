import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './ImageViewer.css';

class ImageViewer extends Component {
  constructor(props) {
    super(props);

    this.blobURL = null;
  }

  getBlob() {
    if (this.props.data === null) {
      return null;
    }

    var mimeType = null;
    var canonicalName = this.props.filePath.toLowerCase();
    if (canonicalName.endsWith(".png")) {
      mimeType = "image/png";
    } else if (canonicalName.endsWith(".ico")) {
      mimeType = "image/x-icon";
    } else if (canonicalName.endsWith(".jpeg") || canonicalName.endsWith(".jpg")) {
      mimeType = "image/jpeg";
    } else if (canonicalName.endsWith(".bmp")) {
      mimeType = "image/bmp";
    } else if (canonicalName.endsWith(".svg")) {
      mimeType = "image/svg+xml";
    }

    return new Blob([this.props.data], {type: mimeType});
  }

  render() {
    const blob = this.getBlob();
    if (this.blobURL !== null) {
      window.URL.revokeObjectURL(this.blobURL);
    }
    if (blob !== null) {
      this.blobURL = window.URL.createObjectURL(blob);
    } else {
      this.blobURL = null;
    }

    return (
      <div className="pv-imageviewer">
        <img src={this.blobURL}/>
      </div>
    );
  }
}

ImageViewer.propTypes = {
  filePath: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired
}

export default ImageViewer;
