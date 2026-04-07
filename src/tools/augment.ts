export type AugmentRewriteMode = "plain" | "execution-contract";

export type AugmentTaskIntent =
  | "implement"
  | "debug"
  | "refactor"
  | "review"
  | "research"
  | "docs"
  | "test-fix"
  | "explain"
  | "general";

export type PromptLeverageIntensity = "Light" | "Standard" | "Deep";

export interface PromptLeverageBlocks {
  objective: string;
  context: string;
  workStyle: string;
  toolRules: string;
  outputContract: string;
  verification: string;
  doneCriteria: string;
}

export interface AugmentPromptOptions {
  mode?: AugmentRewriteMode | "auto";
}

export interface AugmentRefinementInput {
  original: string;
  enhanced: string;
  intent: AugmentTaskIntent;
  mode: AugmentRewriteMode;
  intensity: PromptLeverageIntensity;
  blocks: PromptLeverageBlocks;
}

export interface AugmentRefinementOptions extends AugmentPromptOptions {
  refine?: (input: AugmentRefinementInput) => Promise<string | undefined>;
}

export interface AugmentPromptResult {
  original: string;
  enhanced: string;
  intent: AugmentTaskIntent;
  mode: AugmentRewriteMode;
  intensity: PromptLeverageIntensity;
  blocks: PromptLeverageBlocks;
  enhancementSource?: "deterministic" | "llm";
  fallbackReason?: string;
}

const EMPTY_PROMPT_BLOCKS: PromptLeverageBlocks = {
  objective: "",
  context: "",
  workStyle: "",
  toolRules: "",
  outputContract: "",
  verification: "",
  doneCriteria: "",
};

interface IntentRule {
  intent: AugmentTaskIntent;
  patterns: RegExp[];
}

const REVIEW_RULE: IntentRule = {
  intent: "review",
  patterns: [
    /\breview\b/,
    /\baudit\b/,
    /\bsecurity issues?\b/,
    /\bfindings?\b/,
    /\bpr\b/,
  ],
};

const DEBUG_RULE: IntentRule = {
  intent: "debug",
  patterns: [
    /\bdebug\b/,
    /\bfix\b/,
    /\bbug\b/,
    /\bbroken\b/,
    /\bfails?\b/,
    /\bfailing\b/,
    /\b404\b/,
    /\berrors?\b/,
    /\broot cause\b/,
  ],
};

const REFACTOR_RULE: IntentRule = {
  intent: "refactor",
  patterns: [
    /\brefactor\b/,
    /\bclean\s+up\b/,
    /\bcleanup\b/,
    /\bsimplif(?:y|ication)\b/,
    /\bdedupe\b/,
    /\bdeduplicate\b/,
    /\brestructure\b/,
    /\breorganize\b/,
    /\bduplication\b/,
  ],
};

const TEST_FIX_RULE: IntentRule = {
  intent: "test-fix",
  patterns: [
    /\btests?\b/,
    /\bregression\b/,
    /\bfix tests?\b/,
    /\badd tests?\b/,
    /\bupdate tests?\b/,
  ],
};

const DOCS_RULE: IntentRule = {
  intent: "docs",
  patterns: [
    /\breadme\b/i,
    /\bdocs?\b/,
    /\bdocument(?:ation)?\b/,
    /\busage guide\b/,
  ],
};

const RESEARCH_RULE: IntentRule = {
  intent: "research",
  patterns: [
    /\bresearch\b/,
    /\binvestigate\b/,
    /\blook up\b/,
    /\bcompare\b/,
    /\bevaluate\b/,
    /\bbest approach\b/,
  ],
};

const EXPLAIN_RULE: IntentRule = {
  intent: "explain",
  patterns: [
    /^explain\b/,
    /^how\b/,
    /^why\b/,
    /\bwalk me through\b/,
    /\bhelp me understand\b/,
  ],
};

const IMPLEMENT_RULE: IntentRule = {
  intent: "implement",
  patterns: [
    /\bimplement\b/,
    /\bbuild\b/,
    /\bcreate\b/,
    /\badd\b/,
    /\bintegrate\b/,
    /\bwire up\b/,
    /\bsupport\b/,
  ],
};

const STRONG_INTENT_RULES: IntentRule[] = [
  REVIEW_RULE,
  DEBUG_RULE,
  REFACTOR_RULE,
  TEST_FIX_RULE,
  DOCS_RULE,
  RESEARCH_RULE,
  EXPLAIN_RULE,
  IMPLEMENT_RULE,
];

const EXECUTION_CONTRACT_INTENTS = new Set<AugmentTaskIntent>([
  "implement",
  "debug",
  "refactor",
  "review",
  "research",
  "docs",
  "test-fix",
]);

const STANDARD_INTENTS = new Set<AugmentTaskIntent>([
  "implement",
  "debug",
  "refactor",
  "review",
  "research",
  "docs",
  "test-fix",
]);

const DEEP_SIGNALS = [
  /\bcareful\b/,
  /\bdeep\b/,
  /\bthorough\b/,
  /\bhigh.?stakes?\b/,
  /\bproduction\b/,
  /\bcritical\b/,
  /\barchitecture\b/,
  /\bsecurity\b/,
];

export function detectTaskIntent(draft: string): AugmentTaskIntent {
  const normalized = normalizeDraft(draft);
  if (!normalized) {
    return "general";
  }

  for (const rule of STRONG_INTENT_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.intent;
    }
  }

  return "general";
}

export function resolveRewriteMode(
  configuredMode: AugmentRewriteMode | "auto",
  intent: AugmentTaskIntent,
): AugmentRewriteMode {
  if (configuredMode === "plain" || configuredMode === "execution-contract") {
    return configuredMode;
  }

  return EXECUTION_CONTRACT_INTENTS.has(intent) ? "execution-contract" : "plain";
}

export function inferIntensity(
  draft: string,
  intent: AugmentTaskIntent,
): PromptLeverageIntensity {
  const normalized = normalizeDraft(draft);
  if (DEEP_SIGNALS.some((pattern) => pattern.test(normalized))) {
    return "Deep";
  }

  return STANDARD_INTENTS.has(intent) ? "Standard" : "Light";
}

export function buildPromptLeverageBlocks(
  draft: string,
  intent: AugmentTaskIntent,
  intensity: PromptLeverageIntensity,
): PromptLeverageBlocks {
  return {
    objective: buildObjective(draft),
    context: buildContext(intent),
    workStyle: buildWorkStyle(intent, intensity),
    toolRules: buildToolRules(intent),
    outputContract: buildOutputContract(intent),
    verification: buildVerification(intent),
    doneCriteria: buildDoneCriteria(intent),
  };
}

export function augmentPrompt(
  draft: string,
  options: AugmentPromptOptions = {},
): AugmentPromptResult {
  const normalized = collapseWhitespace(draft);
  if (!normalized) {
    return {
      original: "",
      enhanced: "",
      intent: "general",
      mode: resolveRewriteMode(options.mode ?? "auto", "general"),
      intensity: "Light",
      blocks: EMPTY_PROMPT_BLOCKS,
      enhancementSource: "deterministic",
    };
  }

  const intent = detectTaskIntent(normalized);
  const mode = resolveRewriteMode(options.mode ?? "auto", intent);
  const intensity = inferIntensity(normalized, intent);
  const blocks = buildPromptLeverageBlocks(normalized, intent, intensity);

  return {
    original: normalized,
    intent,
    mode,
    intensity,
    blocks,
    enhanced:
      mode === "execution-contract"
        ? formatExecutionContract(normalized, blocks)
        : formatPlainRewrite(normalized, intent, blocks.outputContract),
    enhancementSource: "deterministic",
  };
}

export async function augmentPromptWithRefinement(
  draft: string,
  options: AugmentRefinementOptions = {},
): Promise<AugmentPromptResult> {
  const deterministic = augmentPrompt(draft, options);

  if (!deterministic.original) {
    return deterministic;
  }

  if (!options.refine) {
    return deterministic;
  }

  try {
    const refined = await options.refine({
      original: deterministic.original,
      enhanced: deterministic.enhanced,
      intent: deterministic.intent,
      mode: deterministic.mode,
      intensity: deterministic.intensity,
      blocks: deterministic.blocks,
    });

    const normalized = normalizeEnhancedPrompt(refined);
    if (!normalized) {
      return {
        ...deterministic,
        fallbackReason: "LLM refinement returned empty output.",
      };
    }

    return {
      ...deterministic,
      enhanced: normalized,
      enhancementSource: "llm",
      fallbackReason: undefined,
    };
  } catch (error) {
    return {
      ...deterministic,
      fallbackReason: error instanceof Error ? error.message : "LLM refinement failed.",
    };
  }
}

export function formatExecutionContract(
  draft: string,
  blocks: PromptLeverageBlocks,
): string {
  const task = stripObjectivePrefix(blocks.objective) || toSentence(draft);

  return [
    wrapTag("task", task),
    wrapTag("context", bulletize(blocks.context)),
    wrapTag(
      "constraints",
      bulletize([blocks.workStyle, blocks.toolRules].filter(Boolean).join("\n")),
    ),
    wrapTag("verification", bulletize(blocks.verification)),
    wrapTag(
      "deliverable",
      [blocks.outputContract, blocks.doneCriteria].filter(Boolean).join("\n"),
    ),
  ].join("\n\n");
}

export function formatPlainRewrite(
  draft: string,
  intent: AugmentTaskIntent,
  outputContract: string,
): string {
  const sentence = toSentence(draft);

  if (intent === "explain") {
    return [
      sentence,
      "Keep the explanation clear and well-structured without turning it into an execution plan.",
    ].join(" ");
  }

  if (intent === "general") {
    return [
      sentence,
      "Return a clear, well-structured response matched to the task. Keep it concise unless extra detail is necessary.",
    ].join(" ");
  }

  return [sentence, outputContract].join(" ");
}

function buildObjective(draft: string): string {
  return `Complete this task: ${toSentence(draft)}`;
}

function buildContext(intent: AugmentTaskIntent): string {
  switch (intent) {
    case "implement":
      return [
        "Review the current code path and identify the narrowest safe integration point.",
        "Preserve existing behavior outside the requested change.",
      ].join("\n");
    case "debug":
      return [
        "Reproduce the issue first and confirm the failing path before editing.",
        "Inspect the code and data flow around the suspected failure point.",
      ].join("\n");
    case "refactor":
      return [
        "Map the current structure before extracting or consolidating logic.",
        "Identify duplication and branching that can be simplified without changing behavior.",
      ].join("\n");
    case "review":
      return [
        "Read enough surrounding context to understand intent before critiquing.",
        "Focus on confirmed issues first, then call out plausible risks separately.",
      ].join("\n");
    case "research":
      return [
        "Gather evidence from authoritative sources before concluding.",
        "Preserve uncertainty explicitly when the evidence is incomplete or conflicting.",
      ].join("\n");
    case "docs":
      return [
        "Read the current behavior and documentation surface before rewriting anything.",
        "Keep commands, examples, and terminology aligned with the actual system.",
      ].join("\n");
    case "test-fix":
      return [
        "Decide whether the test, the implementation, or both are wrong before changing anything.",
        "Keep regression coverage close to the observed failure mode.",
      ].join("\n");
    case "explain":
      return [
        "Preserve the original question and answer it directly.",
        "Use structure only when it improves clarity.",
      ].join("\n");
    case "general":
    default:
      return [
        "Preserve the user’s intent and constraints.",
        "Add only enough structure to improve clarity and usefulness.",
      ].join("\n");
  }
}

function buildWorkStyle(
  intent: AugmentTaskIntent,
  intensity: PromptLeverageIntensity,
): string {
  const guidance: string[] = [];

  switch (intent) {
    case "implement":
      guidance.push(
        "Understand the problem broadly enough to avoid narrow mistakes, then go deep where the risk is highest.",
      );
      guidance.push("Use first-principles reasoning before proposing changes.");
      break;
    case "debug":
      guidance.push("Inspect before editing and find the root cause, not just the symptom.");
      break;
    case "refactor":
      guidance.push("Preserve behavior while reducing duplication, branching, or complexity.");
      break;
    case "review":
      guidance.push("Distinguish confirmed issues from plausible risks and order them by impact.");
      break;
    case "research":
      guidance.push("Synthesize evidence into a recommendation instead of a raw note dump.");
      break;
    case "docs":
      guidance.push("Optimize for accuracy, clarity, and examples that match real behavior.");
      break;
    case "test-fix":
      guidance.push("Keep changes focused on the failing behavior and preserve useful coverage.");
      break;
    case "explain":
      guidance.push("Stay explanatory and avoid turning the answer into an execution plan.");
      break;
    case "general":
      guidance.push("Be specific, structured, and proportionate to the request.");
      break;
  }

  if (intensity === "Deep") {
    guidance.push("Review the result once with fresh eyes before finalizing.");
  }

  if (intensity === "Standard") {
    guidance.push("Cover the main edge cases before finalizing.");
  }

  return guidance.join("\n");
}

function buildToolRules(intent: AugmentTaskIntent): string {
  switch (intent) {
    case "implement":
    case "refactor":
    case "debug":
    case "test-fix":
      return "Inspect the relevant files and dependencies first. Validate the final change with the narrowest useful checks before broadening scope.";
    case "research":
      return "Retrieve evidence from reliable sources before concluding. Do not guess facts that can be checked.";
    case "review":
      return "Read enough surrounding context to understand intent before critiquing. Distinguish confirmed issues from plausible risks.";
    case "docs":
      return "Read the current documentation and runtime behavior before rewriting. Keep examples and commands accurate.";
    case "explain":
    case "general":
    default:
      return "Use extra tools or context only when they materially improve correctness or completeness.";
  }
}

function buildOutputContract(intent: AugmentTaskIntent): string {
  switch (intent) {
    case "implement":
    case "refactor":
    case "test-fix":
      return "Return a practical execution result: concise summary, concrete changes, validation notes, and any remaining risks.";
    case "debug":
      return "Return a diagnosis with root cause, the fix, validation steps, and regression notes.";
    case "research":
      return "Return a structured synthesis with key findings, supporting evidence, and a concise recommendation.";
    case "docs":
      return "Return polished documentation aligned with current runtime behavior and verified examples.";
    case "review":
      return "Return findings grouped by severity or importance, explain why each matters, and suggest the smallest credible next step.";
    case "explain":
      return "Return a clear, well-structured explanation matched to the question.";
    case "general":
    default:
      return "Return a clear, well-structured response matched to the task.";
  }
}

function buildVerification(intent: AugmentTaskIntent): string {
  switch (intent) {
    case "implement":
    case "refactor":
    case "test-fix":
      return [
        "Check correctness, completeness, and edge cases.",
        "Run relevant checks such as tests, lint, or typecheck when appropriate.",
      ].join("\n");
    case "debug":
      return [
        "Check correctness, completeness, and edge cases.",
        "Confirm the root cause is addressed and add regression coverage when appropriate.",
      ].join("\n");
    case "review":
      return [
        "Check correctness and completeness.",
        "Avoid speculative redesign unless it is necessary to explain a risk.",
      ].join("\n");
    case "docs":
      return [
        "Check correctness and completeness.",
        "Verify commands, examples, and terminology against the current behavior.",
      ].join("\n");
    case "research":
      return [
        "Check correctness, completeness, and edge cases.",
        "Call out uncertainty explicitly when evidence is incomplete or conflicting.",
      ].join("\n");
    case "explain":
    case "general":
    default:
      return [
        "Check correctness, completeness, and edge cases.",
        "Improve obvious weaknesses if a better phrasing is available within scope.",
      ].join("\n");
  }
}

function buildDoneCriteria(intent: AugmentTaskIntent): string {
  switch (intent) {
    case "implement":
    case "refactor":
    case "test-fix":
      return "Stop only when the change is complete, the important checks pass, and there are no known regressions.";
    case "debug":
      return "Stop only when the root cause is confirmed fixed and regression coverage is in place when appropriate.";
    case "review":
      return "Stop only when the findings are clear, prioritized, and actionable.";
    case "research":
      return "Stop only when the synthesis is grounded in evidence and ends with a recommended path.";
    case "docs":
      return "Stop only when the documentation matches the current behavior and examples are accurate.";
    case "explain":
      return "Stop only when the explanation clearly answers the question.";
    case "general":
    default:
      return "Stop only when the response satisfies the task and matches the requested format.";
  }
}

function bulletize(text: string): string {
  return text
    .split("\n")
    .map((line) => collapseWhitespace(line))
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

function wrapTag(tagName: string, content: string): string {
  return `<${tagName}>\n${content}\n</${tagName}>`;
}

function stripObjectivePrefix(objective: string): string {
  return objective.replace(/^Complete this task:\s*/i, "").trim();
}

function normalizeDraft(draft: string): string {
  return collapseWhitespace(draft).toLowerCase();
}

function normalizeEnhancedPrompt(value: string | undefined): string {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}

function collapseWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function toSentence(value: string): string {
  const normalized = collapseWhitespace(value);
  if (!normalized) {
    return "";
  }

  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  if (/[.!?]$/.test(capitalized)) {
    return capitalized;
  }

  return `${capitalized}.`;
}
