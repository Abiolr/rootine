import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./theme.css";
import "./App.css";
import { getToken } from "./api";
import Frontpage from "./Frontpage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import DashboardPage from "./Dashboard";

// Only lets anyone with a saved token through
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Frontpage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        
        {/* Unknown URLs go back to the front page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

