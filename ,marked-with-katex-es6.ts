// <reference path="../marked-dts/marked/index.d.ts" />

/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */
/**
 * marked with KaTex
 * Arranged by Sota Sasaki. (Licenses Inheritanced)
 * https://github.com/sotalbireo
 */
/**
 * KaTeX
 * KaTeX is a fast, easy-to-use JavaScript library for TeX math rendering on the web.
 * https://github.com/Khan/KaTeX
 */


declare interface MarkedOptions {
	gfm?: boolean;
	tables?: boolean;
	breaks?: boolean;
	pedantic?: boolean;
	sanitize?: boolean;
	sanitizer? (html: string): string;
	mangle?: boolean;
	smartLists?: boolean;
	silent?: boolean;
	highlight? (code: string, lang: string, callback?: Function): string;
	langPrefix?: string;
	smartypants?: boolean;
	headerPrefix?: string;
	renderer?: Renderer;
	xhtml?: boolean;
}











declare interface Marked {
	options: MarkedOptions
	defaults: MarkedOptions
}
class Marked {

	constructor(opt?:MarkedOptions) {
		this.options = Marked.merge(Marked.defaults, opt || {})
	}
	private postConstructor(src:string, opt?:any, callback?:Function) {
		if (callback || typeof opt === 'function') {
			if (!callback) {
				callback = opt as Function;
				opt = null;
			}

			opt = Marked.merge({}, Marked.defaults, opt || {});

			let highlight = opt.highlight
				, tokens:any
				, pending:any
				, i = 0;

			try {
				tokens = Marked.Lexer.lex(src, opt)
			} catch (e) {
				return callback(e);
			}

			pending = tokens.length;

			let done = function(err?) {
				if (err) {
					opt.highlight = highlight;
					return callback!(err);
				}

				let out;

				try {
					out = Parser.parse(tokens, opt);
				} catch (e) {
					err = e;
				}

				opt.highlight = highlight;

				return err
					? callback(err)
					: callback(null, out);
			};

			if (!highlight || highlight.length < 3) {
				return done();
			}

			delete opt.highlight;

			if (!pending) return done();

			for (; i < tokens.length; i++) {
				(function(token) {
					if (token.type !== 'code') {
						return --pending || done();
					}
					return highlight(token.text, token.lang, function(err, code) {
						if (err) return done(err);
						if (code == null || code === token.text) {
							return --pending || done();
						}
						token.text = code;
						token.escaped = true;
						--pending || done();
					});
				})(tokens[i]);
			}

			return;
		}
		try {
			if (opt) opt = Marked.merge({}, Marked.defaults, opt);
			return Parser.parse(Marked.Lexer.lex(src, opt), opt);
		} catch (e) {
			e.message += '\nPlease report this to https://github.com/chjj/marked.';
			if ((opt || Marked.defaults).silent) {
				return '<p>An error occured:</p><pre>'
					+ Marked.escape(e.message + '', true)
					+ '</pre>';
			}
			throw e;
		}
	}


	//
	// Helpers
	//

	static escape(html: string, encode?: boolean) {
		return html
			.replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	static unescape(html: string) {
		// explicitly match decimal, hex, and named HTML entities
		return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, function(_, n) {
			n = n.toLowerCase();
			if (n === 'colon') return ':';
			if (n.charAt(0) === '#') {
				return n.charAt(1) === 'x'
					? String.fromCharCode(parseInt(n.substring(2), 16))
					: String.fromCharCode(+n.substring(1));
			}
			return '';
		});
	}

	static replace(regex:RegExp, opt?:string): (name:any, val:RegExp|string)=>RegExp|any {
		let _regex = regex.source;
		opt = opt || '';
		return function self(name:any, val:RegExp|string) {
			if (!name) return new RegExp(_regex, opt);
			val = (val as RegExp).source || val;
			val = (val as string).replace(/(^|[^\[])\^/g, '$1');
			_regex = _regex.replace(name, val);
			return self;
		};
	}

	static merge(...obj: any[]): any {
		let i = 1
			, target
			, key:any;
		for (; i < obj.length; i++) {
			target = obj[i];
			for (key in target) {
				if (Object.prototype.hasOwnProperty.call(target, key)) {
					obj[key] = target[key];
				}
			}
		}
		return obj;
	}




	//
	// Options
	//
	// static setOptions = (opt: MarkedOptions) => {
	// 	Marked.merge(Marked.defaults, opt);
	// 	return Marked;
	// }
	static defaults: MarkedOptions = {
		gfm: true,
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: false,
		sanitizer: null,
		mangle: true,
		smartLists: false,
		silent: false,
		highlight: null,
		langPrefix: 'lang-',
		smartypants: false,
		headerPrefix: '',
		renderer: new Renderer,
		xhtml: false
	}
}
namespace Marked {
	/**
	 * Block-Level Grammar
	 */
	declare interface block {
		newline: RegExp
		code: RegExp
		fences: RegExp|(()=>void)
		hr: RegExp
		heading: RegExp
		nptable: RegExp|(()=>void)
		lheading: RegExp
		blockquote: RegExp
		list: RegExp
		html: RegExp
		def: RegExp
		table: RegExp|(()=>void)
		paragraph: RegExp
		text: RegExp
		bullet?: RegExp
		item?: RegExp
		_tag?: string
		/**
		 * Normal Block Grammar
		 */
		normal?: block
		/**
		 * GFM Block Grammar
		 */
		gfm?: block
		/**
		 * GFM + Tables Block Grammar
		 */
		tables?: block
	}
	/**
	 * Noop
	 */
	function noop() {}
	noop.prototype.exec = noop()

	let block: block = {
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
		paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def|mathjax))+)\n*/,
		text: /^[^\n]+/
	};

	block.bullet = /(?:[*+-]|\d+\.)/;
	block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
	block.item = Marked.replace(block.item, 'gm')
		(/bull/g, block.bullet)
		();

	block.list = Marked.replace(block.list)
		(/bull/g, block.bullet)
		('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
		('def', '\\n+(?=' + block.def.source + ')')
		();

	block.blockquote = Marked.replace(block.blockquote)
		('def', block.def)
		();

	block._tag = '(?!(?:'
		+ 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
		+ '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
		+ '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

	block.html = Marked.replace(block.html)
		('comment', /<!--[\s\S]*?-->/)
		('closed', /<(tag)[\s\S]+?<\/\1>/)
		('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
		(/tag/g, block._tag)
		();

	block.paragraph = Marked.replace(block.paragraph)
		('hr', block.hr)
		('heading', block.heading)
		('lheading', block.lheading)
		('blockquote', block.blockquote)
		('tag', '<' + block._tag)
		('def', block.def)
		();

	block.normal = Marked.merge({}, block);

	block.gfm = Marked.merge({}, block.normal, {
		fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
		paragraph: /^/,
		heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
	});
	block.gfm!.paragraph = Marked.replace(block.paragraph)
		('(?!', '(?!'
			+ (block.gfm!.fences as RegExp).source.replace('\\1', '\\2') + '|'
			+ block.list.source.replace('\\1', '\\3') + '|')
		();

	block.tables = Marked.merge({}, block.gfm, {
		nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
		table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
	});

	/**
	 * Inline-Level Grammar
	 */
	declare interface inline {
		escape: RegExp
		autolink: RegExp
		url: RegExp | (()=>void)
		tag: RegExp
		link: RegExp
		reflink: RegExp
		nolink: RegExp
		strong: RegExp
		em: RegExp
		code: RegExp
		br: RegExp
		del: RegExp | (()=>void)
		text: RegExp
		_inside?: RegExp
		_href?: RegExp
		/**
		 * Normal Inline Grammar
		 */
		normal?: inline
		/**
		 * Pedantic Inline Grammar
		 */
		pedantic?: inline
		/**
		 * GFM Inline Grammar
		 */
		gfm?: inline
		/**
		 * GFM + Line Breaks Inline Grammar
		 */
		breaks?: inline
	}

	let inline: inline = {
		escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
		autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
		url: noop,
		tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
		link: /^!?\[(inside)\]\(href\)/,
		reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
		nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
		strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
		em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
		code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
		br: /^ {2,}\n(?!\s*$)/,
		del: noop,
		text: /^[\s\S]+?(?=[\\\$<!\[_*`]| {2,}\n|$)/
	};

	inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
	inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

	inline.link = Marked.replace(inline.link)
		('inside', inline._inside)
		('href', inline._href)
		();

	inline.reflink = Marked.replace(inline.reflink)
		('inside', inline._inside)
		();

	inline.normal = Marked.merge({}, inline);

	inline.pedantic = Marked.merge({}, inline.normal, {
		strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
		em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
	});

	inline.gfm = Marked.merge({}, inline.normal, {
		escape: Marked.replace(inline.escape)('])', '~|])')(),
		url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
		del: /^~~(?=\S)([\s\S]*?\S)~~/,
		text: Marked.replace(inline.text)
			(']|', '~]|')
			('|', '|https?://|')
			()
	});
	inline.breaks = Marked.merge({}, inline.gfm, {
		br: Marked.replace(inline.br)('{2,}', '*')(),
		text: Marked.replace(inline.gfm!.text)('{2,}', '*')()
	});




	declare interface token {
		type:   string

		// code tokens
		lang?:  string
		// heading tokens
		depth?: number
		//list item tokens
		ordered?: boolean

		text?:  string

		// table tokens
		header?: string[]
		align?: string[]
		cells?: string[]

		// html tokens
		pre?: boolean

		/**
		 * definition link tokens
		 * call "as any" this.tokens
		 */
		links?: any
	}
	/**
	 * Block Lexer
	 */
	export declare interface Lexer {
		new (options?: MarkedOptions): Lexer
		tokens: token[]
		options: MarkedOptions
		rules: block
	}
	export class Lexer {
		constructor (options?: MarkedOptions) {
			this.tokens = [];
			(this.tokens as any).links = {};
			this.options = options || Marked.defaults;
			this.rules = block.normal;
			if (this.options.gfm) {
				if (this.options.tables) {
					this.rules = block.tables;
				} else {
					this.rules = block.gfm;
				}
			}
		}

		/**
		 * Expose Block Rules
		 */
		static rules = block;
		/**
		 * Static Lex Method
		 */
		static lex = (src:string, options:MarkedOptions) => {
			const lexer = new Lexer(options);
			return lexer.lex(src);
		};
		/**
		 * Preprocessing
		 */
		lex = (src: string) => {
			src = src
				.replace(/\r\n|\r/g, '\n')
				.replace(/\t/g, '    ')
				.replace(/\u00a0/g, ' ')
				.replace(/\u2424/g, '\n');
			return this.token(src, true);
		};
		/**
		 * Lexing
		 */
		token = (src:string, top:boolean, bq?:boolean) => {
			src = src.replace(/^ +$/gm, '')
			let next
				, loose
				, cap
				, bull
				, b
				, item
				, space
				, i: number
				, l: number;

			while (src) {
				// newline
				if (cap = this.rules.newline.exec(src)) {
					src = src.substring(cap[0].length);
					if (cap[0].length > 1) {
						this.tokens.push({
							type: 'space'
						});
					}
				}

				// code
				if (cap = this.rules.code.exec(src)) {
					src = src.substring(cap[0].length);
					cap = cap[0].replace(/^ {4}/gm, '');
					this.tokens.push({
						type: 'code',
						text: !this.options.pedantic
							? cap.replace(/\n+$/, '')
							: cap
					});
					continue;
				}

				// fences (gfm)
				if (cap = (this.rules.fences as RegExp).exec(src)) {
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
				if (top && (cap = (this.rules.nptable as RegExp).exec(src))) {
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
							item.align[i] = null;
						}
					}
					for (i = 0; i < item.cells.length; i++) {
						item.cells[i] = item.cells[i].split(/ *\| */);
					}
					this.tokens.push(item);
					continue;
				}

				// lheading
				if (cap = this.rules.lheading.exec(src)) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'heading',
						depth: cap[2] === '=' ? 1 : 2,
						text: cap[1]
					});
					continue;
				}

				// hr
				if (cap = this.rules.hr.exec(src)) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'hr'
					});
					continue;
				}

				// blockquote
				if (cap = this.rules.blockquote.exec(src)) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'blockquote_start'
					});
					cap = cap[0].replace(/^ *> ?/gm, '');
					// Pass `top` to keep the current
					// "toplevel" state. This is exactly
					// how markdown.pl works.
					this.token(cap, top, true);
					this.tokens.push({
						type: 'blockquote_end'
					});
					continue;
				}

				// list
				if (cap = this.rules.list.exec(src)) {
					src = src.substring(cap[0].length);
					bull = cap[2];
					this.tokens.push({
						type: 'list_start',
						ordered: bull.length > 1
					});
					// Get each top-level item.
					cap = cap[0].match(this.rules.item);
					next = false;
					l = cap.length;
					i = 0;
					for (; i < l; i++) {
						item = cap[i];
						// Remove the list item's bullet
						// so it is seen as the next token.
						space = item.length;
						item = item.replace(/^ *([*+-]|\d+\.) +/, '');
						// Outdent whatever the
						// list item contains. Hacky.
						if (~item.indexOf('\n ')) {
							space -= item.length;
							item = !this.options.pedantic
								? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
								: item.replace(/^ {1,4}/gm, '');
						}
						// Determine whether the next list item belongs here.
						// Backpedal if it does not belong in this list.
						if (this.options.smartLists && i !== l - 1) {
							b = block.bullet.exec(cap[i + 1])[0];
							if (bull !== b && !(bull.length > 1 && b.length > 1)) {
								src = cap.slice(i + 1).join('\n') + src;
								i = l - 1;
							}
						}
						// Determine whether item is loose or not.
						// Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
						// for discount behavior.
						loose = next || /\n\n(?!\s*$)/.test(item);
						if (i !== l - 1) {
							next = item.charAt(item.length - 1) === '\n';
							if (!loose) loose = next;
						}
						this.tokens.push({
							type: loose
								? 'loose_item_start'
								: 'list_item_start'
						});
						// Recurse.
						this.token(item, false, bq);
						this.tokens.push({
							type: 'list_item_end'
						});
					}
					this.tokens.push({
						type: 'list_end'
					});
					continue;
				}

				// html
				if (cap = this.rules.html.exec(src)) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: this.options.sanitize
							? 'paragraph'
							: 'html',
						pre: !this.options.sanitizer
							&& (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
						text: cap[0]
					});
					continue;
				}

				// def
				if ((!bq && top) && (cap = this.rules.def.exec(src))) {
					src = src.substring(cap[0].length);
					(this.tokens as any).links[cap[1].toLowerCase()] = {
						href: cap[2],
						title: cap[3]
					};
					continue;
				}

				// table (gfm)
				if (top && (cap = (this.rules.table as RegExp).exec(src))) {
					src = src.substring(cap[0].length);
					item = {
						type: 'table',
						header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
						align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
						cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
					};
					for (i = 0; i < item.align.length; i++) {
						if (/^ *-+: *$/.test(item.align[i])) {
							item.align[i] = 'right';
						} else if (/^ *:-+: *$/.test(item.align[i])) {
							item.align[i] = 'center';
						} else if (/^ *:-+ *$/.test(item.align[i])) {
							item.align[i] = 'left';
						} else {
							item.align[i] = null;
						}
					}
					for (i = 0; i < item.cells.length; i++) {
						item.cells[i] = item.cells[i]
							.replace(/^ *\| *| *\| *$/g, '')
							.split(/ *\| */);
					}
					this.tokens.push(item);
					continue;
				}

				// top-level paragraph
				if (top && (cap = this.rules.paragraph.exec(src))) {
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'paragraph',
						text: cap[1].charAt(cap[1].length - 1) === '\n'
							? cap[1].slice(0, -1)
							: cap[1]
					});
					continue;
				}

				// text
				if (cap = this.rules.text.exec(src)) {
					// Top-level should never reach here.
					src = src.substring(cap[0].length);
					this.tokens.push({
						type: 'text',
						text: cap[0]
					});
					continue;
				}

				if (src) {
					throw new
						Error('Infinite loop on byte: ' + src.charCodeAt(0));
				}
			}

			return this.tokens;
		};
	}





	export declare interface InlineLexer {
		options: MarkedOptions
		links
		inLink: boolean
		rules: inline
		renderer
	}
	/**
	 * Inline Lexer
	 */
	export class InlineLexer {
		constructor(links, options, renderer?) {
			this.options = options || Marked.defaults;
			this.links = links;
			this.rules = inline.normal;
			this.renderer = renderer || new Renderer;
			this.renderer.options = this.options;

			if (!this.links) {
				throw new
					Error('Tokens array requires a `links` property.');
			}

			if (this.options.gfm) {
				this.rules = this.options.breaks ? inline.breaks : inline.gfm
			} else if (this.options.pedantic) {
				this.rules = inline.pedantic;
			}
		}

		/**
		 * Expose Inline Rules
		 */
		static rules = inline

		/**
		 * Static Lexing/Compiling Method
		 */
		static output = function(src, links, options) {
			let inline = new InlineLexer(links, options);
			return inline.output(src);
		};

		/**
		 * Lexing/Compiling
		 */
		output = (src: string) => {
			let out = ''
				, link
				, text: string
				, href: string
				, cap: RegExpExecArray;

			while (src) {

				// escape
				if (cap = this.rules.escape.exec(src)) {
					src = src.substring(cap[0].length);
					out += cap[1];
					continue;
				}

				// autolink
				if (cap = this.rules.autolink.exec(src)) {
					src = src.substring(cap[0].length);
					if (cap[2] === '@') {
						text = cap[1].charAt(6) === ':'
							? this.mangle(cap[1].substring(7))
							: this.mangle(cap[1]);
						href = this.mangle('mailto:') + text;
					} else {
						text = Marked.escape(cap[1]);
						href = text;
					}
					out += this.renderer.link(href, null, text);
					continue;
				}

				// url (gfm)
				if (!this.inLink && (cap = (this.rules.url as RegExp).exec(src))) {
					src = src.substring(cap[0].length);
					text = Marked.escape(cap[1]);
					href = text;
					out += this.renderer.link(href, null, text);
					continue;
				}

				// tag
				if (cap = this.rules.tag.exec(src)) {
					if (!this.inLink && /^<a /i.test(cap[0])) {
						this.inLink = true;
					} else if (this.inLink && /^<\/a>/i.test(cap[0])) {
						this.inLink = false;
					}
					src = src.substring(cap[0].length);
					out += this.options.sanitize
						? this.options.sanitizer
							? this.options.sanitizer(cap[0])
							: Marked.escape(cap[0])
						: cap[0]
					continue;
				}

				// link
				if (cap = this.rules.link.exec(src)) {
					src = src.substring(cap[0].length);
					this.inLink = true;
					out += this.outputLink(cap, {
						href: cap[2],
						title: cap[3]
					});
					this.inLink = false;
					continue;
				}

				// reflink, nolink
				if ((cap = this.rules.reflink.exec(src))
						|| (cap = this.rules.nolink.exec(src))) {
					src = src.substring(cap[0].length);
					link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
					link = this.links[link.toLowerCase()];
					if (!link || !link.href) {
						out += cap[0].charAt(0);
						src = cap[0].substring(1) + src;
						continue;
					}
					this.inLink = true;
					out += this.outputLink(cap, link);
					this.inLink = false;
					continue;
				}

				// strong
				if (cap = this.rules.strong.exec(src)) {
					src = src.substring(cap[0].length);
					out += this.renderer.strong(this.output(cap[2] || cap[1]));
					continue;
				}

				// em
				if (cap = this.rules.em.exec(src)) {
					src = src.substring(cap[0].length);
					out += this.renderer.em(this.output(cap[2] || cap[1]));
					continue;
				}

				// code
				if (cap = this.rules.code.exec(src)) {
					src = src.substring(cap[0].length);
					out += this.renderer.codespan(Marked.escape(cap[2], true));
					continue;
				}

				// br
				if (cap = this.rules.br.exec(src)) {
					src = src.substring(cap[0].length);
					out += this.renderer.br();
					continue;
				}

				// del (gfm)
				if (cap = (this.rules.del as RegExp).exec(src)) {
					src = src.substring(cap[0].length);
					out += this.renderer.del(this.output(cap[1]));
					continue;
				}

				// text
				if (cap = this.rules.text.exec(src)) {
					src = src.substring(cap[0].length);
					out += this.renderer.text(Marked.escape(this.smartypants(cap[0])));
					continue;
				}

				if (src) {
					throw new
						Error('Infinite loop on byte: ' + src.charCodeAt(0));
				}
			}

			return out;
		}

		/**
		 * Compile Link
		 */
		outputLink = (cap, link) => {
			let href = Marked.escape(link.href)
				, title = link.title ? Marked.escape(link.title) : null;
			return cap[0].charAt(0) !== '!'
				? this.renderer.link(href, title, this.output(cap[1]))
				: this.renderer.image(href, title, Marked.escape(cap[1]));
		};

		/**
		 * Smartypants Transformations
		 */
		smartypants = (text:string) => {
			if (!this.options.smartypants) return text;
			return text
				// em-dashes: '—'
				.replace(/---/g, '\u2014')
				// en-dashes: '–'
				.replace(/--/g, '\u2013')
				// opening singles: '‘'
				.replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
				// closing singles & apostrophes: '’'
				.replace(/'/g, '\u2019')
				// opening doubles: '“'
				.replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
				// closing doubles: '”'
				.replace(/"/g, '\u201d')
				// ellipses: '…'
				.replace(/\.{3}/g, '\u2026');
		}

		/**
		 * Mangle Links
		 */
		mangle = (text:string) => {
			if (!this.options.mangle) return text;
			let out = ''
				, l = text.length
				, i = 0
				, ch;
			for (; i < l; i++) {
				ch = text.charCodeAt(i);
				if (Math.random() > 0.5) {
					ch = 'x' + ch.toString(16);
				}
				out += '&#' + ch + ';';
			}
			return out;
		}
	}




}













/**
 * Renderer
 */
class Renderer {
	options: MarkedOptions
	constructor(options?: MarkedOptions) {
		this.options = options || {};
	}

	code = (code:string, lang:string, escaped:boolean) => {
		if (this.options.highlight) {
			const out = this.options.highlight(code, lang);
			if (out != null && out !== code) {
				escaped = true;
				code = out;
			}
		}
		if (!lang) {
			return '<pre><code>'
				+ (escaped ? code : Marked.escape(code, true))
				+ '\n</code></pre>';
		}
		return '<pre><code class="'
			+ this.options.langPrefix
			+ Marked.escape(lang, true)
			+ '">'
			+ (escaped ? code : Marked.escape(code, true))
			+ '\n</code></pre>\n';
	}

	blockquote = (quote:string):string => `<blockquote>\n${quote}</blockquote>\n`;

	html = (html:string):string => html;

	heading = (text:string, level:number, raw:string):string => {
		return '<h'
			+ level
			+ ' id="'
			+ this.options.headerPrefix
			+ raw.toLowerCase().replace(/[^\w]+/g, '-')
			+ '">'
			+ text
			+ '</h'
			+ level
			+ '>\n';
	};

	hr = ():string => this.options.xhtml ? '<hr/>\n' : '<hr>\n';

	list = (body:string, ordered:boolean):string => {
		let type = ordered ? 'ol' : 'ul';
		return '<' + type + '>\n' + body + '</' + type + '>\n';
	};

	listitem = (text:string):string => `<li>${text}</li>\n`;

	paragraph = (text:string):string => `<p>${text}</p>\n`;

	table = (header:string, body:string):string => {
		return '<table>\n'
			+ '<thead>\n'
			+ header
			+ '</thead>\n'
			+ '<tbody>\n'
			+ body
			+ '</tbody>\n'
			+ '</table>\n';
	};

	tablerow = (content:string):string => `<tr>\n${content}</tr>\n`;

	tablecell = (content:string, flags:{header:boolean,align:string}):string => {
		let type = flags.header ? 'th' : 'td';
		let tag = flags.align
			? `<${type} style="text-align:${flags.align}">`
			: `<${type}>`;
		return tag + content + `</${type}>\n`;
	};

	// span level renderer
	strong = (text:string):string => `<strong>${text}</strong>`;

	em = (text:string):string => `<em>${text}</em>`;

	codespan = (text:string):string => `<code>${text}</code>`;

	br = ():string => this.options.xhtml ? '<br/>' : '<br>';

	del = (text:string):string => `<del>${text}</del>`;

	link = (href:string, title:string, text:string):string => {
		let prot:string;
		if (this.options.sanitize) {
			try {
				prot = decodeURIComponent(Marked.unescape(href))
					.replace(/[^\w:]/g, '')
					.toLowerCase();
			} catch (e) {
				return '';
			}
			if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
				return '';
			}
		}
		let out = `<a href="${href}"`;
		if (title) {
			out += ` title="${title}"`;
		}
		out += `>${text}</a>`;
		return out;
	};

	image = (href:string, title?:string, text?:string):string => {
		let out = `<img src="${href}" alt="${text||''}"`;
		if (title) {
			out += ` title="${title}"`;
		}
		out += this.options.xhtml ? '/>' : '>';
		return out;
	};

	text = (text:string):string => text;
}






declare interface Parser {
	tokens: any[]
	token: any
	options: MarkedOptions
	renderer: Renderer
	inline: Marked.InlineLexer
}
/**
 * Parsing & Compiling
 */
class Parser {
	constructor(options, renderer?) {
		this.tokens = [];
		this.token = null;
		this.options = options || Marked.defaults;
		this.options.renderer = this.options.renderer || new Renderer;
		this.renderer = this.options.renderer;
		this.renderer.options = this.options;
	}

	/**
	 * Static Parse Method
	 */
	static parse = (src, options, renderer?) => {
		const parser = new Parser(options, renderer);
		return parser.parse(src);
	}

	/**
	 * Parse Loop
	 */
	parse = (src) => {
		this.inline = new Marked.InlineLexer(src.links, this.options, this.renderer);
		this.tokens = src.reverse();
		let out = '';
		while (this.next()) {
			out += this.tok();
		}
		return out;
	}

	/**
	 * Next Token
	 */
	next = () => this.token = this.tokens.pop();

	/**
	 * Preview Next Token
	 */
	peek = () => this.tokens[this.tokens.length - 1] || 0;

	/**
	 * Parse Text Tokens
	 */
	parseText = () => {
		let body = this.token.text;
		while (this.peek().type === 'text') {
			body += '\n' + this.next().text;
		}
		return this.inline.output(body);
	}

	/**
	 * Parse Current Token
	 */
	tok = () => {
		switch (this.token.type) {
			case 'space': {
				return '';
			}
			case 'hr': {
				return this.renderer.hr();
			}
			case 'heading': {
				return this.renderer.heading(
					this.inline.output(this.token.text),
					this.token.depth,
					this.token.text);
			}
			case 'code': {
				return this.renderer.code(this.token.text,
					this.token.lang,
					this.token.escaped);
			}
			case 'table': {
				let header = ''
					, body = ''
					, i
					, row
					, cell
					, flags
					, j;

				// header
				cell = '';
				for (i = 0; i < this.token.header.length; i++) {
					flags = { header: true, align: this.token.align[i] };
					cell += this.renderer.tablecell(
						this.inline.output(this.token.header[i]),
						{ header: true, align: this.token.align[i] }
					);
				}
				header += this.renderer.tablerow(cell);

				for (i = 0; i < this.token.cells.length; i++) {
					row = this.token.cells[i];
					cell = '';
					for (j = 0; j < row.length; j++) {
						cell += this.renderer.tablecell(
							this.inline.output(row[j]),
							{ header: false, align: this.token.align[j] }
						);
					}
					body += this.renderer.tablerow(cell);
				}
				return this.renderer.table(header, body);
			}
			case 'blockquote_start': {
				let body = '';
				while (this.next().type !== 'blockquote_end') {
					body += this.tok();
				}
				return this.renderer.blockquote(body);
			}
			case 'list_start': {
				let body = ''
					, ordered = this.token.ordered;
				while (this.next().type !== 'list_end') {
					body += this.tok();
				}
				return this.renderer.list(body, ordered);
			}
			case 'list_item_start': {
				let body = '';
				while (this.next().type !== 'list_item_end') {
					body += this.token.type === 'text'
						? this.parseText()
						: this.tok();
				}
				return this.renderer.listitem(body);
			}
			case 'loose_item_start': {
				let body = '';
				while (this.next().type !== 'list_item_end') {
					body += this.tok();
				}
				return this.renderer.listitem(body);
			}
			case 'html': {
				let html = !this.token.pre && !this.options.pedantic
					? this.inline.output(this.token.text)
					: this.token.text;
				return this.renderer.html(html);
			}
			case 'paragraph': {
				return this.renderer.paragraph(this.inline.output(this.token.text));
			}
			case 'text': {
				return this.renderer.paragraph(this.parseText());
			}
		}
	}
}
