import type { ScanRule } from '../types';

export const secretsRules: ScanRule[] = [
  {
    id: 'hardcoded-api-key',
    name: 'Hardcoded API Key',
    severity: 'critical',
    description: 'An API key appears to be hardcoded in source code',
    pattern: /(?:api[_-]?key|apikey|api_secret)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"`]/gi,
    message: 'Hardcoded API key detected. This will be exposed in your git history permanently.',
  },
  {
    id: 'hardcoded-password',
    name: 'Hardcoded Password',
    severity: 'critical',
    description: 'A password appears to be hardcoded in source code',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`]([^'"`\s]{8,})['"`]/gi,
    message: 'Hardcoded password detected. Move this to an environment variable immediately.',
  },
  {
    id: 'hardcoded-secret',
    name: 'Hardcoded Secret/Token',
    severity: 'critical',
    description: 'A secret or token appears to be hardcoded in source code',
    pattern: /(?:secret|token|auth_token|access_token|private_key)\s*[:=]\s*['"`]([a-zA-Z0-9_\-\.]{20,})['"`]/gi,
    message: 'Hardcoded secret or token detected. Use environment variables instead.',
  },
  {
    id: 'exposed-connection-string',
    name: 'Exposed Database Connection String',
    severity: 'critical',
    description: 'A database connection string with credentials is hardcoded',
    pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@[^\s'"`,]+/gi,
    message: 'Database connection string with credentials exposed. Move to environment variables.',
  },
  {
    id: 'aws-access-key',
    name: 'Hardcoded AWS Access Key',
    severity: 'critical',
    description: 'An AWS access key ID is hardcoded in source code',
    pattern: /AKIA[0-9A-Z]{16}/g,
    message: 'AWS Access Key ID found in source code. Revoke this key immediately and use IAM roles or environment variables.',
  },
  {
    id: 'private-key-in-code',
    name: 'Private Key in Source Code',
    severity: 'critical',
    description: 'A private key (PEM format) is hardcoded in source code',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    message: 'Private key found in source code. Remove immediately and rotate the key.',
  },
];
