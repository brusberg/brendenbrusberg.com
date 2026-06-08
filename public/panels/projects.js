(() => {
  const registry = window.portfolioPanelFactories = window.portfolioPanelFactories || {};
  registry.art = ({ poemButtonHtml }) => ({
    coord: { x: 0, y: 1 },
    eyebrow: '',
    title: 'Projects & Writing',
    summary:
      'Projects, sketches, paintings, writing, and the work that is mostly an excuse to learn something.',
    storyHtml: `
      <p><span class="story-subhead">Art</span>I mostly paint to make postcards as gifts. The artwork lives in the top scene now. Click or tap a framed piece in the canvas to open it larger.</p>
      <p><span class="story-subhead">Side projects</span><a href="https://dungeons-kitten-table.vercel.app/">Dungeons and Kittens Online Tabletop</a>.</p>
      <p>Rust Steaming Coffee: <a href="https://github.com/brusberg/coffee">brusberg/coffee</a>, written by hand to learn.</p>
      <p><span class="story-subhead">Writing</span>Writing is coming soon, likely through Substack. For now, one older poem lives here as a popout instead of taking over the whole page.</p>
      ${poemButtonHtml}
      <p><span class="story-subhead">Friends whose work I love</span><a href="https://www.patreon.com/Dreamsicle122">Chudi</a> makes imaginative tabletop and story worlds; <a href="https://jeewoonlee.com">Jeewoon Lee</a> works with careful visual systems and design; <a href="https://thevineandfigtree.org/poetry/">Peter White</a> writes poetry and reflection I return to; <a href="https://mldangelo.com/">Michael D Angelo</a> builds thoughtful software and writing; and <a href="https://nburgdorfer.github.io/">Nate Burgdorfer</a> shares technical work with real curiosity.</p>
      <p><span class="story-subhead">Mentors and coworkers who taught me something</span><a href="https://keithmcnulty.org/">Keith McNulty</a> taught me about statistical rigor, and that leading an organization at a firm is about offering people opportunities and safe space to experiment. <a href="https://www.linkedin.com/in/james-hanson-1533441/">James Hanson</a> mentored me and showed me more about life and work's relationship to the world, people, and myself. <a href="https://www.linkedin.com/in/tbueschel/">Tobias Bueschel</a> showed me that even though it is a toxic term, 10x engineers do exist, and brought me back into the world of software engineering. <a href="https://www.linkedin.com/in/pavithra-k-566b2232/">Pavithra Kareti</a> showed me that learning is a daily practice, but being a caring teammate is a conscious choice with effort.</p>
      <p><a href="https://www.linkedin.com/in/cheungjw/">Julia Cheung</a> showed me work is full of art, and if you treat it that way your life will be full of art. <a href="https://www.linkedin.com/in/rodrigo-olivares-lopez/">Rodrigo Olivares Lopez</a> taught me life hits you all at once, so be prepared to let it hit you. <a href="https://www.linkedin.com/in/omer-keinan-2392026/">Omer Keinan</a> taught me you always come first; do not burn yourself out or nothing else matters after that. Have vision and be excited about what you make. <a href="https://jasonforrestftw.com/">Jason Forrest</a> showed me that at the end of the day, design is everything about communicating.</p>
      <p><a href="https://www.linkedin.com/in/elizabethpears/">Elizabeth Pears</a> taught me to be friendly at work; it will always pay off. <a href="https://www.linkedin.com/in/sarahtobey/">Sarah Tobey</a> taught me to know the answer to any question, and if not, be really good at finding the answer. <a href="https://www.linkedin.com/in/aitong-li/">Aitong Li</a> and <a href="https://www.linkedin.com/in/mikayla-munnery-70614682/">Mikayla Munnery</a> showed me teams at work are not your family, but sometimes the friends you meet at work do become your family outside of work. <a href="https://www.linkedin.com/in/stevenrspangler/">Steven Spangler</a> taught me that a well-timed joke at a meeting is sometimes more important than the entire meeting. <a href="https://www.linkedin.com/in/alice-damonte/">Alice Damonte</a> reminded me: do not forget who you are.</p>
      <p><span class="story-subhead">People that inspire me</span><a href="https://www.3blue1brown.com/">3Blue1Brown</a>: anyone can learn math, and it is beautiful. <a href="https://xkcd.com/">xkcd</a>: learning is fun. <a href="https://www.tomscott.com/">Tom Scott</a>: learning is everywhere.</p>
    `,
    sectionLabel: 'Friends',
    chips: ['Image collage', 'Sketches', 'Trips', 'Future writing', 'Physics frames'],
    linksLabel: 'Links',
    links: [
      ['Chudi', 'https://www.patreon.com/Dreamsicle122'],
      ['Jeewoon Lee', 'https://jeewoonlee.com'],
      ['Peter White', 'https://thevineandfigtree.org/poetry/'],
      ['Michael D Angelo', 'https://mldangelo.com/'],
      ['Nate Burgdorfer', 'https://nburgdorfer.github.io/'],
      ['Keith McNulty', 'https://keithmcnulty.org/'],
      ['3Blue1Brown', 'https://www.3blue1brown.com/'],
      ['xkcd', 'https://xkcd.com/'],
      ['Tom Scott', 'https://www.tomscott.com/']
    ],
    actions: []
  });
})();
