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

function AppLayout() {
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="auth" replace />} />
            <Route path="auth" element={<AuthLayout />}>
              <Route index element={<SignIn />} />
              <Route path="register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="boards" element={<BoardPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
