import * as core   from '@actions/core';
import * as github  from '@actions/github';
import { scanFiles }      from './scanner';
import { analyzeWithAI }  from './ai-analyzer';
import { postPRComment }  from './github-reporter';
import type { Severity }  from './types';

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

async function run(): Promise<void> {
  try {
    // ── Inputs ──────────────────────────────────────────────────────────────
    const geminiKey        = core.getInput('gemini-api-key', { required: true });
    const githubToken      = core.getInput('github-token',   { required: true });
    const severityThreshold = (core.getInput('severity-threshold') || 'low') as Severity;
    const failOnSeverity    = (core.getInput('fail-on-severity')   || 'critical') as Severity | 'never';

    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    // ── Validate event ───────────────────────────────────────────────────────
    if (context.eventName !== 'pull_request') {
      core.warning('GuardRail only runs on pull_request events. Skipping.');
      return;
    }

    const prNumber = context.payload.pull_request?.number;
    if (!prNumber) {
      core.setFailed('GuardRail: could not determine PR number');
      return;
    }

    core.info(`\n🛡️  GuardRail AI — scanning PR #${prNumber}`);

    // ── Get changed files ────────────────────────────────────────────────────
    const { data: allFiles } = await octokit.rest.pulls.listFiles({
      owner:        context.repo.owner,
      repo:         context.repo.repo,
      pull_number:  prNumber,
      per_page:     100,
    });

    const targetFiles = allFiles.filter(f =>
      /\.(ts|tsx|js|jsx)$/.test(f.filename) &&
      f.status !== 'removed'
    );

    core.info(`   Changed files: ${allFiles.length} total, ${targetFiles.length} JS/TS`);

    if (targetFiles.length === 0) {
      core.info('   No JavaScript/TypeScript files changed — nothing to scan.');
      await postPRComment(octokit, context, prNumber, [], severityThreshold);
      return;
    }

    // ── Scan ─────────────────────────────────────────────────────────────────
    core.info(`   Running security rules...`);
    const rawFindings = await scanFiles(targetFiles, octokit, context);
    core.info(`   Found ${rawFindings.length} potential issue(s)`);

    // ── AI analysis ──────────────────────────────────────────────────────────
    let findings = rawFindings.length > 0
      ? await analyzeWithAI(rawFindings, geminiKey)
      : [];

    core.info(`   AI analysis complete`);

    // ── Set outputs ──────────────────────────────────────────────────────────
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high     = findings.filter(f => f.severity === 'high').length;
    core.setOutput('issues-found',  String(findings.length));
    core.setOutput('critical-count', String(critical));
    core.setOutput('high-count',     String(high));

    // ── Post PR comment ──────────────────────────────────────────────────────
    await postPRComment(octokit, context, prNumber, findings, severityThreshold);
    core.info(`   PR comment posted`);

    // ── Fail check ───────────────────────────────────────────────────────────
    if (failOnSeverity !== 'never' && findings.length > 0) {
      const failThresholdIdx = SEVERITY_ORDER.indexOf(failOnSeverity);
      const blocking = findings.filter(f =>
        SEVERITY_ORDER.indexOf(f.severity) <= failThresholdIdx
      );
      if (blocking.length > 0) {
        core.setFailed(
          `GuardRail found ${blocking.length} issue(s) at or above "${failOnSeverity}" severity. ` +
          `See PR comment for details.`
        );
        return;
      }
    }

    core.info(`\n✅ GuardRail scan complete — ${findings.length} issue(s) found\n`);

  } catch (error) {
    core.setFailed(`GuardRail failed: ${(error as Error).message}`);
  }
}

run();
