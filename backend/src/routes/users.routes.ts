import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { User } from '../entities/User';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await AppDataSource.getRepository(User).find({
      select: { id: true, name: true, email: true },
      order: { name: 'ASC' },
    });
    res.json({ users });
  } catch (err) { next(err); }
});

export default router;
