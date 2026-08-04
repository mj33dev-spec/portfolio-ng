import { Injectable, signal } from '@angular/core';

export type DAlertType = 'info' | 'success' | 'warn' | 'error';
export type DAlertButtonType = 'yesOnly' | 'yesNo' | 'okOnly' | 'okCancel' | 'custom';
export type DAlertDirection = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface DAlertOptions {
  title?: string;
  message: string;
  type?: DAlertType;
  buttonType?: DAlertButtonType;
  onConfirm?: () => void;
  onCancel?: () => void;
  direction?: DAlertDirection;
  isPrompt?: boolean;
  promptPlaceholder?: string;
  onPromptSubmit?: (value: string) => void;
}

export interface DAlertState extends DAlertOptions {
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DAlertService {
  private initialState: DAlertState = {
    isOpen: false,
    message: '',
    type: 'info',
    buttonType: 'okOnly',
    direction: 'center',
  };

  alertState = signal<DAlertState>(this.initialState);

  show(options: DAlertOptions) {
    this.alertState.set({
      ...this.initialState,
      ...options,
      isOpen: true,
    });
  }

  close() {
    this.alertState.update(state => ({ ...state, isOpen: false }));
  }

  info(message: string, title?: string, onConfirm?: () => void) {
    this.show({ message, title, type: 'info', buttonType: 'okOnly', onConfirm });
  }

  success(message: string, title?: string, onConfirm?: () => void) {
    this.show({ message, title, type: 'success', buttonType: 'okOnly', onConfirm });
  }

  warn(message: string, title?: string, onConfirm?: () => void) {
    this.show({ message, title, type: 'warn', buttonType: 'okOnly', onConfirm });
  }

  error(message: string, title?: string, onConfirm?: () => void) {
    this.show({ message, title, type: 'error', buttonType: 'okOnly', onConfirm });
  }

  confirm(message: string, onConfirm?: () => void, onCancel?: () => void, title?: string) {
    this.show({ message, title, type: 'warn', buttonType: 'okCancel', onConfirm, onCancel, direction: 'center' });
  }

  yesNo(message: string, onConfirm?: () => void, onCancel?: () => void, title?: string) {
    this.show({ message, title, type: 'info', buttonType: 'yesNo', onConfirm, onCancel, direction: 'center' });
  }

  okCancel(message: string, onConfirm?: () => void, onCancel?: () => void, title?: string) {
    this.show({ message, title, type: 'info', buttonType: 'okCancel', onConfirm, onCancel, direction: 'center' });
  }

  yesOnly(message: string, onConfirm?: () => void, title?: string) {
    this.show({ message, title, type: 'info', buttonType: 'yesOnly', onConfirm, direction: 'center' });
  }

  okOnly(message: string, onConfirm?: () => void, title?: string) {
    this.show({ message, title, type: 'info', buttonType: 'okOnly', onConfirm, direction: 'center' });
  }

  prompt(message: string, onPromptSubmit: (value: string) => void, promptPlaceholder?: string, title?: string) {
    this.show({ message, title, type: 'info', buttonType: 'okCancel', isPrompt: true, onPromptSubmit, promptPlaceholder, direction: 'center' });
  }
}
