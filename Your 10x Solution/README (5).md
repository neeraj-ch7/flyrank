# Jansathi AI – AI-Powered Grievance Resolution Assistant

Jansathi AI is an AI-powered grievance management platform designed to make complaint submission, classification, prioritization, routing, tracking, and escalation faster and more accessible.

The project is built as a full-stack application and demonstrates multiple concepts required by the **Your 10x Solution** capstone, including API endpoints, database integration, authentication, background processing, reporting, caching, and LLM integration.

---

## 🚀 Problem Statement

Government grievance portals receive a large number of complaints every day. Complaints can arrive in different formats and languages, and manually reading, categorizing, prioritizing, and routing every complaint can be time-consuming.

This can lead to:

- Delayed complaint processing
- Incorrect department assignment
- Difficulty in identifying high-priority complaints
- Repetitive administrative work
- Limited transparency for citizens
- Language and accessibility barriers

Jansathi AI addresses these challenges by adding an intelligent AI-assisted workflow to the grievance management process.

---

## 💡 Solution

Jansathi AI allows citizens to submit grievances using text or speech. The system uses an LLM to understand the complaint and generate useful structured information such as:

- Complaint summary
- Category
- Priority
- Recommended department
- Important extracted information

The complaint can then be tracked through its lifecycle, while administrators can review AI recommendations, update complaint status, monitor delayed complaints, and generate reports.

### Core Workflow

```text
Citizen
   ↓
Submit Grievance
   ↓
AI Analysis
   ↓
Summary + Category + Priority
   ↓
Department Recommendation
   ↓
Administrator Review
   ↓
Complaint Processing
   ↓
Status Tracking
   ↓
Resolution / Escalation
```

---

## ✨ Features

### 👤 Citizen

- User registration and login
- Secure authentication
- Submit grievances
- Speech-to-text complaint submission
- AI-powered complaint analysis
- Complaint tracking
- Complaint status history
- Download complaint reports

### 🛠️ Administrator

- Secure admin authentication
- Complaint dashboard
- View and manage complaints
- AI-based categorization
- Priority-based filtering
- Department assignment
- Status management
- Delayed complaint monitoring
- Report generation

### 🤖 AI Capabilities

- Natural-language understanding
- Complaint summarization
- Complaint classification
- Priority detection
- Department recommendation
- Multilingual/vernacular processing
- AI-assisted grievance analysis

---

## 🧩 Capstone Concepts Implemented

Jansathi AI is designed to implement more than the minimum five concepts required by the capstone.

| Concept | Implementation |
|---|---|
| API Endpoints | REST APIs using FastAPI |
| Database | PostgreSQL |
| Authentication | JWT-based authentication |
| Background Jobs | Automated processing, notifications and escalation |
| Reporting | PDF complaint reports |
| Caching | Redis |
| LLM Integration | Google Gemini API |
| Speech Processing | Speech-to-Text |
| Deployment | Vercel + cloud backend/database |

---

## 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │      Citizen      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   React Frontend  │
                    │  Tailwind + Vite  │
                    └─────────┬─────────┘
                              │
                           REST API
                              │
                              ▼
                    ┌───────────────────┐
                    │  FastAPI Backend  │
                    └──────┬─────┬──────┘
                           │     │
             ┌─────────────┘     └─────────────┐
             ▼                                 ▼
    ┌─────────────────┐              ┌─────────────────┐
    │   PostgreSQL    │              │  Google Gemini  │
    │     Database    │              │       LLM       │
    └─────────────────┘              └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │      Redis      │
    │      Cache      │
    └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Background Jobs │
    │  & Escalation   │
    └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- React.js
- Tailwind CSS
- Vite

### Backend

- Python
- FastAPI

### Database

- PostgreSQL

### AI / Machine Learning

- Google Gemini API
- Speech-to-Text

### Authentication

- JWT

### Caching

- Redis

### Background Processing

- Celery / scheduled background jobs

### Reporting

- PDF generation

### Deployment

- Vercel
- Cloud-hosted backend
- Cloud-hosted PostgreSQL

---

## 🔌 API Endpoints

Example API structure:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| POST | `/complaints` | Submit a grievance |
| GET | `/complaints` | Get complaints |
| GET | `/complaints/{id}` | Get a specific complaint |
| PUT | `/complaints/{id}/status` | Update complaint status |
| POST | `/complaints/{id}/analyze` | Analyze complaint using AI |
| GET | `/reports/{id}` | Generate/retrieve complaint report |

> Update this list according to the endpoints actually available in the backend.

---

## 🗄️ Database Design

The application uses PostgreSQL for persistent storage.

### Users

Typical fields:

```text
id
name
email
password_hash
role
created_at
```

### Complaints

Typical fields:

```text
id
user_id
description
category
priority
department
ai_summary
status
created_at
updated_at
```

### Complaint History

Typical fields:

```text
id
complaint_id
previous_status
new_status
updated_by
timestamp
```

The complaint history makes it possible to track how a grievance changes from submission to resolution.

---

## 🔐 Authentication

Jansathi AI uses JWT-based authentication.

```text
Register
   ↓
Login
   ↓
Validate Credentials
   ↓
Generate JWT
   ↓
Client Stores Token
   ↓
Protected API Request
   ↓
Backend Verifies Token
```

Passwords should be stored using secure password hashing and never as plain text.

The system supports role-based access for citizens and administrators.

---

## 🤖 LLM Integration

Google Gemini is used to process natural-language grievances.

### Example Input

```text
Mere area mein pichhle 5 din se street lights kaam nahi kar rahi hain.
```

### Example AI Output

```json
{
  "category": "Street Lighting",
  "priority": "Medium",
  "department": "Municipal Department",
  "summary": "Street lights in the user's area have not been functioning for five days."
}
```

The AI output is intended as an administrative recommendation. Human administrators can review or override AI-generated classifications when necessary.

---

## ⚙️ Background Processing

Background jobs can handle operations that do not need to block the user's request.

Examples:

- AI complaint processing
- Email notifications
- PDF report generation
- Monitoring overdue complaints
- Automatic escalation
- Periodic system tasks

Example workflow:

```text
Complaint Created
       ↓
Background Job
       ↓
Check SLA / Time Limit
       ↓
Complaint Overdue?
    ↙          ↘
  No            Yes
  ↓              ↓
Continue       Escalate
                 ↓
             Notify Admin
```

---

## ⚡ Caching

Redis is used to cache frequently accessed data.

Potential cached data includes:

- Dashboard statistics
- Department statistics
- Frequently requested complaint information
- Analytics results

Example:

```text
User Requests Dashboard
          ↓
     Check Redis
       ↙      ↘
    Found     Not Found
      ↓          ↓
 Return Data   Query DB
                 ↓
            Store in Redis
                 ↓
             Return Data
```

Caching reduces repeated database queries and can improve application response time.

---

## 📄 PDF Reporting

Jansathi AI can generate structured PDF reports containing information such as:

- Complaint ID
- Citizen details
- Complaint description
- AI-generated summary
- Category
- Priority
- Assigned department
- Current status
- Complaint timeline
- Resolution details

These reports provide a downloadable record for citizens and administrators.

---

## 🎤 Speech & Vernacular Support

The application can support speech-based complaint submission.

```text
User Speaks
     ↓
Speech-to-Text
     ↓
Text Complaint
     ↓
LLM Processing
     ↓
Structured Grievance
```

This approach can make the platform easier to use for people who prefer speaking instead of typing and for users communicating in supported Indian languages.

---

## 📊 Example Use Case

A citizen reports:

> "Hamare area mein teen din se street lights band hain aur raat mein road par bahut dikkat hoti hai."

Jansathi AI processes the complaint and may produce:

```text
Category       → Street Lighting
Priority       → Medium
Department     → Municipal Department
Summary        → Street lights have been inactive for three days,
                  causing difficulty for residents at night.
Status         → Submitted
```

An administrator can then verify the recommendation and assign/process the complaint.

---

## 📁 Suggested Project Structure

```text
jansathi-ai/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── auth/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── ...
│
├── docs/
│
├── .gitignore
├── README.md
└── LICENSE
```

> Adjust the structure to match the actual repository.

---

## ⚙️ Installation

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Python 3.10+
- PostgreSQL
- Redis
- Git

### Clone Repository

```bash
git clone https://github.com/neeraj-ch7/jansathi-ai.git
cd jansathi-ai
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend

python -m venv venv
```

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

---

## 🔑 Environment Variables

Create a `.env` file for the backend.

Example:

```env
DATABASE_URL=your_postgresql_connection_string

JWT_SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_gemini_api_key

REDIS_URL=your_redis_connection_string

FRONTEND_URL=http://localhost:5173
```

**Never commit API keys, passwords, JWT secrets, or database credentials to GitHub.**

Add `.env` to `.gitignore`.

---

## 🧪 Testing

The project can be tested at multiple levels:

### API Testing

Use tools such as:

- Swagger UI
- Postman
- cURL

FastAPI automatically provides interactive API documentation when enabled.

### Functional Testing

Test important workflows such as:

1. User registration
2. User login
3. Complaint submission
4. AI analysis
5. Complaint tracking
6. Status update
7. Report generation
8. Authentication and authorization
9. Background escalation
10. Cached dashboard requests

---

## 🚀 Deployment

The frontend can be deployed using Vercel, while the backend and PostgreSQL database can be deployed using suitable free-tier cloud services.

A production deployment should configure environment variables through the hosting provider instead of committing secrets to the repository.

### Deployment Checklist

- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] PostgreSQL configured
- [ ] Redis configured
- [ ] Gemini API configured
- [ ] Environment variables configured
- [ ] CORS configured
- [ ] Authentication tested
- [ ] API endpoints tested
- [ ] PDF reports tested

---

## 🔮 Future Improvements

Possible future extensions include:

- Retrieval-Augmented Generation (RAG)
- Government rules and department guideline knowledge base
- Duplicate complaint detection
- Advanced multilingual voice assistant
- WhatsApp/SMS notifications
- Complaint heatmaps
- AI-assisted official response generation
- Spam/fraud complaint detection
- SLA prediction
- Automatic integration with government grievance APIs
- Advanced analytics and reporting

---

## ⚠️ Scope & Limitations

The initial version focuses on the grievance lifecycle from submission to resolution.

The project does not attempt to directly integrate with every government department or government portal.

AI-generated classifications and department recommendations should be treated as recommendations rather than final decisions. Human review remains important for ambiguous, sensitive, or high-impact complaints.

---

## 🎯 Expected Impact

Jansathi AI aims to:

- Reduce repetitive manual classification
- Improve department routing
- Make complaint submission more accessible
- Support natural-language grievance processing
- Improve complaint transparency
- Identify delayed complaints automatically
- Provide structured complaint reports
- Create a scalable AI-assisted grievance workflow

---

## 🏆 Capstone Alignment

This project is developed as part of the **Your 10x Solution** capstone.

### Required concepts demonstrated

- ✅ API endpoints
- ✅ Database
- ✅ Authentication
- ✅ Background jobs
- ✅ Reporting / PDF
- ✅ Caching
- ✅ LLM integration

Additional concepts such as speech processing, multilingual interaction, and deployment further extend the solution.

---

## 📌 Project Information

**Project Name:** Jansathi AI  
**Project Type:** AI-Powered Full-Stack Web Application  
**Primary Goal:** Faster, smarter, and more accessible grievance resolution  
**Developer:** Neeraj Chauhan  
**GitHub:** https://github.com/neeraj-ch7/jansathi-ai

---

## 📜 License

This project is intended for educational, portfolio, and capstone purposes. Add the appropriate open-source license if the repository is intended for public reuse.
