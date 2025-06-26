// src/app/models/filter.interface.ts

import { Task } from './task.interface';

export interface Filter {
  priority: Task['priority'] | 'all'; // e.g., 'high', 'medium', 'low', or 'all'
  label: string | 'all';
  dueDate: 'overdue' | 'today' | 'this-week' | 'all';
}
