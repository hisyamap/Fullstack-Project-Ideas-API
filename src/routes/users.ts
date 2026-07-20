import express from 'express';
import { auth } from "../middleware/auth.js";
import { rateLimiter } from '../middleware/rateLimiter.ts';
import { getAllUsers, getIdUser, createUser, loginUser, updateUser, deleteUser } from '../controllers/users.ts';

const router = express.Router();

// Get all users (Protected: Rate limit by User ID)
router.get('/', auth, rateLimiter, getAllUsers);

// Get user by id (Protected: Rate limit by User ID)
router.get('/:id', auth, rateLimiter, getIdUser);

// Create user / Signup (Public: Rate limit by IP)
router.post('/', rateLimiter, createUser);

// Login user (Public: Rate limit by IP)
router.post('/login', rateLimiter, loginUser);

// Update user (Protected: Rate limit by User ID)
router.put('/update', auth, rateLimiter, updateUser);

// Delete user (Protected: Rate limit by User ID)
router.delete('/delete', auth, rateLimiter, deleteUser);

export default router;