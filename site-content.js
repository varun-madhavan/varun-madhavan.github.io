const EXPERIENCE_PATH = 'content/experience/panels.json';
const PUBLICATIONS_PATH = 'content/publications/publications.json';

initExperience();
initPublications();

async function initExperience() {
  const root = document.getElementById('experience-root');
  if (!root) {
    return;
  }

  try {
    const data = await loadJson(EXPERIENCE_PATH, 'experience');
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      root.innerHTML = '<p class="projects-error">No experience items found in <code>content/experience/panels.json</code>.</p>';
      return;
    }

    const internships = items.filter(isInternshipExperience);
    const academicAndIndustry = items.filter((item) => !isInternshipExperience(item));

    if (academicAndIndustry.length > 0) {
      root.appendChild(renderExperienceGroup('Academic & Industry Experience', academicAndIndustry));
    }

    if (internships.length > 0) {
      root.appendChild(renderExperienceGroup('Research Internships', internships));
    }
  } catch (error) {
    root.innerHTML = `<p class="projects-error">${escapeHtml(error.message)}</p>`;
  }
}

async function initPublications() {
  const root = document.getElementById('publications-root');
  if (!root) {
    return;
  }

  try {
    const data = await loadJson(PUBLICATIONS_PATH, 'publications');
    const sections = Array.isArray(data.sections) ? data.sections : [];

    if (sections.length === 0) {
      root.innerHTML = '<p class="projects-error">No publication sections found in <code>content/publications/publications.json</code>.</p>';
      return;
    }

    sections.forEach((section) => root.appendChild(renderPublicationSection(section)));
  } catch (error) {
    root.innerHTML = `<p class="projects-error">${escapeHtml(error.message)}</p>`;
  }
}

function renderExperienceItem(item) {
  const article = document.createElement('article');
  article.className = 'experience-pane card';

  const metaParts = [item.organization, item.period].filter((value) => typeof value === 'string' && value.trim() !== '');
  const meta = metaParts.join(' | ');

  article.innerHTML = `
    <header class="project-header">
      <div>
        ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
        <h3>${escapeHtml(item.role || 'Untitled Role')}</h3>
      </div>
      <button class="btn btn-ghost project-toggle" type="button" aria-expanded="false">Expand</button>
    </header>
    ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ''}
    <div class="project-details" hidden></div>
  `;

  bindDetailLoader(article, item.detailFile, 'experience panel');
  return article;
}

function renderExperienceGroup(title, items) {
  const section = document.createElement('section');
  section.className = 'experience-group';

  section.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <div class="experience-panes"></div>
  `;

  const panes = section.querySelector('.experience-panes');
  items.forEach((item) => panes.appendChild(renderExperienceItem(item)));
  return section;
}

function isInternshipExperience(item) {
  const text = `${item?.role || ''} ${item?.summary || ''}`.toLowerCase();
  return text.includes('intern');
}

function renderPublicationSection(section) {
  const sectionEl = document.createElement('section');
  sectionEl.className = 'publications-section';

  const heading = escapeHtml(section.title || 'Publications');
  sectionEl.innerHTML = `
    <h2>${heading}</h2>
    <div class="timeline"></div>
  `;

  const timeline = sectionEl.querySelector('.timeline');
  const entries = Array.isArray(section.entries) ? section.entries : [];

  entries.forEach((entry) => timeline.appendChild(renderPublicationEntry(entry)));
  return sectionEl;
}

function renderPublicationEntry(entry) {
  const article = document.createElement('article');
  const links = Array.isArray(entry.links) ? entry.links : [];

  const linksHtml = links
    .filter((link) => typeof link?.label === 'string' && typeof link?.url === 'string')
    .map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`)
    .join('');

  article.innerHTML = `
    ${entry.meta ? `<p class="meta">${escapeHtml(entry.meta)}</p>` : ''}
    <h3>${escapeHtml(entry.title || 'Untitled Publication')}</h3>
    ${entry.authors ? `<p>${escapeHtml(entry.authors)}</p>` : ''}
    ${linksHtml ? `<div class="publication-links">${linksHtml}</div>` : ''}
    <button class="btn btn-ghost project-toggle" type="button" aria-expanded="false">Expand</button>
    <div class="project-details" hidden></div>
  `;

  bindDetailLoader(article, entry.detailFile, 'publication panel');
  return article;
}

async function loadJson(path, name) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${name} content (${response.status}). If opening files directly, run: python3 -m http.server 8000`);
  }

  return response.json();
}

function bindDetailLoader(container, detailPath, contentName) {
  const button = container.querySelector('.project-toggle');
  const details = container.querySelector('.project-details');
  let hasLoadedDetails = false;

  if (!button || !details) {
    return;
  }

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

      if (typeof detailPath !== 'string' || detailPath.trim() === '') {
        details.innerHTML = `<p class="projects-error">No detail file configured for this ${escapeHtml(contentName)}.</p>`;
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
      if (
        next.trim() === '' ||
        next.startsWith('- ') ||
        next.trim().startsWith('```') ||
        /^#{1,3}\s+/.test(next) ||
        /^!\[(.*?)\]\((.*?)\)$/.test(next.trim())
      ) {
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
