"use strict";

let mySubnet, in1=0, in2=0, in3=0, in4=0, in5=0, fromURL = false;

function ipMath(o1,o2,o3,o4,mask) {
	const zeros = "00000000000000000000000000000000";
	const ones  = "11111111111111111111111111111111";
	let bin1, bin2, bin3, bin4, network, netmask, firstip, lastip, count;
	let binIP, binMask, binNet;

	// Octets - Decimal to 8 Bit Binary
	bin1 = (zeros + o1.toString(2)).slice(-8);
	bin2 = (zeros + o2.toString(2)).slice(-8);
	bin3 = (zeros + o3.toString(2)).slice(-8);
	bin4 = (zeros + o4.toString(2)).slice(-8);
	binIP = bin1+bin2+bin3+bin4;

	// Calculate Network
	binMask = ones.slice(0, mask) + zeros.slice(0, (32 - mask));
	binNet  = "";
	for(let i=0;i<binIP.length;++i) {
		binNet += (parseInt(binIP.charAt(i)) & parseInt(binMask.charAt(i))) ? "1" : "0";
	}

	network = toDec(binNet);
	netmask = toDec(binMask);
	count = Math.pow(2, 32 - mask);
	firstip = toDec( (zeros + (parseInt(binNet,2)            ).toString(2)).slice(-32) ); 
	lastip  = toDec( (zeros + (parseInt(binNet,2) + count - 1).toString(2)).slice(-32) ); 

	return {network, netmask, firstip, lastip, count, bin1, bin2, bin3, bin4};

}

function toDec(bin) {
	return parseInt(bin.slice(0,8),2) + "." + parseInt(bin.slice(8,16),2) + "." + parseInt(bin.slice(16,24),2) + "." + parseInt(bin.slice(24,32),2);
}

function setValues() {
	let mask, oct1, oct2, oct3, oct4, net1, net2, net3, net4;

	oct1 = ($('#octet1').val() == "") ? 0 : parseInt($('#octet1').val());
	oct2 = ($('#octet2').val() == "") ? 0 : parseInt($('#octet2').val());
	oct3 = ($('#octet3').val() == "") ? 0 : parseInt($('#octet3').val());
	oct4 = ($('#octet4').val() == "") ? 0 : parseInt($('#octet4').val());
	mask = ($('#snmask').val() == "") ? 0 : parseInt($('#snmask').val());

	$('#octet1').val(oct1);
	$('#octet2').val(oct2);
	$('#octet3').val(oct3);
	$('#octet4').val(oct4);
	$('#snmask').val(mask);

	if ( in1 == oct1 && in2 == oct2 && in3 == oct3 && in4 == oct4 && in5 == mask ) { return; }
	else { in1 = oct1; in2 = oct2; in3 = oct3; in4 = oct4; in5 = mask; }

	let vals = ipMath(oct1,oct2,oct3,oct4,mask);

	// Output Binary
	for(let i=0; i<8; ++i) {
		$("#o1b"+i).html(vals.bin1.charAt(i));
		$("#o2b"+i).html(vals.bin2.charAt(i));
		$("#o3b"+i).html(vals.bin3.charAt(i));
		$("#o4b"+i).html(vals.bin4.charAt(i));
	}

	// Color output
	let tOct, tBit;
	$(".bit").css({"background-color":"#fff"});
	for(let i=0;i<mask;++i) {
		tOct = Math.floor(i/8) + 1;
		tBit = i % 8;
		$("#o" +tOct+ "b" +tBit).css({"background-color":"#ccc"});
	}

	// Fill in output table
	$("#val-network").html(vals.network);
	$("#val-netmask").html(vals.netmask);
	$("#val-first-ip").html(vals.firstip);
	$("#val-last-ip").html(vals.lastip);
	$("#val-count").html(vals.count.toLocaleString());

	// Display Subnetting
	net1 = parseInt(vals.network.split(".")[0]);
	net2 = parseInt(vals.network.split(".")[1]);
	net3 = parseInt(vals.network.split(".")[2]);
	net4 = parseInt(vals.network.split(".")[3]);
	mySubnet = new Tree(net1, net2, net3, net4, mask);
	mySubnet.displayTree();
	serializeTree();
}

function serializeTree() {
	let root = mySubnet.root;
	let mask = root.mask;
	let ipv4 = root.network;
	let arr = cereal(root,[]);
	let bin = arr.join("")
	while(bin.length % 4 != 0) { bin = "0" + bin; }
	let hex = bin2hex(bin);

	let current = window.location.href.split('?')[0];
	let qstring = "?ip=" + ipv4 + "&mask=" + mask + "&subnets=" + hex;

	$("#link").attr("href", current+qstring);
}

function cereal(node,a) {
	if (node.division1 == null && node.division2 == null) {
		a.push(0);
	} else {
		a.push(1);
		cereal(node.division1,a);
		cereal(node.division2,a);
	}
	return a;
}

function deSerializeTree() {
	const urlStr = new URLSearchParams(window.location.search);
	let ip = urlStr.get('ip');
	let mask = urlStr.get('mask');
	let subnets = urlStr.get('subnets');

	if (ip == null || mask == null || subnets == null) {
		ip = "172.16.0.0";
		mask = "12";
		subnets = "0";
		fromURL = false;
	} else {
		ip =  ip.replace(/[^0-9\.]/g, '');
		mask =  mask.replace(/[^0-9]/g, '');
		subnets = subnets.replace(/[^0-9A-F]/g, '');
		fromURL = true;
	}

	// validate IP
	let oct = ip.split(".").map(x=>parseInt(x));
	if (oct.length != 4) { 
		oct = [172,16,0,0]; 
	} else {
		for(let i=0; i<4; ++i) {
			oct[i] = isNaN(oct[i]) ? 0 : oct[i] % 256;
		}
	}

	// valid MASK
	mask = mask % 33;

	// valid SUBNETS
	subnets = (subnets == "") ? "0" : subnets;

	// create Tree
	$('#octet1').val(oct[0]);
	$('#octet2').val(oct[1]);
	$('#octet3').val(oct[2]);
	$('#octet4').val(oct[3]);
	$('#snmask').val(mask);
	setValues();

	let a = hex2bin(subnets);
	deCereal(mySubnet.root,a);
	mySubnet.displayTree();
}

function deCereal(node,a) {
	if (a.shift() == 1 && node) {
		mySubnet.divideSubnet(node.id);
		deCereal(node.division1,a);
		deCereal(node.division2,a);
	}
}

function bin2hex(bin) {
	let hex = {"0000":"0","0001":"1","0010":"2","0011":"3","0100":"4","0101":"5","0110":"6","0111":"7","1000":"8","1001":"9","1010":"A","1011":"B","1100":"C","1101":"D","1110":"E","1111":"F"};
	let out = "";
	
	let b4 = bin.match(/.{1,4}/g);
	for(let i=0; i< b4.length; ++i) { out += hex[b4[i]]; }

	return out;
}

function hex2bin(hex) {
	let bin = {"0":"0000","1":"0001","2":"0010","3":"0011","4":"0100","5":"0101","6":"0110","7":"0111","8":"1000","9":"1001","A":"1010","B":"1011","C":"1100","D":"1101","E":"1110","F":"1111"};
	let out = "";

	for(let i=0;i<hex.length;++i) { out += bin[hex.charAt(i)]; }
	out = (out == "0000") ? "0" : out.replace(/^0+/, '');

	return out.split("").map(x=>parseInt(x));
}

$(document).ready(function(){

	$("#subnetting").on("click", ".divide", function(){
		let id = parseInt($(this).data('id'));
		mySubnet.divideSubnet(id);
		mySubnet.displayTree();
		serializeTree();
	});

	$("#subnetting").on("click", ".join", function(){
		let id = parseInt($(this).data('id'));
		mySubnet.joinSubnet(id);
		mySubnet.displayTree();
		serializeTree();
	});

	$("#subnetting").on("click", ".boxbox", function(){
		let toClipBoard = $(this).data('toclip');
		$("#clippy").val(toClipBoard);
		$("#clippy").select();
		document.execCommand("copy");
	});

	$(".address").click(function(){
		let oct1 = parseInt($(this).data('oct1'));
		let oct2 = parseInt($(this).data('oct2'));
		let oct3 = parseInt($(this).data('oct3'));
		let oct4 = parseInt($(this).data('oct4'));
		let mask = parseInt($(this).data('mask'));
		$('#octet1').val(oct1);
		$('#octet2').val(oct2);
		$('#octet3').val(oct3);
		$('#octet4').val(oct4);
		$('#snmask').val(mask);
		setValues();
	});

	// Check for change
	$(".input").on("change keyup paste mouseup", function(){ setValues(); });

	// Stop odd zero behavior
	$(".input").on("keypress", function(e) {
		var code = e.keyCode || e.which;
			if(code >=48 && code <= 57) {
				if ($(this).val() == 0 && this.selectionEnd != 0) {
					$(this).val(String.fromCharCode(code));
					e.preventDefault();
				}
			}
	});


	// Limit input field values
	$.fn.inputFilter = function(inputFilter) {
		return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
			if (inputFilter(this.value)) {
				this.oldValue = this.value;
				this.oldSelectionStart = this.selectionStart;
				this.oldSelectionEnd = this.selectionEnd;
			} else if (this.hasOwnProperty("oldValue")) {
				this.value = this.oldValue;
				this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
			}
		});
	};

	// Limit Octets to 0 - 255
	$(".octet").inputFilter(function(value) {
		return /^\d*$/.test(value) && (value === "" || parseInt(value) <= 255); 
	});

	// Limit Mask to 0 - 32
	$(".mask").inputFilter(function(value) {
		return /^\d*$/.test(value) && (value === "" || parseInt(value) <= 32); 
	});

	setValues();
	deSerializeTree();
	mySubnet.displayTree();
	serializeTree();

});
