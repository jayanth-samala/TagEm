import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");
    if (userParam) {
      try {
        const user = JSON.parse(userParam);
        localStorage.setItem("user", JSON.stringify(user));
        window.history.replaceState({}, document.title, "/Profile");
        window.location.href = "/Profile";
      } catch (err) {
        console.error("Failed to parse Google user data", err);
        setError("Google login failed. Please try again.");
      }
    }
  }, []); 

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const userInfo = { email, password };
    const API_URL = "http://localhost:5001/api/auth/login";
    try{
      const response = await fetch(API_URL,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo) 
      });
      const data = await response.json();
      if(!response.ok){
        setError(data.message || "Login failed");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/Profile");
    } catch(err) {
      console.log("Error sending data:", err);
      setError("An error occurred. Please recheck your login credentials and try again.");
    }
  }
  
  const handleGoogleLogin = () => {window.location.href = "http://localhost:5001/api/auth/google";};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Log in to continue building your network.</p>
        {error && <div className="AuthError">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <label>Password</label>
          <input 
            type="password"
            placeholder="Enter your password" 
            value = {password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button type="submit">Log In</button>
        </form>

        <div style={{ textAlign: "center", margin: "15px 0" }}>
            <p>— OR —</p>
            <button className="auth-card" type="button" onClick={handleGoogleLogin}>
              Log in with Google
            </button>
        </div>

        <p className="auth-switch">
          Dont have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;