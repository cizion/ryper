import { TEXT_TYPE } from "./constants";
import { V2, V1, Fiber } from "./module";
import { flatDeep } from "./utils";

export const isV2VNode = (el: { [key: string]: any }): el is V2 => {
  const V2NodeKeys = ["key", "tag", "props", "children", "node", "type"];
  return (
    el instanceof Object &&
    V2NodeKeys.every((key) => Object.keys(el).includes(key))
  );
};

export const convertV2Node = (el: V2): Fiber => {
  const { key, tag, props, children } = el;
  return {
    type: tag,
    props: {
      ...props,
      key,
      children,
    },
  };
};

export const isV1VNode = (el: { [key: string]: any }): el is V1 => {
  const V1NodeKeys = ["key", "nodeName", "attributes", "children"];
  return (
    el instanceof Object &&
    V1NodeKeys.every((key) => Object.keys(el).includes(key))
  );
};

export const convertV1Node = (el: V1): Fiber => {
  const { nodeName, attributes, children, key } = el;
  return {
    type: nodeName,
    props: {
      ...attributes,
      key,
      children,
    },
  };
};

export const isFiber = (el: { [key: string]: any }): el is Fiber => {
  const FiberKeys = ["type", "props"];
  return (
    el instanceof Object &&
    !(el instanceof Function) &&
    !(el instanceof Array) &&
    FiberKeys.every((key) => Object.keys(el).includes(key))
  );
};

export const convertTextNode = (value: any): Fiber => ({
  type: TEXT_TYPE,
  props: {
    nodeValue: value,
    children: [],
  },
});

export const createChildElement = (child: any): Fiber => {
  if (isV2VNode(child)) {
    return convertV2Node(child);
  } else if (isV1VNode(child)) {
    return convertV1Node(child);
  } else if (isFiber(child)) {
    return child;
  } else {
    return convertTextNode(child);
  }
};

export const createChildrenElement = (children: any[]): Fiber[] => {
  return flatDeep(children, Infinity).map(createChildElement);
};
