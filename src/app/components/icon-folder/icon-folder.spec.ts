import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgFolder } from './svg-folder';

describe('SvgFolder', () => {
  let component: SvgFolder;
  let fixture: ComponentFixture<SvgFolder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgFolder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgFolder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
