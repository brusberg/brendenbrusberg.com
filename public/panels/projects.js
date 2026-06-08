(() => {
  const registry = window.portfolioPanelFactories = window.portfolioPanelFactories || {};
  registry.art = ({ poemButtonHtml }) => ({
    coord: { x: 0, y: 1 },
    eyebrow: '',
    title: 'Projects & Writing',
    summary:
      'Art, writing, projects, friends, mentors, and the people whose work keeps me learning. Plus an interactive art gallery scene.',
    storyHtml: `
      <div class="story-section">
        <p><span class="story-subhead">Art</span>I mostly paint to make postcards as gifts. The artwork lives in the top scene now. Click or tap a framed piece in the canvas to open it larger.</p>
      </div>
      <div class="story-section">
        <p><span class="story-subhead">Projects</span><a href="https://www.mckinsey.com/capabilities/mckinsey-design/how-we-help-clients/design-blog/the-emotion-archive-finding-global-empathy-in-a-challenging-time">Emotion Archive</a>: finding global empathy in a challenging time.</p>
        <p><a href="https://dungeons-kitten-table.vercel.app/">Dungeons and Kittens Online Tabletop</a>.</p>
        <p>Rust Steaming Coffee: <a href="https://github.com/brusberg/coffee">brusberg/coffee</a>, written by hand to learn.</p>
      </div>
      <div class="story-section">
        <p><span class="story-subhead">Writing</span>Writing is coming soon, likely through Substack. For now, one older poem lives here as a popout instead of taking over the whole page.</p>
        ${poemButtonHtml}
      </div>
      <div class="story-section">
        <p><span class="story-subhead">Friends whose work I love</span><a href="https://www.patreon.com/Dreamsicle122">Chudi</a> makes imaginative tabletop and story worlds; <a href="https://jeewoonlee.com">Jeewoon Lee</a> works with careful visual systems and design; <a href="https://thevineandfigtree.org/poetry/">Peter White</a> writes poetry and reflection I return to; <a href="https://mldangelo.com/">Michael D Angelo</a> builds thoughtful software and writing; and <a href="https://nburgdorfer.github.io/">Nate Burgdorfer</a> shares technical work with real curiosity.</p>
      </div>
      <div class="story-section">
        <p><span class="story-subhead">Mentors and coworkers who taught me something</span><a href="https://keithmcnulty.org/">Keith McNulty</a> taught me about statistical rigor, and that leading an organization at a firm is about offering people opportunities and safe space to experiment. <a href="https://www.linkedin.com/in/james-hanson-1533441/">James Hanson</a> mentored me and showed me more about life and work's relationship to the world, people, and myself. <a href="https://www.linkedin.com/in/tbueschel/">Tobias Bueschel</a> showed me that even though it is a toxic term, 10x engineers do exist, and brought me back into the world of software engineering. <a href="https://www.linkedin.com/in/pavithra-k-566b2232/">Pavithra Kareti</a> showed me that learning is a daily practice, but being a caring teammate is a conscious choice with effort.</p>
        <p><a href="https://www.linkedin.com/in/dale-jacques/">Dale Jacques</a> taught me about the purpose of work, and so much more: he introduced me to coffee, how to negotiate rent, where to buy a suit, your time is the most valuable resource and to seek out experiences. <a href="https://www.linkedin.com/in/andrejmarsic/">Andrej Maršič</a> mentors me now on what matters now, but in a European way. <a href="https://www.linkedin.com/in/petra-kummerova-07612659/">Petra Kummerova</a> is my new leader and showed me work is about having fun, even when it is really challenging and difficult.</p>
        <p><a href="https://www.linkedin.com/in/cheungjw/">Julia Cheung</a> showed me work is full of art, and if you treat it that way your life will be full of art. <a href="https://www.linkedin.com/in/rodrigo-olivares-lopez/">Rodrigo Olivares Lopez</a> taught me life hits you all at once, so be prepared to let it hit you. <a href="https://www.linkedin.com/in/omer-keinan-2392026/">Omer Keinan</a> taught me you always come first; do not burn yourself out or nothing else matters after that. Have vision and be excited about what you make. <a href="https://jasonforrestftw.com/">Jason Forrest</a> showed me that at the end of the day, design is everything about communicating.</p>
        <p><a href="https://www.linkedin.com/in/elizabethpears/">Elizabeth Pears</a> taught me to be friendly at work; it will always pay off. <a href="https://www.linkedin.com/in/sarahtobey/">Sarah Tobey</a> taught me to know the answer to any question, and if not, be really good at finding the answer. <a href="https://www.linkedin.com/in/aitong-li/">Aitong Li</a> and <a href="https://www.linkedin.com/in/mikayla-munnery-70614682/">Mikayla Munnery</a> showed me teams at work are not your family, but sometimes the friends you meet at work do become your family outside of work. <a href="https://www.linkedin.com/in/stevenrspangler/">Steve Spangler</a> taught me that a well-timed joke at a meeting is sometimes more important than the entire meeting. <a href="https://www.linkedin.com/in/alice-damonte/">Alice Damonte</a> reminded me: do not forget who you are.</p>
      </div>
      <div class="story-section">
        <p><span class="story-subhead">People that inspire me</span><a href="https://www.3blue1brown.com/">3Blue1Brown</a>: anyone can learn math, and it is beautiful. <a href="https://xkcd.com/">xkcd</a>: learning is fun. <a href="https://www.tomscott.com/">Tom Scott</a>: learning is everywhere. <a href="https://www.youtube.com/@twoswap">TwoSwap</a> showed me learning can be visualized. <a href="https://www.youtube.com/@Acerola_t">Acerola</a> showed me how to learn shaders. <a href="https://www.youtube.com/@AltonBrown">Alton Brown</a> taught me how to cook. <a href="https://www.youtube.com/@BennJordan">Benn Jordan</a> showed me learning is hands on. <a href="https://www.youtube.com/@CorridorCrew">Corridor Crew</a> showed me the best job is to be continuously learning. <a href="https://www.youtube.com/@DamiLeeArch">Dami Lee</a> teaches me about architecture. <a href="https://www.youtube.com/@ExplosionsAndFire">Explosions&amp;Fire</a> showed me research is trying to replicate it yourself. <a href="https://www.youtube.com/@MinutePhysics">MinutePhysics</a> showed me you do not need to be artistic to teach others. <a href="https://www.youtube.com/@Nerdwriter1">Nerdwriter</a> showed me you can learn by trying to articulate what you like and do not like. <a href="https://www.youtube.com/@WelchLabs">Welch Labs</a> shows where the real meets applied machine learning. <a href="https://www.youtube.com/@ArtemKirsanov">Artem Kirsanov</a> teaches me about learning in machine learning.</p>
      </div>
    `,
    sectionLabel: 'Friends',
    chips: ['Image collage', 'Sketches', 'Trips', 'Future writing', 'Physics frames'],
    linksLabel: 'Links',
    links: [
      ['Emotion Archive', 'https://www.mckinsey.com/capabilities/mckinsey-design/how-we-help-clients/design-blog/the-emotion-archive-finding-global-empathy-in-a-challenging-time'],
      ['Chudi', 'https://www.patreon.com/Dreamsicle122'],
      ['Jeewoon Lee', 'https://jeewoonlee.com'],
      ['Peter White', 'https://thevineandfigtree.org/poetry/'],
      ['Michael D Angelo', 'https://mldangelo.com/'],
      ['Nate Burgdorfer', 'https://nburgdorfer.github.io/'],
      ['Keith McNulty', 'https://keithmcnulty.org/'],
      ['Dale Jacques', 'https://www.linkedin.com/in/dale-jacques/'],
      ['Andrej Maršič', 'https://www.linkedin.com/in/andrejmarsic/'],
      ['Petra Kummerova', 'https://www.linkedin.com/in/petra-kummerova-07612659/'],
      ['3Blue1Brown', 'https://www.3blue1brown.com/'],
      ['xkcd', 'https://xkcd.com/'],
      ['Tom Scott', 'https://www.tomscott.com/'],
      ['TwoSwap', 'https://www.youtube.com/@twoswap'],
      ['Acerola', 'https://www.youtube.com/@Acerola_t'],
      ['Alton Brown', 'https://www.youtube.com/@AltonBrown'],
      ['Benn Jordan', 'https://www.youtube.com/@BennJordan'],
      ['Corridor Crew', 'https://www.youtube.com/@CorridorCrew'],
      ['Dami Lee', 'https://www.youtube.com/@DamiLeeArch'],
      ['Explosions&Fire', 'https://www.youtube.com/@ExplosionsAndFire'],
      ['MinutePhysics', 'https://www.youtube.com/@MinutePhysics'],
      ['Nerdwriter', 'https://www.youtube.com/@Nerdwriter1'],
      ['Welch Labs', 'https://www.youtube.com/@WelchLabs'],
      ['Artem Kirsanov', 'https://www.youtube.com/@ArtemKirsanov']
    ],
    actions: []
  });
})();
