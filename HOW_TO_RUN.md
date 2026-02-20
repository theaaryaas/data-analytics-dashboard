# 🚀 How to Run the Data Analytics Dashboard

## Prerequisites

Before running the project, make sure you have:
- **Python 3.8+** installed
- **Node.js 18+** and **npm** installed
- (Optional) **Docker Desktop** installed (for MongoDB, PostgreSQL, OpenSearch)

---

## 📋 Quick Start (Without Docker - Recommended for Development)

This method runs the backend and frontend locally. Database services (MongoDB, PostgreSQL, OpenSearch) are optional - the app will work with just SQLite.

### Step 1: Install Backend Dependencies

Open a terminal in the project root and run:

```powershell
cd backend
python -m pip install -r requirements.txt
```

**Note:** If you get permission errors, use:
```powershell
python -m pip install --user -r requirements.txt
```

### Step 2: Install Frontend Dependencies

Open a **new terminal** in the project root and run:

```powershell
cd frontend
npm install
```

**Note:** This may take a few minutes on first run.

### Step 3: Start the Backend Server

In the backend terminal, run:

```powershell
cd backend\app
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ **Backend is now running on http://localhost:8000**

### Step 4: Start the Frontend Server

In the frontend terminal, run:

```powershell
cd frontend
npm start
```

You should see:
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

✅ **Frontend is now running on http://localhost:4200**

### Step 5: Access the Application

Open your browser and go to:
- **Frontend Dashboard:** http://localhost:4200
- **Backend API Docs:** http://localhost:8000/docs
- **Backend API:** http://localhost:8000

---

## 🐳 Full Setup (With Docker - All Databases)

If you want to use MongoDB, PostgreSQL, and OpenSearch, use Docker:

### Step 1: Start Database Services

```powershell
docker-compose up -d postgres mongodb opensearch
```

Wait 30-60 seconds for all services to start.

### Step 2-4: Follow Steps 2-4 from Quick Start above

The backend will automatically connect to the databases when they're available.

---

## 🔍 Verify Everything is Working

1. **Check Backend:**
   - Open http://localhost:8000 in your browser
   - You should see: `{"message": "Data Analytics Dashboard API", "version": "1.0.0", ...}`

2. **Check Frontend:**
   - Open http://localhost:4200 in your browser
   - You should see the login page

3. **Test Login:**
   - Use any email (e.g., `test@example.com`) and any password
   - Click "Sign In" - it will create a session and redirect to dashboard

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError` or import errors
```powershell
# Solution: Make sure you're in the backend\app directory
cd backend\app
python main.py
```

**Problem:** Port 8000 already in use
```powershell
# Solution: Kill the process using port 8000 or change the port in main.py
# Line 228: uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

**Problem:** Database connection errors
- **This is normal!** The app works without MongoDB/PostgreSQL/OpenSearch
- You'll see warnings like `[WARN] MongoDB not available` - this is okay
- SQLite will be used as the default storage

### Frontend Issues

**Problem:** `npm install` fails
```powershell
# Solution: Clear cache and try again
npm cache clean --force
npm install
```

**Problem:** Port 4200 already in use
```powershell
# Solution: Angular will ask if you want to use a different port
# Or change it in package.json: "start": "ng serve --host 0.0.0.0 --port 4201"
```

**Problem:** Frontend can't connect to backend
- Make sure backend is running on port 8000
- Check `frontend/src/app/services/api.service.ts` - line 18 should be: `private base = 'http://localhost:8000';`

---

## 📝 Running in Production

### Build Frontend for Production

```powershell
cd frontend
npm run build
```

The built files will be in `frontend/dist/data-analytics-frontend/`

### Run Backend in Production

```powershell
cd backend\app
python main.py
```

Or use uvicorn directly:
```powershell
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🎯 Quick Command Reference

### Start Everything (Two Terminals)

**Terminal 1 - Backend:**
```powershell
cd E:\data-analytics-dashboard\backend\app
python main.py
```

**Terminal 2 - Frontend:**
```powershell
cd E:\data-analytics-dashboard\frontend
npm start
```

### Stop Everything

- **Backend:** Press `Ctrl+C` in the backend terminal
- **Frontend:** Press `Ctrl+C` in the frontend terminal
- **Docker Services:** `docker-compose down`

---

## ✅ Success Checklist

- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:4200
- [ ] Can access frontend in browser
- [ ] Can login with any email/password
- [ ] Can see dashboard after login

---

## 🆘 Need Help?

If you encounter any issues:
1. Check that both servers are running
2. Check browser console for errors (F12)
3. Check terminal output for error messages
4. Make sure ports 8000 and 4200 are not blocked by firewall
