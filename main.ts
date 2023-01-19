import {
	App,
	Component,
	MarkdownRenderer,
	Modal,
	Plugin,
	PluginSettingTab,
	requestUrl,
	Setting,
	TFile,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface ToastPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ToastPluginSettings = {
	mySetting: "default",
};

export interface ToastApi {
	getQuote(): Promise<ZenQuote>;
	showToast(text: string|TFile): void;
}

export default class ObsidianToast extends Plugin {
	settings: ToastPluginSettings;
	public api: ToastApi;

	async onload() {
		await this.loadSettings();

		function show_toast(text: string|TFile): void{
			if (typeof text === "string"){
				return new Toast(this, text).open();
			}
			return new Toast(this, "", text).open();
		}

		this.api = {
			getQuote: get_quote,
			showToast: show_toast,
		};


		// // This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon(
		// 	"dice",
		// 	"Sample Plugin",
		// 	(evt: MouseEvent) => {
		// 		// Called when the user clicks the icon.
		// 		new Notice("This is a notice!");
		// 	}
		// );
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new Toast(this, "# HORRAY\n## You Can Have A Reward!").open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: "sample-editor-command",
		// 	name: "Sample editor command",
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection("Sample Editor Command");
		// 	},
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: "open-sample-modal-complex",
		// 	name: "Open sample modal (complex)",
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView =
		// 			this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new Toast(this).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		// 	console.log("click", evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		// );
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class Toast extends Modal {
	private plugin: Component;
	public text: string;
	public file: TFile;

	constructor(plugin: Component, text = "", file?: TFile) {
		super(app);
		this.text = text;
	}

	async onOpen() {
		const { contentEl } = this;
		//render any markdown
		let path = "";
		let text = this.text;
		if (this.file) {
			path = this.file.path;
			text = await this.app.vault.cachedRead(this.file);
		}

		await MarkdownRenderer.renderMarkdown(
			text,
			contentEl,
			path,
			this.plugin
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ObsidianToast;

	constructor(app: App, plugin: ObsidianToast) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

async function get_quote(): Promise<ZenQuote> {
	const response = await requestUrl("https://zenquotes.io/api/random");
	const j = response.json[0];
	return new ZenQuote(j as ZenQuoteResult);
}

interface ZenQuoteResult {
	q: string;
	a: string;
	i: string;
	c: string;
	h: string;
}

class ZenQuote {
	quote: string;
	author: string;
	image?: string;
	html: string;

	constructor(r: ZenQuoteResult) {
		this.quote = r.q;
		this.author = r.a;
		this.html = r.h;
		this.image = r.i;
	}
}
