import {
  Injectable,
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  createComponent,
  Inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { InputBox } from '../../components/inputbox/inputbox';
import { Subject, Observable } from 'rxjs';

export interface InputBoxConfig {
  title?: string;
  message: string;
  defaultValue?: string;
  type?: 'okOnly' | 'okCancel';
}

@Injectable({
  providedIn: 'root'
})
export class InputBoxService {
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * OK 버튼만 있는 입력 대화상자를 표시합니다.
   */
  okOnly(message: string, title?: string, defaultValue?: string): Observable<string | null> {
    return this._show({ message, title, defaultValue, type: 'okOnly' });
  }

  /**
   * OK와 Cancel 버튼이 있는 입력 대화상자를 표시합니다.
   */
  okCancel(message: string, title?: string, defaultValue?: string): Observable<string | null> {
    return this._show({ message, title, defaultValue, type: 'okCancel' });
  }

  /**
   * 커스텀 설정을 사용하여 입력 대화상자를 표시합니다.
   */
  custom(config: InputBoxConfig): Observable<string | null> {
    return this._show(config);
  }

  /**
   * 입력란이 있는 대화상자를 표시하고 사용자가 입력한 값을 방출하는 옵저버블을 반환합니다.
   * 사용자가 취소하면 null을 방출합니다.
   */
  private _show(config: InputBoxConfig): Observable<string | null> {
    const resultSubject = new Subject<string | null>();

    // 1. 컴포넌트 생성
    const inputBoxRef = createComponent(InputBox, {
      environmentInjector: this.injector
    });

    // 2. 입력값 설정
    inputBoxRef.instance.title = config.title || '입력';
    inputBoxRef.instance.message = config.message;
    inputBoxRef.instance.defaultValue = config.defaultValue || '';
    inputBoxRef.instance.type = config.type || 'okCancel';

    // 3. DOM에 부착
    this.document.body.appendChild(inputBoxRef.location.nativeElement);
    this.appRef.attachView(inputBoxRef.hostView);
    inputBoxRef.changeDetectorRef.detectChanges();

    // 4. 구독을 사용하여 이벤트 처리
    const subAction = inputBoxRef.instance.action.subscribe((value: string | null) => {
      resultSubject.next(value);
      resultSubject.complete();
      this.removeInputBox(inputBoxRef);
    });

    const subClose = inputBoxRef.instance.close.subscribe(() => {
      resultSubject.next(null);
      resultSubject.complete();
      this.removeInputBox(inputBoxRef);
    });

    inputBoxRef.onDestroy(() => {
      subAction.unsubscribe();
      subClose.unsubscribe();
    });

    return resultSubject.asObservable();
  }

  private removeInputBox(inputBoxRef: ComponentRef<InputBox>) {
    this.appRef.detachView(inputBoxRef.hostView);
    inputBoxRef.destroy();
  }
}
