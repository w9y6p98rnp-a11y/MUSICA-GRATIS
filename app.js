const catalog=[
{id:"carefree",title:"Carefree",artist:"Kevin MacLeod",genre:"Jazz",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_Carefree.ogg",class:"a"},
{id:"acid",title:"AcidJazz",artist:"Kevin MacLeod",genre:"Jazz",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_AcidJazz.ogg",class:"b"},
{id:"beat",title:"Beat electronic",artist:"beat",genre:"Elettronica",license:"Public domain",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Beat_electronic.ogg",class:"c"},
{id:"piano",title:"Piano and beat",artist:"Wiki Learning Tec de Monterrey",genre:"Ambient",license:"Free use",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Piano_and_beat.ogg",class:"d"},
{id:"meditation",title:"Meditation Impromptu 03",artist:"Kevin MacLeod",genre:"Ambient",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_03_-_Meditation_Impromptu_03.ogg",class:"e"},
{id:"slowburn",title:"Slow Burn",artist:"Kevin MacLeod",genre:"Blues",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_08_-_Slow_Burn.ogg",class:"f"},
{id:"gregorian",title:"Gregorian Chant",artist:"Kevin MacLeod",genre:"Classica",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/KevinMacLeod_-_Gregorian_Chant.ogg",class:"g"},
{id:"radio",title:"Radio Martini",artist:"Kevin MacLeod",genre:"Jazz",license:"CC BY 3.0",url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_Radio_Martini.ogg",class:"h"}
];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const audio=$("#audio"), player=$("#player"), toast=$("#toast");
let queue=[...catalog], index=0, shuffle=false, repeat=false, current=null;
let localSongs=[], activeArtist="Tutti", favorites=JSON.parse(localStorage.getItem("mf_favs")||"[]"), playlists=JSON.parse(localStorage.getItem("mf_playlists")||"[]"), recent=JSON.parse(localStorage.getItem("mf_recent")||"[]"), openPlaylistId=null, activeGenre="Tutti";

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
function saveRecent(){localStorage.setItem("mf_recent",JSON.stringify(recent))}
function toggleFav(item){if(isFav(item.id))favorites=favorites.filter(x=>x!==item.id);else favorites.push(item.id);saveFavs();renderAll();if(current&&current.id===item.id)$("#favNow").textContent=isFav(item.id)?"♥":"♡"}
function actionsHTML(s, playClass="tiny"){
 return `<button class="${playClass}" onclick="playSong('${s.id}')">▶ Ascolta</button><button class="${playClass}" onclick="addNextById('${s.id}')">⏭ Dopo</button><button class="${playClass}" onclick="openPlaylistPicker('${s.id}')">＋ Playlist</button><button class="${playClass}" onclick="toggleFavoriteById('${s.id}')">${isFav(s.id)?"♥":"♡"}</button>`;
}
function renderGenreFilters(){
 const genres=["Tutti",...new Set(catalog.map(s=>s.genre))];
 $("#genreFilters").innerHTML=genres.map(g=>`<button class="chip ${g===activeGenre?"active":""}" onclick="setGenre('${esc(g)}')">${esc(g)}</button>`).join("");
}
window.setGenre=g=>{activeGenre=g;activeArtist="Tutti";renderCatalog();renderGenreFilters();renderArtists()};
function renderCatalog(){
 let items=activeGenre==="Tutti"?catalog:catalog.filter(s=>s.genre===activeGenre);
 if(activeArtist!=="Tutti") items=items.filter(s=>s.artist===activeArtist);
 $("#catalogCount").textContent=`${items.length} brani`;
 $("#catalog").innerHTML=items.map(s=>`<article class="card"><div class="art ${s.class||""}">MUSICA LIBERA</div><div class="cardTitle">${esc(s.title)}</div><div class="cardArtist">${esc(s.artist)}</div><div class="cardActions">${actionsHTML(s)}</div></article>`).join("")
}
function renderArtists(){
 const artists=[...new Set(catalog.map(s=>s.artist))];
 $("#artistCount").textContent=`${artists.length} artisti`;
 $("#artists").innerHTML=artists.map((a,i)=>{
   const songs=catalog.filter(s=>s.artist===a);
   const letter=a.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
   return `<button class="artistCard artist-${i%6}" onclick="openArtist('${encodeURIComponent(a)}')"><div class="artistAvatar">${esc(letter)}</div><div><b>${esc(a)}</b><span>${songs.length} ${songs.length===1?"brano":"brani"}</span></div></button>`;
 }).join("");
}
window.setArtist=a=>{activeArtist=a;renderCatalog();renderArtists();showToast(a==="Tutti"?"Tutti gli artisti":`Artista: ${a}`);window.scrollTo({top:0,behavior:"smooth"})};

function coverClass(s){return s&&s.class?`art ${s.class}`:"art local"}
function coverLetter(s){return s&&s.title?s.title.slice(0,1).toUpperCase():"♪"}

function renderRecent(){
 const items=recent.map(getSong).filter(Boolean);
 $("#recentCount").textContent=`${items.length} ${items.length===1?"brano":"brani"}`;
 $("#recentList").innerHTML=items.length?items.map(songHTML).join(""):`<div class="empty">Qui appariranno i brani che ascolti.</div>`;
}
function renderLibrary(){
 $("#localCount").textContent=`${localSongs.length} ${localSongs.length===1?"brano":"brani"}`;
 $("#library").innerHTML=localSongs.length?localSongs.map(s=>songHTML(s)).join(""):`<div class="empty">Non hai ancora aggiunto musica dal telefono.</div>`;
}
function songHTML(s){return `<div class="song"><button class="thumb ${s.class||"local"}" onclick="openTrackDetail('${s.id}')">${esc((s.title||"♪").slice(0,1).toUpperCase())}</button><button class="info" onclick="openTrackDetail('${s.id}')"><b>${esc(s.title)}</b><span>${esc(s.artist||"Musica locale")}</span></button><button class="songBtn" onclick="playSong('${s.id}')">▶</button><button class="songBtn" onclick="addNextById('${s.id}')">⏭</button><button class="songBtn" onclick="openPlaylistPicker('${s.id}')">＋</button><button class="heart" onclick="toggleFavoriteById('${s.id}')">${isFav(s.id)?"♥":"♡"}</button></div>`}
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
 const rows=songs.map(s=>'<div class="song"><div class="thumb">♪</div><div class="info"><b>'+esc(s.title)+'</b><span>'+esc(s.artist||"Musica locale")+'</span></div><button class="songBtn" onclick="playSong(\''+s.id+'\')">▶</button><button class="songBtn" onclick="removeFromPlaylist(\''+p.id+'\',\''+s.id+'\')">×</button></div>').join("");
 const empty='<div class="empty">La playlist è vuota. Usa “＋ Playlist” su un brano per aggiungerlo.</div>';
 box.innerHTML='<div class="detailHead"><div><span>PLAYLIST</span><h3>'+esc(p.name)+'</h3><small>'+songs.length+' '+(songs.length===1?"brano":"brani")+'</small></div><div class="detailActions"><button class="smallBtn" onclick="playPlaylist(\''+p.id+'\')">▶ Riproduci</button><button class="dangerBtn" onclick="deletePlaylist(\''+p.id+'\')">Elimina</button></div></div>'+(songs.length?rows:empty);
}
function renderAll(){renderGenreFilters();renderCatalog();renderArtists();renderRecent();renderLibrary();renderFavorites();renderPlaylists()}
window.openTrackDetail=id=>{
 const s=getSong(id); if(!s)return;
 const fav=isFav(id);
 const genre=s.genre||"Locale";
 const license=s.license||"Musica locale";
 $("#trackDetailContent").innerHTML=`<div class="detailHero"><div class="detailCover ${s.class||"local"}"><span>♪</span></div><div class="detailMain"><span class="detailEyebrow">${esc(genre)}</span><h2>${esc(s.title)}</h2><p>${esc(s.artist||"Musica locale")}</p><small>${esc(license)}</small></div></div><div class="detailButtons"><button class="primary" onclick="playSong('${s.id}');closeTrackDetail()">▶ Riproduci</button><button class="detailBtn" onclick="addNextById('${s.id}');closeTrackDetail()">⏭ Dopo</button><button class="detailBtn" onclick="toggleFavoriteById('${s.id}');openTrackDetail('${s.id}')">${fav?"♥ Nei preferiti":"♡ Preferiti"}</button><button class="detailBtn" onclick="openPlaylistPicker('${s.id}');closeTrackDetail()">＋ Playlist</button></div><div class="detailInfo"><div><span>ARTISTA</span><b>${esc(s.artist||"Musica locale")}</b></div><div><span>GENERE</span><b>${esc(genre)}</b></div><div><span>LICENZA</span><b>${esc(license)}</b></div></div>`;
 $("#trackDetail").classList.remove("hidden");
};
window.closeTrackDetail=()=>$("#trackDetail").classList.add("hidden");
$("#closeTrackDetail").onclick=closeTrackDetail;
$("#trackDetail").addEventListener("click",e=>{if(e.target.id==="trackDetail")closeTrackDetail()});

window.openArtist=encoded=>{
 const artist=decodeURIComponent(encoded);
 const songs=catalog.filter(s=>s.artist===artist);
 if(!songs.length)return;
 const letters=artist.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
 const genres=[...new Set(songs.map(s=>s.genre))];
 const totalLabel=songs.length===1?"1 brano":`${songs.length} brani`;
 $("#artistDetailContent").innerHTML=`
   <div class="artistHero">
     <div class="artistHeroAvatar">${esc(letters)}</div>
     <div class="artistHeroMain">
       <span class="detailEyebrow">ARTISTA</span>
       <h2>${esc(artist)}</h2>
       <p>${totalLabel} · ${esc(genres.join(" · "))}</p>
     </div>
   </div>
   <div class="artistHeroActions">
     <button class="primary" onclick="playArtist('${encodeURIComponent(artist)}')">▶ Riproduci tutto</button>
     <button class="detailBtn" onclick="setArtistFromDetail('${encodeURIComponent(artist)}');closeArtistDetail()">⌕ Vedi nel catalogo</button>
   </div>
   <div class="artistTrackList">${songs.map((s,i)=>`<div class="artistTrack"><button class="artistTrackCover ${s.class||"local"}" onclick="openTrackDetail('${s.id}')">${i+1}</button><button class="artistTrackInfo" onclick="openTrackDetail('${s.id}')"><b>${esc(s.title)}</b><span>${esc(s.genre)}</span></button><button class="songBtn" onclick="playSong('${s.id}')">▶</button><button class="songBtn" onclick="addNextById('${s.id}')">⏭</button><button class="heart" onclick="toggleFavoriteById('${s.id}')">${isFav(s.id)?"♥":"♡"}</button></div>`).join("")}</div>`;
 $("#artistDetail").classList.remove("hidden");
};
window.closeArtistDetail=()=>$("#artistDetail").classList.add("hidden");
$("#closeArtistDetail").onclick=closeArtistDetail;
$("#artistDetail").addEventListener("click",e=>{if(e.target.id==="artistDetail")closeArtistDetail()});
window.playArtist=encoded=>{const artist=decodeURIComponent(encoded);const songs=catalog.filter(s=>s.artist===artist);if(!songs.length)return;queue=songs;index=0;start(songs[0],songs);closeArtistDetail()};
window.setArtistFromDetail=encoded=>{const artist=decodeURIComponent(encoded);activeArtist=artist;activeGenre="Tutti";renderCatalog();renderGenreFilters();renderArtists();showToast(`Artista: ${artist}`);window.scrollTo({top:0,behavior:"smooth"})};

window.playSong=id=>{const s=getSong(id);if(s)start(s)};
function renderQueue(){
 const box=$("#queueList");
 if(!queue.length){box.innerHTML='<div class="empty">La coda è vuota.</div>';return}
 const upcoming=queue.map((s,i)=>({s,i})).filter(x=>x.i!==index);
 const currentRow=current?`<div class="queueCurrent"><span>IN RIPRODUZIONE</span><b>${esc(current.title)}</b><small>${esc(current.artist||"Musica locale")}</small></div>`:"";
 box.innerHTML=currentRow+(upcoming.length ? upcoming.map(x=>`<button class="queueItem" onclick="playQueueIndex(${x.i})"><span>${x.i+1}</span><div><b>${esc(x.s.title)}</b><small>${esc(x.s.artist||"Musica locale")}</small></div><strong>▶</strong></button>`).join("") : '<div class="empty">Nessun altro brano in coda.</div>');
}
window.playQueueIndex=i=>{if(!queue[i])return;index=i;start(queue[i],queue);renderQueue()};
window.addNextById=id=>{const s=getSong(id);if(!s)return;if(!current){start(s);return}const existing=queue.findIndex(x=>x.id===id);if(existing>=0){queue.splice(existing,1);if(existing<index)index--;}queue.splice(index+1,0,s);showToast("Aggiunto alla coda");renderQueue()};

window.toggleFavoriteById=id=>{const s=getSong(id);if(s)toggleFav(s)};
function start(s,customQueue=null){
 current=s;
 recent=[s.id,...recent.filter(id=>id!==s.id)].slice(0,8);saveRecent();queue=customQueue||[...catalog,...localSongs];index=Math.max(0,queue.findIndex(x=>x.id===s.id));
 audio.src=s.url;audio.play().catch(()=>showToast("Tocca ▶ per avviare la riproduzione"));player.classList.remove("hidden");
 $("#nowTitle").textContent=s.title;$("#nowArtist").textContent=s.artist||"Musica locale";$("#favNow").textContent=isFav(s.id)?"♥":"♡";$("#nowCover").className=`cover big ${s.class||"local"}`;$("#nowCover").textContent="♪";$("#playBtn").textContent="Ⅱ";$("#progress").value=0;$("#currentTime").textContent="0:00";
 renderQueue();
}
function next(){if(!queue.length)return;if(shuffle){let n=Math.floor(Math.random()*queue.length);if(queue.length>1&&n===index)n=(n+1)%queue.length;index=n}else index=(index+1)%queue.length;start(queue[index],queue)}
function prev(){if(audio.currentTime>3){audio.currentTime=0;return}index=(index-1+queue.length)%queue.length;start(queue[index],queue)}
$("#nextBtn").onclick=next;$("#prevBtn").onclick=prev;
$("#playBtn").onclick=()=>{if(!current)return;if(audio.paused){audio.play();$("#playBtn").textContent="Ⅱ"}else{audio.pause();$("#playBtn").textContent="▶"}};
$("#shuffleBtn").onclick=()=>{shuffle=!shuffle;$("#shuffleBtn").classList.toggle("on",shuffle);showToast(shuffle?"Shuffle attivo":"Shuffle disattivato")};
$("#repeatBtn").onclick=()=>{repeat=!repeat;audio.loop=repeat;$("#repeatBtn").classList.toggle("on",repeat);showToast(repeat?"Ripetizione attiva":"Ripetizione disattivata")};
$("#closePlayer").onclick=()=>player.classList.add("hidden");
$("#queueBtn").onclick=()=>{$("#queueModal").classList.remove("hidden");renderQueue()};
$("#closeQueue").onclick=()=>$("#queueModal").classList.add("hidden");
$("#queueModal").addEventListener("click",e=>{if(e.target.id==="queueModal")e.currentTarget.classList.add("hidden")});
$("#favNow").onclick=()=>current&&toggleFav(current);
audio.onended=()=>{if(!repeat)next()};
audio.ontimeupdate=()=>{if(audio.duration){$("#progress").value=audio.currentTime/audio.duration*100;$("#currentTime").textContent=time(audio.currentTime)}};
audio.onloadedmetadata=()=>$("#duration").textContent=time(audio.duration);
audio.onplay=()=>$("#playBtn").textContent="Ⅱ";audio.onpause=()=>$("#playBtn").textContent="▶";
$("#progress").oninput=e=>{if(audio.duration)audio.currentTime=e.target.value/100*audio.duration};
function time(s){s=Math.floor(s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}

$("#chooseBtn").onclick=()=>$("#fileInput").click();$("#addBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=e=>{if(!window.db)return;[...e.target.files].forEach(file=>{const id="local-"+crypto.randomUUID();const item={id,title:file.name.replace(/\.[^/.]+$/,""),artist:"Musica locale",genre:"Locale",class:"local",blob:file};const tx=db.transaction("songs","readwrite");tx.objectStore("songs").put(item);tx.oncomplete=loadLocal});e.target.value=""};
function loadLocal(){if(!window.db)return;const tx=db.transaction("songs","readonly"),req=tx.objectStore("songs").getAll();req.onsuccess=()=>{localSongs=req.result.map(s=>({...s,url:URL.createObjectURL(s.blob)}));renderAll()}}

$("#searchInput").oninput=e=>{const q=e.target.value.toLowerCase().trim(),out=q?allSongs().filter(s=>(s.title+" "+(s.artist||"")+" "+(s.genre||"")).toLowerCase().includes(q)):[];$("#searchResults").innerHTML=out.length?out.map(songHTML).join(""):`<div class="empty">${q?"Nessun risultato.":"Scrivi un titolo, artista o genere per cercare."}</div>`};
$$('.navBtn').forEach(btn=>btn.onclick=()=>{$$('.navBtn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$$('.page').forEach(p=>p.classList.remove('active'));$('#'+btn.dataset.page).classList.add('active')});

$("#newPlaylist").onclick=()=>{const name=prompt("Nome della playlist");if(!name||!name.trim())return;const p={id:crypto.randomUUID(),name:name.trim(),ids:[]};playlists.push(p);savePlaylists();openPlaylistId=p.id;renderAll();showToast("Playlist creata")};
window.openPlaylist=id=>{openPlaylistId=id;renderPlaylistDetail();document.querySelector('#playlistDetail').scrollIntoView({behavior:'smooth',block:'start'})};
window.renamePlaylist=id=>{const p=playlists.find(x=>x.id===id);if(!p)return;const name=prompt("Nuovo nome",p.name);if(!name||!name.trim())return;p.name=name.trim();savePlaylists();renderAll();showToast("Playlist rinominata")};
window.deletePlaylist=id=>{const p=playlists.find(x=>x.id===id);if(!p)return;if(!confirm(`Eliminare “${p.name}”?`))return;playlists=playlists.filter(x=>x.id!==id);savePlaylists();openPlaylistId=null;renderAll();showToast("Playlist eliminata")};
window.removeFromPlaylist=(pid,sid)=>{const p=playlists.find(x=>x.id===pid);if(!p)return;p.ids=p.ids.filter(id=>id!==sid);savePlaylists();renderAll();showToast("Brano rimosso")};
window.playPlaylist=id=>{const p=playlists.find(x=>x.id===id);if(!p)return;const songs=p.ids.map(getSong).filter(Boolean);if(!songs.length){showToast("Playlist vuota");return}queue=songs;index=0;start(songs[0],songs)};
window.openPlaylistPicker=id=>{const s=getSong(id);if(!s)return;$("#pickerTitle").textContent=s.title;$("#playlistPicker").dataset.songId=id;const list=$("#playlistPickerList");list.innerHTML=playlists.length?playlists.map(p=>{const has=p.ids.includes(id);return `<button class="pickerItem" onclick="addToPlaylist('${p.id}','${id}')"><span>♫</span><span><b>${esc(p.name)}</b><small>${p.ids.length} brani${has?" · già presente":""}</small></span><strong>${has?"✓":"＋"}</strong></button>`}).join(""):`<div class="empty">Non hai ancora playlist. Creane una e poi aggiungi il brano.</div>`;$("#playlistPicker").classList.remove("hidden")};
window.addToPlaylist=(pid,sid)=>{const p=playlists.find(x=>x.id===pid);if(!p)return;if(p.ids.includes(sid)){showToast("Brano già presente");return}p.ids.push(sid);savePlaylists();renderAll();$("#playlistPicker").classList.add("hidden");showToast("Aggiunto alla playlist")};
$("#closePicker").onclick=()=>$("#playlistPicker").classList.add("hidden");$("#playlistPicker").addEventListener("click",e=>{if(e.target.id==="playlistPicker")e.currentTarget.classList.add("hidden")});

renderAll();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
