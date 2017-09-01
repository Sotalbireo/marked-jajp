import Renderer = require("./modules/Renderer");

/**
 * marked
 * Arranged by Sota Sasaki. (Licenses Inheritanced)
 * https://github.com/sotalbireo
 */
class Marked {
	private block:any
	private inline:any
	private options:any
	Renderer = Renderer
	setBlockExp = (noop:any) => {
		this.block = {
			newline: /^\n+/,
			code: /^( {4}[^\n]+\n*)+/,
			fences: noop,
			hr: /^( *[-*_]){3,} *(?:\n+|$)/,
			heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
			nptable: noop,
			lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
			blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
			list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
			html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
			def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
			table: noop,
			paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
			text: /^[^\n]+/
		}

		const bullet = /(?:[*+-]|\d+\.)/
		const _tag = '(?!(?:'
			+ 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
			+ '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
			+ '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b'

		this.block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
		this.block.item = Marked.replace(this.block.item, 'gm')
			(/bull/g, bullet)
			()

		this.block.list = Marked.replace(this.block.list)
			(/bull/g, bullet)
			('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
			('def', '\\n+(?=' + block.def.source + ')')
			();

		this.block.blockquote = Marked.replace(this.block.blockquote)
			('def', block.def)
			();

		this.block.html = Marked.replace(this.block.html)
			('comment', /<!--[\s\S]*?-->/)
			('closed', /<(tag)[\s\S]+?<\/\1>/)
			('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
			(/tag/g, _tag)
			();

		this.block.paragraph = Marked.replace(this.block.paragraph)
			('hr', block.hr)
			('heading', block.heading)
			('lheading', block.lheading)
			('blockquote', block.blockquote)
			('tag', '<' + _tag)
			('def', block.def)
			();

		/**
		 * Normal Block Grammar
		 */
		this.block.normal = Marked.merge({}, this.block)

		/**
		 * GFM Block Grammar
		 */
		this.block.gfm = Marked.merge({}, this.block.normal, {
			fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
			paragraph: /^/,
			heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
		})
		this.block.gfm.paragraph = Marked.replace(this.block.paragraph)
			('(?!', '(?!'
				+ this.block.gfm.fences.source.replace('\\1', '\\2') + '|'
				+ this.block.list.source.replace('\\1', '\\3') + '|')
			()

		/**
		 * GFM + Tables Block Grammar
		 */
		this.block.tables = Marked.merge({}, this.block.gfm, {
			nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
			table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
		});
	}
	setInlineExp = () => {
		this.inline = {}
	}
	setOptions = (opts) => {
		this.options = {}
	}

	static render = (markdownString:string, options:any = {}, callback?:Function) => {
		if(typeof options === 'function') {
			callback = options
			options = {}
		}
		options = Marked.merge({}, Marked.defaults, options)
		const m = new Marked(options)
		return m.render(markdownString, options, callback)
	}
	render = (src:string, opt, callback) => {
		try {
			return Marked.Parser.parse(Lexer.lex(src, opt), opt);
		} catch (e) {
			e.message += '\nPlease report this to https://github.com/sotalbireo/a-la-carte.';
			if (this.options.silent) {
				return `<p>An error occured:</p><pre>${Marked.escape(e.message + '', true)}</pre>`;
			}
			throw e;
		}
	}

	constructor(opts:object = {}) {
		// set noop
		let noop = ()=>{}
		(noop as any).exec = noop

		this.setBlockExp(noop)
		this.setInlineExp()
		this.setOptions(opts)

	}


	static getRule = (flag:'block'|'inline', opt:'normal'|'gfm'|'tables') => (
		if(this.option)
	)

	private static escape = (html:string, encode=false, map={'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}) => html.replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;').replace(/[<>"']/g, (m:'<'|'>'|'"'|"'")=>map[m])
	private static unescape = (html:string) => {
		// explicitly match decimal, hex, and named HTML entities
		return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, (_, n) => {
			n = n.toLowerCase()
			if (n === 'colon') return ':'
			if (n.charAt(0) === '#') {
				return n.charAt(1) === 'x'
					? String.fromCharCode(parseInt(n.substring(2), 16))
					: String.fromCharCode(+n.substring(1))
			}
			return ''
		})
	}
	private static replace = (regex:any, opt='') => {
		let src = regex.source
		return function self(name:any, val:any) {
			if(!name) return new RegExp(src, opt)
			let lVal = val.source || val
			lVal = lVal.replace(/(^|[^\[])\^/g, '$1')
			src = src.replace(name, lVal)
			return self
		}
	}
	private static merge = (...obj:any[]) => {
		let targ:any, key:any;
		for(let i = 1; i < obj.length; ++i) {
			targ = obj[i]
			for(key in targ) {
				if((targ as object).hasOwnProperty(key)) {
					obj[0][key] = targ[key]
				}
			}
		}
		return obj[0] as object
	}


	/**
 * Lexer
 */
	private static Lexer = class Lexer {
		private tokens:any
		private options:any
		private rules:any
		constructor(opts) {
			this.options = opts || Marked.defaults
			this.rules = this.options.gfm ?
				this.options.tables ? block.tables
				: block.gfm
				: block.normal
		}

		/**
		 * Static Lex Method
		 */
		static lex = (src:string, opts) => {
			const lexer = new Marked.Lexer(opts)
			return lexer.lex(src)
		}
		/**
		 * Preprocessing
		 */
		lex = (src:string) => {
			src = src
				.replace(/\r\n|\r/g, '\n')
				.replace(/\t/g, '    ')
				.replace(/\u00a0/g, ' ')
				.replace(/\u2424/g, '\n')
			return this.token(src, true)
		}

		/**
		 * Lexing
		 */
		token = (src:string, top:boolean, bq=false) => {
			src = src.replace(/^ +$/gm, '')
			let next, loose, cap:RegExpExecArray, bull, b, item, space, i, l

			while(src) {
				// newline
				if(cap = this.rules.newline.exec(src)) {
					src = src.substring(cap[0].length)
					if(cap[0].length > 1) {
						this.tokens.push({
							type: 'space'
						})
					}
				}
				// code
				if(cap = this.rules.code.exec(src)) {
					src = src.substring(cap[0].length);
					let a = cap[0].replace(/^ {4}/gm, '');
					this.tokens.push({
						type: 'code',
						text: !this.options.pedantic ? a.replace(/\n+$/, '') : a
					});
					continue;
				}
				// fences (gfm)
				if (cap = this.rules.fences.exec(src)) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'code',
						lang: cap[2],
						text: cap[3] || ''
					});
					continue;
				}
				// heading
				if (cap = this.rules.heading.exec(src)) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'heading',
						depth: cap[1].length,
						text: cap[2]
					});
					continue;
				}
				// table no leading pipe (gfm)
				if (top && (cap = this.rules.nptable.exec(src))) {
					src = src.substring(cap[0].length);
					item = {
						type: 'table',
						header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
						align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
						cells: cap[3].replace(/\n$/, '').split('\n')
					};
					for (i = 0; i < item.align.length; i++) {
						if (/^ *-+: *$/.test(item.align[i])) {
							item.align[i] = 'right';
						} else if (/^ *:-+: *$/.test(item.align[i])) {
							item.align[i] = 'center';
						} else if (/^ *:-+ *$/.test(item.align[i])) {
							item.align[i] = 'left';
						} else {
							item.align[i] = '';
						}
					}
					for (i = 0; i < item.cells.length; i++) {
						item.cells[i] = item.cells[i].split(/ *\| */);
					}
					this.tokens.push(item);
					continue;
				}
			// _end while(src)
			}
		}
	}


}

