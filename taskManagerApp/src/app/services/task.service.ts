// src/app/services/task.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { BehaviorSubject, combineLatest, map, Observable, tap, firstValueFrom } from 'rxjs';
import { Task } from '../models/task.interface';
import { Filter } from '../models/filter.interface';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // --- NEW: API Configuration ---
  private apiUrl = '/api/tasks';

  // --- MODIFIED: This is now a CACHE of the server data, starting empty ---
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  private filterCriteriaSubject = new BehaviorSubject<Filter>({
    priority: 'all',
    label: 'all',
    dueDate: 'all',
  });

  public activeFilter$: Observable<Filter> = this.filterCriteriaSubject.asObservable();
  public filteredTasks$: Observable<Task[]>;
  public notStartedTasks$: Observable<Task[]>;
  public startedTasks$: Observable<Task[]>;
  public completeTasks$: Observable<Task[]>;

  constructor(private http: HttpClient) { // <-- INJECT HttpClient
    
    this.filteredTasks$ = combineLatest([this.tasksSubject, this.activeFilter$]).pipe(
      map(([tasks, filter]) => {
        if (filter.priority === 'all' && filter.label === 'all' && filter.dueDate === 'all') { return tasks; }
        const today_start = new Date(); today_start.setHours(0, 0, 0, 0);
        const today_end = new Date(); today_end.setHours(23, 59, 59, 999);
        const endOfWeek = new Date(today_start); endOfWeek.setDate(today_start.getDate() + (6 - today_start.getDay())); endOfWeek.setHours(23, 59, 59, 999);
        return tasks.filter(task => {
          const priorityMatch = filter.priority === 'all' || task.priority === filter.priority;
          const labelMatch = filter.label === 'all' || task.label === filter.label;
          let dateMatch = true;
          if (filter.dueDate !== 'all') {
            if (!task.dueDate) { dateMatch = false; } else {
              const taskDueDate = new Date(task.dueDate);
              if (filter.dueDate === 'overdue') { dateMatch = taskDueDate < today_start && task.progress !== 'complete'; }
              else if (filter.dueDate === 'today') { dateMatch = taskDueDate >= today_start && taskDueDate <= today_end; }
              else if (filter.dueDate === 'this-week') { dateMatch = taskDueDate >= today_start && taskDueDate <= endOfWeek; }
            }
          }
          return priorityMatch && labelMatch && dateMatch;
        });
      })
    );
    this.notStartedTasks$ = this.filteredTasks$.pipe(map(tasks => tasks.filter(t => t.progress === 'not started')));
    this.startedTasks$ = this.filteredTasks$.pipe(map(tasks => tasks.filter(t => t.progress === 'started')));
    this.completeTasks$ = this.filteredTasks$.pipe(map(tasks => tasks.filter(t => t.progress === 'complete')));

    // --- NEW: Load initial data from the API when the service is created ---
    this.loadInitialTasks();
  }

  // --- NEW: Method to fetch all tasks from the API ---
  private loadInitialTasks() {
    this.http.get<Task[]>(this.apiUrl).pipe(
      tap(tasks => this.tasksSubject.next(tasks)) // Update our local cache
    ).subscribe();
  }
  
  // --- REBUILT: Perform API call first, then update cache and schedule notification ---
  public async addTask(taskData: Omit<Task, 'id'>) {
    // The server will create the ID. We just set the initial progress.
    const taskToAdd: Omit<Task, 'id'> = { ...taskData, progress: 'not started' };

    const savedTask = await firstValueFrom(this.http.post<Task>(this.apiUrl, taskToAdd));
    
    // Update local cache with the task returned from the server
    this.tasksSubject.next([...this.tasksSubject.getValue(), savedTask]);

    // Schedule notification for the newly created task
    await this.scheduleNotification(savedTask);
  }

  // --- REBUILT: Perform API call first, then update cache and schedule notification ---
  public async updateTask(updatedTask: Task) {
    const savedTask = await firstValueFrom(this.http.put<Task>(`${this.apiUrl}/${updatedTask.id}`, updatedTask));

    // Update local cache
    const currentTasks = this.tasksSubject.getValue();
    const taskIndex = currentTasks.findIndex(t => t.id === savedTask.id);
    if (taskIndex > -1) {
      currentTasks[taskIndex] = savedTask;
      this.tasksSubject.next([...currentTasks]);
    }

    // Reschedule notification
    await this.scheduleNotification(savedTask);
  }

  // --- REBUILT: Perform API call first, then update cache and cancel notification ---
  public async deleteTask(id: string | number) {
    // Note: json-server uses number IDs, so we handle both string/number
    await firstValueFrom(this.http.delete<{}>(`${this.apiUrl}/${id}`));

    // Update local cache
    const updatedTasks = this.tasksSubject.getValue().filter(t => t.id != id);
    this.tasksSubject.next(updatedTasks);

    // Cancel notification
    await this.cancelNotification(id);
  }

  // --- UNCHANGED: Your other public methods work perfectly by reading the local cache ---
  public updateFilterCriteria(criteria: Partial<Filter>) {
    const currentFilter = this.filterCriteriaSubject.getValue();
    this.filterCriteriaSubject.next({ ...currentFilter, ...criteria });
  }
  public getCurrentTasks() { return this.tasksSubject.getValue(); }
  public getTaskById(id: string | number): Task | undefined {
    // Use '==' to handle both string and number comparison
    return this.tasksSubject.getValue().find(t => t.id == id);
  }

  // --- UNCHANGED: Notification methods ---
  // (with a small tweak to handle both string and number IDs for future-proofing)
  private async scheduleNotification(task: Task) {
    if (!task.dueDate || task.progress === 'complete') {
      await this.cancelNotification(task.id); return;
    }
    try {
      await LocalNotifications.requestPermissions();
      await LocalNotifications.schedule({
        notifications: [{
          id: this.getNotificationId(task.id),
          title: `Task Due: ${task.title}`,
          body: task.description || 'Don\'t forget to complete your task!',
          schedule: { at: new Date(task.dueDate) },
        }]
      });
    } catch (e) {
      console.error('Error scheduling notification', e);
    }
  }

  private async cancelNotification(taskId: string | number) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: this.getNotificationId(taskId) }]
      });
    } catch (e) {
      console.error('Error canceling notification', e);
    }
  }

  private getNotificationId(taskId: string | number): number {
    const idAsString = taskId.toString();
    let hash = 0;
    for (let i = 0; i < idAsString.length; i++) {
        const char = idAsString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
