# Agentic AI-Powered Smart DevOps Assistant
### Enterprise Autonomous Software Delivery, SRE Diagnostics & DevSecOps Platform

**Horizon Campus — Faculty of Information Technology**  
**Degree:** BSc (Hons.) in Information Technology  
**Module:** IT41028 – Final Year Project  
**Authors:** B.L.A.I. Maduwanthi, T.V.M. Weerasooriya, I.A. Dayananda, V.A.D.L. Karunarathna  
**Supervisors:** Isuru Samarappulige, Anuradha Ishani Yapa  

---

## 1. System Architecture Diagram

```
                                  +---------------------------------------+
                                  |     React 18 + Vite Web Dashboard     |
                                  |   (13 Specialized Operations Views)   |
                                  +-------------------+-------------------+
                                                      |
                                          REST API & WebSockets
                                                      |
                                  +-------------------v-------------------+
                                  |     Node.js / Express API Server      |
                                  | (RBAC, Secret Redactor, Audit Logger) |
                                  +-------------------+-------------------+
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                                                     |
+------------------v------------------+                              +-------------------v-------------------+
|      Multi-Agent AI Engine          |                              |    DevOps Runtime & Sandbox Layer     |
| - PlannerAgent: Intent & Risk DAG   |                              | - Real GitHub REST API & Actions      |
| - ExecutorAgent: Multi-step runner  |                              | - Docker Engine Connector (Live/Mock) |
| - LogAnalyzerAgent: SRE RCA Studio  |                              | - Kubernetes kubectl (Deploy/Scale)   |
| - MonitoringAgent: Saturation Alert |                              | - GitHub Actions CI Runner (Pipelines)|
| - RAGAgent: Semantic Docs Retrieval |                              | - Terraform IaC & AWS Simulator       |
| - ManifestService: YAML Synthesizer |                              | - DevSecOps SAST Vulnerability Scanner|
| - LLM: Groq / OpenAI / Local Core   |                              | - Interactive Web Shell CLI Runner    |
+------------------+------------------+                              +---------------------------------------+
                   |
+------------------v------------------+
|    3NF SQLite Relational Database   |
| - users (RBAC 4 roles)              |
| - requests                          |
| - task_plans (Risk: SAFE/HIGH_RISK) |
| - execution_logs                    |
| - system_metrics (CPU/RAM/Disk)     |
| - audit_records (Immutable trail)   |
+-------------------------------------+
```

---

## 2. The 13 Operations Modules

1. **AI Agent Console**: Natural language prompt input, streaming agent thought-process, DAG execution plans, and suggested prompt shortcuts.
2. **DevOps Overview**: High-level cluster KPIs (CPU, Memory, Disk, Active Pods), connected toolchain status, and recent autonomous task plans.
3. **GitHub Cloud Connector**: Real GitHub REST API connector with PAT token auth, real/sandbox repository browsing, commit timeline, and GitHub Actions workflow dispatch triggers.
4. **CI/CD Pipelines**: 6-stage GitHub Actions visual workflow runner (*Checkout &rarr; Lint &rarr; Unit Tests &rarr; Security Audit &rarr; Docker Build &rarr; Kubernetes Deploy*) with live logs.
5. **Log RCA Studio**: Pre-loaded thesis incidents (HTTP 500, DB Constraint Error, Kubernetes Pod CrashLoopBackOff, CI Rollup Failure) with AI Root Cause Analysis and 1-click remediation.
6. **Interactive Web Shell**: Live authenticated CLI shell running `docker`, `kubectl`, `git`, `node`, `curl` with RBAC guard.
7. **Manifest & Container Studio**: Autonomous synthesis of multi-stage Dockerfiles, K8s deployments, services, and CI workflows with 1-click download.
8. **DevSecOps Scanner**: Automated Static Analysis Security Testing (SAST) for Dockerfiles and Kubernetes YAML against CIS benchmarks, providing Security Scores (0-100) and letter grades.
9. **RAG Knowledge Base**: Semantic retrieval-augmented documentation engine indexing official Kubernetes, Docker, Terraform, and SRE runbooks with verified snippets and links.
10. **Infrastructure Hub**: Kubernetes deployment replica scaling steppers, pod crash recovery, Docker containers, and Terraform HCL generator.
11. **Metrics & Chaos Lab**: Real-time Chart.js telemetry with a **Live OS Hardware vs. Chaos Simulation toggle** and proactive autoscaling alerts.
12. **Audit Ledger**: Immutable compliance log with automatic masking of secrets, API keys, and passwords (`[REDACTED]`).
13. **Thesis Report & MTTR**: Quantitative evaluation dashboard comparing Manual vs. AI MTTR (97.4% reduction) with a 1-click **Export Thesis Report (.md)** button.

---

## 3. How to Run

### Development Mode (Local)
Double-click:
👉 **`start-dev.bat`**

Or manually from terminal:
```bash
# Backend
npm run backend

# Frontend
npm run frontend
```
- Dashboard: [http://localhost:5173](http://localhost:5173)
- API Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Production Containerized Deployment (Docker Compose)
```bash
docker compose up --build
```
Runs both the backend and Nginx-powered frontend in containers.

### Run Automated Chapter 6 Test Suite
```bash
npm test
```
*Validates test cases **TC001 to TC006** with 100% pass rate.*
