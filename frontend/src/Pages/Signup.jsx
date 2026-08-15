import { Link } from "react-router-dom";
import { useNavigate  } from "react-router-dom";
import { useState } from "react";
import "./Auth.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
  
    if(password !== confirmPassword){
      setMessage("Passwords do not match");
      return;
    }
    const userInfo = {
      name,
      email,
      password,
    };
    const API_URL = "http://localhost:5001/api/auth/signup"
    try{
      const response = await fetch(API_URL,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo) 
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Success", data);
        setMessage("Account created successfully!");
        navigate(`/login`)
      } else {
        setMessage(data.message || "Failed to create account");
        return;
      }
    } catch(err) {
      console.log('Error sending data:', err);
      setMessage("Error creating account. Please try again.");
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p> Enter your details!</p>
        {message && <p className="auth-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            minLength={8}
            maxLength={128}
            title="Use at least 8 characters with a letter and a number"
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirm Password</label>
          <input 
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}/>

          <button type="submit">Sign Up</button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
