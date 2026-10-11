const QUESTIONS = [
  {category:'SCIENZIATI',icon:'🔍',question:'Che cosa fanno gli scienziati?',answer:'Osservano e spiegano i fenomeni.',keys:[['osserv','spieg','fenomen']],teach:'Osservano e spiegano i fenomeni.'},
  {category:'NATURA',icon:'⛈️',question:'Quale di questi è un fenomeno naturale?',answer:'Un temporale.',keys:[['temporal']],teach:'Un temporale.'},
  {category:'METODO',icon:'🧪',question:'Come si chiama il metodo usato dagli scienziati?',answer:'Metodo scientifico.',keys:[['metodo','scientific']],teach:'Metodo scientifico.'},
  {category:'PRIME FASI',icon:'💭',question:'Quali sono le prime tre fasi del metodo scientifico?',answer:'Osservare, fare domande, formulare ipotesi.',keys:[['osserv','domand','ipotes']],teach:'Osservare, fare domande, formulare ipotesi.'},
  {category:'ULTIME FASI',icon:'📋',question:'Quali sono le ultime tre fasi?',answer:'Fare esperimenti, registrare dati, concludere.',keys:[['esperiment','dat','conclu']],teach:'Fare esperimenti, registrare dati, concludere.'},
  {category:'IPOTESI',icon:'💭',question:'Perché gli scienziati formulano ipotesi?',answer:'Per cercare di spiegare i fenomeni.',keys:[['spieg','fenomen'],['capire','natura'],['capire','succede']],teach:'Per cercare di spiegare i fenomeni.'},
  {category:'SPIEGAZIONE',icon:'🧩',question:"Che cos'è un'ipotesi?",answer:'Una possibile spiegazione.',keys:[['possibil','spieg'],['spieg','succede'],['idea','spieg']],teach:'Una possibile spiegazione.'},
  {category:'INDIZI',icon:'🔍',question:'A chi assomiglia uno scienziato che cerca spiegazioni?',answer:'A un detective che cerca indizi.',keys:[['detective'],['investigator']],teach:'A un detective che cerca indizi.'},
  {category:'ESPERIMENTI',icon:'🧪',question:'Perché gli scienziati fanno esperimenti?',answer:'Per verificare le ipotesi.',keys:[['verific','ipotes'],['controll','ipotes'],['ipotes','giust'],['ipotes','corrett']],teach:'Per verificare le ipotesi.'},
  {category:'MENTE E MANI',icon:'👐',question:'Che cosa usano gli scienziati per fare esperimenti?',answer:'La mente per pensare e le mani per provare.',keys:[['mente','mani'],['pens','prov']],teach:'La mente per pensare e le mani per provare.'}
];
const $=s=>document.querySelector(s); const screens=['#startScreen','#gameScreen','#resultsScreen'];
let index=0,score=0,attempts=0,recognition=null,listening=false,answered=false,transcript='',finishRequested=false;
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
function normalize(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function isCorrect(text,q){const n=normalize(text);return q.keys.some(group=>group.every(k=>n.includes(normalize(k))))}
function showScreen(id){screens.forEach(s=>$(s).classList.toggle('active',s===id))}
function guideState(state,line){const guide=$('#guideWrap');guide.className=`guide-wrap ${state||''}`;if(line)$('#guideLine').textContent=line}
function renderQuestion(){answered=false;attempts=0;const q=QUESTIONS[index];$('#progressLabel').textContent=`Missione ${index+1} di ${QUESTIONS.length}`;$('#progressFill').style.width=`${(index+1)/QUESTIONS.length*100}%`;$('#scoreValue').textContent=score;$('#category').textContent=q.category;$('#missionIcon').textContent=q.icon;$('#questionText').textContent=q.question;$('#feedback').hidden=true;$('#nextButton').hidden=true;$('#heardBox').hidden=true;$('#typedAnswer').value='';guideState('',q.question);resetMic()}
function resetMic(){listening=false;$('#micButton').textContent='🎙️';$('#micButton').setAttribute('aria-label','Premi per rispondere');$('#answerZone').classList.remove('listening');$('#micTitle').textContent=SpeechRecognition?'Premi il microfono':'Scrivi la risposta qui sotto';$('#micHelp').textContent=SpeechRecognition?'Poi rispondi con una frase breve':'Il riconoscimento vocale non è disponibile in questo browser';$('#fallbackBox').hidden=!!SpeechRecognition}
function startGame(){index=0;score=0;showScreen('#gameScreen');renderQuestion()}
function startListening(){
  if(answered)return;
  if(!SpeechRecognition){$('#fallbackBox').hidden=false;$('#typedAnswer').focus();return}
  if(listening){finishRequested=true;recognition.stop();return}
  transcript='';finishRequested=false;
  recognition=new SpeechRecognition();
  recognition.lang='it-IT';recognition.interimResults=true;recognition.continuous=true;
  recognition.onstart=()=>{
    listening=true;guideState('listening-guide','Ti ascolto. Prenditi tutto il tempo!');
    $('#answerZone').classList.add('listening');
    $('#micTitle').textContent='Premi quando hai finito';
    $('#micHelp').textContent='Puoi fare delle pause. Premi di nuovo per inviare.';
    $('#micButton').textContent='✓';$('#micButton').setAttribute('aria-label','Ho finito');
  };
  let collected='';
  recognition.onresult=e=>{
    let finalPart='',interim='';
    for(let i=0;i<e.results.length;i++){if(e.results[i].isFinal)finalPart+=e.results[i][0].transcript+' ';else interim+=e.results[i][0].transcript+' '}
    transcript=(collected+' '+finalPart+' '+interim).trim();
    $('#heardText').textContent=transcript;$('#heardBox').hidden=false;
  };
  recognition.onerror=e=>{
    if(e.error==='no-speech')return;
    finishRequested=true;resetMic();$('#fallbackBox').hidden=false;
    showToast(e.error==='not-allowed'?'Consenti il microfono oppure scrivi la risposta.':'Il microfono non è disponibile. Puoi scrivere la risposta.');
  };
  recognition.onend=()=>{
    if(!finishRequested&&listening&&!answered){
      collected=transcript;
      try{recognition.start();return}catch(e){finishRequested=true}
    }
    resetMic();
    if(finishRequested&&transcript.trim()&&!answered)evaluate(transcript);
    else if(finishRequested&&!transcript.trim())showToast('Non ho sentito la risposta. Riprova.');
  };
  try{recognition.start()}catch(e){resetMic();$('#fallbackBox').hidden=false}
}
function evaluate(text){if(answered)return;resetMic();const q=QUESTIONS[index];$('#heardText').textContent=text;$('#heardBox').hidden=false;if(isCorrect(text,q)){answered=true;score++;$('#scoreValue').textContent=score;guideState('celebrate','Bravissimo! Hai conquistato una stella!');showFeedback(`Bravissimo! ★ ${q.teach}`,'good');$('#nextButton').hidden=false}else{attempts++;if(attempts<2){guideState('thinking','Quasi! Ti do un piccolo indizio…');showFeedback(`Quasi! Un piccolo indizio: ${q.answer}`,'try');$('#fallbackBox').hidden=false}else{answered=true;guideState('thinking','Un buon tentativo è già una scoperta!');showFeedback(`Buon tentativo! La risposta era: ${q.answer}`,'try');$('#nextButton').hidden=false}}
}
function showFeedback(text,type){const el=$('#feedback');el.textContent=text;el.className=`feedback ${type}`;el.hidden=false}
function next(){if(index<QUESTIONS.length-1){index++;renderQuestion()}else finish()}
function finish(){showScreen('#resultsScreen');$('#finalScore').textContent=score;$('#starLine').textContent='★'.repeat(score)+'☆'.repeat(QUESTIONS.length-score);let title=score===QUESTIONS.length?'Scienziato stellare!':score/QUESTIONS.length>=.7?'Che scienziato!':score/QUESTIONS.length>=.4?'Ottimo lavoro!':'La curiosità è il tuo superpotere!';let msg=score/QUESTIONS.length>=.7?'Hai osservato, pensato e sperimentato alla grande.':'Ogni prova è una nuova scoperta. Giochiamo ancora?';$('#resultTitle').textContent=title;$('#resultMessage').textContent=msg}
function showToast(text){const t=$('#toast');t.textContent=text;t.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.hidden=true,4000)}
$('#startButton').onclick=startGame;$('#replayButton').onclick=startGame;$('#restartButton').onclick=()=>{if(confirm('Vuoi ricominciare dalla prima missione?'))startGame()};$('#micButton').onclick=startListening;$('#nextButton').onclick=next;$('#checkTyped').onclick=()=>{const value=$('#typedAnswer').value.trim();if(value)evaluate(value);else showToast('Scrivi una risposta breve.')};$('#typedAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')$('#checkTyped').click()});
window.MissioneScienziato={QUESTIONS,normalize,isCorrect};
