// console.log(moment());
moment.locale('hu');

var expireDates = {};
var lastTasks;

var serverDate;

var int;
function setInt() {
  //TODO: task frissítéshez áttenni? - bizonytalan
  int = setInterval(() => {
    let _expireDates = expireDates;
    for (var key in _expireDates) {
      if (_expireDates.hasOwnProperty(key)) {
        // console.log(key + " -> " + _expireDates[key]);
        let s = moment(_expireDates[key]).diff(moment(), 'seconds')
        let t;
          // obj = lastTasks.indexOf(obj);
        if (s < 0) {
          // console.log(moment(_expireDates[key]).diff(serverDate));
          var obj = lastTasks.filter(item => item.ProblemId == key);
          obj[0].status = 'missed';
          // console.log(lastTasks);
          t='Lejárt';
          setCard(obj[0], _expireDates);
          delete expireDates[key];
        }
        else {
          t=`<strong>Hátralévő idő: ${moment.utc(1000*s).format(s >= 3600 ? 'hh:mm:ss' : 'mm:ss')}</strong>`;
        }
        // expireDates = _expireDates;
        document.getElementById(`footer_${key}`).innerHTML = t;
        // el(key, 'footer').innerHTML = t;
      }
    }
  }, 100); 
}



function setCard(task, _expireDates) {
  let m = moment(serverDate, 'YYYY-MM-DD HH:mm:ss ms');
  
  let P = task.Problem;
  
  function el(el) {
    return document.getElementById(`${el}_${P.id}`);
  }
  
  let config = {
    //cardStyle, headerStyle, headerIcon, headerTitle, titleStyle, class, buttonHref, buttonTitle, footerHidden
    locked: ['border-color:grey!important;', 'color:grey;', 'lock', 'Zárolva', 'color:darkgrey;', 'info', '', '', true] ,
    waitingForResearch: ['', '', 'lock_open', 'Elérhető', '', 'info', `research(${P.id});`, `Felkutatás (${P.researchCost})`, true] ,
    waitingForUndertake: ['', '', 'touch_app', 'Elvállalható', '', 'info', `undertake(${P.id});`, `Elfogadás (${P.undertakeCost})`, false] ,
    available: ['border-color:#ffc107!important;', '', 'alarm', 'Megoldásra vár', '', 'warning', `moveTo('./problem/${P.id}');`, 'Ugrás a feladatra', false] ,
    missed: ['border-color:red!important;', '', 'close', 'Sikertelen', '', 'danger', ``, 'Lejárt feladat megtekintése', true] ,
    done: ['border-color:green!important;', '', 'done', 'Megoldva', '', 'success', '', '', true]
  }
  // if (task.status == 'locked') return;
  config = config[task.status];
  //DEF:
  // !!! <---- console.log(config, P);
  el('card').style.cssText = 'max-width:18rem;';
  el('card').style.cssText += config[0];
  
  el('title').style.cssText = 'padding:0px!important;';
  el('title').style.cssText += config[4];
  //color:darkgrey;padding:0px!important;

  el('header').style.cssText = config[1];
  el('header').innerHTML = `<i style="float:right;" class="material-icons">${config[2]}</i>${config[3]}`;
  el('footer').hidden = config[8];
  // el('footer').style.cssText = config[0];
  
  if (config[6]) {
    el('button').innerHTML = `<button type="button" onclick="${config[6]}" style="margin-top:5px;" class="btn btn-outline-${config[5]}">${config[7]}</button>`;
    // el('things').style.marginBottom = "16px";
  }
  else {
    el('button').innerHTML = ``;
  }
  el('things').style.marginBottom = "0px";
  
  
  if (P.topic && ['waitingForUndertake', 'available', 'missed', 'done'].includes(task.status)) {
    el('things').hidden = false;
    var t = P.topic.split(', ');
    t.forEach((element, index) => {
      t[index] = `<span style="margin-bottom:3px;" class="badge badge-${config[5]}">${element}</span>`;
    });
    el('things').innerHTML = t.join(' ');
  }
  //FIXME: más esetben elrejteni
  
  if (P.credit && ['waitingForUndertake', 'available'].includes(task.status)) {
    el('credit').innerHTML = `<strong>[${P.credit}]</strong>`;
  }
  else { 
    el('credit').innerHTML = '';
  }

  switch (task.status) {
    case 'waitingForUndertake':
      el('footer').innerHTML = `Időkorlát: ${moment.utc(1000*P.timeLimit).format('mm:ss')}`;
      break;
    case 'available':
      var diff = moment(task.expireDate).diff(m, 'milliseconds');
      _expireDates[task.ProblemId] = moment().add(diff, 'milliseconds');
      break;
  }
}

var socket = io('/stock-exchange');

window.onload = function () {
  setInt();
}
socket.on('updateTasks', (tasks, m, credits) => {
  console.log(tasks);

  if (credits != null) document.getElementById('teamCredits').innerHTML = credits;
  
  serverDate = m;
  clearInterval(int);
  
  var _expireDates = {}// = expireDates;
  // var _expireDates = expireDates;

  lastTasks = tasks
  for (var i=0; i<lastTasks.length; i++){
    lastTasks[i] = $.extend(true, { }, lastTasks[i]);
  }
  lastTasks.forEach(task => {
    setCard(task, _expireDates);
  });
  expireDates = _expireDates;
  setInt();
});

socket.on('refresh', ()=>{
  location.reload();
});

socket.on('err', msg => {
  console.error(msg);
  var s = `<div style="margin-top:5px;" class="alert alert-dismissible alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Hiba!</strong> ${msg}</div>`;
  document.getElementById('errDiv').innerHTML += s;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // document.getElementById('header').scrollIntoView();
});

function moveTo(location) {
  window.location = location;
}

function research(id) {
  console.log('research:', id);
  socket.emit('research', id);
}

function undertake(id) {
  console.log('undertake:', id);
  socket.emit('undertake', id);
}