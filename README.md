# Methaaq (ميثاق) - Enterprise Freelance Marketplace API

**Methaaq** is a sophisticated, production-ready Backend API designed for freelance marketplaces. The system architecture demonstrates high-level expertise in **Hybrid Database Management**, **Scalable System Design**, and **Secure Financial Workflows**.

**Live Production:** [https://methaaq-api.onrender.com](https://methaaq-api.onrender.com)  

---

##  System Architecture & Hybrid Database Strategy

The core differentiator of Methaaq is its **Hybrid Persistence Layer**. Instead of a "One Size Fits All" approach, the system utilizes the strengths of both Relational and Document databases to ensure maximum reliability and performance.

### 1. Relational Layer (PostgreSQL + Sequelize)
Handled by PostgreSQL for data that requires strict **ACID compliance** and complex relational integrity:
* **Identity & Access Management (IAM):** Core user data, Role-Based Access Control (RBAC), and session state.
* **Transactional Engine:** Projects, Bids, and the Escrow system. Every state change in a contract (e.g., from 'Pending' to 'In Progress') is managed via **Sequelize Transactions** to guarantee atomicity.
* **Lookup Tables:** Standardized skills, categories, and system constants.

### 2. Document Layer (MongoDB + Mongoose)
Handled by MongoDB for high-velocity, polymorphic, and unstructured data:
* **Freelancer Profiles:** Rich portfolios and dynamic skill sets where schema flexibility is prioritized.
* **Messaging Architecture:** High-volume chat logs and system notifications. Storing these in NoSQL allows for faster writes and horizontal scalability.

---

##  Advanced Security & Auth Flow

### Dual-Token Lifecycle (Access & Refresh Tokens)
The system implements a robust security layer to mitigate token theft and session hijacking:
* **Access Token:** Short-lived JWT (Short expiration) passed in the `Authorization` header.
* **Refresh Token:** Long-lived token stored in a **Secure HttpOnly Cookie**, cross-referenced in the database to allow for server-side session revocation (Logout from all devices).
* **Automatic Re-authentication:** Seamless token renewal flow without user interruption.

### Infrastructure Hardening
* **Rate Limiting:** IP-based request throttling to prevent brute-force and DoS attacks.
* **Security Headers:** Enforcement of secure HTTP headers via Helmet.js.
* **Data Sanitization:** Middleware to prevent XSS (Cross-Site Scripting) and NoSQL Injection attacks.
* **CORS Management:** Strict origin control tailored for production environments.

---

##  Core Business Logic: The Escrow & Milestone System

The project solves the "Trust Problem" in online freelancing through a multi-stage **Escrow Simulation**:

1. **Bid Acceptance:** Acceptance of a proposal automatically initializes a Legal Contract in PostgreSQL.
2. **Milestone Budgeting:** Contracts are subdivided into deliverables.
3. **Escrow Funding:** The client authorizes payment for a specific milestone. The funds are locked (Simulated) and the milestone state is updated.
4. **Deliverable Approval:** Upon completion, the client approves the work, triggering an atomic transaction to release funds from Escrow to the Freelancer's internal wallet.

---

## SOME OF API ENDPOINTS

### Authentication Service (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/register` | User onboarding with RBAC (Client/Freelancer/Admin) |
| POST | `/login` | Secure authentication; returns JWT and sets Refresh Cookie |
| POST | `/refresh-token` | Atomic token rotation for persistent sessions |
| GET | `/google` | OAuth 2.0 Identity Provider integration |
| POST | `/forgot-password` | OTP-based password recovery flow |

### Marketplace Service (`/api/projects` | `/api/bids`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/projects` | Advanced project discovery with multi-criteria filtering & pagination |
| POST | `/projects` | Project publication (Client restricted) |
| POST | `/projects/:id/bids`| Proposal submission (Freelancer restricted) |
| PUT | `/bids/:id/accept` | Bid acceptance and automated contract generation |

### Contract & Communication (`/api/contracts` | `/api/messages`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/contracts` | Active workspace retrieval for current user |
| POST | `/contracts/:id/milestones` | Milestone-based budget allocation |
| PUT | `/contracts/:id/complete` | Final Escrow settlement and contract closure |
| GET | `/messages/:contractId` | Real-time chat history retrieval from MongoDB |
