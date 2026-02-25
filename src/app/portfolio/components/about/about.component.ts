
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Added this import based on the instruction

@Component({
  selector: 'app-about', // Kept original selector, assuming the instruction's selector line was a typo for 'standalone'
  standalone: true, // Added standalone property
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'], // Added styleUrls
  imports: [CommonModule], // Added imports
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {}
