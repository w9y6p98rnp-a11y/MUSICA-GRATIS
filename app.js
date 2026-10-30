const input=document.getElementById('fileInput'), choose=document.getElementById('chooseBtn'), add=document.getElementById('addBtn');
const library=document.getElementById('library'), count=document.getElementById('count'), player=document.getElementById('player');
const audio=document.getElementById('audio'), title=document.getElementById('title'), artist=document.getElementById('artist'), fav=document.getElementById('favBtn');
let songs=[];

choose.onclick=()=>input.click(); add.onclick=()=>input.click();
input.onchange=()=>{songs=[...songs,...[...input.files].map(file=>({file,name:file.name.replace(/\.[^/.]+$/,''),url:URL.createObjectURL(file),favorite:false}))]; render(); input.value='';};

function render(){
 count.textContent=`${songs.length} ${songs.length===1?'brano':'brani'}`;
 if(!songs.length){library.innerHTML='<div class="empty">Non hai ancora aggiunto brani.<br>Premi “Aggiungi musica” per iniziare.</div>';return}
 library.innerHTML='';
 songs.forEach((s,i)=>{
  const el=document.createElement('div'); el.className='song';
  el.innerHTML=`<div class="thumb">♪</div><div class="info"><b>${escapeHtml(s.name)}</b><span>Musica locale</span></div><button class="play">▶</button>`;
  el.querySelector('.play').onclick=()=>play(i); library.appendChild(el);
 });
}
function play(i){const s=songs[i];audio.src=s.url;title.textContent=s.name;artist.textContent='Musica locale';player.classList.remove('hidden');audio.play();}
function escapeHtml(x){return x.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
fav.onclick=()=>{fav.textContent=fav.textContent==='♡'?'♥':'♡';};
render();