import { Outlet } from "react-router-dom";
import { Box, Container, Paper } from "@mui/material";

function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            boxSizing: "border-box",
            p: { xs: "28px 22px", sm: 5 },
            borderRadius: "18px",
            boxShadow: "0 22px 60px rgba(53, 78, 43, 0.12)",
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}

export default AuthLayout;
