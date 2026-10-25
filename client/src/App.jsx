import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./theme.css";
import "./App.css";
import {
  getToken,
  logout,
  getUser,
  getProfile,
  getEquipped,
  setEquipped,
  addXp,
} from "./api";
import {
  DAILY_TASKS,
  DAILY_TASK_XP,
  WEEKLY_TASK,
  getDailyDone,
  completeDaily,
  getWeekly,
  processWeekTransition,
} from "./tasks";
import Frontpage from "./Frontpage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Dashboard from "./Dashboard";
import Workout from "./Workout";
import Cosmetics from "./Cosmetics";
import TaskCamera from "./TaskCamera";

// Only lets anyone with a saved token through
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function useLogout() {
  const navigate = useNavigate();
  return async () => {
    await logout();
    navigate("/");
  };
}

function DashboardRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = useLogout();
  const { username } = getUser();
  
  // Use state so we can reload the profile if the penalty week-check catches a missed week
  const [profile, setProfile] = useState(getProfile());

  useEffect(() => {
    processWeekTransition().then(changed => {
      if (changed) setProfile(getProfile());
    });
  }, []);

  const done = getDailyDone();
  const tasks = DAILY_TASKS.map((t) => ({ ...t, done: done.includes(t.id) }));
  const week = getWeekly();

  return (
    <Dashboard
      username={username}
      equippedId={getEquipped()}
      // day is still a placeholder: no backend field for it yet
      tree={{
        stage: profile.status ?? "SEED",
        day: 3,
        goalsDone: tasks.filter((t) => t.done).length,
        goalsTotal: tasks.length,
        penaltyPoints: profile.penalty_points,
      }}
      tasks={tasks}
      weekly={{
        label: WEEKLY_TASK.label,
        count: Math.min(week.count, WEEKLY_TASK.target),
        target: WEEKLY_TASK.target,
        xp: WEEKLY_TASK.xp,
        done: week.count >= WEEKLY_TASK.target,
      }}
      initialTasksOpen={Boolean(location.state?.openTasks)}
      onDoTask={(id) => navigate(`/tasks/${id}/camera`)}
      onWorkout={() => navigate("/workout")}
      onCosmetics={() => navigate("/cosmetics")}
      onLogout={handleLogout}
    />
  );
}

function TaskCameraRoute() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const task = DAILY_TASKS.find((t) => t.id === taskId);
  const backToTasks = () => navigate("/dashboard", { state: { openTasks: true } });

  // Unknown task, or already done today
  if (!task || getDailyDone().includes(task.id)) {
    return <Navigate to="/dashboard" replace state={{ openTasks: true }} />;
  }

  async function handleComplete() {
    completeDaily(task.id); // mark first so a failed XP call can't be farmed by retrying
    await addXp(DAILY_TASK_XP);
    backToTasks();
  }

  return <TaskCamera task={task} onComplete={handleComplete} onCancel={backToTasks} />;
}

function WorkoutRoute() {
  const navigate = useNavigate();
  const handleLogout = useLogout();

  return <Workout onTree={() => navigate("/dashboard")} onLogout={handleLogout} />;
}

function CosmeticsRoute() {
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const [equippedId, setEquippedId] = useState(getEquipped);

  function handleEquip(id) {
    setEquipped(id);
    setEquippedId(id);
  }

  return (
    <Cosmetics
      lifetimeXp={getProfile().xp}
      equippedId={equippedId}
      onEquip={handleEquip}
      onTree={() => navigate("/dashboard")}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Frontpage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardRoute /></RequireAuth>} />
        <Route path="/tasks/:taskId/camera" element={<RequireAuth><TaskCameraRoute /></RequireAuth>} />
        <Route path="/workout" element={<RequireAuth><WorkoutRoute /></RequireAuth>} />
        <Route path="/cosmetics" element={<RequireAuth><CosmeticsRoute /></RequireAuth>} />

        {/* Unknown URLs go back to the front page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}