import React, {Component} from "react";
import {connect} from "react-redux";
import {editorSetCurrentElement, getEditor, getFactory} from "../helpers";
import EditIcon from '../../svgs/edit.svg';
import DeleteIcon from '../../svgs/delete.svg';
import DotsIcon from '../../svgs/dots_section.svg';
import ColumnIcon from '../../svgs/columns.svg';
import AddIcon from '../../svgs/add.svg';
import DuplicateIcon from '../../svgs/duplicate.svg';

class ElementWrapper extends Component {
  constructor(props){
    super(props);
    this.chooseElement = this.chooseElement.bind(this);
    this.deleteElement = this.deleteElement.bind(this);
    this.duplicateElement = this.duplicateElement.bind(this);
    this.state = {
      children: this.props.element.getChildren(),
    };
  }

  render() {
    let classes = `altrp-element ${this.props.element.getSelector()} altrp-element_${this.props.element.getType()}`;
    let overlayClasses = `overlay`;
    if (this.props.currentElement === this.props.element) {
      classes += ' altrp-element_current';
    }
    let editText = `Edit ${this.props.element.getTitle()}`;
    let duplicateText = `Duplicate ${this.props.element.getTitle()}`;
    let deleteText = `Delete ${this.props.element.getTitle()}`;
    let _EditIcon = EditIcon;
    switch (this.props.element.getType()){
      case 'section':{
        _EditIcon = DotsIcon;
      }
      break;
      case 'column':{
        _EditIcon = ColumnIcon;
      }
      break;
    }
    let emptyColumn = '';
    if(this.props.element.getType() === 'column' && ! this.state.children.length){
      emptyColumn = <div className="column-empty-plus" onClick={this.showWidgetsPanel}><AddIcon/></div>;
    }
    return <div className={classes} onClick={this.chooseElement}>
      <div className={overlayClasses}>
        <div className="overlay-settings">
          <button className="overlay-settings__button overlay-settings__button_add " title="Add Section">
            <AddIcon className="icon"/>
          </button>
          <button className="overlay-settings__button overlay-settings__button_edit "
                  onClick={this.chooseElement}
                  title={editText}>
            <_EditIcon className="icon"/>
          </button>
          <button className="overlay-settings__button overlay-settings__button_duplicate "
                  onClick={this.duplicateElement}
                  title={duplicateText}>
            <DuplicateIcon className="icon"/>
          </button>
          <button className="overlay-settings__button overlay-settings__button_delete "
                  onClick={this.deleteElement}
                  title={deleteText}>
            <DeleteIcon className="icon"/>
          </button>
        </div>
      </div>
      {
        React.createElement(this.props.component, {
          element: this.props.element,
          children: this.state.children,
          wrapper: this,
        })
      }
      {
        emptyColumn
      }
    </div>
  }

  chooseElement(e) {
    e.stopPropagation();
    this.props.element.setElementAsCurrent();
    getEditor().showSettingsPanel();
  }

  deleteElement(e) {
    e.stopPropagation();
    this.props.element.parent.deleteChild(this.props.element);
  }
  duplicateElement(e){
    e.stopPropagation();
    let factory = getFactory();
    factory.duplicateElement(this.props.element, this.props.element.parent);
  }
  showWidgetsPanel(e){
    e.stopPropagation();
    getEditor().showWidgetsPanel();
  }
}

function mapStateToProps(state) {
  return {
    currentElement: state.currentElement.currentElement
  };
}

export default connect(mapStateToProps)(ElementWrapper);
