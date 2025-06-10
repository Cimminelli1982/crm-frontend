"use strict";(self.webpackChunkcontact_dashboard=self.webpackChunkcontact_dashboard||[]).push([[647],{7647:(e,t,o)=>{o.r(t),o.d(t,{default:()=>L});var n=o(5043),r=o(3216),a=o(1529),i=o(5315),s=o(8136),c=o(1009),l=o(579);const d=a.Ay.div`
  padding: 15px 25px 15px 15px;
  height: calc(100vh - 60px);
  width: 100%;
  display: flex;
  
  .action-cell-no-click {
    z-index: 5;
  }
`,p=a.Ay.div`
  width: 15%;
  padding-right: 15px;
  border-right: 1px solid #333;
`,f=a.Ay.div`
  width: 85%;
  padding-left: 15px;
  overflow: hidden;
`,u=a.Ay.h3`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
  font-size: 0.9rem;
  text-transform: uppercase;
`,m=a.Ay.div`
  height: calc(100vh - 120px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #121212;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #333;
    border-radius: 3px;
  }
`,h=a.Ay.div`
  padding: 6px 8px;
  margin-bottom: 4px;
  background-color: #1a1a1a;
  border-radius: 3px;
  border: 1px solid transparent;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #cccccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #00ff00;
    background-color: #112211;
  }
`,x=a.Ay.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 75%;
`,g=a.Ay.span`
  background-color: #112211;
  color: #00ff00;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 0.7rem;
  min-width: 20px;
  text-align: center;
  margin-left: 4px;
`,b=a.Ay.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`,_=a.Ay.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`,w=a.Ay.div`
  width: 300px;
  height: 8px;
  background-color: #111;
  margin: 20px 0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background-color: #00ff00;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px #00ff00;
    border-radius: 4px;
  }
  
  @keyframes pulse {
    0% {
      left: -30%;
      opacity: 0.8;
    }
    100% {
      left: 100%;
      opacity: 0.2;
    }
  }
`,y=a.Ay.div`
  margin-top: 15px;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  letter-spacing: 1px;
  font-size: 16px;
  opacity: 0.9;
  animation: blink 1.5s ease-in-out infinite alternate;
  
  @keyframes blink {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
`,v=a.Ay.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #00ff00;
  text-align: center;
  margin-top: 30px;
  height: 100px;
  width: 300px;
  overflow: hidden;
  position: relative;
  
  &:after {
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01010111 01101000 01100001 01110100 01110011 01100001 01110000 01110000...";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(to bottom, transparent, #000 80%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    opacity: 0.7;
    text-shadow: 0 0 5px #00ff00;
    animation: matrix 5s linear infinite;
  }
  
  @keyframes matrix {
    0% { transform: translateY(-60px); }
    100% { transform: translateY(60px); }
  }
`,j=a.Ay.button`
  background-color: ${e=>e.color||"transparent"};
  color: ${e=>e.textColor||"white"};
  border: 1px solid ${e=>e.borderColor||"transparent"};
  border-radius: 4px;
  padding: 5px 10px;
  margin: 0 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  
  &:hover {
    opacity: 0.8;
  }
`,k=a.Ay.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`,C=a.Ay.div`
  background-color: #121212;
  border-radius: 8px;
  border: 1px solid #333;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`,S=a.Ay.div`
  padding: 15px 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`,A=a.Ay.h3`
  color: #00ff00;
  margin: 0;
  font-size: 1.2rem;
  font-family: 'Courier New', monospace;
`,R=a.Ay.button`
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
  }
`,z=a.Ay.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`,N=a.Ay.div`
  padding: 15px 20px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
`,D=a.Ay.div`
  margin-bottom: 20px;
`,E=a.Ay.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
`,$=a.Ay.div`
  color: #999;
  width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
`,I=a.Ay.div`
  color: #eee;
  flex: 1;
`,W=e=>{var t;const o=e.value||"Unknown",n=null===(t=e.data)||void 0===t?void 0:t.contact_id,r=o.length>50?o.substring(0,50)+"...":o;return(0,l.jsx)("div",{style:{fontSize:"0.85rem",color:"#ffffff",cursor:"pointer",textDecoration:"underline"},onClick:e=>{e.stopPropagation(),n&&(sessionStorage.setItem("workflow_contact_id",n),window.location.href=`/contacts/workflow/${n}`)},className:"action-cell-no-click",title:o,children:r})},G=a.Ay.div`
  position: absolute;
  top: -5px;
  left: 0;
  transform: translateY(-100%);
  background-color: #222;
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 400px;
  word-wrap: break-word;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease, visibility 0.1s ease;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  pointer-events: none;
`,T=e=>{const t=e.value||"",o=t.length>100?t.substring(0,100)+"...":t,[r,a]=(0,n.useState)(!1);return(0,l.jsxs)("div",{style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",position:"relative"},onMouseEnter:()=>a(!0),onMouseLeave:()=>a(!1),children:[o,(0,l.jsx)(G,{style:{opacity:r?1:0,visibility:r?"visible":"hidden"},children:t})]})},M=e=>{const t=n.useRef(null),o=n.useRef(null);return n.useEffect((()=>{const n=t.current,r=o.current;if(!n||!r)return;const a=t=>(t.stopPropagation(),t.preventDefault(),t.stopImmediatePropagation(),setTimeout((()=>{e.onSkip&&e.onSkip(e.data)}),10),!1),i=t=>(t.stopPropagation(),t.preventDefault(),t.stopImmediatePropagation(),setTimeout((()=>{e.onAddToCRM&&e.onAddToCRM(e.data)}),10),!1);return n.addEventListener("click",a,!0),r.addEventListener("click",i,!0),()=>{n.removeEventListener("click",a,!0),r.removeEventListener("click",i,!0)}}),[e]),(0,l.jsxs)("div",{className:"action-buttons-container",style:{display:"flex",justifyContent:"center",alignItems:"center",paddingTop:"4px",paddingBottom:"0px",height:"100%"},onClick:e=>{e.stopPropagation(),e.preventDefault()},children:[(0,l.jsxs)("div",{ref:t,style:{backgroundColor:"#333",color:"#ff5555",border:"1px solid #ff5555",borderRadius:"4px",padding:"5px 10px",margin:"0 8px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"12px",height:"24px"},children:[(0,l.jsx)(c.q_G,{})," Spam"]}),(0,l.jsxs)("div",{ref:o,style:{backgroundColor:"#333",color:"#55ff55",border:"1px solid #55ff55",borderRadius:"4px",padding:"5px 10px",margin:"0 8px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"12px",height:"24px"},children:[(0,l.jsx)(c.A3x,{})," Add to CRM"]})]})},P=e=>{let{contact:t,onClose:o,onSkip:n,onAddToCRM:r,onWorkflow:a}=e;if(!t)return null;return(0,l.jsx)(k,{onClick:o,children:(0,l.jsxs)(C,{onClick:e=>e.stopPropagation(),children:[(0,l.jsxs)(S,{children:[(0,l.jsxs)(A,{children:[(0,l.jsx)(c.QFc,{style:{marginRight:"10px"}})," WhatsApp Contact Details"]}),(0,l.jsx)(R,{onClick:o,children:"\xd7"})]}),(0,l.jsx)(z,{children:(0,l.jsxs)(D,{children:[(0,l.jsxs)(E,{children:[(0,l.jsxs)($,{children:[(0,l.jsx)(c.JXP,{})," Name:"]}),(0,l.jsxs)(I,{children:[t.first_name||""," ",t.last_name||""]})]}),(0,l.jsxs)(E,{children:[(0,l.jsxs)($,{children:[(0,l.jsx)(c.cfS,{})," Group Chat:"]}),(0,l.jsx)(I,{children:t.is_group_chat?"Yes":"No"})]}),t.chat_name&&(0,l.jsxs)(E,{children:[(0,l.jsxs)($,{children:[(0,l.jsx)(c.Qz2,{})," Chat Name:"]}),(0,l.jsx)(I,{children:t.chat_name})]}),(0,l.jsxs)(E,{children:[(0,l.jsxs)($,{children:[(0,l.jsx)(c.X6_,{})," Last Interaction:"]}),(0,l.jsx)(I,{children:t.last_message||"No recent interactions"})]}),t.last_message_at&&(0,l.jsxs)(E,{children:[(0,l.jsxs)($,{children:[(0,l.jsx)(c.wIk,{})," Interaction Date:"]}),(0,l.jsx)(I,{children:(e=>{if(!e)return"Unknown";return new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})})(t.last_message_at)})]})]})}),(0,l.jsxs)(N,{children:[(0,l.jsxs)(j,{onClick:()=>{n(t),o()},color:"#333",textColor:"#ff5555",borderColor:"#ff5555",children:[(0,l.jsx)(c.q_G,{})," Spam"]}),(0,l.jsxs)(j,{onClick:()=>{r(t),o()},color:"#333",textColor:"#55ff55",borderColor:"#55ff55",children:[(0,l.jsx)(c.A3x,{})," Add to CRM"]})]})]})})},L=()=>{const[e,t]=(0,n.useState)([]),[o,a]=(0,n.useState)([]),[D,E]=(0,n.useState)(!0),[$,I]=(0,n.useState)(!0),[G,L]=(0,n.useState)(null),[q,U]=(0,n.useState)(null),[F,O]=(0,n.useState)(null),[B,Y]=(0,n.useState)(!1),[H,Q]=(0,n.useState)(!1),[X,J]=(0,n.useState)(!1),[Z,K]=(0,n.useState)(null),[V,ee]=(0,n.useState)(null),te=(0,r.Zp)(),oe=(0,n.useMemo)((()=>[{headerName:"Name",valueGetter:e=>e.data?`${e.data.first_name||""} ${e.data.last_name||""}`.trim()||"Unknown":"",minWidth:150,width:150,suppressSizeToFit:!1,cellRenderer:W,filter:!1,sortable:!0},{headerName:"Group",valueGetter:e=>e.data?e.data.is_group_chat?e.data.chat_name||"Group Chat":"Individual":"",minWidth:180,width:180,suppressSizeToFit:!1,cellRenderer:T,filter:!1,sortable:!0},{headerName:"Last Message",field:"last_message",minWidth:170,width:170,valueGetter:e=>{if(!e.data||!e.data.last_message)return"";const t=e.data.last_message;return t.length>50?t.substring(0,50)+"...":t},cellRenderer:T,filter:!1,sortable:!0},{headerName:"Actions",field:"actions",minWidth:250,width:250,cellRenderer:M,cellRendererParams:{onSkip:se,onAddToCRM:ce},sortable:!1,filter:!1,suppressSizeToFit:!1,cellClass:"action-cell-no-click"}]),[]),ne=(0,n.useMemo)((()=>({resizable:!0,sortable:!0})),[]),re=(0,n.useMemo)((()=>({headerName:"Group",field:"chat_name",cellRenderer:"agGroupCellRenderer",cellRendererParams:{suppressCount:!0},minWidth:200})),[]),ae=n.useCallback((e=>{console.log("Grid is ready"),O(e.api),setTimeout((()=>{e.api.sizeColumnsToFit()}),0)}),[]),ie=n.useCallback((e=>{(!e.colDef||"Actions"!==e.colDef.headerName&&"Name"!==e.colDef.headerName)&&K(e.data)}),[]);function se(e){console.log("Spam button clicked:",e),ee(e)}async function ce(o){console.log("Add to CRM clicked:",o);try{const{error:n}=await i.supabase.from("contacts").update({category:"Inbox",last_modified_at:(new Date).toISOString(),last_modified_by:"User"}).eq("contact_id",o.contact_id);if(n)throw n;const r=e.filter((e=>e.contact_id!==o.contact_id));t(r),0===r.length&&Y(!1),console.log("Contact marked for normal CRM processing:",o.contact_id)}catch(n){console.error("Error processing contact for CRM:",n)}}return(0,n.useEffect)((()=>{B||(console.log("Initiating WhatsApp contacts data fetch"),(async()=>{try{E(!0),L(null);const{data:o,error:n}=await i.supabase.from("contacts").select("*").eq("category","WhatsApp Group Contact").order("created_at",{ascending:!1});if(n)throw n;if(!o||0===o.length)return console.log("No WhatsApp contacts found"),t([]),E(!1),Y(!0),void J(!0);const r=[...o],a=o.map((e=>e.contact_id)),{data:s,error:c}=await i.supabase.from("contact_chats").select("contact_id, chat_id").in("contact_id",a);if(c)throw c;if(s&&s.length>0){const t=s.map((e=>e.chat_id)).filter(Boolean);if(t.length>0){const{data:o,error:n}=await i.supabase.from("chats").select("id, chat_name, is_group_chat").in("id",t);if(n)throw n;const c={};o&&o.forEach((e=>{c[e.id]=e}));const l={};s.forEach((e=>{e.contact_id&&e.chat_id&&(l[e.contact_id]=e.chat_id)})),r.forEach((e=>{const t=l[e.contact_id],o=t?c[t]:null;o?(e.is_group_chat=o.is_group_chat||!1,e.chat_name=o.chat_name||"",e.chat_id=t,e.group=o.chat_name||"Unknown Group"):(e.is_group_chat=!1,e.chat_name="",e.chat_id=null,e.group="Individual Chats"),e.last_message=""}));try{const{data:e,error:o}=await i.supabase.from("interactions").select("contact_id, summary, interaction_date").in("contact_id",a).in("chat_id",t).order("interaction_date",{ascending:!1});if(!o&&e&&e.length>0){console.log(`Successfully fetched ${e.length} interactions`);const t={};e.forEach((e=>{(!t[e.contact_id]||new Date(e.interaction_date)>new Date(t[e.contact_id].interaction_date))&&(t[e.contact_id]=e)})),r.forEach((e=>{const o=t[e.contact_id];o?(e.last_message=o.summary||"",e.last_message_at=o.interaction_date||null):e.last_message="No recent interactions"}))}else console.log("No interactions found or error fetching interactions"),r.forEach((e=>{e.last_message="No interactions found"}))}catch(e){console.error("Error fetching interactions:",e),r.forEach((e=>{e.last_message="Error retrieving interactions"}))}}}const l=[...r];l.sort(((e,t)=>{const o=e.chat_name||"",n=t.chat_name||"";if(o!==n)return o.localeCompare(n);const r=`${e.first_name||""} ${e.last_name||""}`.trim(),a=`${t.first_name||""} ${t.last_name||""}`.trim();return r.localeCompare(a)})),console.log(`Successfully processed ${l.length} WhatsApp contacts grouped by chat`),t(l),E(!1),Y(!0),setTimeout((()=>{J(!0)}),800)}catch(o){console.error("Error fetching WhatsApp contacts:",o),L((null===o||void 0===o?void 0:o.message)||"Unknown error"),E(!1)}})()),H||(console.log("Initiating WhatsApp spam numbers fetch"),(async()=>{try{I(!0),U(null);const{data:e,error:t}=await i.supabase.from("whatsapp_spam").select("*").order("last_modified_at",{ascending:!1}).limit(25);if(t)throw t;console.log(`Successfully fetched ${(null===e||void 0===e?void 0:e.length)||0} WhatsApp spam numbers`),a(e||[]),I(!1),Q(!0)}catch(e){console.error("Error fetching WhatsApp spam numbers:",e),U(e.message),I(!1)}})())}),[B,H]),(0,n.useEffect)((()=>{if(!F)return;const e=()=>{F.sizeColumnsToFit()};return window.addEventListener("resize",e,{passive:!0}),()=>{window.removeEventListener("resize",e,{passive:!0})}}),[F]),(0,l.jsxs)(d,{children:[Z&&(0,l.jsx)(P,{contact:Z,onClose:()=>K(null),onSkip:se,onAddToCRM:ce,onWorkflow:function(e){console.log("Workflow button clicked:",e),e&&e.contact_id&&(sessionStorage.setItem("workflow_contact_id",e.contact_id),te(`/contacts/workflow/${e.contact_id}`))}}),V&&(0,l.jsx)(k,{onClick:()=>ee(null),children:(0,l.jsxs)(C,{onClick:e=>e.stopPropagation(),style:{maxWidth:"400px",padding:"20px"},children:[(0,l.jsxs)(S,{children:[(0,l.jsxs)(A,{children:[(0,l.jsx)(c.q_G,{style:{marginRight:"10px",color:"#ff5555"}})," Confirm Spam"]}),(0,l.jsx)(R,{onClick:()=>ee(null),children:"\xd7"})]}),(0,l.jsxs)(z,{children:[(0,l.jsx)("p",{style:{marginBottom:"20px"},children:"Are you sure you want to mark this contact as spam?"}),(0,l.jsx)("div",{style:{backgroundColor:"#1a1a1a",padding:"10px",borderRadius:"4px",marginBottom:"20px"},children:(0,l.jsxs)("p",{children:[(0,l.jsx)("strong",{children:"Name:"})," ",`${V.first_name||""} ${V.last_name||""}`.trim()||"Unknown"]})})]}),(0,l.jsxs)(N,{children:[(0,l.jsx)(j,{onClick:()=>ee(null),color:"#333",textColor:"#cccccc",borderColor:"#555",children:"Cancel"}),(0,l.jsxs)(j,{onClick:async function(){if(!V)return;const o=V;try{const{data:n,error:r}=await i.supabase.from("contact_mobiles").select("mobile_number").eq("contact_id",o.contact_id).limit(1);if(r)throw r;if(n&&n.length>0){const{error:e}=await i.supabase.from("whatsapp_spam").upsert({mobile_number:n[0].mobile_number,counter:1,created_at:(new Date).toISOString(),last_modified_at:(new Date).toISOString()},{onConflict:"mobile_number",returning:"minimal"});if(e)throw e}const{error:a}=await i.supabase.from("contacts").update({category:"Skip",last_modified_at:(new Date).toISOString(),last_modified_by:"User"}).eq("contact_id",o.contact_id);if(a)throw a;const s=e.filter((e=>e.contact_id!==o.contact_id));t(s),0===s.length&&Y(!1),ee(null),console.log("Contact marked as spam:",o.contact_id)}catch(n){console.error("Error marking contact as spam:",n)}},color:"#333",textColor:"#ff5555",borderColor:"#ff5555",children:[(0,l.jsx)(c.q_G,{})," Mark as Spam"]})]})]})}),(0,l.jsxs)(p,{children:[(0,l.jsx)(u,{children:"Spam Numbers"}),$?(0,l.jsx)("div",{style:{padding:"10px",color:"#00ff00",textAlign:"center",fontSize:"0.75rem"},children:"Loading..."}):q?(0,l.jsxs)(b,{style:{fontSize:"0.75rem",padding:"8px"},children:["Error: ",q]}):0===o.length?(0,l.jsx)("div",{style:{padding:"10px",color:"#cccccc",textAlign:"center",fontSize:"0.75rem"},children:"No spam numbers"}):(0,l.jsx)(m,{children:o.map(((e,t)=>(0,l.jsxs)(h,{onClick:()=>async function(e){console.log("Spam number clicked:",e);try{const{data:t,error:o}=await i.supabase.from("contact_mobiles").select("contact_id").eq("mobile_number",e.mobile_number).limit(1);if(o)throw o;if(t&&t.length>0){const{data:e,error:o}=await i.supabase.from("contacts").select("*").eq("contact_id",t[0].contact_id).limit(1);if(o)throw o;e&&e.length>0&&K(e[0])}else K({contact_id:`spam-${e.id||Date.now()}`,first_name:"Unknown",last_name:"Contact",job_role:"WhatsApp Spam",description:`This number (${e.mobile_number}) has been marked as spam ${e.counter} times.`,created_at:e.created_at||(new Date).toISOString()})}catch(t){console.error("Error fetching contact details for spam number:",t)}}(e),children:[(0,l.jsx)(x,{children:e.mobile_number&&e.mobile_number.length>40?`${e.mobile_number.substring(0,40)}...`:e.mobile_number}),(0,l.jsx)(g,{children:e.counter||1})]},t)))})]}),(0,l.jsxs)(f,{children:[G&&(0,l.jsxs)(b,{children:["Error: ",G]}),!1!==D?(0,l.jsxs)(_,{children:[(0,l.jsx)(y,{children:"string"===typeof D?D:"Accessing WhatsApp Contacts..."}),(0,l.jsx)(w,{}),(0,l.jsx)(v,{})]}):X||G?0!==e.length||G?(0,l.jsx)("div",{className:"ag-theme-alpine",style:{height:"calc(100vh - 120px)",width:"calc(100% - 15px)",overflow:"auto",margin:"15px 0 0 0",marginTop:"30px",opacity:X?1:0,transition:"opacity 0.5s ease-in-out","--ag-background-color":"#121212","--ag-odd-row-background-color":"#1a1a1a","--ag-header-background-color":"#222222","--ag-header-foreground-color":"#00ff00","--ag-foreground-color":"#e0e0e0","--ag-row-hover-color":"#2a2a2a","--ag-border-color":"#333333"},children:(0,l.jsx)(s.W,{rowData:e,columnDefs:oe,defaultColDef:ne,autoGroupColumnDef:re,onGridReady:ae,rowSelection:"single",animateRows:!0,pagination:!0,paginationPageSize:100,suppressCellFocus:!0,enableCellTextSelection:!0,rowHeight:42,domLayout:"autoHeight",paginationAutoPageSize:!0,sortingOrder:["desc","asc",null],onRowClicked:ie,rowGroupPanelShow:"never",groupDefaultExpanded:-1,groupDisplayType:"groupRows",rowStyle:e=>{var t;const o=(null===(t=e.data)||void 0===t?void 0:t.chat_name)||"";let n="";if(o){const e=o.split("").reduce(((e,t)=>e+t.charCodeAt(0)),0)%3;n=0===e?"1a":1===e?"22":"2a"}return{cursor:"pointer",backgroundColor:o?`#${n}1a${n}a`:""}},getRowId:e=>e.data.contact_id,groupRowRendererParams:{suppressCount:!0,innerRenderer:e=>`<span style="font-weight: bold; color: #00ff00;">${e.node.key}</span> (${e.node.allChildrenCount} contacts)`},rowGroupingColumnHidingStrategy:"hide",groupIncludeFooter:!1,groupRemoveSingleChildren:!1,rowData:e,rowGroupingAutoColumn:!0,rowGroupColumns:["group"]})}):(0,l.jsxs)("div",{style:{padding:"40px",textAlign:"center",color:"#00ff00",background:"#121212",borderRadius:"8px",fontSize:"24px",fontWeight:"bold",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"300px"},children:[(0,l.jsx)("div",{style:{marginBottom:"15px"},children:"No more WhatsApp contacts to process \ud83d\ude0a"}),(0,l.jsx)("div",{style:{fontSize:"48px",marginBottom:"20px"},children:"\u2713"}),(0,l.jsxs)("div",{style:{fontSize:"14px",color:"#aaa",marginTop:"10px"},children:["Click ",(0,l.jsx)("span",{style:{textDecoration:"underline",cursor:"pointer",color:"#00ff00"},onClick:()=>Y(!1),children:"here"})," to check for new contacts"]})]}):(0,l.jsxs)(_,{children:[(0,l.jsx)(y,{children:"Preparing interface..."}),(0,l.jsx)(w,{}),(0,l.jsx)(v,{})]})]})]})}}}]);
//# sourceMappingURL=647.251841e5.chunk.js.map