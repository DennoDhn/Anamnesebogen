"use strict";
const questions=["unterbricht andere beim Sprechen.", "ist immer auf Achse, wie von einem Motor getrieben.", "ist schlecht organisiert.", "kann nur schwer für sehr lange Zeit an einem Platz bleiben.", "hat Schwierigkeiten, mehrere Dinge gleichzeitig im Blick zu behalten.", "ist schnell gelangweilt.", "ist leicht aufbrausend/hat ein hitziges Temperament.", "hat noch immer Wutanfälle.", "vermeidet neue Herausforderungen mangels Vertrauen in ihre Fähigkeiten.", "sucht sich schnelle, aufregende Aktivitäten.", "fühlt sich innerlich unruhig, selbst wenn sie still sitzt.", "ist beim Versuch, sich zu konzentrieren, leicht abgelenkt durch Dinge, die sie sieht oder hört.", "ist durch viele Dinge leicht irritierbar.", "bleibt mit ihren Leistungen in der Schule/bei Tätigkeiten hinter ihren Fähigkeiten zurück.", "ist übermäßig selbstkritisch.", "verhält sich nach außen hin normal, ist aber innerlich unsicher.", "erledigt Angelegenheiten nicht, außer unter hohem äußeren Termindruck.", "hat Schwierigkeiten, mit einer Aufgabe zu beginnen.", "mischt sich in die Aktivitäten anderer Leute ein.", "ist unvorhersehbar launisch.", "ist bei alltäglichen Aktivitäten geistig abwesend.", "ist manchmal mit etwas so beschäftigt, dass sie nichts um sich herum mitbekommt; bei anderen Gelegenheiten wird sie von allem abgelenkt.", "neigt dazu, herumzurutschen oder zu zappeln.", "kann sich nicht konzentrieren, außer es ist wirklich interessant.", "wünschte, sie hätte größeres Vertrauen in ihre Fähigkeiten.", "Ihr Versagen in der Vergangenheit macht es ihr schwer, an sich selbst zu glauben."];

let records=[];
const $=id=>document.getElementById(id), key='fremdeinschaetzungen-v1';
const notify=text=>$('msg').textContent=text;
function validate(r){
 if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.trim().length>80||/[\r\n]/.test(r.name)||!Array.isArray(r.answers)||r.answers.length!==26||!r.answers.every(v=>Number.isInteger(v)&&v>=0&&v<=3))throw Error('Ungültige Datei: Name und genau 26 ganzzahlige Bewertungen von 0 bis 3 erforderlich.');
 if(r.format&&r.format!=='fremdeinschaetzung-v1')throw Error('Unbekannte Formularversion.');
 for(const k of ['timestamp','date','format'])if(r[k]!=null&&(typeof r[k]!=='string'||r[k].length>100))throw Error('Ungültige Zusatzdaten.');
 return {name:r.name.trim(),answers:[...r.answers],format:r.format||'fremdeinschaetzung-v1',...(r.timestamp?{timestamp:r.timestamp}:{}),...(r.date?{date:r.date}:{})};
}
function parse(text){
 const lines=text.trim().split(/\r?\n/).map(s=>s.trim()), ans=Array(26).fill(null);let name, date,format;
 for(const line of lines){
  if(line.startsWith('Name:')){if(name!==undefined)throw Error('Mehrere Namen im Antworttext.');name=line.slice(5).trim()}
  else if(line.startsWith('Datum:'))date=line.slice(6).trim();
  else if(line.startsWith('Version:'))format=line.slice(8).trim();
  else if(/^\d/.test(line)){
   const m=line.match(/^(\d+):\s*([0-3])(?:\s+[–-]\s+.*)?$/);
   if(!m)throw Error('Ungültige Antwortzeile: '+line);
   const n=Number(m[1])-1;if(n<0||n>=26||ans[n]!==null)throw Error('Ungültige oder doppelte Fragennummer.');ans[n]=Number(m[2]);
  }else if(line&&!/^FREMDEINSCHÄTZUNG|^Bewertungen\s*\(|^Rohsumme:/.test(line))throw Error('Unbekannte Zeile: '+line);
 }
 return validate({name,answers:ans,date,format});
}
function same(a,b){return a.name.toLocaleLowerCase('de')===b.name.toLocaleLowerCase('de')&&a.answers.every((v,i)=>v===b.answers[i])}
function add(batch){const checked=batch.map(validate);let added=0;for(const r of checked){if(!records.some(x=>same(x,r))){records.push(r);added++}}render();notify(added+' Rückmeldung(en) hinzugefügt. '+(checked.length-added)+' Duplikat(e) übersprungen.');}
$('add').onclick=()=>{try{add([parse($('text').value)]);$('text').value=''}catch(e){notify(e.message)}};
$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>2000000)throw Error('Datei zu groß (maximal 2 MB).');const data=JSON.parse(await f.text());let batch;if(Array.isArray(data))batch=data;else if(data.format==='fremdeinschaetzungen-backup-v1'&&Array.isArray(data.records))batch=data.records;else batch=[data];add(batch)}catch(e){notify('Import nicht übernommen: '+e.message)}finally{$('file').value=''}};
function save(){try{if($('persist').checked)localStorage.setItem(key,JSON.stringify(records));else localStorage.removeItem(key)}catch(e){$('persist').checked=false;notify('Speicherung nicht verfügbar. Bitte eine JSON-Sicherung herunterladen.')}}
$('persist').onchange=()=>{save()};
$('clear').onclick=()=>{if(records.length&&!confirm('Alle Rückmeldungen und die lokale Sicherung löschen?'))return;records=[];$('persist').checked=false;render();notify('Alle Rückmeldungen gelöscht.');};
function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}
function render(){
 $('count').textContent=records.length+' Rückmeldung(en)';for(const id of ['json','csv','print'])$(id).disabled=!records.length;
 $('table').replaceChildren();records.forEach((r,i)=>{const card=el('article');card.className='card';card.append(el('h3',r.name));card.append(el('p','Rohsumme: '+r.answers.reduce((a,b)=>a+b,0)+'/78 · keine Diagnoseberechnung'));
 const meta=el('p',(r.date|| (r.timestamp?new Date(r.timestamp).toLocaleDateString('de-DE'):'Datum nicht angegeben'))+' · '+r.format);meta.className='small';card.append(meta);
 const details=el('details');details.open=true;details.append(el('summary','26 Antworten ansehen'));const table=el('table');const thead=el('thead'),hr=el('tr');for(const t of ['Aussage','Wert'])hr.append(el('th',t));thead.append(hr);table.append(thead);const tbody=el('tbody');questions.forEach((q,j)=>{const tr=el('tr');tr.append(el('td',(j+1)+'. '+q),el('td',r.answers[j]));tbody.append(tr)});table.append(tbody);details.append(table);card.append(details);
 const remove=el('button','Rückmeldung löschen');remove.className='btn secondary no-print';remove.onclick=()=>{if(confirm('Rückmeldung von '+r.name+' löschen?')){records.splice(i,1);render();notify('Rückmeldung gelöscht.')}};card.append(remove);$('table').append(card)});save();
}
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('json').onclick=()=>download(JSON.stringify({format:'fremdeinschaetzungen-backup-v1',records},null,2),'application/json','fremdeinschaetzungen-sicherung.json');
function csvCell(v){if(typeof v==='string'&&/^\s*[=+@-]/.test(v))v="'"+v;return '"'+String(v).replace(/"/g,'""')+'"'}
$('csv').onclick=()=>{const rows=[['Name','Datum','Version',...questions.map((_,i)=>'F'+(i+1)),'Rohsumme'],...records.map(r=>[r.name,r.date||r.timestamp||'',r.format,...r.answers,r.answers.reduce((a,b)=>a+b,0)])];download('\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8','fremdeinschaetzungen-vergleich.csv')};
$('print').onclick=()=>window.print();
try{const saved=localStorage.getItem(key);if(saved){const data=JSON.parse(saved);if(!Array.isArray(data))throw Error();records=data.map(validate);$('persist').checked=true;render()}}catch(e){notify('Lokale Sicherung konnte nicht geladen werden. Bitte JSON-Sicherung importieren.');}
