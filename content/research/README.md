# Research Content System

The Research page is driven by:

- `content/research/projects.json` (section list + project metadata)
- `content/research/projects/*.md` (long-form details per project)
- Optional images in `assets/research/<project-slug>/`

## Update Existing Projects

1. Find the section in `projects.json` and edit your project entry:
   - `title`
   - `period`
   - `summary`
   - `tags`
2. Edit that project's markdown file to add long-form content.
3. Add images in `assets/research/<project-slug>/` and reference them in markdown:

```md
![Short caption](assets/research/<project-slug>/figure-1.png)
```

## Add a New Project

1. Create a new markdown file in `content/research/projects/`, for example:
   - `my-new-project.md`
2. Add a new object inside a section's `projects` array in `projects.json` with:
   - unique `slug`
   - `title`, `period`, `summary`
   - `detailFile` pointing to the markdown file
   - optional `tags`

## Add a New Section

Add a new section object in `projects.json` under `sections`:

- `id` (unique identifier)
- `title` (section heading, for example `Summer Research`)
- `description` (optional short subtitle)
- `projects` (array of project objects)

## Local Preview

Because project content is loaded from files, preview with a local web server:

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000/research.html`
