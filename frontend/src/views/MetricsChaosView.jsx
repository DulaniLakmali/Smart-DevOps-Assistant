import React, { useState, useEffect } from "react";
import { api, socket } from "../api/client";
import {
  Activity,
  Flame,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MetricsChaosView({ telemetry }) {
  const [history, setHistory] = useState([]);
  const [chaosLoading, setChaosLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    fetchHistory();

    const handleStream = (sample) => {
      setHistory((prev) => {
        const next = [...prev, sample.telemetry];
        if (next.length > 20) next.shift();
        return next;
      });
      if (sample.evaluation?.recommendation) {
        setRecommendation(sample.evaluation.recommendation);
      } else {
        setRecommendation(null);
      }
    };

    socket.on("telemetry_stream", handleStream);
    return () => socket.off("telemetry_stream", handleStream);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/metrics/history");
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectChaos = async (faultType) => {
    setChaosLoading(true);
    try {
      const res = await api.post("/metrics/chaos", { faultType });
      if (res.data?.evaluation?.recommendation) {
        setRecommendation(res.data.evaluation.recommendation);
      } else {
        setRecommendation(null);
      }
    } catch (err) {
      alert("Chaos injection error: " + (err.response?.data?.error || err.message));
    } finally {
      setChaosLoading(false);
    }
  };

  // Chart Data Configuration
  const labels = history.map((_, i) => `T-${(history.length - 1 - i) * 3}s`);
  const cpuData = history.map((h) => h.cpu_percent || h.cpu || 40);
  const memData = history.map((h) => h.memory_percent || h.memory || 50);

  const chartData = {
    labels,
    datasets: [
      {
        label: "CPU Utilization (%) [Threshold: 85%]",
        data: cpuData,
        borderColor: "#00f2fe",
        backgroundColor: "rgba(0, 242, 254, 0.1)",
        fill: true,
        tension: 0.3
      },
      {
        label: "Memory Consumption (%) [Threshold: 80%]",
        data: memData,
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { family: "Inter", size: 12 }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b" }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" }
      }
    }
  };

  const [activeMode, setActiveMode] = useState("CHAOS_SIMULATION");

  const handleToggleMode = async (mode) => {
    setActiveMode(mode);
    try {
      await api.post("/metrics/mode", { mode });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Title & Mode Switcher Header */}
      <div className="glass-panel" style={{
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={20} color="var(--accent-cyan)" /> Real-Time Telemetry & Chaos Engineering Lab
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Monitor real physical host hardware or simulate production saturation incidents (Chapter 3.4.2 & 6.4).
          </p>
        </div>

        {/* Telemetry Mode Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(15, 23, 42, 0.6)", padding: "0.3rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
          <button
            className={`btn ${activeMode === "CHAOS_SIMULATION" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
            onClick={() => handleToggleMode("CHAOS_SIMULATION")}
          >
            ⚡ Chaos Simulation
          </button>
          <button
            className={`btn ${activeMode === "LIVE_HARDWARE" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
            onClick={() => handleToggleMode("LIVE_HARDWARE")}
          >
            💻 Live Host Hardware
          </button>
        </div>
      </div>

      {/* Proactive Recommendation Banner (If Chaos Injected) */}
      {recommendation && (
        <div style={{
          background: "linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)",
          border: "1px solid rgba(245, 158, 11, 0.5)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-amber)" }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              Autonomous Scaling Recommendation from MonitoringAgent
            </h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
            {recommendation.rationale}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="code-terminal" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "var(--accent-cyan)" }}>
              $ {recommendation.command}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleInjectChaos("recover")}
              style={{ fontSize: "0.8rem" }}
            >
              <Zap size={14} /> Apply Scaling Action & Recover
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Live Graph */}
      <div className="glass-panel" style={{ padding: "1.25rem", minHeight: "320px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Resource Saturation Stream vs Target Thresholds
        </h3>
        <div style={{ flex: 1, minHeight: "260px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Chaos Injection Buttons Panel */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Flame size={18} color="var(--accent-rose)" /> Chaos Fault Injector (Evaluation Scenarios)
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
          Trigger controlled fault events to evaluate the assistant's MTTR (Mean Time to Recovery) and alert latency:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleInjectChaos("cpu_spike")}
            disabled={chaosLoading}
            style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "var(--accent-rose)" }}
          >
            <Flame size={16} /> Spike CPU to 94% (&gt;85%)
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleInjectChaos("memory_leak")}
            disabled={chaosLoading}
            style={{ borderColor: "rgba(245, 158, 11, 0.4)", color: "var(--accent-amber)" }}
          >
            <Activity size={16} /> Spike RAM to 89% (&gt;80%)
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleInjectChaos("pod_crash")}
            disabled={chaosLoading}
            style={{ borderColor: "rgba(139, 92, 246, 0.4)", color: "var(--accent-indigo)" }}
          >
            <TrendingUp size={16} /> Crash 2 K8s Pods
          </button>

          <button
            className="btn btn-primary"
            onClick={() => handleInjectChaos("recover")}
            disabled={chaosLoading}
          >
            <RefreshCw size={16} /> Restore Baseline State
          </button>
        </div>
      </div>
    </div>
  );
}
