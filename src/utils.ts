export const isEmpty = (value: any): value is undefined | null => {
  return !(value != null && value !== true && value !== false);
};

export const isEmptyArrIndex = (arr: Array<any>, index: number): boolean => {
  return arr.length - 1 < index;
};

export const flatDeep = (arr: any[], d = 1): any[] => {
  return d > 0
    ? arr.reduce(
        (acc, val) =>
          acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val),
        []
      )
    : arr.slice();
};
