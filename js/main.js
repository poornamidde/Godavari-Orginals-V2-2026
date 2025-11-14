// js/main.js (v6) - cart, UI helpers, HF chat integration,constactive nav highlighting, formspree handling
const STORAGE_KEY = 'godavari_cart_v6';

function getCart(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }catch(e){ return [] } }
function saveCart(cart){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); renderNavBadge(); }
function renderNavBadge(){ const count = getCart().reduce((s,i)=>s+(i.qty||0),0); document.querySelectorAll('.cart-count').forEach(e=>e.textContent = count); }

function showToast(msg){ let t = document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.style.position='fixed'; t.style.right='18px'; t.style.bottom='18px'; t.style.background='var(--warm)'; t.style.color='#fff'; t.style.padding='10px 14px'; t.style.borderRadius='10px'; t.style.zIndex=9999; t.style.opacity=0; t.style.transition='opacity .2s'; document.body.appendChild(t);} t.textContent = msg; t.style.opacity = 1; setTimeout(()=>t.style.opacity = 0,1600); }

/* Cart functions */
function addToCart(id,name,price,image,description=''){ const cart = getCart(); const found = cart.find(i=>i.id===id); if(found){ found.qty = (found.qty||1)+1 } else { cart.push({id,name,price,qty:1,image,description}); } saveCart(cart); showToast(name + ' added to cart'); }

function addToCartWithQty(id,name,price,image,qty){ const q = parseInt(qty)||1; const cart = getCart(); const found = cart.find(i=>i.id===id); if(found){ found.qty = (found.qty||1)+q } else { cart.push({id,name,price,qty:q,image}); } saveCart(cart); showToast(name + ' added to cart'); }

function changeQty(id,delta){ const cart = getCart(); const it = cart.find(i=>i.id===id); if(!it) return; it.qty = Math.max(1,(it.qty||1)+delta); saveCart(cart); renderCartPage(); }
function setQty(id,val){ const q = parseInt(val)||1; const cart = getCart(); const it = cart.find(i=>i.id===id); if(!it) return; it.qty = Math.max(1,q); saveCart(cart); renderCartPage(); }
function removeItem(id){ const cart = getCart().filter(i=>i.id!==id); saveCart(cart); renderCartPage(); showToast('Removed item'); }

/* Render cart page */
function renderCartPage(){ const el = document.getElementById('cart-list'); if(!el) return; el.innerHTML=''; const cart = getCart(); if(cart.length===0){ el.innerHTML = '<div class="p-4 bg-white rounded">Your cart is empty. <a href="shop.html">Shop now</a></div>'; const totalEl = document.getElementById('cart-total'); if(totalEl) totalEl.textContent = '₹0'; return; } let total = 0; cart.forEach(item=>{ total += item.price*item.qty; const div = document.createElement('div'); div.className='cart-item d-flex gap-3 align-items-center p-3 mb-2 bg-white rounded shadow-sm'; div.innerHTML = `<img src="${item.image}" style="width:110px;height:110px;object-fit:cover;border-radius:8px"/><div style="flex:1"><div class="d-flex justify-content-between align-items-center"><strong>${item.name}</strong><div class="fw-bold">₹${(item.price*item.qty).toFixed(0)}</div></div><div class="mt-2 d-flex gap-2 align-items-center"><div class="input-group input-group-sm" style="width:140px"><button class="btn btn-light" onclick="changeQty('${item.id}', -1)">−</button><input type="number" class="form-control text-center" min="1" value="${item.qty}" onchange="setQty('${item.id}', this.value)"/><button class="btn btn-light" onclick="changeQty('${item.id}', 1)">+</button></div><button class="btn btn-outline-danger btn-sm ms-2" onclick="removeItem('${item.id}')">Remove</button></div></div>`; el.appendChild(div); }); const totalEl = document.getElementById('cart-total'); if(totalEl) totalEl.textContent = '₹' + total.toFixed(0); renderNavBadge(); }

/* Intersection observer for fade-up */
const observer = new IntersectionObserver((entries)=>{ entries.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('in-view'); }) }, {threshold:0.12});

/* Active nav highlighting and footer link coloring */
function markActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar .nav-link').forEach(a=>{ a.classList.remove('active'); const href = a.getAttribute('href') || ''; if(href === path || (href.includes(path) && path.length>0)) a.classList.add('active'); });
  document.querySelectorAll('footer a').forEach(a=>{ a.classList.remove('footer-active'); const href = a.getAttribute('href')||''; if(href === path) a.classList.add('footer-active'); });
}

/* Chat: Hugging Face integration */
/* IMPORTANT: Place your Hugging Face API key here. For local demo/testing only.
   Production: use a backend proxy to avoid exposing your key. */
const HF_API_KEY = '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'; // <-- ADD YOUR HUGGING FACE API KEY HERE
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2'; // example; change if desired

async function askAI(prompt){
  const HF_API_KEY = "hf_xxxxxxxxxxxxx";  // your key
  const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // valid model

  try {
    const response = await fetch(
      `https://corsproxy.io/?https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + HF_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) {
      return `Server error (${response.status}): Check API key or model name`;
    }

    const data = await response.json();
    console.log("Hugging Face Response:", data);

    if (Array.isArray(data) && data[0]?.generated_text)
      return data[0].generated_text;
    if (data.generated_text)
      return data.generated_text;
    if (data.error)
      return "API Error: " + data.error;

    return "AI response not recognized.";
  } catch (e) {
    return "⚠️ Network error: " + e.message + "\nTry running on localhost or HTTPS.";
  }
}


/* Create chat UI */
function createChatPanel(){
  if(document.getElementById('chat-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'chat-panel';
  panel.innerHTML = `
    <div style="position:fixed;right:18px;bottom:18px;z-index:1600">
      <button id="chatToggle" style="background:var(--primary);color:#fff;border:none;padding:12px 14px;border-radius:999px;box-shadow:0 12px 40px rgba(46,125,50,0.18);cursor:pointer;font-weight:700">Need Help?</button>
      <div id="chatWindow" style="width:360px;max-width:92vw;background:#fff;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,0.12);overflow:hidden;margin-top:10px;display:none">
        <div style="padding:12px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;gap:8px">
          <strong>Godavari Assistant</strong><div style="flex:1"></div><button id="chatClose" style="border:none;background:transparent;cursor:pointer">✕</button>
        </div>
        <div id="chatBody" style="padding:12px;max-height:320px;overflow:auto;background:linear-gradient(180deg,#fff,#fbfbfb)"></div>
        <div style="padding:10px;border-top:1px solid #f2f2f2;display:flex;gap:8px">
          <input id="chatInput" placeholder="Ask about our snacks, shipping, or orders..." style="flex:1;padding:8px;border-radius:8px;border:1px solid #eee"/>
          <button id="chatSend" class="btn btn-success btn-sm">Send</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(panel);
  const toggle = document.getElementById('chatToggle'), win = document.getElementById('chatWindow'), close = document.getElementById('chatClose'), send = document.getElementById('chatSend'), input = document.getElementById('chatInput'), body = document.getElementById('chatBody');
  function openChat(){ win.style.display='block'; body.scrollTop = body.scrollHeight; }
  function closeChat(){ win.style.display='none'; }
  toggle.addEventListener('click', ()=>{ if(win.style.display==='block') closeChat(); else openChat(); });
  close.addEventListener('click', closeChat);
  send.addEventListener('click', async ()=>{ const v = input.value.trim(); if(!v) return; const u = document.createElement('div'); u.style.textAlign='right'; u.style.margin='8px 0'; u.innerHTML = `<div style="display:inline-block;background:var(--accent);padding:8px 10px;border-radius:8px;color:#06370b"><strong>You:</strong> ${v}</div>`; body.appendChild(u); input.value=''; body.scrollTop = body.scrollHeight; const botMsg = document.createElement('div'); botMsg.style.margin='8px 0'; botMsg.innerHTML = `<div style="display:inline-block;background:#f3f4f6;padding:8px 10px;border-radius:8px;color:var(--text)">Thinking...</div>`; body.appendChild(botMsg); body.scrollTop = body.scrollHeight; const prompt = `You are Godavari Assistant — friendly, snack-themed, helpful. Answer concisely. User: ${v}`; const reply = await askAI(prompt); botMsg.innerHTML = `<div style="display:inline-block;background:#f3f4f6;padding:8px 10px;border-radius:8px;color:var(--text)"><strong>Assistant:</strong> ${reply}</div>`; body.scrollTop = body.scrollHeight; });
  // Auto open briefly on contact page
  setTimeout(()=>{ if(window.location.pathname.endsWith('contact.html')){ openChat(); setTimeout(()=>{ closeChat(); }, 5000); } }, 800);
}

/* Formspree integration for contact form: sends to provided endpoint */
async function submitContactForm(e){
  e.preventDefault();
  const name = document.getElementById('cname').value.trim();
  const email = document.getElementById('cemail').value.trim();
  const phone = document.getElementById('cphone').value.trim();
  const message = document.getElementById('cmessage').value.trim();
  if(!name || !email || !message){ alert('Please fill required fields'); return; }
  const payload = { name, email, phone, message };
  try{
    const res = await fetch('https://formspree.io/f/xkgbpdzo', {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload)
    });
    if(res.ok){ showToast('Message sent — thanks!'); document.getElementById('contactForm').reset(); } else { showToast('Failed to send (Formspree)'); }
  }catch(err){ showToast('Network error'); }
}

/* Initialize on DOM ready */
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.fade-up').forEach(el=>observer.observe(el));
  renderNavBadge();
  renderCartPage();
  createChatPanel();
  markActiveNav();
  const cf = document.getElementById('contactForm'); if(cf) cf.addEventListener('submit', submitContactForm);
});
