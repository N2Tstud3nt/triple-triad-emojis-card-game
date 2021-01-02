
    function card_template(i, card, draggable = true) {
      let cost = 0;
      for (let i=0; i<4; i++) {
        if (card[i]===0) {
            card[i]="";
        } else {
            cost += (card[i]=='A' ? 10 : card[i]);
        }
      }
      return '<div id="deck-card-'+i+'" class="grid-container" draggable='+draggable+' ondragstart="drag(event)" >'+
    '<div class="grid-item card-team"><div class="noselect inner" ></div><div class="overlay-card noselect">'+(i[0]=='p'?'#':(i[0]=='b'?'O':'X'))+'</div></div>'+
    '<div class="grid-item card-point card-point-1 cp-top"><div class="noselect crot45"></div><div class="overlay-card noselect crot45">'+card[0]+'</div></div>'+
    '<div class="grid-item card-cost"><div class="noselect inner" ></div><div class="overlay-card noselect cost-point">'+(cost===0?"":cost)+'</div></div>'+ 
    '<div class="grid-item card-point card-point-4 cp-lef"><div class="noselect crot45"></div><div class="overlay-card noselect crot45">'+card[3]+'</div></div>'+
    '<div class="grid-item card-center"><div class="noselect crot45"></div><div class="overlay-card noselect crot45"><small>'+card[6]+'</small></div></div>'+
    '<div class="grid-item card-point card-point-2 cp-rig"><div class="noselect crot45"></div><div class="overlay-card noselect crot45">'+card[1]+'</div></div>'+
    '<div class="grid-item ability-point ability-left abi "><div class="noselect inner" ></div><div class="overlay-card noselect"><div class="div-point offset-top">'+card[4]+'</div></div></div>'+
    '<div class="grid-item card-point card-point-3 cp-bot"><div class="noselect crot45"></div><div class="overlay-card noselect crot45">'+card[2]+'</div></div>'+
    '<div class="grid-item ability-point ability-right abi"><div class="noselect inner" ></div><div class="overlay-card noselect"><div class="div-point offset-top">'+card[5]+'</div></div></div>'+
    '</div>';
    }