# Varun Madhavan Personal Website

A modern academic personal website focused on AI for materials discovery, agentic workflows, and heterogeneous catalysis.

## Local preview

Use a local web server:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/research.html`

Note: dynamic pages load content from the `content/` directory, which requires serving files over HTTP.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Go to your repository `Settings` -> `Pages`.
3. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
4. Save and wait about 1-2 minutes.
5. Your site will be live at:
   - `https://<your-github-username>.github.io/<repo-name>/` for a project repository
   - `https://<your-github-username>.github.io/` if this repo is named `<your-github-username>.github.io`

## Files

- `index.html` - Homepage content
- `research.html` - Dedicated research page
- `publications.html` - Dedicated publications page
- `site-content.js` - Loads experience and publication content from JSON files
- `styles.css` - Styling and responsive layout
- `assets/CV_VarunMadhavan_2025.pdf` - Downloadable CV

## Updating content quickly

You can now update these sections without editing page HTML:

- `content/research/projects.json` + files in `content/research/projects/` - Research projects
- `content/experience/panels.json` + files in `content/experience/panels/` - Homepage "Academic & Industry Experience" panels
- `content/publications/publications.json` + files in `content/publications/entries/` - Publications panels

For experience and publications, each panel now supports a `detailFile` field that points to a dedicated Markdown file (same pattern as research projects).
