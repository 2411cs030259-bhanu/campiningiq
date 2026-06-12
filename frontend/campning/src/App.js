import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("username"));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuth ? <Login setIsAuth={setIsAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuth ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isAuth ? <Dashboard setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;