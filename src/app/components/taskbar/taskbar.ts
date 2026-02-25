import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TaskbarApp {
  id: string;
  name: string;
  icon: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-taskbar',
  imports: [CommonModule],
  templateUrl: './taskbar.html',
  styleUrl: './taskbar.scss',
})
export class Taskbar {
  @Input() apps: TaskbarApp[] = [];
  @Output() startMenuClick = new EventEmitter<void>();
  @Output() appClick = new EventEmitter<string>();

  currentTime = new Date();
  currentDate = new Date();

  constructor() {
    // 시간 업데이트
    setInterval(() => {
      this.currentTime = new Date();
      this.currentDate = new Date();
    }, 1000);
  }

  onStartMenuClick() {
    this.startMenuClick.emit();
  }

  onAppClick(appId: string) {
    this.appClick.emit(appId);
  }

  getTimeString(): string {
    return this.currentTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDateString(): string {
    return this.currentDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}
