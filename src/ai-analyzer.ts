import * as core                        from '@actions/core';
import { GoogleGenerativeAI }          from '@google/generative-ai';
import type { RawFinding, Finding }    from './types';

const MODEL = 'gemini-1.5-flash';

/**
 * Enrich raw scanner findings with AI-generated explanations and fix suggestions.
 * Batches all findings into a single Gemini call to minimize latency and cost.
 */
export async function analyzeWithAI(
  findings: RawFinding[],
  apiKey:   string,
): Promise<Finding[]> {
  if (findings.length === 0) return [];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = buildPrompt(findings);

  try {
    const result   = await model.generateContent(prompt);
    const response = result.response.text();
    return parseAIResponse(findings, response);
  } catch (err) {
    core.warning(`GuardRail AI analysis failed: ${(err as Error).message}. Using basic findings.`);
    // Fall back to findings without AI enrichment
    return findings.map(f => ({
      ...f,
      aiExplanation:   f.message,
      aiFixSuggestion: 'See OWASP guidelines for remediation.',
    }));
  }
}

function buildPrompt(findings: RawFinding[]): string {
  const findingsList = findings.map((f, i) =>
    `[${i + 1}] Rule: ${f.ruleName} | Severity: ${f.severity.toUpperCase()}
File: ${f.file}:${f.line}
Code: ${f.snippet}
Issue: ${f.message}`
  ).join('\n\n');

  return `You are GuardRail AI, an expert security engineer reviewing a Next.js/TypeScript codebase.

Analyze the following ${findings.length} security finding(s) and for each one provide:
1. A plain-English explanation of why this is dangerous (2-3 sentences, developer-friendly)
2. A specific, actionable fix suggestion for Next.js/TypeScript
3. A short code example showing the fix (if applicable)

FINDINGS:
${findingsList}

Respond in this exact JSON format (array, one object per finding in the same order):
[
  {
    "index": 1,
    "explanation": "...",
    "fix": "...",
    "fixCode": "// optional short code example"
  }
]

Be concise, direct, and practical. No generic advice — be specific to Next.js and TypeScript.`;
}

function parseAIResponse(findings: RawFinding[], response: string): Finding[] {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                      response.match(/(\[[\s\S]*\])/);

    const jsonStr  = jsonMatch ? jsonMatch[1] : response;
    const parsed   = JSON.parse(jsonStr) as Array<{
      index:       number;
      explanation: string;
      fix:         string;
      fixCode?:    string;
    }>;

    return findings.map((finding, i) => {
      const ai = parsed.find(p => p.index === i + 1) ?? parsed[i];
      return {
        ...finding,
        aiExplanation:   ai?.explanation ?? finding.message,
        aiFixSuggestion: ai?.fix         ?? 'See OWASP guidelines for remediation.',
        aiFixCode:       ai?.fixCode,
      };
    });
  } catch {
    core.warning('GuardRail: could not parse AI response — using raw findings');
    return findings.map(f => ({
      ...f,
      aiExplanation:   f.message,
      aiFixSuggestion: 'See OWASP guidelines for remediation.',
    }));
  }
}
