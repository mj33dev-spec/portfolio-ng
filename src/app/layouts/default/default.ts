import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SHARED_MODULES } from '../../shared/shared-modules';

@Component({
  selector: 'app-default',
  imports: [RouterOutlet, SHARED_MODULES],
  templateUrl: './default.html',
  styleUrl: './default.scss',
})
export class Default {}
