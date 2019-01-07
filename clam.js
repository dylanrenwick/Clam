const fs = require("fs");
const Transpiler = require("./transpiler.js");

var code = process.argv[2];
var debug = process.argv[3] =="-v";
if (code == "-f") {
	code = fs.readFileSync(process.argv[3]);
	debug = process.argv[4] == "-v";
}

var started = false;
var inputs = [];

process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
	if (started) return;
	started = true;

	var chunk = process.stdin.read();
	if (chunk !== null) {
		inputs = chunk.split("\n");
	}

	let transpiler = new Transpiler();
	transpiler.argCount = inputs.length;
	var transpiled = transpiler.transpile(code);

	if (!transpiler.errored) {
		if (debug) console.log(transpiled);
		else eval(transpiled)(...inputs);
	}
});

