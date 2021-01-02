const ttt = require('./ttt_grid');

const express = require("express");
const app = express();
const http = require("http")
const server = http.Server(app);
const io = require("socket.io")(server);
const fs = require("fs");

const port = process.env.PORT || 3000;

//app.use(express.static('.'));
app.use(express.static(__dirname + "/../client/"));
app.use(express.static(__dirname + "/../node_modules/"));

app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/../client/editor.html");
    stream.pipe(res).on('finish', function () { 
    	console.log("Delivered: editor.html");
    });
});

app.get("/arena", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/../client/arena.html");
    stream.pipe(res).on('finish', function () { 
    	console.log("Delivered: arena.html");
    });
});

const max_deck_cost = 125;
const max_card_cost = 21;

function contains_array_triplet(array,element) {
	for (let i=0; i<array.length; i++) {
		let item = array[i];
		if (item[0]==element[0] && item[1]==element[1] && item[2]==element[2]) {
			return true;
		}
	}
	return false;
}

function isString(x) {
  return (typeof x === 'string' || x instanceof String);
}

function isNan(x) {
	return (x === NaN);
}

function isInt(value) {
  if (isNaN(value)) {
    return false;
  }
  var x = parseFloat(value);
  return (x | 0) === x;
}

function valid_nickname(name) {
	return (isString(name) && name.length<=20 && name.length>=1 && name.length!=" ");
}

function valid_deck(deck) {
	if (!Array.isArray(deck) || deck.length!=6) {return false;}
	let deck_cost = 0;
	for (let c=0; c<deck.length; c++) {
		if (!Array.isArray(deck[c]) || deck[c].length!=7) {return false;}
		if (!([1,2,3,4,5,6,7,8,9].includes(deck[c][4]))) {return false;}
		if (!([1,2,3,4,5,6,7,8,9].includes(deck[c][5]))) {return false;}
		if (!valid_nickname(deck[c][6])) {return false;}
		let card_cost = 0;
		for (let i=0; i<4; i++) {
			if (!([1,2,3,4,5,6,7,8,9,10,'A'].includes(deck[c][i]))) {return false;}
			if (deck[c][i]==='A') {
				deck[c][i] = 10;
			}
			card_cost += deck[c][i]; //(deck[c][i]=='A'?10:deck[c][i]);
		}
		if (card_cost > 21 + 7*(deck[c][4]===1) + 7*(deck[c][5]===1)) {return false;}
		deck_cost += card_cost;
		if (deck_cost>max_deck_cost) {return false;}
	}
	return true;
}

function valid_room(room) {
	return (isString(room) && /^[0-9a-zA-Z_.-]+$/.test(room));	
}

function valid_card_id(card_id) {
	return isInt(card_id) && card_id>=1 && card_id<=6;
}

function valid_zone_id(zone_id) {
	return isInt(zone_id) && zone_id>=1 && zone_id<=9;
}

// Add a connect listener
io.on('connection', function(socket) {
	//
	let my_room = "";
    console.log('Client connected.');

    // Enter game room... 
    /**/
    socket.on('enterRoom', (data /*{ nickname, deck, room_name }*/) => {

    	if (valid_nickname(data.nickname)) {
    		if (valid_deck(data.deck)) {
				if (valid_room(data.room_name)) {

					// request is valid, enter room
					socket.join(data.room_name);
					let room = io.sockets.adapter.rooms[data.room_name];

					// room is empty, initialize room
					if (!room.game) {
						room.game = {
							players: [],
							teams: [],
							board: [],
							history: []
						};
					}

					// player joins as 1st player
					if (room.game.teams.length === 0) {
						let team = "";
						if (Math.random() < 0.5) {
							team = "X";
						}
						else {
							team = "O";
						}
						socket.team = team;
						socket.player = {"nickname": data.nickname, "deck": data.deck, "team":team};
					}
					// player joins as 2nd player
					else if (room.game.teams.indexOf("X") === -1) {
						socket.team = "X";
						socket.player = {"nickname": data.nickname, "deck": data.deck, "team":"X"};
					}
					else if (room.game.teams.indexOf("O") === -1) {
						socket.team = "O";
						socket.player = {"nickname": data.nickname, "deck": data.deck, "team":"O"};
					}
					// player joins as third wheel
					else {
						socket.team = null;
						socket.player = null;
					}

					// if not third wheel, they be playing this game
					if (socket.team!=null) {
						room.game.teams.push(socket.team);
						room.game.players.push(socket.player);
					}

					// create a censored version of data (i.e. veil effect hides cards)
					let censored_room = JSON.parse(JSON.stringify(room));
					let _players = censored_room.game.players;
					for (let i=0; i<_players.length; i++) {
						let _deck = _players[i].deck;
						for (let c=0; c<_deck.length; c++) {
							// If a card has veil, censor it.
							if (_deck[c][4]==8 || _deck[c][5]==8) {
								for (let j=0; j<6; j++) {
									_deck[c][j]=0;
								}
							}
						}
					}

					my_room = data.room_name;
					socket.emit("successfully connected", socket.player, censored_room);
					socket.to(data.room_name).emit("someone connected", censored_room);

    			} else {
					socket.emit('invalidProfile', {message: "Can't play: Invalid room name."});
    			}
    		} else {
    			socket.emit('invalidProfile', {message: "Can't play: Your deck is invalid."});
    		}
    	} else {
    		socket.emit('invalidProfile', {message: "Can't play: Your nickname is invalid."});
    	}

    });
	/**/

    // Disconnect listener
    socket.on('disconnect', function() {
        console.log('Client disconnected.');

        //socket.emit("successfully disconnected");
		socket.to(my_room).emit("someone disconnected");
    });

    // A move has been made
    socket.on('makeMove', (data /*{card_id, zone_id}*/) => {
        let card_id = data.card_id;
        let zone_id = data.zone_id;
        if (valid_card_id(card_id) && valid_zone_id(zone_id)) {
	        let room = io.sockets.adapter.rooms[my_room]; 
	        if ((socket.player.team==="X" && room.game.history.length%2===0) || 
	        	(socket.player.team==="O" && room.game.history.length%2===1)) {

	        	if (room.game.board.length===0) {
	        		for (let i=0; i<9; i++)
	        			room.game.board.push(["",0,"",null] /*[root_team,card,captured_team,is_veiled]*/);
	        	}

	        	if (room.game.board.length===9) {

	       			if (socket.player.played_cards === undefined || socket.player.played_cards === null) {
	       				socket.player.played_cards = [];
	       			}

	       			if (!socket.player.played_cards.includes(card_id)) {
	       				if (room.game.board[zone_id-1][0]=="") {

	       					// play the card
	       					let card1 = socket.player.deck[card_id-1];
	       					let is_veiled = (card1[4]===8 || card1[5]===8);
	       					//
	       					socket.player.played_cards.push(card_id);
	       					room.game.board[zone_id-1] = [socket.player.team,card_id,socket.player.team,is_veiled];
	       					room.game.history.push([card_id, zone_id]);
	       					//
	       					let game_ended = (room.game.history.length === 9);


	       					// attack other cards and ect.
	       					let captures_this_turn = 0;
	       					CHAIN = [];
	       					//
	       					let chain0 = [[card_id, zone_id, socket.player.team, is_veiled]]; 
	       					/* [] of [cid, zid, original_team, veiled]'s */
	       					let packet = gm_replay(chain0, room.game.board, socket.player.team, room, true); 
	       					/* let packet = {
								capture_t: capture_targets, 
								unveil_t: unveil_targets, 
								chain_t: chained_targets,
								capture_n: my_capture_score,
								spiked: was_i_spiked
							};*/
							CHAIN.push(packet);
							captures_this_turn += packet.capture_t.length;
							//
							while(packet.chain_t.length>0) {
								packet = gm_replay(packet.chain_t, room.game.board, socket.player.team, room, false); 
								CHAIN.push(packet);
								captures_this_turn += packet.capture_t.length;
							}

	       					//console.log(room.game.board);
	       					//console.log(CHAIN);
	       					//console.log(game_ended);

	       					socket.emit("you played a move", {card_id, zone_id}, CHAIN, game_ended, room.game.board);
	       					socket.to(my_room).emit("someone played a move", {card_id, zone_id}, CHAIN, game_ended, room.game.board);

	       				} else {
	       					socket.emit('invalidMove', {message: "SERVER: You can't play on an occupied zone!"});
	       				}
	       			} else {
	       				let cs = JSON.stringify(socket.player.deck[card_id-1]);
	       				socket.emit('invalidMove', {message: "SERVER: You can't (re)play an already played card! "+cs});
	       			}
	        	} else {
	        		socket.emit('invalidMove', {message: "SERVER: Unexpected error, the board state is corrupted!"});
	        	}
	        } else {
	        	socket.emit('invalidMove', {message: "SERVER: You tried to move, but it is not your turn!"});
	        }
	    } else {
	    	socket.emit('invalidMove', {message: "SERVER: Invalid move request!"});
	    }
    });

})

/** GAME MECHANICS support function **/
function gm_attack(direction, pow1id, pow2id, zid, room, opponent_team, card1, normal_attack, underdog, tiebreaker, bribe, ambush) { /* (ttt.up, ) */
	let spiked = false;
	let reach_target = false;
	let target_team = null;
	//if (direction(zid)>=0)
		//console.log("0/2 gm_attack: ",direction(zid)," ",room.game.board[direction(zid)][0]);
	if (direction(zid)>=0 && room.game.board[direction(zid)][0]!="") { /* has card */
		//console.log("1/2 gm_attack: ",direction(zid)," ",room.game.board[direction(zid)][0]);
		let target_card_id = null;
		let target_zone_id = null;
		if (room.game.board[direction(zid)][2]===opponent_team) { /* is enemy card  */
			target_card_id = parseInt(room.game.board[direction(zid)][1])-1;
			target_zone_id = direction(zid);
			if (room.game.board[direction(zid)][0]===opponent_team) { /* whose deck is it from? */
				target_team = opponent_team;
			} else {
				target_team = (opponent_team==="X"?"O":"X");
			}
		} else 
		if (room.game.board[direction(zid)][2]===(opponent_team==="X"?"O":"X")) { /* is allied card  */
			if ((card1[4]===6 || card1[5]===6) && direction(direction(zid))>=0 && room.game.board[direction(direction(zid))][2]===opponent_team) { // [R]each
				target_card_id = parseInt(room.game.board[direction(direction(zid))][1])-1;
				target_zone_id = direction(direction(zid));
				reach_target = true;
				if (room.game.board[direction(direction(zid))][0]===opponent_team) { /* whose deck is it from? */
					target_team = opponent_team;
				} else {
					target_team = (opponent_team==="X"?"O":"X");
				}
			}
		}
		if (target_card_id!=null) {
			//console.log("2/2 gm_attack: ",card2);
			let card2 = null; 
			if (room.game.players[0].team===target_team) { 
				card2 = room.game.players[0].deck[target_card_id]; 
			}
			else if (room.game.players[1].team===target_team) { 
				card2 = room.game.players[1].deck[target_card_id];
			}
			else {
				console.log("\n{we should never get here #1}\n");
			}
			if (card2!=null) { /* we are gm_attacking this card */
				let has_chain = (card2[4]==7 || card2[5]==7);
				let pow1 = card1[pow1id];
				let pow2 = card2[pow2id];
				let cost1 = card1[0]+card1[1]+card1[2]+card1[3];
				let cost2 = card2[0]+card2[1]+card2[2]+card2[3];
				if (pow1>pow2) { /* [N]ormal gm_attack */
					normal_attack[0]+=1;
					normal_attack[1]+=pow2;
					normal_attack[2].push([target_card_id+1,target_zone_id+1,target_team,has_chain]);
				}
				if (pow1===pow2 && cost1<cost2) { /* [U]nderdog */
					underdog[0]+=1;
					underdog[1]+=pow2;
					underdog[2].push([target_card_id+1,target_zone_id+1,target_team,has_chain]);
				}
				if (pow1===pow2) { /* [T]iebreaker */
					tiebreaker[0]+=1;
					tiebreaker[1]+=pow2;
					tiebreaker[2].push([target_card_id+1,target_zone_id+1,target_team,has_chain]);
				}
				if (cost1===cost2) { /* [B]ribe */
					bribe[0]+=1;
					bribe[1]+=pow2;
					bribe[2].push([target_card_id+1,target_zone_id+1,target_team,has_chain]);
				}
				if (true) { /* [A]mbush */
					ambush[0]+=1;
					ambush[1]+=pow2;
					ambush[2].push([target_card_id+1,target_zone_id+1,target_team,has_chain]);
				}
				if((card2[4]===9 || card2[5]===9) && reach_target===false && pow1<pow2) {
					spiked = true;
				}
				return spiked;
			}
		}
	}
	return spiked;
}

function gm_harvest(card1, ability_id, crops, condition, capture_targets, chained_targets, x = 0) {
	if ((card1[4]===ability_id || card1[5]===ability_id) && condition(crops, x)) {
		for (let i=0; i<crops[2].length; i++) {
			if (!contains_array_triplet(capture_targets, crops[2][i])) {
				capture_targets.push(crops[2][i]);
				if ((card1[4]===7 || card1[5]===7) || crops[2][i][3]) {
					chained_targets.push(crops[2][i]);
				}
			}
		}
	}
}

/* chains := [] of [cid+1, zid+1, original_team, is_veiled]'s */
function gm_replay(chains, board, player_team, room, can_be_spiked = false) {

	let my_capture_score = 0;

	/* [[id,zone,target_original-team,has_chain],...] */
	let capture_targets = []; /* (cards that should switch loyalty to opposite loyalty on client) */
	let unveil_targets = []; /* (cards that should update to reveal powers,abilities on client) */
	let chained_targets = []; /* <cards that should be replayed on server before pinging client> */
	/* ^ Target trackers ^ */
	let am_i_spiked = [];
	let did_i_capture = [];
	/* ^ Self tracker ^ */


	// PREPARE TO RESOLVE TARGETS
	let opponent_team = (player_team==="X"?"O":"X");
	for (let ch=0; ch<chains.length; ch++) {

		let chain = chains[ch];	
		let cid = parseInt(chain[0])-1;
		let zid = parseInt(chain[1])-1;
		let capture_card_original_team = chain[2];
		let card1 = null;
		if (capture_card_original_team===room.game.players[0].team) {
			card1 = room.game.players[0].deck[cid];
		} else
		if (capture_card_original_team===room.game.players[1].team) {
			card1 = room.game.players[1].deck[cid];
		} else {
			console.log("\n{we should never get here #21}\n");
		}
		
		if (card1!=null) {

			/* [ 'no. of targets', 'sum of powers', [[id,zone,target_original-team,has_chain],...] ]*/
			let normal_attack = [0,0,[]]; 
			let underdog = [0,0,[]];
			let tiebreaker = [0,0,[]];
			let bribe = [0,0,[]];
			let ambush = [0,0,[]];
			/* ^ Ability trackers ^ */ 

			let cost1 = (card1[0] + card1[1] + card1[2] + card1[3]);

			// GET CAPTURE TARGETS && track self target (spike ability)
			let spiked = false;
			let spiked1 = gm_attack(ttt.up, 0, 2, zid, room, opponent_team, card1, normal_attack, underdog, tiebreaker, bribe, ambush);
			let spiked2 = gm_attack(ttt.right, 1, 3, zid, room, opponent_team, card1, normal_attack, underdog, tiebreaker, bribe, ambush);
			let spiked3 = gm_attack(ttt.down, 2, 0, zid, room, opponent_team, card1, normal_attack, underdog, tiebreaker, bribe, ambush);
			let spiked4 = gm_attack(ttt.left, 3, 1, zid, room, opponent_team, card1, normal_attack, underdog, tiebreaker, bribe, ambush);
			am_i_spiked.push(spiked || spiked1 || spiked2 || spiked3 || spiked4);

			// PREPARE TO CAPTURE UNIQUE TARGETS
			let capture_counter = capture_targets.length;
			gm_harvest(card1, 2, underdog, function (crops,x) {return crops[2].length>0}, capture_targets, chained_targets)
			gm_harvest(card1, 3, tiebreaker, function (crops,x) {return crops[2].length>=2}, capture_targets, chained_targets)
			gm_harvest(card1, 4, bribe, function (crops,x) {return crops[2].length>=2}, capture_targets, chained_targets)
			gm_harvest(card1, 5, ambush, function (crops,x) {return crops[1]===x}, capture_targets, chained_targets, cost1)
			if (normal_attack[2].length>0) {
				for (let i=0; i<normal_attack[2].length; i++) {
					if (!contains_array_triplet(capture_targets,normal_attack[2][i])) {
						capture_targets.push(normal_attack[2][i]);
					}
				}
			}
			if (capture_targets.length>capture_counter) {
				did_i_capture.push(true);
			} else {
				did_i_capture.push(false);
			}
		}
	}


	// CAPTURE UNIQUE TARGETS
	// update board state to reflect (chain-0) captures on other cards
	for (let i=0; i<capture_targets.length; i++) {

		my_capture_score += 1;

		let cid = capture_targets[i][0]-1;
		let zid = capture_targets[i][1]-1;
		let capture_card_original_team = capture_targets[i][2];
		board[zid][2] = player_team;

		// unveil veiled captures
		if (board[zid][3]===true) {
			let card2 = null;
			if (capture_card_original_team===room.game.players[0].team) {
				card2 = room.game.players[0].deck[cid];
			} else
			if (capture_card_original_team===room.game.players[1].team) {
				card2 = room.game.players[1].deck[cid];
			} else {
				console.log("\n{we should never get here #22}\n");
			}
			if (card2!=null) {
				board[zid][3] = false;
				unveil_target = {
					target: capture_targets[i],
					card: card2
				};
				unveil_targets.push(unveil_target);
			}
		}
	}


	// RESOLVE SELF
	if (can_be_spiked)
	for (let ch=0; ch<chains.length; ch++) {

		let chain = chains[ch];	
		let cid = parseInt(chain[0])-1;
		let zid = parseInt(chain[1])-1;
		let capture_card_original_team = chain[2];
		let card1 = null;
		if (capture_card_original_team===room.game.players[0].team) {
			card1 = room.game.players[0].deck[cid];
		} else
		if (capture_card_original_team===room.game.players[1].team) {
			card1 = room.game.players[1].deck[cid];
		} else {
			console.log("\n{we should never get here #23}\n");
		}
		
		if (card1!=null) {
			// RESOLVE spiked by ability (SELF-TARGET)
			let spiked_b = am_i_spiked[ch];
			let captured_b = did_i_capture[ch];
			if (spiked_b) {
				board[zid][2] = opponent_team;
				capture_targets.push([cid+1,zid+1,player_team]);
			}
			// unveil self
			if (board[zid][3]===true && (captured_b || spiked_b)) {
				board[zid][3] = false;
				unveil_target = {
					target: [cid+1,zid+1,player_team],
					card: card1
				};
				unveil_targets.push(unveil_target);
			}
		}
	}

	let was_i_spiked = (can_be_spiked && am_i_spiked[0] && chains.length===1);
	let packet = {
		capture_t: capture_targets, 
		unveil_t: unveil_targets, 
		chain_t: chained_targets,
		capture_n: my_capture_score,
		spiked: was_i_spiked
	};
	return packet;
}

server.listen(port, function() {
	console.log("listening on : " + port);
});