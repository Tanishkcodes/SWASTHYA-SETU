const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'PhysicianDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace lucide-react imports to include Image, FileIcon
content = content.replace(
  "import{Activity,ArrowLeft,CalendarCheck,ChevronDown,Clock3,Download,Eye,FileText,Globe2,HelpCircle,Leaf,LogOut,Menu,Plus,Trash2,UsersRound,X}from'lucide-react';",
  "import{Activity,ArrowLeft,CalendarCheck,CalendarDays,ChevronDown,Clock3,Download,Eye,FileText,Globe2,HelpCircle,Leaf,LogOut,Menu,Plus,Trash2,UsersRound,X,File,Image}from'lucide-react';"
);

// Drawer implementation
const newDrawer = `function Drawer({p,intake,reports,close,start}){
  const h=intake?.history||{};
  return <aside className="dp-drawer">
    <header>
      <h3>Patient Details</h3>
      <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
        <X onClick={close} style={{cursor:'pointer',color:'#64748b'}}/>
      </div>
    </header>
    <div style={{display:'flex', justifyContent:'flex-end', padding:'0 16px', marginTop:'-10px'}}>
      <span style={{background:'#eef5ff',color:'#0878f9',fontSize:'11px',fontWeight:'700',padding:'4px 8px',borderRadius:'6px'}}>Upcoming Appointment</span>
    </div>
    <div className="dp-person" style={{paddingTop:'0'}}>
      <i>{initials(p.name)}</i>
      <div>
        <h2>{p.name}</h2>
        <p>{p.age||'—'} Years / {p.gender||'—'}</p>
        <small style={{color:'#087d43',fontWeight:'600'}}>✓ ABHA Linked</small>
      </div>
    </div>
    <div className="dp-block">
      <Clock3 color="#64748b"/>
      <span><small>Appointment Time</small><b>{p.time||'—'}, {date(p.date)}</b></span>
      <em style={{background:'#eaf3ff',color:'#0878f9',padding:'6px 12px',borderRadius:'12px',fontSize:'12px',fontWeight:'600',fontStyle:'normal'}}>Upcoming</em>
    </div>
    <div className="dp-block" style={{marginTop:0}}>
      <FileText color="#64748b"/>
      <span><small>Reason for Visit</small><b>{p.reason||'Not provided'}</b></span>
      <button style={{background:'#eef5ff',border:'none',borderRadius:'6px',padding:'8px',color:'#0878f9',cursor:'pointer'}}><FileText size={16}/></button>
    </div>
    <div className="dp-mini" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
      <div><Activity color="#087d43"/><small>AI History</small><b style={{color:'#087d43'}}>{intake?'Ready':'Not submitted'}</b></div>
      <div><FileText color="#64748b"/><small>Reports</small><b>{reports.length} Uploaded</b></div>
      <div><CalendarDays color="#e63946"/><small>Last Visit</small><b>18 Aug 2026</b></div>
    </div>
    <div className="dp-summary">
      <h3>Patient Summary</h3>
      <p><span>Blood Group</span><b>B+</b></p>
      <p><span>Allergies</span><b>{txt(h.allergies)||'None'}</b></p>
      <p><span>Chronic Conditions</span><b>{txt(h.pastMedical)||'Acidity'}</b></p>
      <p><span>Current Medications</span><b>{txt(h.medications)||'Omeprazole 20mg'}</b></p>
      <div style={{textAlign:'center',marginTop:'10px'}}>
        <button style={{background:'none',border:'none',color:'#087d43',fontSize:'12px',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'4px',cursor:'pointer'}}>View More <ChevronDown size={14}/></button>
      </div>
    </div>
    <button className="dp-start" onClick={start}>Start Consultation <span style={{float:'right'}}>→</span></button>
  </aside>;
}`;

// Consultation implementation
const newConsultation = `function Consultation({p,intake,reports,ayur,back,end}){
  const h=intake?.history||{},s=intake?.clinical_summary||{},a=h.ayushAssessment||{};
  const [meds,setMeds]=useState([{medicine:'Pantoprazole 40mg',dosage:'1 Tablet',frequency:'Before Breakfast',duration:'5 Days',instructions:'Take on empty stomach'},{medicine:'Dicyclomine 20mg',dosage:'1 Tablet',frequency:'After Meals',duration:'3 Days',instructions:'For stomach cramps'},{medicine:'Ondansetron 4mg',dosage:'1 Tablet',frequency:'As Needed',duration:'3 Days',instructions:'For nausea / vomiting'}]);
  const [advice,setAdvice]=useState('• Eat small, frequent meals.\\n• Avoid spicy, oily, and acidic foods.\\n• Stay hydrated and avoid carbonated drinks.\\n• Manage stress and get adequate sleep.');
  const [ayurMeds,setAyurMeds]=useState([{medicine:'Avipattikar Churna',dosage:'1 tsp',anupana:'Lukewarm Water',whenToTake:'After Lunch & Dinner',duration:'30 Days'},{medicine:'Godanti Bhasma',dosage:'1/2 tsp',anupana:'Ghee',whenToTake:'After Meals',duration:'30 Days'},{medicine:'Kutajghan Vati',dosage:'1 Tablet',anupana:'—',whenToTake:'Twice a Day',duration:'30 Days'},{medicine:'Brahmi Ghrita',dosage:'1 tsp',anupana:'Warm Milk',whenToTake:'At Bedtime',duration:'30 Days'}]);
  const [ayurAdvice,setAyurAdvice]=useState('• Avoid spicy, oily, and heavy foods.\\n• Prefer warm, light, and easily digestible meals.\\n• Drink warm water. Avoid cold drinks.\\n• Maintain regular meal timings and proper sleep.\\n• Practice gentle yoga and deep breathing (Pranayama).');
  
  const add=()=>setMeds(v=>[...v,{medicine:'',dosage:'',frequency:'',duration:'',instructions:''}]);
  const addAyur=()=>setAyurMeds(v=>[...v,{medicine:'',dosage:'',anupana:'',whenToTake:'',duration:''}]);
  const edit=(i,k,v)=>setMeds(r=>r.map((x,j)=>j===i?{...x,[k]:v}:x));
  const editAyur=(i,k,v)=>setAyurMeds(r=>r.map((x,j)=>j===i?{...x,[k]:v}:x));
  const finish=()=>end({prescription:(ayur?ayurMeds:meds).filter(x=>x.medicine).map(x=>Object.values(x).filter(Boolean).join(' | ')).join('\\n'),doctor_notes:ayur?ayurAdvice:advice});
  
  const renderList = (text) => {
    if(!text) return 'Not recorded';
    const items = typeof text === 'string' ? text.split(',').map(x=>x.trim()).filter(Boolean) : Array.isArray(text) ? text : [JSON.stringify(text)];
    return <ul style={{paddingLeft:'16px',margin:0,listStyleType:'disc'}}>{items.map((x,i)=><li key={i} style={{marginBottom:'4px'}}>{x}</li>)}</ul>;
  };

  return <main className="dp-consult">
    <div className="dp-cnav"><button onClick={back}><ArrowLeft size={16}/>Back to Appointments</button><Top doctor={p.doctor}/></div>
    <div className="dp-ctitle">
      <div><h1>Consultation in Progress {ayur&&<em style={{fontSize:'12px',fontWeight:'600',color:'#087d43',background:'#eaf7f0',padding:'4px 8px',borderRadius:'6px',marginLeft:'12px',display:'inline-flex',alignItems:'center',gap:'4px'}}><Leaf size={14}/>Ayurvedic Consultation</em>}</h1><p style={{color:'#64748b',marginTop:'4px',fontSize:'14px'}}>You are securely consulting with your patient.</p></div>
      <b style={{background:'#eaf7f0',color:'#087d43',padding:'10px 16px',borderRadius:'8px',fontSize:'16px'}}>Token #{String(p.token||'001').replace('#','')}</b>
    </div>
    
    <section className="dp-cpatient" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'30px',background:'#fff'}}>
      <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
        <i style={{width:'70px',height:'70px',borderRadius:'50%',background:'#eaf7f0',color:'#087d43',fontSize:'24px',display:'grid',placeItems:'center',fontWeight:'600',fontStyle:'normal'}}>{initials(p.name)}</i>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          <h2 style={{margin:0,display:'flex',alignItems:'center',gap:'12px',fontSize:'22px'}}>{p.name} <em style={{fontSize:'11px',background:'#eaf3ff',color:'#0878f9',padding:'4px 8px',borderRadius:'6px',fontStyle:'normal',fontWeight:'600'}}>In Consultation</em></h2>
          <p style={{margin:0,color:'#334155',fontSize:'14px',fontWeight:'500'}}>{p.age||'32'} Years / {p.gender||'Male'} <span style={{margin:'0 10px',color:'#cbd5e1'}}>|</span> <span style={{display:'inline-flex',alignItems:'center',gap:'4px'}}><Activity size={14} color="#64748b"/> 98765 43210</span></p>
          <small style={{display:'flex',alignItems:'center',gap:'12px',color:'#334155',fontWeight:'500'}}>{ayur?'AYUSH':'ABHA'} ID: {p.abhaId||(ayur?'AYUSH876512345':'ABHA123456789012')} <span style={{color:'#087d43',display:'inline-flex',alignItems:'center',gap:'4px'}}><CalendarCheck size={14}/> ABHA Linked</span></small>
        </div>
      </div>
      <dl style={{display:'grid',gridTemplateColumns:'auto auto',gap:'12px 32px',margin:0,padding:'10px 0 10px 32px',borderLeft:'1px solid #e2e8f0',fontSize:'13px'}}>
        <dt style={{color:'#64748b',margin:0}}>Appointment Time</dt><dd style={{fontWeight:'600',margin:0,color:'#0f172a'}}>{p.time||'10:30 AM'}, {date(p.date)||'18 May 2026'}</dd>
        <dt style={{color:'#64748b',margin:0}}>Appointment Type</dt><dd style={{fontWeight:'600',margin:0,color:'#0f172a'}}>{ayur?'Ayurvedic Consultation':'In-clinic Consultation'}</dd>
        <dt style={{color:'#64748b',margin:0}}>Referred By</dt><dd style={{fontWeight:'600',margin:0,color:'#0f172a'}}>Self</dd>
        <dt style={{color:'#64748b',margin:0}}>Last Visit</dt><dd style={{fontWeight:'600',margin:0,color:'#0f172a'}}>18 Aug 2026</dd>
      </dl>
    </section>
    
    <div className="dp-vitals" style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',border:'1px solid #e2e8f0',borderRadius:'12px',margin:'24px 0',padding:'20px 0',background:'#fff'}}>
      {(ayur?[['Height',s.height||'160 cm'],['Weight',s.weight||'58 kg'],['BMI',s.bmi||'22.7',true],['Prakriti (Constitution)',a.prakriti||'Pitta-Vata'],['Agni (Digestive Power)',a.agni||'Madhyama'],['Ama (Toxins)',a.ama||'Alpa']]
            :[['Height',s.height||'175 cm'],['Weight',s.weight||'72 kg'],['BMI',s.bmi||'23.5',true],['Blood Group',s.bloodGroup||'B+'],['Allergies',txt(h.allergies)||'None'],['Chronic Conditions',txt(h.pastMedical)||'Acidity']]
      ).map(([k,v,isNormal])=><div key={k} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',borderRight:'1px solid #e2e8f0'}}><small style={{color:'#64748b',fontWeight:'500'}}>{k}</small><b style={{fontSize:'16px',color:'#0f172a'}}>{v}</b>{isNormal&&<span style={{color:'#087d43',fontSize:'11px',fontWeight:'700'}}>Normal</span>}</div>)}
    </div>
    
    <Section n="1" title="Patient Summary (From Pre-consultation Intake)" action={<span style={{fontSize:'12px',color:'#087d43',fontWeight:'600',marginLeft:'auto'}}>Completed on 18 May 2026, 09:45 AM</span>}>
      <div className="dp-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'20px'}}>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Chief Complaint</b>
          <p style={{color:'#334155',margin:0}}>{ayur?'Acidity, bloating and burning sensation in stomach since 10 days.':'Stomach pain and acidity since 7-8 days.'}</p>
        </article>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Symptoms Reported</b>
          <ul style={{margin:0,paddingLeft:'16px',color:'#334155',listStyleType:'disc'}}>
            {ayur ? (
              <><li>Burning sensation in upper abdomen</li><li>Acidity after meals</li><li>Bloating</li><li>Nausea (occasional)</li><li>No vomiting</li></>
            ) : (
              <><li>Burning sensation in upper abdomen</li><li>Acidity after meals</li><li>Bloating</li><li>Nausea (occasional)</li><li>No vomiting</li></>
            )}
          </ul>
        </article>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Symptom Onset</b>
          <p style={{color:'#334155',margin:0}}>{ayur?'10 days ago':'7-8 days ago'}</p>
        </article>
        <article>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Severity</b>
          <p style={{color:'#334155',margin:0,display:'flex',alignItems:'center',gap:'6px'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#f59e0b'}}></span> Moderate</p>
        </article>
        
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px',borderTop:'1px solid #e2e8f0',paddingTop:'20px',marginTop:'10px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Relevant History</b>
          <ul style={{margin:0,paddingLeft:'16px',color:'#334155',listStyleType:'disc'}}>
            <li>Irregular eating habits</li>
            <li>Consumes spicy and oily food</li>
            <li>High stress due to work</li>
            <li>No smoking / alcohol</li>
          </ul>
        </article>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px',borderTop:'1px solid #e2e8f0',paddingTop:'20px',marginTop:'10px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Medical History</b>
          <p style={{color:'#334155',margin:0}}>No major medical conditions.</p>
        </article>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px',borderTop:'1px solid #e2e8f0',paddingTop:'20px',marginTop:'10px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Family History</b>
          <p style={{color:'#334155',margin:0}}>No significant family history.</p>
        </article>
        <article style={{borderTop:'1px solid #e2e8f0',paddingTop:'20px',marginTop:'10px'}}>
          <b style={{display:'block',marginBottom:'8px',color:'#0f172a'}}>Medications (Current)</b>
          <p style={{color:'#334155',margin:0}}>{ayur?'Antacid (Occasionally)':'None'}</p>
        </article>
      </div>
      <div style={{textAlign:'right',marginTop:'20px'}}>
        <button style={{background:'none',border:'none',color:'#087d43',fontWeight:'600',fontSize:'13px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px'}}>View Full Intake Details <ChevronDown size={14}/></button>
      </div>
    </Section>
    
    {ayur && <Section n="2" title="Dasvidha Pariksha (Ayurvedic Assessment)" action={<button style={{border:'1px solid #bfe1d0',color:'#087d43',background:'#fff',padding:'8px 14px',borderRadius:'8px',fontSize:'13px',fontWeight:'600',display:'flex',alignItems:'center',gap:'6px',marginLeft:'auto',cursor:'pointer'}}><FileText size={16}/> Edit Assessment</button>}>
      <div className="dp-ayush" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 40px'}}>
        {[['Prakriti (Constitution)','Pitta-Vata'],['Vikriti (Imbalance)','Pitta Prakopa'],['Sara (Tissue Strength)','Madhyama'],['Samhanana (Body Built)','Madhyama'],['Pramana (Body Measurement)','Madhyama']].map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid #e2e8f0',padding:'12px 0'}}><span style={{display:'flex',alignItems:'center',gap:'8px',color:'#087d43',fontWeight:'600',fontSize:'13px'}}><Leaf size={14}/> {k}</span><span style={{color:'#0f172a',fontWeight:'500',fontSize:'13px'}}>: <span style={{marginLeft:'8px'}}>{v}</span></span></div>)}
        {[['Satmya (Adaptability)','Madhyama'],['Satva (Mental Strength)','Madhyama'],['Ahar Shakti (Digestive Power)','Madhyama'],['Vyayam Shakti (Exercise Tolerance)','Madhyama'],['Vaya (Age)','Yuva Avastha (Adult)']].map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid #e2e8f0',padding:'12px 0'}}><span style={{display:'flex',alignItems:'center',gap:'8px',color:'#087d43',fontWeight:'600',fontSize:'13px'}}><Leaf size={14}/> {k}</span><span style={{color:'#0f172a',fontWeight:'500',fontSize:'13px'}}>: <span style={{marginLeft:'8px'}}>{v}</span></span></div>)}
      </div>
      <div style={{background:'#f8fafc',padding:'12px 16px',borderRadius:'8px',marginTop:'16px',fontSize:'13px',color:'#475569'}}>
        <b>Note:</b> This assessment is based on the information provided by the patient during the Ayurvedic consultation.
      </div>
    </Section>}
    
    <Section n={ayur?'3':'2'} title="Reports Summary (Extracted using OCR)">
      <div className="dp-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'20px',marginBottom:'20px'}}>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px'}}>
          <b style={{display:'block',marginBottom:'12px',color:'#0f172a',fontSize:'14px'}}>Blood Test ({ayur?'23 May 2026':'18 May 2026'})</b>
          <ul style={{margin:0,paddingLeft:'16px',color:'#334155',listStyleType:'disc',fontSize:'13px'}}>
            <li style={{marginBottom:'6px'}}>Hemoglobin: {ayur?'13.1':'14.2'} g/dL (Normal)</li>
            <li style={{marginBottom:'6px'}}>WBC Count: {ayur?'7,200':'6,800'} /uL (Normal)</li>
            <li style={{marginBottom:'6px'}}>Platelet Count: {ayur?'2.35':'2.45'} Lakh/uL (Normal)</li>
            <li style={{marginBottom:'6px'}}>Serum Creatinine: {ayur?'0.8':'0.9'} mg/dL (Normal)</li>
            <li>Fasting Blood Sugar: {ayur?'94':'92'} mg/dL (Normal)</li>
          </ul>
        </article>
        <article style={{borderRight:'1px solid #e2e8f0',paddingRight:'20px'}}>
          <b style={{display:'block',marginBottom:'12px',color:'#0f172a',fontSize:'14px'}}>{ayur?'X-Ray Chest (23 May 2026)':'Ultrasound Abdomen (18 May 2026)'}</b>
          <ul style={{margin:0,paddingLeft:'16px',color:'#334155',listStyleType:'disc',fontSize:'13px'}}>
            {ayur ? (
              <>
              <li style={{marginBottom:'6px'}}>Lungs are clear.</li>
              <li style={{marginBottom:'6px'}}>No evidence of active infection.</li>
              <li style={{marginBottom:'6px'}}>Heart size and mediastinum normal.</li>
              <li style={{marginBottom:'6px'}}>Diaphragm and bony structures normal.</li>
              <li>Impression: Normal study.</li>
              </>
            ) : (
              <>
              <li style={{marginBottom:'6px'}}>Liver is normal in size, shape and echotexture.</li>
              <li style={{marginBottom:'6px'}}>Gall bladder is distended and shows no evidence of calculi.</li>
              <li style={{marginBottom:'6px'}}>Pancreas is normal in size and echotexture.</li>
              <li>No free fluid in the peritoneal cavity.</li>
              </>
            )}
          </ul>
        </article>
        <article>
          <b style={{display:'block',marginBottom:'12px',color:'#0f172a',fontSize:'14px'}}>Previous Prescription ({ayur?'23 May 2026':'18 May 2026'})</b>
          <ul style={{margin:0,paddingLeft:'16px',color:'#334155',listStyleType:'disc',fontSize:'13px'}}>
            {ayur ? (
              <>
              <li style={{marginBottom:'6px'}}>Avipattikar Churna - 1 tsp with lukewarm water - After Lunch & Dinner</li>
              <li style={{marginBottom:'6px'}}>Godanti Bhasma - 1/2 tsp with ghee - After Meals</li>
              <li style={{marginBottom:'6px'}}>Kutajghan Vati - 1 tablet - Twice a Day</li>
              <li>Brahmi Ghrita - 1 tsp with warm milk - At Bedtime</li>
              </>
            ) : (
              <>
              <li style={{marginBottom:'6px'}}>Pantoprazole 40mg - 1 tablet before breakfast - 5 days</li>
              <li style={{marginBottom:'6px'}}>Dicyclomine 20mg - 1 tablet after meals - 3 days</li>
              <li>Ondansetron 4mg - 1 tablet as needed - 2 days</li>
              </>
            )}
          </ul>
        </article>
      </div>
      
      {!ayur && <div style={{background:'#eaf7f0',border:'1px solid #bfe1d0',padding:'12px 16px',borderRadius:'8px',color:'#087d43',fontSize:'13px',display:'flex',alignItems:'center',gap:'8px',fontWeight:'500'}}>
        <FileText size={16}/> OCR accuracy is high. Please verify the extracted information with the original reports.
      </div>}
      
      <div style={{marginTop:'30px'}}>
        <b style={{display:'block',marginBottom:'16px',color:'#0f172a'}}>Reports Uploaded by Patient</b>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
          {[
            {type:'pdf',name:ayur?'Blood_Test_Report.pdf':'Blood_Test_Report.pdf',date:ayur?'23 May 2026, 08:45 AM':'18 May 2026, 08:30 AM',size:'2.4 MB'},
            {type:'img',name:ayur?'X-Ray_Chest.jpg':'Ultrasound_Abdomen.jpg',date:ayur?'23 May 2026, 08:45 AM':'18 May 2026, 08:30 AM',size:ayur?'1.8 MB':'1.1 MB'},
            {type:ayur?'pdf':'img',name:ayur?'Previous_Prescription.pdf':'Previous_Prescription.png',date:ayur?'23 May 2026, 08:45 AM':'18 May 2026, 08:30 AM',size:ayur?'0.9 MB':'0.6 MB'},
            {type:ayur?'img':'pdf',name:ayur?'Diet_Plan.jpg':'ECG_Report.pdf',date:ayur?'23 May 2026, 08:45 AM':'17 May 2026, 01:30 PM',size:ayur?'1.2 MB':'1.6 MB'}
          ].map((r,i)=><div key={i} style={{border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',background:'#fff',display:'flex',flexDirection:'column'}}>
            <div style={{height:'100px',background:'#f8fafc',borderRadius:'8px',marginBottom:'12px',display:'grid',placeItems:'center',position:'relative',overflow:'hidden',border:'1px solid #e2e8f0'}}>
               {r.type==='pdf' ? <File color="#e63946" size={40}/> : <Image color="#0878f9" size={40}/>}
               <span style={{position:'absolute',top:'8px',left:'8px',background:'#fff',borderRadius:'4px',padding:'4px',boxShadow:'0 1px 2px rgba(0,0,0,0.1)'}}>{r.type==='pdf'?<FileText color="#e63946" size={14}/>:<Image color="#0878f9" size={14}/>}</span>
            </div>
            <b style={{fontSize:'13px',color:'#0f172a',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.name}>{r.name}</b>
            <span style={{fontSize:'11px',color:'#64748b',marginBottom:'2px'}}>{r.date}</span>
            <span style={{fontSize:'11px',color:'#64748b',marginBottom:'16px'}}>• {r.size}</span>
            <div style={{display:'flex',gap:'8px',marginTop:'auto'}}>
              <button style={{flex:1,padding:'8px',background:'#fff',border:'1px solid #bfe1d0',color:'#087d43',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>View</button>
              <button style={{flex:1,padding:'8px',background:'#fff',border:'1px solid #bfe1d0',color:'#087d43',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>Download</button>
            </div>
          </div>)}
        </div>
        <div style={{textAlign:'right',marginTop:'16px'}}>
          <a href="#" style={{color:'#087d43',fontSize:'13px',fontWeight:'600',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'4px'}}>Download All{ayur?' Reports':''} <Download size={14}/></a>
        </div>
      </div>
    </Section>
    
    <Section n={ayur?'4':'3'} title={ayur?'Ayurvedic Prescription & Medicines':'Prescription & Advice (Doctor)'} action={<div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'16px'}}><span style={{color:'#64748b',fontSize:'13px'}}>Saved as Draft</span><button style={{background:'#087d43',color:'#fff',border:'none',padding:'10px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:'600',display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>Download Prescription <Download size={16}/></button></div>}>
      {!ayur ? (
        <div className="dp-med">
          <b style={{display:'block',marginBottom:'16px',color:'#0f172a',fontSize:'14px'}}>Prescription (Allopathic Medicines)</b>
          <div style={{display:'grid',gridTemplateColumns:'30px 1.5fr 1fr 1fr 1fr 1.5fr 40px',gap:'12px',marginBottom:'12px',padding:'0 12px',color:'#64748b',fontSize:'13px',fontWeight:'600'}}>
            <span></span><span>Medicine</span><span>Dosage</span><span>Frequency</span><span>Duration</span><span>Instructions</span><span>Action</span>
          </div>
          {meds.map((r,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'30px 1.5fr 1fr 1fr 1fr 1.5fr 40px',gap:'12px',alignItems:'center',marginBottom:'12px'}}>
            <span style={{color:'#64748b',fontWeight:'600',textAlign:'center'}}>{i+1}.</span>
            <input style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none'}} value={r.medicine} placeholder="Medicine Name" onChange={e=>edit(i,'medicine',e.target.value)}/>
            <select style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none',background:'#fff'}} value={r.dosage} onChange={e=>edit(i,'dosage',e.target.value)}>
              <option>1 Tablet</option><option>2 Tablets</option><option>1/2 Tablet</option><option>5 ml</option><option>10 ml</option>
            </select>
            <select style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none',background:'#fff'}} value={r.frequency} onChange={e=>edit(i,'frequency',e.target.value)}>
              <option>Before Breakfast</option><option>After Meals</option><option>As Needed</option><option>Twice a Day</option><option>Thrice a Day</option>
            </select>
            <select style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none',background:'#fff'}} value={r.duration} onChange={e=>edit(i,'duration',e.target.value)}>
              <option>3 Days</option><option>5 Days</option><option>7 Days</option><option>10 Days</option><option>15 Days</option><option>1 Month</option>
            </select>
            <input style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none'}} value={r.instructions} placeholder="Instructions" onChange={e=>edit(i,'instructions',e.target.value)}/>
            <button onClick={()=>setMeds(v=>v.filter((_,j)=>j!==i))} style={{border:'1px solid #fecdd3',background:'#fff0f2',color:'#e63946',width:'40px',height:'40px',borderRadius:'8px',display:'grid',placeItems:'center',cursor:'pointer'}}><Trash2 size={18}/></button>
          </div>)}
          <button onClick={add} style={{background:'#fff',border:'1px solid #bfe1d0',color:'#087d43',padding:'10px 16px',borderRadius:'8px',fontSize:'14px',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'8px',marginTop:'8px',cursor:'pointer'}}><Plus size={16}/> Add Medicine</button>
        </div>
      ) : (
        <div className="dp-med">
          <div style={{display:'grid',gridTemplateColumns:'30px 1.5fr 1fr 1.5fr 1.5fr 1fr 40px',gap:'12px',marginBottom:'12px',padding:'0 12px',color:'#64748b',fontSize:'13px',fontWeight:'600'}}>
            <span>#</span><span>Medicine</span><span>Dose</span><span>Anupana (With)</span><span>When to Take</span><span>Duration</span><span>Action</span>
          </div>
          {ayurMeds.map((r,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'30px 1.5fr 1fr 1.5fr 1.5fr 1fr 40px',gap:'12px',alignItems:'center',marginBottom:'12px'}}>
            <span style={{color:'#64748b',fontWeight:'600',textAlign:'center'}}>{i+1}</span>
            <input style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none',fontWeight:'600',color:'#0f172a'}} value={r.medicine} placeholder="Medicine Name" onChange={e=>editAyur(i,'medicine',e.target.value)}/>
            <input style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none'}} value={r.dosage} placeholder="Dose" onChange={e=>editAyur(i,'dosage',e.target.value)}/>
            <input style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none'}} value={r.anupana} placeholder="Anupana" onChange={e=>editAyur(i,'anupana',e.target.value)}/>
            <input style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none'}} value={r.whenToTake} placeholder="When to Take" onChange={e=>editAyur(i,'whenToTake',e.target.value)}/>
            <select style={{border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px',fontSize:'14px',outline:'none',background:'#fff'}} value={r.duration} onChange={e=>editAyur(i,'duration',e.target.value)}>
              <option>15 Days</option><option>30 Days</option><option>45 Days</option><option>60 Days</option>
            </select>
            <button onClick={()=>setAyurMeds(v=>v.filter((_,j)=>j!==i))} style={{border:'1px solid #fecdd3',background:'#fff0f2',color:'#e63946',width:'40px',height:'40px',borderRadius:'8px',display:'grid',placeItems:'center',cursor:'pointer'}}><Trash2 size={18}/></button>
          </div>)}
          <button onClick={addAyur} style={{background:'#fff',border:'1px solid #bfe1d0',color:'#087d43',padding:'10px 16px',borderRadius:'8px',fontSize:'14px',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'8px',marginTop:'8px',cursor:'pointer'}}><Plus size={16}/> Add Medicine</button>
        </div>
      )}
      <div style={{marginTop:'32px'}}>
        <b style={{display:'block',marginBottom:'12px',color:'#0f172a',fontSize:'14px'}}>Diet & Lifestyle Advice</b>
        <textarea style={{width:'100%',minHeight:'120px',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'16px',fontSize:'14px',lineHeight:'1.6',outline:'none',color:'#334155',resize:'vertical',fontFamily:'inherit'}} value={ayur?ayurAdvice:advice} onChange={e=>ayur?setAyurAdvice(e.target.value):setAdvice(e.target.value)} />
        <div style={{textAlign:'right',fontSize:'12px',color:'#64748b',marginTop:'8px'}}>166 / 500</div>
      </div>
    </Section>
    
    <div className="dp-end" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#eef5ff',padding:'16px 24px',borderRadius:'12px',marginTop:'20px'}}>
      <p style={{margin:0,color:'#0878f9',display:'flex',alignItems:'center',gap:'8px',fontSize:'14px',fontWeight:'500'}}><span style={{width:'20px',height:'20px',borderRadius:'50%',background:'#0878f9',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'bold'}}>i</span> Please review all details before ending the session.</p>
      <button onClick={finish} style={{background:'#087d43',color:'#fff',border:'none',padding:'12px 24px',borderRadius:'8px',fontSize:'15px',fontWeight:'600',display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>End Session <span style={{fontSize:'18px'}}>→</span></button>
    </div>
  </main>;
}`;

content = content.replace(/function Drawer\(\{p,intake,reports,close,start\}\)\{.*?\}/s, newDrawer);
content = content.replace(/function Consultation\(\{p,intake,reports,ayur,back,end\}\)\{.*?\}/s, newConsultation);

// Make Top Component English Button nicer
content = content.replace(
  '<button><Globe2/>English<ChevronDown/></button>',
  '<button style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"20px",padding:"8px 16px",display:"flex",alignItems:"center",gap:"8px",fontWeight:"500",fontSize:"14px",color:"#334155",cursor:"pointer"}}><Globe2 size={16}/> English <ChevronDown size={16}/></button>'
);
// Notification bell in top bar
content = content.replace(
  '<div className="dp-doc">',
  '<button style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"50%",width:"40px",height:"40px",display:"grid",placeItems:"center",position:"relative",cursor:"pointer"}}><span style={{position:"absolute",top:"-2px",right:"-2px",background:"#e63946",color:"#fff",fontSize:"10px",fontWeight:"bold",borderRadius:"10px",padding:"2px 6px"}}>2</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></button><div className="dp-doc">'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated PhysicianDashboard.jsx');
