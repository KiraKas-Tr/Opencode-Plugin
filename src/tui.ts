import type { TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui";

import { augmentPromptWithRefinement } from "./tools/augment";

type DeliveryMode = "submitted" | "injected" | "ready";

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

async function injectPrompt(api: TuiPluginApi, prompt: string): Promise<boolean> {
  const directory = api.state.path.directory;
  const workspace = api.workspace.current();
  const client = api.scopedClient(workspace);

  try {
    await client.tui.appendPrompt({ directory, workspace, text: prompt });
    return true;
  } catch {
    return false;
  }
}

function getActiveSessionID(api: TuiPluginApi): string | undefined {
  const currentRoute = api.route.current;

  if (currentRoute.name !== "session") {
    return undefined;
  }

  const sessionID = currentRoute.params?.sessionID;
  return typeof sessionID === "string" ? sessionID : undefined;
}

async function deliverPrompt(api: TuiPluginApi, prompt: string): Promise<DeliveryMode> {
  const directory = api.state.path.directory;
  const workspace = api.workspace.current();
  const client = api.scopedClient(workspace);
  const activeSessionID = getActiveSessionID(api);

  if (activeSessionID) {
    try {
      const submitResult = await client.session.prompt({
        sessionID: activeSessionID,
        directory,
        workspace,
        parts: [
          {
            type: "text",
            text: prompt,
          },
        ],
      });

      if (!submitResult.error) {
        return "submitted";
      }
    } catch {
      // Fall through to composer injection.
    }
  }

  if (await injectPrompt(api, prompt)) {
    return "injected";
  }

  return "ready";
}

async function runAugment(api: TuiPluginApi, draft: string): Promise<void> {
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
    const result = await augmentPromptWithRefinement(normalized, {
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

    const deliveryMode = await deliverPrompt(api, result.enhanced);

    const successPrefix = deliveryMode === "submitted"
      ? "Sent"
      : deliveryMode === "injected"
        ? "Injected"
        : "Prepared";

    api.ui.dialog.clear();

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
      message: deliveryMode === "submitted"
        ? `Enhanced prompt sent (${result.enhancementSource ?? "deterministic"}).`
        : deliveryMode === "injected"
          ? `Enhanced prompt inserted (${result.enhancementSource ?? "deterministic"}).`
          : `Enhanced prompt ready (${result.enhancementSource ?? "deterministic"}).`,
      duration: 3500,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prompt enhancement failed.";
    api.ui.toast({
      variant: "error",
      title: "CliKit Augment",
      message,
      duration: 3500,
    });
  }
}

const CliKitTuiPlugin: TuiPluginModule = {
  id: "clikit-tui",
  async tui(api) {
    const unregister = api.command.register(() => [
      {
        title: "CliKit Augment",
        value: "clikit.augment",
        description: "Open a TUI prompt, rewrite the draft, and send the enhanced prompt immediately.",
        category: "CliKit",
        slash: {
          name: "augment",
        },
        onSelect: () => {
          api.ui.dialog.replace(() => api.ui.DialogPrompt({
            title: "CliKit Augment",
            placeholder: "Paste or type the prompt draft to enhance",
            onConfirm: async (value) => {
              await runAugment(api, value);
            },
            onCancel: () => {
              api.ui.dialog.clear();
            },
          }));
        },
      },
    ]);

    api.lifecycle.onDispose(unregister);
  },
};

export default CliKitTuiPlugin;
