// src/app/models/task.interface.ts
export interface Task {
  id: string; 
  title: string;
  description?: string;
  dueDate: string; // Using string for simplicity, can be Date object
  priority: 'low' | 'medium' | 'high';
  label?: string;
  progress: 'not started' | 'started' | 'complete';
}