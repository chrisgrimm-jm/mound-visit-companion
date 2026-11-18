export default function UpdateVariableDefinitions(self) {
	self.setVariableDefinitions({
		live_read_name: { name: 'Name of the read currently LIVE on the prompter' },
		read_count: { name: 'Number of reads in the script library' },
		topic: { name: 'Teleprompter topic in use (typed, or followed from Mound Visit on this PC)' },
	})
	self.setVariableValues({
		live_read_name: self.liveName || '',
		read_count: self.library.length || 0,
		topic: self.topic || '',
	})
}
