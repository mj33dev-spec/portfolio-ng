import {
  Injectable,
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  createComponent,
  Inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ToastComponent, ToastType } from '../../components/toast/toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastContainer: HTMLElement | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector, // Use EnvironmentInjector for standalone components
    @Inject(DOCUMENT) private document: Document
  ) {}

  private getContainer(): HTMLElement {
    if (!this.toastContainer) {
      this.toastContainer = this.document.createElement('div');
      this.toastContainer.className = 'toast-wrapper';
      Object.assign(this.toastContainer.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: '20000',
        pointerEvents: 'none',
        alignItems: 'flex-end' // 오른쪽 정렬
      });
      this.document.body.appendChild(this.toastContainer);
    }
    return this.toastContainer;
  }

  private _show(message: string, type: ToastType = 'info') {
    const container = this.getContainer();

    // 1. 컴포넌트 생성
    const toastRef = createComponent(ToastComponent, {
      environmentInjector: this.injector
    });

    // 2. 데이터 주입
    toastRef.instance.message = message;
    toastRef.instance.type = type;

    // 닫기 이벤트 구독
    const sub = toastRef.instance.closed.subscribe(() => {
      this.removeToast(toastRef);
      sub.unsubscribe();
    });

    // 3. 뷰를 애플리케이션에 부착 (변경 감지 활성화)
    this.appRef.attachView(toastRef.hostView);
    toastRef.changeDetectorRef.detectChanges(); // 강제 변경 감지 실행

    container.appendChild(toastRef.location.nativeElement);
  }

  success(message: string) {
    this._show(message, 'success');
  }

  info(message: string) {
    this._show(message, 'info');
  }

  warn(message: string) {
    this._show(message, 'warn');
  }

  error(message: string) {
    this._show(message, 'error');
  }

  private removeToast(toastRef: ComponentRef<ToastComponent>) {
    this.appRef.detachView(toastRef.hostView);
    toastRef.destroy();
    
    // 컨테이너가 비었으면 제거? 선택사항.
    // if (this.toastContainer && this.toastContainer.childNodes.length === 0) {
    //   this.document.body.removeChild(this.toastContainer);
    //   this.toastContainer = null;
    // }
  }
}
