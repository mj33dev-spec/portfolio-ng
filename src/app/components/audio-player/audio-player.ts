import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Abstract_File } from '../directory/directory-model';

@Component({
  selector: 'audio-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-player.html',
  styleUrl: './audio-player.scss'
})
export class AudioPlayer implements OnInit {
  @Input() file?: Abstract_File;
  audioSrc: string = '';

  ngOnInit() {
    if (this.file) {
      this.audioSrc = this.file.file_path;
    }
  }
}
