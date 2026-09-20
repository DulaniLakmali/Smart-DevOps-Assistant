/**
 * CI/CD Pipeline Automation Service (Chapter 5.1.4 & Chapter 6.3.2 TC002)
 * Simulates and executes GitHub Actions workflows with stage-by-stage progression.
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
  static getPipelines() {
    return activePipelines;
  }

  static async triggerPipeline(pipelineName = "smart-devops-ci", io = null) {
    const pipelineId = `pipe-${Date.now().toString().slice(-4)}`;
    const newPipeline = {
      id: pipelineId,
      name: pipelineName,
      branch: "main",
      commit: Math.random().toString(36).substring(2, 9),
      commitMsg: "Auto-triggered by Smart DevOps Assistant Agent",
      status: "running",
      duration: "running...",
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
