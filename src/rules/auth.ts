import type { ScanRule } from '../types';

export const authRules: ScanRule[] = [
  {
    id: 'api-route-no-auth',
    name: 'Next.js API Route Without Auth Check',
    severity: 'high',
    description: 'A Next.js API route handler does not appear to check authentication',
    pattern: /export\s+(?:default\s+)?(?:async\s+)?function\s+(?:handler|GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{(?:(?!(?:getSession|getServerSession|auth\(\)|verifyToken|checkAuth|requireAuth|session|token|jwt|bearer|authorize|middleware)).)*$/gims,
    message: 'API route may be missing authentication. Ensure protected routes verify session/token before processing.',
    filePattern: /(?:api|app\/api).*\.(ts|js)$/,
  },
  {
    id: 'jwt-none-algorithm',
    name: 'JWT "none" Algorithm Vulnerability',
    severity: 'critical',
    description: 'Accepting the "none" algorithm in JWT allows attackers to forge tokens',
    pattern: /algorithms\s*:\s*\[.*['"`]none['"`]/g,
    message: 'JWT "none" algorithm accepted. This allows attackers to bypass signature verification and forge tokens.',
  },
  {
    id: 'jwt-secret-hardcoded',
    name: 'Hardcoded JWT Secret',
    severity: 'critical',
    description: 'A JWT signing secret is hardcoded in source code',
    pattern: /(?:jwt\.sign|sign\(|verify\().*,\s*['"`][a-zA-Z0-9_\-]{8,}['"`]/g,
    message: 'Hardcoded JWT secret detected. Use a strong secret from environment variables.',
  },
  {
    id: 'cors-wildcard',
    name: 'Permissive CORS — Wildcard Origin',
    severity: 'medium',
    description: 'Setting Access-Control-Allow-Origin to * allows any domain to make requests',
    pattern: /Access-Control-Allow-Origin['"]\s*:\s*['"`]\*['"`]/g,
    message: 'Wildcard CORS origin (*) detected. Restrict to specific trusted origins in production.',
  },
  {
    id: 'missing-csrf-protection',
    name: 'State-Changing Request Without CSRF Protection',
    severity: 'medium',
    description: 'POST/PUT/DELETE handlers may lack CSRF protection',
    pattern: /export\s+(?:async\s+)?function\s+(?:POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{(?:(?!(?:csrf|token|origin|referer|X-Requested-With)).)*?return\s+(?:NextResponse|Response)/gims,
    message: 'State-changing API handler may lack CSRF protection. Verify CSRF tokens or use SameSite cookies.',
    filePattern: /app\/api.*route\.(ts|js)$/,
  },
  {
    id: 'insecure-cookie',
    name: 'Cookie Set Without Secure/HttpOnly Flags',
    severity: 'medium',
    description: 'Cookies set without Secure and HttpOnly flags are vulnerable to theft',
    pattern: /(?:setCookie|set-cookie|cookies\(\)\.set)\s*\((?:(?!(?:httpOnly|secure|sameSite)).)*\)/gi,
    message: 'Cookie may be missing Secure and HttpOnly flags. Add { httpOnly: true, secure: true, sameSite: "strict" }.',
  },
];
