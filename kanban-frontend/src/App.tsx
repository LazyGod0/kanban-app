import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import AuthLayout from "./layout/AuthLayout";
import Register from "./routes/auth/RegisterPage";
import SignIn from "./routes/auth/SignInPage";

function AppLayout() {
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="auth" replace />} />
          <Route path="auth" element={<AuthLayout />}>
            <Route index element={<SignIn />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
