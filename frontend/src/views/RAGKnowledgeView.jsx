import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  BookOpen,
  Search,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Code2
} from "lucide-react";

export default function RAGKnowledgeView() {
  const [docs, setDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await api.get("/rag/docs");
      setDocs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (queryToRun) => {
    const q = queryToRun !== undefined ? queryToRun : searchQuery;
    if (!q.trim()) {
      fetchDocs();
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/rag/query", { query: q });
      setDocs(res.data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copySnippet = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SUGGESTED_QUERIES = [
    "Horizontal Pod Autoscaling",
    "OOMKilled exit code 137",
    "Multi-stage Dockerfile",
    "Terraform AWS architecture",
    "GitHub Actions security"
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Header & Search */}
      <div className="glass-panel" style={{
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={20} color="var(--accent-cyan)" /> RAG Documentation & Specifications Engine
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Semantic retrieval-augmented knowledge base indexing official Kubernetes, Docker, Terraform, and SRE specs (Chapter 5.1.3).
            </p>
          </div>
          <span className="badge badge-purple">VECTOR KNOWLEDGE BASE</span>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              className="input-control"
              placeholder="Search DevOps documentation, runbooks, or configuration patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleSearch()}
            disabled={isLoading}
          >
            Search
          </button>
        </div>

        {/* Query Suggestions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Suggested Queries:</span>
          {SUGGESTED_QUERIES.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchQuery(sq);
                handleSearch(sq);
              }}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "15px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(30, 41, 59, 0.5)",
                color: "var(--text-secondary)",
                fontSize: "0.72rem",
                cursor: "pointer"
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Docs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
        {docs.map((doc) => (
          <div key={doc.id} className="glass-panel" style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="badge badge-info" style={{ fontSize: "0.65rem", marginBottom: "0.3rem" }}>
                  {doc.category}
                </span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {doc.title}
                </h3>
              </div>
              <a
                href={doc.docUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  fontSize: "0.75rem",
                  textDecoration: "none"
                }}
              >
                Docs <ExternalLink size={12} />
              </a>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {doc.summary}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {doc.tags?.map((t, idx) => (
                <span key={idx} style={{
                  fontSize: "0.68rem",
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  padding: "0.15rem 0.4rem",
                  color: "var(--text-muted)"
                }}>
                  #{t}
                </span>
              ))}
            </div>

            {/* Code Snippet Box */}
            {doc.snippet && (
              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Verified Configuration Snippet
                  </span>
                  <button
                    onClick={() => copySnippet(doc.id, doc.snippet)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedId === doc.id ? "var(--accent-emerald)" : "var(--accent-cyan)",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    {copiedId === doc.id ? <Check size={12} /> : <Copy size={12} />} {copiedId === doc.id ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="code-terminal" style={{ fontSize: "0.75rem", maxHeight: "160px", overflowY: "auto" }}>
                  {doc.snippet}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
