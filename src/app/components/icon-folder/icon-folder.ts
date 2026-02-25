import { Component, Input } from '@angular/core';

@Component({
  selector: 'icon-folder',
  templateUrl: './icon-folder.html',
  styleUrl: './icon-folder.scss'
})
export class IconFolder {
  @Input() color: string = '#63B3ED';
  @Input() size: string = 'medium';
}
