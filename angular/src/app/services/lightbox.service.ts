import { Injectable, inject } from '@angular/core';
import { FileService } from './file.service';

export interface LightboxItem {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  type: 'image' | 'text';
  content?: string;
  fileSize?: number;
  fileName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  private fileService = inject(FileService);
  private isOpen = false;
  private currentIndex = 0;
  private items: LightboxItem[] = [];

  createImageItem(url: string, fileName: string, caption?: string): LightboxItem {
    return {
      url,
      fileName,
      caption,
      type: 'image'
    };
  }

  createTextItem(content: string, fileName: string, fileSize?: number): LightboxItem {
    return {
      url: '#',
      fileName,
      content,
      fileSize,
      type: 'text'
    };
  }

  open(items: LightboxItem[], startIndex: number = 0): void {
    if (items.length === 0) return;

    this.items = items;
    this.currentIndex = startIndex;
    this.isOpen = true;
    this.createLightbox();
  }

  close(): void {
    this.isOpen = false;
    this.destroyLightbox();
    this.items = [];
  }

  next(): void {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      this.updateLightbox();
    }
  }

  previous(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateLightbox();
    }
  }

  private createLightbox(): void {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = this.getLightboxHTML();

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    this.attachEventListeners(lightbox);
  }

  private getLightboxHTML(): string {
    const currentItem = this.items[this.currentIndex];
    const hasMultiple = this.items.length > 1;

    if (currentItem.type === 'text') {
      return `
        <div class="lightbox-container text-lightbox">
          <button class="lightbox-close" aria-label="Close">&times;</button>
          ${hasMultiple ? `
            <button class="lightbox-nav lightbox-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>‹</button>
            <button class="lightbox-nav lightbox-next" ${this.currentIndex === this.items.length - 1 ? 'disabled' : ''}>›</button>
          ` : ''}
          
          <div class="lightbox-content">
            <div class="text-file-preview">
              <div class="text-file-header">
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <div class="file-details">
                    <div class="file-name">${currentItem.fileName || currentItem.caption || 'Text File'}</div>
                    ${currentItem.fileSize ? `<div class="file-size">${this.fileService.formatFileSize(currentItem.fileSize)}</div>` : ''}
                  </div>
                </div>
                <button class="download-btn" onclick="this.dispatchEvent(new Event('download', {bubbles: true}))">
                  ⤓ Download
                </button>
              </div>
              <div class="text-file-content">
                <pre>${this.escapeHtml(currentItem.content || 'No content available')}</pre>
              </div>
            </div>
          </div>
          
          ${hasMultiple ? `
            <div class="lightbox-counter">
              ${this.currentIndex + 1} / ${this.items.length}
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="lightbox-container image-lightbox">
        <button class="lightbox-close" aria-label="Close">&times;</button>
        ${hasMultiple ? `
          <button class="lightbox-nav lightbox-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>‹</button>
          <button class="lightbox-nav lightbox-next" ${this.currentIndex === this.items.length - 1 ? 'disabled' : ''}>›</button>
        ` : ''}
        
        <div class="lightbox-content">
          <div class="image-container">
            <img src="${currentItem.url}" 
                 alt="${currentItem.caption || ''}"
                 loading="lazy"
                 class="lightbox-image">
            ${currentItem.caption ? `
              <div class="lightbox-caption">${currentItem.caption}</div>
            ` : ''}
          </div>
        </div>
        
        ${hasMultiple ? `
          <div class="lightbox-counter">
            ${this.currentIndex + 1} / ${this.items.length}
          </div>
        ` : ''}
        
        <div class="lightbox-actions">
          <button class="action-btn download-btn" onclick="this.dispatchEvent(new Event('download', {bubbles: true}))">
            ⤓ Download
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(lightbox: HTMLElement): void {
    // Close button
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => this.close());

    // Navigation buttons
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => this.previous());
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => this.next());

    // Download button
    lightbox.addEventListener('download', () => this.downloadCurrentItem());

    // Close on overlay click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) this.close();
    });

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  private destroyLightbox(): void {
    const lightbox = document.querySelector('.lightbox-overlay');
    if (lightbox) {
      document.body.removeChild(lightbox);
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  private updateLightbox(): void {
    const lightbox = document.querySelector('.lightbox-overlay');
    if (lightbox) {
      lightbox.innerHTML = this.getLightboxHTML();
      this.attachEventListeners(lightbox as HTMLElement);
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.previous();
        break;
      case 'ArrowRight':
        this.next();
        break;
    }
  }

  private downloadCurrentItem(): void {
    const currentItem = this.items[this.currentIndex];
    if (currentItem.type === 'image') {
      this.fileService.downloadFile(currentItem.url, currentItem.fileName || currentItem.caption || 'file');
    } else if (currentItem.type === 'text' && currentItem.content) {
      const blob = new Blob([currentItem.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      this.fileService.downloadFile(url, currentItem.fileName || 'file.txt');
      URL.revokeObjectURL(url);
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
