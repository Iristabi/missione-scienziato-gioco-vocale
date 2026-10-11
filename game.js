const QUESTIONS = [
  {category:'OSSERVAZIONE',icon:'🔍',question:'Qual è il primo passo del metodo sperimentale?',answer:'Osservare un fenomeno.',keys:[['osserv','fenomen']],teach:'Si comincia osservando con attenzione un fenomeno.'},
  {category:'DOMANDA',icon:'❓',question:'Dopo aver osservato, che cosa fa lo scienziato?',answer:'Si pone una domanda.',keys:[['domand'],['problema']],teach:'Esatto: formula una domanda o un problema da risolvere.'},
  {category:'IPOTESI',icon:'💭',question:'Che cos’è un’ipotesi?',answer:'Una possibile spiegazione.',keys:[['possibil','spieg'],['risposta','provvisor'],['idea','verific']],teach:'Un’ipotesi è una spiegazione possibile da verificare.'},
  {category:'ESPERIMENTO',icon:'🧪',question:'Come si verifica un’ipotesi?',answer:'Con un esperimento.',keys:[['esperiment'],['prova']],teach:'Si prepara un esperimento o una prova.'},
  {category:'VARIABILI',icon:'🎚️',question:'In un esperimento corretto, quante cose cambiamo alla volta?',answer:'Una sola cosa.',keys:[['una','cosa'],['una','variabil'],['solo','una']],teach:'Si cambia una sola variabile alla volta.'},
  {category:'DATI',icon:'📊',question:'Che cosa raccogliamo durante un esperimento?',answer:'Dati e risultati.',keys:[['dat'],['risultat'],['misur'],['informaz']],teach:'Raccogliamo dati, misure e risultati.'},
  {category:'CONCLUSIONE',icon:'🧩',question:'Che cosa facciamo dopo aver guardato i risultati?',answer:'Traiamo una conclusione.',keys:[['conclusion'],['decid'],['capire','ipotes']],teach:'Usiamo i risultati per arrivare a una conclusione.'},
  {category:'IPOTESI DA CAMBIARE',icon:'🔄',question:'Se i risultati non confermano l’ipotesi, che cosa facciamo?',answer:'Cambiamo l’ipotesi e riproviamo.',keys:[['cambi','ipotes'],['nuov','ipotes'],['ripro'],['ripet']],teach:'Nessun problema: cambiamo l’ipotesi e proviamo di nuovo.'},
  {category:'RIPETIZIONE',icon:'♻️',question:'Perché un esperimento si ripete?',answer:'Per controllare che il risultato sia affidabile.',keys:[['controll'],['conferm'],['sicuro'],['affidabil'],['stesso','risultat']],teach:'Ripetere serve a controllare che il risultato sia affidabile.'},
  {category:'CONDIVISIONE',icon:'📣',question:'Alla fine, che cosa fa lo scienziato con le sue scoperte?',answer:'Comunica i risultati.',keys:[['comunic'],['condivid'],['raccont'],['present','risultat']],teach:'Lo scienziato comunica e condivide i risultati.'}
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
function finish(){showScreen('#resultsScreen');$('#finalScore').textContent=score;$('#starLine').textContent='★'.repeat(score)+'☆'.repeat(QUESTIONS.length-score);let title=score===10?'Scienziato stellare!':score>=7?'Che scienziato!':score>=4?'Ottimo lavoro!':'La curiosità è il tuo superpotere!';let msg=score>=7?'Hai osservato, pensato e sperimentato alla grande.':'Ogni prova è una nuova scoperta. Giochiamo ancora?';$('#resultTitle').textContent=title;$('#resultMessage').textContent=msg}
function showToast(text){const t=$('#toast');t.textContent=text;t.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.hidden=true,4000)}
$('#startButton').onclick=startGame;$('#replayButton').onclick=startGame;$('#restartButton').onclick=()=>{if(confirm('Vuoi ricominciare dalla prima missione?'))startGame()};$('#micButton').onclick=startListening;$('#nextButton').onclick=next;$('#checkTyped').onclick=()=>{const value=$('#typedAnswer').value.trim();if(value)evaluate(value);else showToast('Scrivi una risposta breve.')};$('#typedAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')$('#checkTyped').click()});
window.MissioneScienziato={QUESTIONS,normalize,isCorrect};
