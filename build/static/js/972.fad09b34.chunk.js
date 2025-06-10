"use strict";(self.webpackChunkcontact_dashboard=self.webpackChunkcontact_dashboard||[]).push([[972],{3972:(t,e,a)=>{a.r(e),a.d(e,{default:()=>C});var i=a(5043),o=a(3216),n=a(1529),r=a(5315),c=a(8136),l=a(1009),s=a(579);const d=n.Ay.div`
  padding: 10px 0 0 0; /* Add just a bit of top padding */
  min-height: 100vh; /* Full viewport height */
  height: auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  
  .clickable-cell {
    cursor: default;
  }
  
  .name-cell-clickable {
    cursor: pointer;
  }
  
  .ag-row {
    cursor: default;
  }
  
  .phone-link, .email-link {
    z-index: 100;
    position: relative;
  }
  
  .phone-link:hover, .email-link:hover {
    color: #00ff00 !important;
    text-decoration: underline;
    background-color: rgba(0, 255, 0, 0.1);
  }
`,m=n.Ay.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`,p=n.Ay.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`,f=n.Ay.div`
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
`,u=n.Ay.div`
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
`,g=n.Ay.div`
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
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000011 01101111 01101110 01110100 01100001 01100011 01110100 01110011 00101110 00101110 00101110";
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
`,h=n.Ay.div`
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
`,x=n.Ay.div`
  background-color: #121212;
  border-radius: 8px;
  border: 1px solid #333;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`,_=n.Ay.div`
  padding: 15px 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`,b=n.Ay.h3`
  color: #00ff00;
  margin: 0;
  font-size: 1.2rem;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
`,y=n.Ay.button`
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
`,v=n.Ay.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: #cccccc;
  font-family: 'Courier New', monospace;
`,w=n.Ay.div`
  color: #888;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: right;
`,k=n.Ay.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
`,j=n.Ay.div`
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  
  & > svg {
    margin-right: 10px;
    color: #00ff00;
  }
`,C=()=>{const[t,e]=(0,i.useState)([]),[a,n]=(0,i.useState)(!0),[C,S]=(0,i.useState)(null),[$,E]=(0,i.useState)(null),[F,A]=(0,i.useState)(!1),[R,D]=(0,i.useState)(!1),N=(0,o.Zp)(),P=t=>{if(!t.data)return"";return`${t.data.first_name||""} ${t.data.last_name||""}`.trim()||"(No name)"},T=t=>{const e=(0,o.Zp)(),a=t.valueFormatted||t.value||"";return(0,s.jsx)("div",{className:"name-link",style:{color:"#00ff00",cursor:"pointer",textDecoration:"underline"},onClick:a=>{a.stopPropagation(),t.data&&t.data.contact_id&&e(`/contacts/workflow/${t.data.contact_id}`)},children:a})},L=t=>{const e=i.useRef(null),a=i.useRef(null);return i.useEffect((()=>{const i=e.current,o=a.current;if(!i||!o)return;const n=e=>(e.stopPropagation(),e.preventDefault(),e.stopImmediatePropagation(),setTimeout((()=>{G(t.data)}),10),!1),r=e=>(e.stopPropagation(),e.preventDefault(),e.stopImmediatePropagation(),setTimeout((()=>{B(t.data)}),10),!1);return i.addEventListener("click",n,!0),o.addEventListener("click",r,!0),()=>{i.removeEventListener("click",n,!0),o.removeEventListener("click",r,!0)}}),[t.data]),(0,s.jsxs)("div",{className:"action-buttons-container",style:{display:"flex",justifyContent:"center",alignItems:"center",paddingTop:"4px",paddingBottom:"0px",height:"100%"},onClick:t=>{t.stopPropagation(),t.preventDefault()},children:[(0,s.jsxs)("div",{ref:e,style:{backgroundColor:"#333",color:"#ff5555",border:"1px solid #ff5555",borderRadius:"4px",padding:"5px 10px",margin:"0 8px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"12px",height:"24px"},children:[(0,s.jsx)(l.q_G,{})," Spam"]}),(0,s.jsxs)("div",{ref:a,style:{backgroundColor:"#333",color:"#55ff55",border:"1px solid #55ff55",borderRadius:"4px",padding:"5px 10px",margin:"0 8px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"12px",height:"24px"},children:[(0,s.jsx)(l.A3x,{})," Add to CRM"]})]})},z=t=>{let{message:e,onClose:a}=t;return e?(0,s.jsx)(h,{onClick:a,children:(0,s.jsxs)(x,{onClick:t=>t.stopPropagation(),children:[(0,s.jsxs)(_,{children:[(0,s.jsxs)(b,{children:[(0,s.jsx)(l.QFc,{style:{marginRight:"10px"}})," WhatsApp Message"]}),(0,s.jsx)(y,{onClick:a,children:"\xd7"})]}),(0,s.jsxs)(v,{children:[(0,s.jsxs)(j,{children:[(0,s.jsx)(l.QFc,{})," From: ",e.mobile_number]}),(0,s.jsx)(k,{children:e.message}),(0,s.jsxs)(w,{children:["Received: ",new Date(e.created_at).toLocaleString()]}),e.interaction_id&&(0,s.jsx)("div",{style:{marginTop:"20px"},children:(0,s.jsx)("button",{style:{backgroundColor:"#1a1a1a",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"8px 15px",cursor:"pointer",fontFamily:"Courier New, monospace"},onClick:()=>{e.contact_id&&(sessionStorage.setItem("workflow_contact_id",e.contact_id),window.location.href=`/contacts/workflow/${e.contact_id}`),a()},children:"View Full Conversation History"})})]})]})}):null},I=t=>{let{email:e,onClose:a}=t;return e?(0,s.jsx)(h,{onClick:a,children:(0,s.jsxs)(x,{onClick:t=>t.stopPropagation(),children:[(0,s.jsxs)(_,{children:[(0,s.jsxs)(b,{children:[(0,s.jsx)(l.pHD,{style:{marginRight:"10px"}})," Email Message"]}),(0,s.jsx)(y,{onClick:a,children:"\xd7"})]}),(0,s.jsxs)(v,{children:[(0,s.jsxs)(j,{children:[(0,s.jsx)(l.pHD,{})," From: ",e.email_address]}),(0,s.jsxs)("div",{style:{marginTop:"10px"},children:[(0,s.jsx)("strong",{children:"Subject:"})," ",e.subject||"(No Subject)",e.has_attachments&&(0,s.jsxs)("span",{style:{marginLeft:"10px",color:"#aaa",fontSize:"0.9em"},children:["(",e.attachment_count||1," attachment",e.attachment_count>1?"s":"",")"]})]}),(0,s.jsx)(k,{children:e.body}),(0,s.jsxs)(w,{children:["outgoing"===e.direction?"Sent: ":"Received: ",new Date(e.created_at).toLocaleString()]}),(e.interaction_id||e.email_id||e.email_thread_id)&&(0,s.jsxs)("div",{style:{marginTop:"20px",display:"flex",gap:"10px"},children:[(0,s.jsx)("button",{style:{backgroundColor:"#1a1a1a",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"8px 15px",cursor:"pointer",fontFamily:"Courier New, monospace"},onClick:()=>{e.contact_id&&(sessionStorage.setItem("workflow_contact_id",e.contact_id),window.location.href=`/contacts/workflow/${e.contact_id}`),a()},children:"View Contact History"}),e.email_thread_id&&(0,s.jsx)("button",{style:{backgroundColor:"#1a1a1a",color:"#5599ff",border:"1px solid #5599ff",borderRadius:"4px",padding:"8px 15px",cursor:"pointer",fontFamily:"Courier New, monospace"},onClick:()=>{alert("Email thread view is not implemented yet")},children:"View Thread"})]})]})]})}):null},[M,q]=(0,i.useState)(null),[W,H]=(0,i.useState)(null),G=async a=>{if(a&&a.contact_id)try{const{error:i}=await r.supabase.from("contacts").update({category:"Spam",last_modified_at:(new Date).toISOString(),last_modified_by:"User"}).eq("contact_id",a.contact_id);if(i)throw i;const o=t.filter((t=>t.contact_id!==a.contact_id));e(o),0===o.length&&A(!1)}catch(i){console.error("Error marking contact as spam:",i),alert("Failed to mark contact as spam. Please try again.")}},B=async a=>{if(a&&a.contact_id)try{const{error:i}=await r.supabase.from("contacts").update({category:"Inbox",last_modified_at:(new Date).toISOString(),last_modified_by:"User"}).eq("contact_id",a.contact_id);if(i)throw i;const o=t.filter((t=>t.contact_id!==a.contact_id));e(o),0===o.length&&A(!1)}catch(i){console.error("Error adding contact to CRM:",i),alert("Failed to add contact to CRM. Please try again.")}},O=t=>{var e;const a=t.value||"-",o=i.useRef(null);return i.useEffect((()=>{if("-"===a||!o.current)return;const e=e=>(e.stopPropagation(),e.preventDefault(),e.stopImmediatePropagation(),setTimeout((()=>{var e;(async(t,e)=>{if(t&&"-"!==t)try{let a=e;if(!a){const{data:e,error:i}=await r.supabase.from("contact_mobiles").select("contact_id").eq("mobile",t).limit(1);if(i)throw i;if(!e||0===e.length)return void alert(`Could not find contact associated with ${t}`);a=e[0].contact_id}const{data:i,error:o}=await r.supabase.from("contact_chats").select("chat_id").eq("contact_id",a);if(o)throw o;let n=[];if(i&&i.length>0){const t=i.map((t=>t.chat_id)).filter(Boolean);if(t.length>0){const{data:e,error:i}=await r.supabase.from("interactions").select("\n              interaction_id,\n              interaction_date,\n              summary,\n              chat_id,\n              contact_id,\n              interaction_type,\n              direction\n            ").eq("contact_id",a).in("chat_id",t).order("interaction_date",{ascending:!1}).limit(10);if(i)throw i;e&&e.length>0&&(n=e)}}if(0===n.length){const{data:t,error:e}=await r.supabase.from("interactions").select("\n            interaction_id,\n            interaction_date,\n            summary,\n            chat_id,\n            contact_id,\n            interaction_type,\n            direction\n          ").eq("contact_id",a).order("interaction_date",{ascending:!1}).limit(5);!e&&t&&t.length>0&&(n=t)}if(n&&n.length>0){const e=n.find((t=>t.summary&&("whatsapp"===t.interaction_type||"chat"===t.interaction_type||"message"===t.interaction_type)))||n[0],i={mobile_number:t,message:e.summary||"No message content available",created_at:e.interaction_date,interaction_id:e.interaction_id,contact_id:a,direction:e.direction||"incoming"};q(i)}else alert(`No WhatsApp messages found for ${t}`)}catch(a){console.error("Error retrieving WhatsApp messages:",a),alert("Failed to retrieve WhatsApp messages. Please try again.")}})(a,null===(e=t.data)||void 0===e?void 0:e.contact_id)}),10),!1),i=o.current;return i.addEventListener("click",e,!0),()=>{i.removeEventListener("click",e,!0)}}),[a,null===(e=t.data)||void 0===e?void 0:e.contact_id]),"-"===a?a:(0,s.jsxs)("div",{ref:o,className:"phone-link",style:{color:"#cccccc",cursor:"pointer",textDecoration:"underline",position:"relative",zIndex:10},title:"Click to view latest WhatsApp message",children:[(0,s.jsx)(l.QFc,{style:{marginRight:"5px",color:"#55ff55"}}),a]})},Q=t=>{var e;const a=t.value||"-",o=i.useRef(null);return i.useEffect((()=>{if("-"===a||!o.current)return;const e=e=>(e.stopPropagation(),e.preventDefault(),e.stopImmediatePropagation(),setTimeout((()=>{var e;(async(t,e)=>{if(t&&"-"!==t)try{let a=e;if(!a){const{data:e,error:i}=await r.supabase.from("contact_emails").select("contact_id").eq("email",t).limit(1);if(i)throw i;if(!e||0===e.length)return void alert(`Could not find contact associated with ${t}`);a=e[0].contact_id}const{data:i,error:o}=await r.supabase.from("emails").select("\n          email_id,\n          email_thread_id,\n          subject,\n          body_plain,\n          body_html,\n          message_timestamp,\n          direction,\n          sender_contact_id,\n          thread_id,\n          has_attachments,\n          attachment_count\n        ").eq("sender_contact_id",a).order("message_timestamp",{ascending:!1}).limit(1);if(o)throw o;if(i&&i.length>0){const e=i[0];let o=e.subject;if(e.email_thread_id){const{data:t}=await r.supabase.from("email_threads").select("subject").eq("email_thread_id",e.email_thread_id).limit(1);t&&t.length>0&&(o=t[0].subject||o)}const n={email_address:t,subject:o||"Email from "+t,body:e.body_plain||e.body_html||"No email content available",created_at:e.message_timestamp,email_id:e.email_id,email_thread_id:e.email_thread_id,thread_id:e.thread_id,contact_id:a,direction:e.direction,has_attachments:e.has_attachments,attachment_count:e.attachment_count};return void H(n)}const{data:n,error:c}=await r.supabase.from("interactions").select("\n          interaction_id,\n          interaction_date,\n          summary,\n          contact_id,\n          interaction_type,\n          direction,\n          email_thread_id\n        ").eq("contact_id",a).order("interaction_date",{ascending:!1}).limit(5);if(c)throw c;if(n&&n.length>0){const e=n.find((t=>t.summary&&("email"===t.interaction_type||t.email_thread_id||t.summary&&t.summary.includes("@"))))||n[0],i={email_address:t,subject:e.email_thread_id?`Email thread: ${e.email_thread_id}`:"Email from "+t,body:e.summary||"No email content available",created_at:e.interaction_date,interaction_id:e.interaction_id,contact_id:a,direction:e.direction||"incoming"};H(i)}else alert(`No emails found for ${t}`)}catch(a){console.error("Error retrieving emails:",a),alert("Failed to retrieve emails. Please try again.")}})(a,null===(e=t.data)||void 0===e?void 0:e.contact_id)}),10),!1),i=o.current;return i.addEventListener("click",e,!0),()=>{i.removeEventListener("click",e,!0)}}),[a,null===(e=t.data)||void 0===e?void 0:e.contact_id]),"-"===a?a:(0,s.jsxs)("div",{ref:o,className:"email-link",style:{color:"#cccccc",cursor:"pointer",textDecoration:"underline",position:"relative",zIndex:10},title:"Click to view latest email",children:[(0,s.jsx)(l.pHD,{style:{marginRight:"5px",color:"#55ff55"}}),a]})},V=(0,i.useMemo)((()=>[{headerName:"Name",field:"name",valueGetter:P,minWidth:200,filter:"agTextColumnFilter",floatingFilter:!1,sortable:!0,pinned:"left",cellClass:"name-cell-clickable",cellRenderer:T},{headerName:"Last Interaction",field:"last_interaction_at",valueFormatter:t=>t.value?new Date(t.value).toLocaleDateString():"-",minWidth:140,filter:"agDateColumnFilter",floatingFilter:!1,sortable:!0},{headerName:"Mobile",field:"mobile",valueGetter:t=>t.data?t.data.mobile||"-":"",minWidth:150,filter:"agTextColumnFilter",floatingFilter:!1,sortable:!0,cellRenderer:O},{headerName:"Email",field:"email",valueGetter:t=>t.data?t.data.email||"-":"",minWidth:250,filter:"agTextColumnFilter",floatingFilter:!1,sortable:!0,cellRenderer:Q},{headerName:"Actions",field:"actions",minWidth:250,width:250,cellRenderer:L,sortable:!1,filter:!1,suppressSizeToFit:!1,cellClass:"action-cell-no-click"}]),[]),U=(0,i.useMemo)((()=>({resizable:!0,cellClass:"clickable-cell",suppressCellFocus:!0})),[]),Y=i.useCallback((t=>{console.log("Grid is ready"),E(t.api),setTimeout((()=>{t.api.sizeColumnsToFit()}),0)}),[]),Z=i.useCallback((t=>{t.event&&(t.event.target.closest(".phone-link")||t.event.target.closest(".email-link"))?t.event.stopPropagation():t.data&&t.data.contact_id&&(console.log("Row clicked, navigating to workflow page",t.data),N(`/contacts/workflow/${t.data.contact_id}`))}),[N]);return(0,i.useEffect)((()=>{F||(console.log("Initiating data fetch"),(async()=>{try{n(!0),S(null);const a=async function(t){let e,a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:3,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1e3;for(let n=0;n<a;n++)try{return await t()}catch(o){console.log(`Attempt ${n+1} failed, retrying in ${i}ms...`,o),e=o,await new Promise((t=>setTimeout(t,i))),i*=1.5}throw e},i=new Date;i.setDate(i.getDate()-90);const o=i.toISOString(),{count:c,error:l}=await a((async()=>r.supabase.from("contacts").select("*",{count:"exact",head:!0}).eq("category","Skip").gte("last_interaction_at",o).not("last_interaction_at","is",null)));if(l)throw l;console.log(`Total Skip contacts with recent interactions: ${c}`);const s=async(t,e)=>(console.log(`Fetching batch from ${t} to ${e}`),a((async()=>r.supabase.from("contacts").select("\n              contact_id, \n              first_name, \n              last_name, \n              category,\n              last_interaction_at,\n              created_at\n            ").eq("category","Skip").gte("last_interaction_at",o).not("last_interaction_at","is",null).order("last_interaction_at",{ascending:!1}).range(t,e))));let d=[];const m=500;let p=0,f=0;const u=Math.min(c,4e3);for(let e=0;e<u;e+=m)try{n(`Loading contacts... ${Math.min(e+m,c)}/${c}`);const{data:t,error:a}=await s(e,e+m-1);if(a){if(console.error(`Error fetching contacts batch from ${e} to ${e+m-1}:`,a),f++,f>3)throw new Error(`Too many failed batches (${f}). Last error: ${a.message}`);continue}t&&t.length>0&&(d=[...d,...t],p+=t.length)}catch(t){if(console.error(`Error in batch fetch loop at index ${e}:`,t),0===p)throw t;break}console.log(`Successfully fetched ${p} contacts in ${Math.ceil(p/m)} batches with ${f} failed batches`);const g=d;if(!g||0===g.length)return e([]),n(!1),A(!0),void D(!0);const h=g.map((t=>t.contact_id)).filter(Boolean);if(0===h.length)return e(g),n(!1),A(!0),void D(!0);n("Loading related data (emails, mobiles)...");const x=async function(e,a,i){let o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:100;console.log(`Fetching ${e} data for ${i.length} contacts in batches of ${o}`);let r=[];for(let c=0;c<i.length;c+=o){const l=i.slice(c,c+o);try{const{data:t,error:s}=await a.in("contact_id",l);if(s)throw s;r=[...r,...t||[]],n(`Loading ${e} data... ${Math.min(c+o,i.length)}/${i.length}`)}catch(t){console.error(`Error fetching batch of ${e} data:`,t)}}return{data:r}};try{const[t,a]=await Promise.all([x("emails",r.supabase.from("contact_emails").select("contact_id, email, is_primary"),h),x("mobiles",r.supabase.from("contact_mobiles").select("contact_id, mobile, is_primary"),h)]);n("Processing data and preparing contacts...");const i=g.map(((e,i)=>{var o,r;if(!e||!e.contact_id)return console.warn("Skipping invalid contact:",e),null;i>0&&i%1e3===0&&n(`Processing contacts... ${i}/${g.length}`);const c=(t.data||[]).filter((t=>(null===t||void 0===t?void 0:t.contact_id)===e.contact_id)),l=(a.data||[]).filter((t=>(null===t||void 0===t?void 0:t.contact_id)===e.contact_id)),s=c.find((t=>null===t||void 0===t?void 0:t.is_primary)),d=(null===s||void 0===s?void 0:s.email)||(c.length>0?null===(o=c[0])||void 0===o?void 0:o.email:null),m=l.find((t=>null===t||void 0===t?void 0:t.is_primary)),p=(null===m||void 0===m?void 0:m.mobile)||(l.length>0?null===(r=l[0])||void 0===r?void 0:r.mobile:null);return{...e,id:e.contact_id,email:d||null,mobile:p||null}})).filter(Boolean);console.log(`Successfully processed ${i.length} contacts out of ${g.length} total`),e(i),n(!1),A(!0),setTimeout((()=>{D(!0)}),800)}catch(t){console.error("Error loading related data:",t);const a=g.map((t=>({...t,id:t.contact_id})));e(a),n(!1),A(!0),setTimeout((()=>{D(!0)}),800)}}catch(t){console.error("Error fetching contacts:",t),S(t.message),n(!1)}})())}),[F]),(0,i.useEffect)((()=>{if(!$)return;const t=()=>{$.sizeColumnsToFit()};return window.addEventListener("resize",t,{passive:!0}),()=>{window.removeEventListener("resize",t,{passive:!0})}}),[$]),(0,s.jsxs)(d,{children:[C&&(0,s.jsxs)(m,{children:["Error: ",C]}),M&&(0,s.jsx)(z,{message:M,onClose:()=>q(null)}),W&&(0,s.jsx)(I,{email:W,onClose:()=>H(null)}),!1!==a?(0,s.jsxs)(p,{children:[(0,s.jsx)(u,{children:"string"===typeof a?a.replace(/Loading .+ \d+\/\d+/,"Initializing Matrix"):"Accessing Contact Database..."}),(0,s.jsx)(f,{}),(0,s.jsx)(g,{})]}):R||C?0!==t.length||C?(0,s.jsx)("div",{className:"ag-theme-alpine",style:{height:"calc(100vh - 120px)",width:"calc(100% - 30px)",overflow:"auto",margin:"15px 15px 0 15px",marginTop:"30px",opacity:R?1:0,transition:"opacity 0.5s ease-in-out","--ag-background-color":"#121212","--ag-odd-row-background-color":"#1a1a1a","--ag-header-background-color":"#222222","--ag-header-foreground-color":"#00ff00","--ag-foreground-color":"#e0e0e0","--ag-row-hover-color":"#2a2a2a","--ag-border-color":"#333333"},children:(0,s.jsx)(c.W,{rowData:t,columnDefs:V,defaultColDef:U,onGridReady:Y,onRowClicked:Z,rowSelection:"single",animateRows:!0,pagination:!0,paginationPageSize:100,suppressCellFocus:!0,enableCellTextSelection:!0,rowHeight:42,domLayout:"autoHeight",paginationAutoPageSize:!0,stopEditingWhenCellsLoseFocus:!1,suppressRowClickSelection:!1,sortingOrder:["asc","desc",null],sortModel:[{colId:"last_interaction_at",sort:"desc"}]})}):(0,s.jsx)("div",{style:{padding:"40px",textAlign:"center",color:"#00ff00",background:"#121212",borderRadius:"8px"},children:"No 'Skip' category contacts found with interactions in the last 90 days."}):(0,s.jsxs)(p,{children:[(0,s.jsx)(u,{children:"Preparing interface..."}),(0,s.jsx)(f,{}),(0,s.jsx)(g,{})]})]})}}}]);
//# sourceMappingURL=972.fad09b34.chunk.js.map