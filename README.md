# 📚 BookStore — Digital Book Store Management System

A production-ready Full-Stack digital bookstore web application built with **React 19**, **TypeScript**, **Express**, **Vite**, **Tailwind CSS**, **MongoDB (Mongoose)**, and **Google Gemini AI**.

---

## 🌟 Key Features

- **Curated Catalog**: Filter books by free vs. premium, language (English, Hindi, Marathi), category, and search.
- **Interactive Reader**: Reading mode with font resizing, dark/light/sepia themes, bookmarks, and page progress tracking.
- **Cart & Payment Gateways**: Simulated Sandbox UPI/Card checkout, and Razorpay Test Mode integration.
- **Admin Management Panel**: Add, edit, delete books with file/cover uploads, manage categories, track orders, and toggle user accounts.
- **MongoDB Persistence**: Seamless auto-seeding and synchronization with MongoDB (or resilient in-memory fallback).
- **Gemini AI Features**: Smart book search, instant AI book summaries, curriculum Q&A assistant, and reader comprehension assistant.

---

## 💻 How to Run in Visual Studio Code (VS Code)

### Step 1: Prerequisites
Ensure you have the following installed on your computer:
1. **Node.js** (v18.0.0 or higher) — [Download from nodejs.org](https://nodejs.org/)
2. **Visual Studio Code** — [Download from code.visualstudio.com](https://code.visualstudio.com/)
3. **MongoDB** (either local MongoDB Community Server or free cloud MongoDB Atlas)

---

### Step 2: Download or Clone the Project
1. In Google AI Studio, click on the **GitHub** tab in the top bar to export or push to your GitHub repository.
2. Clone the repository to your computer:
   ```bash
   git clone <your-github-repo-url>
   ```
   *(Or download the ZIP file and extract it).*

---

### Step 3: Open in Visual Studio Code
1. Open **VS Code**.
2. Click **File** > **Open Folder...** (or press `Ctrl+K Ctrl+O` on Windows, `Cmd+O` on Mac).
3. Select this project's root folder.

---

### Step 4: Install Dependencies
1. Open the integrated terminal in VS Code:
   - Shortcut: `` Ctrl + ` `` (Windows) or `` Cmd + ` `` (Mac).
   - Or go to menu: **Terminal** > **New Terminal**.
2. Run:
   ```bash
   npm install
   ```

---

### Step 5: Configure Environment Variables (`.env`)
1. In the project root, make a copy of `.env.example` and name it `.env`:
   - On Windows PowerShell: `cp .env.example .env`
   - On Mac/Linux: `cp .env.example .env`
2. Open `.env` and configure your settings:

```env
# Optional: Your Gemini AI API Key for AI features (Get from https://aistudio.google.com/)
GEMINI_API_KEY="your-gemini-api-key"

# MongoDB Connection String (See MongoDB setup below)
MONGODB_URI="mongodb://localhost:27017/bookstore"

# JWT Secret for User Authentication
AUTH_SECRET="bookstore-super-secret-jwt-key-2026"

# Optional: Razorpay Test Mode Keys (Leave empty for demo sandbox)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

---

### Step 6: Start the Development Server
In your VS Code terminal, run:
```bash
npm run dev
```

Now open your browser and go to:
👉 **`http://localhost:3000`**

---

## 🍃 MongoDB Connection Guide

The application connects to MongoDB using Mongoose. If MongoDB is connected, all books, categories, users, orders, bookmarks, and reading progress will be saved permanently in your database. If MongoDB is offline, it automatically runs in resilient in-memory mode without crashing.

### Option A: Local MongoDB (Recommended for Offline Development)
1. Install **MongoDB Community Server** and **MongoDB Compass** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service on your machine.
3. In your `.env` file, set:
   ```env
   MONGODB_URI="mongodb://localhost:27017/bookstore"
   ```
4. When you start `npm run dev`, the server will log:
   ```
   Connected to MongoDB database successfully.
   [MongoDB] Initialized books collection with 12 books.
   ```
5. You can open **MongoDB Compass**, connect to `mongodb://localhost:27017`, and browse the `bookstore` database with its collections (`books`, `categories`, `users`, `orders`, `gatewaysettings`).

---

### Option B: MongoDB Atlas (Free Cloud Database)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a free **M0 Shared Cluster**.
3. Go to **Database Access** > Add a new database user (e.g. username: `admin`, password: `your_password`).
4. Go to **Network Access** > Click **Add IP Address** > Choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** on your cluster > Choose **Drivers (Node.js)** > Copy the connection string.
6. Replace `<password>` with your password and append database name `/bookstore`:
   ```env
   MONGODB_URI="mongodb+srv://admin:your_password@cluster0.abcde.mongodb.net/bookstore?retryWrites=true&w=majority"
   ```
7. Start your server with `npm run dev`.

---

## 🔑 Default Login Accounts

### 1. Administrator Account
- **Email:** `admin@bookstore.edu`
- **Password:** `AdminSecurePassword2026!`
- **Capabilities:** Access Admin Panel, upload books & PDF documents, manage categories, view all orders, toggle payment gateways, configure test keys, and activate/deactivate user accounts.

### 2. Student Account
- **Email:** `student@college.edu`
- **Password:** `Student12345!`
- **Capabilities:** Browse books, read free books, purchase premium books via Sandbox or Razorpay, save to Wishlist, keep reading bookmarks and progress.

*(You can also register a new account anytime via the Register page).*

---

## 🛠 Available Scripts

- `npm run dev` — Starts the full-stack server with Vite middleware on `http://localhost:3000`.
- `npm run build` — Compiles the frontend for production into `dist/`.
- `npm start` — Runs the compiled full-stack server with `node server.ts`.
- `npm run lint` — Validates TypeScript types across the entire project (`tsc --noEmit`).
