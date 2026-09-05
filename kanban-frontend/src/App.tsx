import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import AuthLayout from "./layout/AuthLayout";
import ProtectedRoute from "./layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Register from "./routes/auth/RegisterPage";
import SignIn from "./routes/auth/SignInPage";
import BoardPage from "./routes/content/BoardPage";
import BoardDetailPage from "./routes/content/BoardDetailPage";
import BoardLayout from "./layout/BoardLayout";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function AppLayout() {
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="auth" replace />} />
              <Route path="auth" element={<AuthLayout />}>
                <Route index element={<SignIn />} />
                <Route path="register" element={<Register />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<BoardLayout />}>
                  <Route path="boards" element={<BoardPage />} />
                  <Route path="boards/:boardId" element={<BoardDetailPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </LocalizationProvider>
    </BrowserRouter>
  );
}

export default App;
