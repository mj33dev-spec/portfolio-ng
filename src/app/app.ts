import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  isLoading = signal(true);
  isFading = signal(false);

  ngOnInit() {
    // 3초 후 페이드 아웃 시작
    setTimeout(() => {
      this.isFading.set(true);

      // 페이드 아웃 애니메이션(0.8초) 후 완전히 제거
      setTimeout(() => {
        this.isLoading.set(false);
      }, 800);
    }, 3000);
  }
}
