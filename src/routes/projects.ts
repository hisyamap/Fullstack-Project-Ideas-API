import express from 'express';
import { auth } from "../middleware/auth.js";
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { getAllProjects, getIdProject, createProject, updateProject, deleteProject } from '../controllers/project.ts';

const router = express.Router();

//Get project idea by query (Public: Rate limit by IP)
router.get('/', rateLimiter, getAllProjects);

// Get project ideas by id (Public: Rate limit by IP)
router.get('/:id', rateLimiter, getIdProject);

// Create new project idea (Protected: Rate limit by User ID)
router.post('/', auth, rateLimiter, createProject);

// Update project idea (Protected: Rate limit by User ID)
router.put('/:id', auth, rateLimiter, updateProject);

// Delete project idea (Protected: Rate limit by User ID)
router.delete("/:id", auth, rateLimiter, deleteProject);

export default router;