import _uniqueId from 'lodash/uniqueId';
import "./MapboxGLButtonControl.scss";

// eslint-disable-next-line no-unused-vars
class MapboxGLButtonControl {
  constructor(props) {
    this.props = props;
    this.state = {
        className: props.className,
        btnId: _uniqueId('MapboxGLButtonControl-')
    }
    
    this.container = null;
    this.btn = null;
    this.span = null;
    this.map = null;
  }

  busy = (bStatus) => {
    this.state.className = `${this.props.className}${bStatus ? "-active" : ""}`;
    const btn = document.getElementById(this.state.btnId);
    if (btn) {
        btn.className = this.state.className;
    }
  }

  onAdd = (map) => {
    this.map = map;
    this.span = document.createElement("span");
    this.span.className = "mapboxgl-ctrl-icon";
    this.span.setAttribute("aria-hidden", true);

    this.btn = document.createElement("button");
    this.btn.id = this.state.btnId;
    this.btn.className = this.state.className;
    this.btn.type = "button";
    this.btn.title = this.props.title;
    this.btn.setAttribute("aria-disabled", this.props.title);
    this.btn.setAttribute("aria-pressed", true);
    this.btn.onclick = this.props.eventHandler;
    this.btn.appendChild(this.span);

    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this.container.appendChild(this.btn);

    return this.container;
  };

  onRemove(map) {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}

export default MapboxGLButtonControl;
