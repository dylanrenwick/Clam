const dictionary = require("./dictionary.json");

module.exports = class Transpiler {
	constructor(parent = null) {
		this.argCount = 0;
		this.argsRead = 0;
		this.parent = parent;

		this.codeIndex = 0;
		this.errored = false;

		this.map = {
			"a": (code, i) => dictionary[code[this.codeIndex++].charCodeAt(0)-32],
			"e": (code, i) => this.op("==", code, i),
			/*"f": (code, i) => this.parseFunc(code, i),*/
			"i": (code, i) => this.evalToken(code, i+1) + "++",
			"d": (code, i) => this.evalToken(code, i+1) + "--",
			"p": (code, i) => this.func("console.log", code, i),
			"r": (code, i) => this.argsRead < this.argCount ? "arguments[" + this.argsRead++ + "]" : "<EOF>",
			"u": (code, i) => { let str = this.evalToken(code, i+1); return str.charAt(0).toUpperCase() + str.slice(1); },
			"U": (code, i) => `(${this.evalToken(code, i+1)}).toUpperCase()`,
			"l": (code, i) => { let str = this.evalToken(code, i+1); return str.charAt(0).toLowerCase() + str.slice(1); },
			"L": (code, i) => `(${this.evalToken(code, i+1)}).toLowerCase()`,
			"w": (code, i) => { let cond = this.evalToken(code, i+1), loop = this.evalToken(code, this.codeIndex); return `while(${cond}) ${loop}`; },
			"?": (code, i) => { let cond = this.evalToken(code, i+1), trueArm = this.evalToken(code, this.codeIndex); return `if (${cond}) ${trueArm}`; },
			"\"": (code, i) => { let str = code[i]; while(code[this.codeIndex] != "\"") str += code[this.codeIndex++]; return str += code[this.codeIndex++]; },
			"'": (code, i) => "'" + this.evalToken(code, i+1) + "'",
			"[": (code, i) => `'${this.parseArr(code, i, ", ")}'`,
			"&": (code, i) => this.op("&&", code, i),
			"|": (code, i) => this.op("||", code, i),
		};

		for(let i = 0; i < 10; i++) this.map[i] = ()=>""+i;
		for(let x of "=+-/%*".split("")) this.map[x] = (code, i)=>this.op(x, code, i);
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

	evalToken(code, i) {
		if (i == this.codeIndex) this.codeIndex++;
		else this.codeIndex = i + 1;
		if (this.map[code[i]]) return this.map[code[i]](code, i);
		else return "";
	}

	op(operator, code, i) {
		if (code[i+1] !== "[") return "(" + this.evalToken(code, i+1) + ` ${operator} ` + this.evalToken(code, this.codeIndex) + ")";
		else return "(" + this.parseArr(code, i+1, ` ${operator} `) + ")";
	}

	func(funcName, code, i) {
		if (code[i+1] !== "[") return funcName + "(" + this.evalToken(code, i+1) + ")";
		else return funcName + "(" + this.parseArr(code, i+1, ", ") + ")";
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
