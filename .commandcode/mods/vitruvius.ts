import type {ModApi} from '@commandcode/harness';

// Vitruvius — Command Code mod.
//
// Single-namespace command surface: all commands are /vitruvius:<name>.
// The base /vitruvius command is the smart dispatcher. Discipline and
// skill commands route to the installed skills via /skill:<name>.
//
// Install: `cmd mods add <owner>/vitruvius`
// Skills install separately: `cmd skills add <owner>/vitruvius`

interface CommandDef {
	command: string; // Full command name (e.g., "vitruvius:civil")
	description: string;
	skill: string; // Skill to activate
	hint: string;
}

const COMMANDS: CommandDef[] = [
	// Dispatcher (base command)
	{command: 'vitruvius', description: 'Engineering research dispatcher — routes to discipline or skill automatically', skill: 'vitruvius', hint: '<discipline or research question>'},

	// Discipline research
	{command: 'vitruvius:civil', description: 'Civil / structural: buildings, bridges, steel, concrete, geotech, loads', skill: 'civil', hint: '<research question>'},
	{command: 'vitruvius:mechanical', description: 'Mechanical: design, thermal, fluids, materials, manufacturing', skill: 'mechanical', hint: '<research question>'},
	{command: 'vitruvius:software', description: 'Software: architecture, frameworks, protocols, security, benchmarks', skill: 'software', hint: '<research question>'},
	{command: 'vitruvius:electrical', description: 'Electrical / electronics: power, electronics, controls, EMC', skill: 'electrical', hint: '<research question>'},
	{command: 'vitruvius:architectural', description: 'Architectural: building science, facades, codes, performance', skill: 'architectural', hint: '<research question>'},

	// Research workflow skills
	{command: 'vitruvius:verifier', description: 'Blind Verifier — independent subagent checks claim vs evidence', skill: 'verifier', hint: '<claim>'},
	{command: 'vitruvius:verify', description: 'Verify a claim, number, or calculation against sources', skill: 'verify', hint: '<claim or calculation>'},
	{command: 'vitruvius:compare', description: 'Compare items into a source-grounded matrix', skill: 'compare', hint: '<items to compare>'},
	{command: 'vitruvius:review', description: 'Severity-graded adversarial review of an artifact', skill: 'review', hint: '<artifact>'},
	{command: 'vitruvius:audit', description: 'Audit claim/spec against implementation', skill: 'audit', hint: '<target>'},
	{command: 'vitruvius:summarize', description: 'Read and condense a standard, spec, or paper', skill: 'summarize', hint: '<document>'},
	{command: 'vitruvius:eli5', description: 'Plain-language engineering explanation', skill: 'eli5', hint: '<topic>'},
	{command: 'vitruvius:artifact-reading', description: 'Anchored extraction from PDFs, drawings, specs', skill: 'artifact-reading', hint: '<document>'},
	{command: 'vitruvius:scholarly-research', description: 'Academic literature discovery (OpenAlex, arXiv, etc.)', skill: 'scholarly-research', hint: '<topic>'},
	{command: 'vitruvius:standards-lookup', description: 'Engineering standards: AISC, ACI, ASCE, IEEE, Eurocode', skill: 'standards-lookup', hint: '<standard or topic>'},

	// Help
	{command: 'vitruvius:help', description: 'Reference card for all Vitruvius commands', skill: 'vitruvius-help', hint: ''},
];

export default function (cmd: ModApi): void {
	for (const {command, description, skill, hint} of COMMANDS) {
		cmd.addCommand({
			name: command,
			description,
			argumentHint: hint,
			handler: ({args}) => {
				const argText = args.trim();
				const skillCall = `/skill:${skill}`;
				const suffix = argText ? ` ${argText}` : '';
				return {prompt: `${skillCall}${suffix}`};
			},
		});
	}
}
