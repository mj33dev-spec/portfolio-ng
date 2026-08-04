import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService, BlogPost } from '../../blog.service';
import { AuthService } from '../../auth.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-board-detail',
  imports: [CommonModule],
  templateUrl: './board-detail.html',
  styleUrl: './board-detail.scss'
})
export class BoardDetailComponent implements OnInit {
  @Input() postId!: string;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  private blogService = inject(BlogService);
  public authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  post = signal<BlogPost | null>(null);
  compiledMarkdown = signal<SafeHtml>('');

  async ngOnInit() {
    if (this.postId) {
      const data = await this.blogService.getPost(this.postId);
      if (data) {
        this.post.set(data);
        const parsed = await marked.parse(data.content);
        this.compiledMarkdown.set(this.sanitizer.bypassSecurityTrustHtml(parsed));
      }
    }
  }

  goBack() {
    this.closeOverlay.emit();
  }

  editPost() {
    const p = this.post();
    if (p) {
      this.edit.emit(p.id);
    }
  }

  async deletePost() {
    const p = this.post();
    if (p && confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      const success = await this.blogService.deletePost(p.id);
      if (success) {
        this.goBack();
      } else {
        alert('삭제에 실패했습니다.');
      }
    }
  }
}
