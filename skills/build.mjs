#!/usr/bin/env node
// Gera, a partir de skills/skills.json, o conteúdo ESTÁTICO da página /skills/:
//  - cards do catálogo em HTML (crawlers de IA não executam JS; o Google indexa mais rápido)
//  - JSON-LD (CollectionPage + ItemList de SoftwareApplication, HowTo, FAQPage, Breadcrumb)
//  - llms.txt na raiz do site
// Rodar sempre que skills.json mudar:  node skills/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const catalog = JSON.parse(readFileSync(join(here, "skills.json"), "utf8"));
const SITE = "https://luizsiqueira.com.br";
const PAGE = `${SITE}/skills/`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const skills = [...catalog.skills].sort((a, b) => (b.added || "").localeCompare(a.added || ""));

// ---------- cards estáticos (mesmo markup que o JS produz) ----------
const cards = skills.map((s) => {
  const cmd = `npx ${catalog.package} add ${s.name}`;
  return `          <article class="skill" id="${esc(s.name)}">
            <div class="top">
              <h3>${esc(s.title || s.name)}</h3>
              ${s.category ? `<span class="cat">${esc(s.category)}</span>` : ""}
            </div>
            <p class="slug">${esc(s.name)}</p>
            <p class="desc">${esc(s.description)}</p>
            <div class="skill-tags">${(s.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
            <div class="install">
              <code>${esc(cmd)}</code>
              <button type="button" class="copy" data-cmd="${esc(cmd)}" aria-label="Copiar comando de instalação">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>
                Copiar</button>
            </div>
            <div class="skill-links">
              <a href="/skills/${esc(s.name)}/">Ver detalhes &rsaquo;</a>
            </div>
          </article>`;
}).join("\n");

// ---------- JSON-LD ----------
const author = { "@type": "Person", "name": "Luiz Siqueira", "url": SITE, "sameAs": ["https://github.com/luizsiqueira-eng", "https://www.npmjs.com/package/@luizsiqueira/skills", "https://www.linkedin.com/in/luizs", "https://www.instagram.com/luizsiqueira.s"] };
const jsonld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": PAGE,
      "url": PAGE,
      "name": "Skills para agentes de IA",
      "description": "Skills públicas para Claude Code e outros agentes de IA: fluxos de engenharia prontos (Git Flow, quadro do time em Jira/Trello, segurança web, segundo cérebro no Obsidian), instaláveis com um comando npx.",
      "inLanguage": "pt-BR",
      "isPartOf": { "@type": "WebSite", "url": SITE, "name": "Luiz Siqueira" },
      "author": author,
      "mainEntity": { "@id": `${PAGE}#lista` }
    },
    {
      "@type": "ItemList",
      "@id": `${PAGE}#lista`,
      "name": "Catálogo de skills",
      "numberOfItems": skills.length,
      "itemListElement": skills.map((s, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "SoftwareApplication",
          "@id": `${PAGE}#${s.name}`,
          "name": s.title || s.name,
          "alternateName": s.name,
          "description": s.description,
          "applicationCategory": "DeveloperApplication",
          "applicationSubCategory": "Skill para agente de IA (Claude Code)",
          "operatingSystem": "macOS, Linux, Windows",
          "softwareVersion": undefined,
          "keywords": (s.tags || []).join(", "),
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" },
          "license": "https://opensource.org/licenses/MIT",
          "installUrl": `https://www.npmjs.com/package/${catalog.package}`,
          "downloadUrl": `${catalog.repo}/tree/main/skills/${s.name}`,
          "codeRepository": catalog.repo,
          "url": `${catalog.repo}/blob/main/skills/${s.name}/SKILL.md`,
          "datePublished": s.added,
          "author": author
        }
      }))
    },
    {
      "@type": "HowTo",
      "name": "Como instalar uma skill no Claude Code",
      "description": "Três passos para instalar qualquer skill do catálogo no seu projeto.",
      "totalTime": "PT1M",
      "step": [
        { "@type": "HowToStep", "position": 1, "name": "Escolha uma skill", "text": "No catálogo, escolha a skill e clique em Copiar para copiar o comando de instalação." },
        { "@type": "HowToStep", "position": 2, "name": "Cole no Claude Code", "text": "Cole o comando no Claude Code do seu projeto e peça \"instale essa skill\", ou rode o comando direto no terminal na pasta do projeto." },
        { "@type": "HowToStep", "position": 3, "name": "Pronto", "text": "A skill é copiada para .claude/skills/ e o Claude Code passa a usá-la automaticamente quando a tarefa combinar." }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "O que é uma skill para agente de IA?", "acceptedAnswer": { "@type": "Answer", "text": "É uma pasta com um arquivo SKILL.md: instruções que o agente (como o Claude Code) carrega automaticamente quando a tarefa combina com a descrição. Uma skill ensina o agente a seguir um fluxo de trabalho do jeito certo, sem você precisar explicar toda vez." } },
        { "@type": "Question", "name": "Como instalo uma skill?", "acceptedAnswer": { "@type": "Answer", "text": `Na pasta do seu projeto, rode npx ${catalog.package} add <nome-da-skill>. A skill vai para .claude/skills/. Use --global para instalar em todos os seus projetos ou --all para instalar todas de uma vez.` } },
        { "@type": "Question", "name": "As skills são gratuitas?", "acceptedAnswer": { "@type": "Answer", "text": "Sim. Código aberto sob licença MIT, publicado no npm e no GitHub. Você pode usar, adaptar e contribuir." } },
        { "@type": "Question", "name": "Funciona só com Claude Code?", "acceptedAnswer": { "@type": "Answer", "text": "As skills seguem o formato do Claude Code (SKILL.md com frontmatter), mas o conteúdo é markdown puro: qualquer agente que aceite instruções em arquivo pode usar o texto como base." } },
        { "@type": "Question", "name": "As skills citam alguma empresa ou ferramenta específica?", "acceptedAnswer": { "@type": "Answer", "text": "Não. São neutras: descrevem práticas de mercado (Git Flow, code review, OWASP) e terminam com uma seção \"Adaptando ao seu time\" com os poucos pontos que mudam entre times." } }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Luiz Siqueira", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "Skills", "item": PAGE }
      ]
    }
  ]
};
const jsonldText = JSON.stringify(jsonld, (k, v) => (v === undefined ? undefined : v), 2);

// ---------- FAQ visível (mesmo conteúdo do FAQPage) ----------
const faqHtml = jsonld["@graph"][3].mainEntity.map((q) => `          <details class="faq-item">
            <summary>${esc(q.name)}</summary>
            <p>${esc(q.acceptedAnswer.text)}</p>
          </details>`).join("\n");

// ---------- injeta entre marcadores ----------
function inject(html, tag, content) {
  const start = `<!-- ${tag}:start -->`, end = `<!-- ${tag}:end -->`;
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < 0) throw new Error(`marcador ${tag} não encontrado`);
  return html.slice(0, a + start.length) + "\n" + content + "\n        " + html.slice(b);
}
const pagePath = join(here, "index.html");
let html = readFileSync(pagePath, "utf8");
html = inject(html, "skills:static", cards);
html = inject(html, "skills:faq", faqHtml);
html = inject(html, "skills:jsonld", `    <script type="application/ld+json">\n${jsonldText}\n    </script>`);
writeFileSync(pagePath, html);

// ---------- llms.txt ----------
const llms = `# Luiz Siqueira — Skills para agentes de IA

> Skills públicas (código aberto, MIT) para Claude Code e outros agentes de IA: fluxos de engenharia prontos, neutros de empresa, instaláveis com um comando.

Site: ${SITE}
Catálogo: ${PAGE}
Catálogo em JSON: ${SITE}/skills/skills.json
Pacote npm: https://www.npmjs.com/package/${catalog.package}
Repositório: ${catalog.repo}
Instalar: npx ${catalog.package} add <skill>

## Skills
${skills.map((s) => `- [${s.title || s.name}](${catalog.repo}/blob/main/skills/${s.name}/SKILL.md): ${s.description} Comando: npx ${catalog.package} add ${s.name}. Tags: ${(s.tags || []).join(", ")}.`).join("\n")}

## Conteúdo bruto (markdown)
${skills.map((s) => `- https://raw.githubusercontent.com/luizsiqueira-eng/skills/main/skills/${s.name}/SKILL.md`).join("\n")}
- README: https://raw.githubusercontent.com/luizsiqueira-eng/skills/main/README.md

## Sobre o autor
- Luiz Siqueira, Líder de Engenharia de Software. Palestrante sobre liderança de engenharia, times de alta performance e IA.
- ${SITE}/#sobre
`;
writeFileSync(join(root, "llms.txt"), llms);

// ---------- páginas por skill: /skills/<nome>/ com o SKILL.md completo ----------
// Conteúdo profundo e indexável por skill (uma URL por skill, com TechArticle + SoftwareApplication).
// Fonte: SKILL.md no branch main do repositório; render via API de markdown do GitHub (gh api).
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";

const RAW = "https://raw.githubusercontent.com/luizsiqueira-eng/skills/main/skills";
const tpl = readFileSync(join(here, "index.html"), "utf8");
const head = tpl.slice(tpl.indexOf("<style>"), tpl.indexOf("</style>") + 8); // reaproveita o CSS da página
const header = tpl.slice(tpl.indexOf("<header>"), tpl.indexOf("</header>") + 9).replace('href="/skills/" class="active"', 'href="/skills/" class="active"');
const footer = tpl.slice(tpl.indexOf("<footer>"), tpl.indexOf("</footer>") + 9);

function fetchText(url) {
  return execFileSync("curl", ["-sfL", url], { encoding: "utf8" });
}
function renderMarkdown(md) {
  // gh api /markdown → HTML sanitizado pelo GitHub (tabelas, código, listas)
  return execFileSync("gh", ["api", "/markdown", "-f", "mode=markdown", "-f", `text=${md}`], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}
function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

let pages = 0;
for (const s of skills) {
  let md;
  try { md = fetchText(`${RAW}/${s.name}/SKILL.md`); } catch { console.warn(`aviso: não baixei SKILL.md de ${s.name}; página não gerada`); continue; }
  const body = renderMarkdown(stripFrontmatter(md))
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/, "") // o título já vai no hero
    .replace(/<a href="#/g, '<a href="#'); // âncoras internas funcionam como estão
  const cmd = `npx ${catalog.package} add ${s.name}`;
  const url = `${PAGE}${s.name}/`;
  const title = `${s.title || s.name} — skill para Claude Code | Luiz Siqueira`;
  const desc = `${s.description} Instale com ${cmd}. Skill gratuita (MIT) para Claude Code e agentes de IA.`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", "@id": url, "headline": s.title || s.name, "description": s.description, "inLanguage": "pt-BR", "url": url,
        "datePublished": s.added, "dateModified": new Date().toISOString().slice(0, 10), "author": author, "publisher": author,
        "keywords": (s.tags || []).join(", "), "isPartOf": { "@id": PAGE }, "about": { "@id": `${PAGE}#${s.name}` },
        "image": `${SITE}/og-skills-v2.jpg` },
      { "@type": "SoftwareApplication", "@id": `${PAGE}#${s.name}`, "name": s.title || s.name, "alternateName": s.name, "description": s.description,
        "applicationCategory": "DeveloperApplication", "operatingSystem": "macOS, Linux, Windows", "isAccessibleForFree": true,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" }, "license": "https://opensource.org/licenses/MIT",
        "installUrl": `https://www.npmjs.com/package/${catalog.package}`, "codeRepository": catalog.repo,
        "url": url, "sameAs": `${catalog.repo}/blob/main/skills/${s.name}/SKILL.md`, "datePublished": s.added, "author": author },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Luiz Siqueira", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "Skills", "item": PAGE },
        { "@type": "ListItem", "position": 3, "name": s.title || s.name, "item": url } ] }
    ]
  };
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <!-- Google Analytics (GA4) -->
    <script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-ZJZ3DD90KN');window.addEventListener('load',function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-ZJZ3DD90KN';document.head.appendChild(s);});</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="author" content="Luiz Siqueira" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(s.title || s.name)} — skill para Claude Code" />
    <meta property="og:description" content="${esc(s.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}/og-skills-v2.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Luiz Siqueira" />
    <meta property="og:locale" content="pt_BR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE}/og-skills-v2.jpg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#0b0e14" />
    <link rel="preload" as="font" type="font/woff2" href="/fonts/inter-700.woff2" crossorigin />
    <link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossorigin />
    ${head}
    <style>
      .doc-hero { background: var(--navy); color: #fff; padding: 3.2rem 0 2.6rem; }
      .crumbs { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-bottom: 1rem; }
      .crumbs a { color: rgba(255,255,255,0.8); } .crumbs a:hover { color: #fff; }
      .doc-hero h1 { font-size: 2.3rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 0.5rem; }
      .doc-hero .slug { font-family: var(--mono); color: #9db8ff; font-size: 0.95rem; }
      .doc-hero .lead { margin-top: 0.9rem; color: rgba(255,255,255,0.78); font-size: 1.1rem; max-width: 60ch; }
      .doc-hero .cmd { margin-top: 1.4rem; max-width: 720px; }
      .doc-meta { display: flex; gap: 1.4rem; flex-wrap: wrap; margin-top: 1rem; font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .doc-meta a { color: rgba(255,255,255,0.85); border-bottom: 1px solid rgba(255,255,255,0.3); }
      .doc { padding: 3rem 0 4rem; }
      .doc .md { max-width: 820px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 2rem 2.4rem; }
      .md h2 { font-size: 1.45rem; margin: 2rem 0 0.8rem; color: var(--heading); padding-top: 1.2rem; border-top: 1px solid var(--line); }
      .md h2:first-child { border-top: 0; margin-top: 0; padding-top: 0; }
      .md h3 { font-size: 1.1rem; margin: 1.5rem 0 0.6rem; color: var(--heading); }
      .md p, .md li { line-height: 1.7; } .md ul, .md ol { padding-left: 1.4rem; } .md li { margin: 0.3rem 0; }
      .md code { font-family: var(--mono); font-size: 0.88em; background: var(--bg); padding: 0.1em 0.4em; border-radius: 4px; }
      .md pre { background: var(--navy); color: #d7dce5; border-radius: 8px; padding: 1rem 1.1rem; overflow-x: auto; font-size: 0.85rem; line-height: 1.6; }
      .md pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
      .md table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.92rem; display: block; overflow-x: auto; }
      .md th, .md td { border: 1px solid var(--line); padding: 0.55rem 0.7rem; text-align: left; vertical-align: top; }
      .md th { background: var(--bg); font-weight: 600; }
      .md blockquote { margin: 1rem 0; padding: 0.6rem 1rem; border-left: 3px solid var(--accent); background: var(--bg); color: var(--text); }
      .md a { color: var(--accent); } .md a:hover { text-decoration: underline; }
      .md input[type=checkbox] { margin-right: 0.4rem; }
      .doc-nav { margin-top: 2rem; display: flex; gap: 1.4rem; flex-wrap: wrap; font-size: 0.95rem; font-weight: 600; }
      .doc-nav a { color: var(--accent); }
      @media (max-width: 768px) { .doc-hero h1 { font-size: 1.7rem; } .doc .md { padding: 1.4rem 1.2rem; } }
    </style>
    <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
    </script>
  </head>
  <body>
    ${header}

    <section class="doc-hero">
      <div class="wrap">
        <nav class="crumbs" aria-label="Você está em"><a href="/">Luiz Siqueira</a> › <a href="/skills/">Skills</a> › ${esc(s.title || s.name)}</nav>
        <h1>${esc(s.title || s.name)}</h1>
        <p class="slug">${esc(s.name)}${s.category ? ` · ${esc(s.category)}` : ""}</p>
        <p class="lead">${esc(s.description)}</p>
        <div class="cmd"><code>${esc(cmd)}</code><button type="button" class="copy ghost" data-cmd="${esc(cmd)}" aria-label="Copiar comando">Copiar</button></div>
        <div class="doc-meta">
          <span>Gratuita · MIT</span>
          <a href="${esc(catalog.repo)}/blob/main/skills/${esc(s.name)}/SKILL.md" target="_blank" rel="noopener">Ver no GitHub</a>
          <a href="https://www.npmjs.com/package/${esc(catalog.package)}" target="_blank" rel="noopener">npm</a>
          ${s.added ? `<span>Publicada em ${esc(s.added)}</span>` : ""}
        </div>
      </div>
    </section>

    <section class="doc">
      <div class="wrap">
        <article class="md">
${body}
        </article>
        <nav class="doc-nav">
          <a href="/skills/">← Todas as skills</a>
          ${skills.filter((x) => x.name !== s.name).map((x) => `<a href="/skills/${esc(x.name)}/">${esc(x.title || x.name)}</a>`).join("\n          ")}
        </nav>
      </div>
    </section>

    ${footer}
    <script>
      document.querySelectorAll(".copy").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          try { await navigator.clipboard.writeText(btn.dataset.cmd); btn.textContent = "Copiado!"; if (typeof gtag === "function") gtag("event", "copy_install", { skill: "${esc(s.name)}" }); setTimeout(function () { btn.textContent = "Copiar"; }, 1800); }
          catch (e) { window.prompt("Copie o comando:", btn.dataset.cmd); }
        });
      });
      const menuToggle = document.querySelector(".menu-toggle"), menu = document.querySelector("header nav");
      if (menuToggle && menu) menuToggle.addEventListener("click", function () { const open = menu.classList.toggle("active"); menuToggle.setAttribute("aria-expanded", open ? "true" : "false"); });
    </script>
  </body>
</html>
`;
  const dir = join(here, s.name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  pages++;
}

// ---------- sitemap: home, catálogo, páginas por skill ----------
const today = new Date().toISOString().slice(0, 10);
const smUrls = [
  { loc: `${SITE}/`, freq: "monthly", pri: "1.0" },
  { loc: PAGE, freq: "weekly", pri: "0.9" },
  ...skills.map((s) => ({ loc: `${PAGE}${s.name}/`, freq: "monthly", pri: "0.8" })),
  { loc: `${SITE}/skills/skills.json`, freq: "weekly", pri: "0.3" },
];
writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${smUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join("\n")}
</urlset>
`);

console.log(`ok: ${skills.length} skills → cards estáticos, JSON-LD, FAQ, llms.txt, ${pages} páginas por skill, sitemap`);
