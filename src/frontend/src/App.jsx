import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleUser, faMagnifyingGlass, faMicrophone } from '@fortawesome/free-solid-svg-icons';
import Home from './pages/Home';
import Navbar from './components/Navbar'
// import InventoryList from './pages/InventoryList';
// import Login from './pages/Login';

import "./css/App.css"

library.add(faCircleUser, faMagnifyingGlass, faMicrophone);

function App() {
  return (
    <BrowserRouter>
      <div className="app">
      <Navbar />
        <div className='app-content'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/labs" element={<Home />} />
          <Route path="/tickets" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/inventory" element={<Home />} />
          <Route path="/item" element={<Home />} />
        </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App