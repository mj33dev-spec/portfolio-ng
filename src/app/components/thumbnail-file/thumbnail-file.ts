import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Abstract_File } from '../directory/directory-model';
import { ApiService } from '../../core/services/api.service';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Model_Extension_IMAGE, Model_Extension_MP3 } from '../directory/file-extension-model';
@Component({
  selector: 'thumbnail-file',
  imports: [CommonModule],
  templateUrl: './thumbnail-file.html',
  styleUrl: './thumbnail-file.scss'
})
export class ThumbnailFile implements OnInit, OnDestroy {
  @Input() file: Abstract_File | null = null;
  
  fileType: string = '';
  imageSrc: string = '';
  subscriptions: Subscription[] = [];
  constructor(private apiService: ApiService) {}

  ngOnInit() {
    if (
      this.file?.extension_info instanceof Model_Extension_IMAGE
    ) {
      this.fileType = 'image';
      // this.imageSrc = 'assets/icons/primary/png/image.png';
      this.loadImageFromProxyUrl();
    } else if(this.file?.extension_info instanceof Model_Extension_MP3) {
      this.fileType = 'audio';
      this.imageSrc = 'assets/icons/primary/png/audio.png';
    } else {
      this.fileType = 'file';
      this.imageSrc = 'assets/icons/primary/png/document.png';
    }

  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  /**
   * 파일 경로에 _c 추가 (확장자 앞에)
   * 예: abc.png -> abc_c.png
   * 예: user-uuid/bucket/abc.png -> user-uuid/bucket/abc_c.png
   */
  private addThumbnailSuffix(filePath: string): string {
    const lastSlashIndex = filePath.lastIndexOf('/');
    const fileName = lastSlashIndex >= 0 ? filePath.substring(lastSlashIndex + 1) : filePath;
    const pathPrefix = lastSlashIndex >= 0 ? filePath.substring(0, lastSlashIndex + 1) : '';
    
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const nameWithoutExt = fileName.substring(0, lastDotIndex);
      const extension = fileName.substring(lastDotIndex);
      return `${pathPrefix}${nameWithoutExt}_c${extension}`;
    }
    
    // 확장자가 없는 경우 그대로 반환
    return filePath;
  }

  /**
   * 이미지 경로 로드
   * S3 파일인 경우 Presigned URL을 가져오고, 로컬 assets인 경우 그대로 사용
   */
  private loadImageFromProxyUrl() {
    if (!this.file) {
      this.imageSrc = 'assets/images/image.png';
      return;
    }
    const imgPath = this.file.extension_info?.img_path || '';

    const filePath = this.file.file_path || '';
    if (filePath && filePath.startsWith('/desktop-files/')) {
      // 로컬 에셋 파일: file_path를 직접 사용
      this.imageSrc = filePath;
    } else if (filePath && !filePath.startsWith('assets/') && !filePath.startsWith('/assets/')) {
      // S3 파일 키로 프록시 URL 생성
      const thumbnailPath = this.addThumbnailSuffix(filePath);
      this.imageSrc = this.apiService.getFileProxyUrl(thumbnailPath);
    } else {
      // 기본 이미지 경로 사용
      this.imageSrc = imgPath || 'assets/images/image.png';
    }
  }

  private loadImageFromPresignedUrl() {
    if (!this.file) {
      this.imageSrc = 'assets/images/image.png';
      return;
    }
    const imgPath = this.file.extension_info?.img_path || '';

    // file_path가 S3 키인 경우 (assets가 아니고, 확장자가 있는 경우)
    const filePath = this.file.file_path || '';
    if (filePath && !filePath.startsWith('assets/') && !filePath.startsWith('/assets/')) {
      // S3 파일 키로 프록시 URL 생성 (서버를 통한 직접 접근)
      // 파일명에 _c 추가 (썸네일용)
      const thumbnailPath = this.addThumbnailSuffix(filePath);
       // S3 파일 키로 Presigned URL 가져오기
       const subscription = this.apiService
       .getPresignedUrl(filePath, 3600)
       .pipe(first())
       .subscribe(
         (res: any) => {
           if (res.status === 'success' && res.data?.url) {
             this.imageSrc = res.data.url;
           } else {
             // 실패 시 기본 이미지 사용
             this.imageSrc = imgPath || 'assets/images/image.png';
           }
         },
         (err: any) => {
           console.error('Presigned URL 가져오기 실패:', err);
           // 오류 시 기본 이미지 사용
           this.imageSrc = imgPath || 'assets/images/image.png';
         }
       );
      this.subscriptions.push(subscription);
    } else {
      // 기본 이미지 경로 사용
      this.imageSrc = imgPath || 'assets/images/image.png';
    }
  }



}
