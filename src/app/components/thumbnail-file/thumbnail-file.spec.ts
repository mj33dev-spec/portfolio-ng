import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbnailFile } from './thumbnail-file';

describe('ThumbnailFile', () => {
  let component: ThumbnailFile;
  let fixture: ComponentFixture<ThumbnailFile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThumbnailFile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThumbnailFile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
