import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService, BlogPost } from '../../blog.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-board-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './board-editor.html',
  styleUrl: './board-editor.scss'
})
export class BoardEditorComponent implements OnInit {
  @Input() postId: string | null = null;
  @Output() closeOverlay = new EventEmitter<void>();

  private blogService = inject(BlogService);
  public authService = inject(AuthService);

  isEditMode = signal(false);

  title = signal('');
  content = signal('');
  color = signal('#facc15'); // default portfolio primary color

  async ngOnInit() {
    // Only admin can access this page
    if (!this.authService.isLoggedIn()) {
      alert('관리자만 접근할 수 있습니다.');
      this.closeOverlay.emit();
      return;
    }

    if (this.postId) {
      this.isEditMode.set(true);
      const data = await this.blogService.getPost(this.postId);
      if (data) {
        this.title.set(data.title);
        this.content.set(data.content);
        this.color.set(data.color);
      }
    }
  }

  goBack() {
    this.closeOverlay.emit();
  }

  async savePost() {
    if (!this.title() || !this.content()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const postData = {
      title: this.title(),
      content: this.content(),
      color: this.color()
    };

    let success = false;
    if (this.isEditMode() && this.postId) {
      success = await this.blogService.updatePost(this.postId, postData);
    } else {
      success = await this.blogService.createPost(postData);
    }

    if (success) {
      alert('저장되었습니다.');
      this.closeOverlay.emit();
    } else {
      alert('저장에 실패했습니다.');
    }
  }
}
