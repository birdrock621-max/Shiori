import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadLocalePacks, createTranslator, languageName, localizePath } from './lib/i18n.mjs';
import { loadRecords } from './lib/records.mjs';
import { render404Page, renderAboutPage, renderArchivePage, renderBrowsePage, renderCollectionPage, renderHomePage, renderRecordPage } from './lib/templates.mjs';
import { computeStreak, formatMonth, formatYear, safePathSegment, uniqueSorted } from './lib/utils.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT=path.resolve(HERE,'..');

export async function buildSite(options={}) {
  const rootDir=path.resolve(options.rootDir||PROJECT_ROOT),outDir=path.resolve(options.outDir||path.join(rootDir,'dist')),quiet=options.quiet===true;
  const started=performance.now();
  const config=JSON.parse(await readFile(path.join(rootDir,'config/site.json'),'utf8'));
  validateConfig(config);
  const siteUrl=normalizeSiteUrl(config.url||process.env.CF_PAGES_URL||'');
  const runtimeConfig={...config,siteUrl};
  const {locales,packs}=await loadLocalePacks(rootDir,runtimeConfig);
  const loaded=await loadRecords({rootDir,contentDir:options.contentDir||'content/records',defaultLanguage:runtimeConfig.defaultLocale});
  if(loaded.errors.length)throw new Error(`Record validation failed:\n- ${loaded.errors.join('\n- ')}`);
  if(!quiet)loaded.warnings.forEach(w=>console.warn(`⚠ ${w}`));
  const records=loaded.published,stats=createStats(records),translations=groupTranslations(records);

  await rm(outDir,{recursive:true,force:true});
  await mkdir(path.join(outDir,'assets'),{recursive:true});
  await cp(path.join(rootDir,'public'),outDir,{recursive:true,force:true});
  await cp(path.join(rootDir,'src/styles.css'),path.join(outDir,'assets/styles.css'));
  await cp(path.join(rootDir,'src/app.js'),path.join(outDir,'assets/app.js'));

  const pages=new Map();
  for(const locale of locales){
    const context={config:runtimeConfig,locale,locales,packs,records,stats};
    addPage(pages,localizePath('/',locale,runtimeConfig.defaultLocale),renderHomePage(context));
    addPage(pages,localizePath('/archive/',locale,runtimeConfig.defaultLocale),renderArchivePage(context));
    addPage(pages,localizePath('/browse/',locale,runtimeConfig.defaultLocale),renderBrowsePage(context));
    addPage(pages,localizePath('/about/',locale,runtimeConfig.defaultLocale),renderAboutPage(context));
    for(const record of records)addPage(pages,localizePath(record.url,locale,runtimeConfig.defaultLocale),renderRecordPage({...context,record,translations:record.translationKey?translations.get(record.translationKey)??[]:[]}));
    const t=createTranslator(locale,packs,runtimeConfig.defaultLocale);
    for(const year of uniqueSorted(records.map(r=>r.year),locale).reverse())collection(pages,context,locale,`/years/${safePathSegment(year)}/`,records.filter(r=>r.year===year),formatYear(year,locale),'YEAR INDEX',t);
    for(const month of uniqueSorted(records.map(r=>r.monthKey),locale).reverse())collection(pages,context,locale,`/months/${safePathSegment(month)}/`,records.filter(r=>r.monthKey===month),formatMonth(month,locale),'MONTH INDEX',t);
    for(const tag of uniqueSorted(records.flatMap(r=>r.tags),locale))collection(pages,context,locale,`/tags/${safePathSegment(tag)}/`,records.filter(r=>r.tags.includes(tag)),`#${tag}`,'TAG INDEX',t);
    for(const project of uniqueSorted(records.map(r=>r.project),locale))collection(pages,context,locale,`/projects/${safePathSegment(project)}/`,records.filter(r=>r.project===project),project,'PROJECT INDEX',t);
    for(const type of uniqueSorted(records.map(r=>r.type),locale))collection(pages,context,locale,`/types/${safePathSegment(type)}/`,records.filter(r=>r.type===type),t(`types.${type}`),'TYPE INDEX',t);
    for(const language of uniqueSorted(records.map(r=>r.lang),locale))collection(pages,context,locale,`/languages/${safePathSegment(language)}/`,records.filter(r=>r.lang===language),languageName(language,locale),'LANGUAGE INDEX',t);

    const searchIndex=records.map(record=>({title:record.title,date:record.date,shortDate:new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${record.date}T00:00:00Z`)),type:record.type,typeLabel:t(`types.${record.type}`),tags:record.tags,project:record.project,language:record.lang,languageLabel:languageName(record.lang,locale),summary:record.summary,text:record.text,url:localizePath(record.url,locale,runtimeConfig.defaultLocale)}));
    await writeJsonRoute(outDir,localizePath('/search-index.json',locale,runtimeConfig.defaultLocale),searchIndex);
    addPage(pages,localizePath('/404/',locale,runtimeConfig.defaultLocale),render404Page(context));
  }

  for(const [pathname,html] of pages)await writeRoute(outDir,pathname,html);
  await writeFile(path.join(outDir,'404.html'),pages.get('/404/')||render404Page({config:runtimeConfig,locale:runtimeConfig.defaultLocale,locales,packs,records,stats}));
  await writeFile(path.join(outDir,'feed.xml'),renderFeed(runtimeConfig,records));
  await writeFile(path.join(outDir,'sitemap.xml'),renderSitemap(runtimeConfig,[...pages.keys()].filter(route=>!/(?:^|\/)404\/$/.test(route))));
  await writeFile(path.join(outDir,'robots.txt'),renderRobots(runtimeConfig));
  if(!quiet){console.log(`✓ Validated ${records.length} published records (${loaded.drafts.length} drafts)`);console.log(`✓ Generated ${pages.size+1} static pages in ${Math.round(performance.now()-started)}ms`);console.log(`✓ Interface locales: ${locales.join(', ')}`);if(!siteUrl)console.log('ℹ Canonical URL will use Cloudflare Pages CF_PAGES_URL when available');}
  return{rootDir,outDir,config:runtimeConfig,locales,packs,records,stats,pages,warnings:loaded.warnings};
}
function collection(pages,context,locale,pathname,values,pageTitle,eyebrow,t){addPage(pages,localizePath(pathname,locale,context.config.defaultLocale),renderCollectionPage({...context,records:values,pathname,pageTitle,eyebrow,description:t('browse.items',{count:values.length})}));}
function addPage(pages,pathname,html){if(pages.has(pathname))throw new Error(`Duplicate generated route: ${pathname}`);pages.set(pathname,html);}
function validateConfig(config){const e=[];if(!config||typeof config!=='object')e.push('config/site.json must contain an object');if(!String(config?.name||'').trim())e.push('name is required');if(!String(config?.description||'').trim())e.push('description is required');if(!String(config?.defaultLocale||'').trim())e.push('defaultLocale is required');if(!Array.isArray(config?.locales)||!config.locales.length)e.push('locales must be a non-empty array');if(!config?.locales?.includes(config.defaultLocale))e.push('defaultLocale must be included in locales');if(!config?.author||!String(config.author.name||'').trim())e.push('author.name is required');if(!validAsset(config?.hero?.baseImage)||!validAsset(config?.hero?.revealImage))e.push('hero images must use HTTPS or a root-relative / path');if(e.length)throw new Error(`Invalid config/site.json:\n- ${e.join('\n- ')}`);}
function validAsset(value){const source=String(value||'').trim();return source.startsWith('https://')||source.startsWith('/');}
function normalizeSiteUrl(value){const input=String(value||'').trim().replace(/\/$/,'');if(!input)return'';let url;try{url=new URL(input);}catch{throw new Error(`config.url is not a valid URL: ${input}`);}if(!['http:','https:'].includes(url.protocol))throw new Error('config.url must use http or https');return url.href.replace(/\/$/,'');}
function createStats(records){return{records:records.length,days:new Set(records.map(r=>r.date)).size,completedTasks:records.reduce((sum,r)=>sum+r.completedTasks,0),projects:new Set(records.map(r=>r.project).filter(Boolean)).size,streak:computeStreak(records)};}
function groupTranslations(records){const groups=new Map();for(const record of records){if(!record.translationKey)continue;if(!groups.has(record.translationKey))groups.set(record.translationKey,[]);groups.get(record.translationKey).push(record);}return groups;}
async function writeRoute(outDir,pathname,html){const clean=pathname.replace(/^\//,'').replace(/\/$/,'');const target=clean?path.join(outDir,clean,'index.html'):path.join(outDir,'index.html');await mkdir(path.dirname(target),{recursive:true});await writeFile(target,html);}
async function writeJsonRoute(outDir,pathname,value){const target=path.join(outDir,pathname.replace(/^\//,''));await mkdir(path.dirname(target),{recursive:true});await writeFile(target,`${JSON.stringify(value)}\n`);}
function xmlEscape(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');}
function absoluteUrl(config,pathname){return config.siteUrl?`${config.siteUrl}${pathname.startsWith('/')?pathname:`/${pathname}`}`:pathname;}
function renderFeed(config,records){const updated=records[0]?.updated||records[0]?.date||'2026-01-01';const entries=records.slice(0,50).map(record=>`  <entry xml:lang="${xmlEscape(record.lang)}"><title>${xmlEscape(record.title)}</title><id>${xmlEscape(absoluteUrl(config,record.url))}</id><link href="${xmlEscape(absoluteUrl(config,record.url))}"/><published>${record.date}T00:00:00Z</published><updated>${record.updated||record.date}T00:00:00Z</updated><summary>${xmlEscape(record.summary)}</summary>${record.tags.map(tag=>`<category term="${xmlEscape(tag)}"/>`).join('')}</entry>`).join('\n');return `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${xmlEscape(config.defaultLocale)}"><title>${xmlEscape(config.name)}</title><id>${xmlEscape(absoluteUrl(config,'/'))}</id><link href="${xmlEscape(absoluteUrl(config,'/feed.xml'))}" rel="self"/><link href="${xmlEscape(absoluteUrl(config,'/'))}"/><updated>${updated}T00:00:00Z</updated><subtitle>${xmlEscape(config.description)}</subtitle>\n${entries}\n</feed>\n`;}
function renderSitemap(config,paths){return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p=>`  <url><loc>${xmlEscape(absoluteUrl(config,p))}</loc></url>`).join('\n')}\n</urlset>\n`;}
function renderRobots(config){return `User-agent: *\nAllow: /\n${config.siteUrl?`Sitemap: ${config.siteUrl}/sitemap.xml\n`:''}`;}
const isDirectRun=process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href;if(isDirectRun)buildSite().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
