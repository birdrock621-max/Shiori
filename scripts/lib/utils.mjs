import { createHash } from 'node:crypto';
import path from 'node:path';

export const RECORD_TYPES = Object.freeze(['diary', 'task', 'development', 'learning', 'activity', 'note']);
export const MOODS = Object.freeze(['calm', 'focused', 'joyful', 'tired', 'curious', 'reflective']);
export function escapeHtml(value = '') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
export function escapeAttr(value = '') { return escapeHtml(value).replaceAll('`','&#96;'); }
export function stripHtml(value = '') { return String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim(); }
export function truncate(value = '', max = 180) { const text = String(value).trim(); return text.length <= max ? text : `${text.slice(0,Math.max(0,max-1)).trimEnd()}…`; }
export function slugify(value, fallback = 'item') { const normalized = String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase().replace(/[’'"“”]/g,'').replace(/[\s_]+/g,'-').replace(/[^\p{Letter}\p{Number}-]+/gu,'-').replace(/-{2,}/g,'-').replace(/^-|-$/g,''); return normalized || fallback; }
export function safePathSegment(value, fallback = 'item') { return slugify(value, fallback).replaceAll('/','-'); }
export function hashString(value = '') { let hash=2166136261; for (const char of String(value)) { hash ^= char.codePointAt(0); hash=Math.imul(hash,16777619); } return hash>>>0; }
export function contentHash(value, length=10) { return createHash('sha256').update(value).digest('hex').slice(0,length); }
export function normalizeSearch(value='') { return String(value).normalize('NFKC').toLocaleLowerCase().replace(/[\p{Punctuation}\p{Symbol}]+/gu,' ').replace(/\s+/g,' ').trim(); }
export function parseDateParts(date) { const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date)); if(!match)return null; const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]); const utc=new Date(Date.UTC(year,month-1,day)); return utc.getUTCFullYear()===year&&utc.getUTCMonth()+1===month&&utc.getUTCDate()===day?{year,month,day,utc}:null; }
export function compareDateDesc(a,b) { return String(b.date).localeCompare(String(a.date)) || String(a.title).localeCompare(String(b.title)); }
export function formatDate(date,locale='en') { const p=parseDateParts(date); return p?new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(p.utc):String(date); }
export function formatShortDate(date,locale='en') { const p=parseDateParts(date); return p?new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',timeZone:'UTC'}).format(p.utc):String(date); }
export function formatMonth(key,locale='en') { const m=/^(\d{4})-(\d{2})$/.exec(String(key)); return m?new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(Number(m[1]),Number(m[2])-1,1))):String(key); }
export function formatYear(year,locale='en') { return new Intl.DateTimeFormat(locale,{year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(Number(year),0,1))); }
export function joinUrl(base,pathname='/') { return base?`${base.replace(/\/$/,'')}/${String(pathname).replace(/^\//,'')}`:''; }
export function toPosixPath(value) { return value.split(path.sep).join('/'); }
export function groupBy(items,keyFn) { const map=new Map(); for(const item of items){const key=keyFn(item); if(!map.has(key))map.set(key,[]); map.get(key).push(item);} return map; }
export function uniqueSorted(values,locale='en') { return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),locale,{sensitivity:'base',numeric:true})); }
export function daysBetween(start,end) { const a=parseDateParts(start),b=parseDateParts(end); return a&&b?Math.round((b.utc-a.utc)/86400000):0; }
export function computeStreak(records) { const dates=[...new Set(records.map(r=>r.date))].sort().reverse(); if(!dates.length)return 0; let streak=1; for(let i=1;i<dates.length;i+=1){if(daysBetween(dates[i],dates[i-1])===1)streak+=1;else break;} return streak; }
export function ensureArray(value) { return Array.isArray(value)?value:value===undefined||value===null||value===''?[]:[value]; }
export function stableNumber(value,modulo) { return modulo?hashString(value)%modulo:0; }
export function pluralCount(count,one,many,variables={}) { return String(count===1?one:many).replaceAll('{count}',String(count)).replace(/\{([A-Za-z0-9_]+)\}/g,(_,key)=>variables[key]??`{${key}}`); }
