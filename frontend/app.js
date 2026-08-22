const API_BASE = window.__API_BASE__ || "https://automated-meeting-attendee-backend-yashraj-ghemuds-projects.vercel.app";
const API_KEY = window.__SCHEDULER_API_KEY__ || "";
function apiHeaders(extra={}) { return API_KEY ? {...extra, "x-api-key": API_KEY} : extra; }
const form = document.querySelector("#scheduleForm");
const toast = document.querySelector("#toast");
const meetingsEl = document.querySelector("#meetings");
const refreshBtn = document.querySelector("#refreshBtn");
function showToast(message,error=false){toast.textContent=message;toast.style.background=error?"#fde7e7":"#edf5ff";toast.style.color=error?"#8f1d1d":"#174b7a";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),5000)}
function fmt(value){return new Date(value).toLocaleString()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
async function loadMeetings(){try{const r=await fetch(`${API_BASE}/api/meetings`,{headers:apiHeaders()});if(!r.ok)throw new Error("Could not load meetings");const data=await r.json();if(!data.meetings.length){meetingsEl.innerHTML='<p class="muted">No meetings scheduled yet.</p>';return}meetingsEl.innerHTML=data.meetings.map(m=>`<article class="meeting"><div class="meeting-top"><div class="name">${esc(m.displayName)}</div><span class="status ${esc(m.status)}">${esc(m.status)}</span></div><div class="meta">${fmt(m.startTime)} → ${fmt(m.endTime)}</div><div class="meta">${esc(m.meetingLink)}</div><div class="meta">Job: ${esc(m.id)}</div></article>`).join("")}catch(e){meetingsEl.innerHTML=`<p class="muted">${esc(e.message)}</p>`}}
form.addEventListener("submit",async e=>{e.preventDefault();const button=form.querySelector("button[type=submit]");button.disabled=true;try{const payload={meetingLink:document.querySelector("#meetingLink").value.trim(),displayName:document.querySelector("#displayName").value.trim(),startTime:new Date(document.querySelector("#startTime").value).toISOString(),endTime:new Date(document.querySelector("#endTime").value).toISOString()};const r=await fetch(`${API_BASE}/api/schedule-meeting`,{method:"POST",headers:apiHeaders({"Content-Type":"application/json"}),body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data.error||"Scheduling failed");showToast("Meeting scheduled successfully.");form.reset();await loadMeetings()}catch(e){showToast(e.message,true)}finally{button.disabled=false}});
refreshBtn.addEventListener("click",loadMeetings);loadMeetings();setInterval(loadMeetings,30000);
