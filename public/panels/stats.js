(() => {
  const registry = window.portfolioPanelFactories = window.portfolioPanelFactories || {};
  registry.stats = () => ({
    coord: { x: 0, y: -1 },
    eyebrow: '',
    title: 'Stats',
    summary:
      'Small personal stats, books, coffee, travel, tools, and a few tiny signals about how I spend my time. Plus an OpenTTD-inspired interactive train simulation.',
    storyHtml: `
      <div class="stat-list">
        <div class="stat-line"><span>Current age</span><strong><span class="live-age" data-live-age></span></strong></div>
        <div class="stat-line"><span>Days Worked at Current Job:</span><strong><span class="live-work-days" data-live-work-days></span></strong></div>
        <div class="stat-line"><span>Caffeine tolerance</span><strong>6 shots of espresso</strong></div>
        <div class="stat-line"><span>Computers broken</span><strong>2</strong></div>
        <div class="stat-line"><span>Movie I have cried the most to</span><strong>Ratatouille</strong></div>
        <div class="stat-line"><span>Countries visited</span><strong>America, Mexico, Japan, Czechia, South Korea, Germany, UK, Spain</strong></div>
      </div>
      <p>I enjoy reading books and poetry. I minored in American Poetry, and I always recommend <a href="https://www.poetryfoundation.org/poems/45477/song-of-myself-1892-version"><em>Song of Myself</em></a> by Walt Whitman and <em>Spring and All</em> (<a href="https://www.poetryfoundation.org/poems/148465/spring-and-all-xxv-somebody-dies-every-four-minutes">Excerpt</a>) by William Carlos Williams to people. <a href="https://www.goodreads.com/user/show/158297784-brenden-b">Check out my Goodreads.</a></p>
      <p>Music listening history lives on <a href="https://www.last.fm/user/brenbrus">Last.fm</a>. I love hiking, and I used to rock climb. I also like gouache, watercolors, MUJI A6 spiral notebooks, and Pigma Micron pens.</p>
      <p><a href="#art">Projects and Writting collects art, writing, friends, mentors, and the people whose work keeps me learning.</a></p>
    `,
    sectionLabel: 'Tiny Signals',
    chips: ['Live age', 'Coffee', 'Books', 'Travel', 'Notebooks'],
    linksLabel: 'Links',
    links: [
      ['Song of Myself', 'https://www.poetryfoundation.org/poems/45477/song-of-myself-1892-version'],
      ['Spring and All (Excerpt)', 'https://www.poetryfoundation.org/poems/148465/spring-and-all-xxv-somebody-dies-every-four-minutes'],
      ['Projects and Writting', '#art'],
      ['Goodreads', 'https://www.goodreads.com/user/show/158297784-brenden-b'],
      ['Last.fm', 'https://www.last.fm/user/brenbrus']
    ],
    actions: []
  });
})();
