import { secretsRules }   from './secrets';
import { xssRules }        from './xss';
import { injectionRules }  from './injection';
import { authRules }       from './auth';
import { exposureRules }   from './exposure';
import type { ScanRule }   from '../types';

export const ALL_RULES: ScanRule[] = [
  ...secretsRules,
  ...xssRules,
  ...injectionRules,
  ...authRules,
  ...exposureRules,
];

export { secretsRules, xssRules, injectionRules, authRules, exposureRules };
