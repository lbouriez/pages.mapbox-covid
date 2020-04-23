import debug from "debug";
import stringify from "json-stringify-safe";

const BASE = "covid-map";
const DEFAULT_SOURCE = "-";
const COLOURS = {
  trace: "#9966ff",
  info: "cyan",
  warn: "pink",
  error: "red",
};

localStorage.setItem("debug", `${BASE}*`);

export default new (class Log {
  debugeObj = debug(BASE);

  #generateMessage = (level, message, source) => {
    this.debugeObj.color = COLOURS[level];
    this.debugeObj(source, `${new Date().toISOString()} :: ${typeof message === "object" ? stringify(message) : message}`);
  };

  trace = (message, source = DEFAULT_SOURCE) => {
    this.#generateMessage("trace", message, source);
  };

  info = (message, source = DEFAULT_SOURCE) => {
    this.#generateMessage("info", message, source);
  };

  warn = (message, source = DEFAULT_SOURCE) => {
    this.#generateMessage("warn", message, source);
  };

  error = (message, source = DEFAULT_SOURCE) => {
    this.#generateMessage("error", message, source);
  };
})();
