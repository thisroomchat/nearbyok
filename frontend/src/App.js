import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Listing from "@/pages/Listing";
import BusinessDetail from "@/pages/BusinessDetail";
import AuthCallback from "@/pages/AuthCallback";
import Account from "@/pages/Account";
import ListBusiness from "@/pages/ListBusiness";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

// Secret console path (set in frontend/.env). `/admin` deliberately 404s.
const ADMIN_PATH = (process.env.REACT_APP_ADMIN_PATH || "nbk-console").replace(/^\/+/, "");

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="/list-your-business" element={<ListBusiness />} />
      <Route path={`/${ADMIN_PATH}`} element={<Admin />} />
      <Route path="/admin" element={<NotFound />} />
      <Route path="/:category/:state/:city" element={<Listing />} />
      <Route path="/:category/:state/:city/:slug" element={<BusinessDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
