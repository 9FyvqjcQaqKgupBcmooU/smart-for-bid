function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string) {
  let out = escapeHtml(s);
  out = out.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" class="text-cobalt underline" rel="noopener noreferrer">$1</a>');
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  return out;
}

/**
 * Tiny block-level renderer for RFQ briefings
 * (headings, bullet/numbered lists, paragraphs, **bold**, *italic*, links, simple tables).
 */
/** Hide internal <!--bid-*--> markers from supplier/buyer brief display. */
export function stripBidMarkers(md: string): string {
  return md.replace(/<!--\s*bid-[\w-]+:[^>]*-->/gi, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function renderBriefing(md: string): string {
  const lines = stripBidMarkers(md).replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let ordered = false;
  let table: string[][] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join("<br/>")}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) {
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</${tag}>`);
    }
    list = [];
    ordered = false;
  };
  const flushTable = () => {
    if (!table.length) return;
    const head = table[0];
    const body = table.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())));
    out.push(
      `<div class="overflow-x-auto"><table class="w-full text-[14px]"><thead><tr>${head
        .map((c) => `<th class="border border-line px-2 py-1 text-left">${inline(c)}</th>`)
        .join("")}</tr></thead><tbody>${body
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td class="border border-line px-2 py-1">${inline(c)}</td>`).join("")}</tr>`
        )
        .join("")}</tbody></table></div>`
    );
    table = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    const row = /^\|(.+)\|$/.exec(line.trim());
    if (!line.trim()) {
      flushPara();
      flushList();
      flushTable();
    } else if (row) {
      flushPara();
      flushList();
      table.push(row[1].split("|").map((c) => c.trim()));
    } else if (h) {
      flushPara();
      flushList();
      flushTable();
      const level = h[1].length === 3 ? "h3" : "h2";
      out.push(`<${level}>${inline(h[2])}</${level}>`);
    } else if (ul) {
      flushPara();
      flushTable();
      if (list.length && ordered) flushList();
      ordered = false;
      list.push(ul[1]);
    } else if (ol) {
      flushPara();
      flushTable();
      if (list.length && !ordered) flushList();
      ordered = true;
      list.push(ol[1]);
    } else {
      flushList();
      flushTable();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  flushTable();
  return out.join("");
}
