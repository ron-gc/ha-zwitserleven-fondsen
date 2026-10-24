//#region node_modules/@lit/reactive-element/css-tag.js
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$2 = globalThis;
var e$4 = t$2.ShadowRoot && (void 0 === t$2.ShadyCSS || t$2.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s$2 = Symbol();
var o$4 = /* @__PURE__ */ new WeakMap();
var n$3 = class {
	constructor(t, e, o) {
		if (this._$cssResult$ = !0, o !== s$2) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = t, this.t = e;
	}
	get styleSheet() {
		let t = this.o;
		const s = this.t;
		if (e$4 && void 0 === t) {
			const e = void 0 !== s && 1 === s.length;
			e && (t = o$4.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$4.set(s, t));
		}
		return t;
	}
	toString() {
		return this.cssText;
	}
};
var r$4 = (t) => new n$3("string" == typeof t ? t : t + "", void 0, s$2);
var i$3 = (t, ...e) => {
	return new n$3(1 === t.length ? t[0] : e.reduce((e, s, o) => e + ((t) => {
		if (!0 === t._$cssResult$) return t.cssText;
		if ("number" == typeof t) return t;
		throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
	})(s) + t[o + 1], t[0]), t, s$2);
};
var S$1 = (s, o) => {
	if (e$4) s.adoptedStyleSheets = o.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
	else for (const e of o) {
		const o = document.createElement("style"), n = t$2.litNonce;
		void 0 !== n && o.setAttribute("nonce", n), o.textContent = e.cssText, s.appendChild(o);
	}
};
var c$2 = e$4 ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
	let e = "";
	for (const s of t.cssRules) e += s.cssText;
	return r$4(e);
})(t) : t;
//#endregion
//#region node_modules/@lit/reactive-element/reactive-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var { is: i$2, defineProperty: e$3, getOwnPropertyDescriptor: h$1, getOwnPropertyNames: r$3, getOwnPropertySymbols: o$3, getPrototypeOf: n$2 } = Object, a$1 = globalThis, c$1 = a$1.trustedTypes, l$1 = c$1 ? c$1.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t, s) => t, u$1 = {
	toAttribute(t, s) {
		switch (s) {
			case Boolean:
				t = t ? l$1 : null;
				break;
			case Object:
			case Array: t = null == t ? t : JSON.stringify(t);
		}
		return t;
	},
	fromAttribute(t, s) {
		let i = t;
		switch (s) {
			case Boolean:
				i = null !== t;
				break;
			case Number:
				i = null === t ? null : Number(t);
				break;
			case Object:
			case Array: try {
				i = JSON.parse(t);
			} catch (t) {
				i = null;
			}
		}
		return i;
	}
}, f$1 = (t, s) => !i$2(t, s), b$1 = {
	attribute: !0,
	type: String,
	converter: u$1,
	reflect: !1,
	useDefault: !1,
	hasChanged: f$1
};
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y$1 = class extends HTMLElement {
	static addInitializer(t) {
		this._$Ei(), (this.l ??= []).push(t);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(t, s = b$1) {
		if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
			const i = Symbol(), h = this.getPropertyDescriptor(t, i, s);
			void 0 !== h && e$3(this.prototype, t, h);
		}
	}
	static getPropertyDescriptor(t, s, i) {
		const { get: e, set: r } = h$1(this.prototype, t) ?? {
			get() {
				return this[s];
			},
			set(t) {
				this[s] = t;
			}
		};
		return {
			get: e,
			set(s) {
				const h = e?.call(this);
				r?.call(this, s), this.requestUpdate(t, h, i);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(t) {
		return this.elementProperties.get(t) ?? b$1;
	}
	static _$Ei() {
		if (this.hasOwnProperty(d$1("elementProperties"))) return;
		const t = n$2(this);
		t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(d$1("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
			const t = this.properties, s = [...r$3(t), ...o$3(t)];
			for (const i of s) this.createProperty(i, t[i]);
		}
		const t = this[Symbol.metadata];
		if (null !== t) {
			const s = litPropertyMetadata.get(t);
			if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (const [t, s] of this.elementProperties) {
			const i = this._$Eu(t, s);
			void 0 !== i && this._$Eh.set(i, t);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(s) {
		const i = [];
		if (Array.isArray(s)) {
			const e = new Set(s.flat(1 / 0).reverse());
			for (const s of e) i.unshift(c$2(s));
		} else void 0 !== s && i.push(c$2(s));
		return i;
	}
	static _$Eu(t, s) {
		const i = s.attribute;
		return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
	}
	addController(t) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
	}
	removeController(t) {
		this._$EO?.delete(t);
	}
	_$E_() {
		const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
		for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
		t.size > 0 && (this._$Ep = t);
	}
	createRenderRoot() {
		const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return S$1(t, this.constructor.elementStyles), t;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
	}
	enableUpdating(t) {}
	disconnectedCallback() {
		this._$EO?.forEach((t) => t.hostDisconnected?.());
	}
	attributeChangedCallback(t, s, i) {
		this._$AK(t, i);
	}
	_$ET(t, s) {
		const i = this.constructor.elementProperties.get(t), e = this.constructor._$Eu(t, i);
		if (void 0 !== e && !0 === i.reflect) {
			const h = (void 0 !== i.converter?.toAttribute ? i.converter : u$1).toAttribute(s, i.type);
			this._$Em = t, null == h ? this.removeAttribute(e) : this.setAttribute(e, h), this._$Em = null;
		}
	}
	_$AK(t, s) {
		const i = this.constructor, e = i._$Eh.get(t);
		if (void 0 !== e && this._$Em !== e) {
			const t = i.getPropertyOptions(e), h = "function" == typeof t.converter ? { fromAttribute: t.converter } : void 0 !== t.converter?.fromAttribute ? t.converter : u$1;
			this._$Em = e;
			const r = h.fromAttribute(s, t.type);
			this[e] = r ?? this._$Ej?.get(e) ?? r, this._$Em = null;
		}
	}
	requestUpdate(t, s, i, e = !1, h) {
		if (void 0 !== t) {
			const r = this.constructor;
			if (!1 === e && (h = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? f$1)(h, s) || i.useDefault && i.reflect && h === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
			this.C(t, s, i);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(t, s, { useDefault: i, reflect: e, wrapped: h }, r) {
		i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), !0 !== h || void 0 !== r) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), !0 === e && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (t) {
			Promise.reject(t);
		}
		const t = this.scheduleUpdate();
		return null != t && await t, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (const [t, s] of this._$Ep) this[t] = s;
				this._$Ep = void 0;
			}
			const t = this.constructor.elementProperties;
			if (t.size > 0) for (const [s, i] of t) {
				const { wrapped: t } = i, e = this[s];
				!0 !== t || this._$AL.has(s) || void 0 === e || this.C(s, void 0, i, e);
			}
		}
		let t = !1;
		const s = this._$AL;
		try {
			t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s)) : this._$EM();
		} catch (s) {
			throw t = !1, this._$EM(), s;
		}
		t && this._$AE(s);
	}
	willUpdate(t) {}
	_$AE(t) {
		this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(t) {
		return !0;
	}
	update(t) {
		this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
	}
	updated(t) {}
	firstUpdated(t) {}
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$1 = globalThis;
var i$1 = (t) => t;
var s$1 = t$1.trustedTypes;
var e$2 = s$1 ? s$1.createPolicy("lit-html", { createHTML: (t) => t }) : void 0;
var h = "$lit$";
var o$2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n$1 = "?" + o$2;
var r$2 = `<${n$1}>`;
var l = document;
var c = () => l.createComment("");
var a = (t) => null === t || "object" != typeof t && "function" != typeof t;
var u = Array.isArray;
var d = (t) => u(t) || "function" == typeof t?.[Symbol.iterator];
var f = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y = /^(?:script|style|textarea|title)$/i;
var x = (t) => (i, ...s) => ({
	_$litType$: t,
	strings: i,
	values: s
});
var b = x(1);
var w = x(2);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l.createTreeWalker(l, 129);
function V(t, i) {
	if (!u(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return void 0 !== e$2 ? e$2.createHTML(i) : i;
}
var N = (t, i) => {
	const s = t.length - 1, e = [];
	let n, l = 2 === i ? "<svg>" : 3 === i ? "<math>" : "", c = v;
	for (let i = 0; i < s; i++) {
		const s = t[i];
		let a, u, d = -1, f = 0;
		for (; f < s.length && (c.lastIndex = f, u = c.exec(s), null !== u);) f = c.lastIndex, c === v ? "!--" === u[1] ? c = _ : void 0 !== u[1] ? c = m : void 0 !== u[2] ? (y.test(u[2]) && (n = RegExp("</" + u[2], "g")), c = p) : void 0 !== u[3] && (c = p) : c === p ? ">" === u[0] ? (c = n ?? v, d = -1) : void 0 === u[1] ? d = -2 : (d = c.lastIndex - u[2].length, a = u[1], c = void 0 === u[3] ? p : "\"" === u[3] ? $ : g) : c === $ || c === g ? c = p : c === _ || c === m ? c = v : (c = p, n = void 0);
		const x = c === p && t[i + 1].startsWith("/>") ? " " : "";
		l += c === v ? s + r$2 : d >= 0 ? (e.push(a), s.slice(0, d) + h + s.slice(d) + o$2 + x) : s + o$2 + (-2 === d ? i : x);
	}
	return [V(t, l + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e];
};
var S = class S {
	constructor({ strings: t, _$litType$: i }, e) {
		let r;
		this.parts = [];
		let l = 0, a = 0;
		const u = t.length - 1, d = this.parts, [f, v] = N(t, i);
		if (this.el = S.createElement(f, e), P.currentNode = this.el.content, 2 === i || 3 === i) {
			const t = this.el.content.firstChild;
			t.replaceWith(...t.childNodes);
		}
		for (; null !== (r = P.nextNode()) && d.length < u;) {
			if (1 === r.nodeType) {
				if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(h)) {
					const i = v[a++], s = r.getAttribute(t).split(o$2), e = /([.?@])?(.*)/.exec(i);
					d.push({
						type: 1,
						index: l,
						name: e[2],
						strings: s,
						ctor: "." === e[1] ? I : "?" === e[1] ? L : "@" === e[1] ? z : H
					}), r.removeAttribute(t);
				} else t.startsWith(o$2) && (d.push({
					type: 6,
					index: l
				}), r.removeAttribute(t));
				if (y.test(r.tagName)) {
					const t = r.textContent.split(o$2), i = t.length - 1;
					if (i > 0) {
						r.textContent = s$1 ? s$1.emptyScript : "";
						for (let s = 0; s < i; s++) r.append(t[s], c()), P.nextNode(), d.push({
							type: 2,
							index: ++l
						});
						r.append(t[i], c());
					}
				}
			} else if (8 === r.nodeType) if (r.data === n$1) d.push({
				type: 2,
				index: l
			});
			else {
				let t = -1;
				for (; -1 !== (t = r.data.indexOf(o$2, t + 1));) d.push({
					type: 7,
					index: l
				}), t += o$2.length - 1;
			}
			l++;
		}
	}
	static createElement(t, i) {
		const s = l.createElement("template");
		return s.innerHTML = t, s;
	}
};
function M(t, i, s = t, e) {
	if (i === E) return i;
	let h = void 0 !== e ? s._$Co?.[e] : s._$Cl;
	const o = a(i) ? void 0 : i._$litDirective$;
	return h?.constructor !== o && (h?._$AO?.(!1), void 0 === o ? h = void 0 : (h = new o(t), h._$AT(t, s, e)), void 0 !== e ? (s._$Co ??= [])[e] = h : s._$Cl = h), void 0 !== h && (i = M(t, h._$AS(t, i.values), h, e)), i;
}
var R = class {
	constructor(t, i) {
		this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(t) {
		const { el: { content: i }, parts: s } = this._$AD, e = (t?.creationScope ?? l).importNode(i, !0);
		P.currentNode = e;
		let h = P.nextNode(), o = 0, n = 0, r = s[0];
		for (; void 0 !== r;) {
			if (o === r.index) {
				let i;
				2 === r.type ? i = new k(h, h.nextSibling, this, t) : 1 === r.type ? i = new r.ctor(h, r.name, r.strings, this, t) : 6 === r.type && (i = new Z(h, this, t)), this._$AV.push(i), r = s[++n];
			}
			o !== r?.index && (h = P.nextNode(), o++);
		}
		return P.currentNode = l, e;
	}
	p(t) {
		let i = 0;
		for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
	}
};
var k = class k {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(t, i, s, e) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cv = e?.isConnected ?? !0;
	}
	get parentNode() {
		let t = this._$AA.parentNode;
		const i = this._$AM;
		return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(t, i = this) {
		t = M(this, t, i), a(t) ? t === A || null == t || "" === t ? (this._$AH !== A && this._$AR(), this._$AH = A) : t !== this._$AH && t !== E && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : d(t) ? this.k(t) : this._(t);
	}
	O(t) {
		return this._$AA.parentNode.insertBefore(t, this._$AB);
	}
	T(t) {
		this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
	}
	_(t) {
		this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t : this.T(l.createTextNode(t)), this._$AH = t;
	}
	$(t) {
		const { values: i, _$litType$: s } = t, e = "number" == typeof s ? this._$AC(t) : (void 0 === s.el && (s.el = S.createElement(V(s.h, s.h[0]), this.options)), s);
		if (this._$AH?._$AD === e) this._$AH.p(i);
		else {
			const t = new R(e, this), s = t.u(this.options);
			t.p(i), this.T(s), this._$AH = t;
		}
	}
	_$AC(t) {
		let i = C.get(t.strings);
		return void 0 === i && C.set(t.strings, i = new S(t)), i;
	}
	k(t) {
		u(this._$AH) || (this._$AH = [], this._$AR());
		const i = this._$AH;
		let s, e = 0;
		for (const h of t) e === i.length ? i.push(s = new k(this.O(c()), this.O(c()), this, this.options)) : s = i[e], s._$AI(h), e++;
		e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
	}
	_$AR(t = this._$AA.nextSibling, s) {
		for (this._$AP?.(!1, !0, s); t !== this._$AB;) {
			const s = i$1(t).nextSibling;
			i$1(t).remove(), t = s;
		}
	}
	setConnected(t) {
		void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
	}
};
var H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(t, i, s, e, h) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = h, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(/* @__PURE__ */ new String()), this.strings = s) : this._$AH = A;
	}
	_$AI(t, i = this, s, e) {
		const h = this.strings;
		let o = !1;
		if (void 0 === h) t = M(this, t, i, 0), o = !a(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
		else {
			const e = t;
			let n, r;
			for (t = h[0], n = 0; n < h.length - 1; n++) r = M(this, e[s + n], i, n), r === E && (r = this._$AH[n]), o ||= !a(r) || r !== this._$AH[n], r === A ? t = A : t !== A && (t += (r ?? "") + h[n + 1]), this._$AH[n] = r;
		}
		o && !e && this.j(t);
	}
	j(t) {
		t === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
	}
};
var I = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(t) {
		this.element[this.name] = t === A ? void 0 : t;
	}
};
var L = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(t) {
		this.element.toggleAttribute(this.name, !!t && t !== A);
	}
};
var z = class extends H {
	constructor(t, i, s, e, h) {
		super(t, i, s, e, h), this.type = 5;
	}
	_$AI(t, i = this) {
		if ((t = M(this, t, i, 0) ?? A) === E) return;
		const s = this._$AH, e = t === A && s !== A || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, h = t !== A && (s === A || e);
		e && this.element.removeEventListener(this.name, this, s), h && this.element.addEventListener(this.name, this, t), this._$AH = t;
	}
	handleEvent(t) {
		"function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
	}
};
var Z = class {
	constructor(t, i, s) {
		this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(t) {
		M(this, t);
	}
};
var B = t$1.litHtmlPolyfillSupport;
B?.(S, k), (t$1.litHtmlVersions ??= []).push("3.3.3");
var D = (t, i, s) => {
	const e = s?.renderBefore ?? i;
	let h = e._$litPart$;
	if (void 0 === h) {
		const t = s?.renderBefore ?? null;
		e._$litPart$ = h = new k(i.insertBefore(c(), t), t, void 0, s ?? {});
	}
	return h._$AI(t), h;
};
//#endregion
//#region node_modules/lit-element/lit-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var s = globalThis;
var i = class extends y$1 {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		const t = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= t.firstChild, t;
	}
	update(t) {
		const r = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D(r, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return E;
	}
};
i._$litElement$ = !0, i["finalized"] = !0, s.litElementHydrateSupport?.({ LitElement: i });
var o$1 = s.litElementPolyfillSupport;
o$1?.({ LitElement: i });
(s.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/@lit/reactive-element/decorators/property.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var o = {
	attribute: !0,
	type: String,
	converter: u$1,
	reflect: !1,
	hasChanged: f$1
};
var r$1 = (t = o, e, r) => {
	const { kind: n, metadata: i } = r;
	let s = globalThis.litPropertyMetadata.get(i);
	if (void 0 === s && globalThis.litPropertyMetadata.set(i, s = /* @__PURE__ */ new Map()), "setter" === n && ((t = Object.create(t)).wrapped = !0), s.set(r.name, t), "accessor" === n) {
		const { name: o } = r;
		return {
			set(r) {
				const n = e.get.call(this);
				e.set.call(this, r), this.requestUpdate(o, n, t, !0, r);
			},
			init(e) {
				return void 0 !== e && this.C(o, void 0, t, e), e;
			}
		};
	}
	if ("setter" === n) {
		const { name: o } = r;
		return function(r) {
			const n = this[o];
			e.call(this, r), this.requestUpdate(o, n, t, !0, r);
		};
	}
	throw Error("Unsupported decorator location: " + n);
};
function n(t) {
	return (e, o) => "object" == typeof o ? r$1(t, e, o) : ((t, e, o) => {
		const r = e.hasOwnProperty(o);
		return e.constructor.createProperty(o, t), r ? Object.getOwnPropertyDescriptor(e, o) : void 0;
	})(t, e, o);
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/state.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ function r(r) {
	return n({
		...r,
		state: !0,
		attribute: !1
	});
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/base.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var e$1 = (e, t, c) => (c.configurable = !0, c.enumerable = !0, Reflect.decorate && "object" != typeof t && Object.defineProperty(e, t, c), c);
//#endregion
//#region node_modules/@lit/reactive-element/decorators/query.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ function e(e, r) {
	return (n, s, i) => {
		const o = (t) => t.renderRoot?.querySelector(e) ?? null;
		if (r) {
			const { get: e, set: r } = "object" == typeof s ? n : i ?? (() => {
				const t = Symbol();
				return {
					get() {
						return this[t];
					},
					set(e) {
						this[t] = e;
					}
				};
			})();
			return e$1(n, s, { get() {
				let t = e.call(this);
				return void 0 === t && (t = o(this), (null !== t || this.hasUpdated) && r.call(this, t)), t;
			} });
		}
		return e$1(n, s, { get() {
			return o(this);
		} });
	};
}
//#endregion
//#region src/translations.ts
var translations = {
	en: {
		editor: {
			title_label: "Title (optional)",
			default_range: "Default time range",
			tile_size: "Tile size",
			selected: "Selected",
			drag_hint: "drag to reorder",
			add: "Add",
			no_sensors: "No Zwitserleven Fondsen sensors found.",
			setup_hint: "Set up under Settings → Integrations → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Not found",
			unavailable: "Unavailable",
			price_history: "Price history",
			date: "Date",
			price: "Price",
			change: "Change",
			loading: "Loading…",
			no_history: "No prices stored yet.",
			no_funds: "No funds selected. Edit the card to choose them.",
			close: "Close"
		}
	},
	de: {
		editor: {
			title_label: "Titel (optional)",
			default_range: "Standard Zeitraum",
			tile_size: "Kachelgröße",
			selected: "Ausgewählt",
			drag_hint: "ziehen zum Sortieren",
			add: "Hinzufügen",
			no_sensors: "Keine Zwitserleven Fondsen Sensoren gefunden.",
			setup_hint: "Integration einrichten unter Einstellungen → Integrationen → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Nicht gefunden",
			unavailable: "Nicht verfügbar",
			price_history: "Kursverlauf",
			date: "Datum",
			price: "Kurs",
			change: "Änderung",
			loading: "Wird geladen…",
			no_history: "Noch keine Kurse gespeichert.",
			no_funds: "Keine Fonds ausgewählt. Bearbeite die Karte, um sie auszuwählen.",
			close: "Schließen"
		}
	},
	fr: {
		editor: {
			title_label: "Titre (optionnel)",
			default_range: "Période par défaut",
			tile_size: "Taille des tuiles",
			selected: "Sélectionnés",
			drag_hint: "glisser pour réorganiser",
			add: "Ajouter",
			no_sensors: "Aucun capteur Zwitserleven Fondsen trouvé.",
			setup_hint: "Configurer sous Paramètres → Intégrations → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Introuvable",
			unavailable: "Indisponible",
			price_history: "Historique des cours",
			date: "Date",
			price: "Cours",
			change: "Variation",
			loading: "Chargement…",
			no_history: "Aucun cours enregistré pour l'instant.",
			no_funds: "Aucun fonds sélectionné. Modifiez la carte pour les choisir.",
			close: "Fermer"
		}
	},
	nl: {
		editor: {
			title_label: "Titel (optioneel)",
			default_range: "Standaard tijdsbereik",
			tile_size: "Tegelgrootte",
			selected: "Geselecteerd",
			drag_hint: "slepen om te sorteren",
			add: "Toevoegen",
			no_sensors: "Geen Zwitserleven Fondsen-sensoren gevonden.",
			setup_hint: "Instellen via Instellingen → Integraties → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Niet gevonden",
			unavailable: "Niet beschikbaar",
			price_history: "Koershistorie",
			date: "Datum",
			price: "Koers",
			change: "Verandering",
			loading: "Laden…",
			no_history: "Nog geen koersen opgeslagen.",
			no_funds: "Geen fondsen gekozen. Bewerk de kaart om ze te kiezen.",
			close: "Sluiten"
		}
	},
	es: {
		editor: {
			title_label: "Título (opcional)",
			default_range: "Rango de tiempo predeterminado",
			tile_size: "Tamaño de ficha",
			selected: "Seleccionados",
			drag_hint: "arrastrar para ordenar",
			add: "Añadir",
			no_sensors: "No se encontraron sensores Zwitserleven Fondsen.",
			setup_hint: "Configurar en Ajustes → Integraciones → Zwitserleven Fondsen."
		},
		card: {
			not_found: "No encontrado",
			unavailable: "No disponible",
			price_history: "Historial de precios",
			date: "Fecha",
			price: "Precio",
			change: "Variación",
			loading: "Cargando…",
			no_history: "Aún no hay precios guardados.",
			no_funds: "No hay fondos seleccionados. Edita la tarjeta para elegirlos.",
			close: "Cerrar"
		}
	},
	it: {
		editor: {
			title_label: "Titolo (opzionale)",
			default_range: "Intervallo predefinito",
			tile_size: "Dimensione tessera",
			selected: "Selezionati",
			drag_hint: "trascina per riordinare",
			add: "Aggiungi",
			no_sensors: "Nessun sensore Zwitserleven Fondsen trovato.",
			setup_hint: "Configurare in Impostazioni → Integrazioni → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Non trovato",
			unavailable: "Non disponibile",
			price_history: "Storico prezzi",
			date: "Data",
			price: "Prezzo",
			change: "Variazione",
			loading: "Caricamento…",
			no_history: "Nessun prezzo salvato finora.",
			no_funds: "Nessun fondo selezionato. Modifica la scheda per sceglierli.",
			close: "Chiudi"
		}
	},
	pt: {
		editor: {
			title_label: "Título (opcional)",
			default_range: "Intervalo padrão",
			tile_size: "Tamanho do bloco",
			selected: "Selecionados",
			drag_hint: "arrastar para reordenar",
			add: "Adicionar",
			no_sensors: "Nenhum sensor Zwitserleven Fondsen encontrado.",
			setup_hint: "Configurar em Definições → Integrações → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Não encontrado",
			unavailable: "Indisponível",
			price_history: "Histórico de preços",
			date: "Data",
			price: "Preço",
			change: "Variação",
			loading: "A carregar…",
			no_history: "Ainda não há preços guardados.",
			no_funds: "Nenhum fundo selecionado. Edite o cartão para os escolher.",
			close: "Fechar"
		}
	},
	pl: {
		editor: {
			title_label: "Tytuł (opcjonalny)",
			default_range: "Domyślny zakres czasu",
			tile_size: "Rozmiar kafelka",
			selected: "Wybrane",
			drag_hint: "przeciągnij, aby zmienić kolejność",
			add: "Dodaj",
			no_sensors: "Nie znaleziono czujników Zwitserleven Fondsen.",
			setup_hint: "Skonfiguruj w Ustawienia → Integracje → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Nie znaleziono",
			unavailable: "Niedostępny",
			price_history: "Historia cen",
			date: "Data",
			price: "Cena",
			change: "Zmiana",
			loading: "Ładowanie…",
			no_history: "Brak zapisanych cen.",
			no_funds: "Nie wybrano funduszy. Edytuj kartę, aby je wybrać.",
			close: "Zamknij"
		}
	},
	sv: {
		editor: {
			title_label: "Titel (valfritt)",
			default_range: "Standardtidsintervall",
			tile_size: "Kakelstorlek",
			selected: "Valda",
			drag_hint: "dra för att sortera",
			add: "Lägg till",
			no_sensors: "Inga Zwitserleven Fondsen-sensorer hittades.",
			setup_hint: "Konfigurera under Inställningar → Integrationer → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Hittades inte",
			unavailable: "Ej tillgänglig",
			price_history: "Kurshistorik",
			date: "Datum",
			price: "Kurs",
			change: "Förändring",
			loading: "Laddar…",
			no_history: "Inga kurser sparade än.",
			no_funds: "Inga fonder valda. Redigera kortet för att välja dem.",
			close: "Stäng"
		}
	},
	da: {
		editor: {
			title_label: "Titel (valgfrit)",
			default_range: "Standard tidsinterval",
			tile_size: "Flisestørrelse",
			selected: "Valgte",
			drag_hint: "træk for at sortere",
			add: "Tilføj",
			no_sensors: "Ingen Zwitserleven Fondsen-sensorer fundet.",
			setup_hint: "Opsæt under Indstillinger → Integrationer → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Ikke fundet",
			unavailable: "Utilgængelig",
			price_history: "Kurshistorik",
			date: "Dato",
			price: "Kurs",
			change: "Ændring",
			loading: "Indlæser…",
			no_history: "Ingen kurser gemt endnu.",
			no_funds: "Ingen fonde valgt. Rediger kortet for at vælge dem.",
			close: "Luk"
		}
	},
	nb: {
		editor: {
			title_label: "Tittel (valgfritt)",
			default_range: "Standard tidsintervall",
			tile_size: "Flisestørrelse",
			selected: "Valgte",
			drag_hint: "dra for å sortere",
			add: "Legg til",
			no_sensors: "Ingen Zwitserleven Fondsen-sensorer funnet.",
			setup_hint: "Konfigurer under Innstillinger → Integrasjoner → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Ikke funnet",
			unavailable: "Utilgjengelig",
			price_history: "Kurshistorikk",
			date: "Dato",
			price: "Kurs",
			change: "Endring",
			loading: "Laster…",
			no_history: "Ingen kurser lagret ennå.",
			no_funds: "Ingen fond valgt. Rediger kortet for å velge dem.",
			close: "Lukk"
		}
	},
	fi: {
		editor: {
			title_label: "Otsikko (valinnainen)",
			default_range: "Oletusjaksovali",
			tile_size: "Ruudun koko",
			selected: "Valitut",
			drag_hint: "vedä järjestääksesi",
			add: "Lisää",
			no_sensors: "Zwitserleven Fondsen -antureita ei löydy.",
			setup_hint: "Määritä kohdassa Asetukset → Integraatiot → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Ei löydy",
			unavailable: "Ei saatavilla",
			price_history: "Kurssihistoria",
			date: "Päivä",
			price: "Kurssi",
			change: "Muutos",
			loading: "Ladataan…",
			no_history: "Kursseja ei ole vielä tallennettu.",
			no_funds: "Rahastoja ei ole valittu. Valitse ne muokkaamalla korttia.",
			close: "Sulje"
		}
	},
	cs: {
		editor: {
			title_label: "Název (volitelný)",
			default_range: "Výchozí časový rozsah",
			tile_size: "Velikost dlaždice",
			selected: "Vybrané",
			drag_hint: "přetáhněte pro seřazení",
			add: "Přidat",
			no_sensors: "Nebyly nalezeny žádné senzory Zwitserleven Fondsen.",
			setup_hint: "Nastavte v Nastavení → Integrace → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Nenalezeno",
			unavailable: "Nedostupné",
			price_history: "Historie cen",
			date: "Datum",
			price: "Cena",
			change: "Změna",
			loading: "Načítání…",
			no_history: "Zatím nejsou uloženy žádné ceny.",
			no_funds: "Nejsou vybrány žádné fondy. Vyberte je úpravou karty.",
			close: "Zavřít"
		}
	},
	hu: {
		editor: {
			title_label: "Cím (opcionális)",
			default_range: "Alapértelmezett időtartomány",
			tile_size: "Csempe mérete",
			selected: "Kiválasztottak",
			drag_hint: "húzza a rendezéshez",
			add: "Hozzáadás",
			no_sensors: "Nem találhatók Zwitserleven Fondsen érzékelők.",
			setup_hint: "Állítsa be a Beállítások → Integrációk → Zwitserleven Fondsen menüpontban."
		},
		card: {
			not_found: "Nem található",
			unavailable: "Nem elérhető",
			price_history: "Árfolyam-előzmények",
			date: "Dátum",
			price: "Árfolyam",
			change: "Változás",
			loading: "Betöltés…",
			no_history: "Még nincsenek mentett árfolyamok.",
			no_funds: "Nincs kiválasztott alap. Szerkeszd a kártyát a kiválasztásukhoz.",
			close: "Bezárás"
		}
	},
	ru: {
		editor: {
			title_label: "Заголовок (необязательно)",
			default_range: "Временной диапазон по умолчанию",
			tile_size: "Размер плитки",
			selected: "Выбранные",
			drag_hint: "перетащите для сортировки",
			add: "Добавить",
			no_sensors: "Датчики Zwitserleven Fondsen не найдены.",
			setup_hint: "Настройте в Настройки → Интеграции → Zwitserleven Fondsen."
		},
		card: {
			not_found: "Не найдено",
			unavailable: "Недоступно",
			price_history: "История цен",
			date: "Дата",
			price: "Цена",
			change: "Изменение",
			loading: "Загрузка…",
			no_history: "Цены ещё не сохранены.",
			no_funds: "Фонды не выбраны. Измените карточку, чтобы выбрать их.",
			close: "Закрыть"
		}
	},
	zh: {
		editor: {
			title_label: "标题（可选）",
			default_range: "默认时间范围",
			tile_size: "磁贴大小",
			selected: "已选择",
			drag_hint: "拖动以排序",
			add: "添加",
			no_sensors: "未找到 Zwitserleven Fondsen 传感器。",
			setup_hint: "在设置 → 集成 → Zwitserleven Fondsen 中进行配置。"
		},
		card: {
			not_found: "未找到",
			unavailable: "不可用",
			price_history: "价格历史",
			date: "日期",
			price: "价格",
			change: "变动",
			loading: "加载中…",
			no_history: "尚未保存任何价格。",
			no_funds: "未选择基金。编辑卡片以选择基金。",
			close: "关闭"
		}
	},
	ja: {
		editor: {
			title_label: "タイトル（省略可）",
			default_range: "デフォルト期間",
			tile_size: "タイルサイズ",
			selected: "選択済み",
			drag_hint: "ドラッグして並び替え",
			add: "追加",
			no_sensors: "Zwitserleven Fondsen センサーが見つかりません。",
			setup_hint: "設定 → インテグレーション → Zwitserleven Fondsen で設定してください。"
		},
		card: {
			not_found: "見つかりません",
			unavailable: "利用不可",
			price_history: "価格履歴",
			date: "日付",
			price: "価格",
			change: "変動",
			loading: "読み込み中…",
			no_history: "保存された価格はまだありません。",
			no_funds: "ファンドが選択されていません。カードを編集して選択してください。",
			close: "閉じる"
		}
	},
	ko: {
		editor: {
			title_label: "제목 (선택사항)",
			default_range: "기본 기간",
			tile_size: "타일 크기",
			selected: "선택됨",
			drag_hint: "드래그하여 정렬",
			add: "추가",
			no_sensors: "Zwitserleven Fondsen 센서를 찾을 수 없습니다.",
			setup_hint: "설정 → 통합 → Zwitserleven Fondsen에서 설정하세요."
		},
		card: {
			not_found: "찾을 수 없음",
			unavailable: "사용할 수 없음",
			price_history: "가격 기록",
			date: "날짜",
			price: "가격",
			change: "변동",
			loading: "불러오는 중…",
			no_history: "아직 저장된 가격이 없습니다.",
			no_funds: "선택된 펀드가 없습니다. 카드를 편집하여 선택하세요.",
			close: "닫기"
		}
	},
	tr: {
		editor: {
			title_label: "Başlık (isteğe bağlı)",
			default_range: "Varsayılan zaman aralığı",
			tile_size: "Kutucuk boyutu",
			selected: "Seçilenler",
			drag_hint: "sıralamak için sürükle",
			add: "Ekle",
			no_sensors: "Zwitserleven Fondsen sensörü bulunamadı.",
			setup_hint: "Ayarlar → Entegrasyonlar → Zwitserleven Fondsen altında yapılandırın."
		},
		card: {
			not_found: "Bulunamadı",
			unavailable: "Kullanılamıyor",
			price_history: "Fiyat geçmişi",
			date: "Tarih",
			price: "Fiyat",
			change: "Değişim",
			loading: "Yükleniyor…",
			no_history: "Henüz kayıtlı fiyat yok.",
			no_funds: "Fon seçilmedi. Seçmek için kartı düzenleyin.",
			close: "Kapat"
		}
	},
	ar: {
		editor: {
			title_label: "العنوان (اختياري)",
			default_range: "النطاق الزمني الافتراضي",
			tile_size: "حجم البلاطة",
			selected: "المحددة",
			drag_hint: "اسحب للترتيب",
			add: "إضافة",
			no_sensors: "لم يتم العثور على أجهزة استشعار Zwitserleven Fondsen.",
			setup_hint: "الإعداد في الإعدادات ← التكاملات ← Zwitserleven Fondsen."
		},
		card: {
			not_found: "غير موجود",
			unavailable: "غير متاح",
			price_history: "سجل الأسعار",
			date: "التاريخ",
			price: "السعر",
			change: "التغير",
			loading: "جارٍ التحميل…",
			no_history: "لا توجد أسعار محفوظة بعد.",
			no_funds: "لم يتم اختيار أي صناديق. عدّل البطاقة لاختيارها.",
			close: "إغلاق"
		}
	}
};
function t(lang) {
	return translations[lang.split("-")[0].toLowerCase()] ?? translations["en"];
}
/** Format a euro price in the user's locale, e.g. "€ 225,87". */
function formatPrice(price, locale) {
	if (isNaN(price)) return "–";
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 4
	}).format(price);
}
/** A price change with its sign, e.g. "+€ 1,25" or "-€ 0,40"; no sign for 0. */
function formatPriceChange(change, locale) {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
		signDisplay: "exceptZero"
	}).format(change);
}
/** A percentage change with its sign, e.g. "+0,55%"; `pct` is in percent. */
function formatPercentChange(pct, locale) {
	return new Intl.NumberFormat(locale, {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		signDisplay: "exceptZero"
	}).format(pct / 100);
}
/** Local Date for a "YYYY-MM-DD" day, or null if it doesn't parse. */
function parseDay(day) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
	if (!match) return null;
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
/**
* Short label for the date a price was published for, e.g. "9 Oct" or
* "9 okt"; the year is added when it is not the current one. Empty when the
* date is missing or malformed.
*/
function formatPriceDate(day, locale, now = /* @__PURE__ */ new Date()) {
	const date = day ? parseDay(day) : null;
	if (!date) return "";
	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		...date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }
	}).format(date);
}
/** Full form of the same date for a tooltip, e.g. "9 October 2026". */
function formatPriceDateLong(day, locale) {
	const date = day ? parseDay(day) : null;
	if (!date) return "";
	return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}
/**
* Chart coordinates for a price series, one evenly spaced step per price.
* A single price is drawn as a flat line across the full width.
*/
function sparklinePoints(history) {
	if (history.length === 1) history = [history[0], history[0]];
	const prices = history.map(([, p]) => p);
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	const mid = (min + max) / 2;
	const span = Math.max(max - min, Math.abs(mid) * .001) || 1;
	const low = mid - span / 2;
	const innerW = 196;
	const innerH = 44;
	return history.map(([, p], i) => {
		return {
			x: 2 + i / (history.length - 1) * innerW,
			y: 2 + (1 - (p - low) / span) * innerH
		};
	});
}
//#endregion
//#region src/chart-data.ts
/** Local "YYYY-MM-DD" for `d`. */
function dayStr(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** The day `days` days, or `years` years, before the "YYYY-MM-DD" day `day`. */
function daysBefore(day, days, years = 0) {
	const [y, m, d] = day.split("-").map(Number);
	return dayStr(new Date(y - years, m - 1, d - days));
}
/**
* The daily prices with the sensor's current price merged in under its own
* price date. The stored history normally already holds it; merging covers
* the moment between a new price arriving and the card refetching the history.
*/
function withLivePrice(input) {
	const { dailyHistory, livePrice, priceDate } = input;
	if (!priceDate || !Number.isFinite(livePrice)) return dailyHistory;
	const last = dailyHistory[dailyHistory.length - 1];
	if (!last || last[0] < priceDate) return [...dailyHistory, [priceDate, livePrice]];
	if (last[0] === priceDate) return [...dailyHistory.slice(0, -1), [priceDate, livePrice]];
	return dailyHistory;
}
/**
* Build the chart series for the selected range from the daily prices, dated
* by the day each price was published for, never by when it was fetched.
*
* Ranges count back from the latest price date rather than from today, so the
* day or two Zwitserleven takes to publish a price doesn't shorten them.
* 1T is the latest price against the one before it.
*/
function buildChartData(input) {
	const prices = withLivePrice(input);
	if (prices.length <= 2) return prices;
	const latest = prices[prices.length - 1][0];
	const lastTwo = prices.slice(-2);
	const since = (from) => {
		const inRange = prices.filter(([d]) => d >= from);
		return inRange.length >= 2 ? inRange : lastTwo;
	};
	switch (input.range) {
		case "1T": return lastTwo;
		case "1W": return since(daysBefore(latest, 7));
		case "1M": return since(daysBefore(latest, 30));
		case "YTD": {
			const jan1 = `${latest.slice(0, 4)}-01-01`;
			const before = prices.filter(([d]) => d < jan1);
			const thisYear = prices.filter(([d]) => d >= jan1);
			const series = before.length > 0 ? [before[before.length - 1], ...thisYear] : thisYear;
			return series.length >= 2 ? series : lastTwo;
		}
		case "1J": return since(daysBefore(latest, 0, 1));
	}
}
//#endregion
//#region src/history-list.ts
/** One row per stored daily price, newest first, from prices oldest first. */
function historyRows(prices) {
	return prices.map(([date, price], i) => {
		if (i === 0) return {
			date,
			price,
			change: null,
			changePct: null
		};
		const previous = prices[i - 1][1];
		return {
			date,
			price,
			change: price - previous,
			changePct: previous !== 0 ? (price - previous) / previous * 100 : null
		};
	}).reverse();
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/decorate.js
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}
//#endregion
//#region src/zwitserleven-fondsen-card.ts
var DOMAIN = "zwitserleven_fondsen";
var CARD_TAG = "zwitserleven-fondsen-card";
var EDITOR_TAG = "zwitserleven-fondsen-card-editor";
var LOG_PREFIX = `[${CARD_TAG}]`;
console.info(`${LOG_PREFIX} v0.2.0-dev loaded from ${import.meta.url}`);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) window.customCards.push({
	type: CARD_TAG,
	name: "Zwitserleven Fondsen Card",
	description: "Displays Zwitserleven fund prices with sparkline charts.",
	preview: true
});
var TILE_MIN_WIDTHS = {
	small: "170px",
	medium: "220px",
	large: "280px"
};
var RANGES = [
	{
		value: "1T",
		label: "1D"
	},
	{
		value: "1W",
		label: "1W"
	},
	{
		value: "1M",
		label: "1M"
	},
	{
		value: "YTD",
		label: "YTD"
	},
	{
		value: "1J",
		label: "1Y"
	}
];
/** Sensors of this integration only, even if another one also exposes a `symbol`. */
function findFundSensors(hass) {
	if (!hass) return [];
	const registry = hass.entities ?? {};
	return Object.values(hass.states).filter((e) => registry[e.entity_id]?.platform === DOMAIN && typeof e.attributes["symbol"] === "string").sort((a, b) => a.attributes["symbol"].localeCompare(b.attributes["symbol"]));
}
var ZwitserlevenFondsenCardEditor = class extends i {
	constructor(..._args) {
		super(..._args);
		this._dragIndex = null;
	}
	setConfig(config) {
		this._config = config;
	}
	_sensorName(sensor) {
		return sensor.attributes.long_name || sensor.attributes.symbol;
	}
	_onDragStart(e, index) {
		this._dragIndex = index;
		e.dataTransfer.effectAllowed = "move";
	}
	_onDragOver(e, index) {
		e.preventDefault();
		if (this._dragIndex === null || this._dragIndex === index) return;
		const entities = [...this._config?.entities ?? []];
		const [moved] = entities.splice(this._dragIndex, 1);
		entities.splice(index, 0, moved);
		this._dragIndex = index;
		this._set("entities", entities);
	}
	_onDragEnd() {
		this._dragIndex = null;
	}
	render() {
		if (!this._config) return A;
		const { title, default_range, entities = [] } = this._config;
		const all = findFundSensors(this.hass);
		const selectedIds = entities;
		const available = all.filter((s) => !selectedIds.includes(s.entity_id));
		const s = t(this.hass?.locale?.language ?? "en").editor;
		return b`
      <div class="editor">
        <ha-textfield
          label=${s.title_label}
          .value=${title ?? ""}
          @change=${(e) => {
			const v = e.target.value.trim();
			this._set("title", v || void 0);
		}}
        ></ha-textfield>

        <div class="field-label">${s.default_range}</div>
        <div class="range-picker">
          ${RANGES.map(({ value, label }) => b`
              <button
                class="range-opt ${(default_range ?? "1T") === value ? "active" : ""}"
                @click=${() => this._set("default_range", value)}
              >${label}</button>
            `)}
        </div>

        <div class="field-label">${s.tile_size}</div>
        <div class="range-picker">
          ${[
			"small",
			"medium",
			"large"
		].map((size) => b`
            <button
              class="range-opt ${(this._config?.tile_size ?? "small") === size ? "active" : ""}"
              @click=${() => this._set("tile_size", size)}
            >${size === "small" ? "S" : size === "medium" ? "M" : "L"}</button>
          `)}
        </div>

        ${entities.length > 0 ? b`
          <div class="section-label">${s.selected} <span class="hint-inline">— ${s.drag_hint}</span></div>
          <div class="selected-list">
            ${entities.map((entityId, index) => {
			const sensor = all.find((s) => s.entity_id === entityId);
			const name = sensor ? this._sensorName(sensor) : entityId;
			const symbol = sensor?.attributes.symbol ?? "";
			return b`
                <div
                  class="selected-row ${this._dragIndex === index ? "dragging" : ""}"
                  @dragover=${(e) => this._onDragOver(e, index)}
                >
                  <span
                    class="drag-handle"
                    draggable="true"
                    @dragstart=${(e) => this._onDragStart(e, index)}
                    @dragend=${() => this._onDragEnd()}
                  >⠿</span>
                  <span class="sensor-name">${name}</span>
                  <span class="sensor-meta">${symbol}</span>
                  <button class="remove-btn" @click=${() => this._removeEntity(entityId)}>✕</button>
                </div>
              `;
		})}
          </div>
        ` : A}

        ${all.length === 0 ? b`<p class="hint">${s.no_sensors}<br />${s.setup_hint}</p>` : available.length > 0 ? b`
              <div class="section-label">${s.add}</div>
              ${available.map((sensor) => b`
                <label class="sensor-row">
                  <input type="checkbox" .checked=${false} @change=${() => this._addEntity(sensor.entity_id)} />
                  <span class="sensor-name">${this._sensorName(sensor)}</span>
                  <span class="sensor-meta">${sensor.attributes.symbol} · ${sensor.entity_id}</span>
                </label>
              `)}
            ` : A}
      </div>
    `;
	}
	_set(key, value) {
		const config = {
			...this._config,
			[key]: value
		};
		if (value === void 0) delete config[key];
		this.dispatchEvent(new CustomEvent("config-changed", { detail: { config } }));
	}
	_addEntity(entityId) {
		const current = this._config?.entities ?? [];
		this._set("entities", [...current, entityId]);
	}
	_removeEntity(entityId) {
		const current = this._config?.entities ?? [];
		this._set("entities", current.filter((e) => e !== entityId));
	}
	static {
		this.styles = i$3`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }
    ha-textfield {
      display: block;
      width: 100%;
    }
    .field-label {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
    .range-picker {
      display: flex;
      gap: 6px;
    }
    .range-opt {
      flex: 1;
      padding: 6px 0;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: none;
      cursor: pointer;
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
    .range-opt.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font-weight: 600;
    }
    .section-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      margin-top: 8px;
      padding-bottom: 2px;
      border-bottom: 1px solid var(--divider-color);
    }
    .hint-inline {
      font-weight: 400;
      font-size: 0.78rem;
    }
    .selected-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .selected-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      background: var(--secondary-background-color);
      user-select: none;
    }
    .selected-row.dragging {
      opacity: 0.4;
    }
    .drag-handle {
      font-size: 1.1rem;
      color: var(--secondary-text-color);
      cursor: grab;
      flex-shrink: 0;
    }
    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 0.8rem;
      padding: 2px 4px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
    }
    .remove-btn:hover {
      color: var(--error-color, #f44336);
    }
    .sensor-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      cursor: pointer;
      border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.06));
    }
    .sensor-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .sensor-name {
      font-size: 0.88rem;
      color: var(--primary-text-color);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sensor-meta {
      font-size: 0.72rem;
      color: var(--secondary-text-color);
      font-family: monospace;
      flex-shrink: 0;
    }
    .hint {
      font-size: 0.82rem;
      color: var(--secondary-text-color);
      line-height: 1.5;
      margin: 4px 0;
    }
  `;
	}
};
__decorate([n({ attribute: false })], ZwitserlevenFondsenCardEditor.prototype, "hass", void 0);
__decorate([r()], ZwitserlevenFondsenCardEditor.prototype, "_config", void 0);
__decorate([r()], ZwitserlevenFondsenCardEditor.prototype, "_dragIndex", void 0);
var DAILY_HISTORY_TTL = 36e5;
var ZwitserlevenFondsenCard = class extends i {
	constructor(..._args2) {
		super(..._args2);
		this._timeRange = "1T";
		this._dailyHistoryCache = /* @__PURE__ */ new Map();
		this._fetchingDaily = /* @__PURE__ */ new Set();
	}
	set hass(hass) {
		this._hass = hass;
		this.requestUpdate();
	}
	get hass() {
		return this._hass;
	}
	setConfig(config) {
		if (!Array.isArray(config.entities)) throw new Error(`${CARD_TAG}: 'entities' must be a list.`);
		this._config = config;
		this._timeRange = config.default_range ?? "1T";
	}
	getCardSize() {
		return Math.ceil((this._config?.entities.length ?? 1) / 3) * 3 + 1;
	}
	/** The card picker passes `hass`, so a new card starts with every fund already set up. */
	static getStubConfig(hass) {
		return {
			type: `custom:${CARD_TAG}`,
			title: "Zwitserleven",
			entities: findFundSensors(hass).map((sensor) => sensor.entity_id),
			default_range: "1T"
		};
	}
	static getConfigElement() {
		return document.createElement(EDITOR_TAG);
	}
	_cachedDailyHistory(symbol) {
		const entry = this._dailyHistoryCache.get(symbol);
		if (!entry || Date.now() - entry.ts > DAILY_HISTORY_TTL) return null;
		return entry.data;
	}
	async _fetchDailyHistory(symbol) {
		if (this._fetchingDaily.has(symbol)) return;
		if (this._cachedDailyHistory(symbol) !== null) return;
		this._fetchingDaily.add(symbol);
		try {
			const result = await this._hass.callApi("GET", `${DOMAIN}/history?symbol=${encodeURIComponent(symbol)}`);
			this._dailyHistoryCache.set(symbol, {
				data: result.history,
				ts: Date.now()
			});
			this.requestUpdate();
		} catch (err) {
			console.warn(`${LOG_PREFIX} daily history fetch failed for ${symbol}:`, err);
		} finally {
			this._fetchingDaily.delete(symbol);
		}
	}
	_calcPeriodChange(chartData) {
		if (chartData.length < 2) return 0;
		const oldest = chartData[0][1];
		const newest = chartData[chartData.length - 1][1];
		return oldest !== 0 ? (newest - oldest) / oldest * 100 : 0;
	}
	render() {
		if (!this._config || !this._hass) return A;
		const tileMinWidth = TILE_MIN_WIDTHS[this._config.tile_size ?? "small"] ?? "170px";
		return b`
      <ha-card>
        <div class="card-top">
          ${this._config.title ? b`<h1 class="card-header">${this._config.title}</h1>` : A}
          <div class="range-selector">
            ${RANGES.map(({ value, label }) => b`
                <button
                  class="range-btn ${this._timeRange === value ? "active" : ""}"
                  @click=${() => {
			this._timeRange = value;
		}}
                >
                  ${label}
                </button>
              `)}
          </div>
        </div>
        <div class="card-content">
          ${this._config.entities.length === 0 ? b`<p class="status">${t(this._hass.locale?.language ?? "en").card.no_funds}</p>` : b`
              <div class="asset-grid" style="grid-template-columns: repeat(auto-fill, minmax(${tileMinWidth}, 1fr))">
                ${this._config.entities.map((entry) => this._renderEntity(entry))}
              </div>
            `}
        </div>
        ${this._renderHistoryDialog()}
      </ha-card>
    `;
	}
	updated() {
		const dialog = this._historyDialog;
		if (dialog && !dialog.open) dialog.showModal();
	}
	_renderEntity(entityId) {
		const raw = this._hass?.states[entityId];
		if (!raw) return b`
        <div class="asset-tile">
          <div class="asset-header">
            <span class="asset-name">${entityId}</span>
          </div>
          <div class="status error">${t(this._hass?.locale?.language ?? "en").card.not_found}</div>
        </div>
      `;
		const entity = raw;
		const attr = entity.attributes;
		const displayName = raw.attributes["friendly_name"] || attr.long_name || attr.symbol || entityId;
		const locale = this._hass?.locale?.language;
		const strings = t(locale ?? "en").card;
		const price = parseFloat(entity.state);
		if (!Number.isFinite(price) || !attr.symbol) return this._renderUnavailableTile(entityId, displayName, strings.unavailable);
		this._fetchDailyHistory(attr.symbol);
		const chartData = buildChartData({
			dailyHistory: this._cachedDailyHistory(attr.symbol) ?? [],
			range: this._timeRange,
			livePrice: price,
			priceDate: attr.price_date
		});
		const periodChange = this._calcPeriodChange(chartData);
		const priceDate = formatPriceDate(attr.price_date, locale);
		const isPositive = periodChange >= 0;
		const trendColor = isPositive ? "var(--success-color, #4caf50)" : "var(--error-color, #f44336)";
		const arrow = isPositive ? "▲" : "▼";
		const refPrice = chartData.length > 0 ? chartData[0][1] : null;
		const showRef = refPrice !== null && Math.abs(refPrice - price) > 1e-4;
		return b`
      <div class="asset-tile" @click=${() => this._openMoreInfo(entityId)}>
        <div class="asset-header">
          <span class="asset-name" title="${displayName}">${displayName}</span>
          <span class="asset-meta">
            <span class="asset-symbol">${attr.symbol}</span>
            ${priceDate ? b` · <span title=${formatPriceDateLong(attr.price_date, locale)}>${priceDate}</span>` : A}
          </span>
          <button
            class="history-btn"
            title=${strings.price_history}
            aria-label=${strings.price_history}
            @click=${(e) => {
			e.stopPropagation();
			this._historyEntityId = entityId;
		}}
          >
            <ha-icon icon="mdi:format-list-bulleted"></ha-icon>
          </button>
        </div>
        <div class="asset-price">
          <div class="price-stack">
            <span class="price">${formatPrice(price, locale)}</span>
            ${showRef ? b`<span class="ref-price">${formatPrice(refPrice, locale)}</span>` : A}
          </div>
          <span class="change" style="color:${trendColor}">
            <span class="arrow">${arrow}</span>${Math.abs(periodChange).toFixed(2)}%
          </span>
        </div>
        <div class="sparkline-wrap">
          ${this._renderSparkline(chartData, trendColor)}
        </div>
      </div>
    `;
	}
	/** A dimmed tile without price, change or sparkline; it still opens more-info. */
	_renderUnavailableTile(entityId, name, label) {
		return b`
      <div class="asset-tile unavailable" @click=${() => this._openMoreInfo(entityId)}>
        <div class="asset-header">
          <span class="asset-name" title="${name}">${name}</span>
        </div>
        <div class="asset-price">
          <span class="price">–</span>
          <span class="change">${label}</span>
        </div>
        <div class="sparkline-wrap">
          <div class="sparkline-placeholder"></div>
        </div>
      </div>
    `;
	}
	/** The stored daily prices of the open fund, newest first, in a modal dialog. */
	_renderHistoryDialog() {
		const entityId = this._historyEntityId;
		const raw = entityId ? this._hass?.states[entityId] : void 0;
		if (!raw) return A;
		const attr = raw.attributes;
		const name = raw.attributes["friendly_name"] || attr.long_name || attr.symbol;
		const locale = this._hass?.locale?.language;
		const strings = t(locale ?? "en").card;
		const history = this._cachedDailyHistory(attr.symbol);
		const rows = history ? historyRows(withLivePrice({
			dailyHistory: history,
			livePrice: parseFloat(raw.state),
			priceDate: attr.price_date
		})) : null;
		let body;
		if (rows === null && this._fetchingDaily.has(attr.symbol)) body = b`<p class="status">${strings.loading}</p>`;
		else if (!rows?.length) body = b`<p class="status">${strings.no_history}</p>`;
		else body = b`
        <table>
          <thead>
            <tr>
              <th scope="col">${strings.date}</th>
              <th scope="col" class="num">${strings.price}</th>
              <th scope="col" class="num">${strings.change}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => {
			const trend = !row.change ? "" : row.change > 0 ? "up" : "down";
			return b`
                <tr>
                  <td title=${formatPriceDateLong(row.date, locale)}>
                    ${formatPriceDate(row.date, locale)}
                  </td>
                  <td class="num">${formatPrice(row.price, locale)}</td>
                  <td class="num ${trend}">
                    ${row.change === null ? "–" : b`${formatPriceChange(row.change, locale)}${row.changePct === null ? A : b` <span class="pct">${formatPercentChange(row.changePct, locale)}</span>`}`}
                  </td>
                </tr>
              `;
		})}
          </tbody>
        </table>
      `;
		return b`
      <dialog
        class="history-dialog"
        aria-labelledby="history-title"
        @close=${() => {
			this._historyEntityId = void 0;
		}}
        @click=${(e) => {
			if (e.target === e.currentTarget) this._historyDialog?.close();
		}}
      >
        <div class="dialog-content">
          <div class="dialog-header">
            <div class="dialog-heading">
              <h2 id="history-title">${strings.price_history}</h2>
              <div class="dialog-subtitle">
                ${name} · <span class="asset-symbol">${attr.symbol}</span>
              </div>
            </div>
            <button
              class="close-btn"
              title=${strings.close}
              aria-label=${strings.close}
              @click=${() => this._historyDialog?.close()}
            >✕</button>
          </div>
          <div class="dialog-body">${body}</div>
        </div>
      </dialog>
    `;
	}
	_openMoreInfo(entityId) {
		this.dispatchEvent(new CustomEvent("hass-more-info", {
			detail: { entityId },
			bubbles: true,
			composed: true
		}));
	}
	_renderSparkline(history, color) {
		if (history.length === 0) return A;
		return w`
      <svg viewBox="0 0 ${200} ${48}" preserveAspectRatio="none" class="sparkline-svg" aria-hidden="true">
        <polyline
          points="${sparklinePoints(history).map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}"
          fill="none"
          stroke="${color}"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
	}
	static {
		this.styles = i$3`
    ha-card { height: 100%; }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 0;
      gap: 8px;
    }
    .card-header {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color);
      flex: 1 1 auto;
    }
    .range-selector {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .range-btn {
      background: none;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--secondary-text-color);
      line-height: 1.6;
    }
    .range-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }

    .card-content { padding: 10px 16px 16px; }

    .asset-grid {
      display: grid;
      gap: 10px;
    }
    .asset-tile {
      background: var(--secondary-background-color);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      cursor: pointer;
      transition: filter 0.15s ease;
    }
    .asset-tile:hover {
      filter: brightness(1.08);
    }
    .asset-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
    }
    .asset-name {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .asset-meta {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .asset-symbol {
      font-family: monospace;
    }
    .history-btn {
      flex-shrink: 0;
      align-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      margin: -3px -4px -3px 0;
      padding: 0;
      border: none;
      border-radius: 4px;
      background: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      --mdc-icon-size: 16px;
    }
    .history-btn:hover,
    .history-btn:focus-visible {
      color: var(--primary-color);
      background: var(--divider-color);
    }
    .asset-price {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4px;
    }
    .price-stack {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .price {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
    }
    .ref-price {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .change {
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .arrow { font-size: 0.7rem; }
    .sparkline-wrap { margin-top: 5px; }
    .sparkline-svg,
    .sparkline-placeholder {
      width: 100%;
      height: 40px;
      display: block;
    }
    .asset-tile.unavailable {
      opacity: 0.6;
    }
    .asset-tile.unavailable .change {
      color: var(--secondary-text-color);
      font-weight: 500;
    }
    .status {
      font-size: 0.78rem;
      padding: 6px 0;
    }
    .error { color: var(--error-color, #f44336); }

    .history-dialog {
      width: min(460px, calc(100vw - 32px));
      max-height: min(640px, calc(100vh - 64px));
      padding: 0;
      border: none;
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .history-dialog[open] {
      display: flex;
    }
    .history-dialog::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }
    .dialog-content {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 0;
    }
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding: 16px 16px 8px;
    }
    .dialog-heading {
      min-width: 0;
    }
    .dialog-heading h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .dialog-subtitle {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .close-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 1rem;
    }
    .close-btn:hover,
    .close-btn:focus-visible {
      background: var(--divider-color);
      color: var(--primary-text-color);
    }
    .dialog-body {
      overflow-y: auto;
      padding: 0 16px 12px;
    }
    .dialog-body .status {
      margin: 0;
      padding: 16px 0;
      color: var(--secondary-text-color);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    th {
      position: sticky;
      top: 0;
      background: var(--card-background-color, #fff);
      text-align: left;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      padding: 8px 4px 6px;
      border-bottom: 1px solid var(--divider-color);
    }
    td {
      padding: 6px 4px;
      border-bottom: 1px solid var(--divider-color);
      white-space: nowrap;
    }
    .num {
      text-align: right;
    }
    td.up {
      color: var(--success-color, #4caf50);
    }
    td.down {
      color: var(--error-color, #f44336);
    }
    .pct {
      display: inline-block;
      min-width: 4.5em;
      margin-left: 4px;
    }
  `;
	}
};
__decorate([r()], ZwitserlevenFondsenCard.prototype, "_config", void 0);
__decorate([r()], ZwitserlevenFondsenCard.prototype, "_timeRange", void 0);
__decorate([r()], ZwitserlevenFondsenCard.prototype, "_historyEntityId", void 0);
__decorate([e("dialog.history-dialog")], ZwitserlevenFondsenCard.prototype, "_historyDialog", void 0);
/**
* Define `tag` unless something else already claimed it.
*
* A bare customElements.define() throws NotSupportedError on the second
* evaluation, which breaks the rest of this module. Swallowing that silently
* is worse though: the *first* copy loaded wins, so a user with a stale
* duplicate resource (e.g. a leftover /local/zwitserleven-fondsen-card.js from a manual
* install) keeps running the old card after upgrading, with nothing anywhere
* to explain it. The warning names the copy that lost.
*/
function defineOnce(tag, ctor) {
	if (customElements.get(tag)) {
		console.warn(`${LOG_PREFIX} <${tag}> is already registered by another copy of this card, so this copy was ignored: ${import.meta.url}. The copy that loaded first wins, which may be an older build. Check Settings > Dashboards > three-dot menu > Resources for a duplicate entry (a leftover /local/${CARD_TAG}.js is the usual cause) and remove it.`);
		return;
	}
	customElements.define(tag, ctor);
}
defineOnce(EDITOR_TAG, ZwitserlevenFondsenCardEditor);
defineOnce(CARD_TAG, ZwitserlevenFondsenCard);
//#endregion
export { ZwitserlevenFondsenCard, ZwitserlevenFondsenCardEditor, findFundSensors };

//# sourceMappingURL=zwitserleven-fondsen-card.js.map