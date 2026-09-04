import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import type { AuthUser } from "../../context/AuthContext";

type AccountCardProps = {
  user: AuthUser | null;
  onSignOut: () => void;
  isSigningOut: boolean;
};

function AccountCard({ user, onSignOut, isSigningOut }: AccountCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        boxShadow: "0 16px 40px rgba(53, 78, 43, 0.1)",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 3, sm: 4 },
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Your account
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800 }}
            gutterBottom
          >
            {user?.name}
          </Typography>
          <Typography color="text.secondary">{user?.email}</Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onSignOut}
          disabled={isSigningOut}
          sx={{ flexShrink: 0 }}
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default AccountCard;
