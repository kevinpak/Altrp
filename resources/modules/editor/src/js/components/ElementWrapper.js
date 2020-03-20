import React, {Component} from "react";
import {connect} from "react-redux";
import {editorSetCurrentElement, getEditor} from "../helpers";

class ElementWrapper extends Component {
  constructor(props){
    super(props);
    this.chooseElement = this.chooseElement.bind(this);
    this.deleteElement = this.deleteElement.bind(this);
  }

  render() {
    let classes = `altrp-element altrp-element${this.props.element.getId()} altrp-element_${this.props.element.getType()}`;
    let overlayClasses = `overlay`;
    if (this.props.element.getType() === 'widget' && this.props.currentElement === this.props.element) {
      classes += ' altrp-element_current';
    }
    let editText = `Edit ${this.props.element.getTitle()}`;
    let duplicateText = `Duplicate ${this.props.element.getTitle()}`;
    let deleteText = `Delete ${this.props.element.getTitle()}`;
    return <div className={classes}>
      <div className={overlayClasses}>
        <div className="overlay-settings">
          <button className="overlay-settings__button overlay-settings__button_add " title="Add Section"/>
          <button className="overlay-settings__button overlay-settings__button_edit "
                  onClick={this.chooseElement}
                  title={editText}/>
          <button className="overlay-settings__button overlay-settings__button_duplicate " title={duplicateText}/>
          <button className="overlay-settings__button overlay-settings__button_delete "
                  onClick={this.deleteElement}
                  title={deleteText}/>
        </div>
      </div>
      {
        React.createElement(this.props.component, {
          element: this.props.element,
          children: this.props.element.getChildren(),
        })
      }
    </div>

  }

  chooseElement() {
    this.props.element.setElementAsCurrent();
    getEditor().showSettingsPanel();
  }

  deleteElement() {
    this.props.element.parent.deleteChild(this.props.element);
  }
}

function mapStateToProps(state) {
  return {
    currentElement: state.currentElement.currentElement
  };
}

export default connect(mapStateToProps)(ElementWrapper);