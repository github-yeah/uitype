import { Config, loadConfig } from "../loader";
import { componentIdToName, legally_name_reg, sys_name_reg } from "../utils";
import { tagTypeOf } from "../project";
import type { Component, ComponentAttribute } from "./types";
import { basename } from "path";

/**
 * @description 加载组件
 * - 当组件名称不合法时，会根据id来生成组件发布名
 * @param {string} id 组件id
 * @param {string} configFile 组件配置地址
 * @return {*}  {(Component | string | undefined)}
 */
export function loadComponent(id: string, configFile: string): Component | string | undefined {
  const config = loadConfig(configFile)?.elements?.find(e => e.name === 'component');
  if(!config) {
    console.log('[加载组件配置失败!]');
    return undefined;
  }

  // 解析自定义组件扩展类型
  const tag = config.attributes?.extention ?? config.name;
  const extention = tagTypeOf(tag);

  // 解析属性列表
  const attributes: ComponentAttribute[] = [];
  config.elements?.forEach(cfg => {
    switch(cfg.name) {
      case 'controller':
      case 'transition':
        const attribute = getAttribute(cfg);
        if(attribute !== undefined) {
          attributes.push(attribute);
        }
        break;
      case 'displayList':
        cfg.elements?.forEach(e => {
          const attribute = getAttribute(e);
          if(attribute === undefined) {
            return;
          }
          attributes.push(attribute);
        })
        break;
    }
  });

  // 合法的属性列表为空的组件，导出其内置扩展类型
  if(attributes.length === 0) {
    return extention;
  }

  // 发布名
  let publishName = basename(configFile, ".xml");
  if (legally_name_reg.test(publishName) === false) {
    publishName = componentIdToName(id);
  }
  return { id, publishName, extention, attributes };
}

/**
 * @description 获取属性
 * @param {Config} config
 * @return {*}  {(ComponentAttribute | undefined)}
 */
function getAttribute(config: Config): ComponentAttribute | undefined {
  const attribute = config.attributes as {
    -readonly [P in keyof ComponentAttribute]: ComponentAttribute[P];
  } | undefined;

  if(!attribute) {
    return undefined;
  }

  // 剔除名称不合法的属性
  if(legally_name_reg.test(attribute.name) === false || sys_name_reg.test(attribute.name) === true) {
    return undefined;
  }
  attribute.tag = config.name;
  return attribute;
}