// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/DashboardLayout';
import Home from './components/Home';
import About from './components/About';
import Resources from './components/Resources';
import Contact from './components/Contact';
import Data from './components/Data';
import Other from './components/Other';
import FirstPlace from './components/FirstPlace';
import SecondPlace from './components/SecondPlace';
import ThirdPlace from './components/ThirdPlace';

function App() {
  return (
    <Router>
      <Dashboard />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/other" element={<Other />} />
        <Route path="/data" element={<Data />}>
          <Route index element={<Navigate to="first-place" replace />} />
          <Route path="first-place" element={<FirstPlace />} />
          <Route path="second-place" element={<SecondPlace />} />
          <Route path="third-place" element={<ThirdPlace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

