import express from 'express';
import {
  getProjects,
  createProject,
  getProject,
  contributeToProject,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Crowdfunding project management with Web3 integration
 */

// Public routes
router.get('/', getProjects);
router.get('/:id', getProject);

// Protected routes
router.post('/', authenticate, createProject);
router.post('/:id/contribute', authenticate, contributeToProject);

export { router as projectRoutes };
