
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DAlertService } from '../d-alert/d-alert.service';
import emailjs from '@emailjs/browser';

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
  private dAlert = inject(DAlertService);
  
  // TODO: EmailJS 가입 후 부여받은 키로 교체해주세요. (https://emailjs.com/)
  private EMAILJS_PUBLIC_KEY = '4ucllUD93JGp0Do2r';
  private EMAILJS_SERVICE_ID = 'service_cife2ek';
  private EMAILJS_TEMPLATE_ID = 'template_7yg97j6';

  isSending = signal(false);

  contactForm = this.fb.group({
    company: ['', Validators.required],
    contact: ['', Validators.required],
    name: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });
  
  submitForm(): void {
    if (this.contactForm.invalid) {
      this.dAlert.warn('폼을 올바르게 채워주세요.');
      return;
    }

    this.dAlert.yesNo(
      '정말로 이메일을 전송하시겠습니까?',
      async () => {
        try {
          this.isSending.set(true);
          
          const { company, contact, name, message } = this.contactForm.value;
          
          const templateParams = {
            company: company,
            contact: contact,
            name: name,
            message: message,
          };

          // EmailJS 전송 (실제 키 입력 후 정상 작동합니다)
          await emailjs.send(
            this.EMAILJS_SERVICE_ID,
            this.EMAILJS_TEMPLATE_ID,
            templateParams,
            this.EMAILJS_PUBLIC_KEY
          );

          this.dAlert.success('이메일이 성공적으로 전송되었습니다!');
          this.contactForm.reset();
        } catch (error) {
          console.error('EmailJS Error:', error);
          this.dAlert.error('이메일 전송에 실패했습니다. (API 키 설정을 확인해주세요)');
        } finally {
          this.isSending.set(false);
        }
      }
    );
  }
}
