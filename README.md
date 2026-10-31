# CME Lab · Mendels Research Group

The Computational Molecular Engineering Lab website at the Technion.

**Website:** https://mendelsresearchgroup.github.io/

## Update the website in one file

Open [`content/lab.yml`](content/lab.yml), click GitHub's pencil icon, edit, and commit.
GitHub Actions validates the content, builds the pages, and publishes the website.
The deployment normally takes a few minutes. Check the **Actions** tab for progress.

YAML is a readable format: field names followed by values, with two spaces of
indentation. There are no JSON braces or commas. Comments begin with `#`.
Keep indentation, and quote a short value if it contains a colon followed by a space.
Long paragraphs use `>-`, with the text indented underneath.

### Add a paper

Duplicate a block under `publications:` and replace its values:

```yaml
  - id: a-short-unique-name-2027
    title: Your paper title
    authors: First Author, Second Author, Dan Mendels
    year: 2027
    venue: Journal name
    type: Article
    url: https://doi.org/your-paper
```

Use `Preprint` for a preprint. An optional `code:` URL adds a repository link.
The list is sorted by year; order within a year follows the file.

To create a dedicated summary page, add this inside the same paper block:

```yaml
    summary:
      headline: A short, accessible headline.
      question: The question your paper addresses.
      approach: >-
        Briefly describe the method and the system studied.
      finding: >-
        Explain the main result without overstating the evidence.
      significance: >-
        Explain the value of the result and its scope or limitations.
      source: https://doi.org/your-paper
```

The paper page, summary links, sitemap entry, and site search entry are generated
automatically. Omit the `summary:` block to keep a paper as a bibliography entry.

### Add or update a person

Duplicate a block under `people:`:

```yaml
  - id: first-last
    name: First Last
    role: PhD Student
    image: /assets/first-last.jpg
    bio: >-
      A short biography and research interests.
```

Upload a new portrait into `public/assets/` first. Optional `email:` and `website:`
fields add contact links. Removing the complete person block removes them from
the directory and deletes their generated profile on the next build. Prefer
stable IDs so profile and paper links keep working.

### Other edits

The same YAML file contains the lab information, homepage copy, research directions,
software links, and open positions. Related reading uses publication IDs. When
removing a publication, remove its ID from any research area's `publication_ids` too.

## If a build fails

The previous successful deployment stays online. Open the failed **Actions** run
and the **Validate content and build all pages** step. Errors identify the content
field, a missing image, or the YAML line to fix. Correct the file and commit again.
GitHub also lets you revert a content commit from its history.

## Local development

Node.js 24 is used in deployment; Node.js 22 or newer is supported locally.

```sh
npm ci
npm run build
node scripts/check.mjs
npm run preview
```

Open http://127.0.0.1:4173. Rebuild after changing content or templates.
Generated files live in `dist/` and are not committed. All public page content is
rendered into HTML; JavaScript enhances search, filtering, and the mobile menu.
There is no server, database, account system, or API key to maintain.

## GitHub Pages setup

This repository must be named `MendelsResearchGroup.github.io`.
In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
The workflow in `.github/workflows/pages.yml` handles deployment on commits to `main`;
pull requests build and validate without deploying. No personal token is required.

## Design and discoverability

The site uses the supplied CME logo, bold sans-serif typography, real group
photography, responsive layouts, and descriptive navigation. It includes canonical
URLs, metadata for sharing, structured organization/person/publication data,
a sitemap, accessible labels, and keyboard focus styles. Search engines can crawl
the core content without JavaScript. Indexing and search rankings are not guaranteed.

If the primary domain changes, update `lab.site_url` in the YAML file. The canonical
URLs and sitemap follow that setting. The existing Technion site is linked in the
footer; domain redirects require access to that site's hosting.

## Content provenance

People, research areas, positions, publication titles, and original photographs
were migrated from https://mendelsgroup.net.technion.ac.il/ on 31 October 2026.
The homepage, research introduction, biographies, and positions text preserve the
original website's wording, with whitespace normalized and contact/profile URLs
presented as separate links. The lab supplied its logo. Paper summaries are new
content, paraphrased from their linked primary sources and explicitly labeled as
research summaries. Preprints are identified explicitly. Software descriptions
and navigation labels are added to help visitors find the group's public resources.

The lab retains the rights to its branding, photographs, and content. Publication
links point to the publishers or preprint repositories; no paper PDFs are redistributed.
