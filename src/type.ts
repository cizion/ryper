import { EffectTag } from "./constants";

declare global {
  namespace JSX {
    interface Element extends Fiber {}
    // interface IntrinsicElements {
    //   [elemName: string]: any;
    // }
  }
}

export interface Ref<Value> {
  current: Value;
}
export interface Effect {
  depArray: Array<any>;
  returnCallback?: Function;
}
export interface Memo<Value> {
  depArray: Array<any>;
  computed: Value;
}
export interface Callback<Value> {
  depArray: Array<any>;
  hooksCallback: Value;
}
export interface Hook<StateValue, RefValue, MemoValue, CallbackValue> {
  states: Array<StateValue>;
  refs: Array<Ref<RefValue>>;
  effects: Array<Effect>;
  memos: Array<Memo<MemoValue>>;
  callbacks: Array<CallbackValue>;
}

export type ElType = string | Function;
export type ElProps = { [key: string]: any };
export type ElChildren = any[];

export interface V1 {
  key: any;
  nodeName: any;
  attributes: any;
  children: any[];
}

export interface V2 {
  key: any;
  tag: any;
  props: any;
  children: any[];
  node: any;
  type: any;
}

export interface Fiber {
  type: ElType;
  props: ElProps & {
    children: Fiber[];
    key?: string | number | null;
    nodeValue?: any;
  };
  alternate?: Fiber;
  parent?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  effectTag?: EffectTag;
  dom?: any;
  hook?: Hook<any, any, any, any>;
}
