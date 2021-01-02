/** ARENA JS **/

    function allowDrop(ev) {
      ev.preventDefault();
    }

    function drag(ev) {
      ev.dataTransfer.setData("target", ev.target.id);
    }

    function drop(ev) {
      ev.preventDefault();
      if (my_turn===true) {
        let data = ev.dataTransfer.getData("target");
        let dragged = document.getElementById(data);
        let target = ev.target;
        if (dragged != null) {
          let dropzone = target.parentNode.parentNode.id;
          let rootzone = dragged.parentNode.parentNode.id;
          if (dropzone==="arena-deckpad" && rootzone.startsWith("deck-slot")) {
            if (target.getAttribute("occupied")=='false') {

              let card_id = dragged.id.slice(-1);
              let zone_id = target.parentNode.id.slice(-1);
              my_turn=false;

              move_packet = {
                dragged_element: dragged,
                target_element: target,
                move_card_id: card_id,
                move_zone_id: zone_id,
              };
              socket.emit('makeMove', {card_id, zone_id});
            } else {
              /* Can't drag, occupied. */
            }
          } else {
            /* Can't drag on deckzone or from arenazone. */
          }
        } else {
          /* undefined draggable */
        }
      } else {
        /* Can't drag, not my turn. */
      }
    }

    function drag_n_drop(dragged, target, _packet_ = null) {
      dragged.parentNode.setAttribute('occupied', 'false');

      // What's my color on drop? ... TO-DO: recieve color from server after move!
      if(dragged.parentNode.classList.contains("team-blue")) {
        target.classList.remove("team-red");
        target.classList.add("team-blue");
      } else {
        target.classList.remove("team-blue");
        target.classList.add("team-red");
      }
      // 
      target.setAttribute('occupied', 'true');
      //
      target.appendChild(dragged);
      apply_effect(target,"grow",_packet_);
    }

    function opponent_move_card(card_id, zone_id, _packet_ = null) {
      let t = (my_team==="X"?'b':'r');
      let dragged = document.getElementById("deck-card-"+t+card_id);
      let target  = document.getElementById("arena-slot-"+zone_id).getElementsByClassName("overlay-card")[0];

      drag_n_drop(dragged, target, _packet_);
      if (my_turn===false) {
        my_turn=true;
      }
    }

    function initialize_drag_n_drop() {
      drag_slots = document.getElementsByClassName("overlay-card");
      for (let i = 0; i < drag_slots.length; i++) {
        let element = drag_slots[i];
        if (element.hasChildNodes())
          element.setAttribute('occupied', 'true');
        else
          element.setAttribute('occupied', 'false');
        element.setAttribute('ondrop', 'drop(event)');
        element.setAttribute('ondragover', 'allowDrop(event)');
      }
    }

    function swap_sides_to_X() {
      swapElements(document.getElementById("blue-deckpad"),document.getElementById("red-deckpad"));
      for (let i=1; i<=6; i++) {
        document.getElementById("deck-slot-b"+i).classList.remove("float-left");
        document.getElementById("deck-slot-r"+i).classList.remove("float-right");
        document.getElementById("deck-slot-r"+i).classList.add("float-left");
        document.getElementById("deck-slot-b"+i).classList.add("float-right");
      }
    }

    function load_deck(deck, team) {
      let t = (team==="X"?'r':'b');
      let draggable = (my_team===team);
      for (let c=0; c<deck.length; c++) {
        if (deck[4]===0 || deck[c][5]===0) {
          deck[c][4] = "";
          deck[c][5] = ability_icons[8];
        } else {
          deck[c][4] = ability_icons[deck[c][4]];
          deck[c][5] = ability_icons[deck[c][5]];
        }
        for (let i=0; i<4; i++) {
          if (deck[c][i]===10) {
            deck[c][i]="A";
          }
        }
        document.getElementById("deck-slot-"+t+(c+1)).childNodes[0].insertAdjacentHTML('afterbegin', card_template(t+(c+1),deck[c],draggable));        
      }
    }

    function apply_effect(target, effect_tag, _packet_ = null) {
        let css_class_tag = effect_tag;//"spin"; 
        let parent = target;
        parent.classList.add("no-"+css_class_tag);
        parent.classList.add(css_class_tag);
        setTimeout((function() {
          parent.classList.remove(css_class_tag);
          parent.classList.add("no-"+css_class_tag);
          // on finished growing:
          if (_packet_ != null) {
            animate_captures(_packet_);
          }
        }), 500); 
        //
    };

    function animate_captures(_packet_, ch = 0) {
      /*
      _packet_ = {
        chain: CHAIN,
        is_game_end: game_ended
      };
      */
      // UPDATE CAPTURES && UN-VEILS
      ///.,;
      if (_packet_!= null && ch>=0 && ch<_packet_.chain.length) { ///////for (let ch=0; ch<chains.length; ch++) {
        let chains = _packet_.chain;
        let chain = chains[ch];
        /* chain = {
          capture_t: capture_targets, 
          unveil_t: unveil_targets, 
          chain_t: chained_targets,
          capture_n: my_capture_score,
          spiked: was_i_spiked
        };*/
        // CAPTURE_T
        for (let cp=0; cp<chain.capture_t.length; cp++) {
          let capture_target = chain.capture_t[cp]; // [id,zone,target_original-team,has_chain]
          let zone = capture_target[1];
          let target = document.getElementById("arena-slot-"+zone).getElementsByClassName("overlay-card")[0].getElementsByClassName("grid-container")[0];
          if (target != null) {
            if (cp===chain.capture_t.length-1)
              swap_color_via_spin_effect(target, _packet_, ch);
            else 
              swap_color_via_spin_effect(target, null, -1);
          } else {
            alert("Unexpected error: a card captured on unknown arena zone.");
          }
        }
        // UNVEIL_T
        for (let v=0; v<chain.unveil_t.length; v++) {
          let unveil = chain.unveil_t[v];
          /*
          unveil = {
            target: capture_targets[i],
            card: card2
          };
          */
          let card_cost = 0;
          for (let i=0; i<4; i++) {
            if (unveil.card[i]===10) {
              unveil.card[i]='A';
            }
            card_cost += (unveil.card[i]==='A' ? 10 : unveil.card[i]);
          }
          let zone = unveil.target[1];
          let target = document.getElementById("arena-slot-"+zone).getElementsByClassName("overlay-card")[0].getElementsByClassName("grid-container")[0];
          target.getElementsByClassName("card-point-1")[0].getElementsByClassName("overlay-card")[0].innerText = unveil.card[0];
          target.getElementsByClassName("card-point-2")[0].getElementsByClassName("overlay-card")[0].innerText = unveil.card[1];
          target.getElementsByClassName("card-point-3")[0].getElementsByClassName("overlay-card")[0].innerText = unveil.card[2];
          target.getElementsByClassName("card-point-4")[0].getElementsByClassName("overlay-card")[0].innerText = unveil.card[3];
          target.getElementsByClassName("card-cost")[0].getElementsByClassName("overlay-card")[0].innerText = card_cost;
          target.getElementsByClassName("ability-left")[0].getElementsByClassName("div-point")[0].innerText = window.ability_icons[unveil.card[4]];
          target.getElementsByClassName("ability-right")[0].getElementsByClassName("div-point")[0].innerText = window.ability_icons[unveil.card[5]];
        }
        // CAPTURE_N
        //console.log(chain.capture_n);
        if (_packet_.my_move === true) {
          let new_captures = chain.capture_n; 
          let old_captures = parseInt(document.getElementById("player-title").innerText.split(":")[1]);
          document.getElementById("player-title").innerText = (my_player.nickname +": "+(old_captures+new_captures));
            // SPIKED
            if (chain.spiked===true) {
              let new_captures = 1; 
              let old_captures = parseInt(document.getElementById("opponent-title").innerText.split(":")[1]);
              document.getElementById("opponent-title").innerText = (my_opponent.nickname +": "+(old_captures+new_captures));
            }
        } else {
          let new_captures = chain.capture_n; 
          let old_captures = parseInt(document.getElementById("opponent-title").innerText.split(":")[1]);
          document.getElementById("opponent-title").innerText = (my_opponent.nickname +": "+(old_captures+new_captures));
            // SPIKED
            if (chain.spiked===true) {
              let new_captures = 1; 
              let old_captures = parseInt(document.getElementById("player-title").innerText.split(":")[1]);
              document.getElementById("player-title").innerText = (my_player.nickname +": "+(old_captures+new_captures));
            }
        }
      } else {
        /*
        console.log("end? ", _packet_.is_game_end);
        if (_packet_.is_game_end) {
          setTimeout(function() {alert("Game ended!");}, 500); 
          my_turn = null;
        }
        */
      }
    }

    function swap_color_via_spin_effect(target, _packet_=null, ch=0) {
        let css_class_tag = "spin";//"spin"; 
        let node = target;
        node.classList.remove("no-"+css_class_tag);
        node.classList.add(css_class_tag);
        let _color_swap = function (css_class_tag, my_target, _packet_, ch) {
          my_target.classList.remove(css_class_tag);
          my_target.classList.add("no-"+css_class_tag);
          /// revert color after spin ends:
          /**/
          let node = my_target.parentNode;
          //console.log("*****SPIN***** 1/2", JSON.stringify(node.classList));
          if(node.classList.contains("team-red")) 
          {
            node.classList.remove("team-red");
            node.classList.add("team-blue");
          } 
          else 
          if (node.classList.contains("team-blue")) 
          {
            node.classList.remove("team-blue");
            node.classList.add("team-red");
          } 
          else 
          {
            console.log("UNEXPECTED TEAM CLASS ON NODE: ",node);
          }
          //console.log("*****SPIN***** 2/2", JSON.stringify(node.classList));
          /**/
          if (_packet_!=null) {
            animate_captures(_packet_, ch+1);
          }
        }
        setTimeout(_color_swap.bind(null, css_class_tag, node, _packet_, ch), 500); 
    };

    document.addEventListener('DOMContentLoaded', function() {
      //
    }, false);


// GAME-MECHANICS-N-SHIT
let my_team = "";
let has_opponent = false;
let my_player = null;
let my_opponent = null;
let my_turn = null;
let move_packet = null;

const socket = io();

socket.on('connect', () => {
  let nickname = localStorage.getItem("nickname");
  let room_name = localStorage.getItem("room_name");
  // normalize deck abilities to numbers
  let deck = JSON.parse(localStorage.getItem("last_deck"));
  for (let c=0; c<deck.length; c++) { 
    deck[c][4] = ability_ids[deck[c][4]];
    deck[c][5] = ability_ids[deck[c][5]];
  }
  console.log("[SERVER] We are connected via socket.io, nice!");
  console.log("[SERVER] Trying to join room '"+room_name+"'...");
  socket.emit('enterRoom', { nickname, deck, room_name });
});

socket.on('invalidProfile', (data) => {
  console.log("[SERVER] I am disappointed in you, '"+data.message+"'");
  document.getElementById("player-title").innerText = data.message;
  document.getElementById("opponent-title").innerText = data.message;
});

function load_second_player(players, player) {
  if (players.length==1) {
    document.getElementById("opponent-title").innerText = "Waiting for rival...";
  }
  else if (players.length==2 && has_opponent===false) {
    has_opponent = true;
    if (players[0].team!=player.team) {
      my_opponent = players[0];
      load_deck(players[0].deck,players[0].team);
      document.getElementById("opponent-title").innerText = players[0].nickname +": 0";
    } else {
      my_opponent = players[1];
      load_deck(players[1].deck,players[1].team);
      document.getElementById("opponent-title").innerText = players[1].nickname +": 0";
    }
    document.getElementById("player-title").innerText += ": 0";
    
    initialize_drag_n_drop();
    //
    if (my_team==="X") {
      my_turn = true;
    } else if (my_team==="O") {
      my_turn = false;
    } else {
      alert("Unexpected error: You have no team assigned.");
    }

  } else if (players.length>2) {
    alert("Unexpected problems are beating up the server.");
  }
}

function load_game_board(board) {
  // TO-DO... LOAD BOARD FOR SPECTATORS!
}

socket.on('successfully connected', (player, room) => {
  console.log("[SERVER] successfully connected: ", player, room);

  if (player === null) {
    alert("Game is full, can't join!");
    has_opponent = null;

  } else {
    my_player = player;
    my_team = player.team;
    if (player.team==="X") {swap_sides_to_X();}
    load_deck(player.deck,player.team);
    document.getElementById("player-title").innerText = player.nickname;

    load_second_player(room.game.players, player);
  }

  if (room.game.board.length != 0) {
    load_game_board(room.game.board);
  }

});

socket.on('someone connected', (room) => {
  console.log("[SERVER] someone connected: ", room);

  load_second_player(room.game.players, my_player);
});

socket.on('someone disconnected', (room) => {
  console.log("[SERVER] someone disconnected, aborting game!");
  alert("Someone disconnected, aborting game!");
  window.location.href = ("/");
});

socket.on('invalidMove', (data) => {
  console.log("[SERVER] I am disappointed in you, '"+data.message+"'");
  alert(data.message);
});

socket.on('you played a move', (data /*{card_id, zone_id}*/, CHAIN  /*array of 'packet'*/, game_ended, board) => {
  if (my_player != null) {
    console.log("[SERVER] You played a move, "+JSON.stringify(data)+".");
    console.log("[DEBUG] Board: ",board);
    if (move_packet!=null) {
      _packet = {
        chain: CHAIN,
        is_game_end: game_ended,
        my_move: true
      };
      drag_n_drop(move_packet.dragged_element, move_packet.target_element, _packet);
      move_packet = null;
    } else {
      alert("Unexpected error: move_packet is null.");
    }
  }
  console.log("chain: ", CHAIN);
});

socket.on('someone played a move', (data /*{card_id, zone_id}*/, CHAIN /*array of 'packet'*/, game_ended, board) => {
  if (my_player != null) {
    console.log("[SERVER] Opponent played a move, "+JSON.stringify(data)+".");
    console.log("[DEBUG] Board: ",board);
    _packet = {
      chain: CHAIN,
      is_game_end: game_ended,
      my_move: false
    };
    opponent_move_card(data.card_id, data.zone_id, _packet);
  }
  console.log("chain: ", CHAIN);
});
