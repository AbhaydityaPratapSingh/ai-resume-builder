const BASE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: var(--font-family);
    color: var(--text-color);
    background: #ffffff;
    font-size: 11pt;
    line-height: 1.4;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 48px;
  }
  h1 {
    margin: 0 0 4px 0;
    font-size: 24pt;
    color: var(--heading-color);
    letter-spacing: var(--heading-tracking, 0);
  }
  .contact-line {
    font-size: 9.5pt;
    color: var(--muted-color);
    margin-bottom: 4px;
  }
  .resume-header {
    border-bottom: var(--header-border);
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .section { margin-bottom: 14px; }
  .section h2 {
    font-size: 11.5pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--heading-color);
    border-bottom: var(--section-border);
    padding-bottom: 3px;
    margin: 0 0 8px 0;
  }
  .entry { margin-bottom: 8px; }
  .entry-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    font-weight: 600;
  }
  .entry-title { font-size: 10.5pt; }
  .dates { font-size: 9.5pt; color: var(--muted-color); white-space: nowrap; }
  .entry-sub { font-size: 9.5pt; color: var(--muted-color); margin-top: 1px; }
  .summary { font-size: 10.5pt; margin: 0; }
  .bullets { margin: 4px 0 0 0; padding-left: 18px; }
  .bullets li { font-size: 10.5pt; margin-bottom: 2px; }
  .skills-line { font-size: 10.5pt; }
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
