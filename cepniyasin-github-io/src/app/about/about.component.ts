import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule

  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

  onContactClick() {
    window.open('https://github.com/cepniyasin', '_blank', 'noopener');
  }
}
