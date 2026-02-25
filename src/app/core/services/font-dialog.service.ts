import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, createComponent } from '@angular/core';
import { FontConfig, FontDialogComponent } from '../../components/font-dialog/font-dialog.component';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FontDialogService {
  private componentRef?: ComponentRef<FontDialogComponent>;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  open(initialConfig: FontConfig): Observable<FontConfig | null> {
    if (this.componentRef) {
      this.close();
    }

    const resultSubject = new Subject<FontConfig | null>();

    this.componentRef = createComponent(FontDialogComponent, {
      environmentInjector: this.injector
    });

    this.componentRef.instance.initialConfig = initialConfig;

    this.componentRef.instance.ok.subscribe((config) => {
      console.log('[FontDialogService] Result received:', config);
      resultSubject.next(config);
      resultSubject.complete();
      this.close();
    });

    this.componentRef.instance.cancel.subscribe(() => {
      console.log('[FontDialogService] Cancelled');
      resultSubject.next(null);
      resultSubject.complete();
      this.close();
    });

    this.appRef.attachView(this.componentRef.hostView);
    document.body.appendChild((this.componentRef.hostView as any).rootNodes[0]);

    return resultSubject.asObservable();
  }

  private close() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
  }
}
