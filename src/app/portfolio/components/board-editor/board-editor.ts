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
    { label: 'Flutter', value: 'Flutter', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg', customColor: '#38bdf8', customBgColor: 'rgba(56, 189, 248, 0.15)' },
    { label: 'Angular', value: 'Angular', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angular/angular-original.svg', customColor: '#ef4444', customBgColor: 'rgba(239, 68, 68, 0.15)' },
    { label: 'React', value: 'React', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', customColor: '#61dafb', customBgColor: 'rgba(97, 218, 251, 0.15)' },
    { label: 'Vue', value: 'Vue', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg', customColor: '#4ade80', customBgColor: 'rgba(74, 222, 128, 0.15)' },
    { label: 'Next.js', value: 'Next.js', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg', customColor: '#ffffff', customBgColor: 'rgba(107, 114, 128, 0.5)' },
    { label: 'Nuxt.js', value: 'Nuxt.js', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nuxtjs/nuxtjs-original.svg', customColor: '#00C58E', customBgColor: 'rgba(0, 197, 142, 0.15)' },
    { label: 'Nest.js', value: 'Nest.js', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg', customColor: '#E0234E', customBgColor: 'rgba(224, 35, 78, 0.15)' },
    { label: 'node.js', value: 'node.js', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', customColor: '#4ade80', customBgColor: 'rgba(74, 222, 128, 0.15)' },
    { label: 'Spring Boot', value: 'Spring Boot', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg', customColor: '#6db33f', customBgColor: 'rgba(109, 179, 63, 0.15)' },
    { label: 'MySQL', value: 'MySQL', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg', customColor: '#4479a1', customBgColor: 'rgba(68, 121, 161, 0.15)' },
    { label: 'MariaDB', value: 'MariaDB', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mariadb/mariadb-original.svg', customColor: '#003545', customBgColor: 'rgba(0, 53, 69, 0.15)' },
    { label: 'PostgreSQL', value: 'PostgreSQL', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', customColor: '#336791', customBgColor: 'rgba(51, 103, 145, 0.15)' },
    { label: 'Firebase', value: 'Firebase', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg', customColor: '#ffca28', customBgColor: 'rgba(255, 202, 40, 0.15)' },
    { label: 'Dart', value: 'Dart', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg', customColor: '#0175C2', customBgColor: 'rgba(1, 117, 194, 0.15)' },
    { label: 'Typescript', value: 'Typescript', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', customColor: '#60a5fa', customBgColor: 'rgba(96, 165, 250, 0.15)' },
    { label: 'Javascript', value: 'Javascript', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg', customColor: '#facc15', customBgColor: 'rgba(250, 204, 21, 0.15)' },
    { label: 'HTML', value: 'HTML', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg', customColor: '#f97316', customBgColor: 'rgba(249, 115, 22, 0.15)' },
    { label: 'CSS', value: 'CSS', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg', customColor: '#3b82f6', customBgColor: 'rgba(59, 130, 246, 0.15)' },
    { label: 'SCSS', value: 'SCSS', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg', customColor: '#cc6699', customBgColor: 'rgba(204, 102, 153, 0.15)' },
    { label: 'Java', value: 'Java', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg', customColor: '#b07219', customBgColor: 'rgba(176, 114, 25, 0.15)' },
    { label: 'Python', value: 'Python', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', customColor: '#3776ab', customBgColor: 'rgba(55, 118, 171, 0.15)' },
    { label: 'C#', value: 'C#', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg', customColor: '#178600', customBgColor: 'rgba(23, 134, 0, 0.15)' },
    { label: 'Database', value: 'Database', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azuresqldatabase/azuresqldatabase-original.svg', customColor: '#9ca3af', customBgColor: 'rgba(156, 163, 175, 0.15)' },
    { label: '기타', value: '기타', customColor: '#9ca3af', customBgColor: 'rgba(156, 163, 175, 0.15)' }
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
