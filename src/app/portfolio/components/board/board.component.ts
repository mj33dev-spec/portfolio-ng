import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BlogService, BlogPost } from '../../blog.service';
import { AuthService } from '../../auth.service';
import { BoardDetailComponent } from '../board-detail/board-detail';
import { BoardEditorComponent } from '../board-editor/board-editor';

@Component({
  selector: 'app-board',
  standalone: true,
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  imports: [CommonModule, FormsModule, BoardDetailComponent, BoardEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  private blogService = inject(BlogService);
  private authService = inject(AuthService);

  isLoggedIn = this.authService.isLoggedIn;
  
  activeView = signal<'list' | 'detail' | 'editor'>('list');
  selectedPostId = signal<string | null>(null);

  posts = signal<BlogPost[]>([]);
  currentPage = signal(1);
  itemsPerPage = 5;

  totalPages = computed(() => Math.ceil(this.posts().length / this.itemsPerPage));
  
  paginatedPosts = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.posts().slice(start, end);
  });

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  async ngOnInit() {
    await this.loadPosts();
  }

  async loadPosts() {
    const data = await this.blogService.getPosts();
    this.posts.set(data);
  }

  goToPost(id: string) {
    this.selectedPostId.set(id);
    this.activeView.set('detail');
  }

  createNewPost() {
    this.selectedPostId.set(null);
    this.activeView.set('editor');
  }

  editPost(id: string) {
    this.selectedPostId.set(id);
    this.activeView.set('editor');
  }

  closeOverlay() {
    this.activeView.set('list');
    this.selectedPostId.set(null);
    this.loadPosts();
  }
  
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.currentPage.set(pageNumber);
    }
  }
}
