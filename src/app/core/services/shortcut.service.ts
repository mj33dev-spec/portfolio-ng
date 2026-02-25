import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export interface ShortcutConfig {
  key: string; // 'a', 'Delete', 'F2', etc.
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShortcutService implements OnDestroy {
  private shortcuts: Map<string, ShortcutConfig[]> = new Map();
  private isEnabled = true;

  constructor() {
    window.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * 단축키 등록
   */
  register(config: ShortcutConfig) {
    const key = config.key.toLowerCase();
    const current = this.shortcuts.get(key) || [];
    this.shortcuts.set(key, [...current, config]);
  }

  /**
   * 단축키 해제
   */
  unregister(key: string, action: () => void) {
    const lowerKey = key.toLowerCase();
    const current = this.shortcuts.get(lowerKey);
    if (current) {
      this.shortcuts.set(
        lowerKey,
        current.filter((s) => s.action !== action)
      );
    }
  }

  /**
   * 서비스 활성화/비활성화 (예: 모달이 떠 있을 때 일시 중지 가능)
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private handleKeydown(event: KeyboardEvent) {
    if (!this.isEnabled) return;

    // 입력창(Input, Textarea, ContentEditable)에서는 단축키 무시
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // 단, Escape 같은 특수 키는 예외로 처리하고 싶을 경우 여기서 필터링
      if (event.key !== 'Escape') return;
    }

    const key = event.key.toLowerCase();
    const configs = this.shortcuts.get(key);

    if (configs) {
      const match = configs.find(
        (s) =>
          !!s.ctrl === (event.ctrlKey || event.metaKey) && // macOS Cmd 키 포함
          !!s.shift === event.shiftKey &&
          !!s.alt === event.altKey
      );

      if (match) {
        event.preventDefault();
        match.action();
      }
    }
  }
}
