import { createContext, useState, useEffect, useContext } from 'react';
import API from '../utils/axiosInstance';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) fetchCart();
    else { setCart({ items: [], total: 0 }); setCartCount(0); }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await API.get('/cart');
      setCart(res.data);
      setCartCount(res.data.items?.reduce((s, i) => s + i.quantity, 0) || 0);
    } catch { setCart({ items: [], total: 0 }); }
  };

  const addToCart = async (productId, quantity, price) => {
    const res = await API.post('/cart/add', { productId, quantity, price });
    setCart(res.data.cart);
    setCartCount(res.data.cart.items.reduce((s, i) => s + i.quantity, 0));
    return res.data;
  };

  const updateItem = async (itemId, quantity) => {
    const res = await API.put(`/cart/update/${itemId}`, { quantity });
    setCart(res.data.cart);
    setCartCount(res.data.cart.items.reduce((s, i) => s + i.quantity, 0));
  };

  const removeItem = async (itemId) => {
    const res = await API.delete(`/cart/remove/${itemId}`);
    setCart(res.data.cart);
    setCartCount(res.data.cart.items.reduce((s, i) => s + i.quantity, 0));
  };

  const clearCart = async () => {
    await API.delete('/cart/clear');
    setCart({ items: [], total: 0 });
    setCartCount(0);
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
