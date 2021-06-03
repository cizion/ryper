const React = (() => {
  const createElement = (type: any, props: any, ...children: any[]) => {
    const newProps = { ...props };
    const newChildren = [...children];
    return {
      type,
      props: newProps,
      children: newChildren.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    };
  };

  const createTextElement = (text: any) => {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
      },
      children: [],
    };
  };

  const render = (element: any, container: HTMLElement | null) => {
    if (container === null) {
      return;
    }
    console.log(element);
    const dom =
      element.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(element.type);
    Object.keys(element.props).forEach((name) => {
      dom[name] = element.props[name];
    });

    element.children.forEach((child: any) => render(child, dom));
    container.appendChild(dom);
  };

  return {
    render,
    createElement,
  };
})();

export default React;
