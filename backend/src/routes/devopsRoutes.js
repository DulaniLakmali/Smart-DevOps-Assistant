import express from "express";
import { DockerService } from "../services/dockerService.js";
import { K8sService } from "../services/k8sService.js";
import { CIService } from "../services/ciService.js";
import { CloudService } from "../services/cloudService.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createDevOpsRouter = (io) => {
  const router = express.Router();

  // --- DOCKER ---
  router.get("/containers", checkPermission("read"), async (req, res) => {
    try {
      const containers = await DockerService.getContainers();
      res.json(containers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/containers/:id/restart", checkPermission("execute_safe"), async (req, res) => {
    try {
      const result = await DockerService.restartContainer(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- KUBERNETES ---
  router.get("/k8s/pods", checkPermission("read"), async (req, res) => {
    try {
      const pods = await K8sService.getPods();
      res.json(pods);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/k8s/deployments", checkPermission("read"), async (req, res) => {
    try {
      const deps = await K8sService.getDeployments();
      res.json(deps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/k8s/scale", checkPermission("scale"), async (req, res) => {
    try {
      const { name, replicas } = req.body;
      const result = await K8sService.scaleDeployment(name, replicas);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/k8s/pods/:name/restart", checkPermission("execute_safe"), async (req, res) => {
    try {
      const result = await K8sService.restartPod(req.params.name);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CI/CD PIPELINES ---
  router.get("/ci/pipelines", checkPermission("read"), (req, res) => {
    res.json(CIService.getPipelines());
  });

  router.post("/ci/trigger", checkPermission("trigger_ci"), async (req, res) => {
    try {
      const { pipelineName } = req.body;
      const newPipeline = await CIService.triggerPipeline(pipelineName, io);
      res.json(newPipeline);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- INFRASTRUCTURE (TERRAFORM) ---
  router.get("/infra/resources", checkPermission("read"), (req, res) => {
    res.json(CloudService.getResources());
  });

  router.post("/infra/generate-hcl", checkPermission("read"), (req, res) => {
    const { resourceType, params } = req.body;
    const hcl = CloudService.generateTerraform(resourceType, params);
    res.json({ hcl });
  });

  router.post("/infra/provision", checkPermission("execute_high_risk"), async (req, res) => {
    try {
      const { name, type } = req.body;
      const result = await CloudService.applyTerraform(name, type);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
