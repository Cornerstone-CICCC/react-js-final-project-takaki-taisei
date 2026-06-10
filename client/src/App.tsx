import { Navigate, Route, Routes } from "react-router";
import PublicOnlyRoute from "./pages/PublicOnlyRoute";
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
  const setIsLoading = userStore((state) => state.setIsLoading);

  useEffect(() => {
    async function getAndSetUser() {
      try {
        setIsLoading(true);
        const user = await getMe();
        setUser(user);
      } catch (e) {
        clearUser();
      } finally {
        setIsLoading(false);
      }
    }

    getAndSetUser();
  }, [setUser, clearUser, setIsLoading]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<PublicOnlyRoute />}>
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
