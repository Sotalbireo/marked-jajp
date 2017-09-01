/**
 * Parser
 */
class Parser {
	private tokens :token[]
	private token :token
	private options



	static parse = (text:any[]) => {
		const p = new Parser()
		return p.parse(text)
	}
	parse = (src:any[]) => {
		this.tokens = src.reverse()
		let out = ''
		while(this.next()) {
			out += this.tok()
		}
		return out
	}



	/**
	 * Next token
	 * @return {token}
	 */
	next = () => this.token = this.tokens.pop()

	/**
	 * Preview next token
	 * @param {void}
	 * @return token{token}
	 */
	peek = () => this.tokens[this.tokens.length - 1] || 0



	/**
	 * Parse text tokens
	 */
	parseText = () => {
		let body = this.token.text
		while(this.peek().type === 'text') {
			body += `\n${this.next().text}`
		}
		return this.inline.output(body)
	}


	/**
	 * Parse current token
	 */
	tok = () => {
		switch(this.token.type) {
			case 'space':
				return ''
			case 'hr':
				return this.renderer.hr()
			case 'text':
			default:
				return this.renderer.paragraph(this.parseText())
		}
	}
}

export default Parser
