import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleUser, 
         faMagnifyingGlass, 
         faMicrophone, 
         faArrowRightToBracket, 
         faAngleDown,
         faAngleUp } from '@fortawesome/free-solid-svg-icons';
import Home from './pages/Home';
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Labs from './pages/Labs'
import Tickets from './pages/Tickets'
// import InventoryList from './pages/InventoryList';

import "./css/App.css"

library.add(faCircleUser, faMagnifyingGlass, faMicrophone, faArrowRightToBracket, faAngleDown, faAngleUp);

function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="app">
    { pathname !== "/login" && <Navbar /> }

      <div className='app-content'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inventory" element={<Home />} />
        <Route path="/item" element={<Home />} />
      </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App