import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

function Login({ setIsAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const loginUser = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/login", { username, password });
      localStorage.setItem("username", res.data.username);
      setIsAuth(true);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Invalid credentials");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser();
  };

  return (
    <div className="auth-container">
        <h1 class="data">CampningIQ</h1>
      <h2>🔐 Login</h2>
      <form onSubmit={handleSubmit}>
        <input value={username} placeholder="Username" onChange={e => setUsername(e.target.value)} />
        <input value={password} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      <p onClick={() => navigate("/signup")}>Don't have an account? Signup</p>
    </div>
  );
}

export default Login;