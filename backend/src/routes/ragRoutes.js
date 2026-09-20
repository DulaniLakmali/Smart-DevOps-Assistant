import express from "express";
import { RAGAgent } from "../agents/ragAgent.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createRAGRouter = () => {
  const router = express.Router();

  // GET /api/rag/docs - Get all indexed DevOps specifications
  router.get("/docs", checkPermission("read"), (req, res) => {
    res.json(RAGAgent.getAllDocs());
  });

  // POST /api/rag/query - Semantic search over documentation
  router.post("/query", checkPermission("read"), (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });
    const results = RAGAgent.searchKnowledge(query);
    res.json({ query, results });
  });

  return router;
};
