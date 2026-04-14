import { Router } from 'express';
import * as projectsController from '../controllers/projects.controller';
import * as tasksController from '../controllers/tasks.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', projectsController.listProjects);
router.post('/', projectsController.createProject);
router.get('/:id', projectsController.getProject);
router.patch('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);
router.get('/:id/stats', projectsController.getProjectStats);

router.get('/:id/tasks', tasksController.listTasks);
router.post('/:id/tasks', tasksController.createTask);

export default router;
