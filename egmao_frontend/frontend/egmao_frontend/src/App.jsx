import { ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { antdTheme } from "./theme";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";   // ← ajouté
import Home from "./pages/Home";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/employee/Dashboard";
import Catalog from "./pages/employee/Catalog";
import TrainingDetail from "./pages/employee/TrainingDetail";
import ChapterView from "./pages/employee/ChapterView";
import QuizPage from "./pages/employee/QuizPage";
import ProgressPage from "./pages/employee/ProgressPage";
import Certificates from "./pages/employee/Certificates";
import Profile from "./pages/employee/Profile";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageTrainings from "./pages/admin/ManageTrainings";
import ManageModules from "./pages/admin/ManageModules";
import ManageQuizzes from "./pages/admin/ManageQuizzes";
import VerifyCertificate from "./pages/public/VerifyCertificate";

/** Sends an already-logged-in user to their home area; others to /login. */
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/app"} replace />;
}

export default function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={frFR}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
             <Route path="/inscription" element={<Register />} /> 
             <Route path="certificats/verifier/:number" element={<VerifyCertificate />} />
            {/* Employee area */}
            <Route
              path="/app"
              element={
                <ProtectedRoute role="EMPLOYEE">
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="catalogue" element={<Catalog />} />
              <Route path="formations/:trainingId" element={<TrainingDetail />} />
              <Route path="formations/:trainingId/chapitres/:chapterId" element={<ChapterView />} />
              <Route path="quiz/:quizId" element={<QuizPage />} />
              <Route path="progression" element={<ProgressPage />} />
              <Route path="certificats" element={<Certificates />} />
          
          
              <Route path="profil" element={<Profile />} />
            </Route>

            {/* Admin area */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="utilisateurs" element={<ManageUsers />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="formations" element={<ManageTrainings />} />
              <Route path="modules" element={<ManageModules />} />
              <Route path="quiz" element={<ManageQuizzes />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
