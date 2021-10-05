/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Safient Contract JS',
  tagline:
    'JavaScript SDK to manage and interact with the safient contracts (Claims, Incentivization) on Safient protocol',
  url: 'https://docs.safient.io',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  favicon: 'img/favicon.ico',
  organizationName: 'safient', // Usually your GitHub org/user name.
  projectName: 'safient-contract-js', // Usually your repo name.
  themeConfig: {
    navbar: {
      logo: {
        alt: 'Safient',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          href: 'https://blog.consensolabs.com/tag/safient',
          label: 'Blog',
          position: 'right',
        },
        {
          href: 'https://safient.io',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://github.com/safient',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Safient',
          items: [
            {
              href: 'https://docs.safient.io/safient-basics/basics',
              label: 'Basics',
            },
            {
              href: 'https://docs.safient.io/roadmap',
              label: 'Roadmap',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.safient.io',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/safient',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              href: 'https://blog.consensolabs.com/tag/safient',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/safient',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Safient. Built with Docusaurus.`,
    },
    algolia: {
      apiKey: '6badda78379280a9cc4a22a2500da66a',
      indexName: 'safient_DOCS',
      // Optional: see doc section below
      contextualSearch: true,
      // Optional: see doc section below
      appId: '1Z67YD0ZOD',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/safient/safient-contract-js/edit/master/',
          routeBasePath: '/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
      },
    ],
  ],
};
