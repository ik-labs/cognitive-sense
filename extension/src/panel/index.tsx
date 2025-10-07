import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Panel } from './Panel';

console.log('CognitiveSense panel starting...');

const root = ReactDOM.createRoot(
  document.getElementById('panel-root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Panel />
  </React.StrictMode>
);

console.log('CognitiveSense panel loaded');
