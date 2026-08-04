
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class HomeComponent {
  authService = inject(AuthService);

  showLoginModal = signal(false);
  loginEmail = signal(this.authService.getAdminEmail());
  loginPassword = signal('');
  loginError = signal(false);

  colors = ['shape-pink', 'shape-orange', 'shape-blue', 'shape-green'];
  shapes = Array.from({ length: 15 });
  
  getStyle(index: number) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 5 + 5;
    const size = Math.random() * 80 + 20;
    return {
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    };
  }

  openLoginModal(): void {
    this.showLoginModal.set(true);
    this.loginPassword.set('');
    this.loginError.set(false);
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }

  async handleLogin(): Promise<void> {
    const success = await this.authService.login(this.loginEmail(), this.loginPassword());
    if (success) {
      this.closeLoginModal();
    } else {
      this.loginError.set(true);
    }
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
