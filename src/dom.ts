import { TEXT_TYPE } from "./constants";
import { Fiber } from "./module";

export const createTextDom = (fiber: Fiber): any => {
  return fiber.props.nodeValue;
};

export const createElementDom = (fiber: Fiber): any => {
  const {
    type,
    props: { key, children, ...attributes },
  } = fiber;

  return {
    key,
    nodeName: type,
    attributes,
    children: [],
  };
};

export const createDom = (fiber: Fiber): any => {
  return fiber.type !== TEXT_TYPE
    ? createElementDom(fiber)
    : createTextDom(fiber);
};
