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
              <a href="${esc(catalog.repo)}/blob/main/skills/${esc(s.name)}/SKILL.md" target="_blank" rel="noopener">Ver detalhes &rsaquo;</a>
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

console.log(`ok: ${skills.length} skills → cards estáticos, JSON-LD, FAQ e llms.txt`);
