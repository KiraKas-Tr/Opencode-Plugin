import type { TuiPluginModule } from "@opencode-ai/plugin/tui";

const CliKitTuiPlugin: TuiPluginModule = {
  id: "clikit-tui",
  async tui() {
    // TUI-specific augment UX currently relies on server-side `client.tui`
    // methods (clearPrompt/appendPrompt/showToast) because that path is
    // evidence-backed in the installed runtime. This separate module keeps the
    // plugin packaging ready for dedicated TUI behaviors as the host runtime
    // support expands.
  },
};

export default CliKitTuiPlugin;
