import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect, untracked, HostListener, ElementRef, viewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService, BlogPost } from '../../blog.service';
import { AuthService } from '../../auth.service';
import { BlogDetailPageComponent } from './blog-detail-page/blog-detail-page.component';
import { BlogEditorPageComponent } from './blog-editor-page/blog-editor-page.component';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';
import { ScrollService } from '../../scroll.service';
import { CDropdownComponent, CDropdownOption } from '../c-dropdown/c-dropdown.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  imports: [CommonModule, FormsModule, BlogDetailPageComponent, BlogEditorPageComponent, CategoryBadgeComponent, DatePipe, CDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements OnInit {
  private blogService = inject(BlogService);
  private authService = inject(AuthService);
  private scrollService = inject(ScrollService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoggedIn = this.authService.isLoggedIn;

  // 테이블 body 요소 참조 (스크롤 위치 확인용)
  postBody = viewChild<ElementRef<HTMLElement>>('postBody');

  // 페이지당 항목 수 드롭다운
  itemsPerPage = signal(10);
  perPageOptions: CDropdownOption[] = [
    { label: '5개씩 보기',  value: 5  },
    { label: '10개씩 보기', value: 10 },
    { label: '20개씩 보기', value: 20 },
  ];

  get perPageLabel(): string {
    return `${this.itemsPerPage()}개씩 보기`;
  }

  onPerPageChange(value: number) {
    this.itemsPerPage.set(value);
    this.currentPage.set(1); // 페이지 리셋
  }

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

  totalPages = computed(() => Math.ceil(this.posts().length / this.itemsPerPage()));
  
  paginatedPosts = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
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
    const absoluteIndex = (this.currentPage() - 1) * this.itemsPerPage() + index;
    return total - absoluteIndex;
  }

  /**
   * 테이블 영역 위에서 휠 이벤트 발생 시:
   * - 내부 스크롤이 가능한 상태면 → 내부에서 소비, 페이지 이동 차단
   * - 내부 스크롤이 끝에 도달했을 때만 → 외부 페이지 섹션 이동 허용
   */
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    // 시트(detail/editor)가 열려 있으면 해당 시트 내부 스크롤에 맡김
    if (this.activeView() !== 'list') {
      return;
    }

    const el = this.postBody()?.nativeElement;
    if (!el) return;

    const isScrollingDown = event.deltaY > 0;
    const atTop = el.scrollTop === 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    // 내부가 스크롤 불가능하거나(콘텐츠 없음), 경계에 도달한 경우 → 외부로 전파
    const canScroll = el.scrollHeight > el.clientHeight;
    if (!canScroll) return; // 내부 스크롤 없으면 외부에 맡김

    if (isScrollingDown && atBottom) return; // 하단 끝 → 외부로
    if (!isScrollingDown && atTop) return;   // 상단 끝 → 외부로

    // 그 외: 내부 스크롤 처리, 외부 페이지 이동 차단
    event.stopPropagation();
  }
}
