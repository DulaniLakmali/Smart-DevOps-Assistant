import React, { useState, useEffect } from "react";
import { api, socket } from "../api/client";
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Loader2,
  ShieldCheck,
  PackageCheck
} from "lucide-react";

export default function PipelineVisualizerView() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    fetchPipelines();

    const handlePipelineUpdate = (updatedPipeline) => {
      setPipelines((prev) => {
        const index = prev.findIndex((p) => p.id === updatedPipeline.id);
        if (index >= 0) {
          const newPipelines = [...prev];
          newPipelines[index] = updatedPipeline;
          return newPipelines;
        }
        return [updatedPipeline, ...prev];
      });

      setSelectedPipeline((prev) => (prev?.id === updatedPipeline.id ? updatedPipeline : prev));
    };

    socket.on("ci_pipeline_update", handlePipelineUpdate);
    return () => socket.off("ci_pipeline_update", handlePipelineUpdate);
  }, []);

  const fetchPipelines = async () => {
    try {
      const res = await api.get("/devops/ci/pipelines");
      setPipelines(res.data || []);
      if (res.data?.length > 0 && !selectedPipeline) {
        setSelectedPipeline(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch pipelines:", err);
    }
  };

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const res = await api.post("/devops/ci/trigger", {
        pipelineName: "smart-devops-autotask-ci"
      });
      setSelectedPipeline(res.data);
    } catch (err) {
      alert("Error triggering pipeline: " + (err.response?.data?.error || err.message));
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflow: "hidden"
    }}>
      {/* Left List of Pipelines */}
      <div className="glass-panel" style={{
        width: "320px",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        overflowY: "auto",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GitBranch size={18} color="var(--accent-cyan)" /> CI/CD Workflows
          </h3>
          <button
            className="btn btn-primary"
            onClick={handleTrigger}
            disabled={isTriggering}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
          >
            {isTriggering ? <Loader2 size={14} className="spinning" /> : <Play size={14} />} Run Pipeline
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {pipelines.map((p) => {
            const isSelected = selectedPipeline?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPipeline(p)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: isSelected ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                  background: isSelected ? "rgba(0, 242, 254, 0.08)" : "rgba(15, 23, 42, 0.6)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {p.name}
                  </span>
                  <span className={`badge ${p.status === "success" ? "badge-success" : p.status === "running" ? "badge-info" : "badge-danger"}`}>
                    {p.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Branch: <span style={{ color: "var(--accent-cyan)" }}>{p.branch}</span> • Commit: {p.commit}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Duration: {p.duration}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Stage Pipeline Visualizer & Logs */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        overflowY: "auto"
      }}>
        {selectedPipeline ? (
          <>
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                  Workflow: {selectedPipeline.name}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  Triggered at {new Date(selectedPipeline.triggeredAt).toLocaleString()} • ID: {selectedPipeline.id}
                </p>
              </div>
              <span className={`badge ${selectedPipeline.status === "success" ? "badge-success" : selectedPipeline.status === "running" ? "badge-info" : "badge-danger"}`} style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem" }}>
                {selectedPipeline.status}
              </span>
            </div>

            {/* Stages Visualizer DAG / Pipeline Horizontal Tracker */}
            <div>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.8rem" }}>
                Pipeline Execution Stages
              </h4>
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${selectedPipeline.stages.length}, 1fr)`,
                gap: "0.5rem"
              }}>
                {selectedPipeline.stages.map((stage, i) => {
                  const isRunning = stage.status === "running";
                  const isSuccess = stage.status === "success";
                  const isFailed = stage.status === "failed";
                  const isSkipped = stage.status === "skipped";

                  return (
                    <div
                      key={i}
                      style={{
                        background: isRunning
                          ? "rgba(0, 242, 254, 0.12)"
                          : isSuccess
                          ? "rgba(16, 185, 129, 0.12)"
                          : isFailed
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(15, 23, 42, 0.6)",
                        border: `1px solid ${
                          isRunning
                            ? "var(--accent-cyan)"
                            : isSuccess
                            ? "rgba(16, 185, 129, 0.4)"
                            : isFailed
                            ? "rgba(239, 68, 68, 0.4)"
                            : "var(--border-subtle)"
                        }`,
                        borderRadius: "var(--radius-md)",
                        padding: "0.9rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        position: "relative"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>
                          STAGE {i + 1}
                        </span>
                        {isRunning && <span className="pulsing-dot" style={{ background: "var(--accent-cyan)" }} />}
                        {isSuccess && <CheckCircle2 size={16} color="var(--accent-emerald)" />}
                        {isFailed && <XCircle size={16} color="var(--accent-rose)" />}
                        {isSkipped && <Clock size={16} color="var(--text-muted)" />}
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {stage.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {stage.duration}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Logs Terminal */}
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Terminal size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Live Execution Logs & Outputs
                </span>
              </div>
              <div className="code-terminal" style={{ minHeight: "220px", maxHeight: "300px" }}>
                {selectedPipeline.stages.map((stage, i) => (
                  <div key={i} style={{ marginBottom: "0.75rem" }}>
                    <div style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                      === [Stage {i + 1}: {stage.name}] ({stage.status}) ===
                    </div>
                    <div style={{ color: stage.status === "failed" ? "var(--accent-rose)" : "#cbd5e1" }}>
                      {stage.logs || "No logs available."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
            Select a pipeline from the list to inspect execution stages.
          </div>
        )}
      </div>
    </div>
  );
}
