export {
  formatModuleCatalogHuman,
  scanModuleCatalog,
  validModulesOnly,
  type CatalogModuleEntry,
  type CatalogModuleInvalid,
  type CatalogModuleValid,
  type ModuleCatalogResult,
} from './catalog.js'
export {
  MODULE_YAML_API,
  moduleManifestSchema,
  parseModuleManifest,
} from './moduleYaml.js'
export type {ModuleManifest} from './moduleYaml.js'
export {resolveModuleInstallOrder, type DepGraph} from './resolveDependencies.js'
export {
  applyAddModule,
  applyProfileModules,
  applyRemoveModule,
  buildDepGraphFromCatalog,
  getValidModuleMap,
  listActiveDependents,
} from './moduleApply.js'
export {runCatalogQualityGate} from './catalogGate.js'
export {runModulesContributionGate} from './contributionGate.js'
export {scaffoldModule} from './scaffoldModule.js'
