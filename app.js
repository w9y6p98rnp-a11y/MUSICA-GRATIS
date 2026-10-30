const catalog=[
{id:"carefree",title:"Carefree",artist:"Kevin MacLeod",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_Carefree.ogg",class:"a"},
{id:"acid",title:"AcidJazz",artist:"Kevin MacLeod",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_AcidJazz.ogg",class:"b"},
{id:"beat",title:"Beat electronic",artist:"beat",license:"Public domain",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Beat_electronic.ogg",class:"c"},
{id:"piano",title:"Piano and beat",artist:"Wiki Learning Tec de Monterrey",license:"Free use",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Piano_and_beat.ogg",class:"d"}
];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const audio=$("#audio"), player=$("#player"), toast=$("#toast");
let queue=[...catalog], index=0, shuffle=false, repeat=false, current=null;
let localSongs=[], favorites=JSON.parse(localStorage.getItem("mf_favs")||"[]"), playlists=JSON.parse(localStorage.getItem("mf_playlists")||"[]");

const dbReq=indexedDB.open("MusicaGratisDB",1);
dbReq.onupgradeneeded=e=>e.target.result.createObjectStore("songs",{keyPath:"id"});
dbReq.onsuccess=e=>{window.db=e.target.result;loadLocal();};

function showToast(t){toast.textContent=t;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function isFav(id){return favorites.includes(id)}
function saveFavs(){localStorage.setItem("mf_favs",JSON.stringify(favorites))}
function toggleFav(item){if(isFav(item.id))favorites=favorites.filter(x=>x!==item.id);else favorites.push(item.id);saveFavs();renderAll();if(current&&current.id===item.id)$("#favNow").textContent=isFav(item.id)?"♥":"♡"}

function renderCatalog(items=catalog){
 $("#catalogCount").textContent=`${items.length} brani`;
 $("#catalog").innerHTML=items.map((s,i)=>`<article class="card"><div class="art ${s.class}">MUSICA LIBERA</div><div class="cardTitle">${esc(s.title)}</div><div class="cardArtist">${esc(s.artist)}</div><div class="cardActions"><button class="tiny" onclick="playCatalog('${s.id}')">▶ Ascolta</button><button class="tiny" onclick="favCatalog('${s.id}')">${isFav(s.id)?"♥":"♡"}</button></div></article>`).join("")
}
function renderLibrary(){
 $("#localCount").textContent=`${localSongs.length} ${localSongs.length===1?"brano":"brani"}`;
 $("#library").innerHTML=localSongs.length?localSongs.map(s=>songHTML(s)).join(""):`<div class="empty">Non hai ancora aggiunto musica dal telefono.</div>`;
}
function songHTML(s){return `<div class="song"><div class="thumb">♪</div><div class="info"><b>${esc(s.title)}</b><span>${esc(s.artist||"Musica locale")}</span></div><button class="songBtn" onclick="playLocal('${s.id}')">▶</button><button class="heart" onclick="favLocal('${s.id}')">${isFav(s.id)?"♥":"♡"}</button></div>`}
function renderFavorites(){
 const all=[...catalog,...localSongs], list=all.filter(x=>isFav(x.id));
 $("#favoriteList").innerHTML=list.length?list.map(s=>songHTML(s)).join(""):`<div class="empty">Qui compariranno i tuoi brani preferiti.</div>`;
}
function renderPlaylists(){
 $("#playlistsList").innerHTML=playlists.length?playlists.map((p,i)=>`<div class="playlist"><div class="playlistIcon">♫</div><div><b>${esc(p.name)}</b><span>${p.ids.length} brani</span></div></div>`).join(""):`<div class="empty">Crea la tua prima playlist con “＋ Nuova”.</div>`;
}
function renderAll(){renderCatalog();renderLibrary();renderFavorites();renderPlaylists()}

window.playCatalog=id=>{const s=catalog.find(x=>x.id===id);start(s)}
window.playLocal=id=>{const s=localSongs.find(x=>x.id===id);start(s)}
window.favCatalog=id=>{const s=catalog.find(x=>x.id===id);toggleFav(s)}
window.favLocal=id=>{const s=localSongs.find(x=>x.id===id);toggleFav(s)}

function start(s){
 current=s; queue=localSongs.some(x=>x.id===s.id)?localSongs:[...catalog];
 index=Math.max(0,queue.findIndex(x=>x.id===s.id));
 audio.src=s.url; audio.play(); player.classList.remove("hidden");
 $("#nowTitle").textContent=s.title;$("#nowArtist").textContent=s.artist||"Musica locale";$("#favNow").textContent=isFav(s.id)?"♥":"♡";$("#playBtn").textContent="Ⅱ";
}
function next(){
 if(!queue.length)return;
 if(shuffle)index=Math.floor(Math.random()*queue.length);else index=(index+1)%queue.length;
 start(queue[index]);
}
function prev(){if(audio.currentTime>3){audio.currentTime=0;return}index=(index-1+queue.length)%queue.length;start(queue[index])}
$("#nextBtn").onclick=next;$("#prevBtn").onclick=prev;
$("#playBtn").onclick=()=>{if(audio.paused){audio.play();$("#playBtn").textContent="Ⅱ"}else{audio.pause();$("#playBtn").textContent="▶"}};
$("#shuffleBtn").onclick=()=>{shuffle=!shuffle;$("#shuffleBtn").style.opacity=shuffle?1:.45;showToast(shuffle?"Shuffle attivo":"Shuffle disattivato")};
$("#repeatBtn").onclick=()=>{repeat=!repeat;audio.loop=repeat;$("#repeatBtn").style.opacity=repeat?1:.45};
$("#closePlayer").onclick=()=>player.classList.add("hidden");
$("#favNow").onclick=()=>current&&toggleFav(current);
audio.onended=()=>{if(!repeat)next()};
audio.ontimeupdate=()=>{if(audio.duration){$("#progress").value=audio.currentTime/audio.duration*100;$("#currentTime").textContent=time(audio.currentTime)}};
audio.onloadedmetadata=()=>$("#duration").textContent=time(audio.duration);
$("#progress").oninput=e=>{if(audio.duration)audio.currentTime=e.target.value/100*audio.duration};
function time(s){s=Math.floor(s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}

$("#chooseBtn").onclick=()=>$("#fileInput").click();$("#addBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=e=>{
 if(!window.db)return;
 [...e.target.files].forEach(file=>{
  const id="local-"+crypto.randomUUID();
  const item={id,title:file.name.replace(/\.[^/.]+$/,""),artist:"Musica locale",blob:file};
  const tx=db.transaction("songs","readwrite");tx.objectStore("songs").put(item);tx.oncomplete=loadLocal;
 });e.target.value=""
};
function loadLocal(){
 if(!window.db)return;
 const tx=db.transaction("songs","readonly"), req=tx.objectStore("songs").getAll();
 req.onsuccess=()=>{localSongs=req.result.map(s=>({...s,url:URL.createObjectURL(s.blob)}));renderAll()}
}

$("#searchInput").oninput=e=>{
 const q=e.target.value.toLowerCase().trim(), all=[...catalog,...localSongs];
 const out=q?all.filter(s=>(s.title+" "+(s.artist||"")).toLowerCase().includes(q)):[];
 $("#searchResults").innerHTML=out.length?out.map(songHTML).join(""):`<div class="empty">${q?"Nessun risultato.":"Scrivi un titolo o un artista per cercare."}</div>`
};
$$(".navBtn").forEach(btn=>btn.onclick=()=>{$$(".navBtn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");$$(".page").forEach(p=>p.classList.remove("active"));$("#"+btn.dataset.page).classList.add("active")});
$("#newPlaylist").onclick=()=>{
 const name=prompt("Nome della playlist");
 if(!name)return;
 playlists.push({id:crypto.randomUUID(),name,ids:[]});localStorage.setItem("mf_playlists",JSON.stringify(playlists));renderPlaylists();showToast("Playlist creata")
};

renderAll();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
