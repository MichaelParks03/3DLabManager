import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleUser, 
         faMagnifyingGlass, 
         faMicrophone, 
         faArrowRightToBracket, 
         faAngleDown,
         faAngleUp,
         faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Home from './pages/Home';
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Labs from './pages/Labs'
import Tickets from './pages/Tickets'
import Item from './pages/Item'
import Signup from './pages/Signup'
import Account from './pages/Account'
import Inventory from './pages/Inventory'

import drillImage from './assets/images/drill_image.jpg';
import acctImage from './assets/images/tmp_profile_image.jpeg';

import "./css/App.css"

library.add(faCircleUser, faMagnifyingGlass, faMicrophone, faArrowRightToBracket, 
            faAngleDown, faAngleUp, faArrowLeft);

function AppLayout() {
  const { pathname } = useLocation();
  const user = {name: "Devin Wingfield",
                email: "dtw8917@mavs.uta.edu",
                team: {
                  name: "insert team name here",
                  members: ["Devin Wingfield", "Liam Crowly", "Joshua Thomas", "Samuel Newville", "Micheal Parks"],
                  desk: "Desk 5 at ERB 208"
                },
                items: [
                  {name: "Drill", checkeoutDate: new Date("October 28, 2026"), image: drillImage},
                  
                ],
                image: acctImage,
  }             


  return (
    <div className="app">
    { pathname !== "/login" && pathname !== "/signup" && <Navbar /> }

      <div className='app-content'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/item" element={<Item />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<Account user={user} team={user.team} />} />
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