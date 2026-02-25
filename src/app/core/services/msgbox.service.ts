import {
  Injectable,
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  createComponent,
  Inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MsgboxComponent, MsgboxButton } from '../../components/msgbox/msgbox';
import { Subject, Observable } from 'rxjs';

export interface MsgboxConfig {
  title?: string;
  message: string;
  buttons?: MsgboxButton[];
  icon?: 'success' | 'info' | 'warn' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class MsgboxService {
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * OK 버튼만 있는 대화상자를 표시합니다.
   */
  okOnly(message: string, title?: string, icon?: 'success' | 'info' | 'warn' | 'error'): Observable<boolean> {
    return this._show({
      title,
      message,
      icon,
      buttons: [{ label: '확인', type: 'primary', value: true }]
    });
  }

  /**
   * OK와 Cancel 버튼이 있는 대화상자를 표시합니다.
   */
  okCancel(message: string, title?: string, icon?: 'success' | 'info' | 'warn' | 'error'): Observable<boolean | null> {
    return this._show({
      title,
      message,
      icon,
      buttons: [
        { label: '확인', type: 'primary', value: true },
        { label: '취소', type: 'secondary', value: null }
      ]
    });
  }

  /**
   * 예 버튼만 있는 대화상자를 표시합니다.
   */
  yesOnly(message: string, title?: string, icon?: 'success' | 'info' | 'warn' | 'error'): Observable<boolean> {
    return this._show({
      title,
      message,
      icon,
      buttons: [{ label: '예', type: 'primary', value: true }]
    });
  }

  /**
   * 예와 아니요 버튼이 있는 대화상자를 표시합니다.
   */
  yesNo(message: string, title?: string, icon?: 'success' | 'info' | 'warn' | 'error'): Observable<boolean> {
    return this._show({
      title,
      message,
      icon,
      buttons: [
        { label: '예', type: 'primary', value: true },
        { label: '아니요', type: 'secondary', value: false }
      ]
    });
  }

  /**
   * 커스텀 설정을 사용하여 대화상자를 표시합니다.
   */
  custom(config: MsgboxConfig): Observable<any> {
    return this._show(config);
  }

  /**
   * 메시지 박스를 표시하고 사용자 작업의 결과를 방출하는 옵저버블을 반환합니다.
   */
  private _show(config: MsgboxConfig): Observable<any> {
    const resultSubject = new Subject<any>();

    // 1. 컴포넌트 생성
    const msgBoxRef = createComponent<MsgboxComponent>(MsgboxComponent, {
      environmentInjector: this.injector
    });

    // 2. 입력값 설정
    msgBoxRef.instance.title = config.title || '메시지';
    msgBoxRef.instance.message = config.message;
    if (config.icon) {
      msgBoxRef.instance.icon = config.icon;
    }
    if (config.buttons) {
      msgBoxRef.instance.buttons = config.buttons;
    }

    // 3. DOM에 부착
    this.document.body.appendChild(msgBoxRef.location.nativeElement);
    this.appRef.attachView(msgBoxRef.hostView);
    msgBoxRef.changeDetectorRef.detectChanges();

    // 4. 구독을 사용하여 이벤트 처리
    const subAction = msgBoxRef.instance.action.subscribe((value: any) => {
      resultSubject.next(value);
      resultSubject.complete();
      this.removeMsgBox(msgBoxRef);
    });

    const subClose = msgBoxRef.instance.close.subscribe(() => {
      resultSubject.next(null);
      resultSubject.complete();
      this.removeMsgBox(msgBoxRef);
    });

    msgBoxRef.onDestroy(() => {
        subAction.unsubscribe();
        subClose.unsubscribe();
    });

    return resultSubject.asObservable();
  }


  private removeMsgBox(msgBoxRef: ComponentRef<MsgboxComponent>) {
    this.appRef.detachView(msgBoxRef.hostView);
    msgBoxRef.destroy();
  }
}
