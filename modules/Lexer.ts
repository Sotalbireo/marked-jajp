import Util from "./Util"
import * as $ from "./lib"

/**
 * Lexer
 */
class Lexer {

	constructor(argument) {
		// code...
	}

	preLex = (src:string) => {
		src = src
			.replace(/\r\n|\r/g, '\n')
			.replace(/\t/g, '    ')
			.replace(/\u00a0/g, ' ')
			.replace(/\u2424/g, '\n')
		return this.lex(src, true)
	}

	/**
	 * Lexing
	 */
	lex = (src:string, isTop:boolean, isBq=false) => {
		src = src.replace(/^ +$/gm, '')
		let token

		while(src) {

			if(token = this.rules.newline.exec(src)) {
				src = src.substring(token[0].length)
				if(token[0].length > 1) {
					this.tokens.push({
						type: 'space'
					})
				}
			}

			if() {

			}

		}
	}
}
