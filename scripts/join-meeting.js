import { chromium } from "playwright";
import { SELECTORS } from "./selectors.js";

const MEETING_LINK=process.env.MEETING_LINK;
const DISPLAY_NAME=process.env.DISPLAY_NAME;
const DURATION_MINUTES=Number(process.env.DURATION_MINUTES);
const JOB_ID=process.env.JOB_ID||"unknown";
const GH_TOKEN=process.env.GH_TOKEN;
const OWNER=process.env.GITHUB_OWNER;
const REPO=process.env.GITHUB_REPO;
const WORKFLOW="join-meeting.yml";
const SAFE_LIMIT_MIN=350;
if(!MEETING_LINK||!DISPLAY_NAME||!Number.isFinite(DURATION_MINUTES)) throw new Error("MEETING_LINK, DISPLAY_NAME and DURATION_MINUTES are required.");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const log=(...x)=>console.log(new Date().toISOString(),...x);
async function firstVisible(page,candidates,timeout=5000){for(const selector of candidates){try{const loc=page.locator(selector).first();if(await loc.isVisible({timeout}))return loc}catch{}}return null}
async function clickIfVisible(page,candidates){const loc=await firstVisible(page,candidates,1500);if(loc){await loc.click({timeout:3000}).catch(()=>{});return true}return false}
async function screenshot(page){try{await page.screenshot({path:"screenshot.png",fullPage:true})}catch{}}
async function chainIfNeeded(remaining){if(remaining<=0)return;if(!GH_TOKEN||!OWNER||!REPO)throw new Error("Cannot auto-chain: GH_TOKEN/GITHUB_OWNER/GITHUB_REPO missing.");const start=new Date(Date.now()+5000).toISOString();const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,{method:"POST",headers:{Authorization:`Bearer ${GH_TOKEN}`,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"},body:JSON.stringify({ref:process.env.GITHUB_REF_NAME||"main",inputs:{meeting_link:MEETING_LINK,display_name:DISPLAY_NAME,start_time:start,duration_minutes:String(remaining),job_id:`${JOB_ID}-chain-${Date.now()}`}})});if(!r.ok)throw new Error(`Chaining dispatch failed: ${r.status} ${await r.text()}`);log(`Chained next run for ${remaining} minutes.`)}
let browser;
try{
  log(`Starting attendee job ${JOB_ID}`);
  browser=await chromium.launch({headless:true,args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--disable-dev-shm-usage"]});
  const context=await browser.newContext({permissions:[]});
  const page=await context.newPage();
  page.on("console",msg=>log(`[browser:${msg.type()}]`,msg.text()));
  page.on("pageerror",err=>log("[pageerror]",err.message));
  log("Opening meeting link.");
  await page.goto(MEETING_LINK,{waitUntil:"domcontentloaded",timeout:60000});
  log("Handling web/app choice.");
  await clickIfVisible(page,SELECTORS.continueInBrowser);
  log("Waiting for pre-join screen.");
  const name=await firstVisible(page,SELECTORS.nameInput,15000);
  if(name){await name.fill(DISPLAY_NAME);log("Display name filled.")}else log("Name input not found; provider may already have a name/session.");
  for(const candidates of [SELECTORS.micButton,SELECTORS.cameraButton]){const control=await firstVisible(page,candidates,2500);if(control){const label=((await control.getAttribute("aria-label"))||"").toLowerCase();const title=((await control.getAttribute("title"))||"").toLowerCase();const text=`${label} ${title}`;if(/\b(on|unmute)\b/.test(text)){await control.click().catch(()=>{});log("Toggled a media control off.")}}}
  log("Clicking Join.");
  if(!await clickIfVisible(page,SELECTORS.joinButton,8000))throw new Error("Join button not found.");
  log("Waiting for in-call UI (up to 10 minutes).");
  const deadline=Date.now()+10*60*1000;let joined=false;
  while(Date.now()<deadline){if(await firstVisible(page,SELECTORS.inCall,1500)){joined=true;break}await sleep(5000)}
  if(!joined)throw new Error("Could not confirm that the attendee joined the call.");
  log(`Joined successfully. Requested duration: ${DURATION_MINUTES} min.`);
  const runMinutes=Math.min(DURATION_MINUTES,SAFE_LIMIT_MIN),remaining=DURATION_MINUTES-runMinutes;
  if(remaining>0){const chainLeadMs=90000;const waitMs=Math.max(0,runMinutes*60000-chainLeadMs);log(`Chaining next run ${Math.ceil(remaining)} min before this run ends.`);await sleep(waitMs);await chainIfNeeded(Math.ceil(remaining));await sleep(Math.max(0,runMinutes*60000-waitMs))}else await sleep(runMinutes*60000);
  log("Leaving meeting.");
  await clickIfVisible(page,SELECTORS.leaveButton,5000);await sleep(3000);await browser.close();log("Browser closed. Job complete.");
}catch(err){log("ERROR:",err.stack||err.message);if(browser){try{const pages=browser.contexts()[0]?.pages()||[];if(pages[0])await screenshot(pages[0])}catch{}await browser.close().catch(()=>{})}process.exitCode=1}
