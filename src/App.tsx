import { Navigate, Route, Routes } from "react-router";
import PublickOnluRoute from "./pages/PublickOnluRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import { useEffect } from "react";
import { getMe } from "./api/auth/auth.api";
import { userStore } from "./store/userStore";

function App() {
  const setUser = userStore((state) => state.setUser);
  const clearUser = userStore((state) => state.clearUser);

  useEffect(() => {
    async function getAndSetUser() {
      const user = await getMe();
      setUser(user);
    }
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route element={<PublickOnluRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
