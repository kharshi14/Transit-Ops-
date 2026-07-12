# Transit-Ops 🚛

Transit-Ops is an enterprise-grade static web application for **Transit Operations and Fleet Management**. It features an elegant glassmorphism user interface designed for managing vehicles, drivers, logistics trips, maintenance, and expense analytics.

👉 **Live URL**: [https://transit-ops-three-theta.vercel.app](https://transit-ops-three-theta.vercel.app)

---

## 🌟 Key Features

1. **Dashboard & KPIs**:
   - Real-time KPIs tracking fleet parameters: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, and Fleet Utilization (%).
   - Interactive filtering by vehicle type, status, and operating region.
2. **Vehicle Maintenance Logging**:
   - Create, search, filter, and complete maintenance logs.
   - **Automated Workflows**: Adding a vehicle to an active maintenance log automatically transitions its status to `In Shop`, removing it from the driver's trip assignment pool. Completing the maintenance restores the vehicle to `Available`.
3. **Fuel & Expense Management**:
   - Record fuel logs (liters, cost, distance, date) and general expenses (tolls, insurance, maintenance).
   - Operational costs are automatically calculated and synchronized per vehicle.
4. **Reports & ROI Analytics**:
   - Automatically computes Fuel Efficiency ($km/L$), Fleet Utilization, Operational Cost, and **Vehicle ROI** based on completed trip revenues:
     $$\text{ROI} = \frac{\text{Trip Revenue} - (\text{Maintenance} + \text{Fuel})}{\text{Acquisition Cost}} \times 100$$
   - Export reports directly to a CSV spreadsheet.
5. **Secure Authentication & RBAC**:
   - Login page protecting the panel with secure SHA-256 client-side hashing (featuring a pure JS fallback for compatibility in non-secure HTTP/LAN browser contexts).
   - **Role-Based Access Control (RBAC)**:
     - **Admin**: Full read/write access across all features.
     - **Dispatcher**: Controls trips and dispatches; blocked from modifying drivers, vehicles, maintenance, or expenses.
     - **Maintenance**: Views dashboard, edits odometers, and logs/completes maintenance logs. Blocked from driver/trip mutations or analytics views.
     - **Viewer**: Read-only access to all dashboards and panels.

---

## 🔐 Seeded Accounts (Quick Login)

The login screen includes quick-select buttons for convenience, or you can enter the credentials manually:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@transitops.com` | `admin123` | Full access to all features |
| **Lead Dispatcher** | `dispatcher@transitops.com` | `dispatch123` | Trips creation & dispatching control |
| **Maintenance Manager** | `maintenance@transitops.com` | `maint123` | Odometer edits and maintenance records |
| **General Viewer** | `viewer@transitops.com` | `view123` | Read-only dashboards and metrics |

---

## 🛠️ Architecture & Tech Stack

- **Frontend core**: HTML5, Vanilla CSS3 (modern glassmorphism, dynamic grids), and TypeScript.
- **Bundler**: Vite (fully optimized production builds).
- **TypeScript strict compilation**: Built around clean architecture and domain validation rules.
- **Unit Verification**: Node.js native test runner asserting business logic, vehicle transitions, and expense validation rules.

---

## 💻 Getting Started Locally

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application with hot-reloads.

### 4. Run Unit Tests
To run the test suite containing **39 test cases** verifying all domain constraints and business rules:
```bash
npm test
```

### 5. Build for Production
To bundle and compile assets into the `/dist` output directory:
```bash
npm run build
npx vite build
```
