import type {
  TuiPluginApi,
  TuiPluginModule,
  TuiPromptInfo,
  TuiPromptRef,
} from "@opencode-ai/plugin/tui";

import { augmentPromptWithRefinement } from "./tools/augment";

type DeliveryMode = "replaced" | "injected" | "ready";

type PromptRefStore = {
  home?: TuiPromptRef;
  sessions: Map<string, TuiPromptRef>;
};

type AugmentResult = Awaited<ReturnType<typeof augmentPromptWithRefinement>>;

const PROMPT_LOADING_TEXT = "⏳ Enhancing prompt…";

function buildRefinementPrompt(input: {
  enhanced: string;
  intent: string;
  mode: string;
  intensity: string;
}): string {
  return [
    "You are refining an already-structured prompt for OpenCode.",
    `Intent: ${input.intent}`,
    `Rewrite mode: ${input.mode}`,
    `Effort: ${input.intensity}`,
    "Preserve the original user request exactly.",
    "Keep the output as a single prompt only.",
    "Do not add commentary, preambles, markdown fences, or explanations.",
    "If the prompt is already strong, return a minimally polished version.",
    "Return only the final rewritten prompt.",
    "",
    input.enhanced,
  ].join("\n");
}

function clonePromptInfo(prompt: TuiPromptInfo): TuiPromptInfo {
  return {
    input: prompt.input,
    mode: prompt.mode,
    parts: [...prompt.parts],
  };
}

function updatePromptRef(promptRef: TuiPromptRef, prompt: TuiPromptInfo): void {
  promptRef.set(clonePromptInfo(prompt));
}

function getActivePromptRef(api: TuiPluginApi, promptRefs: PromptRefStore): TuiPromptRef | undefined {
  const currentRoute = api.route.current;

  if (currentRoute.name === "session") {
    const sessionID = currentRoute.params?.sessionID;
    return typeof sessionID === "string"
      ? promptRefs.sessions.get(sessionID)
      : undefined;
  }

  return promptRefs.home;
}

function registerPromptSlots(api: TuiPluginApi, promptRefs: PromptRefStore): void {
  const registerSlots = (api as TuiPluginApi & {
    slots?: { register?: (plugin: { slots: Record<string, unknown> }) => string };
  }).slots?.register;

  if (typeof registerSlots !== "function") {
    return;
  }

  registerSlots({
    slots: {
      home_prompt: (_ctx: unknown, props: {
        workspace_id?: string;
        ref?: (ref: TuiPromptRef | undefined) => void;
      }) => api.ui.Prompt({
        workspaceID: props.workspace_id,
        ref: (ref) => {
          promptRefs.home = ref;
          props.ref?.(ref);
        },
      }),
      session_prompt: (_ctx: unknown, props: {
        session_id: string;
        visible?: boolean;
        disabled?: boolean;
        on_submit?: () => void;
        ref?: (ref: TuiPromptRef | undefined) => void;
      }) => api.ui.Prompt({
        sessionID: props.session_id,
        visible: props.visible,
        disabled: props.disabled,
        onSubmit: props.on_submit,
        ref: (ref) => {
          if (ref) {
            promptRefs.sessions.set(props.session_id, ref);
          } else {
            promptRefs.sessions.delete(props.session_id);
          }

          props.ref?.(ref);
        },
      }),
    },
  });
}

function showAugmentResultToast(api: TuiPluginApi, deliveryMode: DeliveryMode, result: AugmentResult): void {
  const source = result.enhancementSource ?? "deterministic";
  const successPrefix = deliveryMode === "replaced"
    ? "Replaced"
    : deliveryMode === "injected"
      ? "Injected"
      : "Prepared";

  if (result.fallbackReason) {
    api.ui.toast({
      variant: "warning",
      title: "CliKit Augment",
      message: `${successPrefix} deterministic fallback. ${result.fallbackReason}`,
      duration: 3500,
    });
    return;
  }

  api.ui.toast({
    variant: "success",
    title: "CliKit Augment",
    message: deliveryMode === "replaced"
      ? `Enhanced prompt replaced in composer (${source}).`
      : deliveryMode === "injected"
        ? `Enhanced prompt inserted (${source}).`
        : `Enhanced prompt ready (${source}).`,
    duration: 3500,
  });
}

function showAugmentErrorToast(api: TuiPluginApi, error: unknown): void {
  const message = error instanceof Error ? error.message : "Prompt enhancement failed.";
  api.ui.toast({
    variant: "error",
    title: "CliKit Augment",
    message,
    duration: 3500,
  });
}

async function enhancePromptDraft(api: TuiPluginApi, draft: string): Promise<AugmentResult> {
  const directory = api.state.path.directory;
  const workspace = api.workspace.current();
  const client = api.scopedClient(workspace);

  return augmentPromptWithRefinement(draft, {
    mode: "auto",
    refine: async ({ enhanced, mode, intent, intensity }) => {
      const createResult = await client.session.create({
        directory,
        workspace,
        title: `augment:${intent}`,
      });

      if (createResult.error || !createResult.data?.id) {
        throw new Error("Unable to create OpenCode session for prompt enhancement.");
      }

      const sessionID = createResult.data.id;

      try {
        const promptResult = await client.session.prompt({
          sessionID,
          directory,
          workspace,
          parts: [
            {
              type: "text",
              text: buildRefinementPrompt({
                enhanced,
                intent,
                mode,
                intensity,
              }),
            },
          ],
        });

        if (promptResult.error) {
          throw new Error("OpenCode prompt enhancement request failed.");
        }

        const textPart = promptResult.data?.parts?.find((part) => part.type === "text");
        if (!textPart || !("text" in textPart) || typeof textPart.text !== "string") {
          throw new Error("OpenCode prompt enhancement returned no text output.");
        }

        return textPart.text;
      } finally {
        void client.session.delete({
          sessionID,
          directory,
          workspace,
        }).catch(() => undefined);
      }
    },
  });
}

async function injectPrompt(api: TuiPluginApi, prompt: string): Promise<boolean> {
  const directory = api.state.path.directory;
  const workspace = api.workspace.current();
  const client = api.scopedClient(workspace);

  try {
    await client.tui.clearPrompt?.({ directory, workspace });
    await client.tui.appendPrompt({ directory, workspace, text: prompt });
    return true;
  } catch {
    return false;
  }
}

async function deliverPrompt(api: TuiPluginApi, prompt: string): Promise<DeliveryMode> {
  if (await injectPrompt(api, prompt)) {
    return "injected";
  }

  return "ready";
}

function openAugmentDialog(api: TuiPluginApi, initialValue?: string): void {
  api.ui.dialog.replace(() => api.ui.DialogPrompt({
    title: "CliKit Augment",
    placeholder: "Paste or type the prompt draft to enhance",
    value: initialValue,
    onConfirm: async (value) => {
      await runDialogAugment(api, value);
    },
    onCancel: () => {
      api.ui.dialog.clear();
    },
  }));
}

async function runDialogAugment(api: TuiPluginApi, draft: string): Promise<void> {
  const normalized = draft.trim();
  if (!normalized) {
    api.ui.toast({
      variant: "error",
      title: "CliKit Augment",
      message: "Prompt is required.",
      duration: 2500,
    });
    return;
  }

  api.ui.toast({
    variant: "info",
    title: "CliKit Augment",
    message: "Enhancing prompt.",
    duration: 2000,
  });

  const directory = api.state.path.directory;
  const workspace = api.workspace.current();
  const client = api.scopedClient(workspace);

  try {
    const result = await enhancePromptDraft(api, normalized);

    const deliveryMode = await deliverPrompt(api, result.enhanced);

    api.ui.dialog.clear();

    showAugmentResultToast(api, deliveryMode, result);
  } catch (error) {
    showAugmentErrorToast(api, error);
  }
}

async function runComposerAugment(api: TuiPluginApi, promptRef: TuiPromptRef): Promise<void> {
  const originalPrompt = clonePromptInfo(promptRef.current);
  const normalized = originalPrompt.input.trim();

  if (!normalized) {
    api.ui.toast({
      variant: "error",
      title: "CliKit Augment",
      message: "Prompt is required.",
      duration: 2500,
    });
    return;
  }

  try {
    promptRef.blur();
    updatePromptRef(promptRef, {
      ...originalPrompt,
      input: PROMPT_LOADING_TEXT,
    });
  } catch {
    openAugmentDialog(api, originalPrompt.input);
    return;
  }

  try {
    const result = await enhancePromptDraft(api, normalized);
    updatePromptRef(promptRef, {
      ...originalPrompt,
      input: result.enhanced,
    });
    promptRef.focus();
    showAugmentResultToast(api, "replaced", result);
  } catch (error) {
    try {
      updatePromptRef(promptRef, originalPrompt);
      promptRef.focus();
    } catch {
      // Ignore prompt restoration failures and still report the error.
    }

    showAugmentErrorToast(api, error);
  }
}

const CliKitTuiPlugin: TuiPluginModule = {
  id: "clikit-tui",
  async tui(api) {
    const promptRefs: PromptRefStore = {
      sessions: new Map<string, TuiPromptRef>(),
    };

    registerPromptSlots(api, promptRefs);

    const unregister = api.command.register(() => [
      {
        title: "CliKit Augment",
        value: "clikit.augment",
        description: "Rewrite the current composer prompt when available, with dialog fallback on unsupported runtimes.",
        category: "CliKit",
        slash: {
          name: "augment",
        },
        onSelect: () => {
          const promptRef = getActivePromptRef(api, promptRefs);

          if (promptRef) {
            void runComposerAugment(api, promptRef);
            return;
          }

          openAugmentDialog(api);
        },
      },
    ]);

    api.lifecycle.onDispose(() => {
      promptRefs.home = undefined;
      promptRefs.sessions.clear();
    });
    api.lifecycle.onDispose(unregister);
  },
};

export default CliKitTuiPlugin;
