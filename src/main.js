import { InstanceBase, InstanceStatus } from '@companion-module/base'
import { onValue } from '@firebase/database'
import os from 'node:os'
import { promptRef, hostTopicRef } from './firebase.js'
import { UpgradeScripts as upgradeScripts } from './upgrades.js'
import UpdateActions from './actions.js'
import UpdateFeedbacks from './feedbacks.js'
import UpdateVariableDefinitions from './variables.js'
import UpdatePresetDefinitions from './presets.js'

// as of @companion-module/base v2, the host imports this file directly and reads the default
// export as the instance class, plus this named export for upgrade scripts -- there is no
// runEntrypoint() call to make (that was removed; see the package's CHANGELOG.md).
export const UpgradeScripts = upgradeScripts

export default class ModuleInstance extends InstanceBase {
	async init(config) {
		this.config = config
		this.library = [] // [{id, name}], live from Firebase prompter/<topic>/scripts
		this.liveName = '' // name of whichever read is currently on the prompter
		this.uiState = {} // {promptShow, prodShow, timerShow, clockShow}, live from prompter/<topic>/uistate
		this.scriptsUnsub = null
		this.contentUnsub = null
		this.uiStateUnsub = null
		this.hostUnsub = null
		this.updateVariableDefinitions()
		this.start()
	}

	async destroy() {
		this.unsubscribe()
		if (this.hostUnsub) this.hostUnsub()
	}

	async configUpdated(config) {
		this.config = config
		this.start()
	}

	// Topic field filled in = use it. Blank (or "auto") = follow whatever topic Mound Visit on this same PC is using,
	// which its Control page publishes under this computer's host name (needs the Mound Visit desktop app).
	start() {
		this.unsubscribe()
		if (this.hostUnsub) this.hostUnsub()
		this.hostUnsub = null
		const typed = String(this.config.topic || '').trim()
		if (typed && typed.toLowerCase() !== 'auto') return this.useTopic(typed)
		this.topic = ''
		this.useTopic('')
		const host = os.hostname()
		this.hostUnsub = onValue(hostTopicRef(host), (snap) => {
			const t = (snap.val() || {}).topic
			if (!t) {
				this.unsubscribe()
				this.topic = ''
				this.setVariableValues({ topic: '' })
				this.updateStatus(InstanceStatus.BadConfig, `Auto: no Mound Visit seen on ${host} yet. Open it here, or type a topic.`)
				return
			}
			if (t !== this.topic) this.useTopic(t)
		})
	}

	useTopic(topic) {
		this.unsubscribe()
		this.topic = topic
		this.library = []
		this.liveName = ''
		this.uiState = {}
		this.setVariableValues({ topic })
		this.updateStatus(InstanceStatus.Connecting)
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresetDefinitions()
		if (topic) this.subscribe()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'topic',
				label: "Topic — leave blank to follow Mound Visit on this PC automatically (or type one to match its Teleprompter card)",
				width: 8,
				default: '',
			},
		]
	}

	subscribe() {
		const scriptsRef = promptRef(this.topic, 'scripts')
		const contentRef = promptRef(this.topic, 'content')

		this.scriptsUnsub = onValue(
			scriptsRef,
			(snap) => {
				const v = snap.val() || {}
				// same ordering rule as Mound Visit: manual `order` first, never-ordered reads after, by creation time
				const key = (k) => (typeof v[k].order === 'number' ? v[k].order : v[k].ts || 0)
				this.library = Object.keys(v)
					.sort((a, b) => key(a) - key(b))
					.map((k) => ({ id: k, name: v[k].name || 'Untitled' }))
				this.setVariableValues({ read_count: this.library.length })
				this.updateActions()
				this.updateFeedbacks()
				this.updatePresetDefinitions()
				this.updateStatus(InstanceStatus.Ok, `Topic: ${this.topic}`)
			},
			(err) => this.updateStatus(InstanceStatus.ConnectionFailure, err.message),
		)

		this.contentUnsub = onValue(contentRef, (snap) => {
			const v = snap.val() || {}
			this.liveName = v.name || ''
			this.setVariableValues({ live_read_name: this.liveName })
			this.checkFeedbacks('read_is_live')
		})

		const uiStateRef = promptRef(this.topic, 'uistate')
		this.uiStateUnsub = onValue(uiStateRef, (snap) => {
			this.uiState = snap.val() || {}
			this.checkFeedbacks('element_is_shown')
		})
	}

	unsubscribe() {
		if (this.scriptsUnsub) this.scriptsUnsub()
		if (this.contentUnsub) this.contentUnsub()
		if (this.uiStateUnsub) this.uiStateUnsub()
		this.scriptsUnsub = null
		this.contentUnsub = null
		this.uiStateUnsub = null
	}

	updateActions() {
		UpdateActions(this)
	}
	updateFeedbacks() {
		UpdateFeedbacks(this)
	}
	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
	updatePresetDefinitions() {
		UpdatePresetDefinitions(this)
	}
}
