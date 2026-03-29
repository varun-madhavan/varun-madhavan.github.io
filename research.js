const PROJECT_INDEX_PATH = 'content/research/projects.json';

const root = document.getElementById('projects-root');

init();

async function init() {
  if (!root) {
    return;
  }

  try {
    const response = await fetch(PROJECT_INDEX_PATH);
    if (!response.ok) {
      throw new Error(`Unable to load project index: ${response.status}`);
    }

    const data = await response.json();
    const sections = normalizeSections(data);
    if (!Array.isArray(sections) || sections.length === 0) {
      root.innerHTML = '<p class="projects-error">No projects found. Add entries in <code>content/research/projects.json</code>.</p>';
      return;
    }

    sections.forEach((section) => root.appendChild(renderProjectSection(section)));
  } catch (error) {
    root.innerHTML = `
      <div class="projects-error card">
        <h3>Could not load project content</h3>
        <p>${escapeHtml(error.message)}</p>
        <p>If you are opening this site directly from files, run a local server first:</p>
        <pre><code>python3 -m http.server 8000</code></pre>
      </div>
    `;
  }
}

function normalizeSections(data) {
  if (Array.isArray(data)) {
    return [{ title: 'Projects', projects: data }];
  }

  if (data && Array.isArray(data.sections)) {
    return data.sections.filter((section) => Array.isArray(section.projects) && section.projects.length > 0);
  }

  return [];
}

function renderProjectSection(section) {
  const container = document.createElement('section');
  container.className = 'project-section';

  const safeTitle = escapeHtml(section.title || 'Projects');
  const safeDescription =
    typeof section.description === 'string' && section.description.trim() !== ''
      ? `<p class="project-section-description">${escapeHtml(section.description)}</p>`
      : '';

  container.innerHTML = `
    <header class="project-section-header">
      <h3>${safeTitle}</h3>
      ${safeDescription}
    </header>
    <div class="project-section-grid"></div>
  `;

  const grid = container.querySelector('.project-section-grid');
  section.projects.forEach((project) => grid.appendChild(renderProjectCard(project)));
  return container;
}

function renderProjectCard(project) {
  const article = document.createElement('article');
  article.className = 'card project-card';

  const tagHtml = Array.isArray(project.tags)
    ? project.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')
    : '';

  article.innerHTML = `
    <header class="project-header">
      <div>
        <h3>${escapeHtml(project.title || 'Untitled Project')}</h3>
        ${project.period ? `<p class="meta">${escapeHtml(project.period)}</p>` : ''}
      </div>
      <button class="btn btn-ghost project-toggle" type="button" aria-expanded="false">Expand</button>
    </header>
    ${project.summary ? `<p class="project-summary">${escapeHtml(project.summary)}</p>` : ''}
    ${tagHtml ? `<ul class="project-tags">${tagHtml}</ul>` : ''}
    <div class="project-details" hidden></div>
  `;

  const button = article.querySelector('.project-toggle');
  const details = article.querySelector('.project-details');
  let hasLoadedDetails = false;

  button.addEventListener('click', async () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'Expand';
      details.hidden = true;
      return;
    }

    if (!hasLoadedDetails) {
      details.innerHTML = '<p class="meta">Loading details...</p>';
      details.hidden = false;

      const detailPath = project.detailFile;
      if (typeof detailPath !== 'string' || detailPath.trim() === '') {
        details.innerHTML = '<p class="projects-error">No detail file configured for this project.</p>';
      } else {
        try {
          const detailResponse = await fetch(detailPath);
          if (!detailResponse.ok) {
            throw new Error(`Unable to load ${detailPath}: ${detailResponse.status}`);
          }

          const markdown = await detailResponse.text();
          details.innerHTML = `<div class="markdown-body">${markdownToHtml(markdown)}</div>`;
          hasLoadedDetails = true;
        } catch (error) {
          details.innerHTML = `<p class="projects-error">${escapeHtml(error.message)}</p>`;
        }
      }
    }

    button.setAttribute('aria-expanded', 'true');
    button.textContent = 'Collapse';
    details.hidden = false;
  });

  return article;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];

  let i = 0;
  let inCode = false;
  let codeBuffer = [];

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeBuffer = [];
      } else {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        inCode = false;
      }
      i += 1;
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      i += 1;
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const imageMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      const alt = escapeHtml(imageMatch[1]);
      const src = escapeHtml(imageMatch[2]);
      html.push(`<figure><img src="${src}" alt="${alt}" loading="lazy" /></figure>`);
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 4);
      html.push(`<h${level}>${formatInline(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(`<li>${formatInline(lines[i].slice(2).trim())}</li>`);
        i += 1;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    const paragraphLines = [line.trim()];
    i += 1;

    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === '' || next.startsWith('- ') || next.trim().startsWith('```') || /^#{1,3}\s+/.test(next) || /^!\[(.*?)\]\((.*?)\)$/.test(next.trim())) {
        break;
      }
      paragraphLines.push(next.trim());
      i += 1;
    }

    html.push(`<p>${formatInline(paragraphLines.join(' '))}</p>`);
  }

  return html.join('');
}

function formatInline(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return output;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
