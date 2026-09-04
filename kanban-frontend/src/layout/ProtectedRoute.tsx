import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <Stack
        sx={{
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
