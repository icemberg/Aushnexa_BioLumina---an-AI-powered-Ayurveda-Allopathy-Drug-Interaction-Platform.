# Aushnexa BioLumina

*Safe Interactions. Smarter Care.*

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi)
![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react)
![Neo4j](https://img.shields.io/badge/Neo4j-5.x-018bff.svg?logo=neo4j)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Aushnexa detects dangerous interactions between Ayurvedic herbs and allopathic medicines using a biomedical Neo4j knowledge graph. It provides evidence-graded risk scores, multilingual explanations in 7 Indian languages (Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Malayalam), AI-generated integrative protocols, clinical trial aggregation from multiple global registries, and a molecular knowledge explorer — helping patients, doctors, and pharmacists make safer, informed treatment decisions.

🚀 **Live Deployment:** [https://aushnexa.onrender.com/](https://aushnexa.onrender.com/)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Knowledge Graph Schema](#knowledge-graph-schema)
5. [How It Works](#how-it-works)
6. [API Reference](#api-reference)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Docker Architecture](#docker-architecture)
10. [Security](#security)
11. [Data Pipeline](#data-pipeline)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Supported Languages](#supported-languages)
15. [Clinical Safety and Disclaimers](#clinical-safety-and-disclaimers)
16. [Contributing](#contributing)
17. [License](#license)
18. [Acknowledgements](#acknowledgements)

---

## System Architecture

Aushnexa operates on a decoupled architecture utilizing a React frontend, a FastAPI backend, and a multi-database persistence layer relying on PostgreSQL (relational), Neo4j (graph), and Redis (caching/rate limiting). It dynamically orchestrates external API calls to Anthropic's Claude and Sarvam AI to provide intelligent, localized interaction analysis.

```mermaid
flowchart TD
    subgraph Client
        UI[React Frontend]
    end

    subgraph Reverse Proxy
        NGINX[Nginx]
    end

    subgraph Backend Services
        API[FastAPI Backend]
    end

    subgraph Databases
        Neo4j[(Neo4j Knowledge Graph)]
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    subgraph External APIs
        Claude[Anthropic Claude API]
        Sarvam[Sarvam AI API]
        PubMed[NCBI PubMed API]
        CTgov[ClinicalTrials.gov API]
        Semantic[Semantic Scholar Graph]
        CTRI[CTRI India Scraper]
    end

    UI -->|HTTPS| NGINX
    NGINX -->|Proxy / /v1/| API
    API <--> Neo4j
    API <--> PG
    API <--> Redis

    API <--> Claude
    API <--> Sarvam
    API <--> PubMed
    API <--> CTgov
    API <--> Semantic
    API <--> CTRI
```

---

## Features

### Patient Features
* **Interaction Checker**: Enter up to 10 herbs/drugs, get pairwise risk scores with mechanism explanations and evidence citations.
* **Multilingual Support**: Real-time translation into 7 Indian languages via Sarvam AI, ensuring medical accessibility.
* **Voice Input**: Speech-to-text integration for submitting Indian language voice queries seamlessly.

### Clinical Features
* **Aushnexa AI Tab**: A natural language clinical query interface that dynamically synthesizes a molecular interaction matrix and AI-generated integrative protocols.
* **Evidence Portal**: Aggregates real-world clinical trials and papers directly from ClinicalTrials.gov, PubMed, CTRI India, and Semantic Scholar.
* **Heritage Mapping**: Detailed Ayurvedic property profiles for each herb including active compounds, *rasa*, *guna*, and *dosha* effects.

### Research Features
* **Knowledge Base**: Interactive molecular graph explorer featuring pathway tracing, compound comparison, and an evidence density heatmap.
* **Risk Scoring Engine**: Sophisticated weighted formula combining Severity (0.4), Evidence (0.3), Mechanism (0.2), and Patient Factors (0.1).

### Admin Features
* **Admin Dashboard**: System vitality monitor, institutional access logs, and anomaly detection.
* **Clinical Safety Protocols**: Total evidence transparency, strict confidence scoring, mandatory medical disclaimers, and banned words enforcement.

---

## Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | UI library and fast build tooling |
| **Frontend Styling** | Tailwind CSS, Framer Motion | Custom "Deep Biomedical Ink" theme and animations |
| **Frontend State** | Zustand, TanStack Query v5 | Client state with `sessionStorage` and server state caching |
| **Frontend Routing** | React Router v6 | Client-side SPA routing |
| **Backend** | Python 3.11+, FastAPI | High-performance asynchronous API |
| **Databases** | Neo4j 5.x, PostgreSQL 15, Redis | Graph relations, relational user data, and caching |
| **Backend Tools** | SQLAlchemy 2.0, Alembic, Passlib | Async ORM, migrations, and bcrypt password hashing |
| **AI / LLM** | Anthropic Claude API | Explanation generation and integrative protocol synthesis |
| **Translation** | Sarvam AI | Indian language translation and TTS |
| **External Integrations**| PubMed, CT.gov, Semantic Scholar, CTRI | Evidence aggregation and literature citation |
| **DevOps** | Docker, Nginx, Certbot | Container orchestration, reverse proxy, and automated SSL |

---

## Knowledge Graph Schema

Our biomedical graph explicitly models the complex biochemical interactions between synthetic compounds, botanical species, and human biology.

```mermaid
erDiagram
    DRUG {
        string id
        string name
        string class
        string atc_code
    }
    HERB {
        string id
        string botanical_name
        string common_name
        string ayurvedic_name
        string rasa
        string guna
        string dosha_effect
    }
    COMPOUND {
        string id
        string name
        string pubchem_cid
        string structure
    }
    MECHANISM {
        string id
        string target_protein
        string action_type
        string pathway
    }
    INTERACTION {
        string id
        string severity
        string description
        string evidence_level
    }
    DISEASE {
        string id
        string name
        string icd10
    }
    EVIDENCE {
        string id
        string pmid
        string title
        string year
    }

    HERB ||--o{ COMPOUND : "CONTAINS"
    DRUG ||--o{ MECHANISM : "MODULATES"
    COMPOUND ||--o{ MECHANISM : "MODULATES"
    DRUG ||--o{ INTERACTION : "INTERACTS_WITH"
    HERB ||--o{ INTERACTION : "INTERACTS_WITH"
    MECHANISM ||--o{ DISEASE : "AFFECTS"
    INTERACTION ||--o{ EVIDENCE : "SUPPORTED_BY"
    DRUG ||--o{ DISEASE : "CONTRAINDICATED_IN"
```

### Graph Properties Details

* **Drug**: Represents allopathic medications (e.g., Metformin, Warfarin). Properties include standard classifications (ATC).
* **Herb**: Botanical entities including deep Ayurvedic classification (Rasa/Taste, Guna/Quality, Dosha impact).
* **Compound**: The active phytochemicals inside herbs.
* **Mechanism**: Biological pathways, receptor bindings, and enzymatic inhibitions.
* **Interaction**: The explicit cross-reactivity node mapping Severity (e.g., Minor, Moderate, Major, Critical) and linking to Evidence.

---

## How It Works

### 1. Interaction Check Request Flow
When a user submits a list of drugs and herbs, the backend normalizes the entities, queries the graph for physical interactions, computes a risk score, and generates localized explanations.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant FastAPI
    participant NormService as NormalizationService
    participant Graph as Neo4jGraph
    participant Risk as RiskService
    participant Claude as ExplanationService
    participant Sarvam as TranslationService

    User->>Frontend: Enters entities (e.g. "Ashwagandha", "Thyroxine")
    Frontend->>FastAPI: POST /api/v1/check-interactions
    FastAPI->>NormService: Resolve synonyms to canonical IDs
    NormService-->>FastAPI: Canonical IDs
    FastAPI->>Graph: Query pairwise interactions
    Graph-->>FastAPI: Raw interaction & mechanism data
    FastAPI->>Risk: Calculate weighted risk scores
    Risk-->>FastAPI: Risk metrics
    FastAPI->>Claude: Generate clinical explanations based on mechanisms
    Claude-->>FastAPI: Synthesized English explanation
    FastAPI->>Sarvam: Translate to selected Indian language (optional)
    Sarvam-->>FastAPI: Translated text
    FastAPI-->>Frontend: InteractionResponse JSON
    Frontend-->>User: Renders Matrix & Warnings
```

### 2. Risk Scoring Algorithm
The proprietary risk score is calculated using four heavily weighted factors to ensure severe biochemical conflicts are never understated.

```mermaid
flowchart TD
    S[Severity Score] -->|x 0.40| Total
    E[Evidence Level] -->|x 0.30| Total
    M[Mechanism Clarity] -->|x 0.20| Total
    P[Patient Factors] -->|x 0.10| Total

    Total[Calculate Composite Score 0-100]

    Total --> Cond1{Score >= 80?}
    Cond1 -- Yes --> C[Critical - Red Flag]
    Cond1 -- No --> Cond2{Score >= 60?}
    
    Cond2 -- Yes --> Maj[Major - High Caution]
    Cond2 -- No --> Cond3{Score >= 40?}
    
    Cond3 -- Yes --> Mod[Moderate - Monitor]
    Cond3 -- No --> Min[Minor - Low Risk]
```

### 3. Evidence Aggregation Pipeline
Clinical evidence is concurrently scraped, fetched, and aggregated in real-time from massive global registries.

```mermaid
flowchart LR
    Req[Evidence Request] --> Split
    
    Split --> CTG[ClinicalTrials.gov API]
    Split --> PUB[PubMed E-utilities]
    Split --> CTRI[CTRI India Scraper]
    Split --> SEM[Semantic Scholar Graph]

    CTG --> Agg
    PUB --> Agg
    CTRI --> Agg
    SEM --> Agg

    Agg[Deduplication Layer] --> Score[Relevance Scoring]
    Score --> Unify[Unified Evidence Response]
```

### 4. AI Query Pipeline (Aushnexa AI Tab)
When clinicians ask open-ended questions about combinatorial regimens, Aushnexa leverages Claude for intent detection and structured extraction before querying the hard graph data.

```mermaid
sequenceDiagram
    participant User
    participant NLP as Claude (Intent Detection)
    participant Graph as Neo4j Graph
    participant Synth as Claude (Generation)
    
    User->>NLP: "Is turmeric safe with blood thinners for a diabetic?"
    NLP->>NLP: Extract entities (Turmeric, Blood Thinners)
    NLP->>Graph: Lookup herb/drug pathways
    Graph-->>NLP: Returns CYP450 inhibition data & interactions
    NLP->>Synth: Pass graph facts for structured synthesis
    Synth->>Synth: Validate against safety guardrails
    Synth-->>User: Returns Interaction Matrix + Integrative Protocol
```

---

## API Reference

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/check-interactions` | Yes | Analyzes pairwise interactions between provided herbs and drugs. |
| `GET` | `/api/v1/normalize` | Yes | Normalizes unstructured medical text into canonical entity IDs. |
| `GET` | `/api/v1/history` | Yes | Retrieves user's past interaction queries. |
| `POST` | `/api/v1/auth/register` | No | Registers a new user and assigns a role. |
| `POST` | `/api/v1/auth/login` | No | Authenticates a user and returns a JWT. |
| `GET` | `/api/v1/auth/profile` | Yes | Fetches the current authenticated user's profile. |
| `POST` | `/api/v1/translate` | Yes | Translates medical text into one of 7 Indian languages via Sarvam AI. |
| `GET` | `/api/v1/evidence/search` | Yes | Aggregates clinical trials and PubMed articles for a specific interaction. |
| `GET` | `/api/v1/trials/search` | Yes | Direct query interface for ClinicalTrials.gov and CTRI. |
| `GET` | `/api/v1/herb/{name}/profile` | Yes | Returns complete Ayurvedic and molecular profile for a specific herb. |
| `POST` | `/api/v1/ai/query` | Yes | Natural language query for AI integrative protocols. |
| `GET` | `/api/v1/admin/system-status` | Admin | Checks database connections, Neo4j latency, and API quotas. |
| `GET` | `/api/v1/admin/metrics` | Admin | Aggregated usage metrics for the dashboard. |
| `GET` | `/api/v1/admin/access-logs` | Admin | Fetches audit logs for institutional compliance. |
| `GET` | `/health` | No | Basic heartbeat check for load balancers. |

### Example Interaction Check Request

**POST** `/api/v1/check-interactions`

```json
{
  "items": ["Ashwagandha", "Escitalopram"],
  "language": "hi-IN",
  "patient_context": {
    "age": 45,
    "conditions": ["Hypertension"]
  }
}
```

**Response:**
```json
{
  "risk_score": 68,
  "severity": "Moderate",
  "summary": "Ashwagandha may increase serotonin levels and interact mildly with Escitalopram.",
  "translation": {
    "language": "hi-IN",
    "text": "अश्वगंधा सेरोटोनिन के स्तर को बढ़ा सकता है और एस्सिटालोप्राम के साथ हल्का प्रभाव डाल सकता है।"
  },
  "mechanisms": [
    {
      "type": "Pharmacodynamic",
      "description": "Synergistic CNS depression and potential mild serotonin modulation."
    }
  ],
  "evidence": [
    {
      "source": "PubMed",
      "pmid": "12345678",
      "title": "Effects of Withania somnifera on SSRI pharmacokinetics",
      "evidence_level": 3
    }
  ],
  "disclaimer": "This information is for educational purposes only and does not constitute medical advice."
}
```

---

## Project Structure

```text
aushnexa/
├── frontend/                     # React 18 SPA
│   ├── src/
│   │   ├── pages/                # All core routing views
│   │   │   ├── Landing.jsx
│   │   │   ├── Checker.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── History.jsx
│   │   │   ├── ClinicalTrials.jsx
│   │   │   ├── EvidencePortal.jsx
│   │   │   ├── AushnexaAI.jsx
│   │   │   ├── KnowledgeBase.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogs.jsx
│   │   │   └── NotFound.jsx
│   │   ├── components/           # Reusable UI elements
│   │   ├── hooks/                # React Query data fetching hooks
│   │   ├── services/             # Axios API instances
│   │   ├── store/                # Zustand state management
│   │   ├── utils/                # Utility and formatting functions
│   │   └── constants/            # Theme, config, and mapping constants
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── main.py               # ASGI application entrypoint
│   │   ├── config.py             # Pydantic BaseSettings
│   │   ├── api/v1/               # API Route Handlers
│   │   │   ├── auth.py
│   │   │   ├── interactions.py
│   │   │   ├── history.py
│   │   │   ├── translate.py
│   │   │   ├── evidence.py
│   │   │   ├── trials.py
│   │   │   ├── herb.py
│   │   │   ├── ai.py
│   │   │   └── admin.py
│   │   ├── services/             # Core Business Logic
│   │   │   ├── interaction_service.py
│   │   │   ├── normalization_service.py
│   │   │   ├── risk_service.py
│   │   │   ├── explanation_service.py
│   │   │   ├── translation_service.py
│   │   │   ├── evidence_aggregator.py
│   │   │   └── ai_service.py
│   │   ├── graph/                # Neo4j Database Interactions
│   │   │   ├── connection.py
│   │   │   └── queries.py
│   │   ├── db/                   # PostgreSQL Relational Data
│   │   │   ├── connection.py
│   │   │   └── models.py
│   │   ├── core/                 # Security, Exceptions, Middlewares
│   │   │   ├── security.py
│   │   │   └── exceptions.py
│   │   ├── cache/                # Redis configurations
│   │   │   └── redis.py
│   │   └── schemas/              # Pydantic validation models
│   │       ├── interaction.py
│   │       └── auth.py
│   ├── alembic/                  # Database migration scripts
│   ├── tests/                    # Pytest test suite
│   ├── data_pipeline/            # Knowledge graph seeding
│   │   └── seed_data/
│   │       ├── herbs.json
│   │       ├── drugs.json
│   │       ├── interactions.json
│   │       └── synonyms.json
│   └── requirements.txt
│
├── nginx/                        # Reverse Proxy configurations
│   └── nginx.conf
├── docker-compose.yml            # Local development orchestration
├── docker-compose.prod.yml       # Production deployment orchestration
└── .env.example                  # Environment template
```

---

## Getting Started

### Prerequisites
* Docker and Docker Compose
* Node.js 20+ (for local frontend development)
* Python 3.11+ (for local backend development)
* API Keys for Anthropic Claude and Sarvam AI

### Environment Variables
Copy `.env.example` to `.env` in the root directory.

```env
# ─── Application ───
APP_NAME=Aushnexa
APP_ENV=development # Change to 'production' on live servers
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production-min-32-chars # JWT signing key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ─── FastAPI Backend ───
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:80 # Allowed frontend URLs

# ─── PostgreSQL ───
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=aushnexa
POSTGRES_USER=aushnexa_user
POSTGRES_PASSWORD=aushnexa_secure_password_2024
DATABASE_URL=postgresql+asyncpg://aushnexa_user:aushnexa_secure_password_2024@postgres:5432/aushnexa

# ─── Neo4j ───
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=aushnexa_neo4j_2024

# ─── Redis ───
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

# ─── Groq / Anthropic API (Explanation Generation) ───
GROQ_API_KEY=your-anthropic-or-groq-api-key-here
GROQ_MODEL=claude-sonnet-4-20250514

# ─── Sarvam AI (Translation & TTS) ───
SARVAM_API_KEY=your-sarvam-api-key-here
SARVAM_BASE_URL=https://api.sarvam.ai

# ─── Logging ───
LOG_LEVEL=INFO
DOMAIN_NAME=localhost # Set to your actual domain in production
```

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/aushnexa-biolumina.git
   cd aushnexa-biolumina
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and insert your specific API keys
   ```

3. **Start the Development Stack**
   ```bash
   docker-compose up --build
   ```
   The backend API will be available at `http://localhost:8000`, and the React frontend at `http://localhost:3000`.

4. **Seed the Knowledge Graph**
   Before running interactions, seed the base Neo4j graph with the provided medical datasets:
   ```bash
   docker-compose exec backend python data_pipeline/load_graph.py
   ```

5. **Set Admin Role**
   The ADMIN role cannot be assigned via the API for security reasons. Promote a registered user manually:
   ```bash
   docker-compose exec postgres psql -U aushnexa_user -d aushnexa -c "UPDATE users SET role='ADMIN' WHERE email='your@email.com';"
   ```

---

## Docker Architecture

Aushnexa utilizes a multi-container Docker architecture for local development, and a highly efficient all-in-one container for cloud PaaS deployments.

### Local Development (`docker-compose.yml`)
* Isolated containers for Frontend, Backend, PostgreSQL, Neo4j, and Redis.

### Production Deployment (All-in-One `Dockerfile`)
To simplify PaaS deployment (like Render, Heroku, or AWS App Runner), the root `Dockerfile` utilizes a multi-stage build:
1. **Node Stage**: Compiles the React SPA.
2. **Python Stage**: Installs FastAPI dependencies, Nginx, and copies the compiled React files.
3. **Runtime**: The `start-all.sh` entrypoint runs Alembic migrations, boots Uvicorn in the background, and runs Nginx in the foreground to serve the frontend and proxy `/v1/` API requests.

This allows the entire application to be deployed as a single Web Service, connecting to external managed databases.

---

## Security

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Redis (RateLimit)
    participant API
    participant Postgres

    User->>Frontend: Submit Login Credentials
    Frontend->>API: POST /api/v1/auth/login
    API->>Redis (RateLimit): Check login attempts
    Redis (RateLimit)-->>API: Allow
    API->>Postgres: Lookup user by email
    Postgres-->>API: Return hashed password
    API->>API: Verify bcrypt hash
    API->>API: Generate signed JWT
    API-->>Frontend: Return JWT (1440m expiry)
    Frontend->>Frontend: Store in sessionStorage
```

### Role-Based Access Control

```mermaid
flowchart LR
    User[Anonymous User] --> Reg[Registration]
    Reg --> P(PATIENT)
    Reg --> C(CLINICIAN)
    Reg --> Ph(PHARMACIST)
    Reg --> R(RESEARCHER)
    
    DB[(Database Override)] -.->|Manual SQL Only| A(ADMIN)

    P -->|Allowed| Int[Interaction Checker]
    C -->|Allowed| AI[AI Protocols]
    C -->|Allowed| Ev[Evidence Portal]
    Ph -->|Allowed| KB[Knowledge Base]
    R -->|Allowed| KB
    
    A -->|Restricted Access| Dash[Admin Dashboard]
    A -->|Restricted Access| Logs[System Audit Logs]
```

### Security Implementations
* **Rate Limiting**: Strict Redis-backed IP rate limiting on authentication and LLM inference endpoints.
* **JWT & Passwords**: JWT with HS256 signatures; all passwords hashed via Bcrypt with dynamic salting.
* **Input Sanitization**: Extensive Pydantic v2 schema validation; strict null-byte and HTML tag stripping on user inputs.
* **Session Storage**: JWT tokens stored purely in `sessionStorage` (cleared on browser close) rather than persistent `localStorage`.
* **Database Isolation**: Alembic schema migrations enforce exact ENUM constraints for roles.
* **Secure Headers**: Nginx enforces HSTS, blocks framing, and sets strict CORS policies.

---

## Data Pipeline

Aushnexa ships with a high-fidelity foundational dataset mapping thousands of compounds to physical mechanisms of action.

```mermaid
flowchart TD
    Raw1[herbs.json] --> Parser[Data Parser]
    Raw2[interactions.json] --> Parser
    Raw3[drug_classes.json] --> Parser
    
    Parser --> Loader[load_graph.py]
    Loader --> Neo4j[(Neo4j Graph)]
    
    Neo4j --> Syn[synonyms.json generation]
    Syn --> Norm[NormalizationService Cache]
```

### Datasets Used
The knowledge graph is seeded using several curated biomedical datasets included in `backend/data_pipeline/seed_data/`:
* **Ayurvedic Herb & Phytochemical Data**: Extracted from clinical compendiums and matched with structural data from **NCBI PubChem**. (`herbs.json`)
* **Allopathic Drug Classes**: Standardized classifications based on the ATC (Anatomical Therapeutic Chemical) system. (`drugs.json`)
* **Herb-Drug Interactions (HDI)**: Interaction matrices and severity ratings derived from the **Tapirro Dataset** and open-access clinical literature. (`interactions.json`)
* **Entity Normalization Maps**: Custom-built synonym dictionaries for NLP mapping between regional herb names, botanical names, and commercial drug names. (`synonyms.json`)

* **Ingestion Execution**: The `load_graph.py` script utilizes Neo4j Cypher batch processing to safely upsert nodes and edges without duplication.

---

## Testing

Testing is implemented via `pytest` for the backend ensuring both relational logic and graph traversals execute flawlessly.

```bash
docker-compose exec backend pytest tests/
```

**Test Coverage**:
* `test_auth.py`: Covers JWT validation, bad credentials, and role escalation blocks.
* `test_interactions.py`: Asserts severity calculation formulas and response schemas.
* `test_neo4j.py`: Ensures correct traversal of `[:INTERACTS_WITH]` and `[:MODULATES]` relationships.

---

## Deployment

Aushnexa is fully containerized and designed to be deployed seamlessly across modern Platform-as-a-Service (PaaS) providers. The recommended production architecture splits the stateless application container from the managed databases.

### Recommended Managed Architecture
*   **Web Application (Frontend + Backend)**: Hosted as a single Docker Web Service on **Render**.
*   **Relational Database & Cache**: PostgreSQL and Redis hosted on **Railway** (or Aiven).
*   **Knowledge Graph**: Hosted on **Neo4j AuraDB** (Fully managed cloud graph).

### Production Deployment Steps
1. **Provision Databases**:
   *   Create a Neo4j AuraDB instance and save the `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD`.
   *   Create a new project on Railway and provision a PostgreSQL database and a Redis instance. Save their connection URLs.
2. **Deploy to Render**:
   *   Create a new **Web Service** on Render connected to your GitHub repository.
   *   Select **Docker** as the runtime environment. Render will automatically detect the root `Dockerfile` (which builds both the React frontend and the Python backend into an all-in-one Nginx container).
3. **Configure Environment Variables**:
   In the Render dashboard, navigate to the Environment tab and add the following keys:
   *   `DATABASE_URL` (Your Railway PostgreSQL connection string)
   *   `NEO4J_URI` (Your AuraDB `neo4j+s://` URI)
   *   `NEO4J_USER` & `NEO4J_PASSWORD`
   *   `REDIS_URL` (Your Railway Redis connection string)
   *   `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, & `SARVAM_API_KEY`
4. **Launch**:
   Render will build the image, automatically expose port `10000`, and run the `start-all.sh` entrypoint script which handles database migrations and starts both FastAPI and Nginx simultaneously.

---

## Supported Languages

Sarvam AI integration enables seamless medical translation into 7 core Indian languages.

| Language | ISO Code | Sarvam Key |
| :--- | :--- | :--- |
| Hindi | `hi` | `hi-IN` |
| Bengali | `bn` | `bn-IN` |
| Marathi | `mr` | `mr-IN` |
| Telugu | `te` | `te-IN` |
| Tamil | `ta` | `ta-IN` |
| Kannada | `kn` | `kn-IN` |
| Malayalam | `ml` | `ml-IN` |

---

## Clinical Safety and Disclaimers

### Enforced Safety Rules
* **Banned Entities Enforcement**: Highly toxic botanicals and strictly regulated synthetic drugs immediately flag interactions as "CRITICAL" overriding default algorithms.
* **Evidence Degradation**: If an interaction is purely theoretical (no clinical papers found), the maximum severity score is automatically handicapped to prevent alarmism without evidence.

### Evidence Level Scale
1. Systematic Reviews / Meta-Analysis
2. Randomized Controlled Trials (RCT)
3. Cohort Studies
4. Case-Control Studies
5. Case Reports
6. Animal / In-Vitro Models (Theoretical)

> **DISCLAIMER:** Aushnexa BioLumina is an informational platform utilizing artificial intelligence and aggregated biomedical databases. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider before modifying any medication regimen or incorporating new botanical supplements.

---

## Contributing

We welcome contributions to expand the knowledge graph and refine the translation models.
* **Code Style**: Python must be fully typed (Type Hints). The React frontend is explicitly standard JS (`.jsx`) with no TypeScript.
* **Database Logic**: All relational database queries must be asynchronous (`asyncpg`).
* **PR Process**: Please open an issue discussing your proposed changes before submitting a Pull Request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

* **[Anthropic Claude](https://www.anthropic.com/)** for unmatched reasoning and clinical protocol synthesis.
* **[Sarvam AI](https://www.sarvam.ai/)** for bringing state-of-the-art native Indian language models.
* **[Neo4j](https://neo4j.com/)** for the powerful graph database engine.
* **NCBI PubMed & ClinicalTrials.gov** for public access to humanity's medical research.
* **CTRI India & Semantic Scholar** for expansive trial and citation aggregation.
