/**
 [0][1][2]
 [3][4][5]
 [6][7][8]
*/
exports.up = function (x) {
	switch(x) {
	  case 0:
	    return -1;
	    break;
	  case 1:
	    return -1;
	    break;
	  case 2:
	    return -1;
	    break;
	  case 3:
	    return 0;
	    break;
	  case 4:
	    return 1;
	    break;
	  case 5:
	    return 2;
	    break;
	  case 6:
	    return 3;
	    break;
	  case 7:
	    return 4;
	    break;
	  case 8:
	    return 5;
	    break;                     
	  default:
	    return -1;
	    break;
	}
}
/**
 [0][1][2]
 [3][4][5]
 [6][7][8]
*/
exports.down = function (x) {
	switch(x) {
	  case 0:
	    return 3;
	    break;
	  case 1:
	    return 4;
	    break;
	  case 2:
	    return 5;
	    break;
	  case 3:
	    return 6;
	    break;
	  case 4:
	    return 7;
	    break;
	  case 5:
	    return 8;
	    break;
	  case 6:
	    return -1;
	    break;
	  case 7:
	    return -1;
	    break;
	  case 8:
	    return -1;
	    break;                     
	  default:
	    return -1;
	    break;
	}
}
/**
 [0][1][2]
 [3][4][5]
 [6][7][8]
*/
exports.left = function (x) {
	switch(x) {
	  case 0:
	    return -1;
	    break;
	  case 1:
	    return 0;
	    break;
	  case 2:
	    return 1;
	    break;
	  case 3:
	    return -1;
	    break;
	  case 4:
	    return 3;
	    break;
	  case 5:
	    return 4;
	    break;
	  case 6:
	    return -1;
	    break;
	  case 7:
	    return 6;
	    break;
	  case 8:
	    return 7;
	    break;                     
	  default:
	    return -1;
	    break;
	}
}
/**
 [0][1][2]
 [3][4][5]
 [6][7][8]
*/
exports.right = function (x) {
	switch(x) {
	  case 0:
	    return 1;
	    break;
	  case 1:
	    return 2;
	    break;
	  case 2:
	    return -1;
	    break;
	  case 3:
	    return 4;
	    break;
	  case 4:
	    return 5;
	    break;
	  case 5:
	    return -1;
	    break;
	  case 6:
	    return 7;
	    break;
	  case 7:
	    return 8;
	    break;
	  case 8:
	    return -1;
	    break;                     
	  default:
	    return -1;
	    break;
	}
}