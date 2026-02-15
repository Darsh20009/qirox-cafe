import{j as e}from"./vendor-ui-DJm-zmnP.js";import{r as h}from"./vendor-react-Bzsngnqy.js";import{a as $,b as M}from"./html5-qrcode-scanner-BAmOd9U4.js";import{l as B,I as H,B as P,q as O,Y as V,U as _,j as Q,p as Y,a5 as W,G as X,a1 as Z,a4 as F}from"./index-61RjstaY.js";import{C as U}from"./camera-v_eqnnci.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=B("CameraOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16",key:"qmtpty"}],["path",{d:"M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5",key:"1ufyfc"}],["path",{d:"M14.121 15.121A3 3 0 1 1 9.88 10.88",key:"11zox6"}]]);function lt({onCustomerFound:t,onClose:o,showManualInput:a=!0}){const[n,p]=h.useState(!1),[i,c]=h.useState(""),[r,x]=h.useState(!1),[m,l]=h.useState(null),[d,u]=h.useState(null),f=h.useRef(null),b="qr-scanner-container",k=h.useCallback(async s=>{if(s.trim()){x(!0),l(null),u(null);try{const y=await fetch(`/api/loyalty/cards/lookup/${encodeURIComponent(s.trim())}`),g=await y.json();y.ok&&g.found?(u(g),t?.(g)):l(g.error||"البطاقة غير موجودة")}catch{l("فشل في البحث عن البطاقة")}finally{x(!1)}}},[t]),C=h.useCallback(async()=>{try{if(p(!0),l(null),f.current&&await f.current.stop(),await new Promise(z=>setTimeout(z,100)),!document.getElementById(b))throw new Error("Camera container not found");const y=[$.QR_CODE,$.CODE_128,$.CODE_39,$.EAN_13,$.EAN_8,$.UPC_A,$.UPC_E],g=new M(b,{formatsToSupport:y,verbose:!1});f.current=g,await g.start({facingMode:"environment"},{fps:10,qrbox:{width:280,height:150},aspectRatio:1.5},async z=>{try{await g.stop(),p(!1),k(z)}catch{}},()=>{})}catch(s){console.error("Scanner error:",s),l(s.message||"فشل في تشغيل الكاميرا. تأكد من السماح بالوصول للكاميرا."),p(!1)}},[k]),j=h.useCallback(async()=>{if(f.current){try{await f.current.stop()}catch{}f.current=null}p(!1)},[]);h.useEffect(()=>()=>{j()},[j]);const N=()=>{k(i)},w=d?.card?Math.max(0,(d.card.freeCupsEarned||0)-(d.card.freeCupsRedeemed||0)):0,q={bronze:"برونزي",silver:"فضي",gold:"ذهبي",platinum:"بلاتيني"};return e.jsx("div",{className:"w-full","data-testid":"barcode-scanner",children:e.jsxs("div",{className:"space-y-4",children:[a&&e.jsxs("div",{className:"mb-4 p-3 bg-muted/50 rounded-lg border border-border",children:[e.jsx("label",{className:"text-sm font-medium text-foreground block mb-2",children:"بحث يدوي"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(H,{placeholder:"أدخل رقم البطاقة أو رقم الهاتف...",value:i,onChange:s=>c(s.target.value),onKeyDown:s=>s.key==="Enter"&&N(),className:"flex-1","data-testid":"input-manual-code"}),e.jsx(P,{onClick:N,disabled:r||!i.trim(),"data-testid":"button-manual-search",children:r?e.jsx(O,{className:"w-4 h-4 animate-spin"}):e.jsx(V,{className:"w-4 h-4"})})]})]}),e.jsxs("div",{className:"relative w-full",children:[e.jsx("div",{id:b,className:`w-full h-80 bg-muted rounded-lg overflow-hidden ${n?"":"hidden"}`}),!n&&e.jsxs("div",{className:"flex flex-col items-center gap-4 py-8 px-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20",children:[e.jsx("div",{className:"w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/30",children:e.jsx(U,{className:"w-12 h-12 text-muted-foreground/60"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"font-medium text-foreground mb-2",children:"ماسح رمز استجابة سريعة"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-4",children:"اضغط للبدء في مسح بطاقة العميل"})]}),e.jsxs(P,{onClick:C,className:"gap-2 px-6","data-testid":"button-start-scan",children:[e.jsx(U,{className:"w-4 h-4"}),"تشغيل الماسح"]})]}),n&&e.jsxs(P,{variant:"outline",onClick:j,className:"w-full gap-2 mt-2","data-testid":"button-stop-scan",children:[e.jsx(G,{className:"w-4 h-4"}),"إيقاف الماسح"]})]}),m&&e.jsx("div",{className:"p-3 bg-destructive/10 text-destructive rounded-lg text-center text-sm","data-testid":"text-error",children:m}),d?.found&&d.card&&e.jsxs("div",{className:"space-y-3 p-4 bg-muted rounded-lg","data-testid":"customer-result",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(_,{className:"w-5 h-5 text-muted-foreground"}),e.jsx("span",{className:"font-bold","data-testid":"text-result-name",children:d.card.customerName||d.customer?.name||"عميل"})]}),e.jsx(Q,{variant:"secondary","data-testid":"text-result-tier",children:q[d.card.tier]||"برونزي"})]}),e.jsxs("div",{className:"flex items-center gap-2 text-sm text-muted-foreground",children:[e.jsx(Y,{className:"w-4 h-4"}),e.jsx("span",{"data-testid":"text-result-phone",children:d.card.phoneNumber})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-2 pt-2",children:[e.jsxs("div",{className:"text-center p-2 bg-background rounded-md",children:[e.jsx(W,{className:"w-4 h-4 mx-auto mb-1 text-yellow-500"}),e.jsxs("div",{className:"font-bold","data-testid":"text-result-stamps",children:[d.card.stamps%6,"/6"]}),e.jsx("div",{className:"text-xs text-muted-foreground",children:"أختام"})]}),e.jsxs("div",{className:`text-center p-2 rounded-md ${w>0?"bg-green-100 dark:bg-green-900/30":"bg-background"}`,children:[e.jsx(X,{className:"w-4 h-4 mx-auto mb-1 text-green-600"}),e.jsx("div",{className:`font-bold ${w>0?"text-green-600":""}`,"data-testid":"text-result-free",children:w}),e.jsx("div",{className:"text-xs text-muted-foreground",children:"مجاني"})]}),e.jsxs("div",{className:"text-center p-2 bg-background rounded-md",children:[e.jsx(Z,{className:"w-4 h-4 mx-auto mb-1 text-muted-foreground"}),e.jsx("div",{className:"font-bold","data-testid":"text-result-spent",children:d.card.totalSpent}),e.jsx("div",{className:"text-xs text-muted-foreground",children:"ر.س"})]})]}),w>0&&e.jsxs("div",{className:"p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center text-green-700 dark:text-green-400 font-bold",children:["هذا العميل لديه ",w," مشروب مجاني!"]})]})]})})}function A(t,o,a={}){const{paperWidth:n="80mm",autoClose:p=!1,autoPrint:i=!0,showPrintButton:c=!0}=a,r=c?`
    <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px;">
      <button onclick="window.print()" style="padding: 12px 32px; font-size: 16px; background: #b45309; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">
        طباعة
      </button>
      <button onclick="window.close()" style="padding: 12px 32px; font-size: 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">
        إغلاق
      </button>
    </div>
  `:"",x=`
    <style>
      @media print {
        @page { size: ${n} auto; margin: 0; }
        body { margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .invoice-container, .receipt, .ticket, .card { max-width: ${n}; }
      }
    </style>
  `;let m=t;c&&!m.includes('<div class="no-print"')&&(m=m.replace("</body>",`${r}</body>`)),m=m.replace("</head>",`${x}</head>`);const l=window.open("","_blank","width=450,height=700,scrollbars=yes,resizable=yes");if(l)l.document.write(m),l.document.close(),l.document.title=o,i&&(l.onload=function(){setTimeout(()=>{l.print(),p&&setTimeout(()=>l.close(),1e3)},300)});else{const d=document.createElement("iframe");d.style.cssText="position: absolute; left: -9999px; top: -9999px; width: 0; height: 0;",document.body.appendChild(d);const u=d.contentDocument||d.contentWindow?.document;u&&(u.open(),u.write(m),u.close(),setTimeout(()=>{d.contentWindow?.print(),setTimeout(()=>document.body.removeChild(d),1e3)},500))}return l}async function ct(t){const o=t.items.map(n=>`
    <div style="padding: 8px 0; border-bottom: 1px dashed #ccc; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 16px; font-weight: 700;">${n.coffeeItem.nameAr}</div>
        ${n.coffeeItem.nameEn?`<div style="font-size: 12px; color: #666;">${n.coffeeItem.nameEn}</div>`:""}
      </div>
      <div style="font-size: 24px; font-weight: 700; background: #000; color: #fff; padding: 4px 12px; border-radius: 8px;">x${n.quantity}</div>
    </div>
  `).join(""),a=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>طلب المطبخ - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #000; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .ticket { margin: 0 auto; padding: 16px; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
    .order-number { font-size: 28px; font-weight: 700; }
    .urgent { background: #dc2626; color: #fff; padding: 4px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; animation: blink 1s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .table-info { font-size: 20px; font-weight: 700; color: #b45309; margin-top: 8px; }
    .timestamp { font-size: 12px; color: #666; }
    .items { margin: 16px 0; }
    .notes { background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 14px; }
    .notes-label { font-weight: 700; color: #92400e; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="order-number">#${t.orderNumber}</div>
      ${t.priority==="urgent"?'<div class="urgent">عاجل!</div>':""}
      ${t.tableNumber?`<div class="table-info">طاولة ${t.tableNumber}</div>`:""}
      <div class="timestamp">${t.timestamp}</div>
    </div>
    <div class="items">${o}</div>
    ${t.notes?`<div class="notes"><span class="notes-label">ملاحظات:</span> ${t.notes}</div>`:""}
  </div>
</body>
</html>
  `;A(a,`طلب المطبخ - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,autoClose:!0,showPrintButton:!1})}const T=.15,S="311234567890003",E="CLUNY CAFE",I="CLUNY CAFE",K="1010XXXXXX",J="الفرع الرئيسي",tt="الرياض، المملكة العربية السعودية";function et(t){const o=(l,d)=>{const f=new TextEncoder().encode(d),b=new Uint8Array(2+f.length);return b[0]=l,b[1]=f.length,b.set(f,2),b},a=o(1,t.sellerName),n=o(2,t.vatNumber),p=o(3,t.timestamp),i=o(4,t.totalWithVat),c=o(5,t.vatAmount),r=new Uint8Array(a.length+n.length+p.length+i.length+c.length);let x=0;r.set(a,x),x+=a.length,r.set(n,x),x+=n.length,r.set(p,x),x+=p.length,r.set(i,x),x+=i.length,r.set(c,x);let m="";return r.forEach(l=>{m+=String.fromCharCode(l)}),btoa(m)}function v(t){if(t==null)return 0;if(typeof t=="number")return isNaN(t)?0:t;const o=parseFloat(t);return isNaN(o)?0:o}function R(t){try{const o=new Date(t);return isNaN(o.getTime())?{date:t,time:""}:{date:o.toLocaleDateString("ar-SA",{year:"numeric",month:"2-digit",day:"2-digit"}),time:o.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0})}}catch{return{date:t,time:""}}}async function ot(t){const o=v(t.total),a=t.discount?v(t.discount.amount):0,n=v(t.invoiceDiscount),p=t.items.reduce((s,y)=>s+v(y.itemDiscount),0),i=o/(1+T),c=o-i,r=a+n+p,x=i+r/(1+T),m=t.invoiceNumber||`INV-${t.orderNumber}`,{date:l,time:d}=R(t.date),u=t.branchName||J,f=t.branchAddress||tt,b=t.date?new Date(t.date).toISOString():new Date().toISOString(),k=et({sellerName:E,vatNumber:S,timestamp:b,totalWithVat:o.toFixed(2),vatAmount:c.toFixed(2)});let C="";try{C=await F.toDataURL(k,{width:180,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(s){console.error("Error generating QR code:",s)}const j=`${window.location.origin}/tracking/${t.orderNumber}`;let N="";try{N=await F.toDataURL(j,{width:120,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(s){console.error("Error generating tracking QR:",s)}const w=t.items.map((s,y)=>{const g=v(s.coffeeItem.price),z=g*s.quantity,D=v(s.itemDiscount),L=z-D;return`
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px 4px; text-align: right;">
          <div style="font-weight: 500; color: #1a1a1a;">${s.coffeeItem.nameAr}</div>
          ${s.coffeeItem.nameEn?`<div style="font-size: 10px; color: #666;">${s.coffeeItem.nameEn}</div>`:""}
          ${D>0?`<div style="font-size: 10px; color: #16a34a;">خصم: ${D.toFixed(2)}-</div>`:""}
        </td>
        <td style="padding: 8px 4px; text-align: center;">${s.quantity}</td>
        <td style="padding: 8px 4px; text-align: center;">${g.toFixed(2)}</td>
        <td style="padding: 8px 4px; text-align: left; font-weight: 500;">${L.toFixed(2)}</td>
      </tr>
    `}).join(""),q=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ضريبية - ${m}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      background: #ffffff;
      color: #000000;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .invoice-container {
      max-width: 80mm;
      margin: 0 auto;
      padding: 12px;
      background: #ffffff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 2px dashed #333;
    }
    
    .logo-container {
      width: 64px;
      height: 64px;
      margin: 0 auto 8px;
      background: #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      color: #fff;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .company-name-en {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    
    .branch-name {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    
    .branch-address {
      font-size: 11px;
      color: #888;
    }
    
    .invoice-title {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
    }
    
    .invoice-title h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .invoice-title p {
      font-size: 11px;
      color: #666;
    }
    
    .section {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #ccc;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
    }
    
    .info-label {
      color: #666;
    }
    
    .info-value {
      font-weight: 500;
      color: #1a1a1a;
    }
    
    .vat-box {
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .vat-box .info-value {
      font-family: monospace;
      font-weight: 700;
      direction: ltr;
      text-align: left;
    }
    
    .invoice-number-box {
      background: #eee;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .invoice-number-box .info-value {
      color: #000;
      font-weight: 700;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    thead tr {
      border-bottom: 2px solid #333;
    }
    
    th {
      padding: 8px 4px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    th:first-child { text-align: right; }
    th:nth-child(2), th:nth-child(3) { text-align: center; width: 48px; }
    th:last-child { text-align: left; width: 64px; }
    
    .totals {
      margin-top: 12px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
    }
    
    .total-row.discount {
      color: #16a34a;
    }
    
    .total-row.vat {
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .total-row.grand {
      background: #eee;
      padding: 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 16px;
      color: #000;
      margin-top: 8px;
    }
    
    .payment-method {
      background: #eee;
      padding: 12px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }
    
    .payment-method .value {
      color: #000;
      font-weight: 700;
    }
    
    .qr-section {
      text-align: center;
      margin: 16px 0;
    }
    
    .qr-title {
      font-size: 12px;
      font-weight: 700;
      color: #333;
      margin-bottom: 4px;
    }
    
    .qr-subtitle {
      font-size: 10px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .qr-container {
      display: inline-block;
      padding: 8px;
      background: #fff;
      border: 2px solid #ddd;
      border-radius: 8px;
    }
    
    .qr-container img {
      width: 144px;
      height: 144px;
    }
    
    .qr-note {
      font-size: 9px;
      color: #888;
      margin-top: 8px;
    }
    
    .footer {
      text-align: center;
      padding-top: 16px;
      border-top: 2px solid #333;
    }
    
    .footer-thanks {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .footer-thanks-en {
      font-size: 12px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .footer-vat-note {
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    
    .footer-vat-note p {
      color: #666;
    }
    
    .footer-social {
      font-size: 12px;
      color: #666;
    }
    
    .footer-social .handle {
      font-family: monospace;
      font-weight: 700;
      color: #000;
    }
    
    .footer-generated {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      font-size: 9px;
      color: #888;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .invoice-container {
        padding: 8px;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-container">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2,21H20V19H2M20,8H18V5H20M20,3H4V13A4,4 0 0,0 8,17H14A4,4 0 0,0 18,13V10H20A2,2 0 0,0 22,8V5C22,3.89 21.1,3 20,3Z" />
        </svg>
      </div>
      <h1 class="company-name">${E}</h1>
      <p class="company-name-en">${I}</p>
      <p class="branch-name">${u}</p>
      <p class="branch-address">${f}</p>
      <div class="invoice-title">
        <h2>فاتورة ضريبية مبسطة</h2>
        <p>Simplified Tax Invoice</p>
      </div>
    </div>

    <div class="section">
      <div class="vat-box">
        <div class="info-row">
          <span class="info-label">الرقم الضريبي VAT:</span>
          <span class="info-value">${S}</span>
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">السجل التجاري CR:</span>
        <span class="info-value" style="font-family: monospace; direction: ltr;">${K}</span>
      </div>
    </div>

    <div class="section">
      <div class="invoice-number-box">
        <div class="info-row">
          <span class="info-label">رقم الفاتورة:</span>
          <span class="info-value">${m}</span>
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">التاريخ:</span>
        <span class="info-value">${l}</span>
      </div>
      <div class="info-row">
        <span class="info-label">الوقت:</span>
        <span class="info-value" style="direction: ltr; text-align: left;">${d}</span>
      </div>
    </div>

    <div class="section">
      <div class="info-row">
        <span class="info-label">العميل:</span>
        <span class="info-value">${t.customerName||"عميل"}</span>
      </div>
      ${t.customerPhone?`
      <div class="info-row">
        <span class="info-label">الجوال:</span>
        <span class="info-value" style="font-family: monospace; direction: ltr;">${t.customerPhone}</span>
      </div>
      `:""}
      ${t.tableNumber?`
      <div class="info-row">
        <span class="info-label">الطاولة:</span>
        <span class="info-value">${t.tableNumber}</span>
      </div>
      `:""}
      ${t.orderType||t.orderTypeName?`
      <div class="info-row" style="background: #f5f5f5; padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; border: 1px solid #ddd;">
        <span class="info-label">نوع الطلب:</span>
        <span class="info-value" style="font-weight: 700; font-size: 14px;">${t.orderTypeName||(t.orderType==="dine_in"?"محلي":t.orderType==="takeaway"?"سفري":t.orderType==="delivery"?"توصيل":"غير محدد")}</span>
      </div>
      `:""}
      <div class="info-row">
        <span class="info-label">الكاشير:</span>
        <span class="info-value">${t.employeeName}</span>
      </div>
    </div>

    <div class="section">
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${w}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span>المجموع قبل الضريبة والخصم:</span>
        <span>${x.toFixed(2)} ر.س</span>
      </div>
      
      ${p>0?`
      <div class="total-row discount">
        <span>خصومات الأصناف:</span>
        <span>(${(p/(1+T)).toFixed(2)}) ر.س</span>
      </div>
      `:""}
      
      ${t.discount&&a>0?`
      <div class="total-row discount">
        <span>خصم ${t.discount.code} (${t.discount.percentage}%):</span>
        <span>(${(a/(1+T)).toFixed(2)}) ر.س</span>
      </div>
      `:""}

      ${n>0?`
      <div class="total-row discount">
        <span>خصم الفاتورة:</span>
        <span>(${(n/(1+T)).toFixed(2)}) ر.س</span>
      </div>
      `:""}

      <div class="total-row" style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 4px;">
        <span>الصافي قبل الضريبة:</span>
        <span>${i.toFixed(2)} ر.س</span>
      </div>

      <div class="total-row vat">
        <span>ضريبة القيمة المضافة (15%):</span>
        <span>${c.toFixed(2)} ر.س</span>
      </div>

      <div class="total-row grand">
        <span>الإجمالي شامل الضريبة:</span>
        <span>${o.toFixed(2)} ر.س</span>
      </div>
    </div>

    <div class="section" style="margin-top: 16px;">
      <div class="payment-method">
        <span>طريقة الدفع:</span>
        <span class="value">${t.paymentMethod}</span>
      </div>
    </div>

    <div class="qr-section">
      <p class="qr-title">رمز الاستجابة السريع للتحقق من الفاتورة</p>
      <p class="qr-subtitle">ZATCA Compliant QR Code for Verification</p>
      ${C?`
      <div class="qr-container">
        <img src="${C}" alt="ZATCA QR Code" />
      </div>
      `:""}
      <p class="qr-note">امسح الرمز للتحقق من صحة الفاتورة</p>
    </div>

    ${N?`
    <div class="qr-section" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 12px;">
      <p class="qr-title">تتبع الطلب</p>
      <p class="qr-subtitle">Order Tracking</p>
      <div class="qr-container">
        <img src="${N}" alt="Tracking QR" style="width: 100px; height: 100px;" />
      </div>
      <p class="qr-note">امسح لتتبع طلبك</p>
    </div>
    `:""}

    <div class="footer">
      <p class="footer-thanks">شكراً لزيارتكم</p>
      <p class="footer-thanks-en">Thank you for visiting us</p>
      
      <div class="footer-vat-note">
        <p>جميع الأسعار شاملة ضريبة القيمة المضافة 15%</p>
        <p>All prices include 15% VAT</p>
      </div>
      
      <div class="footer-social">
        <p>تابعونا على وسائل التواصل الاجتماعي</p>
        <p class="handle">@CLUNY CAFE</p>
      </div>
      
      <div class="footer-generated">
        <p>تم إنشاء هذه الفاتورة إلكترونياً</p>
        <p>This invoice was generated electronically</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;A(q,`فاتورة ضريبية - ${m}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}async function nt(t){const o=`${window.location.origin}/order/${t.orderNumber}`;let a="";try{a=await F.toDataURL(o,{width:150,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(r){console.error("Error generating order tracking QR:",r)}const{date:n,time:p}=R(t.date),i=t.deliveryTypeAr||(t.deliveryType==="dine-in"?"في الكافيه":t.deliveryType==="delivery"?"توصيل":"استلام"),c=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>إيصال استلام - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #000; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt { max-width: 80mm; margin: 0 auto; padding: 16px; }
    .header { text-align: center; border-bottom: 3px solid #b45309; padding-bottom: 16px; margin-bottom: 16px; }
    .company-name { font-size: 28px; font-weight: 700; color: #b45309; }
    .order-badge { display: inline-block; background: #fef3c7; border: 2px solid #b45309; padding: 12px 24px; border-radius: 12px; margin: 16px 0; }
    .order-number { font-size: 32px; font-weight: 700; color: #b45309; }
    .order-type { display: inline-block; background: ${t.deliveryType==="dine-in"?"#8b5cf6":t.deliveryType==="delivery"?"#10b981":"#3b82f6"}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 16px; font-weight: 600; margin-top: 8px; }
    .section { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #ccc; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .items-section { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .item-row:last-child { border-bottom: none; }
    .item-name { font-weight: 600; }
    .item-qty { background: #000; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 14px; }
    .total-section { background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 16px; }
    .total-amount { font-size: 28px; font-weight: 700; color: #b45309; }
    .qr-section { text-align: center; padding: 16px; border: 2px dashed #b45309; border-radius: 12px; background: #fffbeb; }
    .qr-title { font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
    .qr-container img { width: 120px; height: 120px; }
    .qr-note { font-size: 11px; color: #666; margin-top: 8px; }
    .footer { text-align: center; padding-top: 16px; font-size: 12px; color: #666; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1 class="company-name">${E}</h1>
      <p style="color: #666; font-size: 14px;">إيصال الاستلام</p>
      <div class="order-badge">
        <div class="order-number">#${t.orderNumber}</div>
      </div>
      <div class="order-type">${i}</div>
    </div>

    <div class="section">
      <div class="info-row">
        <span>العميل:</span>
        <span style="font-weight: 600;">${t.customerName}</span>
      </div>
      <div class="info-row">
        <span>التاريخ:</span>
        <span>${n} - ${p}</span>
      </div>
      ${t.tableNumber?`
      <div class="info-row">
        <span>الطاولة:</span>
        <span style="font-weight: 700; font-size: 18px;">${t.tableNumber}</span>
      </div>
      `:""}
    </div>

    <div class="items-section">
      ${t.items.map(r=>`
        <div class="item-row">
          <span class="item-name">${r.coffeeItem.nameAr}</span>
          <span class="item-qty">x${r.quantity}</span>
        </div>
      `).join("")}
    </div>

    <div class="total-section">
      <p style="font-size: 14px; color: #92400e;">الإجمالي المدفوع</p>
      <p class="total-amount">${t.total} ر.س</p>
      <p style="font-size: 12px; color: #666; margin-top: 4px;">${t.paymentMethod}</p>
    </div>

    <div class="qr-section">
      <p class="qr-title">امسح لتتبع طلبك</p>
      ${a?`<div class="qr-container"><img src="${a}" alt="Order Tracking QR" /></div>`:""}
      <p class="qr-note">أو زر الرابط: cluny.com/order/${t.orderNumber}</p>
    </div>

    <div class="footer">
      <p style="font-weight: 600;">شكراً لزيارتكم</p>
      <p>نتمنى لكم تجربة ممتعة</p>
      <p style="margin-top: 8px;">@CLUNY CAFE</p>
    </div>
  </div>
</body>
</html>
  `;A(c,`إيصال استلام - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}async function it(t){const{date:o,time:a}=R(t.date),n=t.deliveryTypeAr||(t.deliveryType==="dine-in"?"في الكافيه":t.deliveryType==="delivery"?"توصيل":"استلام"),p=v(t.total),i=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>نسخة الكاشير - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #000; direction: rtl; }
    .receipt { max-width: 80mm; margin: 0 auto; padding: 12px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
    .title { font-size: 14px; font-weight: 700; background: #000; color: #fff; padding: 4px 12px; display: inline-block; margin-bottom: 8px; }
    .order-number { font-size: 24px; font-weight: 700; }
    .order-type { font-size: 14px; font-weight: 600; color: #666; }
    .section { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #999; font-size: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .items { font-size: 12px; }
    .item-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
    .totals { font-size: 12px; margin-top: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .total-grand { font-size: 16px; font-weight: 700; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
    .signature { margin-top: 24px; border-top: 1px solid #000; padding-top: 8px; }
    .signature-line { border-bottom: 1px solid #000; height: 30px; margin-top: 12px; }
    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <span class="title">نسخة الكاشير</span>
      <div class="order-number">#${t.orderNumber}</div>
      <div class="order-type">${n}</div>
    </div>

    <div class="section">
      <div class="info-row"><span>التاريخ:</span><span>${o}</span></div>
      <div class="info-row"><span>الوقت:</span><span>${a}</span></div>
      <div class="info-row"><span>الكاشير:</span><span>${t.employeeName}</span></div>
      <div class="info-row"><span>العميل:</span><span>${t.customerName}</span></div>
      <div class="info-row"><span>الجوال:</span><span>${t.customerPhone}</span></div>
      ${t.tableNumber?`<div class="info-row"><span>الطاولة:</span><span>${t.tableNumber}</span></div>`:""}
    </div>

    <div class="items">
      ${t.items.map(c=>{const r=v(c.coffeeItem.price);return`
        <div class="item-row">
          <span>${c.coffeeItem.nameAr} x${c.quantity}</span>
          <span>${(r*c.quantity).toFixed(2)}</span>
        </div>
        `}).join("")}
    </div>

    <div class="totals">
      <div class="total-row"><span>المجموع الفرعي:</span><span>${t.subtotal} ر.س</span></div>
      ${t.discount?`<div class="total-row" style="color: green;"><span>الخصم (${t.discount.percentage}%):</span><span>-${t.discount.amount} ر.س</span></div>`:""}
      <div class="total-row total-grand"><span>الإجمالي:</span><span>${p.toFixed(2)} ر.س</span></div>
      <div class="total-row"><span>طريقة الدفع:</span><span>${t.paymentMethod}</span></div>
    </div>

    <div class="signature">
      <p style="font-size: 11px;">توقيع العميل (للدفع بالبطاقة):</p>
      <div class="signature-line"></div>
    </div>

    <div class="footer">
      <p>تم الحفظ في ${a} - ${o}</p>
    </div>
  </div>
</body>
</html>
  `;A(i,`نسخة الكاشير - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}async function mt(t){await ot(t),setTimeout(async()=>{await nt(t)},500),setTimeout(async()=>{await it(t)},1e3)}async function xt(t){const o=t.items.map(i=>{const r=v(i.coffeeItem.price)*i.quantity;return`
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 8px 4px; text-align: right;">${i.coffeeItem.nameAr}</td>
        <td style="padding: 8px 4px; text-align: center;">${i.quantity}</td>
        <td style="padding: 8px 4px; text-align: left;">${r.toFixed(2)}</td>
      </tr>
    `}).join(""),a=`${window.location.origin}/tracking?order=${t.orderNumber}`;let n="";try{n=await F.toDataURL(a,{width:100,margin:1,color:{dark:"#000000",light:"#FFFFFF"},errorCorrectionLevel:"M"})}catch(i){console.error("Error generating tracking QR code:",i)}const p=`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>إيصال - ${t.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Cairo', sans-serif;
      background: #fff;
      color: #000;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .receipt {
      max-width: 80mm;
      margin: 0 auto;
      padding: 16px;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px dashed #333;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    
    .company-name { font-size: 24px; font-weight: 700; }
    .company-name-en { font-size: 14px; color: #666; }
    
    .section {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #ccc;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }
    
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { padding: 8px 4px; font-weight: 700; border-bottom: 2px solid #333; }
    th:first-child { text-align: right; }
    th:nth-child(2) { text-align: center; }
    th:last-child { text-align: left; }
    
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #333; padding-top: 12px; }
    
    .footer { text-align: center; padding-top: 16px; border-top: 2px dashed #333; }
    
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1 class="company-name">${E}</h1>
      <p class="company-name-en">${I}</p>
      <p style="margin-top: 8px; font-size: 12px;">فاتورة مبيعات</p>
    </div>

    <div class="section">
      <div class="info-row">
        <span><strong>رقم الطلب:</strong></span>
        <span>${t.orderNumber}</span>
      </div>
      <div class="info-row">
        <span>التاريخ:</span>
        <span>${t.date}</span>
      </div>
      <div class="info-row">
        <span>العميل:</span>
        <span>${t.customerName}</span>
      </div>
      <div class="info-row">
        <span>الجوال:</span>
        <span>${t.customerPhone}</span>
      </div>
      ${t.tableNumber?`
      <div class="info-row">
        <span>الطاولة:</span>
        <span>${t.tableNumber}</span>
      </div>
      `:""}
      <div class="info-row">
        <span>الكاشير:</span>
        <span>${t.employeeName}</span>
      </div>
    </div>

    <div class="section">
      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>السعر</th>
          </tr>
        </thead>
        <tbody>
          ${o}
        </tbody>
      </table>
    </div>

    <div>
      <div class="total-row">
        <span>المجموع الفرعي:</span>
        <span>${t.subtotal} ريال</span>
      </div>
      ${t.discount?`
      <div class="total-row" style="color: #16a34a;">
        <span>الخصم (${t.discount.code} - ${t.discount.percentage}%):</span>
        <span>-${t.discount.amount} ريال</span>
      </div>
      `:""}
      <div class="total-row grand">
        <span>الإجمالي:</span>
        <span>${t.total} ريال</span>
      </div>
      <div class="total-row" style="margin-top: 12px;">
        <span>طريقة الدفع:</span>
        <span><strong>${t.paymentMethod}</strong></span>
      </div>
    </div>

    ${n?`
    <div style="text-align: center; padding: 16px 0; border-top: 2px dashed #333; margin-top: 16px;">
      <p style="font-size: 12px; color: #666; margin-bottom: 8px;">امسح لتتبع طلبك</p>
      <img src="${n}" alt="تتبع الطلب" style="width: 80px; height: 80px;" />
      <p style="font-size: 10px; color: #888; margin-top: 4px;">رقم الطلب: ${t.orderNumber}</p>
    </div>
    `:""}

    <div class="footer">
      <p>شكراً لزيارتكم</p>
      <p style="font-size: 12px; color: #666;">نتمنى لكم تجربة ممتعة</p>
      <p style="margin-top: 12px; font-size: 12px;">تابعونا على وسائل التواصل الاجتماعي</p>
      <p style="font-family: monospace;">@CLUNY CAFE</p>
    </div>
  </div>

</body>
</html>
  `;A(p,`إيصال - ${t.orderNumber}`,{paperWidth:"80mm",autoPrint:!0,showPrintButton:!0})}export{lt as B,ot as a,mt as b,ct as c,xt as p};
