import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

@Directive({
  selector: 'label[required]',
  standalone: true
})
export class RequiredLabelDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    const labelElement = this.el.nativeElement as HTMLLabelElement;
    const labelText = labelElement.textContent || '';
    
    // 이미 *가 있는지 확인
    if (!labelText.includes('*')) {
      // 빨간색 별표 span 생성
      const asterisk = this.renderer.createElement('span');
      this.renderer.addClass(asterisk, 'required-label');
      const text = this.renderer.createText('*');
      this.renderer.appendChild(asterisk, text);
      
      // label에 별표 추가
      this.renderer.appendChild(labelElement, asterisk);
    }
  }
}
