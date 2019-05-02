const dictionary = require("./dictionary.json");

const maps = [
	{
		"a": (code, i, t) => dictionary[code[t.codeIndex++].charCodeAt(0)-32],
		"e": (code, i, t) => op("==", code, i, t),
		"i": (code, i, t) => t.evalToken(code, i+1) + "++",
		"d": (code, i, t) => t.evalToken(code, i+1) + "--",
		"n": (code, i, t) => t.evalToken(code, i+1) + ".length",
		"p": (code, i, t) => { t.out = false; return func("console.log", code, i, t) },
		"Q": (code, i, t) => "Q",
		"q": (code, i, t) => "q",
		"r": (code, i, t) => t.argsRead < t.argCount ? "arguments[" + t.argsRead++ + "]" : "<EOF>",
		"R": (code, i, t) => { if (/\d/.test(code[i+1])) { let nxt = t.evalToken(code, i+1); return "arguments[" + nxt + "]"; } else return "arguments[0]"; },
		"u": (code, i, t) => { let str = t.evalToken(code, i+1); return str.charAt(0).toUpperCase() + str.slice(1); },
		"U": (code, i, t) => `(${this.evalToken(code, i+1)}).toUpperCase()`,
		"l": (code, i, t) => { let str = t.evalToken(code, i+1); return str.charAt(0).toLowerCase() + str.slice(1); },
		"L": (code, i, t) => `(${this.evalToken(code, i+1)}).toLowerCase()`,
		"w": (code, i, t) => { let cond = t.evalToken(code, i+1), loop = t.evalToken(code, t.codeIndex); return `while(${cond}) ${loop}`; },
		"?": (code, i, t) => { let cond = t.evalToken(code, i+1), trueArm = t.evalToken(code, t.codeIndex); return `if (${cond}) ${trueArm}`; },
		"\"": (code, i, t) => { let str = code[i]; while(code[t.codeIndex] != "\"") str += code[t.codeIndex++]; return str += code[t.codeIndex++]; },
		"'": (code, i, t) => "'" + t.evalToken(code, i+1) + "'",
		"#": (code, i, t) => { let cond = t.evalToken(code, i+1), arr = t.evalToken(code, t.codeIndex); return `${arr}.filter(q => ${cond})`; },
		"~": (code, i, t) => func("properDivisors", code, i, t),
		"[": (code, i, t) => `'${t.parseArr(code, i, ", ")}'`,
		"_": (code, i, t) => { let arr = t.evalToken(code, i+1); return `${arr}.sort()`; },
		"^": (code, i, t) => op("**", code, i, t),
		"&": (code, i, t) => op("&&", code, i, t),
		"|": (code, i, t) => op("||", code, i, t),
		":": (code, i, t) => op("==", code, i, t),
		";": (code, i, t) => { let arr = t.evalToken(code, i+1); return `(${arr}.length>0?${arr}.reduce((a,b) => a * b):0)`; },
		"`": (code, i, t) => { let pred = t.evalToken(code, i+1), arr = t.evalToken(code, t.codeIndex); return `${arr}.map(q => ${pred})`; },
		"{": (code, i, t) => { let a = t.evalToken(code, i+1); return `${a}[0]`; },
		"}": (code, i, t) => { let a = t.evalToken(code, i+1); return `${a}.reverse()[0]`; },
		"@": (code, i, t) => t.evalToken(code, i+1, maps[1]),
	},
	{
		"p": (code, i, t) => Math.PI,
		"s": (code, i, t) => func("powerset", code, i, t)
	}
];

for(let i = 0; i < 10; i++) maps[0][i] = ()=>i;
for(let x of "=+-/%*<>".split("")) maps[0][x] = (code, i, t) => op(x, code, i, t);
	
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
		this.out = true;

		this.codeIndex = 0;
		this.errored = false;

		this.map = maps[0];
	}

	transpile(code) {
		let newCode = "{\n\tvar Q = arguments[0] || 0;\n";

		while(this.codeIndex < code.length && !this.errored) {
			if (code[this.codeIndex] == "\n") { this.codeIndex++; continue; }
			let evalCode = this.evalToken(code, this.codeIndex);
			evalCode = evalCode.split("\n").map(x => "\t" + x).join("\n");
			newCode += evalCode + ";\n";
		}

		if (this.out) {
			newCode += "\tconsole.log(Q);\n";
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
