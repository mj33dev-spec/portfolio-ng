import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { Project, ProjectLink, ProjectPlatform } from '../../../project.model';
import { ProjectService } from '../../../project.service';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { DAlertService } from '../../d-alert/d-alert.service';
import { CDropdownComponent, CDropdownOption } from '../../c-dropdown/c-dropdown.component';
import { BadgeConfig } from '../../../utils/badge.config';

@Component({
  selector: 'app-project-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidePanelComponent, CDropdownComponent],
  templateUrl: './project-form-modal.html',
  styleUrls: ['./project-form-modal.scss']
})
export class ProjectFormModalComponent implements OnInit {
  project = input<Project | null>(null);
  closeModal = output<void>();
  saveComplete = output<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dAlert = inject(DAlertService);

  projectForm!: FormGroup;
  isSaving = false;
  isUploading = signal<Record<string, boolean>>({});

  affiliationOptions = BadgeConfig.AFFILIATION_OPTIONS;
  statusOptions = BadgeConfig.STATUS_OPTIONS;
  visibilityOptions = BadgeConfig.VISIBILITY_OPTIONS;
  serviceOptions = BadgeConfig.SERVICE_OPTIONS;
  roleOptions = BadgeConfig.ROLE_OPTIONS;
  envOptions = BadgeConfig.ENV_OPTIONS;
  langOptions = BadgeConfig.LANG_OPTIONS;

  BadgeConfig = BadgeConfig;

  ngOnInit() {
    this.initForm();
    if (this.project()) {
      this.patchForm(this.project()!);
    }
  }

  get platforms(): FormArray {
    return this.projectForm.get('platforms') as FormArray;
  }

  addPlatform(platform?: ProjectPlatform) {
    const pGroup = this.fb.group({
      id: [platform?.id || null],
      type: [platform?.type || 'Web', Validators.required],
      status: [platform?.status || '운영중'],
      is_visible: [platform?.is_visible ?? true],
      role_tags: [platform?.role_tags || []],
      development_environment: [platform?.development_environment || []],
      development_language: [platform?.development_language || []],
      platform_images: this.fb.group({
        pc: [platform?.platform_images?.pc || ''],
        tablet: [platform?.platform_images?.tablet || ''],
        mobile: [platform?.platform_images?.mobile || '']
      }),
      sort_order: [platform?.sort_order || 0]
    });
    this.platforms.push(pGroup);
    this.expandedPlatforms.push(true); // new platform is expanded by default
  }

  removePlatform(index: number) {
    this.platforms.removeAt(index);
    this.expandedPlatforms.splice(index, 1);
  }

  // --- Accordion ---
  expandedPlatforms: boolean[] = [];

  togglePlatform(index: number) {
    this.expandedPlatforms[index] = !this.expandedPlatforms[index];
  }

  // --- Drag and Drop Reordering ---
  draggedPlatformIndex: number | null = null;

  onDragStart(index: number) {
    this.draggedPlatformIndex = index;
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault(); // Necessary to allow dropping
  }

  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (this.draggedPlatformIndex === null || this.draggedPlatformIndex === targetIndex) return;

    const platforms = this.platforms;
    const currentGroup = platforms.at(this.draggedPlatformIndex);
    
    platforms.removeAt(this.draggedPlatformIndex);
    platforms.insert(targetIndex, currentGroup);

    // Swap expanded state
    const expanded = this.expandedPlatforms[this.draggedPlatformIndex];
    this.expandedPlatforms.splice(this.draggedPlatformIndex, 1);
    this.expandedPlatforms.splice(targetIndex, 0, expanded);

    this.draggedPlatformIndex = null;
  }

  onDragEnd() {
    this.draggedPlatformIndex = null;
  }

  initForm() {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required],
      affiliation: ['', Validators.required],
      logo: [''],
      workPeriod: [''],
      scopeAndContribution: [''],
      retrospective: [''],
      serviceTags: [[], [Validators.required, Validators.minLength(1)]],
      platformImages: this.fb.group({
        pc: [''],
        tablet: [''],
        mobile: ['']
      }),
      links: this.fb.group({
        ios: [''],
        android: [''],
        landing: [''],
        web: [''],
        admin: ['']
      }),
      sortOrder: [0],
      is_visible: [true],
      platforms: this.fb.array([])
    });
  }

  patchForm(project: Project) {
    this.projectForm.patchValue({
      title: project.title,
      description: project.description || '',
      status: project.status || '',
      affiliation: project.affiliation || '',
      logo: project.logo || '',
      workPeriod: project.workPeriod || '',
      scopeAndContribution: project.scopeAndContribution || '',
      retrospective: project.retrospective || '',
      serviceTags: project.serviceTags || [],
      platformImages: project.platformImages || { pc: '', tablet: '', mobile: '' },
      sortOrder: (project as any).sortOrder || 0,
      is_visible: project.is_visible ?? true
    });

    if (project.links) {
      project.links.forEach(link => {
        const control = this.projectForm.get(`links.${link.type}`);
        if (control) {
          control.setValue(link.url);
        }
      });
    }

    if (project.platforms && project.platforms.length > 0) {
      project.platforms.forEach(p => this.addPlatform(p));
      this.expandedPlatforms = project.platforms.map(() => true);
    }
  }

  async save() {
    if (this.projectForm.invalid) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    this.isSaving = true;
    const projectData = { ...this.projectForm.value };
    
    const rawLinks = projectData.links || {};
    const linksArray = [];
    if (rawLinks.ios) linksArray.push({ type: 'ios', label: 'iOS 앱', url: rawLinks.ios });
    if (rawLinks.android) linksArray.push({ type: 'android', label: 'Android 앱', url: rawLinks.android });
    if (rawLinks.landing) linksArray.push({ type: 'landing', label: '랜딩페이지', url: rawLinks.landing });
    if (rawLinks.web) linksArray.push({ type: 'web', label: '메인 웹사이트', url: rawLinks.web });
    if (rawLinks.admin) linksArray.push({ type: 'admin', label: '관리자페이지', url: rawLinks.admin });
    
    projectData.links = linksArray;

    try {
      if (this.project()) {
        const id = (this.project() as any).id;
        await this.projectService.updateProject(id, projectData);
      } else {
        await this.projectService.addProject(projectData);
      }
      this.saveComplete.emit();
      this.closeModal.emit();
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      this.isSaving = false;
    }
  }

  async onFileSelected(event: Event, controlPath: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.isUploading.update(state => ({ ...state, [controlPath]: true }));

    const fileExt = file.name.split('.').pop();
    const fileName = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    let folder = 'others';
    if (controlPath === 'logo') folder = 'logos';
    else if (controlPath === 'imageUrl') folder = 'covers';
    else if (controlPath.includes('platform_images.')) {
      const parts = controlPath.split('.');
      const platformStr = parts[parts.length - 1]; // pc, tablet, mobile
      folder = `platforms/${platformStr}`;
    } else if (controlPath.startsWith('platformImages.')) {
      const platformStr = controlPath.split('.')[1];
      folder = `platforms/${platformStr}`;
    }
    
    const filePath = `${folder}/${fileName}`;
    try {
      const { error } = await this.projectService.uploadImage(filePath, file);
      if (error) {
        console.error('Upload Error:', error);
        this.dAlert.error(`이미지 업로드에 실패했습니다. (${controlPath})`);
      } else {
        const publicUrl = this.projectService.getImageUrl(filePath);
        const control = this.projectForm.get(controlPath);
        if (control) {
          control.setValue(publicUrl);
          control.markAsDirty();
        }
      }
    } catch (error) {
      console.error(error);
      this.dAlert.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      this.isUploading.update(state => ({ ...state, [controlPath]: false }));
      input.value = ''; // 동일 파일 재업로드 가능하게 초기화
    }
  }

  removeImage(controlPath: string, event?: Event) {
    event?.stopPropagation();
    event?.preventDefault();
    this.projectForm.get(controlPath)?.setValue('');
    this.projectForm.get(controlPath)?.markAsDirty();
  }

  toggleArrayValue(controlName: string, value: string) {
    const control = this.projectForm.get(controlName);
    if (!control) return;
    
    const currentArray = control.value || [];
    if (currentArray.includes(value)) {
      control.setValue(currentArray.filter((v: string) => v !== value));
    } else {
      control.setValue([...currentArray, value]);
    }
    control.markAsDirty();
  }

  removeArrayValue(controlName: string, value: string) {
    const control = this.projectForm.get(controlName);
    if (!control) return;
    
    const currentArray = control.value || [];
    control.setValue(currentArray.filter((v: string) => v !== value));
    control.markAsDirty();
  }

  togglePlatformArrayValue(platformIndex: number, controlName: string, value: string) {
    const control = this.platforms.at(platformIndex).get(controlName);
    if (!control) return;
    
    const currentArray = control.value || [];
    if (currentArray.includes(value)) {
      control.setValue(currentArray.filter((v: string) => v !== value));
    } else {
      control.setValue([...currentArray, value]);
    }
    control.markAsDirty();
  }

  removePlatformArrayValue(platformIndex: number, controlName: string, value: string) {
    const control = this.platforms.at(platformIndex).get(controlName);
    if (!control) return;
    
    const currentArray = control.value || [];
    control.setValue(currentArray.filter((v: string) => v !== value));
    control.markAsDirty();
  }
}
