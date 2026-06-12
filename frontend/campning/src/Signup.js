import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signupUser = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/signup", { username, password });
      alert("Signup successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Error creating account");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signupUser();
  };

  return (
    <div className="auth-container">
         <h1 class="data">CampningIQ</h1>
      <h2>📝 Signup</h2>
      <form onSubmit={handleSubmit}>
        <input value={username} placeholder="Username" onChange={e => setUsername(e.target.value)} />
        <input value={password} type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button type="submit">Signup</button>
      </form>
      <p onClick={() => navigate("/login")}>Already have an account? Login</p>
    </div>
  );
}

export default Signup;