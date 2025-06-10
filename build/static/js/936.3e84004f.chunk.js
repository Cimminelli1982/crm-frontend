"use strict";(self.webpackChunkcontact_dashboard=self.webpackChunkcontact_dashboard||[]).push([[936],{6936:(e,o,t)=>{t.r(o),t.d(o,{default:()=>R});var r=t(5043),a=t(1529),n=t(8136),i=t(1009),l=t(5315),s=t(2115),d=t(4462),c=t(579);const p=a.DU`
  .Toastify__toast {
    background-color: #121212;
    color: #00ff00;
    border: 1px solid #00ff00;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
  
  .Toastify__toast-body {
    font-family: 'Courier New', monospace;
    font-size: 14px;
  }

  .Toastify__progress-bar {
    background: #00ff00;
  }

  .Toastify__close-button {
    color: #00ff00;
  }
  
  .Toastify__toast--success {
    background-color: #121212;
    border: 1px solid #00ff00;
  }
  
  .Toastify__toast--error {
    background-color: #121212;
    border: 1px solid #ff3333;
    color: #ff3333;
  }
  
  /* AG Grid hover and selection overrides */
  .ag-theme-alpine .ag-row:hover {
    background-color: inherit !important;
  }
  .ag-theme-alpine .ag-row-odd:hover {
    background-color: #1a1a1a !important;
  }
  .ag-theme-alpine .ag-row-even:hover {
    background-color: #121212 !important;
  }
  .ag-theme-alpine .ag-row-selected {
    background-color: inherit !important;
  }
  .ag-theme-alpine .ag-row-odd.ag-row-selected {
    background-color: #1a1a1a !important;
  }
  .ag-theme-alpine .ag-row-even.ag-row-selected {
    background-color: #121212 !important;
  }
`,u=a.Ay.div`
  height: calc(100vh - 60px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`,f=a.Ay.div`
  display: flex;
  align-items: center;
  margin: 20px;
  gap: 10px;
`,g=a.Ay.input`
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px 8px 40px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #666;
  }
  
  &::placeholder {
    color: #666;
    font-style: normal;
    text-transform: uppercase;
  }
`,x=a.Ay.div`
  position: relative;
  display: flex;
  align-items: center;
`,h=a.Ay.div`
  position: absolute;
  left: 12px;
  color: #00ff00;
  display: flex;
  align-items: center;
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
`,m=a.Ay.div`
  height: calc(100% - 140px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`,b=a.Ay.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`,y=a.Ay.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
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
`,v=a.Ay.div`
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
`,C=e=>{const[o,t]=(0,r.useState)(!1),[a,n]=(0,r.useState)(e.value||"Requested"),i=["Promised","Requested","Done & Dust","Aborted","Done, but need to monitor"],d=()=>{t(!1)};return o?(0,c.jsx)("select",{value:a,onChange:o=>(async o=>{if(o!==a)try{const{error:r}=await l.supabase.from("introductions").update({status:o}).eq("introduction_id",e.data.id);if(r)throw r;n(o),e.setValue(o),e.data.status=o,e.api&&e.api.refreshCells({force:!0,rowNodes:[e.node],columns:["status"]}),t(!1),s.oR.success(`Status updated to "${o}"`)}catch(r){console.error("Error updating status:",r),s.oR.error(`Failed to update status: ${r.message}`),t(!1)}else t(!1)})(o.target.value),onBlur:d,autoFocus:!0,style:{background:"#1a1a1a",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"4px",fontSize:"13px",width:"100%",height:"100%"},onClick:e=>e.stopPropagation(),children:i.map((e=>(0,c.jsx)("option",{value:e,style:{background:"#1a1a1a",color:"#00ff00"},children:e},e)))}):(0,c.jsx)("div",{onClick:e=>{e.stopPropagation(),t(!0)},style:{cursor:"pointer",padding:"4px",height:"100%",display:"flex",alignItems:"center",color:(p=a,"aborted"===(null===p||void 0===p?void 0:p.toLowerCase())?"#ff0000":"#00ff00"),justifyContent:"center"},title:"Click to edit status",children:a||"Select status"});var p},S=e=>{const o=e.value||"",t=!o.trim();return(0,c.jsx)("div",{style:{padding:"2px 6px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"flex-start",color:t?"#666":"#e0e0e0",fontStyle:t?"italic":"normal",textAlign:"left",fontSize:"16px",fontWeight:"500"},title:o||"People introduced",children:t?"No people":o})},k=e=>{const[o,t]=(0,r.useState)(!1),[a,n]=(0,r.useState)(e.value||""),i=e=>{n(e.target.value)},d=async()=>{if(t(!1),a!==(e.value||"")){var o;const t=null===(o=e.data)||void 0===o?void 0:o.id;if(!t)return;try{const{error:o}=await l.supabase.from("introductions").update({text:a}).eq("introduction_id",t);if(o)throw o;s.oR.success("Note updated successfully"),e.setValue(a)}catch(r){console.error("Error updating note:",r),s.oR.error("Failed to update note"),n(e.value||"")}}},p=o=>{"Enter"===o.key&&d(),"Escape"===o.key&&(n(e.value||""),t(!1))};if(o)return(0,c.jsx)("div",{style:{width:"100%",height:"100%",display:"flex",alignItems:"center",padding:"1px"},children:(0,c.jsx)("input",{type:"text",value:a,onChange:i,onBlur:d,onKeyDown:p,autoFocus:!0,style:{width:"100%",height:"24px",background:"linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",color:"#ffffff",border:"1px solid #00ff00",borderRadius:"4px",padding:"2px 6px",fontSize:"12px",fontFamily:"Courier New, monospace",outline:"none",boxShadow:"0 0 4px rgba(0, 255, 0, 0.3)",transition:"all 0.2s ease",boxSizing:"border-box"},placeholder:"Enter note..."})});const u=a||e.value||"",f=!u.trim();return(0,c.jsx)("div",{onClick:e=>{e.stopPropagation(),t(!0)},style:{cursor:"pointer",padding:"2px 6px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",width:"100%",height:"100%",display:"flex",alignItems:"center",color:f?"#666":"#e0e0e0",fontStyle:f?"italic":"normal"},title:u||"Click to add note",children:f?"Add note":u})},j=a.Ay.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #00ff00;
  color: #000000;
  border: 1px solid #00ff00;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Courier New', monospace;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  margin-left: auto; /* Push to the right */
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.9);
    box-shadow: 0 0 12px rgba(0, 255, 0, 0.5);
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }
  
  svg {
    font-size: 16px;
  }
`,_=e=>{const[o,t]=r.useState(!1),[a,n]=r.useState(e.value||""),i=["Dealflow","Portfolio Company","Karma Points"],d=()=>{t(!1)};return o?(0,c.jsx)("select",{value:a,onChange:o=>(async o=>{if(o!==a)try{const{error:r}=await l.supabase.from("introductions").update({category:o}).eq("introduction_id",e.data.id);if(r)throw r;n(o),e.setValue(o),e.data.rationale=o,e.api&&e.api.refreshCells({force:!0,rowNodes:[e.node],columns:["rationale"]}),t(!1),s.oR.success(`Category updated to "${o}"`)}catch(r){console.error("Error updating category:",r),s.oR.error(`Failed to update category: ${r.message}`),t(!1)}else t(!1)})(o.target.value),onBlur:d,autoFocus:!0,style:{background:"#1a1a1a",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"4px",fontSize:"13px",width:"100%",height:"100%"},onClick:e=>e.stopPropagation(),children:i.map((e=>(0,c.jsx)("option",{value:e,style:{background:"#1a1a1a",color:"#00ff00"},children:e},e)))}):(0,c.jsx)("div",{onClick:e=>{e.stopPropagation(),t(!0)},style:{cursor:"pointer",padding:"4px",height:"100%",display:"flex",alignItems:"center",color:a?"#e0e0e0":"#888"},title:"Click to edit category",children:a||"Select category"})},F=e=>(0,c.jsx)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100%"},children:(0,c.jsx)("button",{onClick:async o=>{if(null===o||void 0===o||o.stopPropagation(),!e.data||!e.data.id)return void console.error("No introduction ID found");const t=e.data.id;if(window.confirm("Are you sure you want to delete this introduction?\n\nThis action cannot be undone."))try{const{error:o}=await l.supabase.from("introductions").delete().eq("introduction_id",t);if(o)throw o;s.oR.success("Introduction deleted successfully!"),e.context&&e.context.refreshData&&e.context.refreshData()}catch(r){console.error("Error deleting introduction:",r),s.oR.error(`Failed to delete introduction: ${r.message}`)}},style:{background:"transparent",border:"none",color:"#ff6b6b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:"20px",height:"20px",borderRadius:"3px",transition:"all 0.2s",padding:"0",margin:"0"},title:"Delete Introduction",onMouseEnter:e=>{e.target.style.transform="scale(1.1)",e.target.style.color="#ff5555"},onMouseLeave:e=>{e.target.style.transform="scale(1)",e.target.style.color="#ff6b6b"},children:(0,c.jsx)(i.IXo,{size:14})})}),A=e=>{const[o,t]=(0,r.useState)(0),a=e.value||"",n=a?a.split(", ").filter((e=>e.trim())):[],i=n.length>1;if(!n.length)return(0,c.jsx)("div",{style:{padding:"2px 4px",color:"#666",fontStyle:"italic",display:"flex",alignItems:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"No companies"});const l=n[o];return(0,c.jsx)("div",{style:{display:"flex",alignItems:"center",height:"36px",minHeight:"36px",width:"100%",position:"relative"},onClick:e=>{e.stopPropagation()},children:(0,c.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"4px"},children:[(0,c.jsxs)("div",{style:{display:"inline-flex",alignItems:"center",backgroundColor:"#1a1a1a",color:"#ffffff",padding:"0px 6px",borderRadius:"4px",fontSize:"11px",border:"1px solid #ffffff",boxShadow:"0 0 4px rgba(255, 255, 255, 0.2)",whiteSpace:"nowrap",overflow:"hidden",lineHeight:"16px",height:"18px",position:"relative",maxWidth:"200px"},children:[(0,c.jsx)("span",{style:{overflow:"hidden",textOverflow:"ellipsis",display:"inline-block",maxWidth:i?"120px":"160px"},title:l,children:l}),i&&(0,c.jsxs)("div",{style:{fontSize:"9px",color:"#cccccc",marginLeft:"4px",padding:"0 2px",borderRadius:"3px",backgroundColor:"#333333",flexShrink:0},children:[o+1,"/",n.length]})]}),i&&(0,c.jsx)("button",{onClick:e=>{null===e||void 0===e||e.stopPropagation(),t((e=>(e+1)%n.length))},style:{background:"none",border:"none",color:"#ffffff",cursor:"pointer",padding:"0",display:"flex",alignItems:"center",justifyContent:"center",width:"14px",height:"14px",fontSize:"10px",opacity:"0.8",marginLeft:"2px"},title:"Next company",children:"\u25b6"})]})})},R=()=>{const[e,o]=(0,r.useState)([]),[t,a]=(0,r.useState)([]),[s,R]=(0,r.useState)(!0),[z,D]=(0,r.useState)(null),[I,T]=(0,r.useState)(null),[N,E]=(0,r.useState)(""),[P,$]=(0,r.useState)(null),[W,O]=(0,r.useState)(!1),M=async()=>{try{R(!0),D(null);const{data:e,error:t}=await l.supabase.from("introductions").select("*").order("created_at",{ascending:!1});if(t)throw t;console.log("Raw introductions data from Supabase:",e),e&&e.length>0&&(console.log("First row keys:",Object.keys(e[0])),console.log("First row sample:",e[0]));const r=new Set;null===e||void 0===e||e.forEach((e=>{e.contact_ids&&Array.isArray(e.contact_ids)&&e.contact_ids.forEach((e=>r.add(e)))}));let n={},i={};if(r.size>0){console.log("Fetching contacts for IDs:",Array.from(r));const{data:e,error:o}=await l.supabase.from("contacts").select("contact_id, first_name, last_name").in("contact_id",Array.from(r));if(o)console.error("Error fetching contacts:",o);else{console.log("Fetched contacts data:",e),null===e||void 0===e||e.forEach((e=>{const o=`${e.first_name||""} ${e.last_name||""}`.trim();console.log(`Contact ${e.contact_id}: first_name="${e.first_name}", last_name="${e.last_name}", combined="${o}"`),n[e.contact_id]=o||"Unknown Contact"})),console.log("Final contacts map:",n);const o=new Set((null===e||void 0===e?void 0:e.map((e=>e.contact_id)))||[]),t=Array.from(r).filter((e=>!o.has(e)));t.length>0&&console.warn("Contact IDs not found in database:",t)}console.log("Fetching companies for contact IDs:",Array.from(r));const{data:t,error:a}=await l.supabase.from("contact_companies").select("\n            contact_id,\n            company_id,\n            companies!inner(\n              company_id,\n              name\n            )\n          ").in("contact_id",Array.from(r));a?console.error("Error fetching contact companies:",a):(console.log("Fetched contact companies data:",t),null===t||void 0===t||t.forEach((e=>{var o;const t=e.contact_id,r=null===(o=e.companies)||void 0===o?void 0:o.name;r&&(i[t]||(i[t]=[]),i[t].push(r))})),console.log("Final companies map:",i))}const s=(null===e||void 0===e?void 0:e.map(((e,o)=>{let t="";if(e.contact_ids&&Array.isArray(e.contact_ids)){t=e.contact_ids.map((e=>n[e]?n[e]:"\ud83d\udeab Deleted Contact")).join(" \u2194 ")}let r="";if(e.contact_ids&&Array.isArray(e.contact_ids)){const o=new Set;e.contact_ids.forEach((e=>{i[e]&&i[e].forEach((e=>{o.add(e)}))})),r=Array.from(o).join(", ")}return{id:e.introduction_id||o+1,date:e.introduction_date||(e.created_at?new Date(e.created_at).toISOString().split("T")[0]:""),peopleIntroduced:t,relatedCompanies:r,notes:"",intro:e.text||"",rationale:e.category||"",status:e.status||"Requested"}})))||[];console.log("Transformed data:",s),o(s),a(s)}catch(e){console.error("Error fetching introductions:",e),D(`Failed to load introductions: ${e.message}`),o([]),a([])}finally{R(!1)}},q=(0,r.useMemo)((()=>[{headerName:"Date",field:"date",valueFormatter:e=>{if(!e.value)return"";try{const o=new Date(e.value),t=String(o.getDate()).padStart(2,"0"),r=String(o.getMonth()+1).padStart(2,"0");return`${t}/${r}/${String(o.getFullYear()).slice(-2)}`}catch(z){return e.value}},minWidth:80,flex:.7,filter:"agDateColumnFilter",floatingFilter:!0,sortable:!0,sort:"desc",initialSort:!0},{headerName:"People Introduced",field:"peopleIntroduced",cellRenderer:S,minWidth:250,flex:4,filter:"agTextColumnFilter",floatingFilter:!0,sortable:!0},{headerName:"Related Companies",field:"relatedCompanies",cellRenderer:A,minWidth:200,flex:2.5,filter:"agTextColumnFilter",floatingFilter:!0,sortable:!0},{headerName:"Notes",field:"intro",cellRenderer:k,minWidth:150,flex:1.8,filter:"agTextColumnFilter",floatingFilter:!0,sortable:!0},{headerName:"Category",field:"rationale",cellRenderer:_,minWidth:150,flex:1.8,filter:"agTextColumnFilter",floatingFilter:!0,sortable:!0},{headerName:"Status",field:"status",cellRenderer:C,minWidth:100,flex:.9,filter:!0,floatingFilter:!0,sortable:!0,cellStyle:{display:"flex",alignItems:"center",justifyContent:"center"}},{headerName:"Actions",field:"actions",cellRenderer:F,minWidth:70,flex:.4,filter:!1,floatingFilter:!1,sortable:!1,cellStyle:{display:"flex",alignItems:"center",justifyContent:"center"}}]),[]),K=(0,r.useMemo)((()=>({resizable:!0})),[]),L=(0,r.useCallback)((()=>36),[]),H=(0,r.useCallback)((e=>({background:e.node.rowIndex%2===0?"#121212":"#1a1a1a",borderRight:"none"})),[]);(0,r.useEffect)((()=>(M(),window.refreshIntroductionsData=G,()=>{delete window.refreshIntroductionsData})),[]),(0,r.useEffect)((()=>{let o=e;null!==P&&(o=o.filter((e=>e.rationale===P))),N.trim()&&(o=o.filter((e=>Object.values(e).some((e=>e&&e.toString().toLowerCase().includes(N.toLowerCase())))))),a(o)}),[N,e,P]),(0,r.useEffect)((()=>{if(!I)return;let e,o;const t=()=>{clearTimeout(e),cancelAnimationFrame(o),e=setTimeout((()=>{o=requestAnimationFrame((()=>{try{I.sizeColumnsToFit()}catch(e){console.warn("Error resizing grid:",e)}}))}),500)};return window.addEventListener("resize",t,{passive:!0}),()=>{window.removeEventListener("resize",t,{passive:!0}),clearTimeout(e),cancelAnimationFrame(o)}}),[I]);const G=()=>{M()},V=e=>{P===e?($(null),console.log("Deselecting category, showing all results")):($(e),console.log("Filtering by category:",e))};return(0,c.jsxs)(u,{children:[(0,c.jsx)(p,{}),(0,c.jsxs)(f,{children:[(0,c.jsxs)(x,{children:[(0,c.jsx)(h,{children:(0,c.jsx)(i.CKj,{})}),(0,c.jsx)(g,{type:"text",placeholder:"SEARCH...",value:N,onChange:e=>E(e.target.value)})]}),N&&(0,c.jsx)("button",{onClick:()=>E(""),style:{background:"transparent",border:"none",color:"#00ff00",cursor:"pointer",fontSize:"16px",padding:"4px"},title:"Clear search",children:"\u2715"})]}),(0,c.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 20px"},children:[(0,c.jsxs)("div",{style:{display:"flex",alignItems:"center",margin:"20px 0",gap:"10px"},children:[(0,c.jsx)("button",{onClick:()=>V("Dealflow"),style:{display:"flex",alignItems:"center",gap:"8px",backgroundColor:"Dealflow"===P?"rgba(0, 255, 0, 0.4)":"rgba(0, 255, 0, 0.2)",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"8px 16px",fontSize:"0.9rem",fontWeight:"bold",cursor:"pointer",transition:"all 0.2s ease",fontFamily:"Courier New, monospace",boxShadow:"Dealflow"===P?"0 0 12px rgba(0, 255, 0, 0.5)":"0 0 8px rgba(0, 255, 0, 0.3)"},onMouseOver:e=>{"Dealflow"!==P&&(e.currentTarget.style.backgroundColor="rgba(0, 255, 0, 0.3)",e.currentTarget.style.boxShadow="0 0 12px rgba(0, 255, 0, 0.5)")},onMouseOut:e=>{"Dealflow"!==P&&(e.currentTarget.style.backgroundColor="rgba(0, 255, 0, 0.2)",e.currentTarget.style.boxShadow="0 0 8px rgba(0, 255, 0, 0.3)")},children:"Dealflow"}),(0,c.jsx)("button",{onClick:()=>V("Portfolio Company"),style:{display:"flex",alignItems:"center",gap:"8px",backgroundColor:"Portfolio Company"===P?"rgba(0, 255, 0, 0.4)":"rgba(0, 255, 0, 0.2)",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"8px 16px",fontSize:"0.9rem",fontWeight:"bold",cursor:"pointer",transition:"all 0.2s ease",fontFamily:"Courier New, monospace",boxShadow:"Portfolio Company"===P?"0 0 12px rgba(0, 255, 0, 0.5)":"0 0 8px rgba(0, 255, 0, 0.3)"},onMouseOver:e=>{"Portfolio Company"!==P&&(e.currentTarget.style.backgroundColor="rgba(0, 255, 0, 0.3)",e.currentTarget.style.boxShadow="0 0 12px rgba(0, 255, 0, 0.5)")},onMouseOut:e=>{"Portfolio Company"!==P&&(e.currentTarget.style.backgroundColor="rgba(0, 255, 0, 0.2)",e.currentTarget.style.boxShadow="0 0 8px rgba(0, 255, 0, 0.3)")},children:"Portfolio Company"}),(0,c.jsx)("button",{onClick:()=>V("Karma Points"),style:{display:"flex",alignItems:"center",gap:"8px",backgroundColor:"Karma Points"===P?"rgba(0, 255, 0, 0.4)":"rgba(0, 255, 0, 0.2)",color:"#00ff00",border:"1px solid #00ff00",borderRadius:"4px",padding:"8px 16px",fontSize:"0.9rem",fontWeight:"bold",cursor:"pointer",transition:"all 0.2s ease",fontFamily:"Courier New, monospace",boxShadow:"Karma Points"===P?"0 0 12px rgba(0, 255, 0, 0.5)":"0 0 8px rgba(0, 255, 0, 0.3)"},onMouseOver:e=>{"Karma Points"!==P&&(e.currentTarget.style.backgroundColor="rgba(0, 255, 0, 0.3)",e.currentTarget.style.boxShadow="0 0 12px rgba(0, 255, 0, 0.5)")},onMouseOut:e=>{"Karma Points"!==P&&(e.currentTarget.style.backgroundColor="rgba(0, 255, 0, 0.2)",e.currentTarget.style.boxShadow="0 0 8px rgba(0, 255, 0, 0.3)")},children:"Karma Points"})]}),(0,c.jsxs)(j,{onClick:()=>{console.log("Add new introduction clicked"),O(!0)},children:[(0,c.jsx)(i.GGD,{})," ADD NEW"]})]}),(0,c.jsxs)(m,{children:[z&&(0,c.jsxs)(b,{children:["Error: ",z]}),s?(0,c.jsxs)(y,{children:[(0,c.jsx)(v,{children:"Loading introductions..."}),(0,c.jsx)(w,{})]}):0===t.length?(0,c.jsx)("div",{style:{padding:"40px",textAlign:"center",color:"#00ff00",background:"#121212",borderRadius:"8px"},children:N?`No introductions found matching "${N}"`:"No introductions found."}):(0,c.jsx)("div",{className:"ag-theme-alpine",style:{height:"calc(100% - 5px)",width:"100%",overflowX:"hidden",boxSizing:"border-box",marginRight:"5px","--ag-background-color":"#121212","--ag-odd-row-background-color":"#1a1a1a","--ag-header-background-color":"#222222","--ag-header-foreground-color":"#00ff00","--ag-foreground-color":"#e0e0e0","--ag-row-hover-color":"transparent","--ag-border-color":"#333333","--ag-cell-horizontal-padding":"8px","--ag-borders":"none","--ag-header-height":"32px","--ag-header-column-separator-display":"none","--ag-font-size":"12px","--ag-paging-panel-height":"42px","--ag-row-height":"36px"},children:(0,c.jsx)(n.W,{rowData:t,columnDefs:q,defaultColDef:K,onGridReady:e=>{T(e.api),requestAnimationFrame((()=>{setTimeout((()=>{try{e.api.sizeColumnsToFit(),setTimeout((()=>{try{e.api.applyColumnState&&e.api.applyColumnState({state:[{colId:"date",sort:"desc"}],defaultState:{sort:null}})}catch(o){console.warn("Error setting column state:",o)}}),300)}catch(o){console.warn("Error sizing columns:",o)}}),200)}))},rowSelection:"none",animateRows:!1,pagination:!0,paginationPageSize:100,suppressCellFocus:!0,enableCellTextSelection:!0,getRowHeight:L,getRowStyle:H,suppressHorizontalScroll:!0,paginationNumberFormatter:e=>`${e.value}`,alwaysShowHorizontalScroll:!1,alwaysShowVerticalScroll:!1,overlayNoRowsTemplate:'<span style="padding: 10px; border: 1px solid #00ff00; background: #121212; color: #00ff00;">No introductions found</span>'})})]}),W&&(0,c.jsx)(d.A,{isOpen:W,onClose:()=>O(!1),onSave:G})]})}}}]);
//# sourceMappingURL=936.3e84004f.chunk.js.map