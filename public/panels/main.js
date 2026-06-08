(() => {
  const registry = window.portfolioPanelFactories = window.portfolioPanelFactories || {};
  registry.ants = () => ({
    coord: { x: 0, y: 0 },
    eyebrow: '',
    title: 'Brenden Brusberg',
    summary:
      'I work on designing platforms to better understand and evaluate complex systems in organizations, leveraging multidisciplinary skills and teams to nurture real value. Plus a SimAnt-inspired interactive ant simulation.',
    storyHtml: [
      'One of the first computer games I played was <a href="https://en.wikipedia.org/wiki/SimAnt">SimAnt</a>. Even before I could read I would sneak onto the family computer where my much older brother had working DOS games like SimCity and SimAnt.',
      'This simulation is a recreation of what started my journey into computers : )'
    ],
    sectionLabel: 'Signals',
    chips: ['Data systems', 'Agentic AI', 'Knowledge graphs', 'Simulation UI'],
    linksLabel: 'Links',
    links: [
      ['Resume', '#resume'],
      ['GitHub', 'https://github.com/brusberg'],
      ['LinkedIn', 'https://www.linkedin.com/in/brendends/'],
      ['Email', 'mailto:brenbrus@gmail.com']
    ],
    actions: [
      ['Resume', '#resume'],
      ['GitHub', 'https://github.com/brusberg'],
      ['LinkedIn', 'https://www.linkedin.com/in/brendends/'],
      ['Email', 'mailto:brenbrus@gmail.com']
    ]
  });
})();
