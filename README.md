# Gen-Z Threads — Fashion E-Commerce Platform

> MERN Stack | Full-Stack E-Commerce + Real-Time Virtual Try-On
> COMSATS University Islamabad, Vehari Campus

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Styling | CSS3 (Flexbox/Grid) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| Payment | Stripe API |
| Try-On | HTML5 Canvas + MediaDevices API |
| Charts | Recharts |

## 📁 Project Structure

```
genz-threads/
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # Navbar, ProductCard, CartDrawer, TryOnCanvas
│   │   ├── context/     # AuthContext, CartContext
│   │   ├── hooks/       # useAuth, useCart
│   │   ├── pages/       # All customer pages
│   │   │   └── admin/   # Admin dashboard pages
│   │   ├── utils/       # axiosInstance
│   │   ├── App.jsx      # Main routing
│   │   └── main.jsx     # Entry point
│   └── package.json
│
├── server/              # Express Backend
│   ├── config/          # MongoDB connection
│   ├── models/          # User, Product, Order, Cart, TryOnSession
│   ├── controllers/     # Business logic for all modules
│   ├── routes/          # API route definitions
│   ├── middleware/       # JWT auth + admin role check
│   ├── utils/           # PDF invoice generator
│   ├── server.js        # Entry point
│   └── package.json
│
└── README.md
```

## 🛠️ Setup Instructions

### 1. Clone & Install

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server (.env):**
```
MONGO_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_your_key
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key
```

### 3. Run

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## 📋 Modules

1. **User Management** — Register, Login, Profile, Wishlist, Order History
2. **Product & Inventory** — Catalog, Search, Filter, Admin CRUD
3. **Real-Time Try-On** — Camera access, Canvas overlay, Snapshot capture
4. **Shopping Cart** — Add/Remove/Update items, Real-time totals
5. **Secure Payments** — Stripe integration, PDF invoices, Order tracking
6. **Admin Dashboard** — Stats, User/Product/Order management, Analytics charts
7. **Security** — JWT auth, bcrypt hashing, Role-based access control

## 👥 Team
- Asia Parveen & Rubina Kanwal
- Supervisor: Mr. Sadeem Ahmad
- COMSATS University Islamabad, Vehari Campus
