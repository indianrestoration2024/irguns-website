import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({html:false,linkify:true,typographer:true});
const root=process.cwd(), dist=path.join(root,'dist');
const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeSlug = value => String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
function imagePath(value){
 if (!value || typeof value !== 'string')return '';
 let v=value.trim().replace(/^https?:\/\/[^/]+/,'');
 if(!v.startsWith('/'))v='/'+v;
 if(v.includes('..')||!/^\/[a-zA-Z0-9_./% -]+$/.test(v))return '';
 return v.split('/').map((x,i)=>i?encodeURIComponent(x).replaceAll('%20','%20'):x).join('/');
}
function galleryValues(data){
 let arr=[];
 for(const val of [data.featured_image,data.gallery]){
  if(Array.isArray(val))arr.push(...val);
  else if(typeof val==='string' && val)arr.push(val);
 }
 return [...new Set(arr.map(v=>typeof v==='string'?v:(v?.src||v?.path||'')).filter(Boolean))].map(imagePath).filter(Boolean);
}
function copy(source,target){if(!fs.existsSync(source))return;for(const entry of fs.readdirSync(source,{withFileTypes:true})){if(entry.name.startsWith('.'))continue;let s=path.join(source,entry.name),t=path.join(target,entry.name);if(entry.isDirectory()){fs.mkdirSync(t,{recursive:true});copy(s,t)}else fs.copyFileSync(s,t)}}
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for (const name of ['styles.css','script.js','gallery.js'])fs.copyFileSync(path.join(root,name),path.join(dist,name));
for (const folder of ['assets','media']){let s=path.join(root,folder);if(fs.existsSync(s)){fs.mkdirSync(path.join(dist,folder),{recursive:true});copy(s,path.join(dist,folder));}}
const contentDir=path.join(root,'content/firearms');
const files=fs.existsSync(contentDir)?fs.readdirSync(contentDir).filter(f=>f.endsWith('.md')):[];
const records=files.map(file=>{
 const parsed=matter(fs.readFileSync(path.join(contentDir,file),'utf8'));
 const d=parsed.data;
 return {title:String(d.title||path.basename(file,'.md')),category:String(d.category||'Firearm'),price:Number(d.price),status:String(d.status||'Available'),manufacturer:String(d.manufacturer||''),model:String(d.model||''),caliber:String(d.caliber||''),barrel:String(d.barrel_length||''),condition:String(d.condition||''),images:galleryValues(d),body:parsed.content,slug:safeSlug(path.basename(file,'.md'))};
}).filter(x=>x.slug).sort((a,b)=>({'Available':0,'Sale Pending':1,'Sold':2}[a.status]??3)-({'Available':0,'Sale Pending':1,'Sold':2}[b.status]??3));
const money=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n):'Contact for price';
const label=x=>`${escapeHtml(x.category)} · ${escapeHtml(x.status)}`;
const cards=records.map(r=>{
 const url=`/firearms/${r.slug}/`;
 const image=r.images.length?`<img src="${r.images[0]}" alt="${escapeHtml(r.title)}" loading="lazy">`:`<div class="cms-placeholder">Indian Restoration</div>`;
 return `<article class="cms-item"><a href="${url}" class="cms-thumb" aria-label="View details for ${escapeHtml(r.title)}">${image}</a><div class="cms-info"><p class="cms-kind">${label(r)}</p><h3><a href="${url}">${escapeHtml(r.title)}</a></h3><p class="cms-summary">${escapeHtml([r.caliber,r.barrel].filter(Boolean).join(' · ')||'View full specifications and photographs')}</p><div class="cms-meta"><span class="cms-price">${money(r.price)}</span><a class="cms-link" href="${url}">View firearm ↗</a></div></div></article>`;
}).join('\n');
const collection=`<section id="collection" class="section collection"><div class="cms-intro"><div><p class="eyebrow">THE COLLECTION</p><h2>Available <em>Firearms.</em></h2></div><p>A carefully selected collection of fine firearms. Select any listing to view its photographs, description, and specifications.</p></div>${records.length?`<div class="cms-grid">${cards}</div>`:`<div class="cms-empty"><h3>Collection updates coming soon.</h3><p>Please contact us for information on current inventory.</p><a class="text-link" href="mailto:sales@irguns.com">CONTACT INDIAN RESTORATION ↗</a></div>`}</section>`;
let index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!index.includes('<!-- INVENTORY_START -->'))throw new Error('Missing inventory markers');
index=index.replace(/<!-- INVENTORY_START -->[\s\S]*?<!-- INVENTORY_END -->/,collection);
fs.writeFileSync(path.join(dist,'index.html'),index);
const header=index.match(/<header class="header">[\s\S]*?<\/header>/)?.[0]||'';
const top=index.match(/<div class="topline">[\s\S]*?<\/div>/)?.[0]||'';
const footer=index.match(/<footer>[\s\S]*?<\/footer>/)?.[0]||'';
for(const r of records){
 const specs=[['Category',r.category],['Manufacturer',r.manufacturer],['Model',r.model],['Caliber / gauge',r.caliber],['Barrel length',r.barrel],['Condition',r.condition],['Availability',r.status]].filter(([,v])=>v);
 const primary=r.images[0];
 const photo=primary?`<button type="button" class="detail-main-trigger" data-enlarge aria-label="Enlarge main photo"><img class="detail-main-photo" id="primary-photo" src="${primary}" alt="${escapeHtml(r.title)}"></button>`:`<div class="cms-empty">Photographs coming soon</div>`;
 const thumbs=r.images.length>1?`<div class="detail-thumbs">${r.images.map((p,i)=>`<button type="button" class="detail-thumb${i===0?' is-active':''}" data-photo="${p}" data-index="${i}" aria-label="View photo ${i+1}" aria-pressed="${i===0?'true':'false'}"><img src="${p}" alt="${escapeHtml(r.title)} photo ${i+1}" loading="lazy"></button>`).join('')}</div>`:'';
 const content=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#121315"><title>${escapeHtml(r.title)} | Indian Restoration</title><link rel="stylesheet" href="/styles.css"></head><body>${top}${header}<main class="detail-page"><a class="detail-back" href="/#collection">← Back to collection</a><div class="detail-header"><div><p class="eyebrow">${label(r)}</p><h1>${escapeHtml(r.title)}</h1></div><strong class="detail-price">${money(r.price)}</strong></div><div class="detail-photo-region">${photo}${thumbs}</div><div class="detail-cols"><section><h2>About this firearm</h2><div class="detail-prose">${md.render(r.body||'Contact us for additional details.')}</div></section><aside><h2>Specifications</h2><div class="specs">${specs.map(([k,v])=>`<div class="spec"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}</div><a class="detail-contact" href="mailto:sales@irguns.com?subject=${encodeURIComponent('Inquiry: '+r.title)}">INQUIRE ABOUT THIS FIREARM ↗</a><p style="font-size:11px;color:#aaa69f;margin-top:18px">Information and availability are subject to confirmation. Transactions must comply with applicable law and FFL requirements.</p></aside></div></main>${footer}<script src="/script.js" defer></script><script src="/gallery.js" defer></script></body></html>`;
 const dir=path.join(dist,'firearms',r.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),content);
}
console.log(`Built ${records.length} firearm pages`);
