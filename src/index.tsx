import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Set the title dynamically before rendering the app
document.title = "Entertainment Hub";  // Set your desired title here

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
