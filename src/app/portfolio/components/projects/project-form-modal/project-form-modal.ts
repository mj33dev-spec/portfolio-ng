import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { Project, ProjectLink } from '../../../project.model';
import { ProjectService } from '../../../project.service';

@Component({
  selector: 'app-project-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form-modal.html',
  styleUrls: ['./project-form-modal.scss']
})
export class ProjectFormModalComponent implements OnInit {
  project = input<Project | null>(null);
  closeModal = output<void>();
  saveComplete = output<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);

  projectForm!: FormGroup;
  isSaving = false;

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
      status: [''],
      affiliation: [''],
      color: ['#000000'],
      workPeriod: [''],
      logo: [''],
      imageUrl: [''],
      url: [''],
      scopeAndContribution: [''],
      retrospective: [''],
      serviceTags: [''], // Will be handled as comma separated string
      roleTags: [''],
      developmentEnvironment: [''],
      developmentLanguage: [''],
      platformImages: this.fb.group({
        pc: [''],
        tablet: [''],
        mobile: ['']
      }),
      links: this.fb.array([]),
      sortOrder: [0]
    });
  }

  get links() {
    return this.projectForm.get('links') as FormArray;
  }

  addLink() {
    this.links.push(this.fb.group({
      type: ['web'],
      label: ['웹사이트'],
      url: ['']
    }));
  }

  removeLink(index: number) {
    this.links.removeAt(index);
  }

  patchForm(project: Project) {
    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      status: project.status,
      affiliation: project.affiliation,
      color: project.color,
      workPeriod: project.workPeriod,
      logo: project.logo,
      imageUrl: project.imageUrl,
      url: project.url,
      scopeAndContribution: project.scopeAndContribution,
      retrospective: project.retrospective,
      serviceTags: (project.serviceTags || []).join(', '),
      roleTags: (project.roleTags || []).join(', '),
      developmentEnvironment: (project.developmentEnvironment || []).join(', '),
      developmentLanguage: (project.developmentLanguage || []).join(', '),
      platformImages: project.platformImages || { pc: '', tablet: '', mobile: '' },
      sortOrder: (project as any).sortOrder || 0
    });

    if (project.links) {
      project.links.forEach(link => {
        this.links.push(this.fb.group({
          type: [link.type],
          label: [link.label],
          url: [link.url]
        }));
      });
    }
  }

  async save() {
    if (this.projectForm.invalid) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    this.isSaving = true;
    const formValue = this.projectForm.value;

    // Convert comma separated strings to arrays
    const toArray = (str: string) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

    const projectData: any = {
      ...formValue,
      serviceTags: toArray(formValue.serviceTags),
      roleTags: toArray(formValue.roleTags),
      developmentEnvironment: toArray(formValue.developmentEnvironment),
      developmentLanguage: toArray(formValue.developmentLanguage),
    };

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
}
