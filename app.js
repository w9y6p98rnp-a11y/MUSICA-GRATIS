const catalog=[
{id:"carefree",title:"Carefree",artist:"Kevin MacLeod",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_Carefree.ogg",class:"a"},
{id:"acid",title:"AcidJazz",artist:"Kevin MacLeod",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_AcidJazz.ogg",class:"b"},
{id:"beat",title:"Beat electronic",artist:"beat",license:"Public domain",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Beat_electronic.ogg",class:"c"},
{id:"piano",title:"Piano and beat",artist:"Wiki Learning Tec de Monterrey",license:"Free use",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Piano_and_beat.ogg",class:"d"}
];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const audio=$("#audio"), player=$("#player"), toast=$("#toast");
let queue=[...catalog], index=0, shuffle=false, repeat=false, current=null;
let localSongs=[], favorites=JSON.parse(localStorage.getItem("mf_favs")||"[]"), playlists=JSON.parse(localStorage.getItem("mf_playlists")||"[]"), openPlaylistId=null;

const dbReq=indexedDB.open("MusicaGratisDB",1);
dbReq.onupgradeneeded=e=>e.target.result.createObjectStore("songs",{keyPath:"id"});
dbReq.onsuccess=e=>{window.db=e.target.result;loadLocal();};
function showToast(t){toast.textContent=t;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1800)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function allSongs(){return [...catalog,...localSongs]}
function getSong(id){return allSongs().find(x=>x.id===id)}
function isFav(id){return favorites.includes(id)}
function saveFavs(){localStorage.setItem("mf_favs",JSON.stringify(favorites))}
function savePlaylists(){localStorage.setItem("mf_playlists",JSON.stringify(playlists))}
function toggleFav(item){if(isFav(item.id))favorites=favorites.filter(x=>x!==item.id);else favorites.push(item.id);saveFavs();renderAll();if(current&&current.id===item.id)$("#favNow").textContent=isFav(item.id)?"♥":"♡"}
function actionsHTML(s, playClass="tiny"){
 return `<button class="${playClass}" onclick="playSong('${s.id}')">▶ Ascolta</button><button class="${playClass}" onclick="openPlaylistPicker('${s.id}')">＋ Playlist</button><button class="${playClass}" onclick="toggleFavoriteById('${s.id}')">${isFav(s.id)?"♥":"♡"}</button>`;
}
function renderCatalog(items=catalog){
 $("#catalogCount").textContent=`${items.length} brani`;
 $("#catalog").innerHTML=items.map(s=>`<article class="card"><div class="art ${s.class||""}">MUSICA LIBERA</div><div class="cardTitle">${esc(s.title)}</div><div class="cardArtist">${esc(s.artist)}</div><div class="cardActions">${actionsHTML(s)}</div></article>`).join("")
}
function renderLibrary(){
 $("#localCount").textContent=`${localSongs.length} ${localSongs.length===1?"brano":"brani"}`;
 $("#library").innerHTML=localSongs.length?localSongs.map(s=>songHTML(s)).join(""):`<div class="empty">Non hai ancora aggiunto musica dal telefono.</div>`;
}
function songHTML(s){return `<div class="song"><div class="thumb">♪</div><div class="info"><b>${esc(s.title)}</b><span>${esc(s.artist||"Musica locale")}</span></div><button class="songBtn" onclick="playSong('${s.id}')">▶</button><button class="songBtn" onclick="openPlaylistPicker('${s.id}')">＋</button><button class="heart" onclick="toggleFavoriteById('${s.id}')">${isFav(s.id)?"♥":"♡"}</button></div>`}
function renderFavorites(){const list=allSongs().filter(x=>isFav(x.id));$("#favoriteList").innerHTML=list.length?list.map(s=>songHTML(s)).join(""):`<div class="empty">Qui compariranno i tuoi brani preferiti.</div>`}
function renderPlaylists(){
 const box=$("#playlistsList");
 box.innerHTML=playlists.length?playlists.map(p=>`<button class="playlist" onclick="openPlaylist('${p.id}')"><div class="playlistIcon">♫</div><div><b>${esc(p.name)}</b><span>${p.ids.length} ${p.ids.length===1?"brano":"brani"}</span></div><strong>›</strong></button>`).join(""):`<div class="empty">Crea la tua prima playlist con “＋ Nuova”.</div>`;
 renderPlaylistDetail();
}
function renderPlaylistDetail(){
 const box=$("#playlistDetail");
 const p=playlists.find(x=>x.id===openPlaylistId);
 if(!p){box.classList.add("hidden");box.innerHTML="";return}
 const songs=p.ids.map(getSong).filter(Boolean);
 box.classList.remove("hidden");
 box.innerHTML=`<div class="detailHead"><div><span>PLAYLIST</span><h3>${esc(p.name)}</h3><small>${songs.length} ${songs.length===1?"brano":"brani"}</small></div><div class="detailActions"><button class="smallBtn" onclick="playPlaylist('${p.id}')">▶ Riproduci</button><button class="dangerBtn" onclick="deletePlaylist('${p.id}')">Elimina</button></div></div>${songs.length?songs.map(s=>`<div class="song"><div class="thumb">♪</div><div class="info"><b>${esc(s.title)}</b><span>${esc(s.artist||"Musica locale")}</span></div><button class="songBtn" onclick="playSong('${s.id}')">▶</button><button class="songBtn" onclick="removeFromPlaylist('${p.id}','${s.id}')">×</button></div>`).join(""):`<div class="empty">La playlist è vuota. Usa “＋ Playlist” su un brano per aggiungerlo.</div>`;
}
function renderAll(){renderCatalog();renderLibrary();renderFavorites();renderPlaylists()}
window.playSong=id=>{const s=getSong(id);if(s)start(s)};
window.toggleFavoriteById=id=>{const s=getSong(id);if(s)toggleFav(s)};
function start(s,customQueue=null){
 current=s;queue=customQueue||[...catalog,...localSongs];index=Math.max(0,queue.findIndex(x=>x.id===s.id));
 audio.src=s.url;audio.play().catch(()=>showToast("Tocca ▶ per avviare la riproduzione"));player.classList.remove("hidden");
 $("#nowTitle").textContent=s.title;$("#nowArtist").textContent=s.artist||"Musica locale";$("#favNow").textContent=isFav(s.id)?"♥":"♡";$("#playBtn").textContent="Ⅱ";$("#progress").value=0;$("#currentTime").textContent="0:00";
}
function next(){if(!queue.length)return;if(shuffle){let n=Math.floor(Math.random()*queue.length);if(queue.length>1&&n===index)n=(n+1)%queue.length;index=n}else index=(index+1)%queue.length;start(queue[index],queue)}
function prev(){if(audio.currentTime>3){audio.currentTime=0;return}index=(index-1+queue.length)%queue.length;start(queue[index],queue)}
$("#nextBtn").onclick=next;$("#prevBtn").onclick=prev;
$("#playBtn").onclick=()=>{if(!current)return;if(audio.paused){audio.play();$("#playBtn").textContent="Ⅱ"}else{audio.pause();$("#playBtn").textContent="▶"}};
$("#shuffleBtn").onclick=()=>{shuffle=!shuffle;$("#shuffleBtn").classList.toggle("on",shuffle);showToast(shuffle?"Shuffle attivo":"Shuffle disattivato")};
$("#repeatBtn").onclick=()=>{repeat=!repeat;audio.loop=repeat;$("#repeatBtn").classList.toggle("on",repeat);showToast(repeat?"Ripetizione attiva":"Ripetizione disattivata")};
$("#closePlayer").onclick=()=>player.classList.add("hidden");
$("#favNow").onclick=()=>current&&toggleFav(current);
audio.onended=()=>{if(!repeat)next()};
audio.ontimeupdate=()=>{if(audio.duration){$("#progress").value=audio.currentTime/audio.duration*100;$("#currentTime").textContent=time(audio.currentTime)}};
audio.onloadedmetadata=()=>$("#duration").textContent=time(audio.duration);
audio.onplay=()=>$("#playBtn").textContent="Ⅱ";audio.onpause=()=>$("#playBtn").textContent="▶";
$("#progress").oninput=e=>{if(audio.duration)audio.currentTime=e.target.value/100*audio.duration};
function time(s){s=Math.floor(s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}

$("#chooseBtn").onclick=()=>$("#fileInput").click();$("#addBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=e=>{if(!window.db)return;[...e.target.files].forEach(file=>{const id="local-"+crypto.randomUUID();const item={id,title:file.name.replace(/\.[^/.]+$/,""),artist:"Musica locale",blob:file};const tx=db.transaction("songs","readwrite");tx.objectStore("songs").put(item);tx.oncomplete=loadLocal});e.target.value=""};
function loadLocal(){if(!window.db)return;const tx=db.transaction("songs","readonly"),req=tx.objectStore("songs").getAll();req.onsuccess=()=>{localSongs=req.result.map(s=>({...s,url:URL.createObjectURL(s.blob)}));renderAll()}}

$("#searchInput").oninput=e=>{const q=e.target.value.toLowerCase().trim(),out=q?allSongs().filter(s=>(s.title+" "+(s.artist||"")).toLowerCase().includes(q)):[];$("#searchResults").innerHTML=out.length?out.map(songHTML).join(""):`<div class="empty">${q?"Nessun risultato.":"Scrivi un titolo o un artista per cercare."}</div>`};
$$('.navBtn').forEach(btn=>btn.onclick=()=>{$$('.navBtn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$$('.page').forEach(p=>p.classList.remove('active'));$('#'+btn.dataset.page).classList.add('active')});

$("#newPlaylist").onclick=()=>{const name=prompt("Nome della playlist");if(!name||!name.trim())return;const p={id:crypto.randomUUID(),name:name.trim(),ids:[]};playlists.push(p);savePlaylists();openPlaylistId=p.id;renderAll();showToast("Playlist creata")};
window.openPlaylist=id=>{openPlaylistId=id;renderPlaylistDetail();document.querySelector('#playlistDetail').scrollIntoView({behavior:'smooth',block:'start'})};
window.deletePlaylist=id=>{const p=playlists.find(x=>x.id===id);if(!p)return;if(!confirm(`Eliminare “${p.name}”?`))return;playlists=playlists.filter(x=>x.id!==id);savePlaylists();openPlaylistId=null;renderAll();showToast("Playlist eliminata")};
window.removeFromPlaylist=(pid,sid)=>{const p=playlists.find(x=>x.id===pid);if(!p)return;p.ids=p.ids.filter(id=>id!==sid);savePlaylists();renderAll();showToast("Brano rimosso")};
window.playPlaylist=id=>{const p=playlists.find(x=>x.id===id);if(!p)return;const songs=p.ids.map(getSong).filter(Boolean);if(!songs.length){showToast("Playlist vuota");return}queue=songs;index=0;start(songs[0],songs)};
window.openPlaylistPicker=id=>{const s=getSong(id);if(!s)return;$("#pickerTitle").textContent=s.title;$("#playlistPicker").dataset.songId=id;const list=$("#playlistPickerList");list.innerHTML=playlists.length?playlists.map(p=>{const has=p.ids.includes(id);return `<button class="pickerItem" onclick="addToPlaylist('${p.id}','${id}')"><span>♫</span><span><b>${esc(p.name)}</b><small>${p.ids.length} brani${has?" · già presente":""}</small></span><strong>${has?"✓":"＋"}</strong></button>`}).join(""):`<div class="empty">Non hai ancora playlist. Creane una e poi aggiungi il brano.</div>`;$("#playlistPicker").classList.remove("hidden")};
window.addToPlaylist=(pid,sid)=>{const p=playlists.find(x=>x.id===pid);if(!p)return;if(p.ids.includes(sid)){showToast("Brano già presente");return}p.ids.push(sid);savePlaylists();renderAll();$("#playlistPicker").classList.add("hidden");showToast("Aggiunto alla playlist")};
$("#closePicker").onclick=()=>$("#playlistPicker").classList.add("hidden");$("#playlistPicker").addEventListener("click",e=>{if(e.target.id==="playlistPicker")e.currentTarget.classList.add("hidden")});

renderAll();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
