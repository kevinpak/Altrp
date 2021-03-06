import {CONTROLLER_TEXT, CONTROLLER_TEXTAREA, TAB_CONTENT, TAB_STYLE} from "../modules/ControllersManager";
import {getTemplateDataStorage, isEditor, getEditor, CONSTANTS, templateNeedUpdate} from "../../helpers";
import {changeTemplateStatus} from "../../store/template-status/actions";
import store from "../../store/store";

class BaseElement {

  constructor(){
    this.settings = {};
    this.controls = {};
    this.controlsIds = [];
    this.controllersRegistered = false;
    this.children = [];
    this.componentClass = window.elementsManager.getComponentClass(this.getName());
    this.initiatedDefaults = null;
    this.parent = null;
    this._initDefaultSettings();
  }

  getId(){
    if(! this.id){
      this.id = BaseElement.generateId();
    }
    return this.id;
  }

  getName(){
    return this.constructor.getName();
  }

  getType(){
    return this.constructor.getType();
  }

  getTitle(){
    return this.constructor.getTitle();
  }

  static generateId(){
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  toObject(){
    // if(!this.component){
    //   throw 'Element Must Composites with Some Component';
    // }
    let data = {};
    data.id = this.getId();
    data.name = this.getName();
    data.settings = this.settings;
    data.type = this.getType();
    let children = this.getChildrenForImport();
    if(children){
      data.children = children;
    }
    return data;
  }

  getChildrenForImport() {
    if(! this.children.length){
      return[];
    }
    let children = [];
    for( let _c of this.children ){
      children.push(_c.toObject())
    }
    return children;
  }

  getChildren(){
    if(! this.children.length){
      return[];
    }
    return this.children;
  }

  /**
   * @param {BaseElement} child
   * */
  appendChild(child){
    this.children.push(child);
    child.setParent(this);
    if(this.component && typeof this.component.setChildren === 'function'){
      this.component.setChildren(this.children);
    }
    this.templateNeedUpdate();
  }

  insertSiblingAfter(newSibling){
    this.parent.insertNewChildAfter(this.getId(), newSibling);
  }

  insertSiblingBefore(newSibling){
    this.parent.insertNewChildBefore(this.getId(), newSibling);
  }
  /**
   * @param {string} childId
   * @param {BaseElement} newChild
   * */
  insertNewChildAfter(childId, newChild){
    let index;
    this.children.map((childItem, idx)=>{
      if(childItem.getId() === childId){
        index = idx;
      }
    });
    if(index === undefined){
      throw 'childId not found when insertNewChildAfter'
    }
    newChild.setParent(this);
    this.children.splice(index+1, 0, newChild);
    this.component.setChildren(this.children);
    this.templateNeedUpdate();
  }
  /**
   * @param {string} childId
   * @param {BaseElement} newChild
   * */
  insertNewChildBefore(childId, newChild){
    let index;
    this.children.map((childItem, idx)=>{
      if(childItem.getId() === childId){
        index = idx;
      }
    });
    if(index === undefined){
      throw 'childId not found when insertNewChildBefore'
    }
    newChild.setParent(this);
    this.children.splice(index, 0, newChild);
    this.component.setChildren(this.children);
    this.templateNeedUpdate();
  }

  /**
   * @param {BaseElement} target
   * */
  insertAfter(target){
    target.insertSiblingAfter(this);
  }
  /**
   * @param {BaseElement} target
   * */
  insertBefore(target){
    target.insertSiblingBefore(this);
  }

  templateNeedUpdate(){
    store.dispatch(changeTemplateStatus(CONSTANTS.TEMPLATE_NEED_UPDATE));
  }
  /**
   * @param {BaseElement[]} newChildren
   * */
  setChildren(newChildren){
    this.children = newChildren;
  }
  /**
   * @param {BaseElement[]} newChildren
   * */
  updateChildren(newChildren){
    if(newChildren){
      this.children = newChildren;
    }
    this.component.setChildren(this.children);
  }

  /**
   * @param {BaseElement | string} child
   * @throws
   * */
  deleteChild(child){
    let childExist = false;
    let childId ;
    if(typeof child === 'string'){
      childId = child;
    } else if(child instanceof BaseElement){
      childId = child.getId();
    } else {
      throw 'Delete Child can only by ia or Instance';
    }
    let newChildren = this.children.filter(item => {
      if(item.getId() === childId){
        childExist = true;
        item.beforeDelete();
        return false;
      }
      return true
    });
    if(!childExist){
      throw 'Element not Found for Delete'
    }
    this.updateChildren(newChildren);
  }

  removeFromParent(){
    this.parent.deleteChild(this);
  }

  beforeDelete() {
    this.children.map(item => {
      item.beforeDelete();
    });
    if(getTemplateDataStorage().getCurrentElement().getId() === this.getId()){
      getTemplateDataStorage().setCurrentRootElement();
      getEditor().showWidgetsPanel();
    }
  }

  getSettings(settingName){
    this._initDefaultSettings();
    if(! settingName){
      return this.settings;
    }
    if(this.settings[settingName] === undefined){
      let control = window.controllersManager.getElementControl(this.getName(), settingName);

      if(! control || !control.default){
        return null;
      }
      this.settings[settingName] = control.default;
    }
    return this.settings[settingName];
  }

  _initDefaultSettings(){
    if(!window.controllersManager || this.initiatedDefaults){
      return;
    }
    let controls = window.controllersManager.getControls(this.getName());

    for (let tabName in controls){
      if(controls.hasOwnProperty(tabName)){
        if(!controls[tabName].length){
          continue;
        }
        for (let section of controls[tabName]) {
          if(!section.controls.length){
            continue;
          }
          for (let control of section.controls){
            if(control.default !== undefined
                && this.settings[control.controlId] === undefined){
              this.settings[control.controlId] = control.default;
            }
          }
        }
      }
    }
    this.updateStyles();
  }

  setSettingValue(settingName, value){
    // console.log(settingName);
    this.settings[settingName] = value;
    this.component.changeSetting(settingName, value);
  }

  _registerControls(){
    this.controllersRegistered = true;
  }
   /**
    * @param {string} sectionId
    * @param {object} args
    * */
  startControlSection(sectionId, args){
     if(this.controlsIds.indexOf(sectionId) !== -1){
       throw 'Control with id' + sectionId + ' Already Exists in ' + this.getName();
     }
     let defaults = {
       tab: TAB_CONTENT,
     };
     this.currentSection = {...defaults, ...args, sectionId};
     this.controlsIds.push(sectionId);
   }

  endControlSection(){
    this.currentSection = null;
  }


  /**
   * @param {string} controlId
   * @param {object} args
   * */
  addControl(controlId, args){
    if(!this.currentSection){
      throw 'Controls Can only be Added Inside the Section!'
    }
    if(this.controlsIds.indexOf(controlId) !== -1){
      throw 'Control with id \'' + controlId + '\' Already Exists in ' + this.getName();
    }

    let section = this._getCurrentSection();

    let defaults = {
      type: CONTROLLER_TEXT,
    };

    section.controls.push({...defaults, ...args, controlId});
    window.controllersManager.setControlsCache(this.getName() + controlId, {...args, controlId});
    this.controlsIds.push(controlId);
  }

  _getCurrentTab(){
    let tabName = this.currentSection.tab || TAB_STYLE;
    let tab = this.controls[tabName];
    if(! tab){
      tab = this.controls[tabName] = [];
    }
    return tab;
  }
  _getCurrentSection(){
    let tab = this._getCurrentTab();
    let sectionId = this.currentSection.sectionId;
    for(let _section of tab){
      if(this.currentSection.sectionId=== _section.sectionId){
         return _section
      }
    }
    let section ;
    section = {
      ...this.currentSection,
      controls: [],
    };
    tab.push(section);

    return section;
  }

  getControls(){
    this._registerControls();
    return this.controls;
  }

  setElementAsCurrent(){
    window.altrpEditor.modules.templateDataStorage.setCurrentElement(this);
  }

  isEditor(){
    return isEditor();
  }
  getIds(){
    let ids = [this.getId()];
    this.children.map(item => {
      ids.push(item.getIds())
    });
    return ids;
  }

  getSelector(){
    return `.altrp-element${this.getId()}`;
  }
  /**
   * @param {string} settingName
   * @param {CSSRule[]} rules
   * @param {string} breakpoint
   * */
  addStyles(settingName, rules, breakpoint = CONSTANTS.DEFAULT_BREAKPOINT){
    this.settings.styles = this.settings.styles || {};
    this.settings.styles[breakpoint] = this.settings.styles[breakpoint] || {};

    this.settings.styles[breakpoint][settingName] = this.settings.styles[breakpoint][settingName] || {};
    rules.forEach(rule => {
      let finalSelector = rule.selector;
      finalSelector = finalSelector.replace('{{ELEMENT}}', this.getSelector());
      this.settings.styles[breakpoint][settingName][finalSelector] = rule.properties;
    });
    this.updateStyles();
  }

  updateStyles(){
    window.stylesModulePromise.then(stylesModule => {
      /**
       * @member {Styles} stylesModule
       * */
      stylesModule.addElementStyles(this.getId(), this.getStringifyStyles());
    });
  }

  getStringifyStyles(){
    let styles = '';
    if(typeof this.settings.styles !== 'object'){
      return styles
    }
    for(let breakpoint in this.settings.styles){
      let rules = {};
      if(this.settings.styles.hasOwnProperty(breakpoint)){
        for(let settingName in this.settings.styles[breakpoint]){
          if(this.settings.styles[breakpoint].hasOwnProperty(settingName)) {
            for(let selector in this.settings.styles[breakpoint][settingName]){
              if(this.settings.styles[breakpoint][settingName].hasOwnProperty(selector)) {
                rules[selector] = rules[selector] || [];
                // console.log(this.settings.styles[breakpoint][settingName][selector]);
                rules[selector] = rules[selector].concat(this.settings.styles[breakpoint][settingName][selector])
              }
            }
          }
        }
      }
      if(breakpoint === CONSTANTS.DEFAULT_BREAKPOINT){
        for(let selector in rules){
          if(rules.hasOwnProperty(selector)){
            styles += `${selector} {` + rules[selector].join('') + '}';
          }
        }
      }
    }
    return styles;
  }
  /**
   * @param {BaseElement} parent
   * */
  setParent(parent){
    if(this.parent instanceof BaseElement){
      this.parent.deleteChild(this);
    }
    this.parent = parent;
  }
}

export default BaseElement