"use strict";

// =========================================================================
// ============================== BINARY TREE ==============================
// =========================================================================

function Tree(oct1, oct2, oct3, oct4, maskBits){
	let intIP = oct1 * Math.pow(256,3) + oct2 * Math.pow(256,2) + oct3 * 256 + oct4;
    let n = new Node(intIP, maskBits);

    this.root = n; // Root Node
    this.deep = 1; // Tree Depth

    this.root.depth 	= 1;
    this.root.leaves 	= 1;
    this.root.id 		= Math.pow(2, 32 - 1);
    this.root.path.push(this.root.id);
}

Tree.prototype.divideSubnet = function(nodeID) {
	let current = this.searchT(nodeID);
	if (current.mask < 32) {
		let mask 	= current.mask + 1;
		let intIP 	= current.intIP;
		let div1 	= new Node(intIP, mask);
		let newIP 	= div1.count + intIP;
		let div2 	= new Node(newIP, mask); 
		let deep 	= current.depth + 1;
		div1.depth 	= deep;
		div2.depth 	= deep;
		div1.id 	= current.id - Math.pow(2, 32-deep);
		div2.id 	= current.id + Math.pow(2, 32-deep);
		div1.path 	= current.path.slice(0);
		div2.path 	= current.path.slice(0);
		div1.path.push(div1.id);
		div2.path.push(div2.id);
		current.division1 = div1;
		current.division2 = div2;
	}
	this.treeStats();
}

Tree.prototype.joinSubnet = function(nodeID) {
	let current = this.searchT(nodeID);
	current.division1 = null;
	current.division2 = null;
	this.treeStats();
}

Tree.prototype.treeStats = function() {
	this.root.allNodesLeaves();
	this.deep = this.root.getDeep();
}


Tree.prototype.searchT = function(val) {
    return this.root.searchN(val);
}

Tree.prototype.displayTree = function() {
	let rows = this.root.showT([]);
	let table = "", inTable = "";
	let id, rspan, cspan, nmask, network, first;
	let used = [];
	let list = "";

	for(let i =0; i<rows.length; ++i) {
		network = rows[i].network + "/" + rows[i].mask;
		list 	+= "\"" + network + "\",";
		inTable += "<tr class='subnet-row' data-network='" + network + "'>";
		inTable += "<td class='toclip'>" + network + "<div class='boxbox' title='Copy to Clipboard' data-toclip='" + network + "'>&boxbox;</div></td>";
		inTable += "<td>" + rows[i].netmask + "</td>";
		inTable += "<td>" + rows[i].first + " - " + rows[i].last + "</td>";
		inTable += "<td>" + rows[i].count + "</td>";
		inTable += (rows[i].mask < 32) ? "<td class='divide' data-id='" + rows[i].id + "'>&divide;</td>" : "<td></td>";
		first = true;
		for(let j=rows[i].path.length -1; j>=0; --j) {
			id = rows[i].path[j];
			if (used.indexOf(id) == -1) {
				rspan = this.displayLeafNodes(id);
				cspan = this.displayLeafDepth(id);
				nmask = this.displayLeafMask(id);
				if (first) {
					inTable += "<td rowspan=" +rspan+ " colspan=" +cspan+ ">/" + nmask + "</td>";
				} else {
					inTable += "<td class='join' rowspan=" +rspan+ " colspan=" +cspan+ " data-id='" + id + "'>/" + nmask + "</td>";
				}
				used.push(id);
				first = false;
			}
		}
		inTable += "</tr>";
	}

	table += "<table class='subnets'>";
	table += "<tr class='header' id='subnets-header'>";
	table += "<td class='toclip'>Subnet Address<div class='boxbox' title='Copy to Clipboard' data-toclip='" +list+ "'>&boxbox;</div></td>";
	table += "<td>Subnet Mask</td>";
	table += "<td>IP Range</td>";
	table += "<td>IP Count</td>";
	table += "<td>Divide</td>";
	table += "<td colspan=" + this.deep + ">Join</td>";
	table += "</tr>";
	table += inTable;
	table += "</table>";

	$("#subnetting").html(table);
}

Tree.prototype.displayLeafMask = function(val) {
	let n = this.root.searchN(val);
	return n.mask;
}

Tree.prototype.displayLeafNodes = function(val) {
	let n = this.root.searchN(val);
	return n.leaves;
}

Tree.prototype.displayLeafDepth = function(val) {
	let n = this.root.searchN(val);
	if (n.division1 == null && n.division2 == null) {
		return  1 + this.deep - n.depth;
	}
	return 1; 
}

// ==============================================================================
// ============================== BINARY TREE NODE ==============================
// ==============================================================================

function Node(intIP, mask){
	this.mask = mask; // Number of Bits in the Network Mask
	this.intIP = intIP; // IPv4 Address as a 32 bit integer 
	this.intMask = 0; // Network Mask as a 32 bit integer
	for(let i=0; i<mask; ++i) { this.intMask += Math.pow(2,31-i); }

	this.intIP = this.bitAnd(this.intIP,this.intMask); // Mask off Hosts from Network IP

	this.network = this.toAddr(this.intIP); // Network IPv4 Address in the form w.x.y.z
	this.netmask = this.toAddr(this.intMask); // Network Mask IPv4 Address in the form w.x.y.z
	this.count = Math.pow(2, 32 - this.mask); // Number of possible Host IP addresses
	this.first = this.toAddr(this.intIP); // First IPv4 Address in the Network  in the form w.x.y.z
	this.last = this.toAddr(this.intIP + this.count - 1); // Last IPv4 Address in the Network  in the form w.x.y.z
	this.leaves = null; // Number of Leaves following this Node 
    this.depth = null; // Depth of this Node in the Tree
    this.id = null; // Node ID
    this.path = []; // List of Node IDs that form a Path from the Root Node to this Node
    this.division1 = null; // Lower Half of a Divided Subnet from this Node
    this.division2 = null; // Upper Half of a Divided Subnet from this Node 
}

Node.prototype.bitAnd = function(a,b) {
	let x, p;
	x = 0;
	for(let i=31; i>=0; --i) {
		p = Math.pow(2,i);
		x += (a>=p && b>=p) ? p : 0;
		a -= (a>=p) ? p : 0;
		b -= (b>=p) ? p : 0;
	}
	return x;
}

Node.prototype.getDeep = function() {
	if (this.division1 == null && this.division2 == null) return 1;
	return Math.max(this.division1.getDeep(), this.division2.getDeep()) + 1;
}

Node.prototype.nodeLeaves = function() {
	if (this == null) return 0;
	if (this.division1 == null && this.division2 == null) return 1;
	return this.division1.nodeLeaves() + this.division2.nodeLeaves();
}

Node.prototype.allNodesLeaves = function() {
	this.leaves = this.nodeLeaves();
	if (this.division1 != null) this.division1.allNodesLeaves();
	if (this.division2 != null) this.division2.allNodesLeaves();
}

Node.prototype.toAddr = function(val) {
	let oct = [];
	for(let i=0; i<4; ++i) {
		oct[i] = Math.floor(val / Math.pow(256,3-i));
		val = val %  Math.pow(256,3-i);
	}
	return oct[0] + "." + oct[1] + "." + oct[2] + "." + oct[3];
}

Node.prototype.searchN = function(val) {
	if (this.id == val) {
		return this;
	} else if (val < this.id && this.division1 != null) {
		return this.division1.searchN(val);
	} else if (val > this.id && this.division2 != null) {
		return this.division2.searchN(val);
	}
	return null;
}

Node.prototype.showT = function(a) {
	if (this.division1 != null) {
		this.division1.showT(a);
	}
	if (this.division1 == null && this.division2 == null) {
		let tmp = { 
			network: this.network, 
			mask: this.mask, 
			netmask: this.netmask, 
			first:this.first, 
			last:this.last, 
			depth:this.depth, 
			count:this.count, 
			id:this.id, 
			path:this.path,
			leaves:this.leaves 
		};
		a.push(tmp);
	}
	if (this.division2 != null) {
		this.division2.showT(a);
	}
	return a;
}
