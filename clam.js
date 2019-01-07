const fs = require("fs");
const p = console.log;

var argCount = 0;
var argsRead = 0;

var dictionary = [
	"zero","one","two","three","four","five","six","seven","eight","nine",
	"myVar", "hello", "world"
];

var map = {
	"a": (code, i) => dictionary[code[codeIndex++].charCodeAt(0)-32],
	"e": (code, i) => op("==", code, i),
	"f": (code, i) => parseFunc(code, i),
	"i": (code, i) => evalToken(code, i+1) + "++",
	"p": (code, i) => "console.log(" + evalToken(code, i+1) + ")",
	"r": (code, i) => argsRead < argCount ? "arguments[" + argsRead++ + "]" : "<EOF>",
	"u": (code, i) => { let str = evalToken(code, i+1); return str.charAt(0).toUpperCase() + str.slice(1); },
	"U": (code, i) => `(${evalToken(code, i+1)}).toUpperCase()`,
	"?": (code, i) => { let cond = evalToken(code, i+1), trueArm = evalToken(code, codeIndex); return `if (${cond}) ${trueArm}`; },
	"\"": (code, i) => { let str = code[i]; while(code[codeIndex] != "\"") str += code[codeIndex++]; return str += code[codeIndex++]; },
	"'": (code, i) => "'" + evalToken(code, i+1) + "'",
	"[": (code, i) => `'${parseArr(code, i, ", ")}'`,
	"&": (code, i) => op("&&", code, i),
	"|": (code, i) => op("||", code, i),
};

for(let i = 0; i < 10; i++) map[""+i] = ()=>""+i;
for(let x of "=+-^/%*".split("")) map[x] = (code, i)=>op(x, code, i);

var codeIndex = 0;
var errored = false;

function op(operator, code, i) {
	if (code[i+1] !== "[") return evalToken(code, i+1) + ` ${operator} ` + evalToken(code, codeIndex);
	else return parseArr(code, i+1, ` ${operator} `);
}

function func(funcName, code, i) {
	if (code[i+1] !== "[") return funcName + "(" + evalToken(code, i+1) + ")";
	else return funcName + "(" + parseArr(code, i+1, ", ") + ")";
}

function parseArr(code, i, delimiter) {
	let items = getArrValues(code, i);
	let str = "";
	for(let item of items) {
		str += item + delimiter;
	}
	str = str.replace(new RegExp(escape(delimiter) + "$"), "");

	return str;
}

function getArrValues(code, i) {
	let items = [];
	i++;
	while(code[i] != "]") {
		items.push(evalToken(code, i));
		i = codeIndex;
	}
	codeIndex++;
	return items;
}

function transpile(code) {
	let newCode = "() => {\n";

	for(; codeIndex < code.length && !errored;) {
		let evalCode = evalToken(code, codeIndex);
		evalCode = evalCode.split("\n").map(x => "\t" + x).join("\n");
		newCode += evalCode + ";\n";
	}

	return errored ? "" : newCode + "}";
}

function evalToken(code, i, ...extraParams) {
	if (i == codeIndex) codeIndex++;
	else codeIndex = i+1;
	if (map[code[i]]) return map[code[i]](code, i, ...extraParams);
}

function parseFunc(code, i) {
	if (code[i+1] !== "(") e(code, i, "Expected `(' but got `" + code[i+1] + "'");

	i++;

	let funcCode = "";
	while(code[++i] !== ")") {
		funcCode += "\t" + evalToken(code, i) + ";\n";
	}

	let funcName = evalToken(code, ++i);

	return funcName + "() {\n" + funcCode + "}";
}

function e(code, i, message) {
	console.error(`${message}\nat ${i} in\n${code}`);
	errored = true;
}

function escape(regex) {
	let escaped = "+[-(|$^".split("");
	for(let esc of escaped) regex = regex.replace(new RegExp("\\"+esc), "\\"+esc);
	return regex;
}

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
	argCount = inputs.length;
	var transpiled = transpile(code);
	if (!errored) {
		if (debug) p(transpiled);
		else eval(transpiled)(...inputs);
	}
});

