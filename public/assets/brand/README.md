# Lab logos

- **Active artwork:** `logo-transparent.png`, created from the supplied light
  logo with the built-in image-editing tool. It has an alpha background and is
  shared by the light/dark header variants. Dark mode uses a CSS color filter,
  avoiding a colored rectangle behind the logo in any of the three designs.
- The two older files below are retained as source/reference versions.

Transparent-master prompt:

> Background extraction only. Edit the provided CME Lab logo by removing its entire near-white background and making it actual alpha transparency, including all enclosed spaces inside letters and gaps between network edges and molecular ribbon shapes. Preserve the existing original logo artwork exactly: charcoal 'CME Lab', gray subtitle 'Computational Molecular' on one line and 'Engineering' on the next, thin connecting line, navy network dots and edges, and blue/teal ribbon. Do not redraw, retype, restyle, recolor, add shading, or change proportions, margins, alignment, geometry or lettering. Keep crisp flat original edges with no white matte, halos, scattered specks or background texture. Transparent PNG containing only the original logo artwork.

## Original reference versions

- `logo-light.png`: the original supplied lab logo, unchanged.
- `logo-dark.png`: a dark-background color adaptation created with the built-in
  image-editing tool. Light lettering and pale-blue network details suit the dark
  website header. This is a raster adaptation; the original remains available.

Set `lab.logo` and `lab.logo_dark` in `content/lab.yml`. The website chooses the
appropriate image automatically with its theme. Replace either file to update
the corresponding variant; use the same wide layout.

Final image-editing prompt:

> Make a dark-background color version of this exact supplied logo. Use a completely flat, solid, uniform dark navy background with hex color #111b26 across the full image. Original wide layout and identical exact lettering: 'CME Lab' in the same bold type, subtitle 'Computational Molecular' then 'Engineering' in the same lighter type. Recolor the main text to #e8f0f7, the subtitle to #b7c7d7, and the navy molecular network nodes/lines to #93c9ff; preserve the teal and blue folded ribbon. Preserve all geometry, spacing, size relationships, thin dividing line, and typography from the original. Render crisp, clean, flat, print-quality vector-like edges against the solid navy. Absolutely no transparency, no textured pixels, no white halos, no embossing, outlines around letters, glow, shadows, or extra decoration. This is a faithful color variant of an existing scientific logo, not a new logo. Full wide logo with minimal original margins, uncropped.
