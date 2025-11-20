import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './capt-cha.component.html',
  styleUrls: ['./capt-cha.component.scss']
})
export class CaptchaComponent implements OnInit {
  imageData = '';
  captchaId: string | null = null;
  loading = false;

  @Output() captchaChanged = new EventEmitter<{ captchaId: string | null }>();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCaptcha();
  }

  loadCaptcha(): void {
    this.loading = true;
    this.http.get<any>('/api/app/captcha')
      .subscribe({
        next: (res) => {
          this.imageData = res.image;
          this.captchaId = res.captchaId;
          this.captchaChanged.emit({ captchaId: this.captchaId });
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load CAPTCHA:', error);
          this.imageData = '';
          this.captchaId = null;
          this.captchaChanged.emit({ captchaId: null });
          this.loading = false;
        }
      });
  }

  onRefresh(): void {
    this.loadCaptcha();
  }
}
