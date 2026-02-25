import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss'
})
export class DropdownComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  private documentListener: (() => void) | null = null;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // 캡처 단계에서 mousedown 이벤트를 감지하여 stopPropagation()이 호출된 경우에도 대응
    // Renderer2.listen은 세 번째 인자로 옵션을 받을 수 없으므로 네이티브 addEventListener 사용
    this.documentListener = this.renderer.listen('document', 'mousedown', (event: MouseEvent) => {
      this.handleMouseDown(event);
    });
    
    // 네이티브 이벤트를 사용하여 캡처 단계에서 리스닝
    document.addEventListener('mousedown', this.handleNativeMouseDown, true);
  }

  ngOnDestroy() {
    if (this.documentListener) {
      this.documentListener();
    }
    document.removeEventListener('mousedown', this.handleNativeMouseDown, true);
  }

  // 화살표 함수로 정의하여 this 바인딩 유지
  private handleNativeMouseDown = (event: MouseEvent) => {
    if (!this.isOpen) return;

    const target = event.target as HTMLElement;
    
    // 드롭다운 내부 클릭인지 확인
    const isInside = this.elementRef.nativeElement.contains(target);
    
    // 토글 버튼(menu-item) 클릭인 경우 무시 (토글 로직에서 처리하도록)
    const isToggleButton = target.closest('.menu-item');

    // 외부 클릭인 경우에만 즉시 닫기 (캡처 단계에서 처리)
    if (!isInside && !isToggleButton) {
      // 캡처 단계에서 즉시 닫으면 토글 버튼의 click 이벤트가 발생할 때 다시 열릴 수 있으므로 지연
      setTimeout(() => {
        this.close.emit();
      }, 10);
    }
  };

  // 버블링 단계의 클릭 이벤트 처리
  @HostListener('click', ['$event'])
  onComponentClick(event: MouseEvent) {
    if (!this.isOpen) return;

    const target = event.target as HTMLElement;
    
    // 항목(dropdown-item)을 클릭한 경우 닫기
    // 버블링 단계에서 닫으므로, 항목 자체에 걸린 (click) 이벤트가 먼저 실행됨
    if (target.closest('.dropdown-item')) {
      this.close.emit();
    }
  }

  private handleMouseDown(event: MouseEvent) {
    // Renderer2 리스너는 버블링 단계를 위한 보조용으로 유지
  }
}
