import { BrowserRouter, Routes, Route, Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import Jobs from "./Jobs.jsx";
import Meetups from "./Meetups.jsx";
import Connections from "./Connections.jsx";
import Profile from "./Profile.jsx";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import Admin from "./Admin.jsx"
import MeetupDetails from "./MeetupDetails.jsx";

import "./App.css"

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate(); 
    const [imgURL, setImgURL] = useState("");
    
    const [loggingOut, setLoggingOut] = useState(false);
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        async function handleFetch() {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user) return;

            const API_URL = `http://localhost:5001/api/Profile/${user.id}`;
            const response = await fetch(API_URL);
            const data = await response.json();

            setImgURL(data.profilePicUrl || "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png");
        }

        handleFetch();
    }, [location.pathname]); 

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:5001/api/auth/logout", { method: "POST" });
        } finally {
            localStorage.removeItem("user");
            setLoggingOut(false);
            navigate("/login");
        }
    };

    if (location.pathname === "/" || location.pathname === "/signup" || location.pathname === "/login") {
        return;
    }
    return (
        <nav>
            <Link to ="/Jobs" className="logoLink"><img src="/tagEmLogo.svg" alt="TagEm Logo" /></Link>

            <div className="navLinks">
                <Link to="/Jobs">Jobs</Link>
                <Link to="/Meetups">Meetups</Link>
                <Link to="/Connections">Connections</Link>
                <Link to="/Profile">Profile</Link>
                {user?.is_admin && <Link to="/Admin">Admin</Link>}
            </div>
            
            <div className="profile-menu">
                <img src={imgURL} alt="Profile" className="nav-profile-pic"
                onClick={() => setLoggingOut(!loggingOut)}
                />
                {loggingOut && (
                    <div className="dropdown-menu">
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );   
}

function ProtectedRoute({ adminOnly = false }) {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && !user.is_admin) return <Navigate to="/Profile" replace />;

    return <Outlet />;
}

export default function App() {
    return (
        <BrowserRouter>
            <NavBar />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/Jobs" element={<Jobs />}/>
                    <Route path="/Meetups" element={<Meetups />}/>
                    <Route path="/Meetups/:id" element={<MeetupDetails />} />
                    <Route path="/Connections" element={<Connections />}/>
                    <Route path="/Profile" element={<Profile />}/>
                    <Route path="/Profile/:id" element={<Profile />}/>
                </Route>
                <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="/Admin" element={<Admin />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
