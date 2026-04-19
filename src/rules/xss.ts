import type { ScanRule } from '../types';

export const xssRules: ScanRule[] = [
  {
    id: 'dangerous-inner-html',
    name: 'dangerouslySetInnerHTML Usage',
    severity: 'high',
    description: 'React dangerouslySetInnerHTML can enable XSS if content is not sanitized',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    message: 'dangerouslySetInnerHTML detected. Ensure content is sanitized with DOMPurify before rendering.',
    filePattern: /\.(tsx|jsx)$/,
  },
  {
    id: 'innerhtml-assignment',
    name: 'Direct innerHTML Assignment',
    severity: 'high',
    description: 'Direct innerHTML assignment can enable XSS attacks',
    pattern: /\.innerHTML\s*=/g,
    message: 'Direct innerHTML assignment found. Use textContent for plain text or sanitize HTML with DOMPurify.',
    filePattern: /\.(ts|tsx|js|jsx)$/,
  },
  {
    id: 'document-write',
    name: 'document.write Usage',
    severity: 'high',
    description: 'document.write can be exploited for XSS attacks',
    pattern: /document\.write\s*\(/g,
    message: 'document.write() is dangerous and can enable XSS. Use DOM manipulation methods instead.',
  },
  {
    id: 'eval-usage',
    name: 'eval() Usage',
    severity: 'critical',
    description: 'eval() executes arbitrary code and is a serious security risk',
    pattern: /(?<![a-zA-Z0-9_$])eval\s*\(/g,
    message: 'eval() found. This executes arbitrary code and can lead to RCE. Refactor to avoid eval entirely.',
  },
  {
    id: 'new-function',
    name: 'new Function() Usage',
    severity: 'high',
    description: 'new Function() is similar to eval and can execute arbitrary code',
    pattern: /new\s+Function\s*\(/g,
    message: 'new Function() is equivalent to eval and should be avoided. Refactor to use static functions.',
  },
  {
    id: 'href-javascript',
    name: 'JavaScript Protocol in href',
    severity: 'high',
    description: 'Using javascript: in href attributes enables XSS',
    pattern: /href\s*=\s*['"`]\s*javascript:/gi,
    message: 'javascript: protocol in href is an XSS vector. Validate and sanitize all URL inputs.',
  },
];
