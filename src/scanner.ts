import * as core   from '@actions/core';
import * as github  from '@actions/github';
import { ALL_RULES } from './rules';
import type { RawFinding } from './types';

type Octokit     = ReturnType<typeof github.getOctokit>;
type PullsFile   = { filename: string; status: string };

/**
 * Scan all changed files in the PR and return raw findings.
 */
export async function scanFiles(
  files:   PullsFile[],
  octokit: Octokit,
  context: typeof github.context,
): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];

  for (const file of files) {
    if (file.status === 'removed') continue;

    let content: string;
    try {
      content = await fetchFileContent(file.filename, octokit, context);
    } catch (err) {
      core.warning(`GuardRail: could not read ${file.filename} — ${(err as Error).message}`);
      continue;
    }

    const fileFindings = scanContent(file.filename, content);
    findings.push(...fileFindings);
  }

  return findings;
}

/**
 * Run all applicable rules against a single file's content.
 */
function scanContent(filename: string, content: string): RawFinding[] {
  const lines   = content.split('\n');
  const results: RawFinding[] = [];
  const seen    = new Set<string>(); // deduplicate same rule+line combos

  for (const rule of ALL_RULES) {
    // Skip rules that target specific file types
    if (rule.filePattern && !rule.filePattern.test(filename)) continue;

    // Reset lastIndex for global regexes
    rule.pattern.lastIndex = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // Skip comment-only lines
      if (/^\s*(?:\/\/|\/\*|\*|#)/.test(line)) continue;

      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        const key = `${rule.id}:${filename}:${lineIdx + 1}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          ruleId:   rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          file:     filename,
          line:     lineIdx + 1,
          snippet:  line.trim().slice(0, 200),
          message:  rule.message,
        });
      }
    }
  }

  return results;
}

/**
 * Fetch the raw content of a file from the PR's head commit.
 */
async function fetchFileContent(
  filename: string,
  octokit:  Octokit,
  context:  typeof github.context,
): Promise<string> {
  const ref = context.payload.pull_request?.head?.sha as string;

  const { data } = await octokit.rest.repos.getContent({
    owner: context.repo.owner,
    repo:  context.repo.repo,
    path:  filename,
    ref,
  });

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`${filename} is not a regular file`);
  }

  return Buffer.from(data.content, 'base64').toString('utf-8');
}
