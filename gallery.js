(() => {
 const main=document.getElementById('primary-photo'); if(!main)return;
 const thumbnails=[...document.querySelectorAll('.detail-thumb')];
 thumbnails.forEach(button=>button.addEventListener('click',()=>{
   main.src=button.dataset.photo;
   main.alt=button.querySelector('img')?.alt||'Firearm photograph';
   thumbnails.forEach(t=>{const active=t===button;t.classList.toggle('is-active',active);t.setAttribute('aria-pressed',String(active));});
 }));
 const overlay=document.createElement('div');overlay.className='photo-lightbox';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Enlarged firearm photograph');
 overlay.innerHTML='<button type="button" class="lightbox-close" aria-label="Close enlarged photograph">✕</button><img alt="Enlarged firearm photograph">';
 document.body.appendChild(overlay);
 const close=overlay.querySelector('button');const img=overlay.querySelector('img');
 let priorFocus=null;
 const shut=()=>{overlay.classList.remove('is-open');document.body.classList.remove('lightbox-open');priorFocus?.focus();};
 document.querySelector('[data-enlarge]')?.addEventListener('click',()=>{priorFocus=document.activeElement;img.src=main.currentSrc||main.src;img.alt=main.alt;overlay.classList.add('is-open');document.body.classList.add('lightbox-open');close.focus();});
 close.addEventListener('click',shut);overlay.addEventListener('click',e=>{if(e.target===overlay)shut();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))shut();});
})();
