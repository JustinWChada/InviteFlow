import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateInvitation from "./pages/CreateInvitation";
import InvitationView from "./pages/InvitationView";
import InteractiveInvite from "./pages/InteractiveInvite";
import ProtectedRoute from "./routes/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/create" element={<CreateInvitation />} />

        <Route path="/invite/:slug" element={<InvitationView />} />
        <Route path="/interactive/:slug" element={<InteractiveInvite />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
