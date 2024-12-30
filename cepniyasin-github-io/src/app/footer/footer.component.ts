import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    MatToolbar,
    MatMenu,
    MatMenuTrigger,
    MatButton,
    MatMenuItem
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}
