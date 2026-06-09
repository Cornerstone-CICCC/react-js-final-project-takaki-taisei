import { Navigate, Outlet } from "react-router";
import { userStore } from "../store/userStore";
import Spinner from "../components/Spinner";

function PublickOnluRoute() {
  const isAuthenticated = userStore((state) => state.isAuthenticated);
  const isLoading = userStore((state) => state.isLoading);

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" />;
}

export default PublickOnluRoute;
