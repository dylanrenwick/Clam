const dictionary = require("./dictionary.json");

const maps = [
	{
		"a": (code, i, t) => dictionary[code[t.codeIndex++].charCodeAt(0)-32],
		"e": (code, i, t) => op("==", code, i, t),
		/*"f": (code, i, t) => this.parseFunc(code, i),*/
		"i": (code, i, t) => t.evalToken(code, i+1) + "++",
		"d": (code, i, t) => t.evalToken(code, i+1) + "--",
		"p": (code, i, t) => func("console.log", code, i, t),
		"r": (code, i, t) => t.argsRead < t.argCount ? "arguments[" + t.argsRead++ + "]" : "<EOF>",
		"u": (code, i, t) => { let str = t.evalToken(code, i+1); return str.charAt(0).toUpperCase() + str.slice(1); },
		"U": (code, i, t) => `(${this.evalToken(code, i+1)}).toUpperCase()`,
		"l": (code, i, t) => { let str = t.evalToken(code, i+1); return str.charAt(0).toLowerCase() + str.slice(1); },
		"L": (code, i, t) => `(${this.evalToken(code, i+1)}).toLowerCase()`,
		"w": (code, i, t) => { let cond = t.evalToken(code, i+1), loop = t.evalToken(code, t.codeIndex); return `while(${cond}) ${loop}`; },
		"?": (code, i, t) => { let cond = t.evalToken(code, i+1), trueArm = t.evalToken(code, t.codeIndex); return `if (${cond}) ${trueArm}`; },
		"\"": (code, i, t) => { let str = code[i]; while(code[t.codeIndex] != "\"") str += code[t.codeIndex++]; return str += code[t.codeIndex++]; },
		"'": (code, i, t) => "'" + t.evalToken(code, i+1) + "'",
		"[": (code, i, t) => `'${t.parseArr(code, i, ", ")}'`,
		"^": (code, i, t) => op("**", code, i, t),
		"&": (code, i, t) => op("&&", code, i, t),
		"|": (code, i, t) => op("||", code, i, t),
		"@": (code, i, t) => t.evalToken(code, i+1, maps[1]),
	},
	{
		"p": (code, i, t) => Math.PI
	}
];

for(let i = 0; i < 10; i++) maps[0][i] = ()=>i;
for(let x of "=+-/%*".split("")) maps[0][x] = (code, i, t) => op(x, code, i, t);
	
function op(operator, code, i, t) {
	if (code[i+1] !== "[") return "(" + t.evalToken(code, i+1) + ` ${operator} ` + t.evalToken(code, t.codeIndex) + ")";
	else return "(" + t.parseArr(code, i+1, ` ${operator} `) + ")";
}

function func(funcName, code, i, t) {
	if (code[i+1] !== "[") return funcName + "(" + t.evalToken(code, i+1) + ")";
	else return funcName + "(" + t.parseArr(code, i+1, ", ") + ")";
}

module.exports = class Transpiler {
	constructor(parent = null) {
		this.argCount = 0;
		this.argsRead = 0;
		this.parent = parent;

		this.codeIndex = 0;
		this.errored = false;

		this.map = maps[0];
	}

	transpile(code) {
		let newCode = "{\n";

		while(this.codeIndex < code.length && !this.errored) {
			if (code[this.codeIndex] == "\n") { this.codeIndex++; continue; }
			let evalCode = this.evalToken(code, this.codeIndex);
			evalCode = evalCode.split("\n").map(x => "\t" + x).join("\n");
			newCode += evalCode + ";\n";
		}

		return this.errored ? false : newCode + "}";
	}

	evalToken(code, i, map = null) {
		if (i == this.codeIndex) this.codeIndex++;
		else this.codeIndex = i + 1;
		if ((map || this.map)[code[i]]) return (map || this.map)[code[i]](code, i, this);
		else return "";
	}

	parseArr(code, i, delimiter) {
		let items = this.getArrValues(code, i);
		let str = "";
		for(let item of items) {
			str += item + delimiter;
		}
		return str.replace(new RegExp(this.regexEscape(delimiter) + "$"), "");
	}

	getArrValues(code, i) {
		let items = [];
		i++;
		while(code[i] != "]") {
			items.push(this.evalToken(code, i));
			i = this.codeIndex;
		}
		this.codeIndex++;
		return items;
	}

	/*
	function parseFunc(code, i) {
		if (code[i+1] !== "(") e(code, i, "Expected `(' but got `" + code[i+1] + "'");

		i++;

		let funcCode = "";
		while(code[++i] !== ")") {
			funcCode += "\t" + evalToken(code, i) + ";\n";
		}

		let funcName = evalToken(code, ++i);

		return funcName + "() {\n" + funcCode + "}";
	}*/

	regexEscape(regex) {
		let escaped = "+[-(|$^".split("");
		for(let esc of escaped) regex = regex.replace(new RegExp("\\"+esc), "\\"+esc);
		return regex;
	}

	e(code, i, message) {
		console.error(`${message}\nat ${i} in\n${code}`);
		this.errored = true;
	}
};
