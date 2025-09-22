// backend/src/controllers/task.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Task, TaskStatus } from '../entities/Task';
import { TaskComment } from '../entities/TaskComment';
import { User } from '../entities/User';

type ResponseHandler = (
  req: Request,
  res: Response
) => Promise<Response | void>;

export class TaskController {
  private taskRepository = AppDataSource.getRepository(Task);
  private commentRepository = AppDataSource.getRepository(TaskComment);
  private userRepository = AppDataSource.getRepository(User);

  getTasks: ResponseHandler = async (req, res) => {
    try {
      const tasks = await this.taskRepository.find({
        relations: ['assignedTo', 'comments', 'comments.author'],
      });

      return res.json({ success: true, data: tasks });
    } catch (error) {
      console.error('Błąd:', error);
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zadań',
      });
    }
  };

  getTasksByUser: ResponseHandler = async (req, res) => {
    try {
      const { userId } = req.params;
      const tasks = await this.taskRepository.find({
        where: { assignedTo: { id: userId } },
        relations: ['assignedTo', 'comments', 'comments.author'],
        order: { createdAt: 'DESC' },
      });
      return res.json({ success: true, data: tasks });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zadań użytkownika',
      });
    }
  };

  createTask: ResponseHandler = async (req, res) => {
    try {
      const { title, description, assignedToId } = req.body;

      let assignedTo = null;
      if (assignedToId) {
        assignedTo = await this.userRepository.findOneBy({ id: assignedToId });
      }

      const task = new Task();
      task.title = title;
      task.description = description;
      task.assignedTo = assignedTo;
      task.status = TaskStatus.TODO;

      const savedTask = await this.taskRepository.save(task);

      return res.json({ success: true, data: savedTask });
    } catch (error) {
      console.error('Błąd podczas tworzenia zadania:', error);
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas tworzenia zadania',
      });
    }
  };

  updateTaskStatus: ResponseHandler = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!Object.values(TaskStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowy status',
        });
      }

      await this.taskRepository.update(id, { status });

      const updatedTask = await this.taskRepository.findOne({
        where: { id },
        relations: ['assignedTo', 'comments', 'comments.author'],
      });

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          error: 'Nie znaleziono zadania',
        });
      }

      return res.json({ success: true, data: updatedTask });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas aktualizacji zadania',
      });
    }
  };

  addComment: ResponseHandler = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content, userId } = req.body;

      const task = await this.taskRepository.findOneBy({
        id: parseInt(taskId),
      });
      const author = await this.userRepository.findOneBy({ id: userId });

      if (!task || !author) {
        return res.status(404).json({
          success: false,
          error: 'Nie znaleziono zadania lub użytkownika',
        });
      }

      const comment = this.commentRepository.create({
        content,
        task,
        author,
      });

      await this.commentRepository.save(comment);
      return res.json({ success: true, data: comment });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas dodawania komentarza',
      });
    }
  };

  deleteTask: ResponseHandler = async (req, res) => {
    try {
      const { id } = req.params;
      await this.taskRepository.delete(id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas usuwania zadania',
      });
    }
  };
  getCommentsForTask: ResponseHandler = async (req, res) => {
    try {
      const { taskId } = req.params;
      const comments = await this.commentRepository.find({
        where: { task: { id: parseInt(taskId) } },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });

      return res.json({ success: true, data: comments });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania komentarzy',
      });
    }
  };
}
