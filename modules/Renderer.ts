/**
 * Renderer
 */
class Renderer {
	private options
	private code = () => {}
	private blockquote = () => {}
	private html = () => {}
	private heading = () => {}
	private hr = () => {}
	private list = () => {}
	private listitem = () => {}
	private paragraph = () => {}
	private table = () => {}
	private tablerow = () => {}
	private tablecell = () => {}

	private _strong = () => {}
	private _em = () => {}
	private _code = () => {}
	private _br = () => {}
	private _del = () => {}
	private _link = () => {}
	private _image = () => {}
	private _text = () => {}
	private _ruby = () => {}
	constructor(opts) {
		this.options = opts
	}
}

export default Renderer
