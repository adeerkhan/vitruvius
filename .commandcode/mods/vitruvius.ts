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
	{command: 'scholarly-research', description: 'Academic literature discovery: OpenAlex, Semantic Scholar, arXiv, alphaXiv', skill: 'scholarly-research', hint: '<topic or paper identifier>'},
	{command: 'standards-lookup', description: 'Engineering standards and codes: AISC, ACI, ASCE, IEEE, NFPA, IBC, Eurocode', skill: 'standards-lookup', hint: '<standard or topic>'},
	{command: 'compare', description: 'Compare standards, designs, products, or methods into a source-grounded matrix', skill: 'compare', hint: '<items to compare>'},
	{command: 'verify', description: 'Verify an engineering claim, number, or calculation against authoritative sources', skill: 'verify', hint: '<claim or calculation>'},
	{command: 'review', description: 'Severity-graded adversarial review of an engineering artifact', skill: 'review', hint: '<artifact>'},
	{command: 'audit', description: 'Audit a claim/spec against its implementation (paper-vs-code, spec-vs-design)', skill: 'audit', hint: '<target>'},
	{command: 'summarize', description: 'Read and condense a standard, spec, datasheet, or paper faithfully', skill: 'summarize', hint: '<document>'},
	{command: 'eli5', description: 'Plain-language engineering explanation of a concept or standard', skill: 'eli5', hint: '<topic>'},
	{command: 'artifact-reading', description: 'Anchored reading and extraction from PDFs, datasheets, drawings, specs', skill: 'artifact-reading', hint: '<document>'},
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
