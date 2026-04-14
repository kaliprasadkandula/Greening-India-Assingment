import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.patch('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

export default router;
