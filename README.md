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

To move someone to the **Alumni** section, add `status: alumni` to their existing
person block and update `role:` to their former role, such as `Former MSc student`.
Their profile and publication links remain available. Alumni entries and profiles
have no portraits, so their `image:` field may be removed. Current members can omit
`status:` or use `status: current`.

`website_label:` optionally changes the contact-link text (for example, `GitHub`).
An optional `bio_sources:` list records reference URLs for maintaining a bio;
these references are not displayed as extra text in the directory.

### Where images go

```text
content/lab.yml             All editable text, people, papers, and image paths
public/assets/people/       Portraits and group.jpg
public/assets/papers/       Main paper figures, named by publication ID
public/assets/brand/        Transparent logo master and original logo variants
public/assets/research/     Optional decorative research visual for the homepage
```

Upload the image with GitHub's **Add file → Upload files**, then update its path
in `content/lab.yml`. Use lowercase filenames with hyphens. The leading `/assets/`
path maps to `public/assets/` in the repository. Paper image paths belong under
the paper's `overview.figure.image`; portraits use the person's `image` field.
`lab.logo` and optional `lab.logo_dark` control the two logo variants. The logo
switches with the active theme automatically. Both currently use
`logo-transparent.png`; CSS adapts its colors in dark mode while preserving its
alpha transparency. Header containers have no background color in any design.

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

### Contemporary academic design

The main site now uses the Contemporary theme: the latest restrained design,
with the subtle network background and the peptide-kinetics research spotlight.
It renders at the normal page URLs without a preview banner. `/contemporary/`
and `/?design=contemporary` remain available as preview links.
Every content page has a corresponding preview, with working search, publication
filters, profiles, original abstracts, figure credits, and system/saved dark mode.
Both existing ballots remain available at their original URLs.

All content still comes from `content/lab.yml`; the template is
`scripts/contemporary.mjs` and its styles are in `public/contemporary.css`.
The `/contemporary/` preview is statically `noindex` and excluded from the canonical
sitemap. Main-site pages retain their canonical URLs and indexing metadata.
The homepage reuses Atlas's subtle molecular network as a decorative background.
It follows `home.hero_visual`; remove that YAML field to hide it. Light and dark
mode use separate low opacities, with text contrast checked over the network.
Body text is 16px and secondary text is at least 14px at the default browser
font size. The preview uses relative font sizes so reader font preferences scale
the text; narrow member biographies flow beneath the portraits.

The homepage's research spotlight is edited in `home.spotlight` in `content/lab.yml`.
Set `paper_id` to an existing publication ID, then supply a short `title`, one
factual `finding`, and the result `figure` with its caption, alternative text,
dimensions, source, and license. Put the image in `public/assets/papers/`.
The paper and code links come from that publication's existing entry. Remove
the complete `home.spotlight` block to hide the feature. The original paper
overview and abstract stay in the publication entry.
The kinetics spotlight assembles original panels from Figures 1a and 2a as an
SVG. Its unmodified source images are retained in `public/assets/papers/`; run
`node scripts/compose-kinetics-spotlight.mjs` to regenerate the arrangement.

Design guardrails for future edits:

- Do not number navigation, research themes, or software for decoration.
- Use the lab's blue and teal, with no decorative gradients or glowing blobs.
- Use actual research figures with attribution, and real people photographs.
- Use lists and typographic hierarchy; avoid repeating identical icon cards.
- Keep headings and section spacing modest. Do not stretch a short introduction
  across a full screen or insert large artificial gaps between sections.
- Keep text factual. Do not invent lab history, statistics, awards, or slogans.
- Use sentence case, plain links, and limited utility icons. Avoid tiny uppercase
  labels, pill badges, arrows on every link, and animated entrances.
- Preserve visible focus, readable contrast, mobile reflow, and useful labels.

These are design choices, not a method for detecting AI authorship. Background:
[SCALR's firsthand critique](https://scalr.sg/blog/20-signs-a-website-was-made-by-ai/),
[NN/g on excessive spacing and scale](https://www.nngroup.com/articles/content-dispersion/),
and [NN/g on image/text scanning](https://www.nngroup.com/articles/zigzag-page-layout/).

### New traditional academic designs

The second set has separate, complete page layouts with conventional academic
typography, framed pages, compact navigation, and visible research information:

- `/classic/academic/` — navy university navigation and a faculty sidebar.
- `/classic/institute/` — an institutional portal with a left site menu and recent papers.
- `/classic/review/` — a journal-style masthead and a featured research article.
- `/classic/handbook/` — green tabs and an indexed research directory.

Each route mirrors every public page, including people, papers, search, and voting.
The switcher retains the current page, query, and section. Query shortcuts such as
`/?design=academic` also work. Use **Previous designs** to return to the first set.
All text, figures, people, and paper abstracts still come from `content/lab.yml`.

The new ballot is `/classic/academic/vote/` (available in all four layouts).
It uses `voting.web2` in the same YAML file and a separate poll ID and counter
endpoint. Original votes and browser reminders remain intact. New academic
previews have a static `noindex` tag and are excluded from the sitemap and search
index; the normal site's canonical URLs remain unchanged.

### Original four designs

Append a `design` query parameter to any page:

- `/?design=studio` — the original Studio sans-serif layout.
- `/?design=editorial` — warm journal styling, serif headings, and research rows.
- `/?design=atlas` — a framed technical atlas with modular grids.
- `/fieldnotes/` — a separate, question-led structure with side navigation,
  a featured study, connected projects, and a compact people directory.

The first three links open their preserved `/modern/` previews. They remain
available for comparison; the normal site uses the selected Contemporary theme.

`/?design=fieldnotes` (or `?design=4`) also opens Fieldnotes. Each normal page has
a corresponding `/fieldnotes/` preview, including profiles and paper abstracts.
Its homepage heading and introduction use `home.fieldnotes_title` and
`home.fieldnotes_introduction`. Set `home.fieldnotes_featured_paper` to the ID of
a publication with an `overview` to choose its featured study and figure.

The preview bar switches designs on the current page. Internal navigation, paper
filters, and search results retain the chosen design. Each supports the existing
system/light/dark appearance behavior. **Exit** removes the parameter and returns
to the default Studio presentation. In Fieldnotes it also removes the route prefix.
A design choice lives in the URL, so sharing
the link reproduces it without changing anybody's saved settings.

The plain URL continues to use Studio. All four share `content/lab.yml`; edits
are immediately reflected in every design. Previews use the normal page's clean
canonical URL and are marked `noindex` by the initialization script. Fieldnotes
also has a static `noindex` tag and is excluded from the sitemap and search index.
Content hashes
on CSS/JS URLs ensure future updates load the matching styling and behavior.

### Lab design vote

Share `https://mendelsresearchgroup.github.io/vote/` with labmates. The four design
previews also have a **Vote** link in their comparison bar. No sign-in is required.
The ballot remembers a random browser ID and the submitted choice in
`localStorage` under `cme-design-vote:website-design-2026-11`. It marks a vote only
after the shared counter confirms it. Retrying the same browser ID never adds a
second vote. Clearing browser data, private browsing, or changing browsers allows
another vote; this is an informal lab poll.

The lab website stays on GitHub Pages. A small separate Sites service stores the
shared totals in Cloudflare D1. The application database stores a hash of the
random browser ID, the choice, the poll ID, and submission time. It does not store
names, email addresses, or IP addresses. Hosting logs are managed separately by
the host. The public endpoint returns only aggregate totals.

Edit `voting.title` and `voting.introduction` in `content/lab.yml` to change the
ballot text. Set `voting.enabled: false` to hide the preview-bar Vote link and close
the visible ballot. `voting.endpoint` points to the shared counter. Keep
`voting.poll_id` unchanged unless starting a new poll in both the counter and the
website. The ballot and its Fieldnotes counterpart are excluded from Google
indexing, the sitemap, and site search. The counter source is maintained as the
separate **CME Lab · Website design vote** Site.

### Shared foundations

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
each research direction links to its supporting studies. The lab supplied the original logo;
the active transparent master was prepared with the image-editing tool, and CSS adapts
its colors for dark mode. Original reference files are retained. Paper overview pages use
original abstracts and figures with source attribution and licence links. The source
version is identified explicitly: the GNN paper links to its JCTC publication but
reproduces the openly licensed arXiv abstract and figure. Software descriptions
and navigation labels are added to help visitors find the group's public resources.

The lab retains the rights to its branding, photographs, and content. Publication
links point to the publishers or preprint repositories; no paper PDFs are redistributed.
