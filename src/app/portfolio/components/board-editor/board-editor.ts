import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService, BlogPost } from '../../blog.service';
import { AuthService } from '../../auth.service';
import { CDropdownComponent, CDropdownOption } from '../c-dropdown/c-dropdown.component';
import { SidePanelComponent } from '../side-panel/side-panel.component';
import { DAlertService } from '../d-alert/d-alert.service';

@Component({
  selector: 'app-board-editor',
  imports: [CommonModule, FormsModule, CDropdownComponent, SidePanelComponent],
  templateUrl: './board-editor.html',
  styleUrl: './board-editor.scss'
})
export class BoardEditorComponent implements OnInit {
  @Input() postId: string | null = null;
  @Output() closeOverlay = new EventEmitter<void>();

  private blogService = inject(BlogService);
  public authService = inject(AuthService);
  private dAlert = inject(DAlertService);

  isEditMode = signal(false);

  title = signal('');
  content = signal('');
  color = signal('#facc15'); // default portfolio primary color
  category = signal('');
  imageUrl = signal<string | null>(null);
  tagsInput = signal('');
  isUploading = signal(false);

  categoryOptions: CDropdownOption[] = [
    { label: 'Angular', value: 'Angular' },
    { label: 'React', value: 'React' },
    { label: 'Vue', value: 'Vue' },
    { label: 'Flutter', value: 'Flutter' },
    { label: 'HTML', value: 'HTML' },
    { label: 'CSS', value: 'CSS' },
    { label: 'Javascript', value: 'Javascript' },
    { label: 'Typescript', value: 'Typescript' },
    { label: 'VisualBasic', value: 'VisualBasic' },
    { label: 'Flash', value: 'Flash' },
    { label: 'node.js', value: 'node.js' },
    { label: 'nest.js', value: 'nest.js' },
    { label: 'Database', value: 'Database' },
    { label: '기타', value: '기타' }
  ];

  async ngOnInit() {
    // Only admin can access this page
    if (!this.authService.isLoggedIn()) {
      this.dAlert.error('관리자만 접근할 수 있습니다.', '권한 없음', () => {
        this.closeOverlay.emit();
      });
      return;
    }

    if (this.postId) {
      this.isEditMode.set(true);
      const data = await this.blogService.getPost(this.postId);
      if (data) {
        this.title.set(data.title);
        this.content.set(data.content);
        this.color.set(data.color);
        this.category.set(data.category || '');
        this.imageUrl.set(data.image_url || null);
        this.tagsInput.set((data.tags || []).join(', '));
      }
    }
  }

  goBack() {
    this.closeOverlay.emit();
  }

  async savePost() {
    if (!this.title() || !this.content() || !this.category()) {
      this.dAlert.warn('제목, 카테고리, 내용을 모두 입력해주세요.');
      return;
    }

    const tagsArray = this.tagsInput().split(',').map(t => t.trim()).filter(t => t.length > 0);

    const postData = {
      title: this.title(),
      content: this.content(),
      color: this.color(),
      category: this.category(),
      image_url: this.imageUrl() || null,
      tags: tagsArray
    };

    let success = false;
    if (this.isEditMode() && this.postId) {
      success = await this.blogService.updatePost(this.postId, postData);
    } else {
      success = await this.blogService.createPost(postData);
    }

    if (success) {
      this.dAlert.success('게시물이 성공적으로 저장되었습니다.', '저장 성공', () => {
        this.closeOverlay.emit();
      });
    } else {
      this.dAlert.error('저장에 실패했습니다.');
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.isUploading.set(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `images/${fileName}`;

    try {
      const { data, error } = await this.blogService.uploadImage(filePath, file);
      if (error) {
        console.error('Upload Error:', error);
        this.dAlert.error('이미지 업로드에 실패했습니다. (blog-images 버킷 설정을 확인해주세요)');
      } else {
        const publicUrl = this.blogService.getImageUrl(filePath);
        this.imageUrl.set(publicUrl);
      }
    } catch (error) {
      console.error(error);
      this.dAlert.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      this.isUploading.set(false);
      input.value = ''; // 동일 파일 재업로드 가능하게 초기화
    }
  }
}
