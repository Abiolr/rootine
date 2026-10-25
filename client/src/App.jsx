import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./theme.css";
import "./App.css";
import { getToken, logout } from "./api";
import Frontpage from "./Frontpage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Dashboard from "./Dashboard";
import Workout from "./Workout";
import Cosmetics from "./Cosmetics";

// Only lets anyone with a saved token through
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
function DashboardRoute() {
  const navigate = useNavigate();
  
  const handleLogout = async () => { 
    await logout(); 
    navigate("/"); 
  };

  return (
    <Dashboard 
      onWorkout={() => navigate("/workout")}
      onCosmetics={() => navigate("/cosmetics")}
      onLogout={handleLogout}
    />
  );
}

function WorkoutRoute() {
  const navigate = useNavigate();
  
  const handleLogout = async () => { 
    await logout(); 
    navigate("/"); 
  };

  return (
    <Workout 
      onTree={() => navigate("/dashboard")}
      onLogout={handleLogout}
    />
  );
}

function CosmeticsRoute() {
  const navigate = useNavigate();
  
  const handleLogout = async () => { 
    await logout(); 
    navigate("/"); 
  };

  return (
    <Cosmetics 
      onTree={() => navigate("/dashboard")}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = "/" element = { <Frontpage /> } />
        <Route path = "/login" element = { <LoginPage /> } />
        <Route path = "/register" element = { <RegisterPage /> } />
        <Route path = "/dashboard" element = { <RequireAuth> <DashboardRoute /> </RequireAuth> } />
        <Route path = "/workout" element = { <RequireAuth> <WorkoutRoute /> </RequireAuth> } />
        <Route path = "/cosmetics" element = { <RequireAuth> <CosmeticsRoute /> </RequireAuth> } />
        
        {/* Unknown URLs go back to the front page */}
        <Route path = "*" element = { <Navigate to = "/" replace /> } />
      </Routes>
    </BrowserRouter>
  );
}
