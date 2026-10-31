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
The list is sorted by year, then by optional `published: YYYY-MM-DD` dates.
For undated papers in the same year, order follows the file.

To create a dedicated page with an original abstract and a figure, add this inside
the same paper block. Upload the figure to `public/assets/papers/` first:

```yaml
    published: 2027-01-15
    overview:
      abstract: >-
        Paste the paper's original abstract here.
      abstract_source: https://doi.org/your-paper
      abstract_version: Published article
      figure:
        image: /assets/papers/your-paper.png
        number: Figure 1
        caption: The original figure caption.
        alt: A description of the figure for accessibility.
        width: 1600
        height: 900
        source: https://doi.org/your-paper
        credit: The figure's original attribution.
        license: CC BY 4.0
        license_url: https://creativecommons.org/licenses/by/4.0/
```

Use the figure's actual dimensions and licence. The paper page, overview links,
sitemap entry, and site search entry are generated automatically. Omit `overview:`
to keep a paper as a bibliography entry. An optional `preprint:` URL adds a separate
preprint link when the main `url:` points to the published article.

### Add or update a person

Duplicate a block under `people:`:

```yaml
  - id: first-last
    name: First Last
    role: PhD Student
    image: /assets/people/first-last.jpg
    bio: >-
      A short biography and research interests.
```

Upload a new portrait into `public/assets/people/` first. Optional `email:` and `website:`
fields add contact links. An optional `orcid:` URL connects a verified researcher
identity to the structured metadata. Removing the complete person block removes them from
the directory and deletes their generated profile on the next build. Prefer
stable IDs so profile and paper links keep working.

### Where images go

```text
content/lab.yml             All editable text, people, papers, and image paths
public/assets/people/       Portraits and group.jpg
public/assets/papers/       Main paper figures, named by publication ID
public/assets/brand/        logo-light.png and logo-dark.png
public/assets/research/     Optional decorative research visual for the homepage
```

Upload the image with GitHub's **Add file → Upload files**, then update its path
in `content/lab.yml`. Use lowercase filenames with hyphens. The leading `/assets/`
path maps to `public/assets/` in the repository. Paper image paths belong under
the paper's `overview.figure.image`; portraits use the person's `image` field.
`lab.logo` and optional `lab.logo_dark` control the two logo variants. The logo
switches with the active theme automatically.

`home.hero_visual` selects the optional homepage SVG. Remove that field to hide
it. The current static molecular ensemble is a conceptual drawing inspired by
the group's GNN molecular simulators and diffusion-based ensemble design, not
simulation data or a reproduced paper figure. It uses the theme's colors, stays
behind the heading area, is hidden on small screens, and is excluded from the
accessibility tree because it conveys no additional information.

### Other edits

The same YAML file contains the lab information, homepage copy, research directions,
software links, and open positions. Related reading uses publication IDs. When
removing a publication, remove its ID from any research area's `publication_ids` too.

Each entry in `research.areas` supplies both its homepage card and its full
Research section. Edit `summary` for the short card, then `question`, `description`,
and `example` for the detailed explanation. `methods` is a list of short labels.
`person_ids` links existing people, and `publication_ids` links existing papers.
Code links appear automatically when a related paper has a `code:` URL. Remove a
person's ID from research areas when removing their profile. Keep research IDs
stable so direct section links keep working. Research text is included in site search.

The homepage uses `home.title` and `home.title_secondary` for its two-part research
headline. Its introduction, research-section heading, and short supporting text
remain editable in the same YAML file.

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
node scripts/check-accessibility.mjs
npm run preview
```

Open http://127.0.0.1:4173. Rebuild after changing content or templates.
Generated files live in `dist/` and are not committed. All public page content is
rendered into HTML; JavaScript enhances search, filtering, and the mobile menu.
There is no server, database, account system, or API key to maintain.

The header has a sun/moon icon button with an accessible **Dark mode** label and
pressed state. It follows the operating-system appearance by default and responds
immediately to system changes until a visitor toggles it. The visitor's explicit
light/dark preference is saved only in this browser's `localStorage`, under
`cme-theme`; no browser permission prompt or sign-in is needed. Clearing site data
resets the preference to following the system. If storage is unavailable, the button still works for the
current page. The small initialization script applies the theme before styles render.

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

Paper pages include scholarly citation tags, DOI identifiers, original abstracts,
and figure sharing images. Organization, researcher, and publication records are
linked in the structured metadata. Search results and error pages are marked
`noindex`; the sitemap contains the public content pages. After publishing, verify
the site in Google Search Console and submit `/sitemap.xml` there.

Search Console ownership uses the public token in `lab.google_site_verification`.
The build places it in the homepage's HTML head. Keep the token after verification;
Google checks it again periodically. Changing content, adding papers, and rebuilding
the sitemap do not require submitting it again for every edit. The generated
`/sitemap.xml` is also listed in `/robots.txt`.

The palette check validates text contrast and focus/control boundary contrast in
both themes. It complements the HTML/link checks and manual keyboard and narrow
viewport review; it is not a complete accessibility audit. Preserve readable body
text, visible keyboard focus, descriptive image alternatives, and reduced-motion
support when making design changes.

If the primary domain changes, update `lab.site_url` in the YAML file. The canonical
URLs and sitemap follow that setting. The existing Technion site is linked in the
footer; domain redirects require access to that site's hosting.

## Content provenance

People, research areas, positions, publication titles, and original photographs
were migrated from https://mendelsgroup.net.technion.ac.il/ on 31 October 2026.
The biographies and positions text preserve the original website's wording, with
whitespace normalized and contact/profile URLs presented as separate links. The
homepage and research directions were rewritten at the lab's request around the
recent GNN, peptide free-energy/kinetics, diffusion, and disordered-network papers;
each research direction links to its supporting studies. The lab supplied its light logo; the dark variant is
an image-tool adaptation with light lettering and pale-blue network lines. Paper overview pages use
original abstracts and figures with source attribution and licence links. The source
version is identified explicitly: the GNN paper links to its JCTC publication but
reproduces the openly licensed arXiv abstract and figure. Software descriptions
and navigation labels are added to help visitors find the group's public resources.

The lab retains the rights to its branding, photographs, and content. Publication
links point to the publishers or preprint repositories; no paper PDFs are redistributed.
