
import {h, app} from 'hyperapp';

const React = (() => {
  let hooks = [];
  let idx = 0;

  let effects = [];
  let effectIdx = 0;
  let effectFlag = false;

  let rootAction;

  let elements = [];

  const componentRender = (type, props, children) => {
    const el = type(props, children)();

    const _effectIdx = effectIdx;
    const _effectFlag = effectFlag;

    const element = elements[elements.length - 1];
    const elementProps = element.attributes;

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = (_el) => {
      oldCreate && oldCreate(_el);
    }

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = (_el) => {
      if(_effectFlag) {
        const effect = effects[_effectIdx - 1];
        const destroy = effect[effect.length - 1];
        destroy && destroy.callback && destroy.callback(_el);
      }

      oldDestroy && oldDestroy(_el);
    };

    effectFlag = false;

    return el;
  }
  const elementRender = (type, props, children) => {
    const el = h(type, props, ...children);

    const oldCreate = props.oncreate;
    props.oncreate = (_el) => {
      props.ref && (props.ref.current = _el)
      oldCreate && oldCreate(_el);
    }

    const oldDestroy = props.ondestroy;
    props.ondestroy = (_el) => {
      oldDestroy && oldDestroy(_el);
    };

    elements.push(el);
    return el;
  }
  const createElement = (type, props, ...children) => {
    const defaultProps = {oncreate : null, ref : null, ondestroy: null}
    props = {...defaultProps, ...props};

    return () => {
      const el = (
        typeof type === 'function' 
        ? componentRender(type, props, children)
        : elementRender(type, props, children)
      );

      return el
    };
  }
  const createComponent = (component) => {
    idx = 0;
    effectIdx = 0;
    effectFlag = false;
    elements = [];

    return component;
  }
  const createActions = (actionTemplate) => {
    return {
      ...actionTemplate,
      change : () => (state) => ({...state}),
      getState : () => (state) => (state)
    }
  }
  const render = (state, action, view, root) => {
    const wiredActions = app(
      state,
      createActions(action),
      () => createComponent(view()),
      root
    );

    rootAction = wiredActions;

    return wiredActions;
  }
  const useState = (initValue) => {
    const _idx = idx;
    const setState = (newVal, rerender = true) => {
      if(hooks[_idx] === newVal) {return hooks[_idx];}
      hooks[_idx] = newVal;
      rerender && rootAction.change();
      return hooks[_idx];
    }
    const state = hooks[idx] || setState(initValue, false);
    idx++;
    return [state, setState];
  }
  const useRef = (val) => {
    return useState({ current: val })[0];
  }
  const useEffect = (cb, depArray) => {
    const oldDeps = effects[effectIdx];
    let hasChanged = true;

    if (oldDeps) {
      hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
      depArray.push(oldDeps[oldDeps.length - 1]);
    } else {
      depArray.push({callback: null});
    }

    if (hasChanged) setTimeout(() => {
      const callback = cb();
      const destroy = depArray[depArray.length - 1];
      destroy.callback = callback;
    });

    effects[effectIdx] = depArray;

    effectFlag = true;
    effectIdx++;
  }
  const getState = (selector?:any) => {
    const state = rootAction.getState()
    return selector ? selector(state) : state;
  }
  const getActions = (selector?:any) => {
    return selector ? rootAction[selector] : rootAction
  };
  return {render, useState, useRef, useEffect, createElement, getState, getActions};
})()

export const {
  useState,
  useRef,
  useEffect,
  getState,
  getActions
} = React;

export default React;