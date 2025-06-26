// src/app/components/task-item/task-item.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Task } from 'src/app/models/task.interface';
import { addIcons } from 'ionicons';
import { trash, create, pricetagOutline, alertCircleOutline, warningOutline } from 'ionicons/icons';


@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TaskItemComponent implements OnInit {
  // We receive the task data from HomePage
  @Input({ required: true }) task!: Task;

  // This emitter sends the whole task object when "edit" is clicked
  @Output() edit = new EventEmitter<Task>();

  // ✅ ADDED: This emitter will send the task ID (a string) when "delete" is clicked
  @Output() delete = new EventEmitter<string>();

    public urgency: 'overdue' | 'dueSoon' | 'safe' = 'safe';

  constructor() {
        addIcons({ trash, create, pricetagOutline, alertCircleOutline, warningOutline });
  }

  ngOnInit() {
    // We only perform the check if a due date actually exists
    if (!this.task.dueDate) {
      return;
    }

    const now = new Date();
    const dueDate = new Date(this.task.dueDate);

    // Calculate the time difference in milliseconds
    const timeDiff = dueDate.getTime() - now.getTime();

    // Overdue if the due date is in the past
    if (timeDiff < 0) {
      this.urgency = 'overdue';
      return;
    }

    // "Due soon" if it's due within the next 24 hours
    const hoursRemaining = timeDiff / (1000 * 60 * 60);
    if (hoursRemaining <= 24) {
      this.urgency = 'dueSoon';
    }
  }

  // ✅ MODIFIED: This method now accepts the click event
  // to prevent it from bubbling up to the card's edit action.
  onDeleteClick(event: MouseEvent) {
    event.stopPropagation(); // Prevents the card's (click) event from firing
    this.delete.emit(this.task.id);
  }
}
