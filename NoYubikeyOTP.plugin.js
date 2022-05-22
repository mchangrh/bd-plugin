/**
 * @name NoYubikeyOTP
 * @author blabdude
 * @authorId 162333087621971979
 * @version 0.1.1
 * @description Block messages with Yubikey OTPs
 * @source https://github.com/mchangrh/bd-plugin
 * @updateUrl https://mchangrh.github.io/bd-plugin/NoYubikeyOTP.plugin.js
 */

module.exports = (_ => {
	const config = {
		"info": {
			"name": "NoYubikeyOTP",
			"author": "blabdude",
			"version": "0.1.1",
			"description": "Disallow sending Yubikey OTP messages"
		}
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
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
	} : (([Plugin, BDFDB]) => {
		return class NoYubikeyOTP extends Plugin {
			onLoad () {
				this.patchedModules = {
					before: {
						ChannelTextAreaForm: "render"
					}
				};
			}
			
			onStart () {
				BDFDB.PatchUtils.forceAllUpdates(this);
			}
			
			onStop () {
				BDFDB.PatchUtils.forceAllUpdates(this);
			}

			isYubikeyOTP = (text) => /[lnrtuvcbdefghijk]{44}/.test(text);

			processChannelTextAreaForm (e) {
				BDFDB.PatchUtils.patch(this, e.instance, "handleSendMessage", {instead: i => {
					const message = i.methodArguments[0].value
					if (this.isYubikeyOTP(message)) {
						i.stopOriginalMethodCall();
						BDFDB.NotificationUtils.toast("Disallowed sending Yubikey OTP", {type: "danger", timeout: 5000})
						return Promise.resolve({
							shouldClear: (message.length === 44), // clear if exactly the length of OTP
							shouldRefocus: true
						});
					}
					else return i.callOriginalMethodAfterwards();
				}}, {force: true, noCache: true});
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
