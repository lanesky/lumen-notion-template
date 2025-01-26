const toKebabCaseConditional = (str: string = ""): string => {
  if (!str) {
    return "";
  }

  // 检测字符串中是否包含非英文和数字的字符
  if (/[^a-zA-Z0-9]/.test(str)) {
    return str; // 如果包含非英文数字字符，则返回空字符串
  }

  // 如果不包含非英文数字字符，则执行原有的 toKebabCase 逻辑
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((word) => word.toLowerCase())
    .join("-") || "";
};

// const toKebabCase = (str: string = ""): string =>
//   str
//     .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
//     ?.map((word) => word.toLowerCase())
//     .join("-") || "";

export { toKebabCaseConditional as toKebabCase };
