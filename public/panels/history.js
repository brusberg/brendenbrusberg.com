(() => {
  const registry = window.portfolioPanelFactories = window.portfolioPanelFactories || {};
  registry.mandelbrot = () => ({
    coord: { x: 1, y: 0 },
    eyebrow: '',
    title: 'History',
    summary:
      'A personal history of teachers, work, poetry, nature, and the projects that shaped how I think. Plus an interactive Mandelbrot and Julia simulation.',
    summaryHtml:
      'A personal history of teachers, work, poetry, nature, and the projects that shaped how I think. Plus an interactive <a href="https://en.wikipedia.org/wiki/Mandelbrot_set">Mandelbrot</a> and <a href="https://en.wikipedia.org/wiki/Julia_set">Julia</a> simulation.',
    storyHtml: [
      'I was born and raised in Sparta, New Jersey, in Sussex County. My brother and sister were 14 and 10 years older than me, so I grew up with their hand-me-down tech, old computer games, and N64 cartridges.',
      'I have to thank a lot of teachers in high school who shaped how I see the world: <a href="https://www.linkedin.com/in/margaret-incantalupo-37a47a24/">Mrs. I</a>, who mentored me through high school, gave me room to learn on my own, and first introduced me to programming; Mr. Masker, who taught me that sometimes analog is the best way to learn; Mr. Rienstein, who taught me how practice, space, and peers nurture skill and craft; <a href="https://www.linkedin.com/in/kate-leblanc-475a9929/">Miss Leblanc</a>, who showed me how reading extends into your life and voice and also how to have a personality; and Mrs. Lovett, who showed me that work can feel like falling down the rabbit hole.',
      'I am glad I graduated from college before LLMs. I mainly studied computer science and wanted to be a software engineer. At 18, I joined McKinsey & Company as an SWE intern. A data scientist heard I was not doing much my first week and stole me. That was <a href="https://www.linkedin.com/in/dale-jacques/">Dale Jacques</a>, who quickly became my manager and mentor.',
      'I came back the next summer and never really left. I worked part-time as a permanent member of the Firm through school, three or four days a week during the semester. That work let me learn alongside excellent software engineers, designers, and statisticians, with the flexibility to explore. In school I started my master’s early and added a math minor, looking for stronger foundations for what I was already doing at work.',
      'What followed was that Dale and I became a kind of specialty shop, often taking on hard projects without templates or playbooks. We centered a lot of the work around reading the latest research papers for NLP, ML, and competitions.',
      'That meant rebuilding research papers from scratch, learning AWS because no one at the time could deploy our models on-prem, learning frontend TypeScript for custom data visuals, training diffusion models from scratch, fine-tuning language models before 2021, and really doing whatever no one else could do yet.',
      'Around this time, I needed to fill an elective and selected American Poetry with Professor Rubenfield at Stevens Institute of Technology. I absolutely fell in love with it and minored in it. I ended up with a whole independent-study semester on my favorite poem, <a href="https://www.poetryfoundation.org/poems/45477/song-of-myself-1892-version">Song of Myself</a> by Walt Whitman. I also fell in love with William Carlos Williams, <em>Spring and All</em> (<a href="https://www.poetryfoundation.org/poems/148465/spring-and-all-xxv-somebody-dies-every-four-minutes">Excerpt</a>), and Emily Dickinson. Poetry also built something I never expected to find at Stevens: spirituality, often reconnecting to nature and my childhood journey in the woods of North Jersey from Cub Scout to Eagle Scout. I’m trying to get out into nature every week, often hiking, camping, and climbing.',
      'Lately I have been focused on how my time is spent nurturing rather than extracting, in the spirit of <a href="https://en.wikipedia.org/wiki/Wendell_Berry">Wendell Berry</a>. I’ve now been working with <a href="https://www.linkedin.com/in/andrejmarsic/">Andrej Maršič</a> and <a href="https://www.linkedin.com/in/petra-kummerova-07612659/">Petra Kummerova</a>, who showed me how to have fun at work and inspire me every day. A lot of my most fulfilling work has been TAing, volunteering as a tutor, and teaching at work. <a href="#art">I think there is so much more we all have to offer the world, and I would love to offer my time to work with anyone who agrees.</a>',
    ],
    sectionLabel: 'Threads',
    chips: ['Teachers', 'Research papers', 'American poetry', 'Nurturing work', 'Strange systems'],
    linksLabel: 'Links',
    links: [
      ['Mrs. I', 'https://www.linkedin.com/in/margaret-incantalupo-37a47a24/'],
      ['Miss Leblanc', 'https://www.linkedin.com/in/kate-leblanc-475a9929/'],
      ['Dale Jacques', 'https://www.linkedin.com/in/dale-jacques/'],
      ['Song of Myself', 'https://www.poetryfoundation.org/poems/45477/song-of-myself-1892-version'],
      ['Spring and All (Excerpt)', 'https://www.poetryfoundation.org/poems/148465/spring-and-all-xxv-somebody-dies-every-four-minutes'],
      ['Projects and Writting', '#art'],
      ['Old repo', 'https://github.com/brusberg/Mandelbrot-and-Julian-Set-Calculator'],
      ['Mandelbrot set', 'https://en.wikipedia.org/wiki/Mandelbrot_set'],
      ['Julia set', 'https://en.wikipedia.org/wiki/Julia_set']
    ],
    actions: []
  });
})();
