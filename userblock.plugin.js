/**
 * @name userblock
 * @author blabdude
 * @authorId 162333087621971979
 * @version 0.1.0
 * @description Block based on username by censoring text or emulating discord block
 * @source https://github.com/mchangrh/bd-plugin
 * @updateUrl https://mchangrh.github.io/bd-plugin/userblock.plugin.js
 */

module.exports = (_ => {
	const config = {
		"info": {
			"name": "userblock",
			"author": "blabdude",
			"version": "0.1.0",
			"description": "Block based on username by censoring text or emulating discord block"
		},
		"changeLog": {
		}
	};

	return (!window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started)) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return `The Library Plugin needed for ${config.info.name} is missing. Open the Plugin Settings to download it. \n\n${config.info.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var oldBlockedMessages, words;

		const configs = {
			textblock: {value: true, description: "Replace text sent by the user (instant)"},
			userblock: {value: true, description: "\"Discord Block\" the user (slower)"},
		};
		
		return class ChatFilter extends Plugin {
			onLoad () {
				this.defaults = {
					general: {
						textblock: {value: true, description: "Replace text sent by the user (instant)"},
						userblock: {value: true, description: "\"Discord Block\" the user (slower)"},
					}
				};
				this.patchedModules =
				 {
					before: {
						Message: "default",
						MessageContent: "type",
					},
					after: {
						Messages: "type",
						MessageContent: "type",
						Embed: "render"
					}
				};
			}
			
			onStart () {
				words = BDFDB.DataUtils.load(this, "words");
				 if (!BDFDB.ObjectUtils.is(words.blocked)) words.blocked = {}
				this.forceUpdateAll();
			}
			
			onStop () {
				this.forceUpdateAll();
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel;
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
					collapseStates: collapseStates,
					children: _ => {
						let settingsItems = [];
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: "Block Types",
							collapseStates: collapseStates,
							children: Object.keys(this.defaults.general).map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
								type: "Switch",
								plugin: this,
								keys: ["general", key],
								label: this.defaults.general[key].description,
								value: this.settings.general[key]
							}))
						}))
						let values = {wordValue: ""};
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: `Add new blocked username`,
							collapseStates: collapseStates,
							children: [
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
									type: "Button",
									label: "Add a Usernames",
									disabled: !Object.keys(values).every(valuename => values[valuename]),
									children: BDFDB.LanguageUtils.LanguageStrings.ADD,
									ref: instance => {if (instance) values.addButton = instance;},
									onClick: _ => {
										this.saveWord(values);
										BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
									}
								}),
								this.createInputs(values)
							].flat(10).filter(n => n)
						}));
						if (!BDFDB.ObjectUtils.isEmpty(words.blocked)) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: `Added Blocked Usernames`,
							collapseStates: collapseStates,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsList, {
								data: Object.keys(words.blocked).map(wordValue => Object.assign({}, words.blocked[wordValue], {
									key: wordValue,
									label: wordValue
								})),
								renderLabel: data => BDFDB.ReactUtils.createElement("div", {
									style: {width: "100%"},
									children: [
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
											value: data.label,
											placeholder: data.label,
											size: BDFDB.LibraryComponents.TextInput.Sizes.MINI,
											maxLength: 100000000000000000000,
											onChange: value => {
												words.blocked[value] = words.blocked[data.label];
												delete words.blocked[data.label];
												data.label = value;
												BDFDB.DataUtils.save(words, this, "words");
											}
										})
									]
								}),
								onRemove: (e, instance) => {
									delete words.blocked[instance.props.cardId];
									BDFDB.DataUtils.save(words, this, "words");
									BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
								}
							})
						}));
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: "Remove All",
							collapseStates: collapseStates,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
								type: "Button",
								color: BDFDB.LibraryComponents.Button.Colors.RED,
								label: `Remove all Blocked Usernames`,
								onClick: _ => {
									BDFDB.ModalUtils.confirm(this, `Are you sure you want to remove all Blocked Usernames?`, _ => {
										words.blocked = {};
										BDFDB.DataUtils.remove(this, "words", "blocked");
										BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
									});
								},
								children: BDFDB.LanguageUtils.LanguageStrings.REMOVE
							})
						}));
						
						return settingsItems;
					}
				});
			}

			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					this.forceUpdateAll();
				}
			}
		
			forceUpdateAll () {					
				oldBlockedMessages = {};
				
				BDFDB.PatchUtils.forceAllUpdates(this);
				BDFDB.MessageUtils.rerenderAll();
			}

			processMessages (e) {
				e.returnvalue.props.children.props.channelStream = [].concat(e.returnvalue.props.children.props.channelStream);
				for (let i in e.returnvalue.props.children.props.channelStream) {
					let message = e.returnvalue.props.children.props.channelStream[i].content;
					if (message) {
						if (BDFDB.ArrayUtils.is(message.attachments)) this.checkMessage(e.returnvalue.props.children.props.channelStream[i], message);
						else if (BDFDB.ArrayUtils.is(message)) for (let j in message) {
							let childMessage = message[j].content;
							if (childMessage && BDFDB.ArrayUtils.is(childMessage.attachments)) this.checkMessage(message[j], childMessage);
						}
					}
				}
			}
			
			checkMessage (stream, message) {
				let {blocked, content, embeds} = this.parseMessage(message);
				let changeMessage = (change, cache) => {
					if (change) {
						if (!cache[message.id]) cache[message.id] = new BDFDB.DiscordObjects.Message(message);
						if (this.settings.general.userblock) stream.content.blocked = true;
						stream.content.content = content;
						stream.content.embeds = embeds;
					}
				};
				changeMessage(blocked, oldBlockedMessages);
			}

			processMessage (e) {
				let repliedMessage = e.instance.props.childrenRepliedMessage;
				if (repliedMessage && repliedMessage.props && repliedMessage.props.children && repliedMessage.props.children.props && repliedMessage.props.children.props.referencedMessage && repliedMessage.props.children.props.referencedMessage.message && (oldBlockedMessages[repliedMessage.props.children.props.referencedMessage.message.id])) {
					let {blocked, content, embeds} = this.parseMessage(repliedMessage.props.children.props.referencedMessage.message);
					// repliedMessage.props.children.props.referencedMessage.message.blocked = blocked;
					// blocking on reply does nothing
					repliedMessage.props.children.props.referencedMessage.message = new BDFDB.DiscordObjects.Message(Object.assign({}, repliedMessage.props.children.props.referencedMessage.message, {content, embeds}));
				}
			}

			createStamp (tooltipText, label) {
				return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
					text: tooltipText,
					tooltipConfig: {style: "max-width: 400px"},
					children: BDFDB.ReactUtils.createElement("span", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.messagetimestamp, BDFDB.disCN.messagetimestampinline, BDFDB.disCN[`_chatfilter${label}stamp`]),
						children: BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.disCN.messageedited,
							children: `(${label})`
						})
					})
				});
			}

			processMessageContent (e) {
				if (e.instance.props.message && this.settings.general.textblock) {
					if (oldBlockedMessages[e.instance.props.message.id]) e.returnvalue?.props.children.push(this.createStamp(oldBlockedMessages[e.instance.props.message.id].content, "blocked"));
				}
			}

			parseMessage (message) {			
				let blocked = false;
				let content = (oldBlockedMessages[message.id] || {}).content || message.content;
				let embeds = [].concat((oldBlockedMessages[message.id] || {}).embeds || message.embeds);
				let isContent = content && typeof content == "string";
				if (isContent || embeds.length) {
					for (let bWord in words.blocked) {
						// author check
						if (message.author.username == bWord) {
							blocked = true;
							content = (this.settings.general.textblock) ? "​": content // replace with zwsp 
							break;
						}
					}
				}
				return {blocked, content, embeds: (blocked ? [] : embeds) };
			}
			
			createInputs (values) {
				let wordValueInput;
				return [
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
						title: "Block:",
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
							value: values.wordValue,
							placeholder: values.wordValue,
							errorMessage: !values.wordValue && "Choose a Username" || words.blocked[values.wordValue] && `Username already used, saving will overwrite old blocked username`,
							ref: instance => {if (instance) wordValueInput = instance;},
							onChange: (value, instance) => {
								values.wordValue = value.trim();
								if (!values.wordValue) instance.props.errorMessage = "Choose a Username";
								else if (words.blocked[values.wordValue]) instance.props.errorMessage = `Username already used, saving will overwrite old blocked username`;
								else delete instance.props.errorMessage;
								values.addButton.props.disabled = !values.wordValue;
								BDFDB.ReactUtils.forceUpdate(values.addButton);
							}
						})
					})
				];
			}

			saveWord (values) {
				if (!values.wordValue) return;
				if (!BDFDB.ObjectUtils.is(words.blocked)) words.blocked = {};
				words.blocked[values.wordValue] = {};
				BDFDB.DataUtils.save(words, this, "words");
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();