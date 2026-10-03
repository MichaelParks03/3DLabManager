import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InventoryList from './pages/InventoryList';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Routes>
          <Route path="/" element={<InventoryList />} /> 
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}