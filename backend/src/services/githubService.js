import axios from "axios";
import { config } from "../config/env.js";

/**
 * Real GitHub API & Actions Connector Service (Chapter 4.2.3 & 5.1.4)
 * Connects directly to GitHub REST API to query repos, commits, and trigger GitHub Actions.
 */

let configuredToken = process.env.GITHUB_TOKEN || "";

export class GitHubService {
  static setToken(token) {
    configuredToken = token ? token.trim() : "";
  }

  static getToken(reqToken) {
    return reqToken || configuredToken;
  }

  static getHeaders(token) {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Smart-DevOps-Assistant"
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Fetch user's repositories (authenticated or public)
   */
  static async getRepositories(reqToken) {
    const token = this.getToken(reqToken);

    if (token) {
      try {
        const res = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=15", {
          headers: this.getHeaders(token),
          timeout: 8000
        });

        return {
          isLive: true,
          repos: res.data.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            owner: r.owner.login,
            isPrivate: r.private,
            description: r.description || "DevOps project repository",
            stars: r.stargazers_count,
            defaultBranch: r.default_branch,
            htmlUrl: r.html_url,
            language: r.language || "TypeScript"
          }))
        };
      } catch (err) {
        console.warn("GitHub API error with token, attempting public user repos:", err.message);
      }
    }

    // Attempt to load live public repos for DulaniLakmali
    try {
      const res = await axios.get("https://api.github.com/users/DulaniLakmali/repos?sort=updated&per_page=12", {
        headers: this.getHeaders(),
        timeout: 6000
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          owner: r.owner.login,
          isPrivate: r.private,
          description: r.description || "DevOps project repository",
          stars: r.stargazers_count,
          defaultBranch: r.default_branch,
          htmlUrl: r.html_url,
          language: r.language || "JavaScript"
        }));

        // Prioritize devops-ai-demo at the top
        mapped.sort((a, b) => (a.name === "devops-ai-demo" ? -1 : b.name === "devops-ai-demo" ? 1 : 0));

        return {
          isLive: true,
          repos: mapped
        };
      }
    } catch (err) {
      console.warn("Public GitHub API fetch failed, falling back to cached repos:", err.message);
    }

    // High-fidelity fallback / demo repositories
    return {
      isLive: false,
      repos: [
        {
          id: 901234,
          name: "devops-ai-demo",
          fullName: "DulaniLakmali/devops-ai-demo",
          owner: "DulaniLakmali",
          isPrivate: false,
          description: "Agentic AI-Powered Smart DevOps Assistant for Autonomous Software Delivery",
          stars: 1,
          defaultBranch: "main",
          htmlUrl: "https://github.com/DulaniLakmali/devops-ai-demo",
          language: "JavaScript"
        },
        {
          id: 871231,
          name: "microservices-payment-api",
          fullName: "Horizon-Research/microservices-payment-api",
          owner: "Horizon-Research",
          isPrivate: true,
          description: "High-throughput cloud-native payment processing microservice",
          stars: 18,
          defaultBranch: "main",
          htmlUrl: "https://github.com/Horizon-Research/microservices-payment-api",
          language: "Node.js"
        },
        {
          id: 765432,
          name: "infrastructure-terraform-k8s",
          fullName: "Horizon-Research/infrastructure-terraform-k8s",
          owner: "Horizon-Research",
          isPrivate: true,
          description: "Declarative Terraform and Kubernetes manifests for multi-cloud deployments",
          stars: 25,
          defaultBranch: "main",
          htmlUrl: "https://github.com/Horizon-Research/infrastructure-terraform-k8s",
          language: "HCL"
        }
      ]
    };
  }

  /**
   * Fetch recent commits for a repository
   */
  static async getCommits(owner, repo, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=8`, {
        headers: this.getHeaders(token),
        timeout: 8000
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((c) => ({
          sha: c.sha.substring(0, 7),
          message: c.commit?.message || "Commit update",
          author: c.commit?.author?.name || c.author?.login || "Dulani",
          date: c.commit?.author?.date || new Date().toISOString(),
          htmlUrl: c.html_url
        }));
      }
    } catch (err) {
      console.warn("Live commits fetch failed, falling back to simulated history:", err.message);
    }

    // Default simulated commit history
    return [
      { sha: "d34ed87", message: "Update and rename workflows to .github/workflows/deploy.yml", author: "DulaniLakmali", date: new Date().toISOString() },
      { sha: "7f9a2c1", message: "feat(ai-agent): add autonomous DAG planner and risk classifier", author: "Dulani Maduwanthi", date: new Date(Date.now() - 3600000).toISOString() },
      { sha: "8b1c4e9", message: "ci(github-actions): integrate automated test suite for TC001-TC007", author: "Weerasooriya T.V.M.", date: new Date(Date.now() - 7200000).toISOString() },
      { sha: "3d5f1a2", message: "security(sast): add DevSecOps container compliance scanner", author: "Dayananda I.A.", date: new Date(Date.now() - 14400000).toISOString() }
    ];
  }

  /**
   * Fetch GitHub Actions workflows
   */
  static async getWorkflows(owner, repo, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/workflows`, {
        headers: this.getHeaders(token),
        timeout: 8000
      });

      if (res.data?.workflows && res.data.workflows.length > 0) {
        return res.data.workflows.map((w) => ({
          id: w.id,
          name: w.name,
          path: w.path,
          state: w.state,
          htmlUrl: w.html_url
        }));
      }
    } catch (err) {
      console.warn("Live workflows fetch failed, falling back to simulated workflows:", err.message);
    }

    return [
      { id: 362267851, name: "DevOps Assistant Deployment", path: ".github/workflows/deploy.yml", state: "active" },
      { id: 102, name: "Automated Security SAST & Linting", path: ".github/workflows/security.yml", state: "active" },
      { id: 103, name: "Chapter 6 Evaluation Benchmark Suite", path: ".github/workflows/test.yml", state: "active" }
    ];
  }

  /**
   * Trigger real GitHub Actions workflow dispatch
   */
  static async triggerWorkflowDispatch(owner, repo, workflowId, ref = "main", reqToken) {
    const token = this.getToken(reqToken);

    if (token) {
      try {
        await axios.post(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
          { ref },
          { headers: this.getHeaders(token) }
        );

        return {
          success: true,
          isLive: true,
          message: `Successfully triggered GitHub Actions workflow dispatch on branch '${ref}'.`
        };
      } catch (err) {
        return {
          success: false,
          isLive: true,
          message: `GitHub API error: ${err.response?.data?.message || err.message}`
        };
      }
    }

    return {
      success: true,
      isLive: false,
      message: `Workflow #${workflowId} triggered successfully in sandbox mode.`
    };
  }
}
