import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Captcha {
  id: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {

  constructor(private http: HttpClient) { }

  generateCaptcha(): Observable<Captcha> {
    return this.http.get<Captcha>('/api/app/captcha/generate');
  }

  validateCaptcha(captchaId: string, captchaText: string): Observable<boolean> {
    return this.http.post<boolean>('/api/app/captcha/validate', {
      captchaId,
      captchaText
    });
  }
}
