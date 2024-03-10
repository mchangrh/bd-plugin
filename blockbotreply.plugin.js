/**
 * @name blockbotreply
 * @author blabdude
 * @authorId 162333087621971979
 * @version 0.1.0
 * @description Block bot replies to blocked users
 * @source https://github.com/mchangrh/bd-plugin
 * @updateUrl https://mchangrh.github.io/bd-plugin/blockbotreply.plugin.js
 */

module.exports = (_ => {
	const changeLog = {
	};

	return (!window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started)) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
	} : (([Plugin, BDFDB]) => {		
		return class BotBlockReply extends Plugin {
			onLoad () {
				this.modulePatches =
				 {
					before: [
						"Message",
						"Messages"
					],
				};
			}
			
			onStart () {
				this.forceUpdateAll();
			}
			
			onStop () {
				this.forceUpdateAll();
			}
		
			forceUpdateAll () {
				BDFDB.PatchUtils.forceAllUpdates(this);
				BDFDB.MessageUtils.rerenderAll();
			}

			processMessage (e) {
				const curMessage = e?.instance?.props?.childrenMessageContent?.props?.message
				const repliedMessage = e.instance.props.childrenRepliedMessage?.props?.children?.props?.referencedMessage?.message
				// block if the current message is a bot and the reply target is blocked
				if (curMessage?.author?.bot && repliedMessage?.blocked) {
					curMessage.content = "(blocked by blockbotreply)";
					curMessage.embeds = [];
					curMessage.blocked = true;
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();