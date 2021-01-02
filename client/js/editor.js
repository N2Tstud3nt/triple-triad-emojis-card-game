/** EDITOR JS **/

    function drag(e) {}

    function refresh_deck_cost() {
      document.getElementById("main-title").innerText = "Build A Deck ("+document.deck_price+"/"+window.max_deck_cost+")";
      if (document.deck_price>window.max_deck_cost) {
        document.getElementById("main-title").style.color  = "RED";
      } else {
        document.getElementById("main-title").style.color  = "BLACK";
      }
    }

    function refresh_card_cost(root) {
      let cost_element = root.getElementsByClassName("cost-point")[0];
      let labi_element = root.getElementsByClassName("ability-left")[0];
      let rabi_element = root.getElementsByClassName("ability-right")[0];
      if (parseInt(cost_element.innerText) > window.max_card_cost + (labi_element.innerText==='⭐')*7 + (rabi_element.innerText==='⭐')*7 ) {
          cost_element.style.color  = "RED";
        } else {
          cost_element.style.color  = "BLACK";
        }
      refresh_deck_cost();
    }

    function import_face(root,face,last_deck) {
        if (face===null) {
          //
        } else if (face.length>0){
          if (face.length > window.max_face_length) {
            face = face.substring(0, window.max_face_length);
          }
          if (face[0]!=" " && !hasNumber(face) && face.toUpperCase() === face.toLowerCase()) {
            root.innerText = face;
            let card_id = root.parentNode.parentNode.parentNode.id.slice(-1);
            if (card_id=="") {
              card_id = root.parentNode.parentNode.id.slice(-1);
            }
            last_deck[card_id-1][6] = face;
            localStorage.setItem("last_deck", JSON.stringify(last_deck));
          }
        }
    }

    function import_card(root,code,last_deck) {
      code = code.toUpperCase();
      let cost_element = root.getElementsByClassName("cost-point")[0];
      let card_point = [0,0,0,0];
      card_point[0] = root.getElementsByClassName("card-point-1")[0].childNodes[1];
      card_point[1] = root.getElementsByClassName("card-point-2")[0].childNodes[1];
      card_point[2] = root.getElementsByClassName("card-point-3")[0].childNodes[1];
      card_point[3] = root.getElementsByClassName("card-point-4")[0].childNodes[1];
      let labi_element = root.getElementsByClassName("ability-left")[0].childNodes[1].childNodes[0];
      let rabi_element = root.getElementsByClassName("ability-right")[0].childNodes[1].childNodes[0];
      let face_element = root.getElementsByTagName("small")[0];
      for (let i=0; i<4; i++) {
        if (code.length>i && (hasNumber(code[i]) || code[i]==='A')) {
          document.deck_price -= (card_point[i].innerText==='A'?10:parseInt(card_point[i].innerText));
          card_point[i].innerText = code[i];
          document.deck_price += (code[i]==='A'?10:parseInt(code[i]));
        }
        card_point[i] = (card_point[i].innerText==='A'?10:parseInt(card_point[i].innerText));
      }
      cost_element.innerText = (card_point[0]+card_point[1]+card_point[2]+card_point[3]);
      if (code.length>4) {
        if (window.ability_letters.includes(code[4])) {
          labi_element.innerText = window.ability_icons2[code[4]];
        } else if (parseInt(code[4])<=9 && parseInt(code[4])>=1) {
          labi_element.innerText = window.ability_icons[parseInt(code[4])];
        }
      }
      if (code.length>5) {
        if (window.ability_letters.includes(code[5])) {
          rabi_element.innerText = window.ability_icons2[code[5]];
        } else if (parseInt(code[5])<=9 && parseInt(code[5])>=1) {
          rabi_element.innerText = window.ability_icons[parseInt(code[5])];
        }
      }
      refresh_card_cost(root);
      let point_id = root.parentNode.id.slice(-1);
      for (let i=0; i<4; i++)
        last_deck[point_id-1][i] = (card_point[i]>9?'A':card_point[i]);
      last_deck[point_id-1][4] = labi_element.innerText;
      last_deck[point_id-1][5] = rabi_element.innerText;
      localStorage.setItem("last_deck", JSON.stringify(last_deck));
      if (code.length>6) {
        import_face(face_element,code.substring(6, window.max_face_length),last_deck);
      }
    }

    function load_localStorage_deck() {
      // last_deck local storage initialize/load && add clickable css
      let last_deck = [];
      document.deck_price = 0;
      if (localStorage.getItem("last_deck") == null) {
        for (let i=1; i<=6; i++) {
          let card = [1,1,1,1,'⭐','⭐','🤖'];
          document.deck_price +=4;
          document.getElementById("arena-slot-"+i).childNodes[0].insertAdjacentHTML('afterbegin', card_template('p'+i,card));
          last_deck.push(card);
          let components = document.getElementById("arena-slot-"+i).childNodes[0].childNodes[0].childNodes;
          for (let j=0; j<components.length; j++) {
            if (components[j].classList[1] != "card-cost")
              components[j].classList.add("clickable");
          }
        }
        localStorage.setItem("last_deck", JSON.stringify(last_deck));
      } else {
        last_deck = JSON.parse(localStorage.getItem("last_deck"));
        //console.log(last_deck);
        for (let i=1; i<=6; i++) {
          let card = last_deck[i-1];
          for (let i=0; i<4; i++)
            document.deck_price += (card[i]=='A' ? 10 : card[i]);
          document.getElementById("arena-slot-"+i).childNodes[0].insertAdjacentHTML('afterbegin', card_template('p'+i,card));
          refresh_card_cost(document.getElementById("arena-slot-"+i));
          let components = document.getElementById("arena-slot-"+i).childNodes[0].childNodes[0].childNodes;
          for (let j=0; j<components.length; j++) {
            if (components[j].classList[1] != "card-cost")
              components[j].classList.add("clickable");
          }
        }
      }
      return last_deck;
    }

    function load_nickname() {
      if (localStorage.getItem("nickname") === null) {
      } else {
        document.getElementById("nickname-box").value = localStorage.getItem("nickname");
      }
      let save_nickname = function(event) {
        localStorage.setItem("nickname", document.getElementById("nickname-box").value);
      }
      document.getElementById("nickname-box").addEventListener('keyup', save_nickname, false);
    }

    function deck_code(ddeck) {
      let deck = JSON.parse(JSON.stringify(ddeck));
      for (let c=0; c<deck.length; c++) {
        deck[c][4] = ability_ids[deck[c][4]];
        deck[c][5] = ability_ids[deck[c][5]];
      }
      let s = JSON.stringify(deck);
      s=s.replace(/"A"/g,'A');
      s=s.replace(/,/g,'');
      s=s.replace(/\"\]/g,'');
      s=s.replace(/\[\[/g,'');
      s=s.replace(/"/g,'');
      s=s.replace(/\]/g,'');
      s=s.replace(/\[/g,'.');
      return s;
    }

    // Populate click events.
    document.addEventListener('DOMContentLoaded', function() {

      //localStorage.setItem("arena_player", "0");
      //localStorage.setItem("arena_room", "0");

      let last_deck = load_localStorage_deck();
      refresh_deck_cost();

      load_nickname();

      const ability_id = window.ability_ids; //{'⭐':1,'🔥':2,'⚔️':3,'💰':4,'☘️':5,'👋':6,'⛓️':7,'🧛':8,'📌':9};
      const ability_icon = window.ability_icons; //{1:'⭐',2:'🔥',3:'⚔️',4:'💰',5:'☘️',6:'👋',7:'⛓️',8:'🧛',9:'📌'};
      let clickAbility = function(event) {
        let val = (1,(ability_id[event.target.innerText]+1)%10);
        event.target.innerText = ability_icon[(val===0?1:val)];
        let card_id = event.target.parentNode.parentNode.parentNode.id.slice(-1);
        let ability_left = (event.target.parentNode.parentNode.classList[2] === "ability-left");
        if (ability_left) {
          last_deck[card_id-1][4] = event.target.innerText;
        } else {
          last_deck[card_id-1][5] = event.target.innerText;
        }
        localStorage.setItem("last_deck", JSON.stringify(last_deck));
        refresh_card_cost(event.target.parentNode.parentNode.parentNode);
      };

      let clickPoint = function(event) {
        let val = event.target.innerText;
        let cost_element = event.target.parentNode.parentNode.getElementsByClassName("cost-point")[0];
        let card_id = event.target.parentNode.parentNode.id.slice(-1);
        let point_id = event.target.parentNode.classList[2].slice(-1);
        if (val=='A') {
          event.target.innerText = 1;
          last_deck[card_id-1][point_id-1] = 1;
          cost_element.innerText = parseInt(cost_element.innerText)-9;
          document.deck_price -= 9;
        } else {
          event.target.innerText = (val==='9'?'A':(parseInt(val)+1));
          last_deck[card_id-1][point_id-1] = (val==='9'?'A':(parseInt(val)+1));
          cost_element.innerText = parseInt(cost_element.innerText)+1;
          document.deck_price += 1;
        }
        localStorage.setItem("last_deck", JSON.stringify(last_deck));
        refresh_card_cost(event.target.parentNode.parentNode);
      };

      let clickFace = function(event) {
        let face = prompt("Enter an Emoji to represent your card: (emojipedia.org)",event.target.innerText);
        import_face(event.target,face,last_deck);
      }

      let clickTeam = function(event) {
        let root = event.target.parentNode.parentNode.parentNode;
        let code = prompt("Import a card:",deck_code([last_deck[root.parentNode.id.slice(-1)-1]]));
        if (code!= null && code.length>0) {
          import_card(root,code,last_deck);
        }
      }

      // assign click functions
      let elements;
      elements = document.getElementsByClassName("ability-point");
      for (let i=0; i<elements.length; i++) {
        elements[i].getElementsByClassName("div-point")[0].addEventListener('click', clickAbility, false);
      }
      elements = document.getElementsByClassName("card-point");
      for (let i=0; i<elements.length; i++) {
        elements[i].getElementsByClassName("overlay-card")[0].addEventListener('click', clickPoint, false);
      }
      elements = document.getElementsByClassName("card-center");
      for (let i=0; i<elements.length; i++) {
        elements[i].getElementsByClassName("overlay-card")[0].addEventListener('click', clickFace, false);
      }
      elements = document.getElementsByClassName("card-team");
      for (let i=0; i<elements.length; i++) {
        elements[i].getElementsByClassName("overlay-card")[0].addEventListener('click', clickTeam, false);
      }
      document.getElementById("btn-export-deck").addEventListener('click', function() {
        prompt("Your deck code is: (copy & save it somewhere.)",deck_code(last_deck));
      }, false);
      document.getElementById("btn-import-deck").addEventListener('click', function() {
        let deck_code = prompt('Enter a deck code: ');
        // Example deck and its variations: 
        // 333375🐜.2A2A13🐉.A2A213🐧.323275🦠.AA2214🐻.22AA19🦔 // 12 10 (counters mirror match)
        // 323275🐜.2A2A13🐉.A2A213🐧.232375🦠.AA2214🐻.22AA19🦔 // 10 10 (counters all-spike deck)
        // A23482🐜.2A2A13🐉.A2A213🐧.232375🦠.AA2214🐻.22AA19🦔 // U1 10 (small chance of slight advantage)
        // 2A3482🐜.2A2A13🐉.A2A213🐧.232375🦠.AA2214🐻.22AA19🦔 // U2 10 (small chance of slight advantage)
        // 32A482🐜.2A2A13🐉.A2A213🐧.232375🦠.AA2214🐻.22AA19🦔 // U3 10 (small chance of slight advantage)
        // 342A82🐜.2A2A13🐉.A2A213🐧.232375🦠.AA2214🐻.22AA19🦔 // U4 10 (small chance of slight advantage)
        // A23482🐜.2A2A14🐉.A2A214🐧.232375🦠.AA2214🐻.22AA19🦔 // U4 10 + bribe variation


        if (deck_code != null) {
          deck_code = deck_code.split('.');
          for (let i=0; i<deck_code.length; i++) {
            if (i>=6) break;
            import_card(document.getElementById("arena-slot-"+(i+1)).childNodes[0],deck_code[i],last_deck);
          }
        }
      }, false);

      document.getElementById("btn-join-game").addEventListener('click', function() {
        joinMultiplayer("join:", last_deck);
      }, false);

      document.getElementById("btn-host-game").addEventListener('click', function() {
        joinMultiplayer("create:", last_deck);
      }, false);

    }, false);

function joinMultiplayer(sufix, my_deck) {
  let room_name = prompt("Enter a room name to "+sufix,randomString(6));
  if (room_name != null) {
    localStorage.setItem("room_name", room_name);
    window.location.href = ("/arena");///"+room_name);
  }
}
