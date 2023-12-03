import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  Tree,
} from "@nx/devkit"
import { LibraryGeneratorSchema } from "./schema"
import { posixJoin } from "../../utils/posix"

export async function libraryGenerator(tree: Tree, options: LibraryGeneratorSchema) {
  const { name: projectName } = options
  const projectRoot = posixJoin(getWorkspaceLayout(tree).libsDir, projectName)

  // Create project.json
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: "library",
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  })

  // Copy files
  const substitutions = {
    name: projectName,
    nameCamelCase: projectName.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
  }
  generateFiles(tree, posixJoin(__dirname, "files"), projectRoot, substitutions)

  await formatFiles(tree)
}

export default libraryGenerator
