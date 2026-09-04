import { useEffect } from "react";
import { Alert, CircularProgress, Stack } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !token) return;

    if (!user) {
      navigate("/auth", {
        replace: true,
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    window.location.assign(
      `${api.defaults.baseURL}/board/invites/${token}/accept`,
    );
  }, [isLoading, location.pathname, location.search, navigate, token, user]);

  if (isLoading || user) {
    return (
      <Stack
        spacing={2}
        sx={{
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
        <Alert severity="info">Preparing your invitation...</Alert>
      </Stack>
    );
  }

  return null;
}

export default InvitePage;
