import { useState } from "react";
import { Box, Stack } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccountCard from "../components/board/AccountCard";

function BoardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100svh", py: { xs: 4, md: 8 } }}>
      <Stack
        spacing={3}
        sx={{ width: "100%", maxWidth: 720, mx: "auto", px: 2 }}
      >
        <AccountCard
          user={user}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />
        <Outlet />
      </Stack>
    </Box>
  );
}

export default BoardLayout;
