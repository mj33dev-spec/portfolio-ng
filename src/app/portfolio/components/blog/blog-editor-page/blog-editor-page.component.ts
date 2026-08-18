import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogService, BlogPost, BlogBlock } from '../../../blog.service';
import { AuthService } from '../../../auth.service';
import { CDropdownComponent, CDropdownOption } from '../../c-dropdown/c-dropdown.component';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { DAlertService } from '../../d-alert/d-alert.service';
import { BadgeConfig } from '../../../utils/badge.config';

@Component({
  selector: 'app-blog-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CDropdownComponent, SidePanelComponent],
  templateUrl: './blog-editor-page.component.html',
  styleUrl: './blog-editor-page.component.scss'
})
export class BlogEditorPageComponent implements OnInit {
  @Input() postId: string | null = null;
  @Output() closeOverlay = new EventEmitter<void>();

  private blogService = inject(BlogService);
  public authService = inject(AuthService);
  private dAlert = inject(DAlertService);

  isEditMode = signal(false);

  title = signal('');
  blocks = signal<BlogBlock[]>([]);
  uploadingBlockIndex = signal<number | null>(null);
  color = signal('#facc15'); // default portfolio primary color
  category = signal('');
  imageUrl = signal<string | null>(null);
  tagsInput = signal('');
  isUploading = signal(false);

  categoryOptions = BadgeConfig.BLOG_CATEGORY_OPTIONS;

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
        this.color.set(data.color);
        this.category.set(data.category || '');
        this.imageUrl.set(data.image_url || null);
        this.tagsInput.set((data.tags || []).join(', '));
        
        let parsedBlocks: BlogBlock[] = [];
        if (typeof data.content === 'string') {
          try {
            parsedBlocks = JSON.parse(data.content);
          } catch (e) {
            parsedBlocks = [{ id: this.generateId(), type: 'text', value: data.content }];
          }
        } else if (Array.isArray(data.content)) {
          parsedBlocks = data.content;
        }
        this.blocks.set(parsedBlocks);
      }
    } else {
      this.blocks.set([{ id: this.generateId(), type: 'text', value: '' }]);
    }
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  addTextBlock() {
    this.blocks.update(b => [...b, { id: this.generateId(), type: 'text', value: '' }]);
  }

  addImageBlock() {
    this.blocks.update(b => [...b, { id: this.generateId(), type: 'image', value: '' }]);
  }

  removeBlock(index: number) {
    this.blocks.update(b => b.filter((_, i) => i !== index));
  }

  updateBlockValue(index: number, val: string) {
    this.blocks.update(blocks => {
      const copy = [...blocks];
      copy[index] = { ...copy[index], value: val };
      return copy;
    });
  }

  async onBlockFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.uploadingBlockIndex.set(index);

    const fileExt = file.name.split('.').pop();
    const fileName = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `images/${fileName}`;

    try {
      const { data, error } = await this.blogService.uploadImage(filePath, file);
      if (error) {
        console.error('Upload Error:', error);
        this.dAlert.error('이미지 업로드에 실패했습니다.');
      } else {
        const publicUrl = this.blogService.getImageUrl(filePath);
        this.updateBlockValue(index, publicUrl);
      }
    } catch (error) {
      console.error(error);
      this.dAlert.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      this.uploadingBlockIndex.set(null);
      input.value = '';
    }
  }

  // --- Drag and Drop Reordering ---
  draggedBlockIndex: number | null = null;

  onBlockDragStart(index: number) {
    this.draggedBlockIndex = index;
  }

  onBlockDragOver(event: DragEvent, index: number) {
    event.preventDefault();
  }

  onBlockDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (this.draggedBlockIndex === null || this.draggedBlockIndex === targetIndex) return;

    this.blocks.update(blocks => {
      const copy = [...blocks];
      const dragged = copy[this.draggedBlockIndex!];
      copy.splice(this.draggedBlockIndex!, 1);
      copy.splice(targetIndex, 0, dragged);
      return copy;
    });
    this.draggedBlockIndex = null;
  }

  onBlockDragEnd() {
    this.draggedBlockIndex = null;
  }

  goBack() {
    this.closeOverlay.emit();
  }

  async savePost() {
    if (!this.title() || !this.category()) {
      this.dAlert.warn('제목과 카테고리를 입력해주세요.');
      return;
    }

    const blocksVal = this.blocks();
    if (blocksVal.length === 0) {
      this.dAlert.warn('최소 하나의 본문 섹션을 추가해주세요.');
      return;
    }

    const tagsArray = this.tagsInput().split(',').map(t => t.trim()).filter(t => t.length > 0);

    const firstImageBlock = blocksVal.find(b => b.type === 'image' && b.value);
    const calculatedThumbnail = firstImageBlock ? firstImageBlock.value : null;

    const postData = {
      title: this.title(),
      content: blocksVal,
      color: this.color(),
      category: this.category(),
      image_url: calculatedThumbnail,
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
