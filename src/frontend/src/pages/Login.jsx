import { useState } from "react"
import { Link } from 'react-router-dom';

import "../css/Login_Signup.css"

function Login() {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Username: ${usernameInput}\nPassword: ${passwordInput}`);
    setUsernameInput("");
    setPasswordInput("");
  }

  return (
    <div className="login">
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <h3 className="login-header">Username</h3>
            <input 
              type="text"
              placeholder="Username or Email"
              className="login-input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            <div className="login-input-underline"></div>
          </div>
          <div className="login-field">
            <h3 className="login-header">Password</h3>
            <input 
              type="password"
              placeholder="Password"
              className="login-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <div className="login-input-underline"></div>
          </div>

          <div className="submission-container">
            <Link to="\signup" className="link">Create an Account</Link>
            <button type="submit" className="login-btn">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login