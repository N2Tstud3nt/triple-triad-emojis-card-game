window.max_deck_cost = 125;
window.max_card_cost = 21;
window.max_face_length = 8;
window.ability_ids = 	 {'⭐':1,'🔥':2,'⚔️':3,'💰':4,'☘️':5,'👋':6,'⛓️':7,'🧛':8,'📌':9};
window.ability_icons = 	 {1:'⭐',2:'🔥',3:'⚔️',4:'💰',5:'☘️',6:'👋',7:'⛓️',8:'🧛',9:'📌'};
window.ability_letters = ['H'  ,   'U',    'T',   'B',    'A',   'R',   'C',   'V',   'S'];
window.ability_icons2 =  {'H':'⭐','U':'🔥','T':'⚔️','B':'💰','A':'☘️','R':'👋','C':'⛓️','V':'🧛','S':'📌'};
window.app_version = "alpha 1.0_20200806_2";

function hasNumber(myString) {
  return /\d/.test(myString);
}

function swapElements(obj1, obj2) {
    // create marker element and insert it where obj1 is
    var temp = document.createElement("div");
    obj1.parentNode.insertBefore(temp, obj1);

    // move obj1 to right before obj2
    obj2.parentNode.insertBefore(obj1, obj2);

    // move obj2 to right before where obj1 used to be
    temp.parentNode.insertBefore(obj2, temp);

    // remove temporary marker node
    temp.parentNode.removeChild(temp);
}

function randomString(length, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    let result = '';
    for (let i = length; i > 0; --i) 
    	result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

window.onload = function() {
	document.getElementById('app_version_div').innerHTML = window.app_version;
	let rules;
	rules = document.getElementById('rules_mcc');
	if (rules!=null) {
		let mcc = window.max_card_cost;
		rules.innerHTML = "Max. card cost is "+mcc+"/⭐"+(mcc+7)+"/⭐⭐"+(mcc+14)+"."; 
	}
	rules = document.getElementById('rules_mcs');
	if (rules!=null) {
		rules.innerHTML = "Card sides range over 1-A (1-10)."; 
	}
	rules = document.getElementById('rules_ds');
	if (rules!=null) {
		rules.innerHTML = "Sum of all sides can't exceed "+window.max_deck_cost+"."; 
	}
}