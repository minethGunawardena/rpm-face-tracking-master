import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Updated imports for React Router v6
import AvatarPage from './Pages/avatarPage/AvatarPage';
import VirtualParentRecordings from './Pages/VirtualParentRecordingsPage/VirtualParentRecordings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation links */}
        <nav>
          <ul>
            <li>
              <Link to="/">Avatar Page</Link>
            </li>
            <li>
              <Link to="/recordings">Virtual Parent Recordings</Link>
            </li>
          </ul>
        </nav>

        {/* Route Configuration */}
        <Routes>
          {/* Updated to use element prop instead of component */}
          <Route path="/" element={<AvatarPage />} />
          <Route path="/recordings" element={<VirtualParentRecordings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
