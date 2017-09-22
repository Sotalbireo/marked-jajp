export declare interface MKopts {
	gfm?:boolean,
	tables?:boolean,
	breaks?:boolean,
	pedantic?:boolean,
	sanitise?:boolean,
	sanitiser?(html:string):string,
	mangle?:boolean,
	smartLists?:boolean,
	silent?:boolean,
	highlight? (code:string,lang:string,callback?:Function):string,
	langPrefix:string,
	smartypants?:boolean,
	headerPrefix:string,
	renderer?:Renderer
}
export declare interface Renderer {

}
