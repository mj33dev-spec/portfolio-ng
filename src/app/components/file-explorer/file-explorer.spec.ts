import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileExplorer } from './file-explorer';
import { Model_Folder, Model_File } from '../directory/directory-model';

describe('FileExplorer', () => {
  let component: FileExplorer;
  let fixture: ComponentFixture<FileExplorer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileExplorer],
    }).compileComponents();

    fixture = TestBed.createComponent(FileExplorer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should navigate history correctly', () => {
    const folder1 = new Model_Folder('', 'Folder 1', '/folder1', 0);
    const folder2 = new Model_Folder('', 'Folder 2', '/folder2', 0);

    // Initial state
    expect(component.history.length).toBe(0);

    // Navigate to folder 1
    component.selectFolder(folder1);
    expect(component.history.length).toBe(1);
    expect(component.currentHistoryIndex).toBe(0);
    expect(component.selectedFolder).toBe(folder1);

    // Navigate to folder 2
    component.selectFolder(folder2);
    expect(component.history.length).toBe(2);
    expect(component.currentHistoryIndex).toBe(1);
    expect(component.selectedFolder).toBe(folder2);

    // Go back
    component.goBack();
    expect(component.currentHistoryIndex).toBe(0);
    expect(component.selectedFolder).toBe(folder1);

    // Go forward
    component.goForward();
    expect(component.currentHistoryIndex).toBe(1);
    expect(component.selectedFolder).toBe(folder2);
  });

});
