
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  contactForm = this.fb.group({
    company: ['', Validators.required],
    name: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(20)]]
  });
  
  mailtoLink = signal<SafeUrl>('');

  generateMailto(): void {
    if (this.contactForm.invalid) {
        return;
    }
    const { company, name, message } = this.contactForm.value;
    const subject = encodeURIComponent(`${company}의 ${name}님으로부터의 연락`);
    const body = encodeURIComponent(message || '');
    const href = `mailto:almj3308@gmail.com?subject=${subject}&body=${body}`;
    this.mailtoLink.set(this.sanitizer.bypassSecurityTrustUrl(href));
  }

  submitForm(): void {
    this.generateMailto();
    // In a real app, you might need a small delay or a click on a generated link
    // as direct window.location can be blocked. For simplicity, we update the href.
    // The user will click the link that appears.
  }
}
