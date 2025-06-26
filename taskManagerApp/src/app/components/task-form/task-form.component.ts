// src/app/components/task-form/task-form.component.ts
// ✅ THIS FILE IS ALREADY CORRECT! NO CHANGES NEEDED.

import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from 'src/app/models/task.interface';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  @Input() task?: Task;

  public form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      title: [this.task?.title || '', [Validators.required]],
      description: [this.task?.description || ''],
      dueDate: [this.task?.dueDate || new Date().toISOString()],
      priority: [this.task?.priority || 'medium'],
      label: [this.task?.label || ''],
      progress: [this.task?.progress || 'not started'],
    });
  }

  onCancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  onConfirm() {
    if (this.form.invalid) {
      return; 
    }
    this.modalCtrl.dismiss(this.form.value, 'confirm');
  }
}
