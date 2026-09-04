import { useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../lib/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    fname: "",
    lname: "",
    password: "",
    confirmedPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmedPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.post<{ name: string }>("/auth/register", form);
      navigate("/auth", { replace: true, state: { name: response.data.name } });
    } catch (requestError) {
      const error = requestError as AxiosError<{
        detail?: string | { msg: string }[];
      }>;
      const detail = error.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(" ")
          : (detail ?? "Unable to create your account."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" spacing={1.7} onSubmit={handleSubmit}>
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800 }}
          gutterBottom
        >
          Create your workspace
        </Typography>
        <Typography color="text.secondary">
          A calmer way to get every task across the line.
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          label="First name"
          value={form.fname}
          onChange={(event) => updateField("fname", event.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Last name"
          value={form.lname}
          onChange={(event) => updateField("lname", event.target.value)}
          required
          fullWidth
        />
      </Stack>
      <TextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        helperText="8+ characters, upper/lowercase, number and ! @ # $ %"
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Confirm password"
        type="password"
        value={form.confirmedPassword}
        onChange={(event) =>
          updateField("confirmedPassword", event.target.value)
        }
        required
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
      <Typography sx={{ textAlign: "center" }} color="text.secondary">
        Already have an account?{" "}
        <Button
          variant="text"
          onClick={() => navigate("/auth")}
          sx={{ p: 0, minWidth: 0, verticalAlign: "baseline" }}
        >
          Sign in
        </Button>
      </Typography>
    </Stack>
  );
}

export default Register;
