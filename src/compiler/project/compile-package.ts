import { compileComponent } from "./compile-component";
import type { CodeSnippet } from "../snippet";
import type { Package, ComponentAttribute } from "./types";

/**
 * @description 编译组件包
 * @param {Package} { id, name,  aliasName,  referenceMap, componentListMap } 组件包
 * @param {((attribute: ComponentAttribute) => string | undefined)} getReference 获取属性类型引用地址
 * @return {*}  {CodeSnippet}
 */
export function compilePackage(
  { id, name,  aliasName,  referenceMap, componentListMap } : Package,
  getReference: (attribute: ComponentAttribute) => string | undefined
): CodeSnippet {

  // 获取组件类型引用地址
  const _getReference: typeof getReference = (attribute) => {
    const { pkg, src } = attribute;
    if(!src) {
      return undefined;
    }
    if(!pkg || pkg === id) {
      return referenceMap.get(src);
    }
    return getReference(attribute);
  };

  // 编译组件包
  const packageSnippets: CodeSnippet = [
    `import ${aliasName} = ${name};`,
    `namespace ${name} {`
  ];
  componentListMap.forEach((list, internalPkg) => {
    const listSnippets = list.map(cmpt => compileComponent(cmpt, _getReference));
    if(internalPkg.length === 0) {
      packageSnippets.push(listSnippets);
      return;
    }

    packageSnippets.push(`namespace ${internalPkg} {`);
    packageSnippets.push(listSnippets);
    packageSnippets.push('}')
  });
  packageSnippets.push('}')
  return packageSnippets;
}