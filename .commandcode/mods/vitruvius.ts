import type {ModApi} from '@commandcode/harness';

// Vitruvius — Command Code mod.
//
// Registers the /vitruvius slash commands. Because Vitruvius is a skill
// collection, the commands dispatch to the installed skills (which the user
// installs separately with `cmd skills add <owner>/vitruvius`). This mod makes
// the command surface available after `cmd mods add <owner>/vitruvius`.
//
// The handler returns {prompt}, which submits an automated turn that activates
// the skill via the namespaced /skill:<name> form so the command always routes
// to the skill.

const SKILLS: Array<{command: string; description: string; skill: string; hint: string}> = [
	{command: 'vitruvius', description: 'Engineering research dispatcher: mechanical, software, civil, electrical, architectural', skill: 'vitruvius', hint: '<discipline or research question>'},
	{command: 'mechanical', description: 'Mechanical engineering research: mech design, thermal, fluids, materials, manufacturing', skill: 'mechanical', hint: '<research question>'},
	{command: 'software', description: 'Software engineering research: architecture, frameworks, protocols, security, benchmarks', skill: 'software', hint: '<research question>'},
	{command: 'civil', description: 'Civil / structural engineering research: buildings, bridges, steel, concrete, geotech, loads', skill: 'civil', hint: '<research question>'},
	{command: 'electrical', description: 'Electrical / electronics engineering research: power, electronics, controls, EMC', skill: 'electrical', hint: '<research question>'},
	{command: 'architectural', description: 'Architectural research: building science, facades, codes, performance, precedents', skill: 'architectural', hint: '<research question>'},
	{command: 'vitruvius-help', description: 'Quick-reference card for all Vitruvius commands and the shared research method', skill: 'vitruvius-help', hint: ''},
];

export default function (cmd: ModApi): void {
	for (const {command, description, skill, hint} of SKILLS) {
		cmd.addCommand({
			name: command,
			description,
			argumentHint: hint,
			handler: ({args}) => {
				const argText = args.trim();
				// The vitruvius dispatcher decides routing; the discipline
				// commands pass the question straight to their skill.
				const skillCall = skill === 'vitruvius'
					? '/skill:vitruvius'
					: skill === 'vitruvius-help'
						? '/skill:vitruvius-help'
						: `/skill:${skill}`;
				const suffix = argText ? ` ${argText}` : '';
				return {prompt: `${skillCall}${suffix}`};
			},
		});
	}
}
