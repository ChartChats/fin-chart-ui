import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ChatPage from '../pages/ChatPage';
import { TVChartContainer } from '../components/TVChartContainer';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={ <HomePage /> } />
      <Route path="/chat" element={ <ChatPage /> } />
      <Route path="/chart" element={ <TVChartContainer /> } />
    </Routes>
  );
};

export default AppRoutes;
