import { Navigate, Outlet } from "react-router";
import { userStore } from "../store/userStore";
import Spinner from "../components/Spinner";

function PublicOnlyRoute() {
  const isAuthenticated = userStore((state) => state.isAuthenticated);
  const isLoading = userStore((state) => state.isLoading);

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default PublicOnlyRoute;
