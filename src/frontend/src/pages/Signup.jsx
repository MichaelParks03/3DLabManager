import { useState } from "react"
import { Link } from 'react-router-dom';

import "../css/Login_Signup.css"

function Signup() {
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [teamInput, setTeamInput] = useState("select");
  const [passwordInput, setPasswordInput] = useState("");

  const optionsData = [
    { label: "Team1", value: "Team1" },
    { label: "Team2", value: "Team2" },
    { label: "Team3", value: "Team3" }
  ];

  const createNewAccount = (e) => {
    e.preventDefault();
    alert("creating new account");
  }

  return (
    <div className="signup">
      <div className="signup-container">
        <form onSubmit={createNewAccount} className="signup-form">
          <div className="signup-field">
            <h3 className="signup-header">First Name *</h3>
            <input 
              type="text"
              placeholder="First Name"
              className="signup-input"
              value={firstNameInput}
              onChange={(e) => setFirstNameInput(e.target.value)}
            />
            <div className="signup-input-underline"></div>
          </div>

          <div className="signup-field">
            <h3 className="signup-header">Last Name *</h3>
            <input 
              type="text"
              placeholder="Last Name"
              className="signup-input"
              value={lastNameInput}
              onChange={(e) => setLastNameInput(e.target.value)}
            />
            <div className="signup-input-underline"></div>
          </div>
         
          <div className="signup-field">
            <h3 className="signup-header">Email *</h3>
            <input 
              type="text"
              placeholder="Email"
              className="signup-input"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <div className="signup-input-underline"></div>
          </div>
          
          <div className="signup-field">
            <h3 className="signup-header">Team</h3>
            <div className="dropdown-container">
              <select 
                className="dropdown" 
                value={teamInput} 
                onChange={setTeamInput}>

                <option value="select">select</option>
                {optionsData.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            <div className="signup-input-underline" style={{width: "30%"}}></div>
            </div>
          </div>
          

          <div className="signup-field">
            <h3 className="signup-header">Password *</h3>
            <input 
              type="password"
              placeholder="Password"
              className="signup-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <div className="signup-input-underline"></div>
          </div>  
          <div className="submission-container">
            <Link to="\login" className="link">Log In</Link>
            <button type="submit" className="signup-btn">Create Account</button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default Signup