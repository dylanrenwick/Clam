const fs = require("fs");
const Transpiler = require("./transpiler.js");

var code = process.argv[2];
var debug = process.argv[3] =="-v";
if (code == "-f") {
	code = fs.readFileSync(process.argv[3], "utf8");
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
	inputs = inputs.map(x => x.trim()).map(x => isNaN(parseInt(x)) ? x : parseInt(x));

	let transpiler = new Transpiler();
	transpiler.argCount = inputs.length;
	var transpiled = transpiler.transpile(code);
	transpiled = `function __clam_main() ${transpiled}\n__clam_main(...inputs);`;

	if (!transpiler.errored) {
		if (debug) console.log(JSON.stringify(inputs) + "\n\n" + transpiled);
		else eval(transpiled);
	}
});

