import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HtmlValidatorService {

  validateXHTML(html: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!html) {
      return { isValid: true, errors: [] };
    }

    const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];
    const selfClosingRegex = new RegExp(`<(${selfClosingTags.join('|')})[^>]*>(?!\\s*</\\1>)`, 'gi');
    const selfClosingMatches = html.match(selfClosingRegex);
    if (selfClosingMatches) {
      selfClosingMatches.forEach(tag => {
        errors.push(`Self-closing tag ${tag} must end with />`);
      });
    }

    const tagStack: string[] = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (selfClosingTags.includes(tagName) || fullTag.endsWith('/>')) {
        continue;
      }

      if (fullTag.startsWith('</')) {
        if (tagStack.length === 0) {
          errors.push(`Extra closing tag </${tagName}>`);
        } else {
          const lastTag = tagStack.pop();
          if (lastTag !== tagName) {
            errors.push(`Tag mismatch: expected </${lastTag}>, but found </${tagName}>`);
            if (lastTag) tagStack.push(lastTag);
          }
        }
      } else {
        tagStack.push(tagName);
      }
    }

    tagStack.forEach(tagName => {
      errors.push(`Unclosed tag <${tagName}>`);
    });

    const attrRegex = /<[a-z][a-z0-9]*([^>]*)\/?>/gi;
    while ((match = attrRegex.exec(html)) !== null) {
      const attributes = match[1];

      const unquotedAttrRegex = /\s+([a-z-]+)=([^"'\s][^>\s]*)/gi;
      let attrMatch;
      while ((attrMatch = unquotedAttrRegex.exec(attributes)) !== null) {
        errors.push(`Attribute ${attrMatch[1]} must be in quotes`);
      }

      if (match[0].includes('<a') && !match[0].includes('href=')) {
        errors.push('Tag <a> must contain href attribute');
      }
    }

    const upperCaseTags = html.match(/<[A-Z]/g);
    if (upperCaseTags) {
      errors.push('Tags must be in lowercase');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  autoFixXHTML(html: string): string {
    if (!html) return '';

    let fixedHtml = html;

    const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];
    selfClosingTags.forEach(tag => {
      const regex = new RegExp(`<${tag}([^>]*)(?<!\\/)>`, 'gi');
      fixedHtml = fixedHtml.replace(regex, `<${tag}$1 />`);
    });

    fixedHtml = fixedHtml.replace(/<(\/?)([A-Z][A-Z0-9]*)/g, (match, slash, tagName) => {
      return `<${slash}${tagName.toLowerCase()}`;
    });

    fixedHtml = fixedHtml.replace(/(\s+[a-z-]+)=([^"'\s][^>\s]*)/gi, '$1="$2"');

    return fixedHtml;
  }

  validateTag(tagName: string, content: string): { isValid: boolean; error?: string } {
    const testHtml = `<${tagName}>${content}</${tagName}>`;
    const result = this.validateXHTML(testHtml);

    return {
      isValid: result.isValid,
      error: result.errors[0]
    };
  }
}
