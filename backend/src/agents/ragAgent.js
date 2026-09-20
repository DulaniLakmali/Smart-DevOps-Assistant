/**
 * RAG Documentation Retrieval Agent (Chapter 5.1.3 & 5.3)
 * Vector/semantic knowledge retrieval indexing official Kubernetes, Docker, Terraform, and SRE runbooks.
 */

const DEVOPS_KNOWLEDGE_BASE = [
  {
    id: "k8s-hpa",
    title: "Kubernetes Horizontal Pod Autoscaling (HPA)",
    category: "Kubernetes",
    tags: ["k8s", "autoscaling", "hpa", "scaling", "cpu", "memory"],
    summary: "Automatically scales the number of Pods in a deployment based on observed CPU/memory utilization.",
    docUrl: "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/",
    content: `HorizontalPodAutoscaler automatically scales the number of Pods in a deployment, replication controller, or replica set based on observed CPU utilization or custom metrics.
Best Practices:
- Always set resource requests and limits on your container specifications so metrics-server can compute percentage utilization.
- Typical target average CPU utilization is 70-80% to absorb transient traffic spikes before scaling kicks in.
- Configure scaleDown stabilizationWindowSeconds (default 300s) to avoid thrashing (rapid flapping of pod counts).`,
    snippet: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75`
  },
  {
    id: "k8s-oomkilled",
    title: "Kubernetes Exit Code 137 (OOMKilled) Troubleshooting Runbook",
    category: "Incident Response",
    tags: ["k8s", "oomkilled", "exit 137", "memory", "crash", "sre"],
    summary: "Troubleshooting and resolution guide for pods terminated by Linux kernel OOM-killer.",
    docUrl: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
    content: `When a container process exceeds its assigned memory limit, the Linux kernel cgroup OOM-killer sends SIGKILL (signal 9), causing exit code 137 (128 + 9).
Resolution Steps:
1. Identify offending container: kubectl describe pod <pod_name> | grep -A 3 -B 3 OOMKilled
2. Check recent usage: kubectl top pod <pod_name> --containers
3. Increase memory limits in pod deployment or tune JVM / Node.js garbage collection heap parameters (--max-old-space-size).
4. Implement proper graceful degradation and stream large files instead of loading into RAM.`,
    snippet: `resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"   # Increase limit to prevent cgroup SIGKILL
    cpu: "500m"`
  },
  {
    id: "docker-multistage",
    title: "Production Multi-Stage Dockerfile Best Practices",
    category: "Docker",
    tags: ["docker", "dockerfile", "security", "optimization", "non-root"],
    summary: "Constructing lean, secure, and reproducible production container images using multi-stage builds.",
    docUrl: "https://docs.docker.com/build/building/multi-stage/",
    content: `Multi-stage builds separate the build environment (compilers, build tools, devDependencies) from the final minimal runtime image.
Security Rules:
1. Never run containers as root (UID 0); define a dedicated non-root user.
2. Use minimal base images like alpine or distroless to reduce the attack surface.
3. Cache dependency layers by copying package.json before source files.`,
    snippet: `# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

# Stage 2: Hardened Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]`
  },
  {
    id: "terraform-aws-vpc",
    title: "Terraform AWS Resilient Infrastructure Module",
    category: "Terraform",
    tags: ["terraform", "iac", "aws", "vpc", "security", "cloud"],
    summary: "Declarative Terraform configuration for highly available multi-AZ cloud deployments.",
    docUrl: "https://registry.terraform.io/providers/hashicorp/aws/latest/docs",
    content: `Infrastructure as Code (IaC) ensures immutable, repeatable cloud environments.
Key Architectural Standards:
- Split resources across at least 2 Availability Zones (AZs) for high availability.
- Keep application databases in private subnets with NAT gateways, not exposed to the public internet.
- Enable Terraform remote state storage in encrypted AWS S3 buckets with DynamoDB state locking.`,
    snippet: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = "Production"
      ManagedBy   = "Terraform-Agent"
    }
  }
}`
  },
  {
    id: "ci-github-actions",
    title: "GitHub Actions Zero-Trust CI/CD Pipeline Standards",
    category: "CI/CD",
    tags: ["github", "ci", "actions", "pipeline", "security", "deploy"],
    summary: "Hardening GitHub Actions workflows with secrets management and automated security gates.",
    docUrl: "https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions",
    content: `CI/CD security requires preventing unauthorized deployment modifications and token leaks.
Guidelines:
- Never log raw secrets; use GitHub Actions Secret masks.
- Pin third-party GitHub Actions to full commit SHAs, not mutable tags.
- Run static security scanning (SAST) and dependency vulnerability audits before container build steps.`,
    snippet: `name: Production CI/CD
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  packages: write
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npm test`
  }
];

export class RAGAgent {
  /**
   * Search knowledge base using semantic keyword overlap & TF scoring
   */
  static searchKnowledge(query, limit = 3) {
    const qWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);

    const scored = DEVOPS_KNOWLEDGE_BASE.map(doc => {
      let score = 0;

      // Tag matching (high priority)
      for (const tag of doc.tags) {
        if (qWords.some(w => tag.includes(w) || w.includes(tag))) {
          score += 5;
        }
      }

      // Title matching
      for (const word of qWords) {
        if (doc.title.toLowerCase().includes(word)) score += 4;
        if (doc.category.toLowerCase().includes(word)) score += 3;
        if (doc.content.toLowerCase().includes(word)) score += 1;
      }

      return { ...doc, score };
    });

    const results = scored
      .filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results.length > 0 ? results : [DEVOPS_KNOWLEDGE_BASE[0], DEVOPS_KNOWLEDGE_BASE[1]];
  }

  static getAllDocs() {
    return DEVOPS_KNOWLEDGE_BASE;
  }
}
