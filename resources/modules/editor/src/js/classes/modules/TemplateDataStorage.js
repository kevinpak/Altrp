import RootElement from "../elements/RootElement";
import {CONSTANTS, getEditor, getTemplateId} from "../../helpers";
import BaseModule from "./BaseModule";
import store from '../../store/store';
import {setCurrentElement, SET_CURRENT_ELEMENT} from '../../store/current-element/actions'
import BaseElement from "../elements/BaseElement";
import Section from "../elements/Section";
import Column from "../elements/Column";
import {changeTemplateStatus} from "../../store/template-status/actions";

class TemplateDataStorage extends BaseModule{

  constructor(modules){
    super(modules);
    this.elementsIds = [];
  }

  replaceAll(element) {
    if(! element instanceof RootElement ){
      throw 'Expect Root Element as root element;)';
    }
    this.rootElement = element;
    this.elementsIds = element.getIds();
    this.setCurrentRootElement();
  }

  getTemplateData() {
    return this.rootElement.toObject();
  }
  getTemplateDataForSave(){
    let data = {};

    data.data = this.getTemplateData();
    data.title = this.title || 'testtitle';
    data.name = this.name || 'testname';

    return data;
  }

  setCurrentRootElement(){
    this.currentElement = this.rootElement;
    store.dispatch(setCurrentElement(this.currentElement));
    return this.currentElement;
  }

  setCurrentElement(element){
    if(! element instanceof BaseElement){
      throw 'Only Base Element Can Be Set as Default'
    }
    this.currentElement = element;
    store.dispatch(setCurrentElement(element));
  }

  getCurrentElement(){
    if(!this.currentElement){
      return this.setCurrentRootElement();
    }
    return this.currentElement;
  }

  getRootElement(){
    return this.rootElement
  }

  addWidgetInSection(elementName){
    let newSection = new Section();
    this.elementsIds.push(newSection.getId());

    let newColumn = new Column();
    this.elementsIds.push(newColumn.getId());

    let newWidget = new (window.elementsManager.getElementClass(elementName));
    this.elementsIds.push(newWidget.getId());

    newColumn.appendWidget(newWidget);
    newSection.appendColumn(newColumn);
    this.rootElement.appendNewSection(newSection);
    this.setCurrentElement(newWidget);
    store.dispatch(changeTemplateStatus(CONSTANTS.TEMPLATE_NEED_UPDATE));
    getEditor().showSettingsPanel();
  }

}

export default TemplateDataStorage;