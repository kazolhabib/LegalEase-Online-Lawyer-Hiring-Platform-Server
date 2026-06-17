# LegalEase – Server (Backend API)

The backend REST API for the **LegalEase – Online Lawyer Hiring Platform**. Built with Express.js and MongoDB, it provides secure JWT authentication, role-based access control, lawyer management, hiring workflows, Stripe payment integration, and admin analytics.

🔗 **Live API URL:** [https://legalease-server.onrender.com](https://legalease-server.onrender.com)

---

## ✨ Key Features

- **JWT Authentication** – Secure registration, login, and Google OAuth endpoints with 7-day token expiry.
- **Role-Based Access** – Middleware-protected routes for User, Lawyer, and Admin roles.
- **Lawyer Profiles** – CRUD operations for lawyer service listings with search, filter, sort, and pagination.
- **Hiring System** – Create, accept, and reject hiring requests between clients and lawyers.
- **Comment System** – Clients can post reviews on hired lawyers; full CRUD on own comments.
- **Stripe Payments** – Checkout session creation and webhook handling for hiring fee payments.
- **Mock Payment** – Sandbox mock-pay endpoint for testing without Stripe keys.
- **Admin Controls** – Manage all users (role changes, deletion), view transactions, and analytics aggregates.
- **CORS Configured** – Properly configured cross-origin access for frontend integration.

---

## 📦 NPM Packages Used

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `mongoose` | MongoDB ODM for data modeling |
| `jsonwebtoken` | JWT token generation & verification |
| `bcryptjs` | Secure password hashing |
| `cors` | Cross-origin resource sharing middleware |
| `dotenv` | Environment variable management |
| `stripe` | Stripe payment processing SDK |
| `nodemon` | Development auto-restart utility |

---

## 🛠 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` – Register new user
- `POST /login` – Login with email/password
- `POST /google` – Google OAuth login
- `GET /profile` – Get authenticated user profile
- `PUT /profile` – Update user profile
- `PUT /role` – Update user role

### Lawyers (`/api/lawyers`)
- `GET /` – List all lawyers (with search, filter, sort, pagination)
- `GET /:id` – Get single lawyer details
- `POST /` – Create/update lawyer profile (Lawyer role)
- `DELETE /:id` – Delete lawyer profile

### Hires (`/api/hires`)
- `POST /` – Create hiring request
- `GET /user` – Get user's hiring history
- `GET /lawyer` – Get lawyer's incoming requests
- `PUT /:id` – Accept or reject hiring request

### Payments (`/api/payments`)
- `POST /create-checkout` – Create Stripe checkout session
- `POST /mock-pay` – Mock payment for testing
- `GET /transactions` – Get all transactions (Admin)

### Comments (`/api/comments`)
- `POST /` – Create comment on a lawyer
- `GET /lawyer/:id` – Get comments for a lawyer
- `GET /user` – Get user's own comments
- `PUT /:id` – Update comment
- `DELETE /:id` – Delete comment

### Admin (`/api/admin`)
- `GET /users` – List all users
- `PUT /users/:id/role` – Change user role
- `DELETE /users/:id` – Delete user
- `GET /analytics` – Platform analytics

---

## 🚀 Getting Started

```bash
git clone https://github.com/kazolhabib/LegalEase-Online-Lawyer-Hiring-Platform-Server.git
cd LegalEase-Online-Lawyer-Hiring-Platform-Server
npm install
```

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
STRIPE_SECRET_KEY=your_stripe_secret_key (optional)
```

Run the development server:

```bash
npm run dev
```

---

## 🔗 Links

- **Client Repository:** [GitHub – Client](https://github.com/kazolhabib/LegalEase-Online-Lawyer-Hiring-Platform)
- **Server Repository:** [GitHub – Server](https://github.com/kazolhabib/LegalEase-Online-Lawyer-Hiring-Platform-Server)

---

## 📄 License

This project is licensed under the ISC License.
