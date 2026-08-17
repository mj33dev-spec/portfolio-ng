import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService, BlogPost, BlogBlock } from '../../../blog.service';
import { AuthService } from '../../../auth.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { CBadgeComponent } from '../../c-badge/c-badge.component';
import { DAlertService } from '../../d-alert/d-alert.service';

export interface RenderedBlock {
  id: string;
  type: 'text' | 'image';
  value: string;
  safeHtml?: SafeHtml;
}

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [CommonModule, SidePanelComponent, CBadgeComponent],
  templateUrl: './blog-detail-page.component.html',
  styleUrl: './blog-detail-page.component.scss'
})
export class BlogDetailPageComponent implements OnInit {
  @Input() postId!: string;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  private blogService = inject(BlogService);
  public authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private dAlert = inject(DAlertService);

  post = signal<BlogPost | null>(null);
  renderedBlocks = signal<RenderedBlock[]>([]);
  loading = signal(true);

  async ngOnInit() {
    if (this.postId) {
      this.loading.set(true);
      const data = await this.blogService.getPost(this.postId);
      if (data) {
        this.post.set(data);
        
        let blocks: any[] = [];
        if (typeof data.content === 'string') {
          try {
            blocks = JSON.parse(data.content);
          } catch (e) {
            blocks = [{ id: 'legacy', type: 'text', value: data.content }];
          }
        } else if (Array.isArray(data.content)) {
          blocks = data.content;
        }

        const mappedBlocks: RenderedBlock[] = [];
        for (const block of blocks) {
          if (block.type === 'text') {
            const parsed = await marked.parse(block.value || '');
            mappedBlocks.push({
              id: block.id,
              type: 'text',
              value: block.value,
              safeHtml: this.sanitizer.bypassSecurityTrustHtml(parsed)
            });
          } else {
            mappedBlocks.push({
              id: block.id,
              type: 'image',
              value: block.value
            });
          }
        }
        this.renderedBlocks.set(mappedBlocks);
      }
      this.loading.set(false);
    } else {
      this.loading.set(false);
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
    if (p) {
      this.dAlert.confirm('정말로 이 게시물을 삭제하시겠습니까?', async () => {
        const success = await this.blogService.deletePost(p.id);
        if (success) {
          this.goBack();
        } else {
          this.dAlert.error('삭제에 실패했습니다.');
        }
      });
    }
  }
}
