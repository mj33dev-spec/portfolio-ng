import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { Project, ProjectLink } from '../../../project.model';
import { ProjectService } from '../../../project.service';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { DAlertService } from '../../d-alert/d-alert.service';
import { CDropdownComponent, CDropdownOption } from '../../c-dropdown/c-dropdown.component';

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

  affiliationOptions: CDropdownOption[] = [
    { label: '앨리스래빗', value: '앨리스래빗' },
    { label: '개인프로젝트', value: '개인프로젝트' },
    { label: '프리랜서', value: '프리랜서' },
    { label: '기타', value: '기타' }
  ];

  statusOptions: CDropdownOption[] = [
    { label: '운영중', value: '운영중' },
    { label: '운영중단됨', value: '운영중단됨' },
  ];

  visibilityOptions: CDropdownOption[] = [
    { label: '노출', value: true },
    { label: '비노출', value: false }
  ];

  serviceOptions: CDropdownOption[] = [
    { label: 'App', value: 'App', customColor: '#02569B', customBgColor: 'rgba(2, 86, 155, 0.15)' },
    { label: 'Web', value: 'Web', customColor: '#4caf50', customBgColor: 'rgba(76, 175, 80, 0.15)' },
    { label: 'Admin', value: 'Admin', customColor: '#2196f3', customBgColor: 'rgba(33, 150, 243, 0.15)' },
    { label: 'API', value: 'API', customColor: '#6b7280', customBgColor: 'rgba(107, 114, 128, 0.15)' },
    { label: 'Batch', value: 'Batch', customColor: '#6b7280', customBgColor: 'rgba(107, 114, 128, 0.15)' },
    { label: '기타', value: '기타', customColor: '#6b7280', customBgColor: 'rgba(107, 114, 128, 0.15)' }
  ];

  roleOptions: CDropdownOption[] = [
    { label: 'Frontend', value: 'Frontend', customColor: '#ff9800', customBgColor: 'rgba(255, 152, 0, 0.15)' },
    { label: 'Publishing', value: 'Publishing', customColor: '#e91e63', customBgColor: 'rgba(233, 30, 99, 0.15)' },
    { label: 'Backend', value: 'Backend', customColor: '#6b7280', customBgColor: 'rgba(107, 114, 128, 0.15)' },
    { label: 'Design', value: 'Design', customColor: '#14b8a6', customBgColor: 'rgba(20, 184, 166, 0.15)' },
    { label: 'Planning', value: 'Planning', customColor: '#14b8a6', customBgColor: 'rgba(20, 184, 166, 0.15)' },
    { label: 'PM', value: 'PM', customColor: '#6b7280', customBgColor: 'rgba(107, 114, 128, 0.15)' }
  ];

  envOptions: CDropdownOption[] = [
    { label: 'Flutter', value: 'Flutter', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg', customColor: '#38bdf8', customBgColor: 'rgba(56, 189, 248, 0.15)' },
    { label: 'Angular', value: 'Angular', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angular/angular-original.svg', customColor: '#ef4444', customBgColor: 'rgba(239, 68, 68, 0.15)' },
    { label: 'React', value: 'React', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', customColor: '#61dafb', customBgColor: 'rgba(97, 218, 251, 0.15)' },
    { label: 'Vue', value: 'Vue', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg', customColor: '#4ade80', customBgColor: 'rgba(74, 222, 128, 0.15)' },
    { label: 'node.js', value: 'node.js', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', customColor: '#4ade80', customBgColor: 'rgba(74, 222, 128, 0.15)' },
    { label: 'Spring Boot', value: 'Spring Boot', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg', customColor: '#6db33f', customBgColor: 'rgba(109, 179, 63, 0.15)' },
    { label: 'MySQL', value: 'MySQL', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg', customColor: '#4479a1', customBgColor: 'rgba(68, 121, 161, 0.15)' },
    { label: 'PostgreSQL', value: 'PostgreSQL', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', customColor: '#336791', customBgColor: 'rgba(51, 103, 145, 0.15)' },
    { label: 'Firebase', value: 'Firebase', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg', customColor: '#ffca28', customBgColor: 'rgba(255, 202, 40, 0.15)' },
    { label: '기타', value: '기타', customColor: '#9ca3af', customBgColor: 'rgba(156, 163, 175, 0.15)' }
  ];

  langOptions: CDropdownOption[] = [
    { label: 'Dart', value: 'Dart', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg', customColor: '#0175C2', customBgColor: 'rgba(1, 117, 194, 0.15)' },
    { label: 'Typescript', value: 'Typescript', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', customColor: '#60a5fa', customBgColor: 'rgba(96, 165, 250, 0.15)' },
    { label: 'Javascript', value: 'Javascript', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg', customColor: '#facc15', customBgColor: 'rgba(250, 204, 21, 0.15)' },
    { label: 'HTML', value: 'HTML', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg', customColor: '#f97316', customBgColor: 'rgba(249, 115, 22, 0.15)' },
    { label: 'CSS', value: 'CSS', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg', customColor: '#3b82f6', customBgColor: 'rgba(59, 130, 246, 0.15)' },
    { label: 'SCSS', value: 'SCSS', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg', customColor: '#cc6699', customBgColor: 'rgba(204, 102, 153, 0.15)' },
    { label: 'Java', value: 'Java', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg', customColor: '#b07219', customBgColor: 'rgba(176, 114, 25, 0.15)' },
    { label: 'Python', value: 'Python', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', customColor: '#3776ab', customBgColor: 'rgba(55, 118, 171, 0.15)' },
    { label: 'C#', value: 'C#', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg', customColor: '#178600', customBgColor: 'rgba(23, 134, 0, 0.15)' },
    { label: '기타', value: '기타', customColor: '#9ca3af', customBgColor: 'rgba(156, 163, 175, 0.15)' }
  ];

  ngOnInit() {
    this.initForm();
    if (this.project()) {
      this.patchForm(this.project()!);
    }
  }

  initForm() {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required],
      affiliation: ['', Validators.required],
      workPeriod: ['', Validators.required],
      logo: [''],
      scopeAndContribution: ['', Validators.required],
      serviceTags: [[], [Validators.required, Validators.minLength(1)]],
      roleTags: [[], [Validators.required, Validators.minLength(1)]],
      developmentEnvironment: [[], [Validators.required, Validators.minLength(1)]],
      developmentLanguage: [[], [Validators.required, Validators.minLength(1)]],
      retrospective: [''],
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
      color: [''],
      sortOrder: [0],
      is_visible: [true]
    });
  }

  patchForm(project: Project) {
    this.projectForm.patchValue({
      title: project.title,
      description: project.description || '',
      status: project.status || '',
      affiliation: project.affiliation || '',
      color: project.color || '#000000',
      workPeriod: project.workPeriod || '',
      logo: project.logo || '',
      scopeAndContribution: project.scopeAndContribution || '',
      retrospective: project.retrospective || '',
      serviceTags: project.serviceTags || [],
      roleTags: project.roleTags || [],
      developmentEnvironment: project.developmentEnvironment || [],
      developmentLanguage: project.developmentLanguage || [],
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
    
    // 컨트롤 이름에 따라 폴더 분리
    let folder = 'others';
    if (controlPath === 'logo') folder = 'logos';
    else if (controlPath === 'imageUrl') folder = 'covers';
    else if (controlPath.startsWith('platformImages.')) {
      const platform = controlPath.split('.')[1]; // pc, tablet, mobile
      folder = `platforms/${platform}`;
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
}
