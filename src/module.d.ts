import { EffectTag } from "./constants";

declare global {
  interface Window {
    requestIdleCallback: Function;
    cancelIdleCallback: Function;
  }
  namespace JSX {
    interface Element extends Fiber {}
    // interface IntrinsicElements {
    //   [elemName: string]: any;
    // }
  }
}

interface Ref<Value> {
  current: Value;
}
interface Effect<Value> {
  depArray: Array<Value>;
  effectCallback?: Function;
}
interface Hook<StateValue, RefValue, EffectValue> {
  states: Array<StateValue>;
  refs: Array<Ref<RefValue>>;
  effects: Array<Effect<EffectValue>>;
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
  hook?: Hook<any, any, any>;
}
