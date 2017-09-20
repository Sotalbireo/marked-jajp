import Util from "./Util"
import * as $ from "./lib"

/**
 * Renderer
 */
class Renderer {
	private opts:$.MKopts

	// <code /> in <pre />
	code = (code:string, lang:string, escaped:boolean) => {
		if(this.opts.highlight) {
			const out = this.opts.highlight(code, lang)
			if(out !== null && out !== code) {
				escaped = true
				code = out
			}
		}
		code = escaped? code.trim(): Util.escape(code, true).trim()
		if(!lang) {
			return `<pre><code>${code}</code></pre>\n`
		}
		return `<pre><code class="${this.opts.langPrefix}${Util.escape(lang,true)}">${code}\n</code></pre>\n`
	}

	// <blockquote />
	blockquote = (quote:string)=> `<blockquote>\n${quote}\n</blockquote>\n`

	// html tags
	html = (html:string) => html

	// <h1 /> .. <h6 />
	heading = (text:string, level:number, raw:string) => `<h${level} id="${this.opts.headerPrefix}${raw.toLowerCase().replace(/[^\w]+/g, '-')}">${text}</h${level}>\n`

	// <hr>
	hr = () => '<hr>\n'

	// <ul /> or <ol />
	list = (body:any, ordered:boolean) => {
		const type = ordered? 'ol': 'ul'
		return `<${type}>\n${body}</${type}>\n`
	}

	// <li />
	listitem = (text:string) => `<li>${text}</li>\n`

	// <p />
	paragraph = (text:string) => `<p>${text}</p>\n`


	table = () => {}
	tablerow = () => {}
	tablecell = () => {}

	// <strong />
	_strong = (text:string) => `<string>${text}</string>`

	// <em />
	_em = (text:string) => `<em>${text}</em>`

	// <code />
	_code = (text:string) => `<code>${text}</code>`

	// <br>
	_br = () => `<br>`

	// <del />
	_del = (text:string) => `<del>${text}</del>`

	// <a />
	_link = (href:string, title='', text='') => {
		let prot = ''
		if(this.opts.sanitise) {
			try {
				prot = decodeURIComponent(Util.unescape(href)).replace(/[^/w]/g,'').toLowerCase()
			} catch {
				return ''
			}
		}
		if(prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
			return ''
		}
		title = title=='' ?'': `title="${title}"`
		text = text!='' ? text: Util.escape(decodeURIComponent(Util.unescape(href)))
		return `<a href="${href}"${title}>${text}</a>`
	}

	// <img>
	_image = (href:string, text='', title='') => {
		title = title==''?'': `title="${title}"`
		return `<img src="${href}" alt="${text}"${title}>`
	}

	// plain text
	_text = (text:string) => text

	// <ruby />
	_ruby = (text:string, ruby:string, rp=['（','）']) => `<ruby>${text}<rp>${rp[0]}</rp><rt>${ruby}</rt><rp>${rp[1]}</rp><ruby>`

	constructor(opts:$.MKopts) {
		this.opts = opts
	}
}

export default Renderer
