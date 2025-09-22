// frontend/src/components/admin/TaskCard.tsx
import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2 } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Task, TaskStatus } from "@/types/task.types";

interface TaskCardProps {
  task: Task;
}

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const { user } = useAuthStore();
  const { updateTaskStatus, deleteTask, addComment } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (task.id) {
      await updateTaskStatus(task.id, newStatus);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && task.id && user?.id) {
      await addComment(task.id, commentText, Number(user.id));
      setCommentText("");
      setIsModalOpen(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-background p-4 rounded-lg border shadow-sm"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium">{task.title}</h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteTask(task.id)}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-2">{task.description}</p>

      <div className="mt-4 space-x-2">
        {Object.values(TaskStatus).map((status) => (
          <Button
            key={status}
            variant={task.status === status ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange(status)}
          >
            {status === TaskStatus.TODO
              ? "Do zrobienia"
              : status === TaskStatus.IN_PROGRESS
              ? "W trakcie"
              : "Zakończone"}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setIsModalOpen(true)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Komentarze ({task.comments?.length || 0})
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Komentarze"
        >
          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-4 mb-4">
              {task.comments?.map((comment: Comment) => (
                <div key={comment.id} className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddComment}
              className="sticky bottom-0 bg-background pt-4"
            >
              <div className="space-y-2">
                <Textarea
                  placeholder="Dodaj komentarz..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <Button type="submit" className="w-full">
                  Dodaj komentarz
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};
