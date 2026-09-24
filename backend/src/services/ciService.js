import { GitHubService, DEFAULT_OWNER, DEFAULT_REPO } from "./githubService.js";

/**
 * CI/CD Pipeline Automation Service (Chapter 5.1.4 & Chapter 6.3.2 TC002)
 * Bridges directly to Real GitHub Actions for live cloud builds, stages, and logs,
 * while maintaining a high-fidelity local simulation sandbox.
 */

let activePipelines = [
  {
    id: "pipe-101",
    name: "production-release-workflow",
    branch: "main",
    commit: "7f9a2c1",
    commitMsg: "feat(auth): add OAuth2 and MFA verification",
    status: "success",
    duration: "2m 14s",
    source: "SIMULATED",
    triggeredAt: new Date(Date.now() - 3600000).toISOString(),
    stages: [
      { name: "Code Checkout", status: "success", duration: "4s", logs: "Fetched 14 files at commit 7f9a2c1" },
      { name: "Static Linting", status: "success", duration: "12s", logs: "ESLint passed: 0 warnings, 0 errors." },
      { name: "Unit Tests", status: "success", duration: "28s", logs: "Jest: 28/28 tests passed (100% coverage)." },
      { name: "Security Audit", status: "success", duration: "15s", logs: "npm audit: 0 vulnerabilities found." },
      { name: "Docker Container Build", status: "success", duration: "45s", logs: "Tagged image registry.internal/app:v2.1" },
      { name: "Kubernetes Rolling Deploy", status: "success", duration: "30s", logs: "Deployment roll-out successfully finished." }
    ]
  },
  {
    id: "pipe-102",
    name: "staging-integration-test",
    branch: "develop",
    commit: "3b4d1e9",
    commitMsg: "refactor(api): database pooling update",
    status: "failed",
    duration: "1m 02s",
    source: "SIMULATED",
    triggeredAt: new Date(Date.now() - 14400000).toISOString(),
    stages: [
      { name: "Code Checkout", status: "success", duration: "3s", logs: "Fetched 22 files" },
      { name: "Static Linting", status: "success", duration: "10s", logs: "Lint check passed" },
      { name: "Unit Tests", status: "failed", duration: "49s", logs: "Error: DB connection timeout at pool.connect()" },
      { name: "Security Audit", status: "skipped", duration: "0s", logs: "Skipped due to upstream failure" },
      { name: "Docker Container Build", status: "skipped", duration: "0s", logs: "Skipped" },
      { name: "Kubernetes Rolling Deploy", status: "skipped", duration: "0s", logs: "Skipped" }
    ]
  }
];

export class CIService {
  /**
   * Retrieve pipelines list - merges real GitHub Actions runs with simulation sandbox
   */
  static async getPipelines(mode = "auto", reqToken = null, owner = DEFAULT_OWNER, repo = DEFAULT_REPO) {
    if (mode === "simulated") {
      return { isLive: false, mode: "simulated", pipelines: activePipelines };
    }

    // Try fetching real GitHub Actions runs
    try {
      const realRunsData = await GitHubService.getWorkflowRuns(owner, repo, reqToken);
      if (realRunsData.isLive && realRunsData.runs.length > 0) {
        const livePipelines = realRunsData.runs.map((r) => ({
          id: String(r.id),
          name: r.name,
          branch: r.headBranch,
          commit: r.headSha,
          commitMsg: r.displayTitle,
          status: r.status === "completed" ? (r.conclusion === "success" ? "success" : "failed") : "running",
          rawStatus: r.status,
          rawConclusion: r.conclusion,
          author: r.author,
          authorAvatar: r.authorAvatar,
          duration: r.status === "completed" ? "Completed" : "Running...",
          triggeredAt: r.createdAt,
          htmlUrl: r.htmlUrl,
          runNumber: r.runNumber,
          source: "GITHUB_ACTIONS",
          owner,
          repo
        }));

        return {
          isLive: true,
          mode: "real",
          owner,
          repo,
          pipelines: livePipelines
        };
      }
    } catch (err) {
      console.warn("Real GitHub Actions fetch failed:", err.message);
    }

    return {
      isLive: false,
      mode: "simulated",
      owner,
      repo,
      pipelines: activePipelines
    };
  }

  /**
   * Fetch real jobs and steps for a specific pipeline run
   */
  static async getRunJobs(runId, reqToken = null, owner = DEFAULT_OWNER, repo = DEFAULT_REPO) {
    // Check if it's a simulated run
    const sim = activePipelines.find((p) => p.id === runId);
    if (sim) {
      return {
        isLive: false,
        runId,
        jobs: [{
          id: sim.id,
          name: sim.name,
          status: sim.status,
          steps: sim.stages.map((s, idx) => ({
            number: idx + 1,
            name: s.name,
            status: s.status === "success" ? "completed" : s.status,
            conclusion: s.status,
            duration: s.duration,
            logs: s.logs
          }))
        }]
      };
    }

    // Fetch real GitHub Actions jobs and steps
    const jobs = await GitHubService.getRunJobs(owner, repo, runId, reqToken);
    return {
      isLive: true,
      runId,
      owner,
      repo,
      jobs
    };
  }

  /**
   * Fetch real raw terminal logs for a job
   */
  static async getJobLogs(jobId, reqToken = null, owner = DEFAULT_OWNER, repo = DEFAULT_REPO) {
    // Check if it's simulated
    const sim = activePipelines.find((p) => p.id === jobId);
    if (sim) {
      return sim.stages.map((s) => `[${s.status.toUpperCase()}] ${s.name} (${s.duration})\n  ${s.logs}`).join("\n\n");
    }

    return await GitHubService.getJobLogs(owner, repo, jobId, reqToken);
  }

  /**
   * Trigger a pipeline - supports both real GitHub Actions dispatch and simulated runner
   */
  static async triggerPipeline(pipelineName = "smart-devops-ci", io = null, reqToken = null, options = {}) {
    const mode = options.mode || "auto";
    const owner = options.owner || DEFAULT_OWNER;
    const repo = options.repo || DEFAULT_REPO;
    const ref = options.ref || "main";
    const workflowId = options.workflowId || "ci.yml";

    const token = GitHubService.getToken(reqToken);

    // If real mode requested, trigger real GitHub Actions dispatch
    if (mode === "real" && token) {
      const dispatchResult = await GitHubService.triggerWorkflowDispatch(owner, repo, workflowId, ref, token);

      if (dispatchResult.success) {
        const livePipeline = {
          id: `gh-${Date.now().toString().slice(-6)}`,
          name: pipelineName || "Smart DevOps Assistant CI/CD Pipeline",
          branch: ref,
          commit: "HEAD",
          commitMsg: `Dispatched via Smart DevOps Assistant to ${owner}/${repo}`,
          status: "running",
          duration: "Queued...",
          source: "GITHUB_ACTIONS",
          owner,
          repo,
          triggeredAt: new Date().toISOString(),
          stages: [
            { name: "Code Checkout", status: "running", duration: "...", logs: "GitHub Actions runner initializing..." },
            { name: "Set up Node.js Runtime", status: "pending", duration: "-", logs: "" },
            { name: "Install Backend Dependencies", status: "pending", duration: "-", logs: "" },
            { name: "Run Evaluation Benchmark Tests", status: "pending", duration: "-", logs: "" },
            { name: "Install Frontend Dependencies", status: "pending", duration: "-", logs: "" },
            { name: "Build Frontend Production Bundle", status: "pending", duration: "-", logs: "" },
            { name: "Container & DevSecOps Validation", status: "pending", duration: "-", logs: "" }
          ]
        };

        if (io) io.emit("ci_pipeline_update", livePipeline);
        return livePipeline;
      }
    }

    // Default: High-fidelity simulated runner (Chapter 6 TC002)
    const pipelineId = `pipe-${Date.now().toString().slice(-4)}`;
    const newPipeline = {
      id: pipelineId,
      name: pipelineName,
      branch: "main",
      commit: Math.random().toString(36).substring(2, 9),
      commitMsg: "Auto-triggered by Smart DevOps Assistant Agent",
      status: "running",
      duration: "running...",
      source: "SIMULATED",
      triggeredAt: new Date().toISOString(),
      stages: [
        { name: "Code Checkout", status: "pending", duration: "-", logs: "" },
        { name: "Static Linting", status: "pending", duration: "-", logs: "" },
        { name: "Unit Tests", status: "pending", duration: "-", logs: "" },
        { name: "Security Audit", status: "pending", duration: "-", logs: "" },
        { name: "Docker Container Build", status: "pending", duration: "-", logs: "" },
        { name: "Kubernetes Rolling Deploy", status: "pending", duration: "-", logs: "" }
      ]
    };

    activePipelines.unshift(newPipeline);

    // Asynchronous step-by-step runner with live socket updates
    (async () => {
      for (let i = 0; i < newPipeline.stages.length; i++) {
        const stage = newPipeline.stages[i];
        stage.status = "running";
        if (io) io.emit("ci_pipeline_update", newPipeline);

        await new Promise((r) => setTimeout(r, 1200));

        stage.status = "success";
        stage.duration = `${(Math.random() * 8 + 4).toFixed(1)}s`;
        stage.logs = `Stage [${stage.name}] completed with exit code 0.`;
        if (io) io.emit("ci_pipeline_update", newPipeline);
      }

      newPipeline.status = "success";
      newPipeline.duration = "1m 15s";
      if (io) io.emit("ci_pipeline_update", newPipeline);
    })();

    return newPipeline;
  }
}
