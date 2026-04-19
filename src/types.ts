export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ScanRule {
  id:          string;
  name:        string;
  severity:    Severity;
  description: string;
  pattern:     RegExp;
  message:     string;
  // If set, only applies to files matching this pattern
  filePattern?: RegExp;
}

export interface RawFinding {
  ruleId:    string;
  ruleName:  string;
  severity:  Severity;
  file:      string;
  line:      number;
  snippet:   string;
  message:   string;
}

export interface Finding extends RawFinding {
  aiExplanation:  string;
  aiFixSuggestion: string;
  aiFixCode?:     string;
}

export interface ScanSummary {
  total:    number;
  critical: number;
  high:     number;
  medium:   number;
  low:      number;
}
