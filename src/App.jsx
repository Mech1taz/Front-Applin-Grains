import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Cart from './components/Cart.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import MyOrders from './pages/MyOrders.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/perfil" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/mis-pedidos" element={<RequireAuth><MyOrders /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
          <Route path="*" element={<p className="p-10">Página no encontrada.</p>} />
        </Routes>
      </main>
      <Cart />
    </>
  );
}
