// src/app/app.component.ts
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Import IonicModule

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule], // Add IonicModule here
})
export class AppComponent {
  constructor() {}
}

