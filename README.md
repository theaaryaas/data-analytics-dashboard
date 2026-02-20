# Data Analytics Dashboard

A full-stack data analytics dashboard application with support for multiple database backends (MongoDB, PostgreSQL, OpenSearch) and interactive data visualization.

## 📁 Project Structure

```
data-analytics-dashboard/
├── frontend/                    # Angular frontend application
│   ├── src/
│   │   ├── app/                # Angular application code
│   │   │   ├── components/    # Reusable UI components
│   │   │   │   ├── chart-renderer/      # Chart visualization component
│   │   │   │   ├── data-table/          # Data table display component
│   │   │   │   ├── file-upload/         # File upload component
│   │   │   │   ├── file-card/           # File card display component
│   │   │   │   ├── logo/                # Logo component
│   │   │   │   ├── stat-card/           # Statistics card component
│   │   │   │   └── background-decoration/ # Background decoration component
│   │   │   ├── pages/         # Page components
│   │   │   │   ├── dashboard/           # Main dashboard page
│   │   │   │   ├── data-sources/        # Data sources management page
│   │   │   │   ├── mongodb-page/        # MongoDB-specific page
│   │   │   │   ├── postgres-page/       # PostgreSQL-specific page
│   │   │   │   ├── opensearch-page/     # OpenSearch-specific page
│   │   │   │   ├── login/               # Login page
│   │   │   │   ├── sign-up/             # Sign up page
│   │   │   │   ├── profile/             # User profile page
│   │   │   │   └── simple-monitoring/   # System monitoring page
│   │   │   ├── services/      # Angular services
│   │   │   │   ├── api.service.ts       # API communication service
│   │   │   │   └── auth.service.ts      # Authentication service
│   │   │   ├── guards/        # Route guards
│   │   │   │   └── auth.guard.ts        # Authentication guard
│   │   │   ├── layout/        # Layout components
│   │   │   │   └── layout.component.ts  # Main layout component
│   │   │   ├── app.component.ts        # Root component
│   │   │   └── app.routes.ts            # Application routes
│   │   ├── assets/            # Static assets (images, icons, etc.)
│   │   ├── styles.css         # Global styles
│   │   └── main.ts            # Application entry point
│   ├── angular.json            # Angular configuration
│   ├── package.json            # Node.js dependencies
│   └── tsconfig.json           # TypeScript configuration
│
├── backend/                     # FastAPI backend application
│   └── app/
│       ├── main.py              # FastAPI application entry point and routes
│       ├── data_store.py        # SQLite database operations for file metadata
│       ├── services/            # Database service modules
│       │   ├── mongodb_service.py    # MongoDB connection and operations
│       │   ├── postgres_service.py   # PostgreSQL connection and operations
│       │   └── opensearch_service.py  # OpenSearch connection and operations
│       ├── utils/               # Utility modules
│       │   ├── file_processor.py     # File processing (CSV, Excel, JSON)
│       │   └── simple_metrics.py     # Prometheus metrics collection
│       ├── uploads/             # Uploaded file storage directory
│       └── data_files.db        # SQLite database file
│
├── Samples/                     # Sample data files for testing
├── docker-compose.yml           # Docker Compose configuration
└── README.md                    # This file

```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- Docker and Docker Compose (for database services)

### Installation

1. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start Database Services:**
   ```bash
   docker-compose up -d
   ```

### Running the Application

1. **Start Backend:**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🏗️ Architecture

### Frontend (Angular)
- **Framework:** Angular 17
- **UI Library:** Angular Material
- **Styling:** Custom CSS with peach theme
- **Charts:** Custom SVG-based chart rendering
- **State Management:** Component-based with services

### Backend (FastAPI)
- **Framework:** FastAPI
- **Database Support:**
  - SQLite: File metadata storage
  - MongoDB: Document storage
  - PostgreSQL: Relational data storage
  - OpenSearch: Search and analytics
- **File Processing:** Pandas for CSV/Excel/JSON parsing
- **Metrics:** Prometheus-compatible metrics

## 📦 Key Features

- **Multi-Database Support:** Upload files to MongoDB, PostgreSQL, or OpenSearch
- **Data Visualization:** Interactive charts (bar, line, pie) with custom styling
- **File Management:** Upload, preview, and manage data files
- **Search Functionality:** Full-text search in OpenSearch
- **System Monitoring:** Real-time system metrics and performance monitoring
- **Responsive Design:** Modern UI with peach color theme

## 🔧 Configuration

### Database Connections
Database connection settings are configured in:
- `backend/app/services/mongodb_service.py`
- `backend/app/services/postgres_service.py`
- `backend/app/services/opensearch_service.py`

### CORS Settings
CORS origins are configured in `backend/app/main.py` to allow frontend connections.

## 📝 File Structure Guidelines

- **Components:** Reusable UI components go in `frontend/src/app/components/`
- **Pages:** Route-level components go in `frontend/src/app/pages/`
- **Services:** Business logic and API calls go in `frontend/src/app/services/`
- **Backend Services:** Database operations go in `backend/app/services/`
- **Backend Utils:** Helper functions go in `backend/app/utils/`

## 🎨 Styling

The application uses a consistent peach color theme throughout:
- Primary: `#FFB3A7` (Peach)
- Secondary: `#FF8A65` (Light Orange)
- Accent: `#FF7043` (Orange)

## 📄 License

This project is for educational and demonstration purposes.
