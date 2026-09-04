import { useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import api from "../../lib/api";

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post<{ name: string }>("/auth/signin", {
        email,
        password,
      });
      navigate("/auth", { replace: true, state: { name: response.data.name } });
    } catch (requestError) {
      const error = requestError as AxiosError<{ detail?: string }>;
      setError(
        error.response?.data?.detail ?? "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
      <div>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800 }}
          gutterBottom
        >
          Welcome back
        </Typography>
        <Typography color="text.secondary">
          Sign in to keep your board moving.
        </Typography>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
      <Typography sx={{ textAlign: "center" }} color="text.secondary">
        New to Kanban?{" "}
        <Button
          variant="text"
          onClick={() => navigate("/auth/register")}
          sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}
        >
          Create an account
        </Button>
      </Typography>
    </Stack>
  );
}

export default SignIn;
