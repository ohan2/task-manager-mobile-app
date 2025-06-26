// src/app/home/home.page.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ActionSheetController, ActionSheetButton } from '@ionic/angular';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { add, closeCircleOutline, funnelOutline, refreshOutline, pricetagsOutline, calendarOutline, filterOutline } from 'ionicons/icons';

import { Task } from '../models/task.interface';
import { Filter } from '../models/filter.interface';
import { TaskService } from '../services/task.service';
import { TaskFormComponent } from '../components/task-form/task-form.component';
import { TaskItemComponent } from '../components/task-item/task-item.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TaskItemComponent],
})
export class HomePage {
  public taskService = inject(TaskService);
  private modalCtrl = inject(ModalController);
  private actionSheetCtrl = inject(ActionSheetController);

  public notStartedTasks$: Observable<Task[]>;
  public startedTasks$: Observable<Task[]>;
  public completeTasks$: Observable<Task[]>;
  
  public activeFilter$: Observable<Filter>;

  constructor() {
    // 👇 UPDATE THE CONSTRUCTOR TO ASSIGN THE NEW OBSERVABLES 👇
    this.notStartedTasks$ = this.taskService.notStartedTasks$;
    this.startedTasks$ = this.taskService.startedTasks$;
    this.completeTasks$ = this.taskService.completeTasks$;

    this.activeFilter$ = this.taskService.activeFilter$;
    
    // addIcons call stays the same
    addIcons({ add, filterOutline, closeCircleOutline, funnelOutline, refreshOutline, pricetagsOutline, calendarOutline });
  }
  async openTaskModal(task?: Task) {
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: { task },
    });
    
    modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      if (task?.id) {
        await this.taskService.updateTask({ ...task, ...data });
      } else {
        await this.taskService.addTask(data);
      }
    }
  }

  async onDeleteTask(id: string) {
    await this.taskService.deleteTask(id);
  }

async openFilterMenu() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filter Tasks',
      buttons: [
        { text: 'By Priority', icon: 'funnel-outline', handler: () => this.presentPriorityFilter() },
        { text: 'By Label', icon: 'pricetags-outline', handler: () => this.presentLabelFilter() },
        { text: 'By Due Date', icon: 'calendar-outline', handler: () => this.presentDateFilter() },
        { text: 'Show All', icon: 'refresh-outline', role: 'destructive', handler: () => this.taskService.updateFilterCriteria({ priority: 'all', label: 'all', dueDate: 'all' }) },
        { text: 'Cancel', icon: 'close-circle-outline', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  private async presentPriorityFilter() {
    const prioritySheet = await this.actionSheetCtrl.create({
      header: 'Filter by Priority',
      buttons: [
        { text: 'High', handler: () => this.taskService.updateFilterCriteria({ priority: 'high' }) },
        { text: 'Medium', handler: () => this.taskService.updateFilterCriteria({ priority: 'medium' }) },
        { text: 'Low', handler: () => this.taskService.updateFilterCriteria({ priority: 'low' }) },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await prioritySheet.present();
  }
  
  private async presentLabelFilter() {
    const allTasks = this.taskService.getCurrentTasks();
    const uniqueLabels = [...new Set(allTasks.map(task => task.label))];

    // ✅ FIX: Filter out any potential undefined/null/empty values before mapping
    const labelButtons: ActionSheetButton[] = uniqueLabels
      .filter(label => !!label) // Ensures we only map over actual strings
      .map(label => ({
        text: label,
        handler: () => this.taskService.updateFilterCriteria({ label: label! }) // The '!' asserts that label is not null here
      }));
    
    const labelSheet = await this.actionSheetCtrl.create({
      header: 'Filter by Label',
      buttons: [
        ...labelButtons, 
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await labelSheet.present();
  }

  private async presentDateFilter() {
    const dateSheet = await this.actionSheetCtrl.create({
      header: 'Filter by Due Date',
      buttons: [
        { text: 'Overdue', handler: () => this.taskService.updateFilterCriteria({ dueDate: 'overdue' }) },
        { text: 'Due Today', handler: () => this.taskService.updateFilterCriteria({ dueDate: 'today' }) },
        { text: 'Due This Week', handler: () => this.taskService.updateFilterCriteria({ dueDate: 'this-week' }) },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await dateSheet.present();
}
}
