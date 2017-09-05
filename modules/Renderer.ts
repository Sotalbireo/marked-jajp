import Util from "./Util"
/**
 * Renderer
 */
class Renderer {
	private opts

	/**
	 * Render <pre />
	 * @type {[type]}
	 */
	code = (code, lang, escaped) => {
		if(this.opts.highlight) {
			const out = this.opts.highlight(code, lang)
			if(out !== null && out !== code) {
				escaped = true
				code = out
			}
		}
		code = escaped? code: Util.escape(code,true)
		if(!lang) {
			return `<pre><code>${code}\n</code></pre>\n`
		}
		return `<pre><code class="${this.opts.langPrefix}${Util.escape(lang,true)}">${code}\n</code></pre>\n`
	}

	/**
	 * <blockquote />
	 * @param {string} quote
	 * @return {string}
	 */
	blockquote = (quote) => `<blockquote>\n${quote}\n</blockquote>\n`

	html = () => {}
	heading = () => {}
	hr = () => {}
	list = () => {}
	listitem = () => {}
	paragraph = () => {}
	table = () => {}
	tablerow = () => {}
	tablecell = () => {}

	_strong = () => {}
	_em = () => {}
	_code = () => {}
	_br = () => {}
	_del = () => {}
	_link = () => {}
	_image = () => {}
	_text = () => {}
	_ruby = () => {}
	constructor(opts) {
		this.opts = opts
	}
}

export default Renderer
