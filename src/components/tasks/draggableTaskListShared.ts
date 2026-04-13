import type { Task } from "../../types";

export interface DraggableTaskListProps {
  tasks: Task[];
  allTasks: Task[];
  currentDate: Date;
  loading: boolean;
  loadingMore: boolean;
  onTaskPress: (task: Task) => void;
  onComplete: (task: Task) => void;
  onReorder: (task: Task, newSortOrder: number) => void;
  onRefresh: () => void;
  tasksWithPrerequisites?: Set<string>;
}
