import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, createComponent } from '@angular/core';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AboutDialogService {
  private componentRef?: ComponentRef<AboutDialogComponent>;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  open() {
    if (this.componentRef) {
      this.close();
    }

    this.componentRef = createComponent(AboutDialogComponent, {
      environmentInjector: this.injector
    });

    this.componentRef.instance.close.subscribe(() => {
      this.close();
    });

    this.appRef.attachView(this.componentRef.hostView);
    document.body.appendChild((this.componentRef.hostView as any).rootNodes[0]);
  }

  private close() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
  }
}
