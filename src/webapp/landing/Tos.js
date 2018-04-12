import React, { Component } from 'react';
import TosMd from './policies/tos.md';
import Markdown from 'react-remarkable';
import './Tos.css';

class Tos extends Component {
  render() {
    return (
      <div className="pv-landing-tos">
        <div className="pv-landing-container">
          <Markdown source={TosMd} options={{html: true}}/>
        </div>
      </div>
    );
  }
}

export default Tos;
