const { useState, useEffect, useRef, useCallback } = React;

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#F2F5FB", canvas:"#E8EEF8",
  panel:"#FFFFFF", panelB:"#F0F5FB",
  border:"#CDDAEE", borderB:"#B5C8E8",
  accent:"#3DAA3B", accentB:"#2E8A2C", accentLight:"#E6F7E6", accentMid:"#B2E0B1",
  blue:"#1B4FD8", blueB:"#1440B0", blueLight:"#E6ECFB", blueMid:"#B8C8F5",
  purple:"#5B3DB8", purpleLight:"#EDE9FE",
  amber:"#B86B00", amberLight:"#FEF3C7", amberMid:"#FDE099",
  red:"#C82222", redLight:"#FEE2E2", redMid:"#FECACA",
  cyan:"#0A7A9A", cyanLight:"#CFFAFE",
  orange:"#B84800",
  text:"#0A1A3D", textMid:"#1C3060", textMuted:"#4E6490", textLight:"#8498C0",
  white:"#FFFFFF",
  shadow:"0 1px 4px rgba(27,79,216,.09),0 1px 2px rgba(27,79,216,.05)",
  shadowMd:"0 4px 8px rgba(27,79,216,.10),0 2px 4px rgba(27,79,216,.06)",
  shadowLg:"0 10px 20px rgba(27,79,216,.12),0 4px 8px rgba(27,79,216,.06)",
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const TRIGGER_TYPES = {
  email:{label:"Email Source",icon:"✉",color:C.blue,providers:{
    gmail:{label:"Gmail",fields:["Email ID","App Password","Polling Folder","IMAP Server","SMTP Server"]},
    outlook:{label:"Outlook / MS365",fields:["Email ID","Client ID","Client Secret","Tenant ID","Polling Folder","IMAP Server","SMTP Server"]},
    zoho:{label:"Zoho Mail",fields:["Email ID","App Password","Client ID","Client Secret","Polling Folder"]},
  }},
  api:{label:"API",icon:"⚡",color:C.purple,fields:["Endpoint URL","HTTP Method","API Key / Token","Request Params","Headers"]},
  webhook:{label:"Webhook",icon:"🔗",color:C.accent,fields:["Webhook URL","Secret Token","Payload Format"]},
  ftp:{label:"FTP / SFTP",icon:"📁",color:C.amber,fields:["Host","Port","Username","Password / Key","Watch Folder","File Pattern"]},
  erp:{label:"ERP / URL",icon:"🏢",color:C.orange,fields:["URL","Username","Password","Navigation Path","Download Action","Schedule"]},
  url:{label:"URL Polling",icon:"🌐",color:C.cyan,fields:["URL","Auth Token","Poll Interval","Data Path (JSONPath)"]},
};

// Required fields per trigger type/provider
const REQUIRED_FIELDS = {
  email:{gmail:["Email ID","App Password"],outlook:["Email ID","Client ID","Client Secret","Tenant ID"],zoho:["Email ID","App Password"]},
  api:["Endpoint URL","API Key / Token"],
  webhook:["Webhook URL"],
  ftp:["Host","Username","Password / Key"],
  erp:["URL","Username"],
  url:["URL"],
};

const OUTPUT_TYPES = {
  api:{label:"REST API",icon:"⚡",color:C.purple,fields:["Endpoint URL","HTTP Method","API Key / Token","Output Format","Headers"]},
  webhook:{label:"Webhook",icon:"🔗",color:C.accent,fields:["Webhook URL","Secret Token","Payload Format"]},
  email:{label:"Email",icon:"✉",color:C.blue,fields:["To Email","Subject Template","Body Template"]},
  ftp:{label:"FTP / SFTP",icon:"📁",color:C.amber,fields:["Host","Port","Username","Password","Output Folder","File Format"]},
  erp:{label:"ERP Entry",icon:"🏢",color:C.orange,fields:["ERP URL","API Endpoint","Auth Token","Entry Type","Confirm Field"]},
};

const OUTPUT_LABELS = {api:"REST API",webhook:"Webhook",email:"Email",ftp:"FTP / SFTP",erp:"ERP Entry"};

const DOC_TYPES = {
  awb:{label:"Air Waybill (AWB)",short:"AWB",color:C.blue,fields:["AWB Number","Airline Code","Airline Name","Vendor Name","Flight #","Date","Origin","Destination","Product Description","Weight (kg)","Volume (cbm)","Freight Amount","Currency","LAT","Pickup","Delivery Point","SCI","ULD"]},
  bl:{label:"Bill of Lading (BL)",short:"BL",color:C.accent,fields:["BL Number","Shipper Name","Shipper Address","Forwarder Name","Consignee Name","Consignee Address","Consignee GST","Notify Party","Vessel","Voyage","Shipping Line","Port of Loading","Port of Discharge","Date","Freight Terms","Container #","Seal #","Product Description","Weight","Volume"]},
  invoice:{label:"Commercial Invoice",short:"INV",color:C.purple,fields:["Invoice Number","Invoice Date","Vendor Name","Vendor Address","Vendor Tax ID","Customer Name","Customer Address","Line Items","Subtotal","Tax Amount","Total Amount","Currency","Payment Terms","Due Date"]},
  si:{label:"Shipping Instruction (SI)",short:"SI",color:C.cyan,fields:["SI Number","Shipper","Consignee","Notify Party","Port of Loading","Port of Discharge","Vessel","Voyage","Container Type","Cargo Description","Weight","Volume","Special Instructions"]},
  pod:{label:"Proof of Delivery (POD)",short:"POD",color:C.amber,fields:["POD Number","Delivery Date","Recipient Name","Signature","Condition","Remarks","Driver Name","Vehicle #"]},
};

const MASTER_TYPES = {
  vendor:{label:"Vendor Master",icon:"🏪",fields:["Vendor Name (Doc)","Vendor Name (ERP)","Vendor Code","Tax ID","Country","Branch","Payment Terms"]},
  charge:{label:"Charge Master",icon:"💰",fields:["Charge Name (Doc)","Charge Code (ERP)","Vendor Code","GL Account","Tax Type"]},
  tax:{label:"Tax Master",icon:"🧾",fields:["Tax Name","Tax Code","Rate (%)","HSN Code","Country"]},
  customer:{label:"Customer Master",icon:"👤",fields:["Customer Name (Doc)","Customer Name (ERP)","Customer Code","Credit Limit","Country"]},
  carrier:{label:"Carrier Master",icon:"🚢",fields:["Carrier Name (Doc)","Carrier Code (ERP)","SCAC Code","BL Prefix","Mode"]},
  port:{label:"Port Master",icon:"⚓",fields:["Port Name (Doc)","Port Code (ERP)","LOCODE","Country","Terminal"]},
};

const ACTION_ITEMS = [
  {id:"read",label:"Read Emails",icon:"📨",color:C.blue,desc:"Read incoming messages",logicLabel:"Read from",logicPlaceholder:"e.g. all emails / only unread"},
  {id:"filter_sender",label:"Filter by Sender",icon:"🔍",color:C.blue,desc:"Only from specific domain/address",logicLabel:"Allow from",logicPlaceholder:"e.g. @maersk.com or carrier@company.com"},
  {id:"filter_subject",label:"Filter by Subject",icon:"🏷",color:C.blue,desc:"Match / exclude subject keywords",logicLabel:"Subject rule",logicPlaceholder:"e.g. Exclude 'Happy Birthday', Include 'AWB'"},
  {id:"exclude_auto",label:"Exclude Auto-replies",icon:"🚫",color:C.textMuted,desc:"Skip OOO, birthday, auto-reply",logicLabel:"Exclusion terms",logicPlaceholder:"e.g. Out of Office, Happy Birthday, Auto-reply"},
  {id:"check_attach",label:"Check Attachment",icon:"📎",color:C.amber,desc:"Require attachment; set allowed types",logicLabel:"Allowed file types",logicPlaceholder:"e.g. pdf, doc, xls, jpg, png (max 10MB)"},
  {id:"extract_content",label:"Extract Content",icon:"📄",color:C.accent,desc:"Read email body + attachments",logicLabel:"Content to extract",logicPlaceholder:"e.g. body text and all attachments"},
  {id:"doc_ai",label:"Document AI",icon:"🤖",color:C.purple,desc:"Send to AI for field extraction",logicLabel:"AI instruction",logicPlaceholder:"e.g. Extract all fields from AWB document"},
  {id:"pass_through",label:"Pass-Through",icon:"➡",color:C.textMuted,desc:"Forward data as-is",logicLabel:"Forward to",logicPlaceholder:"e.g. next stage without transformation"},
];

const RULE_TEMPLATES = [
  {id:"empty_check",label:"Empty Field Alert",icon:"🔴",desc:"Raise alert if a field is empty",color:C.red,logicPlaceholder:"e.g. If AWB Number, Origin, Destination is empty, raise an alert"},
  {id:"prefix",label:"Add Prefix / Suffix",icon:"✏️",desc:"Add prefix/suffix to a field value",color:C.amber,logicPlaceholder:"e.g. If airline code is 175, add 'EK' as prefix for AWB number"},
  {id:"amount_check",label:"Amount Mismatch",icon:"💱",desc:"Flag if amounts differ between doc and ERP",color:C.purple,logicPlaceholder:"e.g. If invoice total differs from ERP by more than $1, flag mismatch"},
  {id:"duplicate",label:"Duplicate Check",icon:"🔁",desc:"Stop if reference already exists in ERP",color:C.red,logicPlaceholder:"e.g. If invoice number already exists in ERP, stop processing"},
  {id:"conditional",label:"Conditional Route",icon:"🔀",desc:"Branch workflow based on a condition",color:C.accent,logicPlaceholder:"e.g. If BL type is NEGOTIABLE, route to finance team"},
  {id:"concat",label:"Concatenate Fields",icon:"🔗",desc:"Merge two fields into one",color:C.cyan,logicPlaceholder:"e.g. Merge Vessel + Voyage into VesselVoyage field"},
  {id:"split",label:"Split Field",icon:"✂️",desc:"Split a field value by delimiter",color:C.cyan,logicPlaceholder:"e.g. Split Container# by ',' to get individual container numbers"},
];

// ─── AUDIT LOG STORE ──────────────────────────────────────────────────────────
let _auditLog = [];
const AUDIT_LISTENERS = new Set();
function addAuditEntry(section, action, detail, prev="", next="") {
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  const entry = { id: Date.now()+Math.random(), ts, section, action, detail, prev, next, user:"user@company.com" };
  _auditLog = [entry, ..._auditLog].slice(0,200);
  AUDIT_LISTENERS.forEach(fn => fn([..._auditLog]));
}
function useAuditLog() {
  const [log, setLog] = useState([..._auditLog]);
  useEffect(()=>{ AUDIT_LISTENERS.add(setLog); return()=>AUDIT_LISTENERS.delete(setLog); },[]);
  return log;
}

// ─── NLP PARSERS ──────────────────────────────────────────────────────────────
function parseTriggerNL(text) {
  const t=text.toLowerCase(); let type=null,provider=null,fields={};
  if(t.includes("gmail")){type="email";provider="gmail";}
  else if(t.includes("outlook")||t.includes("ms365")||t.includes("microsoft")){type="email";provider="outlook";}
  else if(t.includes("zoho")){type="email";provider="zoho";}
  else if(t.includes("email")||t.includes("inbox")||t.includes("imap")){type="email";}
  else if(t.includes("webhook")){type="webhook";}
  else if(t.includes("ftp")||t.includes("sftp")){type="ftp";}
  else if(t.includes("api")||t.includes("endpoint")){type="api";}
  else if(t.includes("erp")||t.includes("sap")||t.includes("oracle")){type="erp";}
  else if(t.includes("url")||t.includes("http")){type="url";}
  const emailM=text.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i); if(emailM)fields["Email ID"]=emailM[0];
  // app password — grab next token after "app password" or "password"
  const pwdM=text.match(/app\s*password\s*[:\-=\s"']+([^\s"',]+)/i)||text.match(/password\s*[:\-="'\s]+([^\s"',]+)/i);
  if(pwdM&&pwdM[1])fields["App Password"]=pwdM[1];
  const cidM=text.match(/client\s*id\s*[:\-=\s"']+([^\s"',]+)/i); if(cidM)fields["Client ID"]=cidM[1];
  const csecM=text.match(/client\s*secret\s*[:\-=\s"']+([^\s"',]+)/i); if(csecM)fields["Client Secret"]=csecM[1];
  const tidM=text.match(/tenant\s*(?:id)?\s*[:\-=\s"']+([a-z0-9-]+)/i); if(tidM)fields["Tenant ID"]=tidM[1];
  const fldM=text.match(/(?:folder|directory)[:\-=\s"']+([^"'\n,]+)/i); if(fldM)fields["Polling Folder"]=fldM[1].trim().replace(/['"]/g,"");
  const imapM=text.match(/imap\s*[:\-=\s"']+(\S+)/i); if(imapM)fields["IMAP Server"]=imapM[1];
  const smtpM=text.match(/smtp\s*[:\-=\s"']+(\S+)/i); if(smtpM)fields["SMTP Server"]=smtpM[1];
  // URL for non-email
  const urlM=text.match(/https?:\/\/[^\s,"']+/i);
  if(urlM){if(type==="webhook")fields["Webhook URL"]=urlM[0]; else if(type!=="email")fields["Endpoint URL"]=urlM[0];}
  const tokM=text.match(/(?:api\s*key|token)\s*[:\-=\s"']+([^\s"',]+)/i); if(tokM)fields["API Key / Token"]=tokM[1];
  const whM=text.match(/webhook\s*url\s*[:\-=\s"']+([^\s,"']+)/i); if(whM)fields["Webhook URL"]=whM[1];
  const hostM=text.match(/(?:host|server)\s*[:\-=\s"']+([^\s,"']+)/i); if(hostM&&(type==="ftp"||type==="erp"))fields["Host"]=hostM[1];
  const userM=text.match(/(?:username|user)\s*[:\-=\s"']+([^\s,"']+)/i); if(userM)fields["Username"]=userM[1];
  return{type,provider,fields};
}

function parseActionsNL(text) {
  const t=text.toLowerCase(); const items=[]; const remarks={};
  if(t.includes("read")){ items.push("read"); remarks["read"]="Read all incoming emails"; }
  // sender filter
  const domainM=text.match(/@[\w.-]+\.[a-z]{2,}/i)||text.match(/from\s+([\w.-]+\.[a-z]{2,})/i);
  if(t.includes("filter")||t.includes("sender")||t.includes("domain")||t.includes("from ")||domainM){
    items.push("filter_sender");
    remarks["filter_sender"]=domainM?`Allow from: ${domainM[0]}`:"Filter by sender domain/address";
  }
  // subject
  const subjectM=text.match(/subject[^\n.]*?(exclude|include|contain|not)[^\n.]*(["'][^"']*["']|[a-z ]+)/i);
  if(t.includes("subject")){
    items.push("filter_subject");
    remarks["filter_subject"]=subjectM?`Subject rule: ${subjectM[0].replace(/^subject/i,"").trim()}`:"Filter by subject";
  }
  if(t.includes("exclude")||t.includes("ooo")||t.includes("auto-reply")){
    items.push("exclude_auto");
    const excM=text.match(/exclude\s+["']?([^"',\n.]+)["']?/i);
    remarks["exclude_auto"]=excM?`Exclude: "${excM[1].trim()}"`:"Exclude auto-replies, OOO, birthday";
  }
  // attachment
  if(t.includes("attach")){
    items.push("check_attach");
    const ftM=text.match(/(?:doc|pdf|xls|xlsx|jpg|jpeg|png|csv|xml)/gi);
    remarks["check_attach"]=ftM?`Allowed file types: ${[...new Set(ftM)].join(", ")}`:"Require attachment";
  }
  if(t.includes("extract")||t.includes("content")||t.includes("body")){
    items.push("extract_content"); remarks["extract_content"]="Extract email body and attachment content";
  }
  let docType=null; const docFields=[];
  const docMap={awb:["awb","air waybill"],bl:["bill of lading","b/l"," bl ","bl#"],invoice:["invoice","inv "],si:["shipping instruction"," si "],pod:["proof of delivery","pod"]};
  for(const[k,v]of Object.entries(docMap))if(v.some(x=>t.includes(x))){docType=k;items.push("doc_ai");remarks["doc_ai"]=`AI extraction: ${DOC_TYPES[k]?.label}`;break;}
  if(docType){
    DOC_TYPES[docType].fields.forEach(f=>{const fw=f.toLowerCase().replace(/[^a-z]/g," ").split(" ")[0];if(fw.length>2&&t.includes(fw))docFields.push(f);});
    if(docFields.length===0)docFields.push(...DOC_TYPES[docType].fields.slice(0,6));
  }
  return{items:[...new Set(items)],remarks,docType,docFields};
}

function classifyRuleSentence(s) {
  const t=s.toLowerCase();
  const numericOp=/\b(\w+)\s*(<>|!=|<=|>=|<|>)\s*[\d]+/.test(t);
  if(/\b(empty|missing|blank|raise.{0,10}alert)\b/.test(t)||t.includes("is empty")||t.includes("raise an alert"))return "empty_check";
  if(numericOp&&!/\b(prefix|suffix|route|forward|assign)\b/.test(t))return "empty_check";
  if(/\b(prefix|suffix|prepend|append)\b/.test(t))return "prefix";
  if(/\b(mismatch|amount differ|total differ|discrepan)\b/.test(t))return "amount_check";
  if(/\b(duplicate|already exist|already booked)\b/.test(t))return "duplicate";
  if(/\b(concat|concatenat|merge field|combine field|split by)\b/.test(t))return "concat";
  if(/\b(route to|forward to|send to team|escalate to|assign to)\b/.test(t)||
    /\b(destination is|if destination|if origin|if carrier|if country)\b/.test(t)||
    /@[\w.-]+\.[a-z]{2,}/.test(t)||
    (/\bif\b/.test(t)&&/\b(route|forward|send|assign|team|email|notify|escalate)\b/.test(t))||
    (/\bwhen\b/.test(t)&&/\b(route|forward|send|assign|team|notify)\b/.test(t)))return "conditional";
  if(/\bif\b/.test(t)||/\bwhen\b/.test(t))return "conditional";
  return "custom";
}

function parseRulesNL(text) {
  const sentences=text.split(/\.[ \t]+(?=[A-Z"'])|;[ \t]*|\r?\n/)
    .map(s=>s.replace(/^[-•*\s]+/,"").trim()).filter(s=>s.length>3);
  const buckets={};
  const TMPL_META={
    empty_check:{label:"Empty Field Alert",icon:"🔴",color:C.red},
    prefix:{label:"Add Prefix / Suffix",icon:"✏️",color:C.amber},
    amount_check:{label:"Amount Mismatch",icon:"💱",color:C.purple},
    duplicate:{label:"Duplicate Check",icon:"🔁",color:C.red},
    concat:{label:"Concatenate / Split",icon:"🔗",color:C.cyan},
    conditional:{label:"Conditional Route",icon:"🔀",color:C.accent},
    custom:{label:"Custom Rule",icon:"📐",color:C.purple}
  };
  sentences.forEach(s=>{
    const tmpl=classifyRuleSentence(s);
    if(!buckets[tmpl])buckets[tmpl]={...TMPL_META[tmpl],lines:[]};
    if(!buckets[tmpl].lines.includes(s))buckets[tmpl].lines.push(s);
  });
  const uid=Date.now();
  return Object.entries(buckets).map(([tmpl,b],i)=>({
    id:uid+"_"+i+"_"+tmpl,template:tmpl,label:b.label,icon:b.icon,color:b.color,
    logic:b.lines.length===1?b.lines[0]:b.lines.map((l,n)=>`${n+1}. ${l}`).join("\n")
  }));
}

function parseMastersNL(text) {
  const t=text.toLowerCase(); const items=[];
  if(t.includes("vendor"))items.push("vendor");
  if(t.includes("charge"))items.push("charge");
  if(t.includes("tax")||t.includes("gst")||t.includes("vat"))items.push("tax");
  if(t.includes("customer")||t.includes("consignee"))items.push("customer");
  if(t.includes("carrier")||t.includes("shipping line")||t.includes("airline"))items.push("carrier");
  if(t.includes("port")||t.includes("locode"))items.push("port");
  const masterFields={};
  items.forEach(m=>{
    const flds=MASTER_TYPES[m].fields;
    const selected=[];
    flds.forEach(f=>{const fw=f.toLowerCase().replace(/[^a-z]/g," ").split(/\s+/)[0];if(fw.length>2&&t.includes(fw))selected.push(f);});
    masterFields[m]=selected.length>0?selected:flds.slice(0,4);
  });
  return{items:[...new Set(items)],masterFields};
}

function parseOutputNL(text) {
  const t=text.toLowerCase(); let type=null,fields={};
  if(t.includes("webhook"))type="webhook";
  else if(t.includes("erp")||t.includes("sap")||t.includes("oracle")||t.includes("tms"))type="erp";
  else if(t.includes("email")||t.includes("mail"))type="email";
  else if(t.includes("ftp")||t.includes("sftp"))type="ftp";
  else if(t.includes("api")||t.includes("rest")||t.includes("post")||t.includes("endpoint"))type="api";
  // Match any URL including non-http like aper.teop.webhook
  const urlM=text.match(/https?:\/\/[^\s,"']+/gi)||text.match(/(?:to|at|url|webhook)\s+(\S+\.\S+)/i);
  if(urlM){
    const u=Array.isArray(urlM)?urlM[0]:urlM[1];
    if(u){
      const url=u.startsWith("http")?u:"https://"+u;
      if(type==="webhook")fields["Webhook URL"]=url;
      else if(type==="erp")fields["ERP URL"]=url;
      else if(type!=="email")fields["Endpoint URL"]=url;
    }
  }
  // Also handle bare domain URLs in text like "https://aper.teop.webhook"
  const bareUrl=text.match(/https?:\/\/[\w.-]+(?:\/[^\s,"']*)?/gi);
  if(bareUrl&&bareUrl[0]){
    if(type==="webhook"&&!fields["Webhook URL"])fields["Webhook URL"]=bareUrl[0];
    else if(type==="erp"&&!fields["ERP URL"])fields["ERP URL"]=bareUrl[0];
    else if(type!=="email"&&!fields["Endpoint URL"])fields["Endpoint URL"]=bareUrl[0];
  }
  const tokM=text.match(/(?:token|bearer|auth|api.?key|secret)\s*[:\-=\s"']+([^\s"',]+)/i); if(tokM)fields["API Key / Token"]=tokM[1];
  const secM=text.match(/(?:secret\s+token)\s+([^\s,"']+)/i); if(secM)fields["Secret Token"]=secM[1];
  const emM=text.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i); if(emM)fields["To Email"]=emM[0];
  const mthM=text.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/i); if(mthM)fields["HTTP Method"]=mthM[1].toUpperCase();
  const hostM=text.match(/(?:host|server)\s*[:\-=\s"']+([^\s,"']+)/i); if(hostM&&(type==="ftp"))fields["Host"]=hostM[1];
  return{type,fields};
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function SecTitle({children,style={}}) {
  return <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:C.textLight,marginBottom:8,...style}}>{children}</div>;
}
function Field({label,value,onChange,placeholder,required,error}) {
  const [focused,setFocused]=useState(false);
  const isEmpty=required&&!value?.trim();
  const showErr=isEmpty&&error;
  return(
    <div style={{marginBottom:10}}>
      <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:500,color:showErr?C.red:C.textMid,marginBottom:3}}>
        {label}{required&&<span style={{color:C.red}}>*</span>}
      </label>
      <input value={value||""} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder||`Enter ${label.toLowerCase()}`}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{width:"100%",padding:"6px 10px",border:`1.5px solid ${showErr?C.red:focused?C.blue:C.border}`,borderRadius:7,outline:"none",fontSize:12,color:C.text,background:C.white,transition:"border .15s",fontFamily:"inherit"}}/>
      {showErr&&<div style={{fontSize:10,color:C.red,marginTop:2}}>⚠ {label} is required</div>}
    </div>
  );
}
function Pill({children,color,bg,border}){
  return <span style={{display:"inline-block",padding:"1px 7px",borderRadius:20,fontSize:9,fontWeight:600,background:bg||C.accentLight,color:color||C.accentB,border:`1px solid ${border||C.accentMid}`,marginRight:4,marginBottom:3}}>{children}</span>;
}

// ─── CONVERSATIONAL SHELL (persists text) ─────────────────────────────────────
function ConvoShell({section,onParsed,persistKey,convoTexts,setConvoTexts}) {
  const text = convoTexts[section]||"";
  const setText = v => setConvoTexts(p=>({...p,[section]:v}));
  const [applied,setApplied]=useState(false);
  const [listening,setListening]=useState(false);

  const placeholders={
    trigger:"e.g. Watch my Gmail inbox at ops@company.com, app password Er45gYuq3, folder 'Logistics Docs'",
    actions:"e.g. Read emails from @maersk.com with attachments (pdf, doc, xls). Subject should not have 'Happy Birthday'. Extract AWB fields.",
    rules:"e.g. If airline code is 175, add 'EK' as prefix for AWB number. If AWB number, origin, destination is empty, raise an alert.",
    masters:"e.g. Map vendor master with vendor name, vendor code, tax ID. Map carrier master with carrier name, SCAC code, BL prefix.",
    output:"e.g. Send to webhook https://aper.teop.webhook with secret token xyz123",
    alerts:"e.g. Send Slack alerts to https://hooks.slack.com/xxx on failure. Email ops@company.com for critical errors.",
  };

  const parse=()=>{
    if(!text.trim())return;
    let result;
    if(section==="trigger")result=parseTriggerNL(text);
    else if(section==="actions")result=parseActionsNL(text);
    else if(section==="rules")result=parseRulesNL(text);
    else if(section==="masters")result=parseMastersNL(text);
    else if(section==="output")result=parseOutputNL(text);
    else if(section==="alerts"){
      result={};
      // Match any slack webhook URL including subdomains like test-hooks.slack.com
      const whM=text.match(/https?:\/\/[\w.-]*slack\.com\/[^\s,"']+/i)||
                text.match(/[\w.-]*slack\.com\/[^\s,"']+/i)||
                text.match(/https?:\/\/[^\s,"']+/i);
      // Parse channel — handle "channel : ops-team", "#ops-team", "channel ops-team"
      const chanM=text.match(/channel\s*[:\-]?\s*#?([\w-]+)/i);
      const chan=chanM?"#"+chanM[1].replace(/^#/,""):"#logistics-alerts";
      // Parse events — look for known event keywords
      const ALL_EVENTS=["failure","timeout","success","warning","critical","master_missing","duplicate"];
      const parsedEvents=ALL_EVENTS.filter(e=>text.toLowerCase().includes(e));
      if(whM){
        const url=whM[0].startsWith("http")?whM[0]:"https://"+whM[0];
        result.slack={webhook:url,channel:chan,events:parsedEvents.length>0?parsedEvents:["failure","timeout"]};
      }
      const emM=text.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i);
      if(emM)result.email={to:emM[0],events:parsedEvents.length>0?parsedEvents:["failure","critical"]};
    }
    onParsed(result); setApplied(true); setTimeout(()=>setApplied(false),2500);
  };

  const startVoice=()=>{
    if(!('webkitSpeechRecognition' in window)){alert("Voice input not supported in this browser.");return;}
    const r=new window.webkitSpeechRecognition();
    r.continuous=false; r.lang="en-US";
    r.onstart=()=>setListening(true);
    r.onresult=e=>setText(text+" "+e.results[0][0].transcript);
    r.onend=()=>setListening(false);
    r.start();
  };

  return(
    <div style={{marginBottom:14,background:C.white,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:C.shadow}}>
      <div style={{padding:"7px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8,background:C.panelB}}>
        <span style={{fontSize:13}}>💬</span>
        <span style={{fontSize:11,fontWeight:500,color:C.textMid}}>Describe in plain English</span>
        <button onClick={startVoice} style={{marginLeft:"auto",padding:"2px 8px",fontSize:10,borderRadius:5,border:`1px solid ${listening?C.red:C.border}`,background:listening?C.redLight:"transparent",color:listening?C.red:C.textMuted,cursor:"pointer",fontWeight:500}}>
          {listening?"🔴 Listening…":"🎙 Voice"}
        </button>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={placeholders[section]}
        style={{width:"100%",minHeight:72,padding:"10px 12px",background:"transparent",border:"none",outline:"none",color:C.text,fontSize:12,resize:"vertical",fontFamily:"inherit",lineHeight:1.7}}/>
      <div style={{padding:"6px 10px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center",background:C.panelB}}>
        <button onClick={parse} disabled={!text.trim()}
          style={{padding:"4px 14px",fontSize:11,fontWeight:600,borderRadius:6,background:text.trim()?C.accent:"#E5E7EB",border:"none",color:text.trim()?C.white:C.textLight,cursor:text.trim()?"pointer":"default"}}>
          Parse & Apply →
        </button>
        {applied&&<span style={{fontSize:11,color:C.accent,fontWeight:500}}>✓ Applied to fields below</span>}
        <button onClick={()=>setText("")} style={{marginLeft:"auto",fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer"}}>Clear</button>
      </div>
    </div>
  );
}

// ─── TRIGGER PANEL ────────────────────────────────────────────────────────────
function TriggerPanel({config,onChange,inputMode,convoTexts,setConvoTexts,showErrors}) {
  const [type,setType]=useState(config.type||null);
  const [provider,setProvider]=useState(config.provider||null);
  const [fields,setFields]=useState(config.fields||{});

  const applyNL=(p)=>{
    if(!p)return;
    const t=p.type||type; const prov=p.provider||provider; const flds={...fields,...p.fields};
    setType(t); setProvider(prov); setFields(flds);
    onChange({type:t,provider:prov,fields:flds});
    if(t)addAuditEntry("Trigger","Updated",`Trigger type set to ${TRIGGER_TYPES[t]?.label}${prov?` (${prov})`:""}`,config.type||"none",t);
  };

  const trig=type?TRIGGER_TYPES[type]:null;
  const prov=provider&&trig?.providers?trig.providers[provider]:null;
  const fieldList=prov?prov.fields:(trig?.fields||[]);
  const reqFields=type?(type==="email"?(provider?REQUIRED_FIELDS.email[provider]||[]:["Email ID"]):(Array.isArray(REQUIRED_FIELDS[type])?REQUIRED_FIELDS[type]:[])):[];

  const setField=(k,v)=>{
    const nf={...fields,[k]:v}; setFields(nf);
    onChange({type,provider,fields:nf});
    addAuditEntry("Trigger","Field updated",`${k} = "${v}"`,fields[k]||"",v);
  };
  const setTrigType=(k)=>{
    setType(k);setProvider(null);setFields({});
    onChange({type:k,provider:null,fields:{}});
    addAuditEntry("Trigger","Type changed",`Set to ${TRIGGER_TYPES[k]?.label}`,type||"none",k);
  };
  const setTrigProv=(k)=>{
    setProvider(k);onChange({type,provider:k,fields});
    addAuditEntry("Trigger","Provider changed",`Set to ${trig?.providers?.[k]?.label}`,provider||"none",k);
  };

  return(
    <div className="fade-in">
      {inputMode==="conversational"&&<ConvoShell section="trigger" onParsed={applyNL} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
      <SecTitle>Trigger Source</SecTitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
        {Object.entries(TRIGGER_TYPES).map(([k,t])=>(
          <button key={k} onClick={()=>setTrigType(k)}
            style={{padding:"10px 4px",background:type===k?t.color+"12":C.white,border:`1.5px solid ${type===k?t.color:C.border}`,borderRadius:9,cursor:"pointer",color:type===k?t.color:C.textMuted,textAlign:"center",transition:"all .15s",boxShadow:C.shadow}}>
            <div style={{fontSize:20,marginBottom:3}}>{t.icon}</div>
            <div style={{fontSize:10,fontWeight:600}}>{t.label}</div>
          </button>
        ))}
      </div>
      {trig?.providers&&(
        <div style={{marginBottom:12}}>
          <SecTitle>Provider</SecTitle>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.entries(trig.providers).map(([k,p])=>(
              <button key={k} onClick={()=>setTrigProv(k)}
                style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:provider===k?600:400,border:`1.5px solid ${provider===k?C.blue:C.border}`,background:provider===k?C.blueLight:C.white,color:provider===k?C.blue:C.textMid,cursor:"pointer"}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {fieldList.length>0&&(
        <div>
          <SecTitle>Connection Details</SecTitle>
          {fieldList.map(f=>(
            <Field key={f} label={f} value={fields[f]} onChange={v=>setField(f,v)}
              required={reqFields.includes(f)} error={showErrors}/>
          ))}
        </div>
      )}
      {type&&(
        <div style={{marginTop:8,padding:"7px 12px",background:C.accentLight,border:`1px solid ${C.accentMid}`,borderRadius:8,fontSize:11,color:C.accentB,fontWeight:500}}>
          ✓ {trig?.label}{prov?` — ${prov.label}`:""}
          {fields["Email ID"]&&<span style={{marginLeft:8,opacity:.8}}>{fields["Email ID"]}</span>}
        </div>
      )}
    </div>
  );
}

// ─── ACTIONS PANEL ────────────────────────────────────────────────────────────
function ActionsPanel({config,onChange,inputMode,convoTexts,setConvoTexts}) {
  const [items,setItems]=useState(config.items||[]);
  const [remarks,setRemarks]=useState(config.remarks||{});
  const [docType,setDocType]=useState(config.docType||null);
  const [docFields,setDocFields]=useState(config.docFields||[]);
  const [activeItem,setActiveItem]=useState(null); // for logic input expansion

  const applyNL=(p)=>{
    if(!p)return;
    const ni=[...new Set([...items,...(p.items||[])])];
    const nr={...remarks,...(p.remarks||{})};
    const nd=p.docType||docType;
    const ndf=p.docFields?.length>0?p.docFields:docFields;
    setItems(ni);setRemarks(nr);
    if(p.docType)setDocType(nd);
    if(p.docFields?.length>0)setDocFields(ndf);
    onChange({items:ni,remarks:nr,docType:nd,docFields:ndf});
    addAuditEntry("Actions","Updated via conversational",`Actions: ${ni.join(", ")}`,"","");
  };

  const toggleItem=(id)=>{
    const wasOn=items.includes(id);
    const ni=wasOn?items.filter(x=>x!==id):[...items,id];
    setItems(ni); onChange({items:ni,remarks,docType,docFields});
    if(!wasOn){setActiveItem(id);}else if(activeItem===id){setActiveItem(null);}
    addAuditEntry("Actions",wasOn?"Removed action":"Added action",id,"","");
  };
  const setRemark=(id,v)=>{const nr={...remarks,[id]:v};setRemarks(nr);onChange({items,remarks:nr,docType,docFields});};
  const toggleField=(f)=>{
    const nf=docFields.includes(f)?docFields.filter(x=>x!==f):[...docFields,f];
    setDocFields(nf);onChange({items,remarks,docType,docFields:nf});
    addAuditEntry("Actions",docFields.includes(f)?"Removed field":"Added field",f,"","");
  };
  const setDoc=(k)=>{
    setDocType(k);setDocFields([]);onChange({items,remarks,docType:k,docFields:[]});
    addAuditEntry("Actions","Document type set",DOC_TYPES[k]?.label||k,docType||"none",k);
  };

  return(
    <div className="fade-in">
      {inputMode==="conversational"&&<ConvoShell section="actions" onParsed={applyNL} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
      <SecTitle>Action Nodes</SecTitle>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
        {ACTION_ITEMS.map(a=>{
          const isActive=items.includes(a.id);
          const isExpanded=activeItem===a.id&&isActive;
          return(
            <div key={a.id} style={{border:`1.5px solid ${isActive?a.color:C.border}`,borderRadius:9,overflow:"hidden",background:C.white,boxShadow:C.shadow}}>
              <button onClick={()=>{ if(!isActive){toggleItem(a.id);}else{setActiveItem(activeItem===a.id?null:a.id);} }}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:isActive?a.color+"0D":"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:16,flexShrink:0}}>{a.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:isActive?a.color:C.textMid}}>{a.label}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>{a.desc}</div>
                </div>
                <div onClick={e=>{e.stopPropagation();if(isActive)toggleItem(a.id);}}
                  style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${isActive?a.color:C.border}`,background:isActive?a.color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white",flexShrink:0,cursor:"pointer"}}>
                  {isActive&&"✓"}
                </div>
              </button>
              {isActive&&(
                <div style={{padding:"8px 11px",borderTop:`1px solid ${a.color}33`,background:a.color+"06"}}>
                  <label style={{fontSize:10,fontWeight:600,color:a.color,display:"block",marginBottom:3}}>{a.logicLabel}</label>
                  <input value={remarks[a.id]||""} onChange={e=>setRemark(a.id,e.target.value)}
                    placeholder={a.logicPlaceholder}
                    style={{width:"100%",padding:"5px 9px",border:`1px solid ${a.color}55`,borderRadius:6,outline:"none",fontSize:11,color:C.text,background:"white",fontFamily:"inherit"}}/>
                  {remarks[a.id]&&<div style={{marginTop:4,fontSize:10,color:a.color,fontWeight:500}}>✓ Logic: {remarks[a.id]}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {items.includes("doc_ai")&&(
        <div style={{padding:12,background:C.purpleLight,border:`1px solid #DDD6FE`,borderRadius:10}}>
          <SecTitle>Document AI — Document Type</SecTitle>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {Object.entries(DOC_TYPES).map(([k,d])=>(
              <button key={k} onClick={()=>setDoc(k)}
                style={{padding:"4px 11px",borderRadius:20,border:`1.5px solid ${docType===k?d.color:C.border}`,background:docType===k?d.color+"18":C.white,fontSize:11,fontWeight:docType===k?600:400,color:docType===k?d.color:C.textMid,cursor:"pointer"}}>
                {d.short}
              </button>
            ))}
          </div>
          {docType&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:10,color:C.purple,fontWeight:600}}>Fields to extract ({docFields.length} selected)</span>
                <div style={{display:"flex",gap:6}}>
                  <button style={{fontSize:10,color:C.blue,background:"none",border:"none",cursor:"pointer",fontWeight:500}} onClick={()=>{setDocFields(DOC_TYPES[docType].fields);onChange({items,remarks,docType,docFields:DOC_TYPES[docType].fields});}}>All</button>
                  <button style={{fontSize:10,color:C.textMuted,background:"none",border:"none",cursor:"pointer"}} onClick={()=>{setDocFields([]);onChange({items,remarks,docType,docFields:[]});}}>Clear</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
                {DOC_TYPES[docType].fields.map(f=>(
                  <label key={f} onClick={()=>toggleField(f)} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,cursor:"pointer",color:docFields.includes(f)?DOC_TYPES[docType].color:C.textMuted,padding:"3px 0",userSelect:"none"}}>
                    <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${docFields.includes(f)?DOC_TYPES[docType].color:C.border}`,background:docFields.includes(f)?DOC_TYPES[docType].color:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {docFields.includes(f)&&<span style={{fontSize:8,color:"white",fontWeight:700}}>✓</span>}
                    </div>
                    {f}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RULE ITEM (separate component so useRef is legal) ───────────────────────
function RuleItem({rule:r,isOpen,onToggleOpen,onChangeLogic,onBlurLogic,onRemove}){
  const prevRef=useRef(r.logic||"");
  return(
    <div style={{border:`1.5px solid ${r.color}55`,borderRadius:9,overflow:"hidden",background:C.white,boxShadow:C.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:r.color+"08"}}>
        <span style={{fontSize:14}}>{RULE_TEMPLATES.find(x=>x.id===r.template)?.icon||"📐"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:r.color}}>{r.label}</div>
          {r.logic&&(
            <div style={{fontSize:10,color:C.textMuted,marginTop:3}}>
              {r.logic.split("\n").filter(Boolean).map((line,i)=>(
                <div key={i} style={{display:"flex",gap:5,marginTop:i>0?2:0}}>
                  <span style={{color:r.color,fontWeight:700,flexShrink:0,fontSize:9}}>{r.logic.includes("\n")?"•":""}</span>
                  <span style={{fontStyle:"italic"}}>{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onToggleOpen} style={{fontSize:10,padding:"2px 8px",borderRadius:5,border:`1px solid ${r.color}55`,color:r.color,background:r.color+"12",cursor:"pointer"}}>
          {isOpen?"▲ Hide":"✏ Edit logic"}
        </button>
        <button onClick={onRemove} style={{color:C.textLight,fontSize:16,background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      {isOpen&&(
        <div style={{padding:"8px 11px",borderTop:`1px solid ${r.color}33`}}>
          <label style={{fontSize:10,fontWeight:600,color:r.color,display:"block",marginBottom:3}}>Rule Logic / Condition</label>
          <textarea value={r.logic||""} onChange={e=>onChangeLogic(e.target.value)}
            onBlur={e=>{onBlurLogic(e.target.value,prevRef.current);prevRef.current=e.target.value;}}
            placeholder={RULE_TEMPLATES.find(x=>x.id===r.template)?.logicPlaceholder||"Describe the rule logic…"}
            rows={Math.max(2,(r.logic||"").split("\n").length+1)} style={{width:"100%",padding:"6px 9px",border:`1px solid ${r.color}55`,borderRadius:6,outline:"none",fontSize:11,color:C.text,background:"white",fontFamily:"inherit",resize:"vertical",lineHeight:1.6}}/>
        </div>
      )}
    </div>
  );
}

// ─── RULES PANEL ──────────────────────────────────────────────────────────────
function RulesPanel({config,onChange,inputMode,convoTexts,setConvoTexts}) {
  const [active,setActive]=useState(config.active||null); // selected template id
  const [items,setItems]=useState(config.items||[]);
  const [showLogicFor,setShowLogicFor]=useState(null);

  const applyNL=(p)=>{
    if(!p?.length)return;
    const merged=[...items];
    p.forEach(newR=>{
      const existing=merged.find(x=>x.template===newR.template);
      if(existing){
        const existingLines=existing.logic?existing.logic.split("\n").map(l=>l.replace(/^\d+\.\s*/,"").trim()).filter(Boolean):[];
        const newLines=newR.logic?newR.logic.split("\n").map(l=>l.replace(/^\d+\.\s*/,"").trim()).filter(Boolean):[];
        const allLines=[...existingLines,...newLines.filter(l=>!existingLines.some(e=>e.toLowerCase()===l.toLowerCase()))];
        existing.logic=allLines.length===1?allLines[0]:allLines.map((l,n)=>`${n+1}. ${l}`).join("\n");
      } else merged.push(newR);
    });
    setItems(merged);onChange({items:merged});
    addAuditEntry("Rules","Rules updated via conversational",p.map(r=>r.label).join(", "),"","");
  };

  const addTemplate=(t)=>{
    if(items.find(x=>x.template===t.id))return; // no duplicate
    const r={id:Date.now()+"_"+t.id,template:t.id,label:t.label,icon:t.icon,logic:"",color:t.color};
    const ni=[...items,r]; setItems(ni); onChange({items:ni}); setShowLogicFor(r.id);
    addAuditEntry("Rules","Rule added",t.label,"","");
  };
  const setLogic=(id,v)=>{
    const ni=items.map(r=>r.id===id?{...r,logic:v}:r); setItems(ni); onChange({items:ni});
  };
  const remove=(id)=>{
    const r=items.find(x=>x.id===id);
    const ni=items.filter(x=>x.id!==id); setItems(ni); onChange({items:ni});
    addAuditEntry("Rules","Rule removed",r?.label||id,"","");
  };
  const updateLogicBlur=(id,v,prev)=>{
    if(v!==prev)addAuditEntry("Rules","Rule logic updated",`${items.find(x=>x.id===id)?.label}: "${v}"`,prev,v);
  };

  return(
    <div className="fade-in">
      {inputMode==="conversational"&&<ConvoShell section="rules" onParsed={applyNL} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
      <SecTitle>Rule Types</SecTitle>
      {/* Same tile layout as Trigger */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginBottom:14}}>
        {RULE_TEMPLATES.map(t=>{
          const already=items.find(x=>x.template===t.id);
          return(
            <button key={t.id} onClick={()=>addTemplate(t)}
              style={{padding:"10px 8px",background:already?t.color+"12":C.white,border:`1.5px solid ${already?t.color:C.border}`,borderRadius:9,cursor:already?"default":"pointer",textAlign:"left",transition:"all .15s",boxShadow:C.shadow,display:"flex",alignItems:"flex-start",gap:8}}>
              <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:already?t.color:C.textMid}}>{t.label}</div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:1}}>{t.desc}</div>
                {already&&<div style={{fontSize:9,color:t.color,marginTop:2,fontWeight:500}}>✓ Added</div>}
              </div>
            </button>
          );
        })}
      </div>
      {/* Active rules with logic input */}
      {items.length>0&&(
        <div>
          <SecTitle>Configured Rules ({items.length})</SecTitle>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {items.map(r=>(
              <RuleItem key={r.id} rule={r}
                isOpen={showLogicFor===r.id}
                onToggleOpen={()=>setShowLogicFor(showLogicFor===r.id?null:r.id)}
                onChangeLogic={(v)=>setLogic(r.id,v)}
                onBlurLogic={(v,prev)=>updateLogicBlur(r.id,v,prev)}
                onRemove={()=>remove(r.id)}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MASTERS PANEL ────────────────────────────────────────────────────────────
function MastersPanel({config,onChange,inputMode,docType,convoTexts,setConvoTexts}) {
  const [items,setItems]=useState(config.items||[]);
  const [masterFields,setMasterFields]=useState(config.masterFields||{});
  const [activeMaster,setActiveMaster]=useState(null);
  const [imported,setImported]=useState(false);

  const applyNL=(p)=>{
    if(!p)return;
    const ni=[...new Set([...items,...(p.items||[])])];
    const nf={...masterFields,...(p.masterFields||{})};
    setItems(ni);setMasterFields(nf);onChange({items:ni,masterFields:nf});
    addAuditEntry("Masters","Updated via conversational",`Masters: ${ni.join(", ")}`,"","");
  };

  const toggleMaster=(k)=>{
    if(items.includes(k)){
      const ni=items.filter(x=>x!==k); setItems(ni); onChange({items:ni,masterFields});
      if(activeMaster===k)setActiveMaster(null);
      addAuditEntry("Masters","Master removed",MASTER_TYPES[k]?.label,"","");
    } else {
      const ni=[...items,k];
      const nf={...masterFields,[k]:MASTER_TYPES[k].fields.slice(0,4)};
      setItems(ni);setMasterFields(nf);setActiveMaster(k);onChange({items:ni,masterFields:nf});
      addAuditEntry("Masters","Master added",MASTER_TYPES[k]?.label,"","");
    }
  };
  const toggleField=(m,f)=>{
    const cur=masterFields[m]||[];
    const nf=cur.includes(f)?cur.filter(x=>x!==f):[...cur,f];
    const nm={...masterFields,[m]:nf}; setMasterFields(nm); onChange({items,masterFields:nm});
    addAuditEntry("Masters",cur.includes(f)?"Field deselected":"Field selected",`${MASTER_TYPES[m]?.label}: ${f}`,"","");
  };

  return(
    <div className="fade-in">
      {inputMode==="conversational"&&<ConvoShell section="masters" onParsed={applyNL} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <SecTitle style={{marginBottom:0}}>Master Types{docType?` — ${DOC_TYPES[docType]?.short}`:""}</SecTitle>
        <button onClick={()=>setImported(true)} style={{fontSize:10,padding:"3px 9px",borderRadius:5,border:`1px solid ${C.border}`,color:C.textMid,background:C.white,cursor:"pointer",fontWeight:500}}>↑ Import Excel</button>
      </div>
      {imported&&<div style={{marginBottom:10,padding:"6px 10px",background:C.accentLight,border:`1px solid ${C.accentMid}`,borderRadius:7,fontSize:11,color:C.accentB,fontWeight:500}}>✓ Excel parsed — 2 master tables imported (Vendor, Carrier)</div>}
      {/* Tile grid like Trigger */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginBottom:14}}>
        {Object.entries(MASTER_TYPES).map(([k,m])=>(
          <button key={k} onClick={()=>toggleMaster(k)}
            style={{padding:"10px 8px",background:items.includes(k)?C.accent+"12":C.white,border:`1.5px solid ${items.includes(k)?C.accent:C.border}`,borderRadius:9,cursor:"pointer",textAlign:"left",boxShadow:C.shadow,display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{fontSize:18,flexShrink:0}}>{m.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:items.includes(k)?C.accentB:C.textMid}}>{m.label}</div>
              <div style={{fontSize:10,color:C.textMuted,marginTop:1}}>{m.fields.length} parameters</div>
              {items.includes(k)&&<div style={{fontSize:9,color:C.accent,marginTop:2,fontWeight:500}}>✓ {(masterFields[k]||[]).length} field(s) selected</div>}
            </div>
          </button>
        ))}
      </div>
      {/* Expanded field selector for selected masters */}
      {items.map(k=>(
        <div key={k} style={{border:`1.5px solid ${C.accent}55`,borderRadius:9,overflow:"hidden",background:C.white,marginBottom:8,boxShadow:C.shadow}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:C.accentLight,cursor:"pointer"}} onClick={()=>setActiveMaster(activeMaster===k?null:k)}>
            <span style={{fontSize:14}}>{MASTER_TYPES[k]?.icon}</span>
            <span style={{fontSize:12,fontWeight:600,color:C.accentB,flex:1}}>{MASTER_TYPES[k]?.label}</span>
            <span style={{fontSize:10,color:C.textMuted}}>{(masterFields[k]||[]).length}/{MASTER_TYPES[k]?.fields.length} fields</span>
            <span style={{fontSize:10,color:C.textMuted}}>{activeMaster===k?"▲":"▼"}</span>
          </div>
          {activeMaster===k&&(
            <div style={{padding:"8px 11px",borderTop:`1px solid ${C.accentMid}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:10,color:C.textMuted}}>Select / deselect fields for this master</span>
                <div style={{display:"flex",gap:6}}>
                  <button style={{fontSize:9,color:C.blue,background:"none",border:"none",cursor:"pointer"}} onClick={()=>{const nf={...masterFields,[k]:MASTER_TYPES[k].fields};setMasterFields(nf);onChange({items,masterFields:nf});}}>All</button>
                  <button style={{fontSize:9,color:C.textMuted,background:"none",border:"none",cursor:"pointer"}} onClick={()=>{const nf={...masterFields,[k]:[]};setMasterFields(nf);onChange({items,masterFields:nf});}}>None</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
                {MASTER_TYPES[k].fields.map(f=>{
                  const checked=(masterFields[k]||[]).includes(f);
                  return(
                    <label key={f} onClick={()=>toggleField(k,f)} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,cursor:"pointer",color:checked?C.accentB:C.textMuted,padding:"3px 0",userSelect:"none"}}>
                      <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${checked?C.accent:C.border}`,background:checked?C.accent:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {checked&&<span style={{fontSize:8,color:"white",fontWeight:700}}>✓</span>}
                      </div>
                      {f}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── OUTPUT PANEL ─────────────────────────────────────────────────────────────
function OutputPanel({config,onChange,inputMode,convoTexts,setConvoTexts,showErrors}) {
  const [type,setType]=useState(config.type||null);
  const [fields,setFields]=useState(config.fields||{});
  const REQUIRED_OUT={api:["Endpoint URL","API Key / Token"],webhook:["Webhook URL"],email:["To Email"],ftp:["Host","Username","Password"],erp:["ERP URL","Auth Token"]};

  const applyNL=(p)=>{
    if(!p)return;
    const t=p.type||type;
    const flds={...fields,...(p.fields||{})};
    // ensure the URL lands in the right field for the detected type
    if(p.type==="webhook"&&(p.fields?.["Endpoint URL"]||p.fields?.["ERP URL"])){
      const anyUrl=p.fields["Endpoint URL"]||p.fields["ERP URL"];
      if(anyUrl&&!flds["Webhook URL"])flds["Webhook URL"]=anyUrl;
    }
    setType(t);setFields(flds);onChange({type:t,fields:flds});
    addAuditEntry("Output","Updated via conversational",`Type: ${t}, URL: ${flds["Endpoint URL"]||flds["Webhook URL"]||flds["ERP URL"]||""}`,config.type||"none",t||"");
  };
  const setOut=(k)=>{setType(k);setFields({});onChange({type:k,fields:{}});addAuditEntry("Output","Type changed",OUTPUT_LABELS[k]||k,type||"none",k);};
  const setField=(k,v)=>{const nf={...fields,[k]:v};setFields(nf);onChange({type,fields:nf});addAuditEntry("Output","Field updated",`${k} = "${v}"`,fields[k]||"",v);};

  const reqFields=type?REQUIRED_OUT[type]||[]:[];

  return(
    <div className="fade-in">
      {inputMode==="conversational"&&<ConvoShell section="output" onParsed={applyNL} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
      <SecTitle>Delivery Method</SecTitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
        {Object.entries(OUTPUT_TYPES).map(([k,o])=>(
          <button key={k} onClick={()=>setOut(k)}
            style={{padding:"10px 4px",background:type===k?o.color+"12":C.white,border:`1.5px solid ${type===k?o.color:C.border}`,borderRadius:9,cursor:"pointer",color:type===k?o.color:C.textMuted,textAlign:"center",transition:"all .15s",boxShadow:C.shadow}}>
            <div style={{fontSize:20,marginBottom:3}}>{o.icon}</div>
            <div style={{fontSize:10,fontWeight:600}}>{o.label}</div>
          </button>
        ))}
      </div>
      {type&&(
        <div>
          <SecTitle>Delivery Details</SecTitle>
          {OUTPUT_TYPES[type].fields.map(f=>(
            <Field key={f} label={f} value={fields[f]} onChange={v=>setField(f,v)}
              required={reqFields.includes(f)} error={showErrors}/>
          ))}
          {type&&Object.keys(fields).some(k=>fields[k])&&(
            <div style={{marginTop:8,padding:"7px 12px",background:C.accentLight,border:`1px solid ${C.accentMid}`,borderRadius:8,fontSize:11,color:C.accentB,fontWeight:500}}>
              ✓ {OUTPUT_LABELS[type]}{fields["Endpoint URL"]||fields["Webhook URL"]?` — ${fields["Endpoint URL"]||fields["Webhook URL"]}`:fields["To Email"]?` — ${fields["To Email"]}`:""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ALERTS PANEL ────────────────────────────────────────────────────────────
function AlertsPanel({config,onChange,convoTexts,setConvoTexts}) {
  const [slack,setSlack]=useState(config.slack||{webhook:"",channel:"",events:[]});
  const [emailAlert,setEmailAlert]=useState(config.email||{to:"",events:[]});
  const EVENTS=["failure","timeout","success","warning","critical","master_missing","duplicate"];

  const applyNL=(p)=>{
    if(!p)return;
    if(p.slack){const ns={...slack,...p.slack};setSlack(ns);onChange({slack:ns,email:emailAlert});addAuditEntry("Alerts","Slack configured",ns.webhook,"","");}
    if(p.email){const ne={...emailAlert,...p.email};setEmailAlert(ne);onChange({slack,email:ne});addAuditEntry("Alerts","Email alert configured",ne.to,"","");}
  };
  const updSlack=(k,v)=>{const ns={...slack,[k]:v};setSlack(ns);onChange({slack:ns,email:emailAlert});addAuditEntry("Alerts","Slack updated",`${k}=${v}`,slack[k]||"",v);};
  const updEmail=(k,v)=>{const ne={...emailAlert,[k]:v};setEmailAlert(ne);onChange({slack,email:ne});};
  const toggleEvt=(ch,e)=>{
    if(ch==="slack"){const cur=slack.events||[];const ne=cur.includes(e)?cur.filter(x=>x!==e):[...cur,e];updSlack("events",ne);}
    else{const cur=emailAlert.events||[];const ne=cur.includes(e)?cur.filter(x=>x!==e):[...cur,e];updEmail("events",ne);}
  };

  return(
    <div className="fade-in">
      <ConvoShell section="alerts" onParsed={applyNL} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          {key:"slack",icon:"💜",label:"Slack Alerts",configured:!!slack.webhook,flds:[{l:"Webhook URL",k:"webhook",ph:"https://hooks.slack.com/services/…"},{l:"Channel",k:"channel",ph:"#logistics-alerts"}],state:slack,upd:updSlack},
          {key:"email",icon:"✉",label:"Email Alerts",configured:!!emailAlert.to,flds:[{l:"To Email",k:"to",ph:"ops@company.com"}],state:emailAlert,upd:updEmail},
        ].map(({key,icon,label,configured,flds,state,upd})=>(
          <div key={key} style={{background:C.white,border:`1.5px solid ${configured?C.accent:C.border}`,borderRadius:10,overflow:"hidden",boxShadow:C.shadow}}>
            <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8,background:C.panelB}}>
              <span style={{fontSize:16}}>{icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:C.textMid}}>{label}</span>
              {configured&&<span style={{marginLeft:"auto",fontSize:10,padding:"1px 7px",borderRadius:10,background:C.accentLight,color:C.accentB,fontWeight:500}}>Configured</span>}
            </div>
            <div style={{padding:12}}>
              {flds.map(({l,k,ph})=><Field key={k} label={l} value={state[k]} onChange={v=>upd(k,v)} placeholder={ph}/>)}
              <label style={{display:"block",fontSize:11,fontWeight:500,color:C.textMid,marginBottom:5}}>Notify on</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {EVENTS.map(e=>(
                  <button key={e} onClick={()=>toggleEvt(key,e)}
                    style={{fontSize:10,padding:"3px 9px",borderRadius:20,border:`1px solid ${(state.events||[]).includes(e)?C.accent:C.border}`,background:(state.events||[]).includes(e)?C.accentLight:"transparent",color:(state.events||[]).includes(e)?C.accentB:C.textMuted,cursor:"pointer",fontWeight:(state.events||[]).includes(e)?500:400}}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AUDIT LOGS PANEL ─────────────────────────────────────────────────────────
function LogsPanel() {
  const log=useAuditLog();
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const SECTIONS=["All","Trigger","Actions","Rules","Masters","Output","Alerts"];
  const sectionColor={Trigger:C.blue,Actions:C.accent,Rules:C.red,Masters:C.amber,Output:C.purple,Alerts:"#7C3AED"};

  const filtered=log.filter(l=>(filter==="All"||l.section===filter)&&(search===""||l.detail.toLowerCase().includes(search.toLowerCase())||l.action.toLowerCase().includes(search.toLowerCase())));

  return(
    <div className="fade-in">
      <div style={{marginBottom:10,padding:"8px 12px",background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:8,fontSize:11,color:C.blue}}>
        📋 Change log — every configuration edit is recorded here automatically
      </div>
      <div style={{display:"flex",gap:5,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
        {SECTIONS.map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{fontSize:10,padding:"3px 9px",borderRadius:20,border:`1px solid ${filter===s?(sectionColor[s]||C.blue):C.border}`,background:filter===s?(sectionColor[s]||C.blue)+"18":"transparent",color:filter===s?(sectionColor[s]||C.blue):C.textMuted,cursor:"pointer",fontWeight:filter===s?600:400}}>
            {s}
          </button>
        ))}
        <input placeholder="Search changes…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{marginLeft:"auto",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",color:C.text,fontSize:11,outline:"none",width:160,background:C.white}}/>
      </div>
      {filtered.length===0?(
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:32,textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:8}}>📋</div>
          <div style={{fontSize:12,color:C.textMuted}}>No changes recorded yet.</div>
          <div style={{fontSize:11,color:C.textLight,marginTop:4}}>Changes appear here when you configure the workflow.</div>
        </div>
      ):(
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden",boxShadow:C.shadow}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`,background:C.panelB}}>
                {["Time","Section","Action","Detail","Changed by"].map(h=>(
                  <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:9,fontWeight:700,color:C.textLight,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l,i)=>(
                <tr key={l.id} style={{borderBottom:i<filtered.length-1?`1px solid ${C.border}`:""}} >
                  <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:10,color:C.textMuted,whiteSpace:"nowrap"}}>{l.ts}</td>
                  <td style={{padding:"7px 10px"}}>
                    <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:(sectionColor[l.section]||C.blue)+"18",color:sectionColor[l.section]||C.blue,fontWeight:600}}>{l.section}</span>
                  </td>
                  <td style={{padding:"7px 10px",fontSize:11,color:C.textMid,fontWeight:500}}>{l.action}</td>
                  <td style={{padding:"7px 10px",fontSize:11,color:C.textMuted,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={l.detail}>{l.detail}</td>
                  <td style={{padding:"7px 10px",fontSize:10,color:C.textLight,fontFamily:"monospace"}}>{l.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function resolveLAT(rulesConfig) {
  const allLogic=(rulesConfig?.items||[]).map(r=>r.logic||"").join(" ");
  const match=allLogic.match(/\b([TD])([1-7])\b/i);
  if(!match)return null;
  const dayIndex=parseInt(match[2],10);
  const dayNames=["","Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dateMatch=allLogic.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})|(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/);
  let anchor=new Date();
  if(dateMatch){const parsed=new Date(dateMatch[0].replace(/\//g,"-"));if(!isNaN(parsed))anchor=parsed;}
  const anchorISO=anchor.getDay()===0?7:anchor.getDay();
  const monday=new Date(anchor);monday.setDate(anchor.getDate()-(anchorISO-1));
  const target=new Date(monday);target.setDate(monday.getDate()+(dayIndex-1));
  const dd=String(target.getDate()).padStart(2,"0"),mm=String(target.getMonth()+1).padStart(2,"0"),yyyy=target.getFullYear();
  const hh=String(anchor.getHours()).padStart(2,"0"),min=String(anchor.getMinutes()).padStart(2,"0");
  return {raw:match[0].toUpperCase(),dayName:dayNames[dayIndex],date:`${dd}-${mm}-${yyyy}`,display:`${dayNames[dayIndex]} ${dd}-${mm}-${yyyy} ${hh}:${min}`,mapped:`${match[0].toUpperCase()} → ${dayNames[dayIndex]} (${dd}/${mm}/${yyyy})`};
}

// ─── FLOWCHART ────────────────────────────────────────────────────────────────
function FlowChart({wfConfig,onEditNode}) {
  const trig=wfConfig.trigger||{}, acts=wfConfig.actions||{}, rules=wfConfig.rules||{}, masters=wfConfig.masters||{}, outs=wfConfig.output||{}, alerts=wfConfig.alerts||{};
  const hasT=!!trig.type, hasA=acts.items?.length>0||!!acts.docType, hasR=rules.items?.length>0, hasM=masters.items?.length>0, hasO=!!outs.type;
  const trigLabel=hasT?TRIGGER_TYPES[trig.type]?.label:"Not set";
  const emailId=trig.fields?.["Email ID"]||"";
  const docLabel=acts.docType?DOC_TYPES[acts.docType]?.label:"—";
  const docShort=acts.docType?DOC_TYPES[acts.docType]?.short:"DOC";
  const docColor=acts.docType?DOC_TYPES[acts.docType]?.color:C.purple;
  const selFields=acts.docFields||[];
  const masterList=masters.items||[];
  const ruleList=rules.items||[];
  // Dynamic output label
  const outMethodLabel=outs.type?`Push to ${OUTPUT_LABELS[outs.type]||outs.type}`:"Push to ERP";
  const outDetail=outs.fields?.["Endpoint URL"]||outs.fields?.["Webhook URL"]||outs.fields?.["To Email"]||outs.fields?.["ERP URL"]||"";

  const CW=196, GAP=60;
  const xs=[20, 20+CW+GAP, 20+2*(CW+GAP), 20+3*(CW+GAP), 20+4*(CW+GAP)];
  const heights=[240,210,250,260,200];
  const ys=[28,38,24,24,28];

  function mid(i){return ys[i]+heights[i]/2;}
  function Connector({i,configured}){
    const x1=xs[i]+CW, y1=mid(i), x2=xs[i+1], y2=mid(i+1);
    const mx=(x1+x2)/2;
    const col=configured?C.blue:"#C8D5EC";
    return <g><path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke={col} strokeWidth={configured?2.2:1.5} markerEnd={`url(#arr-${configured?"g":"gr"})`}/><circle cx={x1} cy={y1} r={5} fill="white" stroke={col} strokeWidth={1.8}/><circle cx={x2} cy={y2} r={5} fill="white" stroke={col} strokeWidth={1.8}/></g>;
  }
  function NodeCard({idx,title,subtitle,color,icon,children,configured,onClick,settingsUrl}){
    const x=xs[idx], y=ys[idx], w=CW, h=heights[idx];
    return(
      <foreignObject x={x} y={y} width={w} height={h}>
        <div xmlns="http://www.w3.org/1999/xhtml"
          style={{cursor:"default",background:"#FFFFFF",border:"1.5px solid #D8E2F0",borderRadius:14,height:"100%",overflow:"hidden",boxShadow:"0 2px 12px rgba(27,79,216,.10),0 1px 3px rgba(27,79,216,.06)",fontFamily:"Inter,sans-serif",fontSize:12,userSelect:"none"}}>
          <div style={{padding:"8px 10px",borderBottom:"1px solid #EEF2FA",background:"#FFFFFF",display:"flex",alignItems:"center",gap:6}}>
            <button title="Settings" onClick={e=>{e.stopPropagation();const a=document.createElement("a");a.href=settingsUrl;a.target="_blank";a.rel="noopener noreferrer";document.body.appendChild(a);a.click();document.body.removeChild(a);}} style={{width:17,height:17,borderRadius:4,border:"1px solid #D8E2F0",background:"#F4F7FC",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:9,color:"#8498C0",padding:0,lineHeight:1}}>⚙</button>
            <div style={{width:22,height:22,borderRadius:6,background:"#E6ECFB",border:"1px solid #B8C8F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{icon}</div>
            <div style={{flex:1,minWidth:0,cursor:onClick?"pointer":"default"}} onClick={onClick}>
              <div style={{fontSize:11,fontWeight:700,color:"#0A1A3D",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
              <div style={{fontSize:8,color:"#8498C0",textTransform:"uppercase",letterSpacing:".07em",fontWeight:600}}>{subtitle}</div>
            </div>
            <span style={{color:"#B8C8F5",fontSize:10,letterSpacing:"1px",flexShrink:0,lineHeight:1}}>⋮⋮</span>
            <div style={{width:8,height:8,borderRadius:"50%",background:configured?"#3DAA3B":"#D8E2F0",flexShrink:0,boxShadow:configured?"0 0 0 2.5px #B2E0B166":"none"}}/>
          </div>
          <div style={{padding:"8px 10px"}}>{children}</div>
        </div>
      </foreignObject>
    );
  }
  function Row({label,value,color}){return(<div style={{marginBottom:5}}><div style={{fontSize:8,fontWeight:600,textTransform:"uppercase",letterSpacing:".04em",color:C.textLight}}>{label}</div><div style={{fontSize:10,fontWeight:600,color:color||C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||<span style={{color:C.textLight,fontWeight:400}}>—</span>}</div></div>);}
  function FieldPill({label,selected=true}){return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:600,marginRight:4,marginBottom:4,background:selected?C.accent:"transparent",color:selected?"#FFFFFF":C.textLight,border:`1.5px solid ${selected?C.accent:C.border}`,lineHeight:1.6}}>{label}</span>;}

  const latInfo=acts.docType==="awb"?resolveLAT(rules):null;
  const latDisplay=latInfo?latInfo.display:(()=>{const n=new Date();const d=String(n.getDate()).padStart(2,"0"),m=String(n.getMonth()+1).padStart(2,"0"),y=n.getFullYear(),h=String(n.getHours()).padStart(2,"0"),mi=String(n.getMinutes()).padStart(2,"0");return `${d}-${m}-${y} ${h}:${mi}`;})();
  const settingsUrl=acts.docType==="awb"?"https://www.intemo.tech/PouchMAWB/settings/":"https://www.intemo.tech/blautomation/settings";
  const totalW=xs[4]+CW+20, totalH=400;
  return(
    <div style={{overflowX:"auto",overflowY:"auto",flex:1,minHeight:0,borderRadius:12,border:"1px solid #D8E2F0",background:"#EEF2FA",backgroundImage:"radial-gradient(circle,#C8D5EC 1px,transparent 1px)",backgroundSize:"22px 22px"}}>
      <svg width={totalW} height={totalH} style={{display:"block",minWidth:totalW,overflow:"visible"}}>
        <defs>
          <marker id="arr-g" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><polygon points="0 0,10 5,0 10" fill="#1B4FD8"/></marker>
          <marker id="arr-gr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><polygon points="0 0,10 5,0 10" fill="#C8D5EC"/></marker>
        </defs>
        <Connector i={0} configured={hasT&&hasA}/>
        <Connector i={1} configured={hasA&&(hasR||hasM)}/>
        <Connector i={2} configured={hasM}/>
        <Connector i={3} configured={hasO}/>

        {/* Node 1 — Trigger */}
        <NodeCard idx={0} title={trigLabel} subtitle="Trigger" color={C.blue} icon="✉" configured={hasT} onClick={()=>onEditNode("trigger")} settingsUrl={settingsUrl}>
          <div style={{marginBottom:7}}>
            <div style={{fontSize:8,fontWeight:700,color:C.textLight,textTransform:"uppercase",marginBottom:4}}>Source</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {trig.type==="email"?Object.entries(TRIGGER_TYPES.email.providers).map(([k,p])=>(
                <span key={k} style={{padding:"3px 8px",borderRadius:20,fontSize:9,fontWeight:600,border:`1.5px solid ${trig.provider===k?C.blue:C.border}`,background:trig.provider===k?C.blueLight:"white",color:trig.provider===k?C.blue:C.textLight}}>{p.label.split("/")[0].trim()}</span>
              )):<span style={{fontSize:10,color:C.textLight}}>{hasT?trigLabel:"Select a trigger →"}</span>}
            </div>
          </div>
          {emailId&&<Row label="Email ID" value={emailId}/>}
          <div style={{marginTop:6,padding:"4px 7px",background:hasT&&hasA?C.accentLight:"#F9FAFB",border:`1px solid ${hasT&&hasA?C.accentMid:C.border}`,borderRadius:6,display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10}}>📄</span>
            <span style={{fontSize:10,flex:1,color:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{acts.docType?`${docShort}_document.pdf`:"Awaiting email…"}</span>
            {hasT&&hasA&&<span style={{fontSize:8,fontWeight:700,color:C.accentB,background:C.accentLight,padding:"1px 5px",borderRadius:10,border:`1px solid ${C.accentMid}`}}>MATCHED</span>}
          </div>
        </NodeCard>

        {/* Node 2 — Document Reader */}
        <NodeCard idx={1} title="Document Reader" subtitle="Action" color={C.accent} icon="📄" configured={hasA} onClick={()=>onEditNode("actions")} settingsUrl={settingsUrl}>
          <div style={{marginBottom:6}}>
            <div style={{fontSize:8,fontWeight:700,color:C.textLight,textTransform:"uppercase",marginBottom:4}}>File Type</div>
            <div style={{display:"flex",gap:4}}>
              {["PDF","Excel","XML"].map(ft=><span key={ft} style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:600,border:`1.5px solid ${ft==="PDF"&&hasA?C.accent:C.border}`,background:ft==="PDF"&&hasA?C.accentLight:"white",color:ft==="PDF"&&hasA?C.accentB:C.textLight}}>{ft==="PDF"?"📄":ft==="Excel"?"📊":"📋"} {ft}</span>)}
            </div>
          </div>
          {hasA&&acts.docType?(
            <div style={{padding:"6px 8px",background:C.accentLight,border:`1px solid ${C.accentMid}`,borderRadius:7}}>
              <div style={{fontSize:9,color:C.accentB,fontWeight:600,marginBottom:2}}>{docLabel}</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{flex:1,height:4,background:C.accentMid,borderRadius:2}}><div style={{height:"100%",width:`${Math.round((selFields.length/(DOC_TYPES[acts.docType]?.fields.length||1))*100)||50}%`,background:C.accent,borderRadius:2}}/></div>
                <span style={{fontSize:9,color:C.accentB}}>Parsed · {selFields.length||"—"} fields</span>
              </div>
            </div>
          ):<div style={{padding:"6px 8px",background:"#F9FAFB",border:`1px solid ${C.border}`,borderRadius:7,fontSize:10,color:C.textLight}}>Configure actions</div>}
        </NodeCard>

        {/* Node 3 — Extract Fields */}
        <NodeCard idx={2} title="Extract Fields" subtitle="AI Agent" color={docColor} icon="✨" configured={hasA&&!!acts.docType} onClick={()=>onEditNode("actions")} settingsUrl={settingsUrl}>
          {acts.docType?(
            <>
              <div style={{fontSize:8,fontWeight:700,color:docColor,textTransform:"uppercase",marginBottom:5}}>Reading {docShort}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 8px"}}>
                {(selFields.length>0?selFields:DOC_TYPES[acts.docType]?.fields||[]).slice(0,8).map(f=>(
                  <Row key={f} label={f} value={
                    acts.docType==="awb"?(
                      f==="AWB Number"?"176-85821934":f==="Airline Code"?"176":f==="Airline Name"?"Emirates":f==="Vendor Name"?"GEODIS FREIGHT":f==="Flight #"?"EK-607":f==="Date"?"16-Sep-2026":f==="Origin"?"BOM — Chhatrapati Shivaji Intl":f==="Destination"?"DXB — Dubai International":f==="Product Description"?"TEXTILE GOODS":f==="Weight (kg)"?"1,840 KG":f==="Volume (cbm)"?"12 CBM":f==="Freight Amount"?"USD 3,200":f==="Currency"?"USD":f==="LAT"?latDisplay:f==="Pickup"?"14-09-2026":f==="Delivery Point"?"DXB Cargo Terminal 2":f==="SCI"?"SCI-00412":f==="ULD"?"AKE-12345-EK":"—"
                    ):(
                      ["BL Number","AWB Number","Invoice Number","SI Number"].includes(f)?"BK-552187":
                      ["Shipper Name","Shipper","Vendor Name"].includes(f)?"ASTRA EXPORTS":
                      ["Consignee Name","Consignee","Customer Name"].includes(f)?"VANDER B.V.":
                      ["Port of Loading"].includes(f)?"NHAVA SHEVA":
                      ["Port of Discharge"].includes(f)?"ROTTERDAM":
                      f.includes("Date")?"16-Sep-2026":f.includes("Weight")?"2,450 KG":f.includes("Amount")||f.includes("Total")?"USD 4,200":"—"
                    )
                  }/>
                ))}
              </div>
            </>
          ):<div style={{color:C.textLight,fontSize:11}}>Select document type in Actions</div>}
        </NodeCard>

        {/* Node 4 — Validation / Masters */}
        <NodeCard idx={3} title="Validation Rules" subtitle="Logic" color={C.amber} icon="🛡" configured={hasR||hasM} onClick={()=>onEditNode("rules")} settingsUrl={settingsUrl}>
          {(hasR||hasM)?(
            <>
              {hasM&&masterList.slice(0,2).map(mk=>(
                <div key={mk} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 6px",background:"#FFFBEB",border:`1px solid ${C.amberLight}`,borderRadius:6,marginBottom:4}}>
                  <span style={{fontSize:10}}>{MASTER_TYPES[mk]?.icon}</span>
                  <span style={{fontSize:10,fontWeight:500,color:C.textMid,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{MASTER_TYPES[mk]?.label}</span>
                  <span style={{color:C.accent,fontSize:11,fontWeight:700}}>✓</span>
                </div>
              ))}
              {ruleList.slice(0,3).map(r=>(
                <div key={r.id} style={{display:"flex",alignItems:"flex-start",gap:4,padding:"2px 0",fontSize:10}}>
                  <span style={{color:C.accent,fontWeight:700,flexShrink:0}}>✓</span>
                  <span style={{color:C.textMid}}>{r.label}{r.logic?`: ${r.logic.slice(0,40)}${r.logic.length>40?"…":""}`:""}</span>
                </div>
              ))}
              {acts.docType==="awb"&&latInfo&&<div style={{marginTop:5,padding:"4px 7px",background:"#FFF7ED",border:`1px solid ${C.amberMid}`,borderRadius:6,fontSize:9}}><div style={{fontWeight:700,color:C.amber,marginBottom:1}}>LAT Mapping</div><div style={{color:C.textMid}}>{latInfo.mapped}</div><div style={{color:C.textMuted,marginTop:1}}>Resolved: {latInfo.display}</div></div>}
            </>
          ):<div style={{color:C.textLight,fontSize:11}}>Configure rules &amp; masters</div>}
        </NodeCard>

        {/* Node 5 — Output (dynamic label) */}
        <NodeCard idx={4} title={outMethodLabel} subtitle="Output" color={C.accent} icon={OUTPUT_TYPES[outs.type]?.icon||"🏢"} configured={hasO} onClick={()=>onEditNode("output")} settingsUrl={settingsUrl}>
          {hasO?(
            <>
              <div style={{fontSize:8,fontWeight:700,color:C.accent,textTransform:"uppercase",marginBottom:5}}>{OUTPUT_LABELS[outs.type]||"Delivery"} · {docShort}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 8px",marginBottom:6}}>
                {(acts.docType==="awb"?[["AWB #","176-85821934"],["ORIGIN","BOM"],["DEST","DXB"],["AIRLINE","Emirates / 176"]]:[["BOOKING #","BK-552187"],["POL","NHAVA SHEVA"],["CONSIGNEE","VANDER B.V."],["DELIVERY",masters.items?.includes("carrier")?"RHN-014":"—"]]).map(([l,v])=>(
                  <Row key={l} label={l} value={v}/>
                ))}
              </div>
              {outDetail&&<div style={{fontSize:9,color:C.textMuted,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{outDetail}</div>}
              <div style={{padding:"5px 10px",background:C.accent,borderRadius:8,textAlign:"center",fontSize:11,fontWeight:700,color:"white"}}>✓ {outMethodLabel.replace("Push to","Pushed to")}</div>
            </>
          ):<div style={{color:C.textLight,fontSize:11}}>Configure output delivery</div>}
          {alerts?.slack?.webhook&&<div style={{marginTop:6,padding:"3px 7px",background:C.purpleLight,border:`1px solid #DDD6FE`,borderRadius:5,fontSize:9,color:C.purple,fontWeight:500}}>💜 Slack alerts on</div>}
        </NodeCard>
      </svg>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function genEntries(){
  const stateBlocks={
    awb:[
      ...[...Array(14)].map((_,i)=>({status:"Completed",current:"ERP Entry Confirmed",erp:`JB-2024-${8821-i*2}`,from:["ops@maersk.com","freight@fedex.com","air@lufthansa.com","cargo@ek.com","ops@ups.com","air@qatar.com","cargo@sq.com","ops@dhl.com","freight@aa.com","cargo@cl.com","ops@sg.com","air@etihad.com","ftp://sftp.dhl.com","api-fedex"][i],error:null})),
      ...[...Array(6)].map((_,i)=>({status:"In Progress",current:["Document AI Processing","Masters Mapping","Rules Applied","Output Generation","Email Read","Data Extracted"][i],erp:null,from:["cargo@klm.com","api-inbound","ftp://sftp.ups.com","ops@air.com","freight@delta.com","webhook-air"][i],error:null})),
      ...[...Array(8)].map((_,i)=>({status:"Did not complete",current:["Masters Mapping Failed","Document AI Failed","Rules Applied","ERP Delivery Failed","Masters Mapping Failed","Attachment Check","Document AI Failed","Rules Applied"][i],erp:null,from:["cargo@sq.com","air@tg.com","ops@nh.com","api-inbound","cargo@gf.com","admin@air.com","freight@sa.com","ftp://sftp.air.com"][i],error:["Carrier 'SQ CARGO' not found in Carrier Master","Unsupported attachment: .tiff","AWB Number field empty","ERP API timeout after 3 retries","Airline code 'GF' not in Carrier Master","No attachment found","File exceeds 10MB (12.4MB)","Weight field missing"][i]})),
    ],
    bl:[
      ...[...Array(14)].map((_,i)=>({status:"Completed",current:"ERP Entry Confirmed",erp:`JB-2024-${8820-i*2}`,from:["export@maersk.com","export@msc.com","docs@hapag.com","export@cosco.com","docs@evergreen.com","api-msc","docs@one.com","export@cma.com","ftp://sftp.oocl.com","webhook-maersk","docs@yang.com","export@wan.com","docs@sm.com","api-hapag"][i],error:null})),
      ...[...Array(6)].map((_,i)=>({status:"In Progress",current:["Document AI Processing","Masters Mapping","Rules Applied","Data Extracted","ERP Delivery","Email Read"][i],erp:null,from:["docs@zim.com","export@pil.com","webhook-cosco","ftp://sftp.cma.com","api-evergreen","docs@matson.com"][i],error:null})),
      ...[...Array(8)].map((_,i)=>({status:"Did not complete",current:["Masters Mapping Failed","Rules Applied","Document AI Failed","ERP Delivery Failed","Masters Mapping Failed","Rules Applied","Attachment Check","Masters Mapping Failed"][i],erp:null,from:["export@nyk.com","docs@mol.com","export@k.com","docs@maersk.com","api-cosco","export@one.com","docs@hpg.com","export@wh.com"][i],error:["Job not linked to BL","BL Number blank","Scanned image too low DPI","Duplicate BL MAEU1234567","Port CNSHA not in Port Master","Consignee address missing","PDF corrupt","Carrier 'WAN HAI' not in Master"][i]})),
    ],
    invoice:[
      ...[...Array(14)].map((_,i)=>({status:"Completed",current:"ERP Entry Confirmed",erp:[...Array(7)].flatMap((_,j)=>[`PRQ-${44831-j*2}`,`CRJ-${10021-j*2}`])[i],from:["billing@kuehne.com","ap@dhl.com","billing@ceva.com","ap@panalpina.com","billing@expeditors.com","ap@agility.com","billing@schenker.com","invoice@geodis.com","billing@sinotrans.com","ap@toll.com","api-billing","ftp://billing.com","billing@fedex.com","ap@ups.com"][i],error:null})),
      ...[...Array(6)].map((_,i)=>({status:"In Progress",current:["Document AI Processing","Rules Applied","Masters Mapping","ERP Delivery","Data Extracted","Email Read"][i],erp:null,from:["billing@rhenus.com","ap@kuehne.com","invoice@db.com","api-invoice","billing@bollore.com","ap@trans.com"][i],error:null})),
      ...[...Array(8)].map((_,i)=>({status:"Did not complete",current:["Masters Mapping Failed","Rules Applied","ERP Delivery Failed","Masters Mapping Failed","Rules Applied","Document AI Failed","ERP Delivery Failed","Masters Mapping Failed"][i],erp:null,from:["billing@apex.com","billing@fast.com","ap@dup.com","billing@india.com","ap@blank.com","billing@secure.com","api-billing","billing@charge.com"][i],error:["Vendor 'APEX FREIGHT' not in Vendor Master","Total mismatch $12,543 ≠ $12,565","Invoice INV-9876 already booked","Tax code 'IGST18' not in Tax Master","Invoice Number empty","Password-protected PDF","ERP API timeout","Charge 'DTHC' not in Charge Master"][i]})),
    ],
    si:[
      ...[...Array(14)].map((_,i)=>({status:"Completed",current:"ERP Entry Confirmed",erp:`JB-2024-${8790-i*2}`,from:["ops@evergreen.com","si@maersk.com","ops@msc.com","si@hapag.com","ops@cma.com","si@yang.com","api-si","ftp://sftp.si.com","si@cosco.com","ops@wanhai.com","webhook-si","si@oocl.com","ops@one.com","si@zim.com"][i],error:null})),
      ...[...Array(6)].map((_,i)=>({status:"In Progress",current:["Document AI Processing","Masters Mapping","Rules Applied","Email Read","Data Extracted","Output Generation"][i],erp:null,from:["si@pil.com","ops@sinolines.com","si@sm.com","ops@kmtc.com","si@matson.com","api-si-2"][i],error:null})),
      ...[...Array(8)].map((_,i)=>({status:"Did not complete",current:["Masters Mapping Failed","Rules Applied","Document AI Failed","ERP Delivery Failed","Masters Mapping Failed","Attachment Check","Rules Applied","Masters Mapping Failed"][i],erp:null,from:["si@port.com","ops@reefer.com","si@custom.com","api-si-3","si@inc.com","ops@nofile.com","si@empty.com","si@pil2.com"][i],error:["Port SGSIN not in Port Master","Container '40RF' not in list","SI layout unrecognized","ERP: Vessel voyage not found","Notify party address missing","No SI attached","Cargo description empty","Carrier 'PIL' not in Master"][i]})),
    ],
    pod:[
      ...[...Array(14)].map((_,i)=>({status:"Completed",current:"ERP Entry Confirmed",erp:`JB-2024-${8760-i*2}`,from:["delivery@dhl.com","pod@fedex.com","delivery@ups.com","pod@aramex.com","delivery@bluedart.com","ftp://sftp.pod.com","pod@ekart.com","delivery@xpress.com","pod@shadow.com","api-pod","delivery@delhivery.com","pod@borzo.com","delivery@ship.com","webhook-pod"][i],error:null})),
      ...[...Array(6)].map((_,i)=>({status:"In Progress",current:["Document AI Processing","Data Extracted","Masters Mapping","Output Generation","Rules Applied","ERP Delivery"][i],erp:null,from:["pod@ecom.com","delivery@ninja.com","pod@jt.com","api-pod-2","delivery@lbc.com","pod@flash.com"][i],error:null})),
      ...[...Array(8)].map((_,i)=>({status:"Did not complete",current:["Document AI Failed","Masters Mapping Failed","Rules Applied","ERP Delivery Failed","Document AI Failed","Attachment Check","Rules Applied","Masters Mapping Failed"][i],erp:null,from:["delivery@sig.com","pod@blank.com","delivery@date.com","api-pod-3","pod@lowres.com","delivery@lock.com","pod@nodata.com","delivery@drv.com"][i],error:["Signature not detected","Recipient name blank","Delivery date format unrecognized","ERP: Job# not found","Image resolution too low","Password-protected attachment","Condition field blank","Driver not in Driver Master"][i]})),
    ],
  };
  const refs={awb:i=>`AWB-${724+Math.floor(i/10)}-${85821900+i}`,bl:i=>[`MAEU-${1234500+i*17}`,`HLCU-${9900+i*13}`,`MSCU-${7700+i*11}`,`OOLU-${4400+i*7}`,`YMLU-${3300+i*5}`][i%5],invoice:i=>`INV-2024-${9900-i}`,si:i=>`SI-2024-${4400+i}`,pod:i=>`POD-2024-${3100+i}`};
  const trigs=["Email","API","Webhook","FTP"];
  let id=1; const all=[]; const base=new Date("2024-09-16T09:44:00");
  for(const[dk,entries]of Object.entries(stateBlocks)){
    entries.forEach((e,i)=>{
      const t=new Date(base.getTime()-i*7*60000);
      const h=String(t.getHours()).padStart(2,"0"),m2=String(t.getMinutes()).padStart(2,"0");
      all.push({id:id++,docType:dk,ref:refs[dk](i),trigger:trigs[i%4],...e,time:`${h}:${m2}`,retries:e.status==="Did not complete"?Math.floor(Math.random()*3):0});
    });
  }
  return all;
}
const ALL_ENTRIES=genEntries();

function Dashboard(){
  const [docFilter,setDocFilter]=useState("bl");
  const [statusFilter,setStatusFilter]=useState("All");
  const [expanded,setExpanded]=useState(null);
  const [retrying,setRetrying]=useState(null);
  const entries=ALL_ENTRIES.filter(e=>e.docType===docFilter&&(statusFilter==="All"||e.status===statusFilter));
  const cnt=s=>ALL_ENTRIES.filter(e=>e.docType===docFilter&&(s==="All"||e.status===s)).length;
  const sCfg={"Completed":{c:C.accent,bg:C.accentLight},"In Progress":{c:C.blue,bg:C.blueLight},"Did not complete":{c:C.red,bg:C.redLight}};
  const steps=["Email Received","Email Read","Attachment Check","Doc AI","Data Extracted","Rules Applied","Masters Mapped","Output Built","Delivered","Complete"];
  const doneN=s=>s==="Completed"?10:s==="In Progress"?5:3;
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",background:C.bg}}>
      <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",flexShrink:0,background:C.white}}>
        {Object.entries(DOC_TYPES).map(([k,d])=>(
          <button key={k} onClick={()=>{setDocFilter(k);setStatusFilter("All");setExpanded(null);}}
            style={{fontSize:11,padding:"5px 13px",borderRadius:20,border:`1.5px solid ${docFilter===k?d.color:C.border}`,background:docFilter===k?d.color+"12":"white",color:docFilter===k?d.color:C.textMuted,cursor:"pointer",fontWeight:docFilter===k?700:400}}>
            {d.short} <span style={{opacity:.6,fontWeight:400}}>({ALL_ENTRIES.filter(e=>e.docType===k).length})</span>
          </button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          {["All","Completed","In Progress","Did not complete"].map(s=>{const sc=sCfg[s]||{c:C.textMid,bg:"#F3F4F6"};return(
            <button key={s} onClick={()=>setStatusFilter(s)}
              style={{fontSize:10,padding:"4px 9px",borderRadius:20,border:`1px solid ${statusFilter===s?sc.c:C.border}`,background:statusFilter===s?sc.bg:"transparent",color:statusFilter===s?sc.c:C.textMuted,cursor:"pointer",fontWeight:statusFilter===s?600:400}}>
              {s} ({cnt(s)})
            </button>
          );})}
        </div>
      </div>
      <div style={{padding:"7px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:20,flexShrink:0,background:C.white}}>
        {[{l:"Total",v:cnt("All"),c:C.textMid},{l:"Completed",v:cnt("Completed"),c:C.accent},{l:"In Progress",v:cnt("In Progress"),c:C.blue},{l:"Failed",v:cnt("Did not complete"),c:C.red}].map(({l,v,c})=>(
          <div key={l} style={{display:"flex",gap:5,alignItems:"baseline"}}><span style={{fontSize:20,fontWeight:700,color:c}}>{v}</span><span style={{fontSize:10,color:C.textMuted}}>{l}</span></div>
        ))}
        <span style={{marginLeft:"auto",fontSize:11,color:C.textMuted,alignSelf:"center"}}>{DOC_TYPES[docFilter]?.label} — {entries.length} entries</span>
      </div>
      <div style={{flex:1,overflowY:"auto",background:C.white}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead style={{position:"sticky",top:0,background:C.panelB,zIndex:1}}>
            <tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Reference","Trigger","Current State","Status","Time","ERP Ref","Retries",""].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:C.textLight,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(row=>{
              const isExp=expanded===row.id; const sc=sCfg[row.status]||{c:C.textMid,bg:"#F9FAFB"}; const done=doneN(row.status);
              return(<>
                <tr key={row.id} onClick={()=>setExpanded(isExp?null:row.id)}
                  style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:isExp?C.panelB:"white",transition:"background .1s"}}
                  onMouseOver={e=>{if(!isExp)e.currentTarget.style.background=C.bg;}} onMouseOut={e=>{if(!isExp)e.currentTarget.style.background="white";}}>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:C.text,fontWeight:500,whiteSpace:"nowrap"}}>{row.ref}</td>
                  <td style={{padding:"8px 12px",fontSize:11,color:C.textMid}}>{row.trigger}</td>
                  <td style={{padding:"8px 12px",fontSize:11,color:C.textMuted,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.current}</td>
                  <td style={{padding:"8px 12px"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:20,background:sc.bg,border:`1px solid ${sc.c}33`,fontSize:10,fontWeight:600,color:sc.c}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:sc.c,animation:row.status==="In Progress"?"pulse 1.5s ease infinite":""}}/>
                      {row.status}
                    </span>
                  </td>
                  <td style={{padding:"8px 12px",fontSize:11,color:C.textMuted,fontFamily:"monospace"}}>{row.time}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:C.accent,fontWeight:600}}>{row.erp||"—"}</td>
                  <td style={{padding:"8px 12px",fontSize:11,color:C.textMuted}}>{row.retries>0?`${row.retries}×`:"—"}</td>
                  <td style={{padding:"8px 12px"}}>{row.status==="Did not complete"&&<button onClick={e=>{e.stopPropagation();setRetrying(row.id);setTimeout(()=>setRetrying(null),2000);}} style={{fontSize:10,padding:"3px 9px",borderRadius:5,border:`1px solid ${C.amberMid}`,color:C.amber,background:C.amberLight,cursor:"pointer",fontWeight:500}}>{retrying===row.id?"↻":"Retry"}</button>}</td>
                </tr>
                {isExp&&(<tr key={`e${row.id}`}><td colSpan={8} style={{padding:"0 12px 10px"}}>
                  <div style={{background:C.panelB,border:`1px solid ${C.border}`,borderRadius:9,padding:12}} className="fade-in">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:8}}>
                      <div><span style={{fontSize:10,color:C.textMuted}}>From: </span><span style={{fontSize:11,color:C.text,fontFamily:"monospace"}}>{row.from}</span></div>
                      <div><span style={{fontSize:10,color:C.textMuted}}>Document: </span><span style={{fontSize:11,color:C.text}}>{DOC_TYPES[row.docType]?.label}</span></div>
                      {row.erp&&<div><span style={{fontSize:10,color:C.textMuted}}>ERP Ref: </span><span style={{fontSize:11,color:C.accent,fontFamily:"monospace",fontWeight:700}}>{row.erp}</span></div>}
                    </div>
                    {row.error&&<div style={{padding:"6px 10px",background:C.redLight,border:`1px solid ${C.redMid}`,borderRadius:7,color:C.red,marginBottom:8,fontSize:11,fontWeight:500}}>⚠ {row.error}</div>}
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {steps.map((s,i)=>{const isFail=row.status==="Did not complete"&&i===done-1;const isDone=row.status==="Completed"||(i<done&&!isFail);return(
                        <span key={s} style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:500,background:isFail?C.redLight:isDone?C.accentLight:C.bg,color:isFail?C.red:isDone?C.accentB:C.textMuted,border:`1px solid ${isFail?C.redMid:isDone?C.accentMid:C.border}`}}>
                          {isFail?"✗":isDone?"✓":"·"} {s}
                        </span>
                      );})}
                    </div>
                  </div>
                </td></tr>)}
              </>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SIMULATION ───────────────────────────────────────────────────────────────
function Simulation({onClose,wfConfig}){
  const trig=wfConfig.trigger||{},acts=wfConfig.actions||{},rules=wfConfig.rules||{},masters=wfConfig.masters||{},outs=wfConfig.output||{};
  const docType=acts.docType||"bl";const docShort=DOC_TYPES[docType]?.short||"BL";
  const emailId=trig.fields?.["Email ID"]||"carrier@maersk.com";
  const endpoint=outs.fields?.["Endpoint URL"]||outs.fields?.["Webhook URL"]||outs.fields?.["ERP URL"]||outs.fields?.["To Email"]||"https://erp.company.com/api/jobs";
  const fieldCount=acts.docFields?.length||DOC_TYPES[docType]?.fields.length||18;
  const masterCount=masters.items?.length||2;const ruleCount=rules.items?.length||3;
  const trigLabel=trig.type?(TRIGGER_TYPES[trig.type]?.label+(trig.provider?` (${TRIGGER_TYPES[trig.type]?.providers?.[trig.provider]?.label||trig.provider})`:"")):"Email (Gmail)";
  const outLabel=outs.type?OUTPUT_LABELS[outs.type]||outs.type:"ERP";
  const STEPS=[
    {label:"Workflow Triggered",detail:`Source: ${trigLabel}`},
    {label:"Reading Trigger",detail:`Polling ${emailId}`},
    {label:"Input Received",detail:`Email from ${emailId} — 1 attachment`},
    {label:"Source Verified",detail:"Domain validated ✓"},
    {label:"Attachment Validated",detail:"PDF · 1.2MB < 10MB ✓"},
    {label:`Document AI — ${docShort}`,detail:`${DOC_TYPES[docType]?.label} (97.3%)`},
    {label:`Fields Extracted (${fieldCount})`,detail:(acts.docFields||DOC_TYPES[docType]?.fields||[]).slice(0,3).join(", ")},
    {label:`Rules Applied (${ruleCount})`,detail:(rules.items||[]).slice(0,2).map(r=>r.label).join(", ")||"Validation OK"},
    {label:`Masters Mapped (${masterCount})`,detail:(masters.items||[]).slice(0,2).map(k=>MASTER_TYPES[k]?.label||k).join(", ")||"Vendor, Carrier"},
    {label:"Payload Built",detail:`${(outs.type||"JSON").toUpperCase()} — 2.1KB`},
    {label:`Delivering to ${outLabel}`,detail:`→ ${endpoint}`},
    {label:"Entry Confirmed",detail:"Job# JB-2024-8822 · PRQ-44831 ✓"},
  ];
  const[step,setStep]=useState(-1);const[done,setDone]=useState(false);const[log,setLog]=useState([]);const logRef=useRef(null);
  useEffect(()=>{
    const logs=[[`INFO  Triggered — ${trigLabel}`],[`INFO  Polling ${emailId}`],[`INFO  Email received · 1 attachment`],[`INFO  Domain validated ✓`],[`INFO  ${docShort}_doc.pdf · 1.2MB ✓`],[`INFO  Document AI invoked`,`INFO  Classification: ${DOC_TYPES[docType]?.label} 97.3%`],[`SUCCESS  Extracted ${fieldCount} fields`,...(acts.docFields||[]).slice(0,4).map(f=>`       · ${f}`)],[`INFO  Applying ${ruleCount} rules`,...(rules.items||[]).slice(0,3).map(r=>`       · ${r.label}${r.logic?" — "+r.logic.slice(0,40):""} PASS`)],[`INFO  Masters lookup (${masterCount})`,...(masters.items||[]).slice(0,2).map(k=>`       · ${MASTER_TYPES[k]?.label} ✓`)],[`INFO  Building ${(outs.type||"JSON").toUpperCase()} payload`],[`INFO  → ${endpoint}`],[`SUCCESS  HTTP 200 OK`,`SUCCESS  Job# JB-2024-8822 created`,`SUCCESS  Workflow complete ✓`]];
    let i=0;const delays=[600,500,500,400,500,1800,900,700,700,500,1000,800];
    const adv=()=>{if(i>=STEPS.length){setDone(true);return;}setStep(i);setLog(p=>[...p,...logs[i]]);setTimeout(()=>{i++;if(i<STEPS.length)setTimeout(adv,180);else{setDone(true);setStep(-1);}},delays[i]||600);};
    const t=setTimeout(adv,400);return()=>clearTimeout(t);
  },[]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[log]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:780,maxHeight:"86vh",background:C.white,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:C.shadowLg}}>
        <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,background:C.panelB}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:done?C.accent:C.blue,animation:done?"none":"pulse 1s ease infinite"}}/>
          <div><div style={{fontWeight:700,fontSize:13,color:C.text}}>Live Execution — {wfConfig.name||"Workflow"}</div><div style={{fontSize:10,color:C.textMuted}}>{trigLabel} → {DOC_TYPES[docType]?.label} → {outLabel}</div></div>
          <button onClick={onClose} style={{marginLeft:"auto",color:C.textMuted,fontSize:22,lineHeight:1,background:"none",border:"none",cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",flex:1,minHeight:0}}>
          <div style={{width:260,borderRight:`1px solid ${C.border}`,padding:14,overflowY:"auto"}}>
            {STEPS.map((s,i)=>{const isDone2=done||(step>i);const isActive=step===i&&!done;return(
              <div key={i} style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:isDone2?C.accent:isActive?C.blue:"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",flexShrink:0,fontWeight:700}}>
                    {isDone2?"✓":isActive?<span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>↻</span>:i+1}
                  </div>
                  {i<STEPS.length-1&&<div style={{width:1.5,flex:1,minHeight:8,background:isDone2?C.accentMid:C.border,marginTop:3}}/>}
                </div>
                <div style={{paddingTop:2,flex:1}}><div style={{fontSize:11,fontWeight:600,color:isDone2?C.text:isActive?C.blue:C.textMuted}}>{s.label}</div>{(isDone2||isActive)&&<div style={{fontSize:9,color:C.textMuted,marginTop:1,lineHeight:1.5}}>{s.detail}</div>}</div>
              </div>
            );})}
            {done&&<div style={{padding:10,background:C.accentLight,border:`1px solid ${C.accentMid}`,borderRadius:9,textAlign:"center"}} className="fade-in"><div style={{fontSize:18,marginBottom:3}}>✅</div><div style={{fontSize:12,fontWeight:700,color:C.accentB}}>Complete</div><div style={{fontSize:10,color:C.textMuted,marginTop:3}}>Job# JB-2024-8822</div></div>}
          </div>
          <div style={{flex:1,padding:14,overflowY:"auto",background:"#F8FAFB",fontFamily:"monospace"}} ref={logRef}>
            <div style={{fontSize:9,fontWeight:700,color:C.textLight,marginBottom:8,letterSpacing:".08em"}}>EXECUTION LOG</div>
            {log.map((line,i)=><div key={i} className="fade-in" style={{fontSize:11,lineHeight:1.8,color:line.startsWith("SUCCESS")?C.accent:line.startsWith("WARN")?C.amber:line.startsWith("ERROR")?C.red:C.textMid,paddingLeft:line.startsWith(" ")?"16px":"0"}}>{line}</div>)}
            {!done&&log.length>0&&<span style={{display:"inline-block",width:6,height:13,background:C.accent,verticalAlign:"middle",animation:"pulse 1s ease infinite"}}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:${C.bg};color:${C.text};font-family:'Inter',sans-serif;font-size:13px;height:100vh;overflow:hidden;}
::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:${C.blueMid};border-radius:3px;}
button{cursor:pointer;border:none;background:none;color:inherit;font-family:inherit;font-size:inherit;}
input,select,textarea{font-family:inherit;font-size:12px;color:${C.text};}
.fade-in{animation:fadeIn .2s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:none;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
.tab-btn{padding:10px 16px;font-size:12px;font-weight:500;color:${C.textMuted};border-bottom:2px solid transparent;transition:all .15s;background:none;border-left:none;border-right:none;border-top:none;font-family:'Inter',sans-serif;}
.tab-btn:hover{color:${C.blue};}
.tab-btn.active{color:${C.blue};border-bottom-color:${C.blue};font-weight:600;}
.btn-run{background:${C.blue};color:white;border-radius:7px;padding:6px 16px;font-weight:600;font-size:12px;display:inline-flex;align-items:center;gap:6px;transition:background .15s;font-family:'Inter',sans-serif;border:none;cursor:pointer;}
.btn-run:hover{background:${C.blueB};}
.btn-run:disabled{opacity:.4;cursor:not-allowed;}
.btn-save{border:1px solid ${C.border};border-radius:7px;padding:5px 12px;color:${C.textMid};font-size:12px;font-weight:500;transition:all .15s;background:white;font-family:'Inter',sans-serif;}
.btn-save:hover{border-color:${C.blue};color:${C.blue};}
`;

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS=[
  {id:"trigger",icon:"⚡",label:"Trigger",req:true},
  {id:"actions",icon:"⚙",label:"Actions",req:true},
  {id:"rules",icon:"🛡",label:"Rules",req:false},
  {id:"masters",icon:"🗂",label:"Masters",req:false},
  {id:"output",icon:"📤",label:"Output",req:true},
  {id:"alerts",icon:"🔔",label:"Alerts",req:false},
  {id:"logs",icon:"📋",label:"Logs",req:false},
];

function isTabConfigured(id,config){
  if(id==="trigger")return!!config.trigger?.type;
  if(id==="actions")return config.actions?.items?.length>0||!!config.actions?.docType;
  if(id==="rules")return config.rules?.items?.length>0;
  if(id==="masters")return config.masters?.items?.length>0;
  if(id==="output")return!!config.output?.type;
  if(id==="alerts")return!!(config.alerts?.slack?.webhook||config.alerts?.email?.to);
  return false;
}

function getMissingRequired(id,config){
  if(id==="trigger"){
    const t=config.trigger;
    if(!t?.type)return["Trigger source not selected"];
    const reqF=t.type==="email"?(t.provider?REQUIRED_FIELDS.email[t.provider]||[]:["Email ID"]):(Array.isArray(REQUIRED_FIELDS[t.type])?REQUIRED_FIELDS[t.type]:[]);
    return reqF.filter(f=>!t.fields?.[f]?.trim()).map(f=>`${f} is required`);
  }
  if(id==="output"){
    const o=config.output;
    if(!o?.type)return["Delivery method not selected"];
    const reqF={api:["Endpoint URL","API Key / Token"],webhook:["Webhook URL"],email:["To Email"],ftp:["Host","Username"],erp:["ERP URL"]}[o.type]||[];
    return reqF.filter(f=>!o.fields?.[f]?.trim()).map(f=>`${f} is required`);
  }
  return[];
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App(){
  const[view,setView]=useState("builder");
  const[tab,setTab]=useState("trigger");
  const[inputMode,setInputMode]=useState("instruction");
  const[config,setConfig]=useState({trigger:{},actions:{},rules:{},masters:{},output:{},alerts:{}});
  const[wfName,setWfName]=useState("SI / BL Documentation");
  const[saved,setSaved]=useState(false);
  const[showSim,setShowSim]=useState(false);
  const[showErrors,setShowErrors]=useState(false);
  // Persistent conversational texts per section
  const[convoTexts,setConvoTexts]=useState({trigger:"",actions:"",rules:"",masters:"",output:"",alerts:""});

  const upd=(k,v)=>setConfig(p=>({...p,[k]:v}));
  const canRun=!!config.trigger?.type&&!!config.output?.type;
  const configuredCount=TABS.filter(t=>!["alerts","logs"].includes(t.id)&&isTabConfigured(t.id,config)).length;

  const handleNext=()=>{
    const i=TABS.findIndex(t=>t.id===tab);
    const curr=TABS[i];
    if(curr.req){
      const missing=getMissingRequired(curr.id,config);
      if(missing.length>0){setShowErrors(true);return;}
    }
    setShowErrors(false);
    if(i<TABS.length-1)setTab(TABS[i+1].id);
  };
  const handlePrev=()=>{
    setShowErrors(false);
    const i=TABS.findIndex(t=>t.id===tab);
    if(i>0)setTab(TABS[i-1].id);
  };
  const handleNodeClick=(id)=>{setView("builder");setTab(id);setShowErrors(false);};

  const missing=getMissingRequired(tab,config);

  return(
    <>
      <style>{CSS}</style>
      {showSim&&<Simulation onClose={()=>setShowSim(false)} wfConfig={{...config,name:wfName}}/>}
      <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg}}>
        {/* TOP BAR */}
        <div style={{height:52,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 18px",gap:14,flexShrink:0,background:C.white,boxShadow:"0 1px 4px rgba(27,79,216,.10)"}}>
          <div style={{display:"flex",alignItems:"center",gap:0}}>
            <svg width="130" height="38" viewBox="0 0 130 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Intemo">
              <circle cx="19" cy="4.5" r="4" fill="#3DAA3B"/>
              <path d="M22 9 Q26 7 24 11M24 11 Q20 20 18 30M18 30 Q14 34 16 37" stroke="#1B4FD8" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
              <text x="30" y="31" fontFamily="Inter,Arial,sans-serif" fontSize="22" fontWeight="800" fill="#1B4FD8" letterSpacing="0.8">NTEMO</text>
            </svg>
          </div>
          <div style={{width:1,height:20,background:C.border}}/>
          <span style={{fontSize:13,fontWeight:600,color:C.text}}>AI Workflow Builder</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:C.accent}}/>
            <input value={wfName} onChange={e=>setWfName(e.target.value)}
              style={{background:"transparent",border:"none",outline:"none",fontSize:13,color:C.textMid,width:220,fontFamily:"Inter,sans-serif"}}/>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:C.accentLight,color:C.accentB,border:`1px solid ${C.accentMid}`,fontWeight:600}}>{configuredCount}/5</span>
            <button className="btn-save" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),1800);}}>{saved?"✓ Saved":"Save Draft"}</button>
            <button className="btn-run" disabled={!canRun} onClick={()=>canRun&&setShowSim(true)}>▶ Run</button>
          </div>
        </div>
        {/* VIEW SWITCHER */}
        <div style={{borderBottom:`1px solid ${C.border}`,display:"flex",padding:"0 18px",background:C.white,flexShrink:0,alignItems:"center"}}>
          {[{id:"builder",l:"⚙ Configure"},{id:"flowchart",l:"🔀 Flowchart"},{id:"dashboard",l:"📊 Dashboard"}].map(v=>(
            <button key={v.id} className={`tab-btn${view===v.id?" active":""}`} onClick={()=>{setView(v.id);setShowErrors(false);}}>{v.l}</button>
          ))}
          {view!=="dashboard"&&(
            <div style={{marginLeft:"auto",display:"flex",gap:6,paddingBottom:2}}>
              {[{id:"conversational",icon:"💬",label:"Conversational"},{id:"instruction",icon:"🔧",label:"Instruction"}].map(m=>(
                  <button key={m.id} onClick={()=>setInputMode(m.id)}
                  style={{padding:"3px 10px",fontSize:11,borderRadius:20,border:`1.5px solid ${inputMode===m.id?C.blue:C.border}`,background:inputMode===m.id?C.blueLight:"transparent",color:inputMode===m.id?C.blue:C.textMuted,cursor:"pointer",fontWeight:inputMode===m.id?600:400}}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{flex:1,minHeight:0,display:"flex"}}>
          {/* BUILDER */}
          {view==="builder"&&(<>
            <div style={{width:150,borderRight:`1px solid ${C.border}`,padding:"12px 8px",background:C.white,flexShrink:0,overflowY:"auto"}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:C.textLight,marginBottom:10,padding:"0 4px"}}>Nodes</div>
              {TABS.map(t=>{
                const isA=tab===t.id; const conf=isTabConfigured(t.id,config);
                return(
                  <button key={t.id} onClick={()=>{setTab(t.id);setShowErrors(false);}}
                    style={{width:"100%",padding:"9px 10px",borderRadius:8,background:isA?C.blueLight:"transparent",border:`1.5px solid ${isA?C.blue:C.border}`,color:isA?C.blue:C.textMid,fontWeight:isA?600:400,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:4,transition:"all .15s",position:"relative"}}>
                    <span style={{fontSize:15}}>{t.icon}</span>
                    <span style={{flex:1,textAlign:"left"}}>{t.label}</span>
                    {conf&&<span style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0}}/>}
                    {t.req&&!conf&&<span style={{width:6,height:6,borderRadius:"50%",background:C.redMid,flexShrink:0}}/>}
                  </button>
                );
              })}
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              {/* Error banner */}
              {showErrors&&missing.length>0&&(
                <div style={{padding:"8px 16px",background:C.redLight,borderBottom:`1px solid ${C.redMid}`,fontSize:11,color:C.red,display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  <span>⚠</span>
                  <div>{missing.map((m,i)=><span key={i} style={{marginRight:12}}>• {m}</span>)}</div>
                </div>
              )}
              <div style={{flex:1,overflowY:"auto",padding:16,background:C.bg}}>
                {tab==="trigger"&&<TriggerPanel config={config.trigger} onChange={v=>upd("trigger",v)} inputMode={inputMode} convoTexts={convoTexts} setConvoTexts={setConvoTexts} showErrors={showErrors}/>}
                {tab==="actions"&&<ActionsPanel config={config.actions} onChange={v=>upd("actions",v)} inputMode={inputMode} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
                {tab==="rules"&&<RulesPanel config={config.rules} onChange={v=>upd("rules",v)} inputMode={inputMode} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
                {tab==="masters"&&<MastersPanel config={config.masters} onChange={v=>upd("masters",v)} inputMode={inputMode} docType={config.actions?.docType} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
                {tab==="output"&&<OutputPanel config={config.output} onChange={v=>upd("output",v)} inputMode={inputMode} convoTexts={convoTexts} setConvoTexts={setConvoTexts} showErrors={showErrors}/>}
                {tab==="alerts"&&<AlertsPanel config={config.alerts} onChange={v=>upd("alerts",v)} convoTexts={convoTexts} setConvoTexts={setConvoTexts}/>}
                {tab==="logs"&&<LogsPanel/>}
              </div>
              {!["alerts","logs"].includes(tab)&&(
                <div style={{padding:"9px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexShrink:0,background:C.white}}>
                  <button className="btn-save" onClick={handlePrev}>← Back</button>
                  <button className="btn-run" style={{fontSize:11,padding:"5px 14px"}} onClick={handleNext}>Next →</button>
                </div>
              )}
            </div>
          </>)}
          {/* FLOWCHART */}
          {view==="flowchart"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",padding:16,gap:10,minHeight:0,background:C.bg}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>Workflow Flowchart</span>
                <span style={{fontSize:11,color:C.textMuted}}>· Click any node to configure</span>
                <div style={{marginLeft:"auto"}}>
                  <button className="btn-run" disabled={!canRun} onClick={()=>canRun&&setShowSim(true)}>▶ Run Workflow</button>
                </div>
              </div>
              <FlowChart wfConfig={config} onEditNode={handleNodeClick}/>
              <div style={{fontSize:10,color:C.textMuted,textAlign:"center",flexShrink:0}}>
                {configuredCount===0?"Configure steps in the Configure tab — flowchart updates live":`${configuredCount}/5 configured · ${canRun?"Ready to run":"Set trigger + output to enable run"}`}
              </div>
            </div>
          )}
          {/* DASHBOARD */}
          {view==="dashboard"&&<Dashboard/>}
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
