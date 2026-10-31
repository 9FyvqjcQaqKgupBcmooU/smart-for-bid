"use server";

const MAX_BYTES = 10 * 1024 * 1024;

function htmlToMarkdown(html: string): string {
  let s = html.replace(/\r\n?/g, "\n");
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n");
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n");
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n");
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|tr)>/gi, "\n\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

export type ImportBriefResult =
  | { ok: true; markdown: string; filename: string }
  | { ok: false; error: string };

export async function importBriefDocument(formData: FormData): Promise<ImportBriefResult> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (max. 10 Mo)." };
  }
  const name = file.name || "document";
  const lower = name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    if (lower.endsWith(".md") || lower.endsWith(".txt")) {
      return { ok: true, markdown: buf.toString("utf8"), filename: name };
    }
    if (lower.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ buffer: buf });
      const md = htmlToMarkdown(result.value || "");
      if (!md.trim()) return { ok: false, error: "Le document Word ne contient pas de texte extractible." };
      return { ok: true, markdown: md, filename: name };
    }
    if (lower.endsWith(".doc")) {
      return {
        ok: false,
        error: "Le format .doc (Word 97-2003) n'est pas supporté. Enregistrez en .docx ou .pdf.",
      };
    }
    if (lower.endsWith(".pdf")) {
      // pdf-parse v2 default export
      const mod: any = await import("pdf-parse");
      const pdfParse = mod.default || mod;
      const parsed = await pdfParse(buf);
      const text = String(parsed.text || "").replace(/\r\n?/g, "\n").trim();
      if (!text) return { ok: false, error: "Le PDF ne contient pas de texte extractible." };
      return { ok: true, markdown: text, filename: name };
    }
    return { ok: false, error: "Format non supporté. Utilisez PDF, DOCX, TXT ou MD." };
  } catch (e) {
    console.error("importBriefDocument", e);
    return { ok: false, error: "Impossible d'extraire le contenu de ce fichier." };
  }
}
