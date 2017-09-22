/**
 * Utilities
 */
class Util {

	/**
	 * Escapes what <, >, ' and ".
	 * @param {string} html - Raw string.
	 * @param {boolean} encode - Either or not encode "Character reference".
	 * @return {string} Escaped string.
	 */
	static escape = (html:string, encode=false, map={'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}):string => html.replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;').replace(/[<>"']/g, (m:'<'|'>'|'"'|"'")=>map[m])

	/**
	 * unescape strings
	 * @param {string} html
	 * @return {string} unescaped string.
	 * explicitly match decimal, hex, and named HTML entities
	 */
	static unescape = (html:string):string => {
		return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, (_, n) => {
			n = n.toLowerCase()
			if (n == 'colon') return ':'
			if (n.charAt(0) == '#') {
				return n.charAt(1) == 'x'
					? String.fromCharCode(parseInt(n.substring(2), 16))
					: String.fromCharCode(+n.substring(1))
				}
			return ''
		})
	}

	static replace = (regex:any, opt='') => {
		let src = regex.source
		return function self(name:any, val:any) {
			if(!name) return new RegExp(src, opt)
			let lVal = val.source || val
			lVal = lVal.replace(/(^|[^\[])\^/g, '$1')
			src = src.replace(name, lVal)
			return self
		}
	}

	static merge = (...obj:any[]):object => {
		for(let i = 1; i < obj.length; ++i) {
			let targ = obj[i]
			for(let k in targ) {
				if(targ.hasOwnProperty(k))
					obj[0][k] = targ[k]
			}
		}
		return obj[0] as object
	}

}

export default Util
