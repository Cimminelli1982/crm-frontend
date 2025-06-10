"use strict";(self.webpackChunkcontact_dashboard=self.webpackChunkcontact_dashboard||[]).push([[748],{7748:(e,d,r)=>{r.r(d),r.d(d,{default:()=>x});var o=r(5043),a=r(1529),t=r(7694),c=r(579);const i=a.Ay.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #121212;
`,n=a.Ay.div`
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
`,s=a.Ay.button`
  padding: 8px 16px;
  background-color: ${e=>e.$active?"#00ff00":"#222"};
  color: ${e=>e.$active?"#000":"#00ff00"};
  border: 1px solid #00ff00;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${e=>e.$active?"#00ff00":"#333"};
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
`,l=a.Ay.div`
  flex: 1;
  overflow: hidden;
`,x=()=>{const[e,d]=(0,o.useState)("created");return(0,c.jsxs)(i,{children:[(0,c.jsxs)(n,{children:[(0,c.jsx)(s,{$active:"created"===e,onClick:()=>d("created"),children:"Last Created"}),(0,c.jsx)(s,{$active:"edited"===e,onClick:()=>d("edited"),children:"Last Edited"})]}),(0,c.jsx)(l,{children:(0,c.jsx)(t.A,{category:"created"===e?"recent-created":"recent-edited"})})]})}}}]);
//# sourceMappingURL=748.e99d6b10.chunk.js.map