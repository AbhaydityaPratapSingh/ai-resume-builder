const BASE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--font-family);
    color: var(--text-color);
    background: #ffffff;
    font-size: 10.5pt;
    line-height: 1.4;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 14mm 16mm;
    background: #ffffff;
  }
  h1 {
    margin: 0 0 4px 0;
    font-size: 22pt;
    color: var(--heading-color);
    letter-spacing: var(--heading-tracking, 0);
  }
  a { color: inherit; text-decoration: none; }
  .contact-line {
    font-size: 9pt;
    color: var(--muted-color);
    margin-bottom: 4px;
  }
  .resume-header {
    border-bottom: var(--header-border);
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .section { margin-bottom: 12px; }
  .section h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--heading-color);
    border-bottom: var(--section-border);
    padding-bottom: 3px;
    margin: 0 0 7px 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  .entry {
    margin-bottom: 7px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .entry-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    font-weight: 600;
  }
  .entry-title { font-size: 10.5pt; }
  .dates { font-size: 9pt; color: var(--muted-color); white-space: nowrap; }
  .entry-sub { font-size: 9pt; color: var(--muted-color); margin-top: 1px; }
  .summary { font-size: 10.5pt; margin: 0; }
  /* list-style: none — the bullet glyph is written as a literal "•" character
     in the markup instead (see renderBullets in renderBody.js), so it
     survives PDF text extraction, which a CSS ::marker does not. */
  .bullets { margin: 4px 0 0 0; padding-left: 16px; list-style: none; }
  .bullets li { font-size: 10.5pt; margin-bottom: 2px; text-indent: -12px; padding-left: 12px; }
  .skills-line { font-size: 10.5pt; margin-bottom: 2px; }
  .skills-group { font-weight: 600; }
`;

export const TEMPLATE_STYLES = {
  classic: `
    :root {
      --font-family: Georgia, 'Times New Roman', serif;
      --text-color: #1f2328;
      --heading-color: #14213d;
      --muted-color: #57606a;
      --header-border: 2px solid #14213d;
      --section-border: 1px solid #d0d7de;
    }
    ${BASE}
  `,
  modern: `
    :root {
      --font-family: 'Helvetica Neue', Arial, sans-serif;
      --text-color: #26282b;
      --heading-color: #0b6e4f;
      --muted-color: #6b7280;
      --header-border: 3px solid #0b6e4f;
      --section-border: 1px solid #e5e7eb;
      --heading-tracking: -0.01em;
    }
    ${BASE}
  `,
};
