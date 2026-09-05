document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    initialQuery: "iPhone 15",
    api: "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",
    supabaseUrl: "https://wulhcgkphclwgidqlvtr.supabase.co",
    supabaseKey: "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc"
  };

  let db = null, adminDb = null;
  if (window.supabase?.createClient) {
    db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "achou-user-auth" }
    });
    adminDb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  let products = [], groupedProducts = [], affiliateLinks = [], currentQuery = CONFIG.initialQuery;

  const searchInput = document.querySelector("#searchInput");
  const searchButton = document.querySelector(".search-box button");
  const dealsContainer = document.querySelector(".flash-deals");
  const marketSection = document.querySelector("#offersSection");
  const summaryBox = document.querySelector(".achou-search-summary");
  const categoriesSection = document.querySelector("#categoriesSection");

  const money = v => Number(v).toLocaleString(CONFIG.locale,{style:"currency",currency:CONFIG.currency});
  const escapeHtml = t => String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const setMessage = (el,text,type="") => { if(!el)return; el.textContent=text||""; el.classList.remove("success","error"); if(type)el.classList.add(type); };
  const scrollToOffers = () => marketSection?.scrollIntoView({behavior:"smooth",block:"start"});
  const focusSearch = () => { searchInput?.scrollIntoView({behavior:"smooth",block:"center"}); setTimeout(()=>searchInput?.focus(),300); };

  function validAffiliateLink(url){
    if(!url)return false;
    try{
      const u=new URL(url),h=u.hostname.toLowerCase();
      return u.protocol==="https:" && (h==="meli.la"||h==="mercadolivre.com.br"||h.endsWith(".mercadolivre.com.br")||h==="mercadolibre.com"||h.endsWith(".mercadolibre.com"));
    }catch{return false;}
  }

  function showStatus(title,text,loading=false){
    if(!dealsContainer)return;
    dealsContainer.innerHTML=`<div class="achou-search-status ${loading?"loading":""}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`;
  }

  function updateSummary(productCount,offerCount,query){
    if(!summaryBox)return;
    summaryBox.style.display="flex";
    summaryBox.innerHTML=`<div><strong>${productCount} ${productCount===1?"produto encontrado":"produtos encontrados"}</strong><span>${offerCount} ${offerCount===1?"oferta encontrada":"ofertas encontradas"} para “${escapeHtml(query)}”</span></div><span>Menor preço primeiro</span>`;
  }

  function normalizeApiProduct(item){
    return {
      id:item.item_id||item.id||"", itemId:item.item_id||item.id||"", productId:item.product_id||"",
      title:item.title||"", price:Number(item.price), oldPrice:item.original_price!=null?Number(item.original_price):null,
      image:item.thumbnail||item.image||null, sellerId:item.seller_id||null, freeShipping:item.free_shipping===true,
      condition:item.condition||null, store:"Mercado Livre", source:"mercadolivre",
      productUrl:item.permalink||item.url||null, link:null, affiliateId:null
    };
  }

  async function loadAffiliateLinks(){
    if(!db){affiliateLinks=[];return[];}
    try{
      const {data,error}=await db.from("affiliate_links")
        .select("id, marketplace, item_id, catalog_product_id, product_title, affiliate_url, active, created_at, updated_at")
        .eq("active",true).order("updated_at",{ascending:false});
      if(error)throw error;
      affiliateLinks=Array.isArray(data)?data:[];
      return affiliateLinks;
    }catch(e){console.error("[ACHOU!] afiliados",e);affiliateLinks=[];return[];}
  }

  function findAffiliateForProduct(product){
    return affiliateLinks.find(link=>link.active===true && link.item_id && String(link.item_id)===String(product.itemId) && validAffiliateLink(link.affiliate_url))||null;
  }

  function applyAffiliateLinks(list){
    return list.map(product=>{const a=findAffiliateForProduct(product);product.link=a?.affiliate_url||null;product.affiliateId=a?.id||null;return product;});
  }

  function groupProducts(list){
    const map=new Map();
    list.forEach(item=>{
      const key=item.productId||item.id;if(!key)return;
      if(!map.has(key))map.set(key,{productId:key,title:item.title,image:item.image||null,allOffers:[]});
      const g=map.get(key);if(!g.image&&item.image)g.image=item.image;g.allOffers.push(item);
    });
    return [...map.values()].map(g=>{
      g.offers=g.allOffers.filter(o=>Number.isFinite(o.price)&&o.price>0).sort((a,b)=>a.price-b.price);
      g.linkedOffers=g.offers.filter(o=>validAffiliateLink(o.link));g.best=g.offers[0]||null;g.storeCount=new Set(g.offers.map(o=>o.store)).size;return g;
    }).filter(g=>g.best).sort((a,b)=>a.best.price-b.best.price);
  }

  function getFavorites(){try{return JSON.parse(localStorage.getItem("achou_favorites"))||[]}catch{return[]}}
  function saveFavorites(list){localStorage.setItem("achou_favorites",JSON.stringify(list))}
  function updateFavoriteCounter(){const n=getFavorites().length;document.querySelectorAll(".favorite-count").forEach(el=>el.textContent=n)}
  function bindFavorites(){
    document.querySelectorAll("[data-favorite]").forEach(btn=>{
      const id=String(btn.dataset.favorite),has=getFavorites().map(String).includes(id);btn.textContent=has?"♥":"♡";
      btn.onclick=()=>{let cur=getFavorites().map(String);cur=cur.includes(id)?cur.filter(x=>x!==id):[...cur,id];saveFavorites(cur);btn.textContent=cur.includes(id)?"♥":"♡";updateFavoriteCounter();};
    });
  }

  function bindOfferPanels(){
    document.querySelectorAll("[data-toggle-offers]").forEach(btn=>{
      btn.onclick=()=>{const p=document.querySelector(`[data-offers-panel="${CSS.escape(btn.dataset.toggleOffers)}"]`);if(!p)return;
        const open=p.classList.toggle("open");btn.textContent=open?"OCULTAR OFERTAS":`COMPARAR ${p.children.length} ${p.children.length===1?"OFERTA":"OFERTAS"}`;};
    });
  }

  function renderGroupedProducts(groups){
    if(!dealsContainer)return;
    if(!groups.length){showStatus("Nenhum produto encontrado","Tente outro produto ou categoria.");return;}
    dealsContainer.innerHTML=groups.map((g,idx)=>{
      const best=g.best,title=escapeHtml(g.title),img=g.image
        ? `<img class="achou-product-image" src="${escapeHtml(g.image)}" alt="${title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="achou-image-fallback" style="display:none">Imagem indisponível</div>`
        : `<div class="achou-image-fallback">Imagem indisponível</div>`;
      const rows=g.offers.map((o,i)=>{
        const has=validAffiliateLink(o.link);
        return `<div class="achou-offer-row"><div>${i===0?'<span class="achou-best-label">MENOR PREÇO</span>':""}<strong class="achou-offer-price">${money(o.price)}</strong><div class="achou-offer-meta"><span>${escapeHtml(o.store)}</span>${o.freeShipping?'<span class="achou-free">Frete grátis</span>':""}</div></div>${has?`<a class="achou-mini-buy" href="${escapeHtml(o.link)}" target="_blank" rel="noopener noreferrer sponsored">VER OFERTA</a>`:`<button class="achou-mini-buy achou-link-pending" disabled>LINK EM BREVE</button>`}</div>`;
      }).join("");
      const action=validAffiliateLink(best.link)?`<a class="offer" href="${escapeHtml(best.link)}" target="_blank" rel="noopener noreferrer sponsored">VER OFERTAS</a>`:`<button class="offer achou-link-pending" disabled>LINK EM BREVE</button>`;
      return `<article class="flash-card">
        ${idx===0?'<span class="discount">MENOR PREÇO</span>':""}
        <button class="product-favorite" data-favorite="${escapeHtml(g.productId)}">♡</button>
        <div class="flash-photo">${img}</div>
        <h3>${title}</h3>
        <div class="achou-group-info"><span class="achou-offer-count">${g.offers.length} ${g.offers.length===1?"oferta":"ofertas"}</span>${best.freeShipping?'<span class="achou-free">Frete grátis</span>':""}</div>
        <span class="achou-starting">A partir de</span>
        <strong class="flash-price">${money(best.price)}</strong>
        <div class="product-bottom"><span>${g.storeCount===1?"Mercado Livre integrado":`Compare em ${g.storeCount} lojas`}</span></div>
        <div class="achou-actions">${action}<button class="achou-see-offers" data-toggle-offers="${escapeHtml(g.productId)}">COMPARAR ${g.offers.length} ${g.offers.length===1?"OFERTA":"OFERTAS"}</button></div>
        <div class="achou-offers-panel" data-offers-panel="${escapeHtml(g.productId)}">${rows}</div>
      </article>`;
    }).join("");
    bindFavorites();bindOfferPanels();
  }

  async function searchProducts(forcedTerm=null,{scroll=true}={}){
    if(!searchInput)return;
    const term=forcedTerm!==null?String(forcedTerm).trim():searchInput.value.trim();
    if(!term){focusSearch();return;}
    currentQuery=term;showStatus("Procurando as melhores ofertas...","Consultando produtos e preços reais.",true);
    if(summaryBox)summaryBox.style.display="none";
    if(searchButton){searchButton.disabled=true;searchButton.textContent="BUSCANDO...";}
    try{
      const r=await fetch(`${CONFIG.api}?q=${encodeURIComponent(term)}`,{headers:{Accept:"application/json"}});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();
      if(!data?.ok||!Array.isArray(data.results))throw new Error("Resposta inválida");
      products=data.results.map(normalizeApiProduct).filter(p=>p.id&&p.title&&Number.isFinite(p.price)&&p.price>0);
      await loadAffiliateLinks();products=applyAffiliateLinks(products);groupedProducts=groupProducts(products);
      const offers=groupedProducts.reduce((t,g)=>t+g.offers.length,0);updateSummary(groupedProducts.length,offers,term);renderGroupedProducts(groupedProducts);renderAdminProducts();
      if(scroll)scrollToOffers();
    }catch(e){console.error("[ACHOU!] busca",e);products=[];groupedProducts=[];showStatus("Não foi possível buscar agora","Tente novamente em alguns instantes.");renderAdminProducts();}
    finally{if(searchButton){searchButton.disabled=false;searchButton.textContent="Buscar";}}
  }

  searchButton?.addEventListener("click",()=>searchProducts());
  searchInput?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchProducts();}});
  document.querySelectorAll("[data-search]").forEach(b=>b.onclick=()=>{searchInput.value=b.dataset.search;searchProducts(b.dataset.search);});

  const categoryModal=document.querySelector("#categoryModal"),categoryModalTitle=document.querySelector("#categoryModalTitle"),
    categoryModalText=document.querySelector("#categoryModalText"),subcategoryGrid=document.querySelector("#subcategoryGrid");

  const CATEGORY_DATA={
    celulares:{title:"Celulares",items:[["Samsung Galaxy","Samsung Galaxy celular"],["iPhone","iPhone"],["Motorola","Motorola celular"],["Xiaomi","Xiaomi celular"],["Smartphones 5G","celular 5G"]]},
    informatica:{title:"Informática",items:[["Notebooks","notebook"],["Notebook Gamer","notebook gamer"],["Computadores","computador desktop"],["Monitores","monitor"],["SSD","SSD"]]},
    tv:{title:"TV e Vídeo",items:[["Smart TV","Smart TV"],["TV 4K","Smart TV 4K"],["Samsung","Smart TV Samsung"],["LG","Smart TV LG"],["Projetores","projetor"]]},
    games:{title:"Games",items:[["PlayStation 5","PlayStation 5 console"],["Xbox","Xbox console"],["Nintendo Switch","Nintendo Switch console"],["PC Gamer","PC gamer"]]},
    audio:{title:"Áudio",items:[["Fone Bluetooth","fone bluetooth"],["Headset Gamer","headset gamer"],["AirPods","AirPods"],["Caixa Bluetooth","caixa de som bluetooth"],["Soundbar","soundbar"]]},
    casa:{title:"Casa",items:[["Eletrodomésticos","eletrodomésticos"],["Cozinha","utensílios cozinha"],["Air Fryer","Air Fryer"],["Geladeira","geladeira"],["Cama, Mesa e Banho","cama mesa banho"],["Decoração","decoração casa"]]},
    moda:{title:"Moda",items:[["Tênis","tênis masculino"],["Masculino","roupa masculina"],["Feminino","roupa feminina"],["Bolsas","bolsa feminina"],["Relógios","relógio"]]},
    ferramentas:{title:"Ferramentas",items:[["Furadeiras","furadeira"],["Parafusadeiras","parafusadeira"],["Serra Circular","serra circular"],["Bosch","ferramenta Bosch"],["Makita","ferramenta Makita"]]}
  };

  function bodyLock(){document.body.classList.add("modal-open")}
  function bodyUnlock(){if(!document.querySelector(".modal.active"))document.body.classList.remove("modal-open")}
  function openCategory(key){
    const c=CATEGORY_DATA[key];if(!c)return;
    categoryModalTitle.textContent=c.title;categoryModalText.textContent="Escolha o que você procura.";
    subcategoryGrid.innerHTML=c.items.map(([label,search])=>`<button data-subcategory-search="${escapeHtml(search)}">${escapeHtml(label)}</button>`).join("");
    subcategoryGrid.querySelectorAll("[data-subcategory-search]").forEach(b=>b.onclick=()=>{closeCategory();searchInput.value=b.dataset.subcategorySearch;searchProducts(b.dataset.subcategorySearch);});
    categoryModal.classList.add("active");bodyLock();
  }
  function closeCategory(){categoryModal?.classList.remove("active");bodyUnlock()}
  document.querySelectorAll(".category-card[data-category]").forEach(b=>b.onclick=()=>openCategory(b.dataset.category));
  document.querySelector("#categoryModalClose")?.addEventListener("click",closeCategory);
  categoryModal?.addEventListener("click",e=>{if(e.target===categoryModal)closeCategory();});

  const loginModal=document.querySelector("#loginModal"),signupModal=document.querySelector("#signupModal");
  function openLogin(){loginModal?.classList.add("active");bodyLock()} function closeLogin(){loginModal?.classList.remove("active");bodyUnlock()}
  function openSignup(){signupModal?.classList.add("active");bodyLock()} function closeSignup(){signupModal?.classList.remove("active");bodyUnlock()}
  document.querySelector(".account-button")?.addEventListener("click",openLogin);
  document.querySelector(".login-close")?.addEventListener("click",closeLogin);
  document.querySelector(".signup-close")?.addEventListener("click",closeSignup);
  document.querySelector(".create-account")?.addEventListener("click",()=>{closeLogin();openSignup();});
  document.querySelector(".signup-login")?.addEventListener("click",()=>{closeSignup();openLogin();});

  function updateAccountUI(user){
    const hello=document.querySelector(".account-copy small"),nameEl=document.querySelector(".account-copy strong"),avatar=document.querySelector(".account-avatar");
    if(!user){if(hello)hello.textContent="Olá!";if(nameEl)nameEl.textContent="Entrar";if(avatar)avatar.textContent="●";return;}
    const name=user.user_metadata?.full_name||user.email?.split("@")[0]||"Usuário",first=String(name).split(" ")[0];
    if(hello)hello.textContent="Olá,";if(nameEl)nameEl.textContent=first;if(avatar)avatar.textContent=first[0]?.toUpperCase()||"U";
  }

  document.querySelector("#loginForm")?.addEventListener("submit",async e=>{
    e.preventDefault();if(!db)return;const email=document.querySelector("#loginEmail").value.trim(),password=document.querySelector("#loginPassword").value;
    try{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;closeLogin();updateAccountUI(data?.user||null);}
    catch{alert("Não foi possível entrar. Confira seu e-mail e senha.");}
  });

  document.querySelector("#signupForm")?.addEventListener("submit",async e=>{
    e.preventDefault();if(!db)return;const name=document.querySelector("#signupName").value.trim(),email=document.querySelector("#signupEmail").value.trim(),
      password=document.querySelector("#signupPassword").value,confirm=document.querySelector("#signupPasswordConfirm").value;
    if(password!==confirm){alert("As senhas não coincidem.");return;}
    try{const {data,error}=await db.auth.signUp({email,password,options:{data:{full_name:name}}});if(error)throw error;alert("Conta criada com sucesso.");closeSignup();updateAccountUI(data?.user||null);}
    catch{alert("Não foi possível criar a conta.");}
  });

  db?.auth.getUser().then(({data})=>updateAccountUI(data?.user||null)).catch(()=>{});

  const adminSecretButton=document.querySelector("#adminSecretButton"),adminLoginModal=document.querySelector("#adminLoginModal"),
    adminPanelModal=document.querySelector("#adminPanelModal"),adminLoginMessage=document.querySelector("#adminLoginMessage"),
    adminProductsList=document.querySelector("#adminProductsList"),adminAffiliateForm=document.querySelector("#adminAffiliateForm"),
    adminAffiliateId=document.querySelector("#adminAffiliateId"),adminItemId=document.querySelector("#adminItemId"),
    adminProductId=document.querySelector("#adminProductId"),adminProductTitle=document.querySelector("#adminProductTitle"),
    adminAffiliateUrl=document.querySelector("#adminAffiliateUrl"),adminAffiliateActive=document.querySelector("#adminAffiliateActive"),
    adminFormMessage=document.querySelector("#adminFormMessage"),adminLinksList=document.querySelector("#adminLinksList");

  async function resetAdminSession(){try{await adminDb?.auth.signOut()}catch{}}
  function openAdminLogin(){document.querySelector("#adminEmail").value="";document.querySelector("#adminPassword").value="";setMessage(adminLoginMessage,"");adminLoginModal.classList.add("active");bodyLock();}
  function closeAdminLogin(){adminLoginModal.classList.remove("active");bodyUnlock()}
  function openAdminPanel(){adminLoginModal.classList.remove("active");adminPanelModal.classList.add("active");bodyLock();renderAdminProducts();loadAdminLinks();}
  async function closeAdminPanel(){adminPanelModal.classList.remove("active");await resetAdminSession();bodyUnlock();}
  adminSecretButton?.addEventListener("click",async()=>{await resetAdminSession();openAdminLogin();});
  document.querySelector("#adminLoginClose")?.addEventListener("click",async()=>{await resetAdminSession();closeAdminLogin();});
  document.querySelector("#adminPanelClose")?.addEventListener("click",closeAdminPanel);
  document.querySelector("#adminLogoutButton")?.addEventListener("click",closeAdminPanel);

  async function getCurrentAdmin(){
    if(!adminDb)return null;try{const {data:u,error:e}=await adminDb.auth.getUser();if(e||!u?.user)return null;
      const {data,error}=await adminDb.from("admin_users").select("user_id").eq("user_id",u.user.id).maybeSingle();return error||!data?null:u.user;}catch{return null;}
  }

  document.querySelector("#adminLoginForm")?.addEventListener("submit",async e=>{
    e.preventDefault();const email=document.querySelector("#adminEmail").value.trim(),password=document.querySelector("#adminPassword").value;
    setMessage(adminLoginMessage,"Verificando acesso...");await resetAdminSession();
    try{const {data,error}=await adminDb.auth.signInWithPassword({email,password});if(error||!data?.user)throw 0;
      const {data:a,error:ae}=await adminDb.from("admin_users").select("user_id").eq("user_id",data.user.id).maybeSingle();if(ae||!a){await resetAdminSession();throw 0;}openAdminPanel();}
    catch{await resetAdminSession();setMessage(adminLoginMessage,"E-mail ou senha incorretos, ou usuário sem permissão.","error");}
  });

  function renderAdminProducts(){
    if(!adminProductsList)return;if(!products.length){adminProductsList.innerHTML='<div class="admin-empty">Faça uma busca no ACHOU! para carregar os produtos.</div>';return;}
    adminProductsList.innerHTML=products.map((p,i)=>`<article class="admin-product-card"><div class="admin-product-image">${p.image?`<img src="${escapeHtml(p.image)}" alt="">`:"sem imagem"}</div>
      <div class="admin-product-data"><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.itemId)}</small><em class="${findAffiliateForProduct(p)?"admin-linked":""}">${findAffiliateForProduct(p)?"LINK CADASTRADO":"SEM LINK"}</em></div>
      <button class="admin-select-product" data-admin-product="${i}">${findAffiliateForProduct(p)?"EDITAR":"SELECIONAR"}</button></article>`).join("");
    adminProductsList.querySelectorAll("[data-admin-product]").forEach(b=>b.onclick=()=>fillAdminFormFromProduct(products[Number(b.dataset.adminProduct)]));
  }

  function fillAdminFormFromProduct(p){
    const a=findAffiliateForProduct(p);adminAffiliateId.value=a?.id||"";adminItemId.value=p.itemId||"";adminProductId.value=p.productId||"";adminProductTitle.value=p.title||"";
    adminAffiliateUrl.value=a?.affiliate_url||"";adminAffiliateActive.checked=a?a.active!==false:true;setMessage(adminFormMessage,a?"Link existente carregado para edição.":"Produto selecionado. Cole o link afiliado.",a?"success":"");
  }

  document.querySelector("#adminRefreshProducts")?.addEventListener("click",renderAdminProducts);
  document.querySelector("#adminClearForm")?.addEventListener("click",()=>{adminAffiliateForm.reset();adminAffiliateId.value="";adminAffiliateActive.checked=true;setMessage(adminFormMessage,"");});

  async function refreshAfterAffiliate(){await loadAffiliateLinks();products=applyAffiliateLinks(products);groupedProducts=groupProducts(products);renderGroupedProducts(groupedProducts);renderAdminProducts();}

  adminAffiliateForm?.addEventListener("submit",async e=>{
    e.preventDefault();if(!await getCurrentAdmin()){setMessage(adminFormMessage,"Sua sessão administrativa expirou.","error");return;}
    const id=adminAffiliateId.value.trim(),itemId=adminItemId.value.trim(),productId=adminProductId.value.trim(),title=adminProductTitle.value.trim(),url=adminAffiliateUrl.value.trim(),active=adminAffiliateActive.checked;
    if(!validAffiliateLink(url)){setMessage(adminFormMessage,"Cole um link válido do Mercado Livre.","error");return;}
    const payload={marketplace:"mercadolivre",item_id:itemId,catalog_product_id:productId||null,product_title:title,affiliate_url:url,active,updated_at:new Date().toISOString()};
    try{
      if(id){const {error}=await adminDb.from("affiliate_links").update(payload).eq("id",id);if(error)throw error;}
      else{const {data:ex,error:fe}=await adminDb.from("affiliate_links").select("id").eq("item_id",itemId).limit(1).maybeSingle();if(fe)throw fe;
        if(ex?.id){const {error}=await adminDb.from("affiliate_links").update(payload).eq("id",ex.id);if(error)throw error;}
        else{const {error}=await adminDb.from("affiliate_links").insert(payload);if(error)throw error;}}
      setMessage(adminFormMessage,"Link salvo com sucesso.","success");await refreshAfterAffiliate();await loadAdminLinks();
    }catch(err){console.error(err);setMessage(adminFormMessage,"Não foi possível salvar o link.","error");}
  });

  async function loadAdminLinks(){
    if(!adminLinksList||!await getCurrentAdmin())return;
    const {data,error}=await adminDb.from("affiliate_links").select("id, item_id, product_title, affiliate_url, active").order("updated_at",{ascending:false});
    if(error){adminLinksList.innerHTML='<div class="admin-empty">Não foi possível carregar os links.</div>';return;}
    const list=Array.isArray(data)?data:[];adminLinksList.innerHTML=list.length?list.map(l=>`<article class="admin-link-card"><div class="admin-link-data"><strong>${escapeHtml(l.product_title||"Produto")}</strong><small>${escapeHtml(l.item_id||"")}</small><em class="${l.active?"active":""}">${l.active?"ATIVO":"INATIVO"}</em></div><div class="admin-link-actions"><button data-admin-edit="${l.id}">EDITAR</button><button data-admin-delete="${l.id}">EXCLUIR</button></div></article>`).join(""):'<div class="admin-empty">Nenhum link cadastrado.</div>';
    adminLinksList.querySelectorAll("[data-admin-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("Excluir este link afiliado?"))return;await adminDb.from("affiliate_links").delete().eq("id",b.dataset.adminDelete);await refreshAfterAffiliate();await loadAdminLinks();});
    adminLinksList.querySelectorAll("[data-admin-edit]").forEach(b=>b.onclick=()=>{const l=list.find(x=>String(x.id)===String(b.dataset.adminEdit));if(!l)return;adminAffiliateId.value=l.id;adminItemId.value=l.item_id||"";adminProductTitle.value=l.product_title||"";adminAffiliateUrl.value=l.affiliate_url||"";adminAffiliateActive.checked=l.active!==false;});
  }
  document.querySelector("#adminRefreshLinks")?.addEventListener("click",loadAdminLinks);

  document.querySelectorAll(".bottom-nav-item").forEach(item=>item.onclick=()=>{document.querySelectorAll(".bottom-nav-item").forEach(n=>n.classList.remove("active"));item.classList.add("active");
    const a=item.dataset.nav;if(a==="home")window.scrollTo({top:0,behavior:"smooth"});if(a==="categories")categoriesSection?.scrollIntoView({behavior:"smooth"});if(a==="search")focusSearch();if(a==="favorites")scrollToOffers();if(a==="profile")openLogin();});
  document.querySelector(".header-heart")?.addEventListener("click",scrollToOffers);
  document.querySelector(".menu-button")?.addEventListener("click",()=>categoriesSection?.scrollIntoView({behavior:"smooth"}));
  document.querySelector(".highlight-button")?.addEventListener("click",scrollToOffers);
  document.querySelector(".products-show-all")?.addEventListener("click",()=>searchProducts(CONFIG.initialQuery));
  document.querySelector(".category-show-all")?.addEventListener("click",()=>categoriesSection?.scrollIntoView({behavior:"smooth"}));

  document.addEventListener("keydown",async e=>{if(e.key!=="Escape")return;closeCategory();closeLogin();closeSignup();if(adminLoginModal?.classList.contains("active")){await resetAdminSession();closeAdminLogin();}if(adminPanelModal?.classList.contains("active"))await closeAdminPanel();});



    updateFavoriteCounter();searchInput.value="";resetAdminSession();searchProducts(CONFIG.initialQuery,{scroll:false});
});
