import { Router, Request, Response, NextFunction } from 'express';
import { TaskController } from '../controllers/task.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();
const taskController = new TaskController();

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

const asyncHandler =
  (handler: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

router.use(auth());

router.get('/', asyncHandler(taskController.getTasks));
router.get('/user/:userId', asyncHandler(taskController.getTasksByUser));
router.post('/', asyncHandler(taskController.createTask));
router.patch('/:id/status', asyncHandler(taskController.updateTaskStatus));
router.post('/:taskId/comments', asyncHandler(taskController.addComment));
router.delete('/:id', asyncHandler(taskController.deleteTask));

export default router;
