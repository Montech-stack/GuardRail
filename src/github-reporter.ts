import * as github              from '@actions/github';
import type { Finding, Severity, ScanSummary } from './types';

type Octokit = ReturnType<typeof github.getOctokit>;

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🔵',
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'CRITICAL',
  high:     'HIGH',
  medium:   'MEDIUM',
  low:      'LOW',
};

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

/**
 * Post or update a GuardRail summary comment on the PR.
 * If a previous GuardRail comment exists, it gets replaced (no spam).
 */
export async function postPRComment(
  octokit:           Octokit,
  context:           typeof github.context,
  prNumber:          number,
  findings:          Finding[],
  severityThreshold: string,
): Promise<void> {
  const filtered = filterBySeverity(findings, severityThreshold as Severity);
  const body     = buildComment(filtered, findings.length);

  // Find existing GuardRail comment to update instead of spamming
  const { data: comments } = await octokit.rest.issues.listComments({
    owner:      context.repo.owner,
    repo:       context.repo.repo,
    issue_number: prNumber,
  });

  const existing = comments.find(c =>
    c.body?.includes('<!-- guardrail-ai-comment -->') &&
    c.user?.type === 'Bot'
  );

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner:      context.repo.owner,
      repo:       context.repo.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner:        context.repo.owner,
      repo:         context.repo.repo,
      issue_number: prNumber,
      body,
    });
  }
}

function filterBySeverity(findings: Finding[], threshold: Severity): Finding[] {
  const thresholdIdx = SEVERITY_ORDER.indexOf(threshold);
  return findings.filter(f => SEVERITY_ORDER.indexOf(f.severity) <= thresholdIdx);
}

function buildSummary(findings: Finding[]): ScanSummary {
  return {
    total:    findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high:     findings.filter(f => f.severity === 'high').length,
    medium:   findings.filter(f => f.severity === 'medium').length,
    low:      findings.filter(f => f.severity === 'low').length,
  };
}

function buildComment(findings: Finding[], totalBeforeFilter: number): string {
  const summary = buildSummary(findings);
  const lines: string[] = [];

  lines.push('<!-- guardrail-ai-comment -->');
  lines.push('## 🛡️ GuardRail AI Security Scan');
  lines.push('');

  if (findings.length === 0) {
    lines.push('✅ **No security issues found in this PR.** Nice work.');
    lines.push('');
    lines.push('---');
    lines.push('*Powered by [GuardRail AI](https://github.com/montech-stack/guardrail) · Scanned by AI security rules for Next.js*');
    return lines.join('\n');
  }

  // Summary badge line
  const badges = SEVERITY_ORDER
    .filter(s => summary[s] > 0)
    .map(s => `${SEVERITY_EMOJI[s]} **${summary[s]} ${SEVERITY_LABEL[s]}**`)
    .join(' · ');

  lines.push(`Found **${summary.total} issue${summary.total !== 1 ? 's' : ''}** in this PR — ${badges}`);
  lines.push('');

  if (summary.critical > 0) {
    lines.push('> ⚠️ **This PR contains critical security issues. Please resolve before merging.**');
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Group findings by severity
  for (const severity of SEVERITY_ORDER) {
    const group = findings.filter(f => f.severity === severity);
    if (group.length === 0) continue;

    for (const finding of group) {
      lines.push(buildFindingBlock(finding));
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('<details>');
  lines.push('<summary>📋 About GuardRail AI</summary>');
  lines.push('');
  lines.push('GuardRail AI scans your Next.js codebase for security vulnerabilities in every PR. ');
  lines.push('Rules cover: hardcoded secrets, XSS, SQL/command injection, missing auth, and sensitive data exposure.');
  lines.push('');
  lines.push('AI explanations and fix suggestions are powered by Google Gemini.');
  lines.push('');
  lines.push('**False positive?** Add `// guardrail-ignore` to the line to suppress it.');
  lines.push('</details>');
  lines.push('');
  lines.push('*Powered by [GuardRail AI](https://github.com/montech-stack/guardrail) · Built by [@montech-stack](https://github.com/montech-stack)*');

  return lines.join('\n');
}

function buildFindingBlock(f: Finding): string {
  const lines: string[] = [];
  const emoji = SEVERITY_EMOJI[f.severity];
  const label = SEVERITY_LABEL[f.severity];

  lines.push(`### ${emoji} ${label} — ${f.ruleName}`);
  lines.push('');
  lines.push(`**File:** \`${f.file}\` · **Line ${f.line}**`);
  lines.push('');
  lines.push('```typescript');
  lines.push(f.snippet);
  lines.push('```');
  lines.push('');
  lines.push(`**What's wrong:** ${f.aiExplanation}`);
  lines.push('');
  lines.push(`**How to fix:** ${f.aiFixSuggestion}`);

  if (f.aiFixCode) {
    lines.push('');
    lines.push('```typescript');
    lines.push(f.aiFixCode);
    lines.push('```');
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}
