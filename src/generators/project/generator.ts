import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  ProjectConfiguration,
  Tree,
  workspaceRoot,
  writeJsonFile,
} from "@nx/devkit"
import * as path from "path"
import { ProjectGeneratorSchema } from "./schema"
import { installPackage } from "../../utils/package-manager"

export async function projectGenerator(tree: Tree, options: ProjectGeneratorSchema) {
  const { name: projectName } = options
  const projectRoot = path.join(getWorkspaceLayout(tree).appsDir, projectName)

  addProjectConfiguration(tree, projectName, getProjectJsonContent(projectName, projectRoot))
  writeJsonFile(
    path.join(workspaceRoot, projectRoot, "package.json"),
    getPackageJsonContent(projectName)
  )
  await installPackage(projectRoot, "github:heroiclabs/nakama-common", false)
  await installPackage(projectRoot, "typescript", true)
  generateFiles(tree, path.join(__dirname, "files"), projectRoot, options)
  return formatFiles(tree)
}

/**
 * Returns the content of the project.json file.
 */
function getProjectJsonContent(projectName: string, projectRoot: string): ProjectConfiguration {
  return {
    root: projectRoot,
    projectType: "application",
    sourceRoot: `${projectRoot}/src`,
    targets: {
      build: {
        executor: "nx-nakama:build",
        options: {
          outputPath: `dist/apps/${projectName}`,
          configFileName: "config.yml",
        },
      },
      serve: {
        executor: "nx-nakama:serve",
        options: {
          configFileName: "config.yml",
        },
      },
    },
  }
}

/**
 * Returns the content of the package.json file.
 */
function getPackageJsonContent(projectName: string) {
  return {
    name: projectName,
    version: "0.0.1",
    description: "",
    keywords: [],
    author: "",
    license: "ISC",
    devDependencies: {},
    dependencies: {},
  }
}

export default projectGenerator
