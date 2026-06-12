/** Minimal, safe markdown-to-HTML for generated copy (headings, bold, lists). */
export function renderMd(src: string): string {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = esc.split('\n');
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (/^###\s+/.test(t)) {
      closeList();
      out.push(`<h3>${inline(t.replace(/^###\s+/, ''))}</h3>`);
    } else if (/^##\s+/.test(t)) {
      closeList();
      out.push(`<h2>${inline(t.replace(/^##\s+/, ''))}</h2>`);
    } else if (/^#\s+/.test(t)) {
      closeList();
      out.push(`<h2>${inline(t.replace(/^#\s+/, ''))}</h2>`);
    } else if (/^[-*]\s+/.test(t)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(t.replace(/^[-*]\s+/, ''))}</li>`);
    } else if (t === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(t)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

function inline(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
