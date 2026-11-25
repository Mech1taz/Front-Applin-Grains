import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Cart from './components/Cart.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Reports from './pages/Reports.jsx';
import Audit from './pages/Audit.jsx';
import AdminLayout from './components/AdminLayout.jsx';

const ADMIN_PATHS = ['/admin', '/reports', '/audit'];

export default function App() {
  const { pathname } = useLocation();
  const inAdmin = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <>
      {!inAdmin && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/perfil" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/mis-pedidos" element={<RequireAuth><MyOrders /></RequireAuth>} />
          <Route element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<Audit />} />
          </Route>
          <Route path="*" element={<p className="p-10">Página no encontrada.</p>} />
        </Routes>
      </main>
      {!inAdmin && <Cart />}
    </>
  );
}
