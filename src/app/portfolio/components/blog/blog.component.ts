import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect, untracked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService, BlogPost } from '../../blog.service';
import { AuthService } from '../../auth.service';
import { BlogDetailPageComponent } from './blog-detail-page/blog-detail-page.component';
import { BlogEditorPageComponent } from './blog-editor-page/blog-editor-page.component';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  imports: [CommonModule, FormsModule, BlogDetailPageComponent, BlogEditorPageComponent, CategoryBadgeComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements OnInit {
  private blogService = inject(BlogService);
  private authService = inject(AuthService);
  private scrollService = inject(ScrollService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoggedIn = this.authService.isLoggedIn;

  constructor() {
    effect(() => {
      // Close overlay when active section changes away from blog
      this.scrollService.activeSection();
      untracked(() => {
        if (this.activeView() !== 'list') {
          this.closeOverlay();
        }
      });
    });
  }
  
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

    // Subscribe to query parameters to manage sliding panel state
    this.route.queryParams.subscribe(params => {
      const blogId = params['blogId'];
      const blogEdit = params['blogEdit'];

      if (blogEdit) {
        this.selectedPostId.set(blogEdit === 'new' ? null : blogEdit);
        this.activeView.set('editor');
      } else if (blogId) {
        this.selectedPostId.set(blogId);
        this.activeView.set('detail');
      } else {
        this.selectedPostId.set(null);
        this.activeView.set('list');
      }
    });
  }

  async loadPosts() {
    const data = await this.blogService.getPosts();
    this.posts.set(data);
  }

  goToPost(id: string) {
    this.router.navigate([], { queryParams: { blogId: id } });
  }

  createNewPost() {
    this.router.navigate([], { queryParams: { blogEdit: 'new' } });
  }

  editPost(id: string) {
    this.router.navigate([], { queryParams: { blogEdit: id } });
  }

  closeOverlay() {
    this.router.navigate([], { queryParams: { blogId: null, blogEdit: null } }).then(() => {
      this.loadPosts();
    });
  }
  
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.currentPage.set(pageNumber);
    }
  }

  getPostNumber(index: number): number {
    const total = this.posts().length;
    const absoluteIndex = (this.currentPage() - 1) * this.itemsPerPage + index;
    return total - absoluteIndex;
  }
}
